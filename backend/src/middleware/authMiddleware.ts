import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    userId: string;
    role: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ')
    ? header.substring(7)
    : null;

  if (!token) {
    console.warn('[authMiddleware] Request ditolak: Header Authorization Bearer tidak ditemukan!', req.headers);
    return res.status(401).json({
      message: 'Authentication required. Pastikan menyertakan header Authorization: Bearer <token>',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret'
    ) as any;

    const id = decoded.userId || decoded.id;
    req.user = {
      id,
      userId: id,
      role: decoded.role || 'CUSTOMER',
    };
    next();

  } catch (err: any) {
    console.warn('[authMiddleware] Verifikasi token gagal:', err.message);
    return res.status(401).json({
      message: 'Invalid or expired token',
    });
  }
};
