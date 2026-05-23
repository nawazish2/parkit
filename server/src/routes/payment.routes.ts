import { Router } from 'express';
import { createOrder, verifyPayment, createExtensionOrder, verifyExtensionPayment } from '../controllers/payment.controller';
import { verifyToken } from '../middleware/verifyToken';

const router = Router();

router.use(verifyToken);

router.post('/order', createOrder);
router.post('/verify', verifyPayment);
router.post('/extend-order', createExtensionOrder);
router.post('/verify-extend', verifyExtensionPayment);

export default router;
