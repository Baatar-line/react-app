import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

export const profileRouter = Router();

profileRouter.put(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { name, about, avatarImage, socialMediaURL, backgroundImage } = req.body as {
      name?: string;
      about?: string;
      avatarImage?: string;
      socialMediaURL?: string;
      backgroundImage?: string;
    };
    if (!name) return res.status(400).json({ error: 'name шаардлагатай' });

    const profile = await prisma.profile.upsert({
      where: { userId: req.user!.userId },
      update: { name, about, avatarImage, socialMediaURL, backgroundImage },
      create: { userId: req.user!.userId, name, about, avatarImage, socialMediaURL, backgroundImage },
    });
    res.json(profile);
  }),
);
