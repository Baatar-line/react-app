import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

const CLOUDINARY_URL_RE = /^https:\/\/res\.cloudinary\.com\/[^/]+\/(image|video)\/upload\/(?:v\d+\/)?(.+)$/;

// A stored URL is Cloudinary's own `secure_url` from the upload response
// (see uploadImage in lib/api.ts) — always `.../<image|video>/upload/v<n>/<publicId>.<ext>`,
// never one of imgUrl()'s transformed variants (those only exist at render time).
function publicIdFromUrl(url: string): { publicId: string; resourceType: 'image' | 'video' } | null {
  const m = url.match(CLOUDINARY_URL_RE);
  if (!m) return null;
  const rest = m[2].split(/[?#]/)[0];
  const dot = rest.lastIndexOf('.');
  return { publicId: dot > -1 ? rest.slice(0, dot) : rest, resourceType: m[1] as 'image' | 'video' };
}

// Which of `previous`'s URLs a save just orphaned — i.e. what it still
// pointed at that `next` no longer does. Handles a plain URL and a slug → URL
// JSON map alike, since SiteSettings stores backgrounds both ways (a single
// `homeBackgroundImage` string, but `teamImages`/`suggestBackgroundImages`
// maps keyed by member/card slug).
//
// Callers must only pass fields the request actually sent: an absent field
// arrives as undefined and means "unchanged", which is indistinguishable here
// from "cleared" and would otherwise destroy an image still in use.
export function orphanedUrls(previous: unknown, next: unknown): string[] {
  if (typeof previous === 'string') return previous && previous !== next ? [previous] : [];
  if (!previous || typeof previous !== 'object') return [];
  const nextMap = (next && typeof next === 'object' ? next : {}) as Record<string, unknown>;
  return Object.entries(previous as Record<string, unknown>)
    .filter(([slug, url]) => typeof url === 'string' && url && url !== nextMap[slug])
    .map(([, url]) => url as string);
}

// Best-effort delete — deleting the DB row is what actually matters, so a
// Cloudinary hiccup here (rate limit, already-gone asset, etc.) is logged and
// swallowed rather than failing the whole request.
export async function destroyCloudinaryImages(urls: (string | null | undefined)[]): Promise<void> {
  await Promise.all(urls.map(async (url) => {
    if (!url) return;
    const parsed = publicIdFromUrl(url);
    if (!parsed) return;
    try {
      await cloudinary.uploader.destroy(parsed.publicId, { resource_type: parsed.resourceType });
    } catch (err) {
      console.error('Cloudinary destroy failed for', url, err);
    }
  }));
}
