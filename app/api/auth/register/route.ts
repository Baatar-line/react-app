import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { hashPassword } from '../../../../lib/password';
import { signToken } from '../../../../lib/jwt';
import { jsonError } from '../../../../lib/auth-helpers';

function publicUser(user: { id: number; email: string; username: string; phoneNumber: string | null; role: string }) {
  return { id: user.id, email: user.email, username: user.username, phoneNumber: user.phoneNumber, role: user.role };
}

export async function POST(request: Request) {
  try {
    const { email, password, username, phoneNumber, role } = await request.json();
    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Имэйл, нууц үг, хэрэглэгчийн нэр шаардлагатай' }, { status: 400 });
    }
    if (String(password).length < 8) {
      return NextResponse.json({ error: 'Нууц үг дор хаяж 8 тэмдэгт байх ёстой' }, { status: 400 });
    }
    // Public signup can only ever create a plain user or self-serve a host
    // account ("Host болох") — 'admin' is never assignable from this route,
    // no matter what a request body claims.
    const safeRole = role === 'host' ? 'host' : 'user';
    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (existing) {
      return NextResponse.json({ error: 'Энэ имэйл эсвэл хэрэглэгчийн нэр аль хэдийн бүртгэлтэй' }, { status: 409 });
    }
    const user = await prisma.user.create({
      data: { email, username, phoneNumber, role: safeRole, password: await hashPassword(password) },
    });
    const token = signToken({ userId: user.id, role: user.role as 'user' | 'host' | 'admin' });
    return NextResponse.json({ token, user: publicUser(user) }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
