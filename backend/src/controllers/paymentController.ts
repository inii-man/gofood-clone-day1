import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendNotificationToUser, NOTIFICATION_EVENTS } from '../services/notificationService';
import { io } from '../server';


export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, method = 'QRIS' } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    const order = await prisma.order.findUnique({
      where: { id: String(orderId) },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if payment already exists for this order
    const existingPayment = await prisma.payment.findUnique({
      where: { orderId: String(orderId) },
    });

    if (existingPayment) {
      return res.status(200).json({
        success: true,
        data: existingPayment,
        message: 'Payment already initiated',
      });
    }

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.totalPrice,
        method,
        status: 'PENDING',
      },
    });

    console.log(`💳 [PAYMENT] Payment created for Order #${order.id}: Rp ${order.totalPrice.toLocaleString()} via ${method}`);

    res.status(201).json({
      success: true,
      data: payment,
    });
  } catch (error: any) {
    console.error('💥 [PAYMENT] Create payment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const simulatePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId, status } = req.body;

    if (!paymentId || !status) {
      return res.status(400).json({ message: 'paymentId and status are required' });
    }

    if (!['PAID', 'FAILED', 'EXPIRED'].includes(status)) {
      return res.status(400).json({ message: 'status must be PAID, FAILED, or EXPIRED' });
    }

    const currentPayment = await prisma.payment.findUnique({
      where: { id: String(paymentId) },
    });

    if (!currentPayment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const payment = await prisma.payment.update({
      where: { id: String(paymentId) },
      data: { status },
    });

    const newOrderStatus = status === 'PAID' ? 'CONFIRMED' : 'PAYMENT_FAILED';

    const order = await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: newOrderStatus },
    });

    console.log(
      `💸 [PAYMENT SIMULATOR] Payment #${payment.id} status -> ${status}. Order #${order.id} status -> ${newOrderStatus}`
    );

    // Kirim Push Notification jika PAID (Slide 32-33)
    if (status === 'PAID') {
      await sendNotificationToUser(order.userId, {
        title: NOTIFICATION_EVENTS.PAYMENT_SUCCESS.title,
        body: NOTIFICATION_EVENTS.PAYMENT_SUCCESS.body(order.id),
        data: { orderId: order.id, status: 'CONFIRMED' },
      });

      // Broadcast socket update
      io.to(`order:${order.id}`).emit('payment-status-updated', {
        paymentId: payment.id,
        status: 'PAID',
        orderId: order.id,
      });
      io.to(`order:${order.id}`).emit('notification', {
        title: NOTIFICATION_EVENTS.PAYMENT_SUCCESS.title,
        body: NOTIFICATION_EVENTS.PAYMENT_SUCCESS.body(order.id),
      });
    }


    res.json({
      success: true,
      data: payment,
      order,
    });
  } catch (error: any) {
    console.error('💥 [PAYMENT] Simulate payment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPaymentByOrderId = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const payment = await prisma.payment.findUnique({
      where: { orderId: String(orderId) },
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found for this order' });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error: any) {
    console.error('💥 [PAYMENT] Get payment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
