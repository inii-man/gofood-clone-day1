import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      console.warn('⚠️ [AUTH] Register gagal: Nama, email, atau password kosong!', req.body);
      return res.status(400).json({
        message: 'Name, email, and password are required',
      });
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.warn(`⚠️ [AUTH] Register gagal: Email "${email}" sudah terdaftar!`);
      return res.status(409).json({
        message: 'Email already registered',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    console.log(`✅ [AUTH] User baru "${user.name}" (${user.email}) berhasil didaftarkan! ID: ${user.id}`);

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (error: any) {
    console.error('💥 [AUTH] Register exception error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.warn('⚠️ [AUTH] Login gagal: Email atau password tidak disertakan di body request!');
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.warn(`⚠️ [AUTH] Login gagal: User dengan email "${email}" TIDAK DITEMUKAN di PostgreSQL!`);
      return res.status(401).json({
        message: 'Invalid credentials: User not found',
      });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      console.warn(`⚠️ [AUTH] Login gagal: Password tidak cocok untuk user "${email}"!`);
      return res.status(401).json({
        message: 'Invalid credentials: Wrong password',
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    console.log(`✅ [AUTH] Login berhasil: "${user.name}" (${user.email}) | Role: ${user.role} | Token issued`);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('💥 [AUTH] Login exception error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
