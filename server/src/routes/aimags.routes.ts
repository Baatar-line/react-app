import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

export const aimagsRouter = Router();

aimagsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await prisma.aimag.findMany({ orderBy: { name: 'asc' } }));
  }),
);

aimagsRouter.post(
  '/',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { name, nameEn, backgroundImage, geoShape, labelX, labelY } = req.body;
    if (!name || !nameEn) return res.status(400).json({ error: 'name, nameEn шаардлагатай' });
    const aimag = await prisma.aimag.create({ data: { name, nameEn, backgroundImage, geoShape, labelX, labelY } });
    res.status(201).json(aimag);
  }),
);

// Admin-only — used by the "Фон зураг" tab to swap an aimag's background image.
aimagsRouter.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { backgroundImage } = req.body as { backgroundImage?: string };
    const aimag = await prisma.aimag.update({ where: { id: Number(req.params.id) }, data: { backgroundImage } });
    res.json(aimag);
  }),
);
