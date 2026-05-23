import { Response } from 'express';
import { Op } from 'sequelize';
import { ParkingLot } from '../models/ParkingLot';
import { Booking } from '../models/Booking';
import { Slot } from '../models/Slot';
import { AuthRequest } from '../middleware/verifyToken';

export const getOwnerStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Get owner's lots
    const lots = await ParkingLot.findAll({ where: { ownerId } });
    const lotIds = lots.map(lot => lot.id);

    if (lotIds.length === 0) {
      res.status(200).json({
        revenue: 0,
        totalBookings: 0,
        occupancyRate: 0,
        chartData: [],
        recentBookings: [],
        lots: [],
      });
      return;
    }

    // Get all bookings for owner's lots
    const bookings = await Booking.findAll({
      where: {
        lotId: { [Op.in]: lotIds },
      },
      include: [
        { model: ParkingLot, as: 'lot' },
        { model: Slot, as: 'slot' },
      ],
      order: [['createdAt', 'DESC']],
    });

    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const revenue = confirmedBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);

    // Get slots occupancy
    const totalSlots = await Slot.count({ where: { lotId: { [Op.in]: lotIds } } });
    const occupiedSlots = await Slot.count({ where: { lotId: { [Op.in]: lotIds }, isAvailable: false } });
    const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

    // Build chart data (last 7 days revenue)
    const chartMap: { [key: string]: number } = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      chartMap[dateStr] = 0;
    }

    confirmedBookings.forEach(b => {
      const dateStr = (b as any).createdAt.toISOString().split('T')[0];
      if (chartMap[dateStr] !== undefined) {
        chartMap[dateStr] += Number(b.totalAmount);
      }
    });

    const chartData = Object.keys(chartMap).map(date => ({
      date,
      revenue: chartMap[date],
    }));

    res.status(200).json({
      revenue,
      totalBookings: bookings.length,
      occupancyRate,
      chartData,
      recentBookings: bookings,
      lots,
    });
  } catch (error) {
    console.error('Get owner stats error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
