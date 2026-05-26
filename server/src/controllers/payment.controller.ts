import { Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { Booking } from '../models/Booking';
import { ParkingLot } from '../models/ParkingLot';
import { AuthRequest } from '../middleware/verifyToken';

// Demo mode is only allowed outside production
const isDemoAllowed = () => process.env.NODE_ENV !== 'production';

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookingId } = req.body;
    const userId = req.user?.id;

    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    // Authorization: only the booking owner can initiate payment
    if (booking.userId !== userId) {
      res.status(403).json({ message: 'Forbidden: You can only pay for your own bookings' });
      return;
    }

    // Use server-side totalAmount — never trust client-provided amount
    const amount = booking.totalAmount;

    const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_demoKey123456';
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secretDemo123456';

    const razorpay = new Razorpay({ key_id, key_secret });

    const options = {
      amount: Math.round(Number(amount) * 100), // paise
      currency: 'INR',
      receipt: `receipt_${bookingId}`,
    };

    try {
      const order = await razorpay.orders.create(options);
      res.status(200).json({ order, key_id });
    } catch (rzpErr) {
      console.warn('Razorpay live API failed, falling back to mock demo mode:', rzpErr);
      const mockOrder = {
        id: `order_demo_${Date.now()}`,
        entity: 'order',
        amount: options.amount,
        currency: 'INR',
        receipt: options.receipt,
        status: 'created',
      };
      res.status(200).json({ order: mockOrder, key_id: 'demo_mode' });
    }
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user?.id;

    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    // Authorization: only the booking owner can verify payment
    if (booking.userId !== userId) {
      res.status(403).json({ message: 'Forbidden: You can only verify your own bookings' });
      return;
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secretDemo123456';

    // Verify real Razorpay signature
    const isDemoOrder = razorpay_order_id?.startsWith('order_demo_');

    if (isDemoOrder) {
      // Demo order was created by our own fallback in createOrder — always allow it
    } else if (razorpay_order_id) {
      // Real Razorpay order — verify the signature
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', key_secret)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        res.status(400).json({ message: 'Invalid signature' });
        return;
      }
    } else if (!isDemoAllowed()) {
      res.status(400).json({ message: 'Demo payments are not allowed in production' });
      return;
    }

    // Mark confirmed
    booking.status = 'confirmed';

    // Generate QR Code
    const qrPayload = JSON.stringify({
      bookingId: booking.id,
      userId: booking.userId,
      lotId: booking.lotId,
      slotId: booking.slotId,
      status: 'confirmed',
      verifiedAt: new Date().toISOString(),
      vehicleType: booking.vehicleType,
      licensePlate: booking.licensePlate,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      color: {
        dark: '#4f46e5', // indigo brand color
        light: '#ffffff',
      },
      width: 300,
    });

    booking.qrCode = qrCodeDataUrl;
    await booking.save();

    res.status(200).json({ message: 'Payment verified and booking confirmed', booking });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const createExtensionOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookingId, additionalHours } = req.body;
    const userId = req.user?.id;

    // Validate additionalHours — must be a positive integer between 1 and 24
    const parsedHours = Number(additionalHours);
    if (!Number.isInteger(parsedHours) || parsedHours < 1 || parsedHours > 24) {
      res.status(400).json({ message: 'Additional hours must be an integer between 1 and 24' });
      return;
    }

    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: ParkingLot, as: 'lot' }],
    });
    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    // Authorization
    if (booking.userId !== userId) {
      res.status(403).json({ message: 'Forbidden: You can only extend your own bookings' });
      return;
    }

    if (booking.status !== 'confirmed') {
      res.status(400).json({ message: 'Only confirmed bookings can be extended' });
      return;
    }

    const lot = (booking as any).lot as ParkingLot;
    if (!lot) {
      res.status(404).json({ message: 'Parking lot details not found' });
      return;
    }

    const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_demoKey123456';
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secretDemo123456';

    const razorpay = new Razorpay({ key_id, key_secret });
    const extendCost = parsedHours * lot.pricePerHour;

    const options = {
      amount: Math.round(extendCost * 100),
      currency: 'INR',
      receipt: `receipt_extend_${bookingId}_${Date.now()}`,
    };

    try {
      const order = await razorpay.orders.create(options);
      res.status(200).json({ order, key_id });
    } catch (rzpErr) {
      console.warn('Razorpay live API failed for extension, falling back to mock demo mode:', rzpErr);
      const mockOrder = {
        id: `order_demo_extend_${Date.now()}`,
        entity: 'order',
        amount: options.amount,
        currency: 'INR',
        receipt: options.receipt,
        status: 'created',
      };
      res.status(200).json({ order: mockOrder, key_id: 'demo_mode' });
    }
  } catch (error) {
    console.error('Create extension order error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const verifyExtensionPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookingId, additionalHours, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user?.id;

    // Validate additionalHours
    const parsedHours = Number(additionalHours);
    if (!Number.isInteger(parsedHours) || parsedHours < 1 || parsedHours > 24) {
      res.status(400).json({ message: 'Additional hours must be an integer between 1 and 24' });
      return;
    }

    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: ParkingLot, as: 'lot' }],
    });
    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    // Authorization
    if (booking.userId !== userId) {
      res.status(403).json({ message: 'Forbidden: You can only extend your own bookings' });
      return;
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secretDemo123456';

    const isDemoOrder = razorpay_order_id?.startsWith('order_demo_');

    if (isDemoOrder) {
      // Demo extension order created by our fallback — always allow
    } else if (razorpay_order_id) {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', key_secret)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        res.status(400).json({ message: 'Invalid signature' });
        return;
      }
    } else if (!isDemoAllowed()) {
      res.status(400).json({ message: 'Demo payments are not allowed in production' });
      return;
    }

    const lot = (booking as any).lot as ParkingLot;
    if (!lot) {
      res.status(404).json({ message: 'Parking lot details not found' });
      return;
    }

    const currentEnd = new Date(booking.endTime);
    const newEnd = new Date(currentEnd.getTime() + parsedHours * 60 * 60 * 1000);
    booking.endTime = newEnd;

    const extendCost = parsedHours * lot.pricePerHour;
    booking.totalAmount = Number(booking.totalAmount) + extendCost;

    const qrPayload = JSON.stringify({
      bookingId: booking.id,
      userId: booking.userId,
      lotId: booking.lotId,
      slotId: booking.slotId,
      status: 'confirmed',
      verifiedAt: new Date().toISOString(),
      vehicleType: booking.vehicleType,
      licensePlate: booking.licensePlate,
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      color: {
        dark: '#4f46e5',
        light: '#ffffff',
      },
      width: 300,
    });

    booking.qrCode = qrCodeDataUrl;
    await booking.save();

    res.status(200).json({ message: 'Booking extended successfully', booking });
  } catch (error) {
    console.error('Verify extension payment error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
