import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { requireAuth, requireRole, jsonError } from '../../../../../lib/auth-helpers';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { id } = await params;
    const { status } = await request.json();
    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json({ error: "status нь 'approved' эсвэл 'rejected' байх ёстой" }, { status: 400 });
    }
    const place = await prisma.place.update({ where: { id: Number(id) }, data: { status } });
    return NextResponse.json(place);
  } catch (err) {
    return jsonError(err);
  }
}
