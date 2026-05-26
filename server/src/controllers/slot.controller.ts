import { Request, Response } from 'express';
import { Slot } from '../models/Slot';
import { ParkingLot } from '../models/ParkingLot';
import { AuthRequest } from '../middleware/verifyToken';
import { broadcastSlotUpdate } from '../socket';

export const getSlotsByLotId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lotId } = req.params;
    const slots = await Slot.findAll({
      where: { lotId },
      order: [['slotNumber', 'ASC']],
    });
    res.status(200).json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

export const updateSlotAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    const slot = await Slot.findByPk(Number(id), {
      include: [{ model: ParkingLot, as: 'lot' }],
    });

    if (!slot) {
      res.status(404).json({ message: 'Slot not found' });
      return;
    }

    const lot = (slot as any).lot as ParkingLot;
    const user = req.user;

    // Only owner of the lot or admin can change availability
    if (user?.role !== 'admin' && lot.ownerId !== user?.id) {
      res.status(403).json({ message: 'Not authorized to modify this slot' });
      return;
    }

    await slot.update({ isAvailable });

    // Broadcast real-time update so drivers see it instantly
    broadcastSlotUpdate(lot.id, slot.id, isAvailable);

    res.status(200).json(slot);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};
