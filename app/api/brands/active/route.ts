import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { jsonError } from '../../../../lib/auth-helpers';

// Public (no auth) — what the /suggest page's featured-brands rail reads.
// Admin's own "Брэндийн сурталчилгаа" tab uses GET /api/brands instead
// (auth-gated, every row including inactive ones).
export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(brands);
  } catch (err) {
    return jsonError(err);
  }
}
