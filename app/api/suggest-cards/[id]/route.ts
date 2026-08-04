import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, requireRole, jsonError } from '../../../../lib/auth-helpers';
import { destroyCloudinaryImages } from '../../../../lib/cloudinary';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { id } = await params;
    const { collectionSlug, name, description, image } = await request.json();
    // A replaced photo would otherwise just leave the old one orphaned on
    // Cloudinary — only worth the extra lookup when a new image is actually
    // being set.
    const previous = image !== undefined ? await prisma.suggestCard.findUnique({ where: { id: Number(id) }, select: { image: true } }) : null;
    const card = await prisma.suggestCard.update({
      where: { id: Number(id) },
      data: { collectionSlug, name, description, image },
    });
    if (previous && previous.image && previous.image !== image) await destroyCloudinaryImages([previous.image]);
    return NextResponse.json(card);
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { id } = await params;
    const card = await prisma.suggestCard.delete({ where: { id: Number(id) } });
    await destroyCloudinaryImages([card.image]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
