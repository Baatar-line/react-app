import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { jsonError, ApiError } from '../../../../lib/auth-helpers';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const place = await prisma.place.findUnique({ where: { id: Number(id) }, include: { category: true, aimag: true } });
    if (!place) throw new ApiError(404, 'Газар олдсонгүй');
    return NextResponse.json(place);
  } catch (err) {
    return jsonError(err);
  }
}
