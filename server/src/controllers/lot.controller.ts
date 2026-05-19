import { Request, Response } from 'express';
import { ParkingLot } from '../models/ParkingLot';
import { generateSlots } from '../utils/generateSlots';
import { AuthRequest } from '../middleware/verifyToken';

export const createLot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, address, city, pricePerHour, amenities, photos } = req.body;
    
    // Auto-approve for demo purposes, or set to pending
    const lot = await ParkingLot.create({
      ownerId: req.user?.id,
      name,
      address,
      city,
      pricePerHour,
      amenities: JSON.stringify(amenities || []),
      photos: JSON.stringify(photos || []),
      status: 'approved', 
    });

    // Auto-generate 20 slots for demo
    await generateSlots(lot.id, 20);

    res.status(201).json(lot);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

export const getApprovedLots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { city } = req.query;
    const whereClause: any = { status: 'approved' };
    
    if (city) {
      whereClause.city = city;
    }

    const lots = await ParkingLot.findAll({ where: whereClause });
    res.status(200).json(lots);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

export const getLotById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const lot = await ParkingLot.findByPk(id as string);
    
    if (!lot) {
      res.status(404).json({ message: 'Lot not found' });
      return;
    }

    res.status(200).json(lot);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};
