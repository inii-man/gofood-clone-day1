import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

export const registerDevice = async (req: AuthRequest, res: Response) => {
  try {
    const { token, platform } = req.body;
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: User not found in request' });
    }

    if (!token) {
      return res.status(400).json({ message: 'Device token is required' });
    }

    const device = await prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform: platform || 'mobile' },
      create: { token, platform: platform || 'mobile', userId },
    });

    console.log(`📱 [DEVICE] Device token tersimpan untuk user ${userId}: ${token.slice(0, 20)}...`);
    res.json({ success: true, data: device });
  } catch (error: any) {
    console.error('💥 [DEVICE] Error register device token:', error);
    res.status(500).json({ success: false, message: 'Failed to register device' });
  }
};
