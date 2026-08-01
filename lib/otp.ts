// One-time login codes — see prisma/schema.prisma's OtpCode model for why
// this is DB-backed rather than in-memory (serverless functions don't share
// process memory). Dev-mode only for now: request-otp returns the code
// directly instead of actually sending an SMS/email (no provider wired up
// yet) — swap that one response field for a real send step later; nothing
// here needs to change since verification is already fully real.
import bcrypt from 'bcrypt';
import { prisma } from './prisma';

export type OtpMethod = 'phone' | 'email';

const CODE_LENGTH = 4;
const EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const SALT_ROUNDS = 10;

export function normalizeContact(method: OtpMethod, raw: string): string {
  const v = (raw || '').trim();
  return method === 'email' ? v.toLowerCase() : v;
}

export function validateContact(method: OtpMethod, contact: string): boolean {
  if (method === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  return /^\d{8}$/.test(contact);
}

function generateCode(): string {
  const min = 10 ** (CODE_LENGTH - 1);
  const max = 10 ** CODE_LENGTH;
  return String(Math.floor(min + Math.random() * (max - min)));
}

// Invalidates any still-live earlier code for this contact before issuing a
// new one, so only the most recently requested code ever verifies.
export async function issueOtp(method: OtpMethod, contact: string): Promise<string> {
  const code = generateCode();
  const codeHash = await bcrypt.hash(code, SALT_ROUNDS);
  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);
  await prisma.otpCode.updateMany({ where: { contact, method, consumed: false }, data: { consumed: true } });
  await prisma.otpCode.create({ data: { contact, method, codeHash, expiresAt } });
  return code;
}

export async function verifyOtp(method: OtpMethod, contact: string, code: string): Promise<boolean> {
  const row = await prisma.otpCode.findFirst({
    where: { contact, method, consumed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!row || row.attempts >= MAX_ATTEMPTS) return false;
  const ok = await bcrypt.compare(code, row.codeHash);
  if (!ok) {
    await prisma.otpCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    return false;
  }
  await prisma.otpCode.update({ where: { id: row.id }, data: { consumed: true } });
  return true;
}
