import { NextResponse } from 'next/server';
import { ApiError, jsonError } from '../../../lib/auth-helpers';

// Google Maps' shortened share links (maps.app.goo.gl, goo.gl/maps) don't
// carry coordinates themselves — only the page they redirect to does (as an
// "@lat,lng,zoom" or "q=lat,lng" segment in the resolved URL). A browser
// can't follow that redirect itself (CORS), so this route does it
// server-side and just returns the coordinates it finds.
const SHORT_LINK_RE = /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl)\//i;
const COORD_RE = /@(-?\d+\.\d+),(-?\d+\.\d+)|[?&](?:q|ll|query)=(-?\d+\.\d+),(-?\d+\.\d+)/;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = (searchParams.get('url') || '').trim();
    if (!SHORT_LINK_RE.test(url)) throw new ApiError(400, 'Зөвхөн maps.app.goo.gl эсвэл goo.gl/maps холбоос дэмжигдэнэ');

    const res = await fetch(url, { redirect: 'follow' });
    const finalUrl = res.url || url;
    const m = finalUrl.match(COORD_RE);
    if (!m) throw new ApiError(404, 'Энэ холбоосоос байршлын координат олдсонгүй — Google Maps дээрх бүтэн URL-ийг (Copy link) хуулж туршина уу');

    const lat = Number(m[1] ?? m[3]);
    const lng = Number(m[2] ?? m[4]);
    return NextResponse.json({ lat, lng });
  } catch (err) {
    return jsonError(err);
  }
}
