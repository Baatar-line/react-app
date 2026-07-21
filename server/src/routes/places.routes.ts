import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

export const placesRouter = Router();

// Public list — only approved places, optionally filtered by aimag/category.
placesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { aimagId, categoryId } = req.query as { aimagId?: string; categoryId?: string };
    const places = await prisma.place.findMany({
      where: {
        status: 'approved',
        aimagId: aimagId ? Number(aimagId) : undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
      },
      include: { category: true, aimag: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(places);
  }),
);

// Host/admin: places the current user submitted, including pending/rejected ones.
placesRouter.get(
  '/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    const places = await prisma.place.findMany({
      where: { addedBy: req.user!.userId },
      include: { category: true, aimag: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(places);
  }),
);

// Admin: everything pending review.
placesRouter.get(
  '/pending',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (_req, res) => {
    const places = await prisma.place.findMany({
      where: { status: 'pending' },
      include: { category: true, aimag: true, addedByUser: { select: { id: true, username: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json(places);
  }),
);

placesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const place = await prisma.place.findUnique({
      where: { id: Number(req.params.id) },
      include: { category: true, aimag: true },
    });
    if (!place) return res.status(404).json({ error: 'Газар олдсонгүй' });
    res.json(place);
  }),
);

// Host/admin submit a new place. `image` is a Cloudinary URL already obtained
// from POST /api/upload — this endpoint only ever stores links, never files.
placesRouter.post(
  '/',
  requireAuth,
  requireRole('host', 'admin'),
  asyncHandler(async (req, res) => {
    const { name, description, image, categoryId, aimagId, lat, lng, openTime, closeTime, googleMapUrl } = req.body;
    if (!name || !categoryId || !aimagId) {
      return res.status(400).json({ error: 'name, categoryId, aimagId шаардлагатай' });
    }
    const place = await prisma.place.create({
      data: {
        name,
        description,
        image,
        categoryId: Number(categoryId),
        aimagId: Number(aimagId),
        lat: lat != null ? Number(lat) : undefined,
        lng: lng != null ? Number(lng) : undefined,
        openTime,
        closeTime,
        googleMapUrl,
        addedBy: req.user!.userId,
        // admins publish immediately, hosts go through the approval queue
        status: req.user!.role === 'admin' ? 'approved' : 'pending',
      },
    });
    res.status(201).json(place);
  }),
);

placesRouter.patch(
  '/:id/status',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { status } = req.body as { status?: 'approved' | 'rejected' };
    if (status !== 'approved' && status !== 'rejected') return res.status(400).json({ error: 'status буруу байна' });
    const place = await prisma.place.update({ where: { id: Number(req.params.id) }, data: { status } });
    res.json(place);
  }),
);
