import { Response } from 'express';
import { Booking } from '../models/Booking';
import { Slot } from '../models/Slot';
import { ParkingLot } from '../models/ParkingLot';
import { AuthRequest } from '../middleware/verifyToken';
import { broadcastSlotUpdate } from '../socket';

export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lotId, slotId, startTime, endTime, totalAmount } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Check if slot is available
    const slot = await Slot.findByPk(slotId);
    if (!slot) {
      res.status(404).json({ message: 'Slot not found' });
      return;
    }

    if (!slot.isAvailable) {
      res.status(400).json({ message: 'Slot is currently occupied' });
      return;
    }

    // Mark slot as unavailable immediately to prevent double booking
    slot.isAvailable = false;
    await slot.save();

    // Broadcast instant socket update
    broadcastSlotUpdate(lotId, slotId, false);

    const booking = await Booking.create({
      userId,
      lotId,
      slotId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      totalAmount,
      status: 'pending', // Will be confirmed after payment
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server Error', error });
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
    res.status(500).json({ message: 'Server Error', error });
  }
};

export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const booking = await Booking.findByPk(id as string);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    if (booking.userId !== userId && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    booking.status = 'cancelled';
    await booking.save();

    // Reopen slot
    const slot = await Slot.findByPk(booking.slotId);
    if (slot) {
      slot.isAvailable = true;
      await slot.save();
      broadcastSlotUpdate(booking.lotId, booking.slotId, true);
    }

    res.status(200).json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
};
