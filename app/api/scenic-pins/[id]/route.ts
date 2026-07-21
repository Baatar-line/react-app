import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { jsonError, ApiError } from '../../../../lib/auth-helpers';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pin = await prisma.scenicPin.findUnique({ where: { id: Number(id) }, include: { aimag: true } });
    if (!pin) throw new ApiError(404, 'Газар олдсонгүй');
    return NextResponse.json(pin);
  } catch (err) {
    return jsonError(err);
  }
}
