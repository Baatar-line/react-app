import { NextResponse } from 'next/server';
import { ApiError, jsonError } from '../../../lib/auth-helpers';

// Accepts a bare "word.word.word" address, a "///word.word.word" address, or
// a full what3words.com URL and pulls out just the three-word part.
const W3W_RE = /([a-z]+\.[a-z]+\.[a-z]+)\s*$/i;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = process.env.W3W_API_KEY;
    if (!apiKey) throw new ApiError(500, 'W3W_API_KEY тохируулаагүй байна — .env.local-д нэмнэ үү (developer.what3words.com)');

    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (lat != null && lng != null) {
      // Reverse: a map click's coordinates -> the 3-word address for that
      // exact 3m square, same as clicking the what3words.com map itself.
      const res = await fetch(
        `https://api.what3words.com/v3/convert-to-3wa?coordinates=${encodeURIComponent(lat)},${encodeURIComponent(lng)}&key=${apiKey}`
      );
      const body = await res.json();
      if (!res.ok) throw new ApiError(res.status, body?.error?.message || 'what3words хайлт амжилтгүй боллоо');
      return NextResponse.json({ words: body.words, nearestPlace: body.nearestPlace, country: body.country });
    }

    const raw = (searchParams.get('words') || '').trim();
    const match = raw.match(W3W_RE);
    if (!match) throw new ApiError(400, 'what3words хаяг зөв бус байна (жишээ: hydration.pounces.loose)');
    const words = match[1].toLowerCase();

    const res = await fetch(
      `https://api.what3words.com/v3/convert-to-coordinates?words=${encodeURIComponent(words)}&key=${apiKey}`
    );
    const body = await res.json();
    if (!res.ok) throw new ApiError(res.status, body?.error?.message || 'what3words хайлт амжилтгүй боллоо');

    return NextResponse.json({
      lat: body.coordinates.lat,
      lng: body.coordinates.lng,
      words: body.words,
      nearestPlace: body.nearestPlace,
      country: body.country,
    });
  } catch (err) {
    return jsonError(err);
  }
}
