import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
  createPayment,
  simulatePayment,
  getPaymentByOrderId,
} from '../controllers/paymentController';

const router = Router();

router.post('/', authenticate, createPayment);
router.post('/simulate', authenticate, simulatePayment);
router.get('/order/:orderId', authenticate, getPaymentByOrderId);

export default router;
