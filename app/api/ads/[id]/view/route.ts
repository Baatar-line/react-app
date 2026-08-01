import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { jsonError } from '../../../../../lib/auth-helpers';

// Public (no auth) — fired by AdModal once per ad a visitor actually scrolls
// to. Ads had no public display anywhere before this, so the admin panel's
// "views" counter (seeded with placeholder numbers) never actually moved —
// this is the first thing that increments it from real traffic.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.ad.update({ where: { id: Number(id) }, data: { views: { increment: 1 } } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
