import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, jsonError } from '../../../../lib/auth-helpers';

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const places = await prisma.place.findMany({
      where: { addedBy: user.userId },
      include: { category: true, aimag: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(places);
  } catch (err) {
    return jsonError(err);
  }
}
