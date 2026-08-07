import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, requireRole, jsonError } from '../../../../lib/auth-helpers';
import { destroyCloudinaryImages, orphanedUrls } from '../../../../lib/cloudinary';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { id } = await params;
    const { image, videoImage } = await request.json();
    const data: { image?: string; videoImage?: string } = {};
    if (image !== undefined) data.image = image;
    if (videoImage !== undefined) data.videoImage = videoImage;
    // A category holds one photo and one video, so swapping either orphans
    // what was there — destroy it rather than leave it in Cloudinary. Only the
    // keys built into `data` above are compared, for the same reason they're
    // the only ones written.
    const previous = await prisma.category.findUnique({ where: { id: Number(id) }, select: { image: true, videoImage: true } });
    const category = await prisma.category.update({ where: { id: Number(id) }, data });
    await destroyCloudinaryImages([
      ...(data.image !== undefined ? orphanedUrls(previous?.image, data.image) : []),
      ...(data.videoImage !== undefined ? orphanedUrls(previous?.videoImage, data.videoImage) : []),
    ]);
    return NextResponse.json(category);
  } catch (err) {
    return jsonError(err);
  }
}
