import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, requireRole, jsonError } from '../../../../lib/auth-helpers';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { id } = await params;
    const { image } = await request.json();
    const category = await prisma.category.update({ where: { id: Number(id) }, data: { image } });
    return NextResponse.json(category);
  } catch (err) {
    return jsonError(err);
  }
}
