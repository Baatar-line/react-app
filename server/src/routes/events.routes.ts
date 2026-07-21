import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

export const eventsRouter = Router();

eventsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { aimagId } = req.query as { aimagId?: string };
    const events = await prisma.event.findMany({
      where: { aimagId: aimagId ? Number(aimagId) : undefined },
      include: { aimag: true },
      orderBy: { startDate: 'asc' },
    });
    res.json(events);
  }),
);

eventsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const event = await prisma.event.findUnique({ where: { id: Number(req.params.id) }, include: { aimag: true } });
    if (!event) return res.status(404).json({ error: 'Эвент олдсонгүй' });
    res.json(event);
  }),
);

// `image` is a Cloudinary URL obtained from POST /api/upload beforehand.
eventsRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { name, tag, meta, image, startDate, endDate, aimagId, lat, lng, featured } = req.body;
    if (!name || !startDate || !aimagId) return res.status(400).json({ error: 'name, startDate, aimagId шаардлагатай' });
    const event = await prisma.event.create({
      data: {
        name,
        tag,
        meta,
        image,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        aimagId: Number(aimagId),
        lat: lat != null ? Number(lat) : undefined,
        lng: lng != null ? Number(lng) : undefined,
        featured: !!featured,
      },
    });
    res.status(201).json(event);
  }),
);
