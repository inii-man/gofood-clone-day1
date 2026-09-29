import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
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
    return res.status(401).json({
      message: 'Authentication required',
    });
  }

  try {
    req.user = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret'
    ) as AuthRequest['user'];
    next();
  } catch {
    return res.status(401).json({
      message: 'Invalid or expired token',
    });
  }
};
