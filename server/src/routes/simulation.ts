import { Router } from 'express';
import { listSimulations, getSimulation, createSimulation } from '../controllers/simulation.controller';
import { verifyJWT } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(verifyJWT);
router.get('/', listSimulations);
router.get('/:id', getSimulation);
router.post('/', aiRateLimiter, createSimulation);

export default router;
