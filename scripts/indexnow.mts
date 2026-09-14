/**
 * Ping IndexNow with every URL in the built sitemap.
 * The key file must already be live at https://heatpumpatlasusa.com/{key}.txt
 */
import fs from 'node:fs';
import path from 'node:path';
import { SITE } from '../src/data/site.ts';

const sitemapPath = path.resolve('dist/sitemap-0.xml');
const xml = fs.readFileSync(sitemapPath, 'utf8');
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

if (urls.length === 0) {
  throw new Error('No URLs found in dist/sitemap-0.xml. Run npm run build first.');
}

const body = {
  host: 'heatpumpatlasusa.com',
  key: SITE.indexNowKey,
  keyLocation: `${SITE.url}/${SITE.indexNowKey}.txt`,
  urlList: urls,
};

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});

console.log(`IndexNow ${res.status} ${res.statusText} for ${urls.length} URLs`);
if (!res.ok) {
  console.log(await res.text());
  process.exitCode = 1;
}
