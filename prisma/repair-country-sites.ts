/**
 * Repairs the four hand-reviewed globe archives that produced missing,
 * duplicate-flag, or low-quality cards in the automatic Wikidata import.
 */
import { prisma } from '../lib/prisma';

type Site = { title: string; name?: string; kind: 'city' | 'culture' | 'history' | 'nature' };

const ARCHIVES: Record<string, { country: string; sites: Site[] }> = {
  am: {
    country: 'Armenia',
    sites: [
      { title: 'Yerevan', kind: 'city' },
      { title: 'Temple of Garni', name: 'Garni Temple', kind: 'culture' },
      { title: 'Geghard', name: 'Geghard Monastery', kind: 'history' },
      { title: 'Lake Sevan', kind: 'nature' },
      { title: 'Dilijan National Park', kind: 'nature' },
      { title: 'Mount Aragats', kind: 'nature' },
    ],
  },
  fk: {
    country: 'Falkland Is.',
    sites: [
      { title: 'Volunteer Point', kind: 'nature' },
      { title: 'Sea Lion Island', kind: 'nature' },
      { title: 'Mount Usborne', kind: 'nature' },
      { title: 'Pebble Island', kind: 'nature' },
      { title: 'Carcass Island', kind: 'nature' },
      { title: 'Saunders Island, Falkland Islands', name: 'Saunders Island', kind: 'nature' },
    ],
  },
  be: {
    country: 'Belgium',
    sites: [
      { title: 'Brussels', kind: 'city' },
      { title: 'Grand-Place', name: 'Grand Place', kind: 'culture' },
      { title: 'Bruges', name: 'Historic Centre of Bruges', kind: 'history' },
      { title: 'Ardennes', name: 'The Ardennes', kind: 'nature' },
      { title: 'High Fens', kind: 'nature' },
      { title: 'Caves of Han-sur-Lesse', name: 'Caves of Han', kind: 'nature' },
    ],
  },
  ba: {
    country: 'Bosnia and Herz.',
    sites: [
      { title: 'Sarajevo', kind: 'city' },
      { title: 'Stari Most', name: 'Mostar Old Bridge', kind: 'culture' },
      { title: 'Travnik Castle', kind: 'history' },
      { title: 'Una National Park', kind: 'nature' },
      { title: 'Kravica (waterfall)', name: 'Kravica Waterfall', kind: 'nature' },
      { title: 'Sutjeska National Park', kind: 'nature' },
    ],
  },
  pg: {
    country: 'Papua New Guinea',
    sites: [
      { title: 'Port Moresby', kind: 'city' },
      { title: 'Kuk Swamp', kind: 'culture' },
      { title: 'Papua New Guinea National Museum and Art Gallery', name: 'National Museum and Art Gallery', kind: 'history' },
      { title: 'Kokoda Track', kind: 'nature' },
      { title: 'Mount Wilhelm', kind: 'nature' },
      { title: 'Tufi', name: 'Tufi Fjords', kind: 'nature' },
    ],
  },
  ua: {
    country: 'Ukraine',
    sites: [
      { title: 'Kyiv', kind: 'city' },
      { title: 'Saint Sophia Cathedral, Kyiv', name: 'Saint Sophia Cathedral', kind: 'culture' },
      { title: 'Lviv', name: 'Historic Centre of Lviv', kind: 'history' },
      { title: 'Carpathian National Nature Park', name: 'Carpathian National Park', kind: 'nature' },
      { title: 'Dniester Canyon', kind: 'nature' },
      { title: 'Synevyr', name: 'Lake Synevyr', kind: 'nature' },
    ],
  },
  aq: {
    country: 'Antarctica',
    sites: [
      { title: 'Antarctic Peninsula', kind: 'nature' },
      { title: 'Ross Ice Shelf', kind: 'nature' },
      { title: 'Mount Erebus', kind: 'nature' },
      { title: 'Lemaire Channel', kind: 'nature' },
      { title: 'Deception Island', kind: 'nature' },
      { title: 'McMurdo Dry Valleys', kind: 'nature' },
    ],
  },
};

async function wikipediaPage(title: string) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`;
  let response: Response | undefined;
  for (let attempt = 0; attempt < 6; attempt++) {
    response = await fetch(url, {
      headers: { 'User-Agent': 'AtlasTravelArchive/1.0 (country archive repair)', Accept: 'application/json' },
    });
    if (response.ok) break;
    if (response.status !== 429 && response.status < 500) break;
    await Bun.sleep(2_000 * (attempt + 1));
  }
  if (!response?.ok) throw new Error(`Wikipedia ${response?.status} for ${title}`);
  const summary = await response.json() as any;
  if (!summary?.thumbnail?.source) throw new Error(`No page image for ${title}`);
  return {
    title: summary.title,
    thumbnail: { source: summary.thumbnail.source.replace(/\/\d+px-/, '/960px-') },
    fullurl: summary.content_urls?.desktop?.page,
    coordinates: summary.coordinates ? [{ lat: summary.coordinates.lat, lon: summary.coordinates.lon }] : [],
  };
}

async function main() {
  const onlyCountry = process.argv.find((arg) => arg.startsWith('--country='))?.split('=')[1]?.toLowerCase();
  for (const [countryId, archive] of Object.entries(ARCHIVES)) {
    if (onlyCountry && countryId !== onlyCountry && archive.country.toLowerCase() !== onlyCountry) continue;
    const rows = [];
    for (const [index, site] of archive.sites.entries()) {
      const page = await wikipediaPage(site.title);
      rows.push({
        country: archive.country,
        countryId,
        position: index + 1,
        name: site.name || page.title,
        kind: site.kind,
        imageUrl: page.thumbnail.source,
        sourceUrl: page.fullurl || null,
        latitude: page.coordinates?.[0]?.lat ?? null,
        longitude: page.coordinates?.[0]?.lon ?? null,
      });
      await Bun.sleep(450);
    }
    await prisma.$transaction(rows.map((row) => prisma.countrySite.upsert({
      where: { countryId_position: { countryId, position: row.position } },
      update: row,
      create: row,
    })));
    console.log(`${archive.country}: ${rows.map((row) => row.name).join(' | ')}`);
  }
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
