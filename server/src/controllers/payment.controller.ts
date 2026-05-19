import { Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { Booking } from '../models/Booking';
import { AuthRequest } from '../middleware/verifyToken';

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookingId, amount } = req.body;

    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_demoKey123456';
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secretDemo123456';

    const razorpay = new Razorpay({ key_id, key_secret });

    const options = {
      amount: Math.round(amount * 100), // amount in smallest currency unit (paise)
      currency: 'INR',
      receipt: `receipt_${bookingId}`,
    };

    try {
      const order = await razorpay.orders.create(options);
      res.status(200).json({ order, key_id });
    } catch (rzpErr) {
      console.warn('Razorpay live API failed, falling back to mock demo mode:', rzpErr);
      // Demo fallback mode if real test keys are invalid
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
    res.status(500).json({ message: 'Server Error', error });
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secretDemo123456';

    // Verify signature if not in demo mode
    if (razorpay_order_id && !razorpay_order_id.startsWith('order_demo_')) {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', key_secret)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        res.status(400).json({ message: 'Invalid signature' });
        return;
      }
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
    res.status(500).json({ message: 'Server Error', error });
  }
};
