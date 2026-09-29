import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { items } = req.body;
    const userId = req.user?.userId || (req.user as any)?.id;

    if (!userId) {
      console.warn('[orderController] userId kosong di req.user:', req.user);
      return res.status(401).json({ message: 'Unauthorized: User ID not found in token' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.warn('⚠️ [ORDER] Create order ditolak: Payload items kosong atau bukan array!', req.body);
      return res.status(400).json({ message: 'Order items are required' });
    }

    console.log(`📦 [ORDER] Memproses pembuatan order untuk userId: ${userId} (${items.length} menu items)`);

    const totalPrice = items.reduce(
      (total: number, item: any) => total + item.price * (item.quantity || 1),
      0
    );

    const order = await prisma.order.create({
      data: {
        userId,
        totalPrice,
        items: {
          create: items.map((item: any) => ({
            menuItemId: item.menuItemId || item.id,
            quantity: item.quantity || 1,
            price: item.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    console.log(`✅ [ORDER] Order #${order.id} BERHASIL dibuat! Total: Rp ${totalPrice.toLocaleString()}`);

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    console.error('💥 [ORDER] Create order error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;

    if (!userId) {
      console.warn('[orderController.getMyOrders] userId kosong di req.user:', req.user);
      return res.status(401).json({ message: 'Unauthorized: User ID not found in token' });
    }

    const orders = await prisma.order.findMany({
      where: {
        userId,
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: String(id) },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    console.error('Get order by id error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
