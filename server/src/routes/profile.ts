import { Router } from 'express';
import { getProfile, upsertProfile, patchProfile } from '../controllers/profile.controller';
import { verifyJWT } from '../middleware/auth';

const router = Router();

router.use(verifyJWT);
router.get('/', getProfile);
router.post('/', upsertProfile);
router.patch('/', patchProfile);

export default router;
