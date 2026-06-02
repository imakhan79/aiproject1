import { Router } from 'express';
import { listDreams, getDream, createDream, patchDream, deleteDream } from '../controllers/dreams.controller';
import { verifyJWT } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(verifyJWT);
router.get('/', listDreams);
router.get('/:id', getDream);
router.post('/', aiRateLimiter, createDream);
router.patch('/:id', patchDream);
router.delete('/:id', deleteDream);

export default router;
