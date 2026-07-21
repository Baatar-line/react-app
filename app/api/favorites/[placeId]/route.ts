import { prisma } from '../../../../lib/prisma';
import { requireAuth, jsonError } from '../../../../lib/auth-helpers';

export async function DELETE(request: Request, { params }: { params: Promise<{ placeId: string }> }) {
  try {
    const user = await requireAuth(request);
    const { placeId } = await params;
    await prisma.favorite.delete({ where: { userId_placeId: { userId: user.userId, placeId } } }).catch(() => null);
    return new Response(null, { status: 204 });
  } catch (err) {
    return jsonError(err);
  }
}
