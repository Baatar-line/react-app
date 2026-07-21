import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { comparePassword, hashPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

export const authRouter = Router();

const publicUser = (u: { id: number; email: string; username: string; phoneNumber: string | null; role: string }) => ({
  id: u.id,
  email: u.email,
  username: u.username,
  phoneNumber: u.phoneNumber,
  role: u.role,
});

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password, username, phoneNumber } = req.body as {
      email?: string;
      password?: string;
      username?: string;
      phoneNumber?: string;
    };
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'email, password, username шаардлагатай' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Нууц үг дор хаяж 8 тэмдэгт байх ёстой' });
    }

    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (existing) return res.status(409).json({ error: 'Энэ имэйл эсвэл хэрэглэгчийн нэр аль хэдийн бүртгэлтэй' });

    const user = await prisma.user.create({
      data: { email, username, phoneNumber, password: await hashPassword(password) },
    });

    const token = signToken({ userId: user.id, role: user.role });
    res.status(201).json({ token, user: publicUser(user) });
  }),
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) return res.status(400).json({ error: 'email, password шаардлагатай' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ error: 'Имэйл эсвэл нууц үг буруу байна' });
    }

    const token = signToken({ userId: user.id, role: user.role });
    res.json({ token, user: publicUser(user) });
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { profile: true } });
    if (!user) return res.status(404).json({ error: 'Хэрэглэгч олдсонгүй' });
    res.json({ ...publicUser(user), profile: user.profile });
  }),
);
