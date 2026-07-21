// Next.js Route Handlers have no Express-style middleware chain, so the old
// requireAuth/requireRole middleware + asyncHandler's error-forwarding both
// collapse into: call these directly at the top of a handler, and catch
// whatever they (or Prisma) throw with jsonError() in each route's catch block.
import { NextResponse } from 'next/server';
import { verifyToken } from './jwt';
import type { JwtPayload, Role } from '../types';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireAuth(request: Request): Promise<JwtPayload> {
  const header = request.headers.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Нэвтрэх шаардлагатай');
  try {
    return verifyToken(token);
  } catch {
    throw new ApiError(401, 'Токен хүчингүй байна');
  }
}

export function requireRole(user: JwtPayload, ...roles: Role[]) {
  if (!roles.includes(user.role)) throw new ApiError(403, 'Энэ үйлдэлд эрхгүй байна');
}

// Mirrors the old Express global error handler's status-code fallback:
// ApiError → its own status; a Cloudinary error carries `http_code`; anything
// else defaults to 500.
export function jsonError(err: unknown): NextResponse {
  console.error(err);
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  const anyErr = err as { http_code?: number; status?: number; message?: string };
  const status = typeof anyErr?.http_code === 'number' ? anyErr.http_code : typeof anyErr?.status === 'number' ? anyErr.status : 500;
  return NextResponse.json({ error: anyErr?.message || 'Дотоод алдаа гарлаа' }, { status });
}
