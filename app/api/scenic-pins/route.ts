import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth, jsonError } from '../../../lib/auth-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const aimagId = searchParams.get('aimagId');
    const pins = await prisma.scenicPin.findMany({
      where: aimagId ? { aimagId: Number(aimagId) } : undefined,
      include: { aimag: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(pins);
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const { name, type, description, image, aimagId, lat, lng, googleMapUrl } = await request.json();
    if (!name || !type || !aimagId) {
      return NextResponse.json({ error: 'Нэр, төрөл, аймаг шаардлагатай' }, { status: 400 });
    }
    const pin = await prisma.scenicPin.create({
      data: {
        name, type, description, image,
        aimagId: Number(aimagId),
        lat: lat != null ? Number(lat) : undefined,
        lng: lng != null ? Number(lng) : undefined,
        googleMapUrl,
        addedBy: user.userId,
      },
    });
    return NextResponse.json(pin, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
