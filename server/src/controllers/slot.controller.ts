import { Request, Response } from 'express';
import { Slot } from '../models/Slot';

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
