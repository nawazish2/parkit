import { Router } from 'express';
import { createLot, getApprovedLots, getLotById } from '../controllers/lot.controller';
import { verifyToken } from '../middleware/verifyToken';
import { requireRole } from '../middleware/requireRole';

const router = Router();

// Public routes
router.get('/', getApprovedLots);
router.get('/:id', getLotById);

// Protected routes (Owner only)
router.post('/', verifyToken, requireRole(['owner', 'admin']), createLot);

export default router;
