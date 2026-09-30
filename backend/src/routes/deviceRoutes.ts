import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { registerDevice } from '../controllers/deviceController';

const router = Router();

router.post('/', authenticate, registerDevice);

export default router;
