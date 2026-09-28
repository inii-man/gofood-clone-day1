import { Router } from 'express';
import {
  getAllRestaurants,
  getRestaurantById,
  getMenuByRestaurant,
} from '../controllers/restaurantController';

const router = Router();

router.get('/', getAllRestaurants);
router.get('/:id', getRestaurantById);
router.get('/:id/menu', getMenuByRestaurant);

export default router;
