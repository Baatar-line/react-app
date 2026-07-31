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
    const { name, tag, meta, image, startDate, endDate, aimagId, lat, lng, featured } = await request.json();
    if (!name || !startDate || !aimagId) {
      return NextResponse.json({ error: 'Нэр, эхлэх огноо, аймаг шаардлагатай' }, { status: 400 });
    }
    const event = await prisma.event.create({
      data: {
        name, tag, meta, image,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        aimagId: Number(aimagId),
        lat: lat != null ? Number(lat) : undefined,
        lng: lng != null ? Number(lng) : undefined,
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
