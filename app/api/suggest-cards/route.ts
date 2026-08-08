import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth, requireRole, jsonError } from '../../../lib/auth-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionSlug = searchParams.get('collectionSlug');
    const cards = await prisma.suggestCard.findMany({
      where: collectionSlug ? { collectionSlug } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(cards);
  } catch (err) {
    return jsonError(err);
  }
}

// Admin-only — unlike places/scenic pins/events, there's no public "add a
// suggest card" flow anywhere in the app; this table is managed exclusively
// from the Admin Panel's "Санал болгох" tab.
export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { collectionSlug, name, description, image, link } = await request.json();
    if (!collectionSlug || !name) {
      return NextResponse.json({ error: 'Ангилал, нэр шаардлагатай' }, { status: 400 });
    }
    const card = await prisma.suggestCard.create({
      data: { collectionSlug, name, description, image, link: link || undefined, addedBy: user.userId },
    });
    return NextResponse.json(card, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
