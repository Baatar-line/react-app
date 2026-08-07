import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, jsonError, ApiError } from '../../../../lib/auth-helpers';
import { destroyCloudinaryImages, orphanedUrls } from '../../../../lib/cloudinary';

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
    // The JWT's signature can still verify fine after the row it points at
    // is gone (a long-lived token from before an account got removed) — that
    // used to reach prisma.user.update() below and surface as a raw
    // "P2025 ... no record found" crash instead of a normal "sign in again".
    if (!existing) throw new ApiError(401, 'Таны нэвтрэлт хүчингүй болсон байна — дахин нэвтэрнэ үү');
    const finalPhone = existing?.phoneNumber || phoneNumber;
    const finalEmail = existing?.email || String(email).trim();
    // phoneNumber/email live on User, not Profile — updated separately since
    // both are @unique there and can collide with another account.
    //
    // Which of the two collided is worked out here rather than read off the
    // P2002 below: `err.meta.target` isn't reliably populated through the
    // driver adapter, and the old fallback blamed the phone whenever it was
    // missing. That was actively misleading — an account that signed up by
    // phone keeps its number locked in the form (see phoneLocked in
    // CompleteProfileForm), so "this phone is taken" pointed at the one field
    // the user cannot possibly change, while the real conflict was the email
    // they'd just typed.
    const [phoneTakenBy, emailTakenBy] = await Promise.all([
      prisma.user.findFirst({ where: { phoneNumber: finalPhone, id: { not: user.userId } }, select: { id: true } }),
      prisma.user.findFirst({ where: { email: finalEmail, id: { not: user.userId } }, select: { id: true } }),
    ]);
    if (emailTakenBy) throw new ApiError(409, 'Энэ и-мэйл өөр бүртгэлд ашиглагдсан байна. Тэр бүртгэлээрээ нэвтэрч орох, эсвэл өөр и-мэйл оруулна уу.');
    if (phoneTakenBy) throw new ApiError(409, 'Энэ утасны дугаар өөр бүртгэлд ашиглагдсан байна. Тэр бүртгэлээрээ нэвтэрч орох, эсвэл өөр дугаар оруулна уу.');
    try {
      await prisma.user.update({ where: { id: user.userId }, data: { phoneNumber: finalPhone, email: finalEmail } });
    } catch (err: any) {
      // Still possible if another account claims the same value between the
      // check above and this write. Names whichever field the constraint
      // points at when that's readable, and stays vague rather than guessing
      // wrong when it isn't.
      if (err?.code === 'P2002') {
        const target = err?.meta?.target;
        const targetText = Array.isArray(target) ? target.join(',') : String(target ?? '');
        const field = targetText.includes('email') ? 'и-мэйл'
          : targetText.includes('phone') ? 'утасны дугаар'
          : 'и-мэйл эсвэл утасны дугаар';
        throw new ApiError(409, `Энэ ${field} өөр бүртгэлд ашиглагдсан байна`);
      }
      throw err;
    }
    // Picking a new avatar uploads it before this call (see save() in
    // CompleteProfileForm), so the one it replaces is now unreferenced and
    // has to be destroyed or it stays in Cloudinary for good. Only fields the
    // request actually sent are considered — the form sends avatarImage every
    // time but never backgroundImage, and an absent field means "unchanged"
    // here exactly as it does to Prisma's update below.
    const previousProfile = await prisma.profile.findUnique({
      where: { userId: user.userId },
      select: { avatarImage: true, backgroundImage: true },
    });
    const profile = await prisma.profile.upsert({
      where: { userId: user.userId },
      update: { name, about, avatarImage, socialMediaURL, backgroundImage },
      create: { userId: user.userId, name, about, avatarImage, socialMediaURL, backgroundImage },
    });
    await destroyCloudinaryImages([
      ...(avatarImage !== undefined ? orphanedUrls(previousProfile?.avatarImage, avatarImage) : []),
      ...(backgroundImage !== undefined ? orphanedUrls(previousProfile?.backgroundImage, backgroundImage) : []),
    ]);
    return NextResponse.json(profile);
  } catch (err) {
    return jsonError(err);
  }
}
