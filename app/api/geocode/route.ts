import { NextResponse } from 'next/server';
import { ApiError, jsonError } from '../../../lib/auth-helpers';

// OSM's Mongolia data tags many places with both the modern Cyrillic name
// and the classical vertical script (Unicode "Mongolian" block, U+1800–
// U+18AF) crammed into the same name — accept-language=mn cuts down on it,
// but Nominatim still leaks the vertical script through on some results, so
// strip it outright plus whatever separator punctuation it leaves behind.
function stripTraditionalScript(s: string): string {
  return s
    .replace(/[᠀-᢯]+/g, '')
    .replace(/\s*\/\s*/g, '')
    .replace(/\s+,/g, ',')
    .replace(/,\s*,/g, ',')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,]+|[\s,]+$/g, '')
    .trim();
}

// Free-text place/address search for the map picker in CreateForm (separate
// from the what3words lookup, which only resolves exact 3-word addresses).
// Proxied through our own route instead of called directly from the browser
// because Nominatim's usage policy requires a real, identifying User-Agent —
// something only a server-side fetch can reliably set.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    if (!q) throw new ApiError(400, 'Хайх утга оруулна уу');

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=mn&q=${encodeURIComponent(q)}`,
      { headers: { 'User-Agent': 'BigBang-Mongolia-App/1.0 (contact: admin@bigbang.mn)' } },
    );
    if (!res.ok) throw new ApiError(res.status, 'Байршил хайхад алдаа гарлаа');
    const body = await res.json();

    return NextResponse.json(
      (Array.isArray(body) ? body : []).map((r: any) => ({
        name: stripTraditionalScript(r.display_name as string),
        lat: Number(r.lat),
        lng: Number(r.lon),
      })),
    );
  } catch (err) {
    return jsonError(err);
  }
}
