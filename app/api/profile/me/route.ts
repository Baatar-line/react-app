import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, jsonError, ApiError } from '../../../../lib/auth-helpers';

const PHONE_RE = /^\d{8}$/;

// name/phoneNumber/socialMediaURL are required here — this route backs the
// "complete your profile" gate (see CompleteProfileForm.tsx) before someone
// can add a place/scenic pin/event, so a partial save that leaves it still
// incomplete would defeat the point. about/avatarImage/backgroundImage stay
// optional passthrough fields on Profile.
export async function PUT(request: Request) {
  try {
    const user = await requireAuth(request);
    const { name, about, avatarImage, socialMediaURL, backgroundImage, phoneNumber } = await request.json();
    if (!name || !String(name).trim()) return NextResponse.json({ error: 'Нэр шаардлагатай' }, { status: 400 });
    if (!phoneNumber || !PHONE_RE.test(phoneNumber)) {
      return NextResponse.json({ error: 'Утасны дугаар 8 оронтой тоо байх ёстой — жишээ: 99112233' }, { status: 400 });
    }
    if (!socialMediaURL || !String(socialMediaURL).trim()) {
      return NextResponse.json({ error: 'Instagram хаягаа оруулна уу' }, { status: 400 });
    }
    // phoneNumber lives on User, not Profile — updated separately since it's
    // @unique there and can collide with another account.
    try {
      await prisma.user.update({ where: { id: user.userId }, data: { phoneNumber } });
    } catch (err: any) {
      if (err?.code === 'P2002') throw new ApiError(409, 'Энэ утасны дугаар өөр хаягт бүртгэлтэй байна');
      throw err;
    }
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
