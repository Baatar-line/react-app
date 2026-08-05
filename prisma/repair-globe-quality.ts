/** Replaces map/flag/logo/person-like cards and known cross-country coordinates. */
import { prisma } from '../lib/prisma';

type Repair = { countryId: string; country: string; position: number; title: string; name?: string; kind: string; imageUrl?: string; latitude?: number; longitude?: number };

const REPAIRS: Repair[] = [
  { countryId: 'af', country: 'Afghanistan', position: 5, title: 'Band-e Amir National Park', kind: 'nature' },
  { countryId: 'aq', country: 'Antarctica', position: 4, title: 'Paradise Harbour', kind: 'nature' },
  { countryId: 'aq', country: 'Antarctica', position: 6, title: 'Blood Falls', kind: 'nature' },
  { countryId: 'bd', country: 'Bangladesh', position: 6, title: "Cox's Bazar", kind: 'nature' },
  { countryId: 'by', country: 'Belarus', position: 2, title: 'Mir Castle Complex', name: 'Mir Castle', kind: 'culture' },
  { countryId: 'by', country: 'Belarus', position: 4, title: 'Białowieża Forest', kind: 'nature' },
  { countryId: 'by', country: 'Belarus', position: 5, title: 'Braslaw Lakes', kind: 'nature' },
  { countryId: 'by', country: 'Belarus', position: 6, title: 'Lake Narach', kind: 'nature' },
  { countryId: 'cv', country: 'Cape Verde', position: 5, title: 'Monte Verde (Cape Verde)', name: 'Monte Verde', kind: 'nature' },
  { countryId: 'cf', country: 'Central African Rep.', position: 2, title: 'Manovo-Gounda St Floris National Park', kind: 'culture' },
  { countryId: 'km', country: 'Comoros', position: 4, title: 'Mount Karthala', kind: 'nature' },
  { countryId: 'er', country: 'Eritrea', position: 6, title: 'Dahlak Archipelago', kind: 'nature' },
  { countryId: 'hk', country: 'Hong Kong', position: 1, title: 'Victoria Peak', kind: 'city' },
  { countryId: 'hk', country: 'Hong Kong', position: 3, title: 'Wong Tai Sin Temple (Hong Kong)', name: 'Wong Tai Sin Temple', kind: 'history' },
  { countryId: 'iq', country: 'Iraq', position: 4, title: 'Mesopotamian Marshes', kind: 'nature' },
  { countryId: 'iq', country: 'Iraq', position: 5, title: 'Lake Habbaniyah', kind: 'nature' },
  { countryId: 'iq', country: 'Iraq', position: 6, title: 'Bekhal Waterfall', kind: 'nature' },
  { countryId: 'kw', country: 'Kuwait', position: 6, title: 'Failaka Island', kind: 'nature' },
  { countryId: 'ly', country: 'Libya', position: 5, title: 'Gaberoun', name: 'Ubari Lake', kind: 'nature' },
  { countryId: 'mg', country: 'Madagascar', position: 4, title: 'Andringitra National Park', kind: 'nature' },
  { countryId: 'na', country: 'Namibia', position: 5, title: 'Etosha National Park', kind: 'nature' },
  { countryId: 'nu', country: 'Niue', position: 4, title: 'Matapa Chasm', kind: 'nature', imageUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Matapa%20Chasm%2C%20Niue.jpg?width=960', latitude: -18.9629, longitude: -169.8824 },
  { countryId: 'nu', country: 'Niue', position: 5, title: 'Limu Pools', kind: 'nature', imageUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Limu%20Pools%2C%20Niue.jpg?width=960', latitude: -18.9758, longitude: -169.8965 },
  { countryId: 'nu', country: 'Niue', position: 6, title: 'Togo Chasm', kind: 'nature', imageUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Togo%20Chasm.jpg?width=960', latitude: -19.1057, longitude: -169.8077 },
  { countryId: 'pg', country: 'Papua New Guinea', position: 3, title: 'Lae War Cemetery', kind: 'history', imageUrl: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Lae%20War%20Cemetery%20Australian%20Grave%20Row%20A.jpg?width=960', latitude: -6.725009, longitude: 146.991749 },
  { countryId: 'sl', country: 'Sierra Leone', position: 6, title: 'Tiwai Island', kind: 'nature' },
  { countryId: 'so', country: 'Somalia', position: 4, title: 'Cal Madow', kind: 'nature' },
  { countryId: 'tv', country: 'Tuvalu', position: 1, title: 'Fongafale', kind: 'city' },
  { countryId: 'vu', country: 'Vanuatu', position: 6, title: 'Mount Yasur', kind: 'nature' },
  { countryId: 'va', country: 'Vatican City', position: 3, title: "St. Peter's Basilica", kind: 'history' },
  { countryId: 'eh', country: 'W. Sahara', position: 3, title: 'Dakhla, Western Sahara', name: 'Dakhla Lagoon', kind: 'history' },
  { countryId: 'uy', country: 'Uruguay', position: 5, title: 'Cabo Polonio', kind: 'nature' },
  { countryId: 'uy', country: 'Uruguay', position: 6, title: 'Santa Teresa National Park', kind: 'nature' },
  { countryId: 'lb', country: 'Lebanon', position: 5, title: 'Cedars of God', kind: 'nature' },
  { countryId: 'ps', country: 'Palestine', position: 5, title: 'Wadi Qelt', kind: 'nature' },
];

async function pageSummary(title: string) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`;
  let response: Response | undefined;
  for (let attempt = 0; attempt < 6; attempt++) {
    response = await fetch(url, { headers: { 'User-Agent': 'AtlasTravelArchive/1.0 (quality repair)' } });
    if (response.ok) break;
    if (response.status !== 429 && response.status < 500) break;
    await Bun.sleep(2_000 * (attempt + 1));
  }
  if (!response?.ok) throw new Error(`Wikipedia ${response?.status} for ${title}`);
  const page = await response.json() as any;
  if (!page.thumbnail?.source || !page.coordinates) throw new Error(`Missing photo/coordinates for ${title}`);
  const imageUrl = page.thumbnail.source.replace(/\/\d+px-/, '/960px-');
  if (/(map|topograph|diagram|flag|logo|coat.of.arms|portrait|headshot)/i.test(decodeURIComponent(imageUrl))) {
    throw new Error(`Rejected non-photo thumbnail for ${title}: ${imageUrl}`);
  }
  return { page, imageUrl };
}

async function main() {
  const startAt = Number(process.argv.find((arg) => arg.startsWith('--start='))?.split('=')[1] || 0);
  const onlyCountry = process.argv.find((arg) => arg.startsWith('--country='))?.split('=')[1]?.toLowerCase();
  const selectedRepairs = REPAIRS.slice(startAt).filter((repair) => !onlyCountry || repair.countryId === onlyCountry || repair.country.toLowerCase() === onlyCountry);
  for (const repair of selectedRepairs) {
    const resolved = repair.imageUrl
      ? { page: { title: repair.title, coordinates: { lat: repair.latitude, lon: repair.longitude }, content_urls: { desktop: { page: null } } }, imageUrl: repair.imageUrl }
      : await pageSummary(repair.title);
    const { page, imageUrl } = resolved;
    await prisma.countrySite.upsert({
      where: { countryId_position: { countryId: repair.countryId, position: repair.position } },
      update: {
        country: repair.country, name: repair.name || page.title, kind: repair.kind, imageUrl,
        sourceUrl: page.content_urls?.desktop?.page || null,
        latitude: page.coordinates.lat, longitude: page.coordinates.lon,
      },
      create: {
        countryId: repair.countryId, country: repair.country, position: repair.position,
        name: repair.name || page.title, kind: repair.kind, imageUrl,
        sourceUrl: page.content_urls?.desktop?.page || null,
        latitude: page.coordinates.lat, longitude: page.coordinates.lon,
      },
    });
    console.log(`${repair.country} #${repair.position}: ${repair.name || page.title}`);
    await Bun.sleep(450);
  }

  // Correct two otherwise-good Swiss cards whose generic geocoder resolved
  // similarly named places outside Switzerland.
  await prisma.countrySite.update({ where: { countryId_position: { countryId: 'ch', position: 3 } }, data: { latitude: 47.0517, longitude: 8.3075 } });
  await prisma.countrySite.update({ where: { countryId_position: { countryId: 'ch', position: 6 } }, data: { latitude: 46.458, longitude: 6.528 } });
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
