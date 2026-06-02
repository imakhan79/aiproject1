import { Router } from 'express';
import { signup, login, me } from '../controllers/auth.controller';
import { verifyJWT } from '../middleware/auth';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', verifyJWT, me);

export default router;
