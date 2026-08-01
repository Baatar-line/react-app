import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { signToken } from '../../../../lib/jwt';
import { verifyOtp, normalizeContact, validateContact, type OtpMethod } from '../../../../lib/otp';
import { jsonError, ApiError } from '../../../../lib/auth-helpers';

function publicUser(user: { id: number; email: string | null; username: string; phoneNumber: string | null; role: string }) {
  return { id: user.id, email: user.email, username: user.username, phoneNumber: user.phoneNumber, role: user.role };
}

// Generates a free username from the contact — "user1234" for a phone (last
// 4 digits, since a phone number alone isn't a nice handle) or the email's
// local-part — appending a counter on collision.
async function freeUsername(method: OtpMethod, contact: string): Promise<string> {
  const base = method === 'phone' ? 'user' + contact.slice(-4) : contact.split('@')[0];
  let username = base;
  let n = 0;
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.user.findUnique({ where: { username } })) {
    n += 1;
    username = base + n;
  }
  return username;
}

export async function POST(request: Request) {
  try {
    const { method, contact: rawContact, code } = await request.json();
    if (method !== 'phone' && method !== 'email') {
      return NextResponse.json({ error: "method нь 'phone' эсвэл 'email' байх ёстой" }, { status: 400 });
    }
    const contact = normalizeContact(method as OtpMethod, rawContact);
    if (!validateContact(method as OtpMethod, contact) || !code) {
      return NextResponse.json({ error: 'Мэдээлэл дутуу байна' }, { status: 400 });
    }
    const ok = await verifyOtp(method as OtpMethod, contact, String(code));
    if (!ok) throw new ApiError(401, 'Код буруу эсвэл хугацаа дууссан байна');

    let user = await prisma.user.findFirst({
      where: method === 'phone' ? { phoneNumber: contact } : { email: contact },
    });
    if (!user) {
      const username = await freeUsername(method as OtpMethod, contact);
      user = await prisma.user.create({
        data: {
          username,
          phoneNumber: method === 'phone' ? contact : undefined,
          email: method === 'email' ? contact : undefined,
        },
      });
    }
    const token = signToken({ userId: user.id, role: user.role });
    return NextResponse.json({ token, user: publicUser(user) });
  } catch (err) {
    return jsonError(err);
  }
}
