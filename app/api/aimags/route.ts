import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth, requireRole, jsonError } from '../../../lib/auth-helpers';

export async function GET() {
  try {
    const aimags = await prisma.aimag.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(aimags);
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { name, nameEn, backgroundImage, geoShape, labelX, labelY } = await request.json();
    if (!name || !nameEn) return NextResponse.json({ error: 'Нэр (MN/EN) шаардлагатай' }, { status: 400 });
    const aimag = await prisma.aimag.create({ data: { name, nameEn, backgroundImage, geoShape, labelX, labelY } });
    return NextResponse.json(aimag, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
