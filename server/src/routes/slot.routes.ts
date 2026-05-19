import { Router } from 'express';
import { getSlotsByLotId } from '../controllers/slot.controller';

const router = Router();

router.get('/lot/:lotId', getSlotsByLotId);

export default router;
