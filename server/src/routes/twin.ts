import { Router } from 'express';
import { getTwin, generateTwinController } from '../controllers/twin.controller';
import { verifyJWT } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(verifyJWT);
router.get('/', getTwin);
router.post('/generate', aiRateLimiter, generateTwinController);

export default router;
