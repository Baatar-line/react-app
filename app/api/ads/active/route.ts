import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { jsonError } from '../../../../lib/auth-helpers';

// Public (no auth) — the one ads endpoint an anonymous visitor legitimately
// needs, unlike GET /api/ads (admin-only, full rows incl. inactive/expired).
// Only currently-live ads, and only the fields the first-visit AdModal shows.
export async function GET() {
  try {
    const now = new Date();
    const ads = await prisma.ad.findMany({
      where: {
        active: true,
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, description: true, image: true },
    });
    return NextResponse.json(ads);
  } catch (err) {
    return jsonError(err);
  }
}
