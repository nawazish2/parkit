import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { ParkingLot } from '../models/ParkingLot';
import { Slot } from '../models/Slot';
import { Booking } from '../models/Booking';

export const seedDatabase = async () => {
  try {
    const demoUser = await User.findOne({ where: { email: 'driver@demo.com' } });
    if (demoUser) {
      console.log('🌱 Database already seeded.');
      return;
    }

    console.log('🌱 Seeding demo database...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('demo123', salt);

    // 1. Create Users
    const driver = await User.create({
      name: 'Alex Driver',
      email: 'driver@demo.com',
      password: hashedPassword,
      role: 'driver',
    });

    const owner = await User.create({
      name: 'Sarah Owner',
      email: 'owner@demo.com',
      password: hashedPassword,
      role: 'owner',
    });

    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@demo.com',
      password: hashedPassword,
      role: 'admin',
    });

    // 2. Create Parking Lots
    const lot1 = await ParkingLot.create({
      ownerId: owner.id,
      name: 'Metropolis Central Hub',
      address: '784 Cyber Avenue, Sector 4',
      city: 'Delhi',
      pricePerHour: 60,
      status: 'approved',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800']),
      amenities: JSON.stringify(['CCTV Monitoring', 'EV Fast Charging', 'Valet Assist', 'Covered Roof']),
    });

    const lot2 = await ParkingLot.create({
      ownerId: owner.id,
      name: 'CyberCity Express Parking',
      address: '102 Tech Boulevard',
      city: 'Delhi',
      pricePerHour: 40,
      status: 'approved',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800']),
      amenities: JSON.stringify(['24/7 Patrol', 'Handicap Spots', 'Touchless Entry']),
    });

    const lot3 = await ParkingLot.create({
      ownerId: owner.id,
      name: 'Mumbai Marine Plaza Parking',
      address: '45 Marine Drive, Nariman Point',
      city: 'Mumbai',
      pricePerHour: 100,
      status: 'approved',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800']),
      amenities: JSON.stringify(['Sea View Deck', 'VIP Reserved', 'Premium Valet']),
    });

    // 3. Create Slots for each lot using bulkCreate for performance
    const prefixes = ['A', 'B', 'C', 'D'];
    const generateSlotData = (lotId: number) =>
      prefixes.flatMap(prefix =>
        Array.from({ length: 5 }, (_, i) => ({
          lotId,
          slotNumber: `${prefix}${i + 1}`,
          isAvailable: true,
        }))
      );

    await Slot.bulkCreate([
      ...generateSlotData(lot1.id),
      ...generateSlotData(lot2.id),
      ...generateSlotData(lot3.id),
    ]);

    // 4. Create some confirmed bookings in the last 7 days for the chart
    console.log('🌱 Seeding confirmed bookings...');
    const slots = await Slot.findAll({ where: { lotId: lot1.id } });
    const now = new Date();

    const generateBookingDate = (daysAgo: number, hour: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      d.setHours(hour, 0, 0, 0);
      return d;
    };

    const bookingDetails = [
      { daysAgo: 0, hours: 2, amount: 120, slotIndex: 0 },
      { daysAgo: 0, hours: 3, amount: 180, slotIndex: 1 },
      { daysAgo: 1, hours: 4, amount: 240, slotIndex: 2 },
      { daysAgo: 1, hours: 1, amount: 60, slotIndex: 3 },
      { daysAgo: 2, hours: 5, amount: 300, slotIndex: 4 },
      { daysAgo: 3, hours: 2, amount: 120, slotIndex: 5 },
      { daysAgo: 3, hours: 2, amount: 120, slotIndex: 6 },
      { daysAgo: 4, hours: 3, amount: 180, slotIndex: 7 },
      { daysAgo: 5, hours: 1, amount: 60, slotIndex: 8 },
      { daysAgo: 5, hours: 4, amount: 240, slotIndex: 9 },
      { daysAgo: 6, hours: 2, amount: 120, slotIndex: 10 }
    ];

    for (const detail of bookingDetails) {
      const start = generateBookingDate(detail.daysAgo, 10);
      const end = generateBookingDate(detail.daysAgo, 10 + detail.hours);
      const slot = slots[detail.slotIndex] || slots[0];
      
      const b = await Booking.create({
        userId: driver.id,
        lotId: lot1.id,
        slotId: slot.id,
        startTime: start,
        endTime: end,
        totalAmount: detail.amount,
        status: 'confirmed',
        qrCode: `demo-qr-code-${detail.daysAgo}-${detail.slotIndex}`,
        vehicleType: 'Sedan',
        licensePlate: `DL3CAF${1000 + detail.slotIndex}`
      });

      const historicalDate = generateBookingDate(detail.daysAgo, 12);
      await Booking.update({ createdAt: historicalDate }, { where: { id: b.id } });
    }

    console.log('✅ Database seeded successfully with demo users, properties, and bookings!');
  } catch (error) {
    console.error('❌ Database seed error:', error);
  }
};
