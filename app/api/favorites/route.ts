import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth, jsonError } from '../../../lib/auth-helpers';

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const favorites = await prisma.favorite.findMany({ where: { userId: user.userId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json(favorites);
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const { placeId } = await request.json();
    if (!placeId) return NextResponse.json({ error: 'placeId шаардлагатай' }, { status: 400 });
    const favorite = await prisma.favorite.upsert({
      where: { userId_placeId: { userId: user.userId, placeId } },
      update: {},
      create: { userId: user.userId, placeId },
    });
    return NextResponse.json(favorite, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
