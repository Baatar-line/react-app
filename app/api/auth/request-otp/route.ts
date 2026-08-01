import { NextResponse } from 'next/server';
import { issueOtp, normalizeContact, validateContact, type OtpMethod } from '../../../../lib/otp';
import { jsonError } from '../../../../lib/auth-helpers';

export async function POST(request: Request) {
  try {
    const { method, contact: rawContact } = await request.json();
    if (method !== 'phone' && method !== 'email') {
      return NextResponse.json({ error: "method нь 'phone' эсвэл 'email' байх ёстой" }, { status: 400 });
    }
    const contact = normalizeContact(method as OtpMethod, rawContact);
    if (!validateContact(method as OtpMethod, contact)) {
      return NextResponse.json(
        { error: method === 'phone' ? 'Утасны дугаар 8 оронтой тоо байх ёстой — жишээ: 99112233' : 'Имэйл хаяг буруу байна — жишээ: tanii@email.mn' },
        { status: 400 },
      );
    }
    const code = await issueOtp(method as OtpMethod, contact);
    // devCode: no SMS/email provider connected yet — see lib/otp.ts.
    return NextResponse.json({ sent: true, devCode: code });
  } catch (err) {
    return jsonError(err);
  }
}
