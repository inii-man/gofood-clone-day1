import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendNotificationToUser, NOTIFICATION_EVENTS } from '../services/notificationService';

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

    // Slide 19: Kirim notifikasi event ORDER_CREATED
    sendNotificationToUser(userId, {
      title: NOTIFICATION_EVENTS.ORDER_CREATED.title,
      body: NOTIFICATION_EVENTS.ORDER_CREATED.body(order.id),
      data: { orderId: order.id, status: 'PENDING' },
    }).catch((err) => console.log('Push notif order created err:', err));

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

    const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
    const limit = req.query.limit ? Math.max(1, Number(req.query.limit)) : 20;
    const skip = (page - 1) * limit;

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
        payment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
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
        payment: true,
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
