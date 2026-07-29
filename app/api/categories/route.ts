import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth, requireRole, jsonError } from '../../../lib/auth-helpers';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(categories);
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { slug, name, nameEn, image, videoImage, subCategories } = await request.json();
    if (!slug || !name || !nameEn) return NextResponse.json({ error: 'slug, нэр (MN/EN) шаардлагатай' }, { status: 400 });
    const category = await prisma.category.create({
      data: { slug, name, nameEn, image, videoImage, subCategories: Array.isArray(subCategories) ? subCategories : [] },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
