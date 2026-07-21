import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, requireRole, jsonError } from '../../../../lib/auth-helpers';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { id } = await params;
    const { backgroundImage } = await request.json();
    const aimag = await prisma.aimag.update({ where: { id: Number(id) }, data: { backgroundImage } });
    return NextResponse.json(aimag);
  } catch (err) {
    return jsonError(err);
  }
}
