import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, jsonError, ApiError } from '../../../../lib/auth-helpers';

const PHONE_RE = /^\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// name/phoneNumber/socialMediaURL/email are required here — this route backs
// the "complete your profile" gate (see CompleteProfileForm.tsx) before
// someone can add a place/scenic pin/event, so a partial save that leaves it
// still incomplete would defeat the point. about/avatarImage/backgroundImage
// stay optional passthrough fields on Profile.
export async function PUT(request: Request) {
  try {
    const user = await requireAuth(request);
    const { name, about, avatarImage, socialMediaURL, backgroundImage, phoneNumber, email } = await request.json();
    if (!name || !String(name).trim()) return NextResponse.json({ error: 'Нэр шаардлагатай' }, { status: 400 });
    if (!phoneNumber || !PHONE_RE.test(phoneNumber)) {
      return NextResponse.json({ error: 'Утасны дугаар 8 оронтой тоо байх ёстой — жишээ: 99112233' }, { status: 400 });
    }
    if (!socialMediaURL || !String(socialMediaURL).trim()) {
      return NextResponse.json({ error: 'Instagram хаягаа оруулна уу' }, { status: 400 });
    }
    if (!email || !EMAIL_RE.test(String(email).trim())) {
      return NextResponse.json({ error: 'Зөв и-мэйл хаяг оруулна уу' }, { status: 400 });
    }
    // Once a phone/email is on file (from the original OTP sign-up or a
    // previous save), it's permanently locked — see CompleteProfileForm's
    // phoneLocked/emailLocked. That's a UI-only restriction unless enforced
    // here too, so a changed value from the client is silently discarded in
    // favor of whatever's already on the account instead of erroring (the
    // real (disabled) form never sends a different value in the first place).
    const existing = await prisma.user.findUnique({ where: { id: user.userId }, select: { phoneNumber: true, email: true } });
    const finalPhone = existing?.phoneNumber || phoneNumber;
    const finalEmail = existing?.email || String(email).trim();
    // phoneNumber/email live on User, not Profile — updated separately since
    // both are @unique there and can collide with another account.
    try {
      await prisma.user.update({ where: { id: user.userId }, data: { phoneNumber: finalPhone, email: finalEmail } });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        const field = err?.meta?.target?.includes?.('email') ? 'и-мэйл' : 'утасны дугаар';
        throw new ApiError(409, `Энэ ${field} өөр хаягт бүртгэлтэй байна`);
      }
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
