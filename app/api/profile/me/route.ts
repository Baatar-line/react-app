import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, jsonError } from '../../../../lib/auth-helpers';

export async function PUT(request: Request) {
  try {
    const user = await requireAuth(request);
    const { name, about, avatarImage, socialMediaURL, backgroundImage } = await request.json();
    if (!name) return NextResponse.json({ error: 'Нэр шаардлагатай' }, { status: 400 });
    const profile = await prisma.profile.upsert({
      where: { userId: user.userId },
      update: { name, about, avatarImage, socialMediaURL, backgroundImage },
      create: { userId: user.userId, name, about, avatarImage, socialMediaURL, backgroundImage },
    });
    return NextResponse.json(profile);
  } catch (err) {
    return jsonError(err);
  }
}
