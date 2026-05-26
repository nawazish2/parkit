import { Router } from 'express';
import { getSlotsByLotId, updateSlotAvailability } from '../controllers/slot.controller';
import { verifyToken } from '../middleware/verifyToken';
import { requireRole } from '../middleware/requireRole';

const router = Router();

router.get('/lot/:lotId', getSlotsByLotId);
router.patch('/:id/availability', verifyToken, requireRole(['owner', 'admin']), updateSlotAvailability);

export default router;
