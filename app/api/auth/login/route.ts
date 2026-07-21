import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { comparePassword } from '../../../../lib/password';
import { signToken } from '../../../../lib/jwt';
import { jsonError } from '../../../../lib/auth-helpers';

function publicUser(user: { id: number; email: string; username: string; phoneNumber: string | null; role: string }) {
  return { id: user.id, email: user.email, username: user.username, phoneNumber: user.phoneNumber, role: user.role };
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
    const ok = user ? await comparePassword(password ?? '', user.password) : false;
    if (!user || !ok) {
      return NextResponse.json({ error: 'Имэйл эсвэл нууц үг буруу байна' }, { status: 401 });
    }
    const token = signToken({ userId: user.id, role: user.role as 'user' | 'host' | 'admin' });
    return NextResponse.json({ token, user: publicUser(user) });
  } catch (err) {
    return jsonError(err);
  }
}
