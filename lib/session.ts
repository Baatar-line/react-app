// Real per-user session (host/admin self-serve login), separate from
// lib/api.ts's bootstrapped dev-admin token. Stored under its own key so the
// two never collide, and read directly from localStorage rather than React
// context/state since the "Host болох" flow (inside BigBangLayout, under the
// (bigbang) route group) and /host (its own top-level page, not wrapped by
// that layout) don't share a component tree to pass state through.
import type { Role } from '../types';

const SESSION_KEY = 'bb_session';

export interface SessionUser {
  id: number;
  email: string;
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
