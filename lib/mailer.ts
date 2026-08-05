// Real email delivery for OTP codes via SMTP (nodemailer) — see lib/otp.ts
// for code generation/verification. Phone OTPs still have no SMS provider
// wired up, so request-otp/route.ts keeps its dev-code fallback for those;
// email OTPs use this once SMTP_* env vars are set.
import nodemailer from 'nodemailer';

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

export function isMailerConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `Atlas нэвтрэх код: ${code}`,
    text: `Таны нэвтрэх код: ${code}\n\nЭнэ код 5 минутын дараа хүчингүй болно. Хэрэв та энэ хүсэлтийг илгээгээгүй бол энэ имэйлийг үл тоомсорлоорой.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:28px 24px;background:#171410;border-radius:16px;color:#f2ede3">
        <div style="font-size:14px;font-weight:800;letter-spacing:-0.02em;color:#E8B84B;margin-bottom:18px">atlas</div>
        <p style="font-size:13px;color:rgba(242,237,227,.7);margin:0 0 16px">Таны нэвтрэх код:</p>
        <div style="font-size:34px;font-weight:800;letter-spacing:.14em;color:#f2ede3;margin-bottom:16px">${code}</div>
        <p style="font-size:12px;color:rgba(242,237,227,.5);margin:0">Энэ код 5 минутын дараа хүчингүй болно. Хэрэв та энэ хүсэлтийг илгээгээгүй бол энэ имэйлийг үл тоомсорлоорой.</p>
      </div>
    `,
  });
}
