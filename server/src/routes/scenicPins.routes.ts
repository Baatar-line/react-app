import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

export const scenicPinsRouter = Router();

scenicPinsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { aimagId } = req.query as { aimagId?: string };
    const pins = await prisma.scenicPin.findMany({
      where: { aimagId: aimagId ? Number(aimagId) : undefined },
      include: { aimag: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(pins);
  }),
);

scenicPinsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const pin = await prisma.scenicPin.findUnique({ where: { id: Number(req.params.id) }, include: { aimag: true } });
    if (!pin) return res.status(404).json({ error: 'Үзэсгэлэнт газар олдсонгүй' });
    res.json(pin);
  }),
);

// `image` is a Cloudinary URL obtained from POST /api/upload beforehand.
scenicPinsRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { name, type, description, image, aimagId, lat, lng, googleMapUrl } = req.body;
    if (!name || !type || !aimagId) return res.status(400).json({ error: 'name, type, aimagId шаардлагатай' });
    const pin = await prisma.scenicPin.create({
      data: {
        name,
        type,
        description,
        image,
        aimagId: Number(aimagId),
        lat: lat != null ? Number(lat) : undefined,
        lng: lng != null ? Number(lng) : undefined,
        googleMapUrl,
        addedBy: req.user!.userId,
      },
    });
    res.status(201).json(pin);
  }),
);
