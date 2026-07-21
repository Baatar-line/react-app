import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

export const categoriesRouter = Router();

categoriesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await prisma.category.findMany({ orderBy: { name: 'asc' } }));
  }),
);

categoriesRouter.post(
  '/',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { slug, name, nameEn, image, subCategories } = req.body;
    if (!slug || !name || !nameEn) return res.status(400).json({ error: 'slug, name, nameEn шаардлагатай' });
    const category = await prisma.category.create({
      data: { slug, name, nameEn, image, subCategories: Array.isArray(subCategories) ? subCategories : [] },
    });
    res.status(201).json(category);
  }),
);

// Admin-only — used by the "Фон зураг" tab to swap a category's background image.
categoriesRouter.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { image } = req.body as { image?: string };
    const category = await prisma.category.update({ where: { id: Number(req.params.id) }, data: { image } });
    res.json(category);
  }),
);
