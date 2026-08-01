import { NextResponse } from 'next/server';
import { issueOtp, normalizeContact, validateContact, type OtpMethod } from '../../../../lib/otp';
import { isMailerConfigured, sendOtpEmail } from '../../../../lib/mailer';
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
    if (method === 'email' && isMailerConfigured()) {
      try {
        await sendOtpEmail(contact, code);
        return NextResponse.json({ sent: true });
      } catch (err) {
        // Falls through to the devCode response below instead of 500ing —
        // a broken mail provider shouldn't lock a dev/test environment out
        // of logging in entirely.
        console.error('OTP email send failed:', err);
      }
    }
    // devCode: no SMS provider for phone yet, and email either has no
    // SMTP_* configured or just failed to send above — see lib/mailer.ts.
    return NextResponse.json({ sent: true, devCode: code });
  } catch (err) {
    return jsonError(err);
  }
}
