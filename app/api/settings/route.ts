import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireAuth, requireRole, jsonError } from '../../../lib/auth-helpers';
import { destroyCloudinaryImages, orphanedUrls } from '../../../lib/cloudinary';

export async function GET() {
  try {
    const settings = await prisma.siteSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
    return NextResponse.json(settings);
  } catch (err) {
    return jsonError(err);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuth(request);
    requireRole(user, 'admin');
    const { aboutBackgroundImage, homeBackgroundImage, mongoliaFlagImage, suggestBackgroundImages, loaderBackgroundImage, travelAppsBackgroundImages, loginBackgroundImage, teamImages } = await request.json();
    const data = { aboutBackgroundImage, homeBackgroundImage, mongoliaFlagImage, suggestBackgroundImages, loaderBackgroundImage, travelAppsBackgroundImages, loginBackgroundImage, teamImages };
    // Replacing a background leaves the old upload sitting in Cloudinary
    // forever unless it's destroyed here — nothing else ever references it
    // again, since this row holds exactly one URL per background.
    //
    // Each save carries only the background the admin just edited (see saveBg
    // in app/admin/page.tsx), so only the keys actually sent are compared.
    const previous = await prisma.siteSettings.findUnique({ where: { id: 1 } }) as Record<string, unknown> | null;
    const settings = await prisma.siteSettings.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });
    if (previous) {
      await destroyCloudinaryImages(
        Object.entries(data)
          .filter(([, next]) => next !== undefined)
          .flatMap(([key, next]) => orphanedUrls(previous[key], next)),
      );
    }
    return NextResponse.json(settings);
  } catch (err) {
    return jsonError(err);
  }
}
