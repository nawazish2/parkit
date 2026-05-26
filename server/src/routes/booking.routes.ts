import { Router } from 'express';
import { createBooking, getUserBookings, cancelBooking, completeBooking } from '../controllers/booking.controller';
import { verifyToken } from '../middleware/verifyToken';

const router = Router();

// All booking routes require authentication
router.use(verifyToken);

router.post('/', createBooking);
router.get('/', getUserBookings);
router.put('/:id/cancel', cancelBooking);
router.put('/:id/complete', completeBooking);

export default router;
