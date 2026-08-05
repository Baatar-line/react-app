/**
 * Builds the globe's 206-country × 6-card archive in Neon. Only compact text
 * metadata and remote Wikimedia thumbnail URLs are stored; no image bytes.
 */
import { prisma } from '../lib/prisma';
import { FAMOUS_SITES } from '../components/bigbang/data';

type RestCountry = { cca2: string; ccn3?: string; name: { common: string }; capital?: string[]; unMember: boolean };
type CountrySource = { cca2: string; ccn3?: string; name: { common: string }; capital?: string[]; unMember?: boolean; status?: string };
type WikiPage = { title: string; thumbnail?: { source: string }; fullurl?: string };
type DataItem = { name: string; imageUrl: string; sourceUrl: string; base: string; kind: 'culture' | 'nature' };

const EXTRA = new Set(['PS', 'VA', 'TW', 'XK', 'EH', 'CK', 'NU', 'HK', 'MO', 'PR', 'GL', 'FO', 'AW']);
const RETRY_COUNTRIES = new Set(['eSwatini', 'Costa Rica', 'Cyprus', 'Hong Kong', 'Kosovo', 'Macau', 'Malta', 'Niue', 'Macedonia', 'Puerto Rico', 'Denmark', 'Luxembourg', 'Iran', 'Nigeria', 'Syria', 'Serbia', 'Tuvalu', 'Romania', 'Slovakia', 'W. Sahara', 'Poland', 'Uzbekistan', 'Vatican City', 'Taiwan', 'Ukraine']);
const HAND_SITES: Record<string, string[]> = {
  'eSwatini': ['Lobamba', 'Umhlanga (ceremony)', 'Ngwenya Mine', 'Malolotja Nature Reserve', 'Sibebe', 'Hlane Royal National Park'],
  'Hong Kong': ['Victoria Harbour', 'Tian Tan Buddha', 'Man Mo Temple', 'Victoria Peak', 'Hong Kong UNESCO Global Geopark', "Dragon's Back"],
  'Macau': ['Senado Square', "Ruins of Saint Paul's", 'A-Ma Temple', 'Coloane', 'Hac Sa Beach', 'Guia Hill'],
  'Niue': ['Alofi', 'Talava Arches', 'Huanaki Cultural Centre', 'Limu Pools', 'Niue', 'Avatele'],
  'Puerto Rico': ['San Juan, Puerto Rico', 'Old San Juan', 'Castillo San Felipe del Morro', 'El Yunque National Forest', 'Flamenco Beach', 'Cueva Ventana'],
  'Vatican City': ["Saint Peter's Square", 'Sistine Chapel', 'Vatican Museums', 'Vatican Gardens', 'Vatican Hill', 'Belvedere Courtyard'],
  'Tuvalu': ['Funafuti', 'Tuvalu Philatelic Bureau', 'Fetu Ao Lima Church', 'Funafuti Conservation Area', 'Fongafale', 'Nanumea'],
  'Nigeria': ['Abuja', 'Osun-Osogbo', 'Sukur Cultural Landscape', 'Yankari National Park', 'Zuma Rock', 'Obudu Plateau'],
};
// EXTRA contains 13 candidates; CK/NU are UN-associated sovereign states. We
// deterministically stop at 206 after all 193 UN members + Palestine/Vatican.
const WIKI = 'https://en.wikipedia.org/w/api.php';

async function wikiSearch(query: string, limit = 10): Promise<WikiPage[]> {
  await Bun.sleep(350);
  const url = new URL(WIKI);
  url.search = new URLSearchParams({ action: 'query', format: 'json', origin: '*', generator: 'search',
    gsrsearch: query, gsrlimit: String(limit), prop: 'pageimages|info', piprop: 'thumbnail', pithumbsize: '960', inprop: 'url' }).toString();
  let response: Response | undefined;
  for (let attempt = 0; attempt < 8; attempt++) {
    response = await fetch(url, { headers: { 'User-Agent': 'AtlasTravelArchive/1.0 (contact: admin@bigbang.mn)', Accept: 'application/json' } });
    if (response.ok) break;
    if (response.status !== 429 && response.status < 500) throw new Error(`Wikipedia ${response.status}: ${await response.text()}`);
    await Bun.sleep(Math.min(120_000, 15_000 * (attempt + 1)));
  }
  if (!response?.ok) throw new Error(`Wikipedia remained unavailable (${response?.status})`);
  const json = await response.json() as any;
  return Object.values(json.query?.pages || {}).filter((p: any) => p.thumbnail?.source) as WikiPage[];
}

const BAD_RESULT = /^(list of|tourism in|geography of|outline of)|\b(airlines?|airways|airport|football|soccer|cricket|rugby|club|national team|flag|coat of arms|map|province|district|municipality|election|politician|company|bank|television|newspaper|visit)\b/i;
const normName = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');

function pick(pages: WikiPage[], used: Set<string>, count: number) {
  const out: WikiPage[] = [];
  for (const p of pages) {
    if (used.has(p.title) || BAD_RESULT.test(p.title)) continue;
    used.add(p.title); out.push(p);
    if (out.length === count) break;
  }
  return out;
}

function commonsThumb(filePath: string) {
  const filename = decodeURIComponent(filePath.split('/Special:FilePath/')[1] || '').replace(/\?/g, '%3F');
  return `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(filename)}?width=960`;
}

async function wikidataSites(cca2: string): Promise<{ capitalImage?: string; items: DataItem[] }> {
  const query = `SELECT DISTINCT ?capitalImage ?item ?itemLabel ?image ?base ?kind WHERE {
    ?country wdt:P297 "${cca2}". OPTIONAL { ?country wdt:P36 ?capital. ?capital wdt:P18 ?capitalImage. }
    { SELECT ?country ?item ?image ?base ?kind WHERE {
      ?country wdt:P297 "${cca2}".
      VALUES ?base { wd:Q33506 wd:Q23413 wd:Q4989906 wd:Q839954 wd:Q24398318 wd:Q570116 }
      ?item wdt:P17 ?country; wdt:P18 ?image; wdt:P31/wdt:P279* ?base. BIND("culture" AS ?kind) } LIMIT 50 }
    UNION
    { SELECT ?country ?item ?image ?base ?kind WHERE {
      ?country wdt:P297 "${cca2}".
      VALUES ?base { wd:Q46169 wd:Q8502 wd:Q23397 wd:Q4022 wd:Q35509 wd:Q46831 wd:Q4421 wd:Q34038 wd:Q23442 wd:Q165 wd:Q22698 wd:Q1107656 wd:Q39594 wd:Q473972 wd:Q8072 wd:Q170321 wd:Q33837 wd:Q167346 }
      ?item wdt:P17 ?country; wdt:P18 ?image; wdt:P31/wdt:P279* ?base. BIND("nature" AS ?kind) } LIMIT 70 }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  }`;
  const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;
  let response: Response | undefined;
  for (let attempt = 0; attempt < 6; attempt++) {
    response = await fetch(url, { headers: { 'User-Agent': 'AtlasTravelArchive/1.0', Accept: 'application/sparql-results+json' } });
    if (response.ok) break;
    if (response.status < 500 && response.status !== 429) break;
    await Bun.sleep(5_000 * (attempt + 1));
  }
  if (!response?.ok) throw new Error(`Wikidata ${response?.status}`);
  const bindings = ((await response.json()) as any).results?.bindings || [];
  const seen = new Set<string>();
  const items: DataItem[] = [];
  for (const b of bindings) {
    const name = b.itemLabel?.value;
    const key = name && normName(name);
    if (!name || /^Q\d+$/.test(name) || BAD_RESULT.test(name) || seen.has(key)) continue;
    seen.add(key);
    items.push({ name, imageUrl: commonsThumb(b.image.value), sourceUrl: b.item.value, base: b.base.value.split('/').pop(), kind: b.kind.value });
  }
  return { capitalImage: bindings[0]?.capitalImage?.value ? commonsThumb(bindings[0].capitalImage.value) : undefined, items };
}

async function wikidataFallback(cca2: string): Promise<DataItem[]> {
  const query = `SELECT DISTINCT ?item ?itemLabel ?image WHERE {
    ?country wdt:P297 "${cca2}". ?item wdt:P17 ?country; wdt:P18 ?image.
    FILTER NOT EXISTS { ?item wdt:P31/wdt:P279* wd:Q5 }
    FILTER NOT EXISTS { ?item wdt:P31/wdt:P279* wd:Q486972 }
    FILTER NOT EXISTS { ?item wdt:P31/wdt:P279* wd:Q1656682 }
    FILTER NOT EXISTS { ?item wdt:P31/wdt:P279* wd:Q13406554 }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
  } LIMIT 100`;
  const response = await fetch(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`, { headers: { 'User-Agent': 'AtlasTravelArchive/1.0', Accept: 'application/sparql-results+json' } });
  if (!response.ok) return [];
  const bindings = ((await response.json()) as any).results?.bindings || [];
  const seen = new Set<string>();
  return bindings.flatMap((b: any) => {
    const name = b.itemLabel?.value;
    if (!name || /^Q\d+$/.test(name) || BAD_RESULT.test(name) || seen.has(name)) return [];
    seen.add(name);
    return [{ name, imageUrl: commonsThumb(b.image.value), sourceUrl: b.item.value, base: 'fallback', kind: 'culture' as const }];
  });
}

async function buildCountry(country: RestCountry, displayName: string) {
  const capital = country.capital?.[0] || displayName;
  const data = await wikidataSites(country.cca2);
  let capitalImage = data.capitalImage;
  let capitalSource: string | null = null;
  if (!capitalImage) {
    const city = pick(await wikiSearch(`"${capital}" ${displayName}`, 8), new Set(), 1)[0];
    capitalImage = city?.thumbnail?.source;
    capitalSource = city?.fullurl || null;
  }
  const priority: Record<string, number> = { Q46169: 1, Q34038: 2, Q8502: 3, Q23397: 4, Q35509: 5, Q46831: 6, Q23442: 7, Q33837: 8, Q4421: 9, Q165: 10, Q39594: 11, Q8072: 12, Q170321: 13, Q473972: 14, Q167346: 15, Q1107656: 16, Q22698: 17, Q4022: 18 };
  const culture = data.items.filter((x) => x.kind === 'culture').slice(0, 2);
  const nature = data.items.filter((x) => x.kind === 'nature').sort((a, b) => (priority[a.base] || 50) - (priority[b.base] || 50)).slice(0, 3);
  if (culture.length < 2 || nature.length < 3) {
    const used = new Set([...culture, ...nature].map((x) => x.name));
    const fallback = (await wikidataFallback(country.cca2)).filter((x) => !used.has(x.name));
    while (culture.length < 2 && fallback.length) culture.push(fallback.shift()!);
    while (nature.length < 3 && fallback.length) nature.push({ ...fallback.shift()!, kind: 'nature' });
  }
  if (!capitalImage || culture.length !== 2 || nature.length !== 3) throw new Error(`Wikidata lacks a complete set for ${displayName}`);
  const candidates = [{ name: capital, imageUrl: capitalImage, sourceUrl: capitalSource }, ...culture, ...nature];
  const kinds = ['city', 'culture', 'history', 'nature', 'nature', 'nature'];
  return candidates.slice(0, 6).map((p, i) => ({
    country: displayName, countryId: country.cca2.toLowerCase(), position: i + 1,
    name: p.name, kind: kinds[i], imageUrl: p.imageUrl, sourceUrl: p.sourceUrl || null,
  }));
}

async function buildHandCountry(country: RestCountry, displayName: string) {
  const names = HAND_SITES[displayName];
  const pages: WikiPage[] = [];
  for (const name of names) {
    const found = await wikiSearch(`"${name}"`, 6);
    const page = found.find((p) => !BAD_RESULT.test(p.title)) || found[0];
    if (!page?.thumbnail?.source) throw new Error(`No exact image for ${displayName}: ${name}`);
    pages.push(page);
  }
  return pages.map((p, i) => ({ country: displayName, countryId: country.cca2.toLowerCase(), position: i + 1,
    name: names[i], kind: ['city', 'culture', 'history', 'nature', 'nature', 'nature'][i], imageUrl: p.thumbnail!.source, sourceUrl: p.fullurl || null }));
}

async function main() {
  if (process.argv.includes('--curated-only')) {
    for (const [country, sites] of Object.entries(FAMOUS_SITES)) {
      const existing = await prisma.countrySite.findFirst({ where: { country }, select: { countryId: true } });
      if (!existing) continue;
      await prisma.$transaction(sites.slice(0, 6).map(([name, kind, imageUrl], index) => prisma.countrySite.upsert({
        where: { countryId_position: { countryId: existing.countryId, position: index + 1 } },
        update: { country, name, kind, imageUrl },
        create: { country, countryId: existing.countryId, position: index + 1, name, kind, imageUrl },
      })));
    }
    console.log(`Applied ${Object.keys(FAMOUS_SITES).length} hand-curated country overrides.`);
    return;
  }
  const [all, topo] = await Promise.all([
    fetch('https://raw.githubusercontent.com/mledoze/countries/master/countries.json').then((r) => r.json()) as Promise<CountrySource[]>,
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((r) => r.json()) as Promise<any>,
  ]);
  const normalized: RestCountry[] = all.map((c) => ({ ...c, unMember: c.unMember ?? c.status === 'officially-assigned' }));
  const atlasNames = new Map<string, string>((topo.objects.countries.geometries as any[]).map((g) => [String(g.id).padStart(3, '0'), g.properties.name]));
  const base = normalized.filter((c) => c.unMember || c.cca2 === 'PS' || c.cca2 === 'VA');
  const extras = normalized.filter((c) => EXTRA.has(c.cca2) && !base.includes(c)).sort((a, b) => a.cca2.localeCompare(b.cca2));
  let countries = [...base, ...extras].sort((a, b) => a.name.common.localeCompare(b.name.common)).slice(0, 206);
  if (countries.length !== 206) throw new Error(`Expected 206 countries, received ${countries.length}`);
  const onlyCountry = process.argv.find((arg) => arg.startsWith('--country='))?.slice('--country='.length).toLowerCase();
  if (onlyCountry) countries = countries.filter((c) => {
    const display = (c.ccn3 && atlasNames.get(c.ccn3)) || c.name.common;
    return display.toLowerCase() === onlyCountry || c.cca2.toLowerCase() === onlyCountry;
  });
  const startAt = Number(process.argv.find((arg) => arg.startsWith('--start='))?.slice('--start='.length) || 0);
  if (startAt > 0 && !onlyCountry) countries = countries.slice(startAt);
  if (process.argv.includes('--retry-failed')) countries = countries.filter((c) => RETRY_COUNTRIES.has((c.ccn3 && atlasNames.get(c.ccn3)) || c.name.common));
  if (process.argv.includes('--hand-only')) countries = countries.filter((c) => !!HAND_SITES[(c.ccn3 && atlasNames.get(c.ccn3)) || c.name.common]);

  let cursor = 0;
  let failures = 0;
  const workerCount = Number(process.argv.find((arg) => arg.startsWith('--workers='))?.slice('--workers='.length) || 3);
  const workers = Array.from({ length: Math.max(1, Math.min(workerCount, 8)) }, async () => {
    while (cursor < countries.length) {
      const c = countries[cursor++];
      const displayName = (c.ccn3 && atlasNames.get(c.ccn3)) || c.name.common;
      try {
        if (!onlyCountry && FAMOUS_SITES[displayName]) { console.log(`${cursor}/${countries.length} ${displayName}: curated`); continue; }
        const rows = HAND_SITES[displayName] ? await buildHandCountry(c, displayName) : await buildCountry(c, displayName);
        await prisma.$transaction(rows.map((row) => prisma.countrySite.upsert({
          where: { countryId_position: { countryId: row.countryId, position: row.position } }, update: row, create: row,
        })));
        console.log(`${cursor}/${countries.length} ${displayName}: ${rows.map((r) => r.name).join(' | ')}`);
        await Bun.sleep(900);
      } catch (error) { failures++; console.error(`FAILED ${displayName}`, error); }
    }
  });
  await Promise.all(workers);
  // Preserve the project's hand-reviewed landmark/photo choices wherever
  // available; generated search results fill only the remaining countries.
  for (const [country, sites] of Object.entries(FAMOUS_SITES)) {
    const match = countries.find((c) => ((c.ccn3 && atlasNames.get(c.ccn3)) || c.name.common) === country);
    if (!match) continue;
    await prisma.$transaction(sites.slice(0, 6).map(([name, kind, imageUrl], index) => prisma.countrySite.upsert({
      where: { countryId_position: { countryId: match.cca2.toLowerCase(), position: index + 1 } },
      update: { country, name, kind, imageUrl },
      create: { country, countryId: match.cca2.toLowerCase(), position: index + 1, name, kind, imageUrl },
    })));
  }
  const count = await prisma.countrySite.count();
  if (failures) throw new Error(`Archive refresh failed for ${failures} countries; existing rows were preserved for review.`);
  if (!onlyCountry && count !== 206 * 6) throw new Error(`Archive incomplete: expected 1236 rows, found ${count}`);
  console.log(`Country archive ready: ${count} URL-only cards.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
