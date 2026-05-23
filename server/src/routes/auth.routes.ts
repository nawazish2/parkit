import { Router } from 'express';
import { register, login, getProfile, updateVehicles } from '../controllers/auth.controller';
import { verifyToken } from '../middleware/verifyToken';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', verifyToken, getProfile);
router.put('/profile/vehicles', verifyToken, updateVehicles);

export default router;
