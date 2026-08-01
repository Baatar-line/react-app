// Real per-user session (OTP sign-in — see /api/auth/request-otp,
// verify-otp), separate from lib/api.ts's bootstrapped dev-admin token.
// Stored under its own key so the two never collide. Read directly from
// localStorage (not React context/state) since every page that needs it —
// BigBangLayout, /login, the in-flow UserAuthForm modal — reads/writes
// independently rather than sharing one component tree.
import type { Role } from '../types';

const SESSION_KEY = 'bb_session';

export interface SessionUser {
  id: number;
  // Only one of email/phoneNumber is ever guaranteed set — an OTP account
  // only has whichever contact method (phone or email) it signed up with.
  email: string | null;
  username: string;
  phoneNumber: string | null;
  role: Role;
}

export interface Session {
  token: string;
  user: SessionUser;
}

export function saveSession(token: string, user: SessionUser): void {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user })); } catch (err) { /* ignore */ }
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.token || !parsed?.user) return null;
    return parsed as Session;
  } catch (err) {
    return null;
  }
}

export function clearSession(): void {
  try { localStorage.removeItem(SESSION_KEY); } catch (err) { /* ignore */ }
}
