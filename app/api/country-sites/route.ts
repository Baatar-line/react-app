import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get('country')?.trim();
  const rows = await prisma.countrySite.findMany({
    where: country ? { country: { equals: country, mode: 'insensitive' } } : undefined,
    orderBy: [{ country: 'asc' }, { position: 'asc' }],
    select: { country: true, countryId: true, position: true, name: true, kind: true, imageUrl: true, sourceUrl: true, latitude: true, longitude: true },
  });
  return NextResponse.json(rows, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
}
