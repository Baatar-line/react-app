import { prisma } from '../lib/prisma';

type Coord = { lat: number; lng: number };
const WIKI = 'https://en.wikipedia.org/w/api.php';
const GEOCODE_ALIAS: Record<string, string> = {
  'Mosquée de Fatako': 'Fatako Guinea', 'Meteora Monasteries': 'Meteora Greece', 'Hong Kong UNESCO Global Geopark': 'Sai Kung Hong Kong',
  'Aggtelek Caves': 'Aggtelek Hungary', 'Ubud Rice Terraces, Bali': 'Tegallalang Bali', 'Hannover Parish Church, Lucea': 'Lucea Jamaica',
  'Kyoto Temples': 'Kiyomizu-dera Kyoto', 'Japanese Alps': 'Hida Mountains Japan', 'Lamu Old Town': 'Lamu Kenya',
  'Cardamom Mountains': 'Kravanh Mountains Cambodia', 'Boseong Green Tea Fields': 'Boseong South Korea',
  'Kuwait Science and Natural History Museum': 'Kuwait City', 'Pfarrhaus Bendern': 'Bendern Liechtenstein', 'Fez el Bali': 'Fes el Bali Morocco',
  "Rova d'Antsahadinta": 'Antsahadinta Madagascar', 'Эрдэнэ Зуу хийд': 'Erdene Zuu Monastery Mongolia', 'Говь цөл': 'Gobi Desert Mongolia',
  "Ruins of Saint Paul's": 'Ruins of St Paul Macau', 'Cenotes of Yucatán': 'Ik Kil Yucatan', 'Sukur Cultural Landscape': 'Sukur Nigeria',
  'Obudu Plateau': 'Obudu Mountain Resort Nigeria', 'Tulip Fields, Keukenhof': 'Keukenhof Netherlands', 'Kinderdijk Windmills': 'Kinderdijk Netherlands',
  'Zandvoort Dunes': 'Zandvoort Netherlands', 'Lofoten Islands': 'Lofoten Norway', 'Huanaki Cultural Centre': 'Alofi Niue',
  'Reformed church in Hațeg': 'Hateg Romania', 'Caucasus Mountains': 'Mount Elbrus Russia', 'Swedish Lapland': 'Kiruna Sweden',
  'Umhlanga (ceremony)': 'Ludzidzini Royal Village Eswatini', 'Chiang Mai Old City': 'Chiang Mai Thailand', 'Turquoise Coast': 'Antalya Turkey',
  'Tuvalu Philatelic Bureau': 'Funafuti Tuvalu', 'Fetu Ao Lima Church': 'Funafuti Tuvalu', 'Funafuti Conservation Area': 'Funafuti Tuvalu',
  'Hue Imperial City': 'Imperial City of Hue Vietnam', 'Sapa Rice Terraces': 'Sa Pa Vietnam', 'Phong Nha-Ke Bang Caves': 'Phong Nha Vietnam',
  'Papaseʻea': 'Papaseea Sliding Rocks Samoa', 'Drakensberg Mountains': 'Drakensberg South Africa',
};
const MANUAL_COORDS: Record<string, Coord> = {
  'Armenian Soviet Socialist Republic': { lat: 40.1772, lng: 44.5035 }, 'Jesuit Missions of San Ignacio Miní': { lat: -27.255, lng: -55.532 },
  'Iguazú Falls (Argentina)': { lat: -25.695, lng: -54.436 }, 'Patagonia (Fitz Roy)': { lat: -49.271, lng: -73.043 },
  'Austrian Alps (Grossglockner)': { lat: 47.0745, lng: 12.6944 }, 'Salzkammergut Lakes': { lat: 47.7, lng: 13.5 },
  'Cartagena Old Town': { lat: 10.4236, lng: -75.551 }, 'Cocora Valley': { lat: 4.637, lng: -75.489 },
  "Leonid Brezhnev's visit to Cuba": { lat: 23.1136, lng: -82.3666 }, 'Bavarian Alps': { lat: 47.56, lng: 11.1 },
  'The Dominica Museum': { lat: 15.301, lng: -61.388 }, 'Red Sea Coral Reefs': { lat: 27.257, lng: 33.812 },
  'El Aaiún': { lat: 27.1536, lng: -13.2033 }, 'Lamu Old Town': { lat: -2.2717, lng: 40.902 },
  'Cardamom Mountains': { lat: 12.3, lng: 103.1 }, 'Boseong Green Tea Fields': { lat: 34.719, lng: 127.08 },
  'Fez el Bali': { lat: 34.064, lng: -4.973 }, 'Эрдэнэ Зуу хийд': { lat: 47.202, lng: 102.843 }, 'Говь цөл': { lat: 43, lng: 105 },
  "Ruins of Saint Paul's": { lat: 22.1975, lng: 113.5409 }, 'Cenotes of Yucatán': { lat: 20.682, lng: -88.569 },
  'Sukur Cultural Landscape': { lat: 10.74, lng: 13.57 }, 'Obudu Plateau': { lat: 6.37, lng: 9.38 },
  'Tulip Fields, Keukenhof': { lat: 52.271, lng: 4.546 }, 'Kinderdijk Windmills': { lat: 51.883, lng: 4.637 },
  'Funafuti Conservation Area': { lat: -8.52, lng: 179.05 }, 'Hue Imperial City': { lat: 16.469, lng: 107.578 },
  'Sapa Rice Terraces': { lat: 22.336, lng: 103.844 }, 'Phong Nha-Ke Bang Caves': { lat: 17.59, lng: 106.283 },
  'Papaseʻea': { lat: -13.875, lng: -171.799 }, 'Drakensberg Mountains': { lat: -29.3, lng: 29.2 },
};

// Authoritative Mongolia archive pins. Search results can otherwise resolve
// broad names such as "Gobi Desert" to Ulaanbaatar and leave stacked pins.
const MONGOLIA_COORDS: Record<string, Coord> = {
  'Улаанбаатар': { lat: 47.9185, lng: 106.9177 },
  'Чингис хаан хөшөө цогцолбор': { lat: 47.8079, lng: 107.5369 },
  'Эрдэнэ Зуу хийд': { lat: 47.2019, lng: 102.8431 },
  'Говь цөл': { lat: 43.0, lng: 105.0 },
  'Хөвсгөл нуур': { lat: 51.10, lng: 100.50 },
  'Алтайн нуруу': { lat: 49.15, lng: 87.82 },
};

async function retryJson(url: string, attempts = 1): Promise<any> {
  for (let i = 0; i < attempts; i++) {
    const r = await fetch(url, { headers: { 'User-Agent': 'AtlasTravelArchive/1.0', Accept: 'application/json' } });
    if (r.ok) return r.json();
    await Bun.sleep(2500 * (i + 1));
  }
  throw new Error(`Coordinate source unavailable: ${url}`);
}

async function main() {
  for (const [name, c] of Object.entries(MONGOLIA_COORDS)) {
    await prisma.countrySite.updateMany({ where: { country: 'Mongolia', name }, data: { latitude: c.lat, longitude: c.lng } });
  }
  const rows = await prisma.countrySite.findMany({ where: { OR: [{ latitude: null }, { longitude: null }] }, orderBy: [{ countryId: 'asc' }, { position: 'asc' }] });
  const found = new Map<number, Coord>();
  rows.forEach((r) => { if (MANUAL_COORDS[r.name]) found.set(r.id, MANUAL_COORDS[r.name]); });
  const qids = rows.flatMap((r) => {
    const q = r.sourceUrl?.match(/\/entity\/(Q\d+)$/)?.[1]; return q ? [{ id: r.id, q }] : [];
  });
  for (let i = 0; i < qids.length; i += 50) {
    const batch = qids.slice(i, i + 50);
    let json: any;
    try { json = await retryJson(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&ids=${batch.map((x) => x.q).join('|')}`, 1); }
    catch { continue; }
    for (const item of batch) {
      const value = json.entities?.[item.q]?.claims?.P625?.[0]?.mainsnak?.datavalue?.value;
      if (value && Number.isFinite(value.latitude) && Number.isFinite(value.longitude)) found.set(item.id, { lat: value.latitude, lng: value.longitude });
    }
  }

  const unresolved = rows.filter((r) => !found.has(r.id));
  let cursor = 0;
  await Promise.all(Array.from({ length: 1 }, async () => {
    while (cursor < unresolved.length) {
      const row = unresolved[cursor++];
      const cleanName = row.name.replace(/\s*\([^)]*\)/g, '').replace(/,.*$/, '').trim();
      const alias = GEOCODE_ALIAS[row.name];
      try {
        if (row.sourceUrl?.includes('en.wikipedia.org/wiki/')) {
          const title = row.sourceUrl.split('/wiki/')[1];
          const pageJson = await retryJson(`${WIKI}?action=query&format=json&origin=*&titles=${title}&prop=coordinates`);
          const page = Object.values(pageJson.query?.pages || {})[0] as any;
          if (page?.coordinates?.[0]) found.set(row.id, { lat: page.coordinates[0].lat, lng: page.coordinates[0].lon });
        }
        for (const query of [alias, `${row.name}, ${row.country}`, `${cleanName}, ${row.country}`, cleanName].filter(Boolean) as string[]) {
          if (found.has(row.id)) break;
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`, { headers: { 'User-Agent': 'AtlasTravelArchive/1.0 admin@bigbang.mn' } });
          const json = response.ok ? await response.json() as any[] : [];
          if (json[0] && Number.isFinite(Number(json[0].lat)) && Number.isFinite(Number(json[0].lon))) found.set(row.id, { lat: Number(json[0].lat), lng: Number(json[0].lon) });
          await Bun.sleep(1100);
        }
        if (!found.has(row.id)) {
          const search = await retryJson(`${WIKI}?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(`"${cleanName}" ${row.country}`)}&gsrlimit=8&prop=coordinates`);
          const page = (Object.values(search.query?.pages || {}) as any[]).find((p) => p.coordinates?.[0]);
          if (page) found.set(row.id, { lat: page.coordinates[0].lat, lng: page.coordinates[0].lon });
        }
      } catch { /* reported by final completeness check */ }
      if (cursor % 25 === 0) console.log(`Resolved ${cursor}/${unresolved.length} non-Wikidata cards...`);
      await Bun.sleep(100);
    }
  }));

  const resolved = rows.flatMap((r) => { const c = found.get(r.id); return c ? [{ row: r, coord: c }] : []; });
  for (let i = 0; i < resolved.length; i += 25) {
    await prisma.$transaction(resolved.slice(i, i + 25).map(({ row, coord }) => prisma.countrySite.update({
      where: { id: row.id }, data: { latitude: coord.lat, longitude: coord.lng },
    })));
  }
  const missing = rows.filter((r) => !found.has(r.id));
  console.log(`Saved real coordinates for ${found.size}/${rows.length} cards.`);
  if (missing.length) {
    console.error('Missing:', missing.map((r) => `${r.country} #${r.position} ${r.name}`).join('\n'));
    throw new Error(`${missing.length} cards still need coordinates`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
