import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, requireRole, jsonError, ApiError } from '../../../../lib/auth-helpers';

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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { id } = await params;
    const { name, type, description, images, aimagId, lat, lng, googleMapUrl } = await request.json();
    if (images !== undefined && (!Array.isArray(images) || images.length < 1 || images.length > 4)) {
      return NextResponse.json({ error: 'Дор хаяж 1, хамгийн ихдээ 4 зураг оруулна уу' }, { status: 400 });
    }
    const pin = await prisma.scenicPin.update({
      where: { id: Number(id) },
      data: {
        name, type, description, images,
        aimagId: aimagId != null ? Number(aimagId) : undefined,
        lat: lat != null ? Number(lat) : undefined,
        lng: lng != null ? Number(lng) : undefined,
        googleMapUrl,
      },
      include: { aimag: true },
    });
    return NextResponse.json(pin);
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { id } = await params;
    await prisma.scenicPin.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
