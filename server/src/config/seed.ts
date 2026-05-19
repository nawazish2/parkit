import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { ParkingLot } from '../models/ParkingLot';
import { Slot } from '../models/Slot';

export const seedDatabase = async () => {
  try {
    const count = await User.count();
    if (count > 0) {
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

    // 3. Create Slots for Lot 1
    const prefixes = ['A', 'B', 'C', 'D'];
    for (const prefix of prefixes) {
      for (let i = 1; i <= 5; i++) {
        await Slot.create({
          lotId: lot1.id,
          slotNumber: `${prefix}${i}`,
          isAvailable: Math.random() > 0.2, // 80% available
        });
      }
    }

    // Slots for Lot 2
    for (const prefix of prefixes) {
      for (let i = 1; i <= 5; i++) {
        await Slot.create({
          lotId: lot2.id,
          slotNumber: `${prefix}${i}`,
          isAvailable: Math.random() > 0.3,
        });
      }
    }

    // Slots for Lot 3
    for (const prefix of prefixes) {
      for (let i = 1; i <= 5; i++) {
        await Slot.create({
          lotId: lot3.id,
          slotNumber: `${prefix}${i}`,
          isAvailable: Math.random() > 0.2,
        });
      }
    }

    console.log('✅ Database seeded successfully with demo users and properties!');
  } catch (error) {
    console.error('❌ Database seed error:', error);
  }
};
