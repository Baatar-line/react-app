import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth, jsonError } from '../../../lib/auth-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const aimagId = searchParams.get('aimagId');
    const events = await prisma.event.findMany({
      where: aimagId ? { aimagId: Number(aimagId) } : undefined,
      include: { aimag: true },
      orderBy: { startDate: 'asc' },
    });
    return NextResponse.json(events);
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const { name, tag, meta, images, startDate, endDate, aimagId, lat, lng, featured, instagram, phone, phone2 } = await request.json();
    if (!name || !meta || !startDate || !aimagId) {
      return NextResponse.json({ error: 'Нэр, тайлбар, эхлэх огноо, аймаг шаардлагатай' }, { status: 400 });
    }
    if (!Array.isArray(images) || images.length < 1 || images.length > 4) {
      return NextResponse.json({ error: 'Дор хаяж 1, хамгийн ихдээ 4 зураг оруулна уу' }, { status: 400 });
    }
    // Contact info is mandatory (unlike scenic pins) — attendees/admin need
    // a real way to reach the organizer. Format-checked too, not just
    // presence — mirrors CreateForm.tsx's own client-side check, but this is
    // the check that actually can't be bypassed by calling the API directly.
    if (!phone || !instagram) {
      return NextResponse.json({ error: 'Утасны дугаар, Instagram заавал шаардлагатай' }, { status: 400 });
    }
    if (!/^\d{8}$/.test(phone)) {
      return NextResponse.json({ error: 'Утасны дугаар 8 оронтой тоо байх ёстой — жишээ: 99112233' }, { status: 400 });
    }
    if (phone2 && !/^\d{8}$/.test(phone2)) {
      return NextResponse.json({ error: '2-р утасны дугаар 8 оронтой тоо байх ёстой — жишээ: 99112233' }, { status: 400 });
    }
    const event = await prisma.event.create({
      data: {
        name, tag, meta, images,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        aimagId: Number(aimagId),
        lat: lat != null ? Number(lat) : undefined,
        lng: lng != null ? Number(lng) : undefined,
        instagram, phone, phone2: phone2 || undefined,
        // Only an admin can pin an event to the home page's featured banner —
        // a host marking their own event featured would otherwise be a
        // self-service promotion with no moderation at all.
        featured: user.role === 'admin' ? !!featured : false,
        addedBy: user.userId,
      },
    });
    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
