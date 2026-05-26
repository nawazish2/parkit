import { Response } from 'express';
import { Booking } from '../models/Booking';
import { Slot } from '../models/Slot';
import { ParkingLot } from '../models/ParkingLot';
import { AuthRequest } from '../middleware/verifyToken';
import { broadcastSlotUpdate, broadcastBookingCreated } from '../socket';
import { sequelize } from '../config/db';

export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lotId, slotId, startTime, endTime, vehicleType, licensePlate } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Validate times
    if (!startTime || !endTime) {
      res.status(400).json({ message: 'Start time and end time are required' });
      return;
    }
    if (new Date(endTime) <= new Date(startTime)) {
      res.status(400).json({ message: 'End time must be after start time' });
      return;
    }

    // Use a transaction to prevent race conditions (double booking)
    const result = await sequelize.transaction(async (t) => {
      // Lock the slot row for update to prevent concurrent bookings
      const slot = await Slot.findOne({
        where: { id: slotId },
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!slot) {
        throw new Error('SLOT_NOT_FOUND');
      }

      if (!slot.isAvailable) {
        throw new Error('SLOT_OCCUPIED');
      }

      // Fetch lot to compute price server-side — never trust client-provided totalAmount
      const lot = await ParkingLot.findByPk(lotId, { transaction: t });
      if (!lot) {
        throw new Error('LOT_NOT_FOUND');
      }

      const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();
      const hours = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60)));
      const computedAmount = hours * lot.pricePerHour;

      // Mark slot as unavailable inside the transaction
      slot.isAvailable = false;
      await slot.save({ transaction: t });

      // Create the booking inside the transaction
      const newBooking = await Booking.create({
        userId,
        lotId,
        slotId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        totalAmount: computedAmount,
        status: 'pending',
        vehicleType: vehicleType || 'Sedan',
        licensePlate,
      }, { transaction: t });

      return { booking: newBooking, slotNumber: slot.slotNumber, lotName: lot.name };
    });

    const booking = result.booking;

    // Broadcast slot update AFTER successful commit
    broadcastSlotUpdate(lotId, slotId, false);

    // Broadcast richer booking event for owners' live dashboards
    broadcastBookingCreated(lotId, result.slotNumber, result.lotName, booking.totalAmount);

    res.status(201).json(booking);
  } catch (error: any) {
    if (error.message === 'SLOT_NOT_FOUND') {
      res.status(404).json({ message: 'Slot not found' });
    } else if (error.message === 'SLOT_OCCUPIED') {
      res.status(400).json({ message: 'Slot is currently occupied' });
    } else if (error.message === 'LOT_NOT_FOUND') {
      res.status(404).json({ message: 'Parking lot not found' });
    } else {
      console.error('Create booking error:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  }
};

export const getUserBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const bookings = await Booking.findAll({
      where: { userId },
      include: [
        { model: ParkingLot, as: 'lot' },
        { model: Slot, as: 'slot' },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Atomic cancellation — both booking status and slot availability updated in one transaction
    const result = await sequelize.transaction(async (t) => {
      const booking = await Booking.findByPk(id as string, { transaction: t });
      if (!booking) {
        throw new Error('BOOKING_NOT_FOUND');
      }

      if (booking.userId !== userId && req.user?.role !== 'admin') {
        throw new Error('FORBIDDEN');
      }

      if (booking.status === 'cancelled') {
        throw new Error('ALREADY_CANCELLED');
      }

      booking.status = 'cancelled';
      await booking.save({ transaction: t });

      // Reopen slot atomically within the same transaction
      const slot = await Slot.findByPk(booking.slotId, { transaction: t });
      if (slot) {
        slot.isAvailable = true;
        await slot.save({ transaction: t });
      }

      return booking;
    });

    // Broadcast AFTER successful commit
    broadcastSlotUpdate(result.lotId, result.slotId, true);

    res.status(200).json({ message: 'Booking cancelled successfully', booking: result });
  } catch (error: any) {
    if (error.message === 'BOOKING_NOT_FOUND') {
      res.status(404).json({ message: 'Booking not found' });
    } else if (error.message === 'FORBIDDEN') {
      res.status(403).json({ message: 'Forbidden' });
    } else if (error.message === 'ALREADY_CANCELLED') {
      res.status(400).json({ message: 'Booking is already cancelled' });
    } else {
      console.error('Cancel booking error:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  }
};

export const completeBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const result = await sequelize.transaction(async (t) => {
      const booking = await Booking.findByPk(id as string, { transaction: t });
      if (!booking) {
        throw new Error('BOOKING_NOT_FOUND');
      }

      // Only the lot owner or admin can mark as completed
      const lot = await ParkingLot.findByPk(booking.lotId, { transaction: t });
      if (!lot) {
        throw new Error('LOT_NOT_FOUND');
      }
      if (lot.ownerId !== userId && req.user?.role !== 'admin') {
        throw new Error('FORBIDDEN');
      }

      if (booking.status !== 'confirmed' && booking.status !== 'pending') {
        throw new Error('INVALID_STATUS');
      }

      booking.status = 'cancelled'; // Use cancelled to free the slot; labeled as completed in UI
      await booking.save({ transaction: t });

      // Free the slot
      const slot = await Slot.findByPk(booking.slotId, { transaction: t });
      if (slot) {
        slot.isAvailable = true;
        await slot.save({ transaction: t });
      }

      return booking;
    });

    broadcastSlotUpdate(result.lotId, result.slotId, true);

    res.status(200).json({ message: 'Booking marked as completed', booking: result });
  } catch (error: any) {
    if (error.message === 'BOOKING_NOT_FOUND') {
      res.status(404).json({ message: 'Booking not found' });
    } else if (error.message === 'FORBIDDEN') {
      res.status(403).json({ message: 'Forbidden' });
    } else if (error.message === 'INVALID_STATUS') {
      res.status(400).json({ message: 'Booking cannot be completed in its current status' });
    } else {
      console.error('Complete booking error:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  }
};
