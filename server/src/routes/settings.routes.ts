import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

export const settingsRouter = Router();

settingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const settings = await prisma.siteSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
    res.json(settings);
  }),
);

settingsRouter.put(
  '/',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { aboutBackgroundImage, homeBackgroundImage, mongoliaFlagImage, suggestBackgroundImages } = req.body as {
      aboutBackgroundImage?: string; homeBackgroundImage?: string; mongoliaFlagImage?: string;
      suggestBackgroundImages?: Record<string, string>;
    };
    const settings = await prisma.siteSettings.upsert({
      where: { id: 1 },
      update: { aboutBackgroundImage, homeBackgroundImage, mongoliaFlagImage, suggestBackgroundImages },
      create: { id: 1, aboutBackgroundImage, homeBackgroundImage, mongoliaFlagImage, suggestBackgroundImages },
    });
    res.json(settings);
  }),
);
