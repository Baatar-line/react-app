import { NextResponse } from 'next/server';
import { cloudinary } from '../../../lib/cloudinary';
import { requireAuth, jsonError } from '../../../lib/auth-helpers';

// Vercel's Serverless Functions hard-cap request bodies at ~4.5MB — fine for
// every other route here, but a multi-MB photo or a background video blows
// past it and gets rejected as a 413 before our own 100MB check ever runs.
// The fix is to never send the file bytes through our own function: this
// route only signs a direct browser → Cloudinary upload (see uploadImage in
// lib/api.ts), so the only thing that crosses Vercel is this tiny JSON call.
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    await requireAuth(request);
    const body = await request.json().catch(() => ({}));
    const folderInput = body?.folder;
    // Callers already pass a fully-qualified folder (e.g. 'bigbang/places') —
    // this used to also prepend 'bigbang/' itself, producing a doubled
    // 'bigbang/bigbang/...' path in Cloudinary for every upload.
    const folder = typeof folderInput === 'string' && folderInput.trim() ? folderInput.trim() : 'bigbang/misc';
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, process.env.CLOUDINARY_API_SECRET as string);
    return NextResponse.json({
      signature, timestamp, folder,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (err) {
    return jsonError(err);
  }
}
