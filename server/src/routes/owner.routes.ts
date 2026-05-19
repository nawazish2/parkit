import { Router } from 'express';
import { getOwnerStats } from '../controllers/owner.controller';
import { verifyToken } from '../middleware/verifyToken';
import { requireRole } from '../middleware/requireRole';

const router = Router();

router.use(verifyToken, requireRole(['owner', 'admin']));

router.get('/stats', getOwnerStats);

export default router;
