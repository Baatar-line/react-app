import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth, jsonError } from '../../../lib/auth-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const aimagId = searchParams.get('aimagId');
    const categoryId = searchParams.get('categoryId');
    const places = await prisma.place.findMany({
      where: {
        status: 'approved',
        ...(aimagId ? { aimagId: Number(aimagId) } : {}),
        ...(categoryId ? { categoryId: Number(categoryId) } : {}),
      },
      include: { category: true, aimag: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(places);
  } catch (err) {
    return jsonError(err);
  }
}

// No role check — there's no "host" tier, any signed-in account can submit a
// place. It just lands as `pending` (see status below) until an admin
// approves it, unlike scenic pins/events which any signed-in account can
// publish immediately (see /api/scenic-pins, /api/events).
export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const {
      name, description, images, categoryId, aimagId, lat, lng, openTime, closeTime, googleMapUrl,
      subCategory, phone, instagramUrl, facebookUrl, contactEmail, accessible,
    } = await request.json();
    if (!name || !description || !categoryId || !aimagId || !openTime || !closeTime) {
      return NextResponse.json({ error: 'Нэр, тайлбар, ангилал, аймаг, нээх/хаах цаг шаардлагатай' }, { status: 400 });
    }
    if (!Array.isArray(images) || images.length < 1 || images.length > 4) {
      return NextResponse.json({ error: 'Дор хаяж 1, хамгийн ихдээ 4 зураг оруулна уу' }, { status: 400 });
    }
    // Contact info is mandatory for a place (unlike scenic pins/events) —
    // it's how admin actually reaches whoever's asking to be listed. Format-
    // checked too, not just presence — mirrors CreateForm.tsx's own
    // client-side check, but this is the check that actually can't be
    // bypassed by calling the API directly.
    if (!phone || !instagramUrl || !facebookUrl || !contactEmail) {
      return NextResponse.json({ error: 'Утасны дугаар, Instagram, Facebook, имэйл хаяг заавал шаардлагатай' }, { status: 400 });
    }
    if (!/^\d{8}$/.test(phone)) {
      return NextResponse.json({ error: 'Утасны дугаар 8 оронтой тоо байх ёстой — жишээ: 99112233' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return NextResponse.json({ error: 'Имэйл хаяг буруу байна — жишээ: tanii@email.mn' }, { status: 400 });
    }
    const place = await prisma.place.create({
      data: {
        name, description, images,
        categoryId: Number(categoryId),
        aimagId: Number(aimagId),
        lat: lat != null ? Number(lat) : undefined,
        lng: lng != null ? Number(lng) : undefined,
        openTime, closeTime, googleMapUrl,
        subCategory, phone, instagramUrl, facebookUrl, contactEmail, accessible: !!accessible,
        addedBy: user.userId,
        // admins publish immediately, everyone else goes through the approval queue
        status: user.role === 'admin' ? 'approved' : 'pending',
      },
    });
    return NextResponse.json(place, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
