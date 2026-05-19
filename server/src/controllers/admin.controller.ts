import { Response } from 'express';
import { User } from '../models/User';
import { ParkingLot } from '../models/ParkingLot';
import { Booking } from '../models/Booking';
import { AuthRequest } from '../middleware/verifyToken';

export const getAdminStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.count();
    const totalLots = await ParkingLot.count();
    const confirmedBookings = await Booking.findAll({ where: { status: 'confirmed' } });
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    const pendingLots = await ParkingLot.findAll({
      where: { status: 'pending' },
      include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }],
    });

    const recentUsers = await User.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    res.status(200).json({
      totalUsers,
      totalLots,
      totalRevenue,
      pendingLots,
      recentUsers,
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Server Error', error });
  }
};

export const getAllLots = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lots = await ParkingLot.findAll({
      include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json(lots);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

export const updateLotStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const lot = await ParkingLot.findByPk(id as string);
    if (!lot) {
      res.status(404).json({ message: 'Lot not found' });
      return;
    }

    lot.status = status;
    await lot.save();

    res.status(200).json({ message: `Lot status updated to ${status}`, lot });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
};
