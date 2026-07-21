import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { uploadBufferToCloudinary } from '../lib/cloudinary';
import { asyncHandler } from '../utils/asyncHandler';

export const uploadRouter = Router();

// Client flow: pick a file -> POST it here -> get back { url } -> send that
// url as e.g. `image` in the place/scenic-pin/event/profile payload.
uploadRouter.post(
  '/',
  requireAuth,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'file талбар дутуу байна' });
    const folder = typeof req.body.folder === 'string' && req.body.folder ? `bigbang/${req.body.folder}` : 'bigbang/misc';
    const result = await uploadBufferToCloudinary(req.file.buffer, folder);
    res.status(201).json({ url: result.secure_url, publicId: result.public_id, resourceType: result.resource_type });
  }),
);
