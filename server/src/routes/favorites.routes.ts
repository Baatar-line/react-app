import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

export const favoritesRouter = Router();

favoritesRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const favorites = await prisma.favorite.findMany({ where: { userId: req.user!.userId }, orderBy: { createdAt: 'desc' } });
    res.json(favorites);
  }),
);

favoritesRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { placeId } = req.body as { placeId?: string };
    if (!placeId) return res.status(400).json({ error: 'placeId шаардлагатай' });
    const favorite = await prisma.favorite.upsert({
      where: { userId_placeId: { userId: req.user!.userId, placeId } },
      update: {},
      create: { userId: req.user!.userId, placeId },
    });
    res.status(201).json(favorite);
  }),
);

favoritesRouter.delete(
  '/:placeId',
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.favorite
      .delete({ where: { userId_placeId: { userId: req.user!.userId, placeId: req.params.placeId } } })
      .catch(() => null);
    res.status(204).end();
  }),
);
