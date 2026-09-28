import { Request, Response } from 'express';
import prisma from '../prisma/client';

export const getAllRestaurants = async (
  req: Request,
  res: Response
) => {
  try {
    const restaurants =
      await prisma.restaurant.findMany({
        include: {
          menuItems: {
            where: { isPopular: true },
            take: 3,
          },
        },
      });

    res.json({
      success: true,
      data: restaurants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch restaurants',
    });
  }
};

export const getRestaurantById = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const restaurant =
      await prisma.restaurant.findUnique({
        where: { id },
        include: {
          menuItems: true,
        },
      });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        error: 'Restaurant not found',
      });
    }

    res.json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch restaurant',
    });
  }
};

export const getMenuByRestaurant = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const menuItems =
      await prisma.menuItem.findMany({
        where: {
          restaurantId: id,
        },
      });

    res.json({
      success: true,
      data: menuItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menu',
    });
  }
};
