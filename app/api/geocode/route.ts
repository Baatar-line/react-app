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

// Latin → Cyrillic for Mongolian, so typing "talbai" or "suhbaatar" finds
// "талбай" / "Сүхбаатар". Nominatim indexes Mongolian places under their
// Cyrillic names, so a Latin query matches nothing at all without this.
// Digraphs come first (longest match wins) — "ch"/"sh"/"ts" would otherwise
// each decompose into two wrong letters.
//
// The mapping is deliberately lossy in the forgiving direction: Mongolian
// Latin transliteration has no single standard (Сүхбаатар is written
// Sukhbaatar / Suhbaatar / Sükhbaatar), and both о/ө and у/ү collapse onto
// bare o/u. It doesn't need to be exact — the transliterated string is only
// ever one of two queries whose results get merged, so a near-miss still has
// the original spelling's results to fall back on, and the ranking below
// sorts out which is actually relevant.
const TRANSLIT: [string, string][] = [
  ['sh', 'ш'], ['ch', 'ч'], ['ts', 'ц'], ['ya', 'я'], ['yo', 'ё'], ['yu', 'ю'],
  ['kh', 'х'], ['zh', 'ж'], ['ai', 'ай'], ['ei', 'эй'], ['oi', 'ой'], ['ui', 'уй'],
  ['ee', 'ээ'], ['oo', 'оо'], ['uu', 'уу'], ['aa', 'аа'], ['ii', 'ий'],
  ['a', 'а'], ['b', 'б'], ['v', 'в'], ['g', 'г'], ['d', 'д'], ['e', 'э'],
  ['z', 'з'], ['i', 'и'], ['j', 'ж'], ['k', 'к'], ['l', 'л'], ['m', 'м'],
  ['n', 'н'], ['o', 'о'], ['p', 'п'], ['r', 'р'], ['s', 'с'], ['t', 'т'],
  ['u', 'у'], ['f', 'ф'], ['h', 'х'], ['c', 'ц'], ['w', 'в'], ['x', 'х'], ['y', 'й'],
];

function toCyrillic(s: string): string {
  const lower = s.toLowerCase();
  let out = '';
  let i = 0;
  while (i < lower.length) {
    const two = TRANSLIT.find(([latin]) => latin.length === 2 && latin === lower.slice(i, i + 2));
    if (two) { out += two[1]; i += 2; continue; }
    const one = TRANSLIT.find(([latin]) => latin.length === 1 && latin === lower[i]);
    out += one ? one[1] : lower[i];
    i += 1;
  }
  return out;
}

const HAS_CYRILLIC = /[Ѐ-ӿ]/;
const HAS_LATIN_LETTER = /[a-z]/i;

interface Row { name: string; label: string; lat: number; lng: number; importance: number; }

// Typing "сүхбаатарын талбай" sends a query at almost every pause, and each
// one fans out to two upstream calls (original + transliteration) — well past
// what Nominatim's 1-req/sec usage policy is happy with. A short-lived cache
// absorbs the repeats: re-typing, backspacing, or a second person searching
// the same thing all hit memory. Serverless instances don't share this, so
// it's a courtesy buffer rather than a hard rate limit.
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; rows: any[] }>();

async function nominatim(q: string): Promise<any[]> {
  const hit = cache.get(q);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.rows;
  // limit is well above what's shown — the ranking below needs candidates to
  // choose between, and Nominatim's own order puts "Сүхбаатарын талбай" well
  // behind a handful of anonymous fields for a query like "талбай".
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=25&dedupe=1&namedetails=1&accept-language=mn&countrycodes=mn&q=${encodeURIComponent(q)}`,
    { headers: { 'User-Agent': 'BigBang-Mongolia-App/1.0 (contact: admin@bigbang.mn)' } },
  );
  if (!res.ok) throw new ApiError(res.status, 'Байршил хайхад алдаа гарлаа');
  const body = await res.json();
  const rows = Array.isArray(body) ? body : [];
  cache.set(q, { at: Date.now(), rows });
  // Bounded so a long-lived instance can't grow this without limit; oldest
  // insertion goes first (Map preserves insertion order).
  if (cache.size > 300) cache.delete(cache.keys().next().value as string);
  return rows;
}

// ө/ү (and ё) fold onto their plain counterparts before any comparison:
// Latin transliteration can't tell them apart ("sukhbaatar" becomes
// "сухбаатар", never "сүхбаатар"), and people typing Cyrillic drop the
// diacritic-looking letters just as often.
function fold(s: string): string {
  return s.toLowerCase().replace(/ө/g, 'о').replace(/ү/g, 'у').replace(/ё/g, 'е');
}

// How well a result's own name answers the query. Used as a coarse tier, not
// as the primary sort — see the ordering note below.
function scoreOf(name: string, address: string, q: string): number {
  const n = fold(name);
  const a = fold(address);
  const needle = fold(q);
  if (n === needle) return 0;
  if (n.startsWith(needle)) return 1;
  // Word-boundary hit inside the name ("Сүхбаатарын талбай" for "талбай").
  if (n.split(/[\s,\-]+/).some((w) => w.startsWith(needle))) return 2;
  if (n.includes(needle)) return 3;
  if (a.includes(needle)) return 4;
  return 5;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    if (!q) throw new ApiError(400, 'Хайх утга оруулна уу');

    // countrycodes=mn — this picker is only ever placing a pin inside
    // Mongolia, but Nominatim's free-text search has no country bias by
    // default, so a generic word (e.g. "талбай", just Mongolian for
    // "square/area") could just as easily match an unrelated result
    // anywhere else in the world with a similar name.
    //
    // A Latin query is also run through its Cyrillic transliteration and both
    // result sets are merged — "sukhbaatar" alone finds almost nothing,
    // "сүхбаатар" finds everything.
    const queries = [q];
    const translit = HAS_LATIN_LETTER.test(q) && !HAS_CYRILLIC.test(q) ? toCyrillic(q) : '';
    if (translit && translit !== q.toLowerCase()) queries.push(translit);

    const settled = await Promise.all(queries.map((query) => nominatim(query).catch(() => [])));
    if (settled.every((s) => s.length === 0)) return NextResponse.json([]);

    // Both spellings can surface the same OSM object — key on coordinates so
    // it's listed once.
    const byKey = new Map<string, Row>();
    settled.flat().forEach((r: any) => {
      const full = stripTraditionalScript(r.display_name as string);
      if (!full) return;
      const [head, ...rest] = full.split(',');
      const key = `${Number(r.lat).toFixed(5)},${Number(r.lon).toFixed(5)}`;
      if (byKey.has(key)) return;
      byKey.set(key, {
        name: (r.namedetails?.name && stripTraditionalScript(r.namedetails.name)) || head.trim(),
        label: rest.join(',').trim(),
        lat: Number(r.lat),
        lng: Number(r.lon),
        importance: Number(r.importance) || 0,
      });
    });

    // Scored against whichever spelling the user actually typed *and* its
    // transliteration, taking the better of the two.
    const needles = [q.toLowerCase(), translit].filter(Boolean);
    const scored = Array.from(byKey.values())
      .map((row) => ({ row, score: Math.min(...needles.map((n) => scoreOf(row.name, row.label, n))) }));

    // Ordering, in three steps:
    //
    // 1. Anything whose *name* matches outranks anything that only matched on
    //    its address — otherwise a query can be answered by a place that
    //    isn't called that at all.
    // 2. Inside that, prominence (OSM's `importance`) decides. This is the
    //    step that fixes the case this ranking exists for: searching "талбай"
    //    used to bury Сүхбаатарын талбай (importance .34, place/square)
    //    under half a dozen anonymous fields and pitches literally named
    //    "талбай" — an exact string match, but never what anyone means. Match
    //    quality can't lead here, because for a generic word the least
    //    interesting results are always the most exact ones.
    // 3. A multi-word query is specific enough that an exact hit *is* the
    //    answer ("Sky Lounge 21" should not lose to a more famous lounge), so
    //    exactness is promoted ahead of prominence there — but not for a
    //    single generic word, where step 2 has to stay in charge.
    const multiWord = q.trim().split(/\s+/).length > 1;
    const ranked = scored
      .sort((a, b) => {
        const tierA = a.score <= 3 ? 0 : 1;
        const tierB = b.score <= 3 ? 0 : 1;
        if (tierA !== tierB) return tierA - tierB;
        if (multiWord && (a.score === 0) !== (b.score === 0)) return a.score === 0 ? -1 : 1;
        return b.row.importance - a.row.importance || a.score - b.score;
      })
      .slice(0, 8)
      .map(({ row }) => ({ name: row.name, label: row.label, lat: row.lat, lng: row.lng }));

    return NextResponse.json(ranked);
  } catch (err) {
    return jsonError(err);
  }
}
