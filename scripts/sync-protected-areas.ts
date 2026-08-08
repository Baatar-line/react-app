/**
 * Downloads Mongolia's protected areas from the World Database on Protected
 * Areas and writes public/osm/mn-protected.geojson. Run with
 * `bun run sync:protected`.
 *
 * WDPA rather than OpenStreetMap: OSM has roughly 25 protected areas mapped
 * for the whole country, against the ~120 that exist covering about a fifth of
 * Mongolia's territory. A layer built from OSM would be wrong mostly by what it
 * left out, which on a map is the hardest kind of wrong to notice.
 *
 * No API key. Protected Planet's REST API needs a token, but the per-country
 * downloads under d1gam3xoknrgr2.cloudfront.net are open, and they carry the
 * same data.
 *
 * The file is named by release month (WDPA_WDOECM_<Mon><Year>_Public_MNG_shp),
 * a new one appears monthly and old ones 404, so this walks back from the
 * current month until one answers.
 *
 * Data © UNEP-WCMC and IUCN, World Database on Protected Areas. Free for
 * non-commercial use with attribution; see
 * https://www.protectedplanet.net/en/legal — worth re-reading if this app ever
 * becomes a commercial product.
 */
import fs from 'fs';
import path from 'path';
import { unzipSync } from 'fflate';
import * as shapefile from 'shapefile';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const BASE = 'https://d1gam3xoknrgr2.cloudfront.net/current';

async function fetchRelease(): Promise<{ buf: Uint8Array; release: string }> {
  const now = new Date();
  for (let back = 0; back < 6; back += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const release = `${MONTHS[d.getMonth()]}${d.getFullYear()}`;
    const url = `${BASE}/WDPA_WDOECM_${release}_Public_MNG_shp.zip`;
    const res = await fetch(url);
    if (res.ok) {
      console.log(`  release ${release}`);
      return { buf: new Uint8Array(await res.arrayBuffer()), release };
    }
    console.log(`  ${release}: ${res.status}`);
  }
  throw new Error('No WDPA release found in the last 6 months — check the URL pattern.');
}

// 5 decimals is ~1m, far finer than these outlines are drawn at country scale.
const round = (n: number) => Number(n.toFixed(5));
const roundGeom = (g: any): any => (
  typeof g[0] === 'number' ? [round(g[0]), round(g[1])] : g.map(roundGeom)
);

async function main() {
  console.log('Дархан цаазат газар (WDPA)…');
  const { buf, release } = await fetchRelease();

  // The country download is a zip of zips: the outer one holds manuals in six
  // languages plus the actual data split across shp_0/1/2, each of which is
  // itself a zip of a points and a polygons shapefile.
  const outer = unzipSync(buf);
  const inner = Object.keys(outer).filter((n) => /_shp_\d+\.zip$/.test(n));
  if (!inner.length) throw new Error('No inner shapefile archives in the WDPA download.');

  const features: any[] = [];
  for (const name of inner) {
    const files = unzipSync(outer[name]);
    // Polygons only. WDPA also ships a points layer for areas whose boundary
    // was never digitised — a single dot standing in for a national park would
    // say less than nothing on this map.
    const shpName = Object.keys(files).find((f) => f.endsWith('-polygons.shp'));
    const dbfName = Object.keys(files).find((f) => f.endsWith('-polygons.dbf'));
    if (!shpName || !dbfName) continue;
    // encoding matters: WDPA writes its DBF in UTF-8, but the reader defaults
    // to windows-1252, which turns every Cyrillic name into mojibake
    // ("Ð“Ð¾Ð²Ð¸Ð¹Ð½" for "Говийн"). Nothing renders these yet, so it would have
    // sat in the file unnoticed until something did.
    const collection = await shapefile.read(
      files[shpName].buffer as ArrayBuffer,
      files[dbfName].buffer as ArrayBuffer,
      { encoding: 'utf-8' },
    );
    (collection.features || []).forEach((f: any) => {
      if (!f.geometry) return;
      features.push({
        type: 'Feature',
        // Name and designation are kept here, unlike the OSM layers: these are
        // large shapes a visitor will point at and ask "which one is this?",
        // and they are few enough that the labels cost little.
        properties: {
          name: f.properties?.NAME || f.properties?.ORIG_NAME || '',
          type: f.properties?.DESIG || f.properties?.DESIG_ENG || '',
        },
        geometry: { ...f.geometry, coordinates: roundGeom(f.geometry.coordinates) },
      });
    });
  }

  const outDir = path.join(process.cwd(), 'public', 'osm');
  fs.mkdirSync(outDir, { recursive: true });
  const target = path.join(outDir, 'mn-protected.geojson');
  fs.writeFileSync(target, JSON.stringify({ type: 'FeatureCollection', features }));
  const kb = Math.round(fs.statSync(target).size / 1024);
  console.log(`  ${features.length} areas → public/osm/mn-protected.geojson (${kb} KB, ${release})`);
}

main().catch((error) => { console.error(error); process.exit(1); });
