import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth, requireRole, jsonError } from '../../../lib/auth-helpers';

// Admin-only, every row (active + inactive) — same shape as GET /api/ads,
// so the admin tab can see and toggle everything. The public /suggest page
// reads GET /api/brands/active instead (active rows only, no auth).
export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const brands = await prisma.brand.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(brands);
  } catch (err) {
    return jsonError(err);
  }
}

// Admin-only write — managed exclusively from the Admin Panel's "Брэндийн
// сурталчилгаа" tab, same as Ad/SuggestCard.
export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { name, category, image, logo, link } = await request.json();
    if (!name || !category) {
      return NextResponse.json({ error: 'Нэр, ангилал шаардлагатай' }, { status: 400 });
    }
    const brand = await prisma.brand.create({
      data: { name, category, image, logo, link, addedBy: user.userId },
    });
    return NextResponse.json(brand, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
