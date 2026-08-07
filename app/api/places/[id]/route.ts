import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, requireRole, jsonError, ApiError } from '../../../../lib/auth-helpers';
import { destroyCloudinaryImages } from '../../../../lib/cloudinary';
import { deleteCardSideRows } from '../../../../lib/cardCleanup';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const place = await prisma.place.findUnique({ where: { id: Number(id) }, include: { category: true, aimag: true } });
    if (!place) throw new ApiError(404, 'Газар олдсонгүй');
    return NextResponse.json(place);
  } catch (err) {
    return jsonError(err);
  }
}

// Admin-only full edit — the approve/reject moderation queue (see ./status)
// is a separate, non-admin-gated concern from actually correcting a listing's
// details after the fact.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { id } = await params;
    const {
      name, description, images, categoryId, aimagId, lat, lng, openTime, closeTime, googleMapUrl,
      subCategory, phone, instagramUrl, facebookUrl, contactEmail, accessible,
    } = await request.json();
    if (images !== undefined && (!Array.isArray(images) || images.length < 1 || images.length > 4)) {
      return NextResponse.json({ error: 'Дор хаяж 1, хамгийн ихдээ 4 зураг оруулна уу' }, { status: 400 });
    }
    // `images` always arrives as the row's full final photo set (kept +
    // newly-uploaded, see uploadImages in lib/userContent.ts) — whatever was
    // in the old set but isn't in this one was just replaced/removed, so
    // clean those up on Cloudinary instead of leaving them orphaned there.
    const previous = images !== undefined ? await prisma.place.findUnique({ where: { id: Number(id) }, select: { images: true } }) : null;
    const place = await prisma.place.update({
      where: { id: Number(id) },
      data: {
        name, description, images,
        categoryId: categoryId != null ? Number(categoryId) : undefined,
        aimagId: aimagId != null ? Number(aimagId) : undefined,
        lat: lat != null ? Number(lat) : undefined,
        lng: lng != null ? Number(lng) : undefined,
        openTime, closeTime, googleMapUrl,
        subCategory, phone, instagramUrl, facebookUrl, contactEmail,
        accessible: accessible != null ? !!accessible : undefined,
      },
      include: { category: true, aimag: true },
    });
    if (previous) await destroyCloudinaryImages(previous.images.filter((url) => !images.includes(url)));
    return NextResponse.json(place);
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { id } = await params;
    const place = await prisma.place.delete({ where: { id: Number(id) }, include: { category: true } });
    await destroyCloudinaryImages(place.images);
    await deleteCardSideRows('place', place.id, 'p:' + place.category.slug + ':' + place.name);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
