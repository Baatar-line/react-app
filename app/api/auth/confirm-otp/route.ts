import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, jsonError, ApiError } from '../../../../lib/auth-helpers';
import { verifyOtp, type OtpMethod } from '../../../../lib/otp';

// Re-verification gate for an already-signed-in account, required right
// before each place/scenic/event submission goes through (see
// BigBangLayout's onConfirmOtpVerified) — distinct from /api/auth/verify-otp,
// which is the sign-in flow itself (finds-or-creates a user and issues a
// fresh session token). This route trusts the request's own session token
// and checks the code against *that account's* own phone/email on file
// (never a client-supplied contact, so this can't be used to probe/verify
// someone else's number), and just returns ok/not-ok — no new token issued.
export async function POST(request: Request) {
  try {
    const authUser = await requireAuth(request);
    const { method, code } = await request.json();
    if (method !== 'phone' && method !== 'email') {
      return NextResponse.json({ error: "method нь 'phone' эсвэл 'email' байх ёстой" }, { status: 400 });
    }
    if (!code) return NextResponse.json({ error: 'Код оруулна уу' }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { id: authUser.userId } });
    if (!user) throw new ApiError(404, 'Хэрэглэгч олдсонгүй');
    const contact = method === 'phone' ? user.phoneNumber : user.email;
    if (!contact) return NextResponse.json({ error: 'Профайлдаа эхлээд утас, и-мэйлээ бүртгүүлнэ үү' }, { status: 400 });
    const ok = await verifyOtp(method as OtpMethod, contact, String(code));
    if (!ok) throw new ApiError(401, 'Код буруу эсвэл хугацаа дууссан байна');
    return NextResponse.json({ ok: true });
  } catch (err) {
    return jsonError(err);
  }
}
