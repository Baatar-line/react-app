import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, requireRole, jsonError } from '../../../../lib/auth-helpers';
import { destroyCloudinaryImages, orphanedUrls } from '../../../../lib/cloudinary';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { id } = await params;
    const { name, category, image, logo, link, active } = await request.json();
    // Both the banner photo and the logo are single-slot, so swapping either
    // orphans what it replaced — destroy those rather than leave them in
    // Cloudinary. Only fields the request actually sent are compared; an
    // absent one means "unchanged", as it does to the update below.
    const previous = await prisma.brand.findUnique({ where: { id: Number(id) }, select: { image: true, logo: true } });
    const brand = await prisma.brand.update({
      where: { id: Number(id) },
      data: { name, category, image, logo, link, active: active != null ? !!active : undefined },
    });
    await destroyCloudinaryImages([
      ...(image !== undefined ? orphanedUrls(previous?.image, image) : []),
      ...(logo !== undefined ? orphanedUrls(previous?.logo, logo) : []),
    ]);
    return NextResponse.json(brand);
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { id } = await params;
    const brand = await prisma.brand.delete({ where: { id: Number(id) } });
    await destroyCloudinaryImages([brand.image, brand.logo]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
