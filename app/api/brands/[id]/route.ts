import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, requireRole, jsonError } from '../../../../lib/auth-helpers';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { id } = await params;
    const { name, category, image, logo, link, active } = await request.json();
    const brand = await prisma.brand.update({
      where: { id: Number(id) },
      data: { name, category, image, logo, link, active: active != null ? !!active : undefined },
    });
    return NextResponse.json(brand);
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { id } = await params;
    await prisma.brand.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
