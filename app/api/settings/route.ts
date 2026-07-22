import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth, requireRole, jsonError } from '../../../lib/auth-helpers';

export async function GET() {
  try {
    const settings = await prisma.siteSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
    return NextResponse.json(settings);
  } catch (err) {
    return jsonError(err);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { aboutBackgroundImage, homeBackgroundImage, mongoliaFlagImage, suggestBackgroundImages, loaderBackgroundImage } = await request.json();
    const data = { aboutBackgroundImage, homeBackgroundImage, mongoliaFlagImage, suggestBackgroundImages, loaderBackgroundImage };
    const settings = await prisma.siteSettings.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
    return NextResponse.json(settings);
  } catch (err) {
    return jsonError(err);
  }
}
