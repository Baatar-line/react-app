import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, requireRole, jsonError, ApiError } from '../../../../lib/auth-helpers';

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
      name, description, image, categoryId, aimagId, lat, lng, openTime, closeTime, googleMapUrl,
      subCategory, phone, instagramUrl, facebookUrl, contactEmail, accessible,
    } = await request.json();
    const place = await prisma.place.update({
      where: { id: Number(id) },
      data: {
        name, description, image,
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
    await prisma.place.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
