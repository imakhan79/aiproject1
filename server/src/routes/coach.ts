import { Router } from 'express';
import { getHistory, sendMessage, clearHistory } from '../controllers/coach.controller';
import { verifyJWT } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(verifyJWT);
router.get('/history', getHistory);
router.post('/message', aiRateLimiter, sendMessage);
router.delete('/history', clearHistory);

export default router;
