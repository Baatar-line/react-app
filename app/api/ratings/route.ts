import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { jsonError } from '../../../lib/auth-helpers';
import { verifyToken } from '../../../lib/jwt';

// Anonymous visitors still get the average — only "mine" needs a real
// session — so auth here is optional, not required (contrast requireAuth).
function optionalUserId(request: Request): number | undefined {
  const header = request.headers.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return undefined;
  try {
    return verifyToken(token).userId;
  } catch {
    return undefined;
  }
}

async function summarize(targetKey: string, userId?: number) {
  const [agg, mine] = await Promise.all([
    prisma.rating.aggregate({ where: { targetKey }, _avg: { score: true }, _count: true }),
    userId != null
      ? prisma.rating.findUnique({ where: { userId_targetKey: { userId, targetKey } } })
      : Promise.resolve(null),
  ]);
  return {
    average: agg._avg.score != null ? Math.round(agg._avg.score * 10) / 10 : null,
    count: agg._count,
    mine: mine?.score ?? null,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetKey = searchParams.get('targetKey');
    if (!targetKey) return NextResponse.json({ error: 'targetKey шаардлагатай' }, { status: 400 });
    return NextResponse.json(await summarize(targetKey, optionalUserId(request)));
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(request: Request) {
  try {
    const userId = optionalUserId(request);
    if (userId == null) return NextResponse.json({ error: 'Нэвтрэх шаардлагатай' }, { status: 401 });
    const { targetKey, score } = await request.json();
    if (!targetKey || typeof score !== 'number' || !Number.isInteger(score) || score < 1 || score > 5) {
      return NextResponse.json({ error: 'targetKey, score (1-5 бүхэл тоо) шаардлагатай' }, { status: 400 });
    }
    await prisma.rating.upsert({
      where: { userId_targetKey: { userId, targetKey } },
      update: { score },
      create: { userId, targetKey, score },
    });
    return NextResponse.json(await summarize(targetKey, userId), { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
