/**
 * One-off asset fetcher.
 *
 * Downloads a small, curated set of freely licensed (Wikimedia Commons) heat
 * pump photos into /src/assets/images with descriptive, image-SEO friendly
 * names. Astro's build pipeline (sharp) then resizes each one, emits webp and
 * width/height, so the shipped assets stay light despite the large sources.
 *
 * These are placeholders for real branded photography later. Attribution and
 * licensing for each file lives in src/assets/images/CREDITS.md.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, createWriteStream, existsSync } from 'node:fs';
import { get } from 'node:https';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'src', 'assets', 'images');
mkdirSync(OUT, { recursive: true });

/** Commons file name -> local descriptive file name. */
const ASSETS = [
  { commons: 'Heat_Pump.jpg', out: 'air-source-heat-pump-outdoor-unit.jpg' },
  { commons: 'Gree.jpg', out: 'cold-climate-heat-pump-snow.jpg' },
  { commons: 'Outunit_of_heat_pump.jpg', out: 'heat-pump-outdoor-condenser.jpg' },
  { commons: 'Midea_MDV-X.jpg', out: 'ductless-mini-split-indoor-head.jpg' },
  { commons: 'Panasonic_AIR_CONDITIONER_OUTDOOR_UNIT.jpg', out: 'heat-pump-vs-furnace-outdoor-unit.jpg' },
];

/** Wikimedia stores originals at commons/{a}/{ab}/{name}, keyed by md5 of the name. */
function originalUrl(commons) {
  const md5 = createHash('md5').update(commons).digest('hex');
  const a = md5[0];
  const ab = md5.slice(0, 2);
  const enc = encodeURIComponent(commons);
  return `https://upload.wikimedia.org/wikipedia/commons/${a}/${ab}/${enc}`;
}

function download(url, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    const req = get(
      url,
      { headers: { 'User-Agent': 'HeatPumpAtlasUSA/1.0 (build asset fetch; contact editor@heatpumpatlasusa.com)' } },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (redirects > 5) return reject(new Error('Too many redirects'));
          res.resume();
          return resolve(download(res.headers.location, dest, redirects + 1));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        const file = createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve()));
        file.on('error', reject);
      },
    );
    req.on('error', reject);
  });
}

let ok = 0;
for (const asset of ASSETS) {
  const dest = join(OUT, asset.out);
  if (existsSync(dest)) {
    console.log(`skip  ${asset.out} (exists)`);
    ok++;
    continue;
  }
  try {
    const url = originalUrl(asset.commons);
    await download(url, dest);
    console.log(`ok    ${asset.out}`);
    ok++;
  } catch (err) {
    console.error(`FAIL  ${asset.out}: ${err.message}`);
  }
}

console.log(`\n${ok}/${ASSETS.length} assets ready in public/images`);
