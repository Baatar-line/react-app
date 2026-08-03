import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, requireRole, jsonError } from '../../../../lib/auth-helpers';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { id } = await params;
    const { collectionSlug, name, description, image } = await request.json();
    const card = await prisma.suggestCard.update({
      where: { id: Number(id) },
      data: { collectionSlug, name, description, image },
    });
    return NextResponse.json(card);
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { id } = await params;
    await prisma.suggestCard.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
