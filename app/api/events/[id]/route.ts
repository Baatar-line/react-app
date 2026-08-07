import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, requireRole, jsonError, ApiError } from '../../../../lib/auth-helpers';
import { destroyCloudinaryImages } from '../../../../lib/cloudinary';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const event = await prisma.event.findUnique({ where: { id: Number(id) }, include: { aimag: true } });
    if (!event) throw new ApiError(404, 'Эвент олдсонгүй');
    return NextResponse.json(event);
  } catch (err) {
    return jsonError(err);
  }
}

// Admin-only — covers both the "featured" toggle (home page banner, same
// moderation boundary as setting it at creation time — see POST /api/events)
// and full-field edits from the admin content list.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { id } = await params;
    const { name, tag, meta, images, startDate, endDate, aimagId, lat, lng, featured, instagram, facebook, phone, phone2 } = await request.json();
    if (images !== undefined && (!Array.isArray(images) || images.length < 1 || images.length > 4)) {
      return NextResponse.json({ error: 'Дор хаяж 1, хамгийн ихдээ 4 зураг оруулна уу' }, { status: 400 });
    }
    if (phone !== undefined && phone && !/^\d{8}$/.test(phone)) {
      return NextResponse.json({ error: 'Утасны дугаар 8 оронтой тоо байх ёстой — жишээ: 99112233' }, { status: 400 });
    }
    if (phone2 && !/^\d{8}$/.test(phone2)) {
      return NextResponse.json({ error: '2-р утасны дугаар 8 оронтой тоо байх ёстой — жишээ: 99112233' }, { status: 400 });
    }
    // `images` always arrives as the row's full final photo set (kept +
    // newly-uploaded, see uploadImages in lib/userContent.ts) — whatever was
    // in the old set but isn't in this one was just replaced/removed, so
    // clean those up on Cloudinary instead of leaving them orphaned there.
    // Not triggered by the featured-only toggle PATCH (images is undefined then).
    const previous = images !== undefined ? await prisma.event.findUnique({ where: { id: Number(id) }, select: { images: true } }) : null;
    const event = await prisma.event.update({
      where: { id: Number(id) },
      data: {
        name, tag, meta, images,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        aimagId: aimagId != null ? Number(aimagId) : undefined,
        lat: lat != null ? Number(lat) : undefined,
        lng: lng != null ? Number(lng) : undefined,
        featured: featured != null ? !!featured : undefined,
        instagram, facebook: facebook !== undefined ? (facebook || null) : undefined,
        phone, phone2: phone2 !== undefined ? (phone2 || null) : undefined,
      },
      include: { aimag: true },
    });
    if (previous) await destroyCloudinaryImages(previous.images.filter((url) => !images.includes(url)));
    return NextResponse.json(event);
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { id } = await params;
    const event = await prisma.event.delete({ where: { id: Number(id) } });
    await destroyCloudinaryImages(event.images);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
