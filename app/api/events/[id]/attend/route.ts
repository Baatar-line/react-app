import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { requireAuth, jsonError, ApiError } from '../../../../../lib/auth-helpers';

// The "Очно" button on an event, backed for real instead of the local-only
// toggle it used to be — one EventAttendee row per (event, user), so the
// count means something and survives a refresh or a different device.
// Both verbs return the event's fresh total so the caller can show it
// without a second round-trip.

async function countFor(eventId: number) {
  return prisma.eventAttendee.count({ where: { eventId } });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    const eventId = Number((await params).id);
    if (!Number.isFinite(eventId)) throw new ApiError(400, 'Буруу эвент');
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!event) throw new ApiError(404, 'Эвент олдсонгүй');
    // Idempotent — pressing it twice (double click, retry after a flaky
    // network) must not throw on the unique constraint.
    await prisma.eventAttendee.upsert({
      where: { eventId_userId: { eventId, userId: user.userId } },
      update: {},
      create: { eventId, userId: user.userId },
    });
    return NextResponse.json({ attending: true, count: await countFor(eventId) });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    const eventId = Number((await params).id);
    if (!Number.isFinite(eventId)) throw new ApiError(400, 'Буруу эвент');
    // deleteMany, not delete — removing an attendance that isn't there is a
    // no-op rather than a P2025 crash.
    await prisma.eventAttendee.deleteMany({ where: { eventId, userId: user.userId } });
    return NextResponse.json({ attending: false, count: await countFor(eventId) });
  } catch (err) {
    return jsonError(err);
  }
}
