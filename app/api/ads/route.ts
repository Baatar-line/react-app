import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth, requireRole, jsonError } from '../../../lib/auth-helpers';

// Admin-only, both reads and writes — unlike places/scenic pins/events/
// suggest cards, ads have no public-facing display anywhere in the app yet,
// so there's nothing here a non-admin request would legitimately need.
export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const ads = await prisma.ad.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(ads);
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { title, description, image, startDate, endDate } = await request.json();
    if (!title) return NextResponse.json({ error: 'Гарчиг шаардлагатай' }, { status: 400 });
    const ad = await prisma.ad.create({
      data: {
        title, description, image,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        addedBy: user.userId,
      },
    });
    return NextResponse.json(ad, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
