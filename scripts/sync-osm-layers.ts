/**
 * Downloads Mongolia's road and railway geometry from OpenStreetMap and writes
 * it to public/osm/*.geojson. Run with `bun run sync:osm`.
 *
 * Baked into files rather than queried at runtime on purpose. Overpass is a
 * free, shared, heavily rate-limited service — it returned "server is probably
 * too busy" to one of these very queries while this was being written — so a
 * map layer that called it on every toggle would be slow when it worked and
 * broken when it didn't. The road network barely changes; re-run this when it
 * needs refreshing.
 *
 * Data © OpenStreetMap contributors, ODbL. Attribution is required wherever
 * these layers are drawn — see the map page's layer toggles.
 *
 * Not in prisma/ like the other sync scripts because nothing here touches the
 * database: this is static geometry served straight from public/, which also
 * keeps it out of Neon (same reasoning as CountrySite's remote image URLs).
 */
import fs from 'fs';
import path from 'path';

// Tried in order — the main instance is the busiest and fails most often.
const ENDPOINTS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

const PAVED = '^(asphalt|paved|concrete|paving_stones)$';
const MAIN = '^(motorway|trunk|primary|secondary)$';

interface Layer { file: string; label: string; query: string; }

// Overpass `out geom` returns three shapes and they need different handling:
// a node is a point, a way is a line (a Polygon when its ends meet), and a
// relation carries its member ways' geometry instead of its own.
//
// Relation members are emitted as separate polygons rather than assembled into
// a proper multipolygon with holes. Real ring assembly is a chunk of work for
// something nothing here reads — these are drawn as translucent shapes, where
// an unfilled hole is invisible and an extra outline costs nothing.
function toFeatures(elements: any[]): any[] {
  const out: any[] = [];
  const ring = (geom: any[]) => geom.map((g: any) => [round(g.lon), round(g.lat)]);
  const closed = (c: number[][]) => c.length > 3 && c[0][0] === c[c.length - 1][0] && c[0][1] === c[c.length - 1][1];
  const push = (geometry: any) => out.push({ type: 'Feature', properties: {}, geometry });

  elements.forEach((el: any) => {
    if (el.type === 'node' && el.lat != null) {
      push({ type: 'Point', coordinates: [round(el.lon), round(el.lat)] });
      return;
    }
    if (Array.isArray(el.geometry) && el.geometry.length > 1) {
      const c = ring(el.geometry);
      push(closed(c) ? { type: 'Polygon', coordinates: [c] } : { type: 'LineString', coordinates: c });
      return;
    }
    if (el.type === 'relation' && Array.isArray(el.members)) {
      el.members
        .filter((mem: any) => Array.isArray(mem.geometry) && mem.geometry.length > 1 && mem.role !== 'inner')
        .forEach((mem: any) => {
          const c = ring(mem.geometry);
          push(closed(c) ? { type: 'Polygon', coordinates: [c] } : { type: 'LineString', coordinates: c });
        });
    }
  });
  return out;
}

const LAYERS: Layer[] = [
  {
    file: 'mn-roads-paved',
    label: 'Хатуу хучилттай зам',
    // surface is what makes this answerable at all — a raster basemap draws
    // every road the same way, so "which of these is actually sealed" can only
    // come from the underlying tags.
    query: `way(area.mn)["highway"~"${MAIN}"]["surface"~"${PAVED}"];`,
  },
  {
    file: 'mn-roads-unpaved',
    label: 'Шороон зам',
    // Same road classes, everything the paved filter didn't take — including
    // ways with no surface tag at all, which in Mongolia are far more often
    // unsealed than not.
    query: `way(area.mn)["highway"~"${MAIN}"]["surface"!~"${PAVED}"];`,
  },
  {
    file: 'mn-railways',
    label: 'Төмөр зам',
    // railway=rail only: sidings, yards and disused track would triple the
    // line count without adding anything a traveller reads off a map.
    query: `way(area.mn)["railway"="rail"];`,
  },
  {
    file: 'mn-mining',
    // Named for what the data honestly is. OSM has ~127 of these for the whole
    // country — individual pits and shafts that mappers happened to trace, not
    // licence areas. Mongolia's actual mining concessions live with MRAM and
    // aren't published in a form this can read, so calling the layer "mining
    // zones" would promise a completeness it does not have.
    label: 'Мэдэгдэж буй уурхай, карьер',
    query: `(
      way(area.mn)["landuse"="quarry"];
      relation(area.mn)["landuse"="quarry"];
      way(area.mn)["industrial"="mine"];
      node(area.mn)["man_made"="mineshaft"];
    );`,
  },
];

async function overpass(query: string): Promise<any> {
  const body = `[out:json][timeout:240];\narea["ISO3166-1"="MN"][admin_level=2]->.mn;\n${query}\nout geom;`;
  let lastErr: unknown;
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'BigBang-Mongolia-App/1.0 (admin@bigbang.mn)' },
        body: `data=${encodeURIComponent(body)}`,
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const text = await res.text();
      // A busy instance answers 200 with an HTML error page, not JSON.
      if (!text.trimStart().startsWith('{')) throw new Error(text.replace(/<[^>]*>/g, ' ').trim().slice(0, 160));
      return JSON.parse(text);
    } catch (err) {
      lastErr = err;
      console.log(`  ${new URL(url).host} failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  throw lastErr;
}

// 5 decimals is ~1m at this latitude — far finer than a line drawn 2px wide on
// a country-scale map, and it roughly halves the file next to raw precision.
const round = (n: number) => Number(n.toFixed(5));

async function main() {
  const outDir = path.join(process.cwd(), 'public', 'osm');
  fs.mkdirSync(outDir, { recursive: true });

  // Overpass mirrors time out often enough that re-running the whole set to
  // add one layer means re-fetching — and re-failing on — layers that were
  // already fine. Existing files are left alone unless named explicitly or
  // --force is passed:
  //   bun run sync:osm                 every layer that has no file yet
  //   bun run sync:osm mn-mining       just that one, overwriting it
  //   bun run sync:osm --force         all of them, from scratch
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const named = args.filter((a) => !a.startsWith('--'));
  const wanted = LAYERS.filter((l) => (named.length ? named.includes(l.file) : force || !fs.existsSync(path.join(outDir, `${l.file}.geojson`))));
  if (!wanted.length) { console.log('Nothing to do — every layer already has a file (pass --force to refetch).'); return; }

  for (const layer of wanted) {
    console.log(`${layer.label}…`);
    const data = await overpass(layer.query);
    // No ids and no tags on the features: nothing renders them, and carrying
    // the tag bag would multiply the file size for data the map never reads.
    const features = toFeatures(data.elements || []);
    const target = path.join(outDir, `${layer.file}.geojson`);
    fs.writeFileSync(target, JSON.stringify({ type: 'FeatureCollection', features }));
    const kb = Math.round(fs.statSync(target).size / 1024);
    console.log(`  ${features.length} lines → public/osm/${layer.file}.geojson (${kb} KB)`);
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
