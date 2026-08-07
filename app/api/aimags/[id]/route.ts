import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, requireRole, jsonError } from '../../../../lib/auth-helpers';
import { destroyCloudinaryImages, orphanedUrls } from '../../../../lib/cloudinary';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { id } = await params;
    const { backgroundImage } = await request.json();
    // An aimag keeps one hero background, so replacing it orphans the old
    // upload — destroy it instead of leaving it in Cloudinary.
    const previous = backgroundImage !== undefined
      ? await prisma.aimag.findUnique({ where: { id: Number(id) }, select: { backgroundImage: true } })
      : null;
    const aimag = await prisma.aimag.update({ where: { id: Number(id) }, data: { backgroundImage } });
    if (previous) await destroyCloudinaryImages(orphanedUrls(previous.backgroundImage, backgroundImage));
    return NextResponse.json(aimag);
  } catch (err) {
    return jsonError(err);
  }
}
