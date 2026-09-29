import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { createOrder, getMyOrders, getOrderById } from '../controllers/orderController';

const router = Router();

router.post('/', authenticate as any, createOrder as any);
router.get('/my', authenticate as any, getMyOrders as any);
router.get('/:id', authenticate as any, getOrderById as any);
router.get('/', authenticate as any, getMyOrders as any);

export default router;
