import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth, jsonError } from '../../../../lib/auth-helpers';

// Which events *this* session has pressed "Очно" on — the same split
// GET /favorites uses: the public list carries the counts, and this authed
// companion carries only the caller's own rows, so the button can come back
// pre-pressed after a refresh without the public payload ever revealing who
// is attending what.
export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const rows = await prisma.eventAttendee.findMany({
      where: { userId: user.userId },
      select: { eventId: true },
    });
    return NextResponse.json(rows.map((r) => r.eventId));
  } catch (err) {
    return jsonError(err);
  }
}
