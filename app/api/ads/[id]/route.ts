import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, requireRole, jsonError } from '../../../../lib/auth-helpers';
import { destroyCloudinaryImages } from '../../../../lib/cloudinary';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { id } = await params;
    const { title, description, image, startDate, endDate, active } = await request.json();
    // A replaced photo would otherwise just leave the old one orphaned on
    // Cloudinary — only worth the extra lookup when a new image is actually
    // being set.
    const previous = image !== undefined ? await prisma.ad.findUnique({ where: { id: Number(id) }, select: { image: true } }) : null;
    const ad = await prisma.ad.update({
      where: { id: Number(id) },
      data: {
        title, description, image,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        active: active != null ? !!active : undefined,
      },
    });
    if (previous && previous.image && previous.image !== image) await destroyCloudinaryImages([previous.image]);
    return NextResponse.json(ad);
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { id } = await params;
    const ad = await prisma.ad.delete({ where: { id: Number(id) } });
    await destroyCloudinaryImages([ad.image]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
