import { Router } from 'express';
import { getAdminStats, getAllLots, updateLotStatus, getAllUsers } from '../controllers/admin.controller';
import { verifyToken } from '../middleware/verifyToken';
import { requireRole } from '../middleware/requireRole';

const router = Router();

router.use(verifyToken, requireRole(['admin']));

router.get('/stats', getAdminStats);
router.get('/lots', getAllLots);
router.put('/lots/:id/status', updateLotStatus);
router.get('/users', getAllUsers);

export default router;
