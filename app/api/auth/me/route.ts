import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, jsonError, ApiError } from '../../../../lib/auth-helpers';

export async function GET(request: Request) {
  try {
    const authUser = await requireAuth(request);
    const user = await prisma.user.findUnique({ where: { id: authUser.userId }, include: { profile: true } });
    if (!user) throw new ApiError(404, 'Хэрэглэгч олдсонгүй');
    const { password: _password, profile, ...rest } = user;
    return NextResponse.json({ ...rest, profile });
  } catch (err) {
    return jsonError(err);
  }
}
