import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { jsonError, ApiError } from '../../../../lib/auth-helpers';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const event = await prisma.event.findUnique({ where: { id: Number(id) }, include: { aimag: true } });
    if (!event) throw new ApiError(404, 'Эвент олдсонгүй');
    return NextResponse.json(event);
  } catch (err) {
    return jsonError(err);
  }
}
