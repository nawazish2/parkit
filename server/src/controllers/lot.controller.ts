import { Request, Response } from 'express';
import { ParkingLot } from '../models/ParkingLot';
import { generateSlots } from '../utils/generateSlots';
import { AuthRequest } from '../middleware/verifyToken';

export const createLot = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, address, city, pricePerHour, amenities, photos } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ message: 'Lot name is required' });
      return;
    }
    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      res.status(400).json({ message: 'Address is required' });
      return;
    }
    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      res.status(400).json({ message: 'City is required' });
      return;
    }
    if (!pricePerHour || isNaN(Number(pricePerHour)) || Number(pricePerHour) <= 0) {
      res.status(400).json({ message: 'Price per hour must be a positive number' });
      return;
    }

    // Auto-approve for demo purposes, or set to pending
    const lot = await ParkingLot.create({
      ownerId: req.user?.id,
      name,
      address,
      city,
      pricePerHour: Number(pricePerHour),
      amenities: Array.isArray(amenities) ? JSON.stringify(amenities) : (amenities || '[]'),
      photos: Array.isArray(photos) ? JSON.stringify(photos) : (photos || '[]'),
      status: 'pending',
    });

    // Auto-generate 20 slots for demo
    await generateSlots(lot.id, 20);

    res.status(201).json(lot);
  } catch (error) {
    console.error('Create lot error:', error);
    res.status(500).json({ message: 'Server Error' });
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
    console.error('Get approved lots error:', error);
    res.status(500).json({ message: 'Server Error' });
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
    console.error('Get lot by id error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
