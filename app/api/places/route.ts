import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth, requireRole, jsonError } from '../../../lib/auth-helpers';

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

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'host', 'admin');
    const { name, description, image, categoryId, aimagId, lat, lng, openTime, closeTime, googleMapUrl } = await request.json();
    if (!name || !categoryId || !aimagId) {
      return NextResponse.json({ error: 'Нэр, ангилал, аймаг шаардлагатай' }, { status: 400 });
    }
    const place = await prisma.place.create({
      data: {
        name, description, image,
        categoryId: Number(categoryId),
        aimagId: Number(aimagId),
        lat: lat != null ? Number(lat) : undefined,
        lng: lng != null ? Number(lng) : undefined,
        openTime, closeTime, googleMapUrl,
        addedBy: user.userId,
        // admins publish immediately, hosts go through the approval queue
        status: user.role === 'admin' ? 'approved' : 'pending',
      },
    });
    return NextResponse.json(place, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
