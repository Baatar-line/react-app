import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, jsonError } from '../../../../lib/auth-helpers';

// "Is this email/phone already on someone else's account?" — asked by
// CompleteProfileForm while the user is still typing, so a value that can
// never save is flagged in the field itself instead of only surfacing as a
// red error after they press Хадгалах.
//
// Sign-in required, and the answer is limited to the exact values asked
// about (never a listing), so this reveals nothing a signed-in user couldn't
// already learn by attempting the save. `id: { not: … }` excludes the
// caller's own account — their own email is not "taken".
export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get('email') || '').trim();
    const phone = (searchParams.get('phone') || '').trim();
    const [emailOwner, phoneOwner] = await Promise.all([
      email ? prisma.user.findFirst({ where: { email, id: { not: user.userId } }, select: { id: true } }) : null,
      phone ? prisma.user.findFirst({ where: { phoneNumber: phone, id: { not: user.userId } }, select: { id: true } }) : null,
    ]);
    return NextResponse.json({ emailTaken: !!emailOwner, phoneTaken: !!phoneOwner });
  } catch (err) {
    return jsonError(err);
  }
}
