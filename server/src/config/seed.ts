import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { ParkingLot } from '../models/ParkingLot';
import { Slot } from '../models/Slot';
import { Booking } from '../models/Booking';

export const seedDatabase = async () => {
  try {
    const demoUser = await User.findOne({ where: { email: 'driver@demo.com' } });
    if (demoUser) {
      console.log('🌱 Demo users exist. Checking for new parking lots...');
      
      // Get the owner user
      const owner = await User.findOne({ where: { email: 'owner@demo.com' } });
      if (!owner) {
        console.log('⚠️ Owner user not found. Skipping new lot creation.');
        return;
      }

      // Check if new lots need to be added
      const existingLots = await ParkingLot.findAll({ where: { ownerId: owner.id } });
      const existingLotNames = existingLots.map(lot => lot.name);

      const newLots = [
        { name: 'Bangalore Tech Park Parking', address: 'Electronic City Phase 1, Hosur Road', city: 'Bangalore', pricePerHour: 50, amenities: ['EV Charging', 'Covered Parking', 'CCTV', '24/7 Security'] },
        { name: 'Hyderabad HITEC City Parking', address: 'Cyber Towers, HITEC City, Madhapur', city: 'Hyderabad', pricePerHour: 45, amenities: ['Multi-level', 'Valet Service', 'EV Charging', 'CCTV'] },
        { name: 'Chennai T Nagar Central', address: 'Usman Road, T Nagar', city: 'Chennai', pricePerHour: 55, amenities: ['Shopping District', 'Covered', 'Security Patrol', 'Handicap Access'] },
        { name: 'Pune Koregaon Park Parking', address: 'Lane 5, Koregaon Park', city: 'Pune', pricePerHour: 40, amenities: ['Premium Area', 'Valet', 'CCTV', 'EV Charging'] },
        { name: 'Kolkata Park Street Parking', address: 'Park Street, Near Metro Station', city: 'Kolkata', pricePerHour: 35, amenities: ['Central Location', '24/7 Security', 'Covered', 'CCTV'] },
        { name: 'Ahmedabad SG Highway Parking', address: 'SG Highway, Near Bodakdev', city: 'Ahmedabad', pricePerHour: 30, amenities: ['Spacious', 'CCTV', 'Security', 'EV Charging'] },
        { name: 'Jaipur MI Road Parking', address: 'MI Road, Near Railway Station', city: 'Jaipur', pricePerHour: 25, amenities: ['Tourist Area', '24/7 Access', 'Security', 'Covered'] },
        { name: 'Mumbai Bandra Kurla Complex', address: 'BKC, Bandra East', city: 'Mumbai', pricePerHour: 120, amenities: ['Business District', 'Premium Valet', 'EV Fast Charging', 'VIP Access'] },
        { name: 'Bangalore Whitefield ITPL', address: 'ITPL Main Road, Whitefield', city: 'Bangalore', pricePerHour: 55, amenities: ['Tech Park', 'Multi-level', 'CCTV', 'Cafeteria Access'] },
        { name: 'Delhi Connaught Place', address: 'Inner Circle, Connaught Place', city: 'Delhi', pricePerHour: 80, amenities: ['Prime Location', 'Underground', 'Premium Security', 'Valet'] },
        { name: 'Chandigarh Sector 17 Parking', address: 'Sector 17 Plaza', city: 'Chandigarh', pricePerHour: 35, amenities: ['Planned City', 'Organized Layout', 'CCTV', '24/7 Access'] },
        { name: 'Kochi MG Road Parking', address: 'MG Road, Near Metro Station', city: 'Kochi', pricePerHour: 30, amenities: ['Waterfront', 'Covered', 'Security', 'EV Charging'] },
        { name: 'Lucknow Hazratganj Parking', address: 'Hazratganj, Near Vidhan Sabha', city: 'Lucknow', pricePerHour: 25, amenities: ['Central', 'Covered', 'CCTV', '24/7 Security'] },
        { name: 'Surat Ring Road Parking', address: 'Ring Road, Near Sahara Darwaja', city: 'Surat', pricePerHour: 28, amenities: ['Textile Hub', 'EV Charging', 'Security', 'Covered'] },
        { name: 'Nagpur Sitabuldi Parking', address: 'Sitabuldi, Near Metro Station', city: 'Nagpur', pricePerHour: 22, amenities: ['Central India', 'Metro Access', 'CCTV', '24/7 Access'] },
        { name: 'Indore Vijay Nagar Parking', address: 'Vijay Nagar, Near C21 Mall', city: 'Indore', pricePerHour: 25, amenities: ['Shopping Area', 'Covered', 'Security Patrol', 'EV Charging'] },
        { name: 'Coimbatore RS Puram Parking', address: 'RS Puram, Near Town Hall', city: 'Coimbatore', pricePerHour: 28, amenities: ['Industrial City', 'Covered', 'CCTV', 'Valet'] },
        { name: 'Visakhapatnam Beach Road Parking', address: 'Beach Road, Near RK Beach', city: 'Visakhapatnam', pricePerHour: 30, amenities: ['Seaside', 'Tourist Area', 'Security', 'Covered'] },
        { name: 'Bhopal New Market Parking', address: 'New Market, Near MP Nagar', city: 'Bhopal', pricePerHour: 22, amenities: ['Lake City', 'Central Location', 'CCTV', '24/7 Access'] },
        { name: 'Vadodara Alkapuri Parking', address: 'Alkapuri, Near Railway Station', city: 'Vadodara', pricePerHour: 26, amenities: ['Cultural Hub', 'Covered', 'Security', 'EV Charging'] },
      ];

      let addedCount = 0;
      for (const lotData of newLots) {
        if (!existingLotNames.includes(lotData.name)) {
          const newLot = await ParkingLot.create({
            ownerId: owner.id,
            name: lotData.name,
            address: lotData.address,
            city: lotData.city,
            pricePerHour: lotData.pricePerHour,
            status: 'approved',
            photos: JSON.stringify(['https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800']),
            amenities: JSON.stringify(lotData.amenities),
          });

          // Create slots for the new lot
          const prefixes = ['A', 'B', 'C', 'D'];
          const slots = prefixes.flatMap(prefix =>
            Array.from({ length: 5 }, (_, i) => ({
              lotId: newLot.id,
              slotNumber: `${prefix}${i + 1}`,
              isAvailable: true,
            }))
          );
          await Slot.bulkCreate(slots);
          addedCount++;
        }
      }

      if (addedCount > 0) {
        console.log(`✅ Added ${addedCount} new parking lots with slots.`);
      } else {
        console.log('🌱 All parking lots already exist.');
      }
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

    const lot4 = await ParkingLot.create({
      ownerId: owner.id,
      name: 'Bangalore Tech Park Parking',
      address: 'Electronic City Phase 1, Hosur Road',
      city: 'Bangalore',
      pricePerHour: 50,
      status: 'approved',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800']),
      amenities: JSON.stringify(['EV Charging', 'Covered Parking', 'CCTV', '24/7 Security']),
    });

    const lot5 = await ParkingLot.create({
      ownerId: owner.id,
      name: 'Hyderabad HITEC City Parking',
      address: 'Cyber Towers, HITEC City, Madhapur',
      city: 'Hyderabad',
      pricePerHour: 45,
      status: 'approved',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800']),
      amenities: JSON.stringify(['Multi-level', 'Valet Service', 'EV Charging', 'CCTV']),
    });

    const lot6 = await ParkingLot.create({
      ownerId: owner.id,
      name: 'Chennai T Nagar Central',
      address: 'Usman Road, T Nagar',
      city: 'Chennai',
      pricePerHour: 55,
      status: 'approved',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800']),
      amenities: JSON.stringify(['Shopping District', 'Covered', 'Security Patrol', 'Handicap Access']),
    });

    const lot7 = await ParkingLot.create({
      ownerId: owner.id,
      name: 'Pune Koregaon Park Parking',
      address: 'Lane 5, Koregaon Park',
      city: 'Pune',
      pricePerHour: 40,
      status: 'approved',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800']),
      amenities: JSON.stringify(['Premium Area', 'Valet', 'CCTV', 'EV Charging']),
    });

    const lot8 = await ParkingLot.create({
      ownerId: owner.id,
      name: 'Kolkata Park Street Parking',
      address: 'Park Street, Near Metro Station',
      city: 'Kolkata',
      pricePerHour: 35,
      status: 'approved',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800']),
      amenities: JSON.stringify(['Central Location', '24/7 Security', 'Covered', 'CCTV']),
    });

    const lot9 = await ParkingLot.create({
      ownerId: owner.id,
      name: 'Ahmedabad SG Highway Parking',
      address: 'SG Highway, Near Bodakdev',
      city: 'Ahmedabad',
      pricePerHour: 30,
      status: 'approved',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800']),
      amenities: JSON.stringify(['Spacious', 'CCTV', 'Security', 'EV Charging']),
    });

    const lot10 = await ParkingLot.create({
      ownerId: owner.id,
      name: 'Jaipur MI Road Parking',
      address: 'MI Road, Near Railway Station',
      city: 'Jaipur',
      pricePerHour: 25,
      status: 'approved',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800']),
      amenities: JSON.stringify(['Tourist Area', '24/7 Access', 'Security', 'Covered']),
    });

    const lot11 = await ParkingLot.create({
      ownerId: owner.id,
      name: 'Mumbai Bandra Kurla Complex',
      address: 'BKC, Bandra East',
      city: 'Mumbai',
      pricePerHour: 120,
      status: 'approved',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800']),
      amenities: JSON.stringify(['Business District', 'Premium Valet', 'EV Fast Charging', 'VIP Access']),
    });

    const lot12 = await ParkingLot.create({
      ownerId: owner.id,
      name: 'Bangalore Whitefield ITPL',
      address: 'ITPL Main Road, Whitefield',
      city: 'Bangalore',
      pricePerHour: 55,
      status: 'approved',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800']),
      amenities: JSON.stringify(['Tech Park', 'Multi-level', 'CCTV', 'Cafeteria Access']),
    });

    const lot13 = await ParkingLot.create({
      ownerId: owner.id,
      name: 'Delhi Connaught Place',
      address: 'Inner Circle, Connaught Place',
      city: 'Delhi',
      pricePerHour: 80,
      status: 'approved',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800']),
      amenities: JSON.stringify(['Prime Location', 'Underground', 'Premium Security', 'Valet']),
    });

    const lot14 = await ParkingLot.create({
      ownerId: owner.id,
      name: 'Chandigarh Sector 17 Parking',
      address: 'Sector 17 Plaza',
      city: 'Chandigarh',
      pricePerHour: 35,
      status: 'approved',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800']),
      amenities: JSON.stringify(['Planned City', 'Organized Layout', 'CCTV', '24/7 Access']),
    });

    const lot15 = await ParkingLot.create({
      ownerId: owner.id,
      name: 'Kochi MG Road Parking',
      address: 'MG Road, Near Metro Station',
      city: 'Kochi',
      pricePerHour: 30,
      status: 'approved',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800']),
      amenities: JSON.stringify(['Waterfront', 'Covered', 'Security', 'EV Charging']),
    });

    // Add pending lots for Admin demo (shows approval flow)
    await ParkingLot.create({
      ownerId: owner.id,
      name: 'Goa Beachfront Parking',
      address: 'Calangute Beach Road, North Goa',
      city: 'Goa',
      pricePerHour: 45,
      status: 'pending',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800']),
      amenities: JSON.stringify(['Beach Access', 'Valet', 'CCTV', 'EV Charging']),
    });

    await ParkingLot.create({
      ownerId: owner.id,
      name: 'Rishikesh Riverside Parking',
      address: 'Lakshman Jhula Road, Rishikesh',
      city: 'Rishikesh',
      pricePerHour: 25,
      status: 'pending',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800']),
      amenities: JSON.stringify(['Riverside', 'Open Air', 'Security', 'Yoga Area']),
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

    const allSlots = await Slot.bulkCreate([
      ...generateSlotData(lot1.id),
      ...generateSlotData(lot2.id),
      ...generateSlotData(lot3.id),
      ...generateSlotData(lot4.id),
      ...generateSlotData(lot5.id),
      ...generateSlotData(lot6.id),
      ...generateSlotData(lot7.id),
      ...generateSlotData(lot8.id),
      ...generateSlotData(lot9.id),
      ...generateSlotData(lot10.id),
      ...generateSlotData(lot11.id),
      ...generateSlotData(lot12.id),
      ...generateSlotData(lot13.id),
      ...generateSlotData(lot14.id),
      ...generateSlotData(lot15.id),
    ]);

    // Make demo more realistic: occupy some slots in popular lots
    const popularLotSlots = allSlots.filter(s => 
      [lot1.id, lot2.id, lot3.id, lot11.id].includes(s.lotId)
    );
    
    // Mark ~30% of slots in popular lots as occupied
    const slotsToOccupy = popularLotSlots.slice(0, Math.floor(popularLotSlots.length * 0.3));
    for (const slot of slotsToOccupy) {
      await Slot.update({ isAvailable: false }, { where: { id: slot.id } });
    }

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

    // Add a few active/upcoming bookings for driver demo (so My Bookings looks good during live demo)
    console.log('🌱 Adding active demo bookings for driver...');
    
    const futureSlots = await Slot.findAll({ 
      where: { lotId: lot1.id, isAvailable: true },
      limit: 3 
    });

    if (futureSlots.length > 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(14, 0, 0, 0);

      await Booking.create({
        userId: driver.id,
        lotId: lot1.id,
        slotId: futureSlots[0].id,
        startTime: tomorrow,
        endTime: tomorrowEnd,
        totalAmount: 240,
        status: 'confirmed',
        qrCode: `demo-active-qr-1`,
        vehicleType: 'Sedan',
        licensePlate: 'DL3CAF9999',
      });

      // Mark the slot as occupied
      await Slot.update({ isAvailable: false }, { where: { id: futureSlots[0].id } });
    }

    console.log('✅ Database seeded successfully with demo users, properties, and bookings!');
  } catch (error) {
    console.error('❌ Database seed error:', error);
  }
};
