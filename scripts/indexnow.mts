/**
 * Ping IndexNow with every URL in the built sitemap.
 * The key file must already be live at https://heatpumpatlasusa.com/{key}.txt
 *
 * Bing's shared IndexNow endpoint can reject a site that is not verified in
 * Bing Webmaster. Yandex accepts the same key file, so we try both.
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

const endpoints = [
  'https://www.bing.com/indexnow',
  'https://api.indexnow.org/indexnow',
  'https://yandex.com/indexnow',
];

let accepted = 0;
for (const endpoint of endpoints) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log(`${endpoint} ${res.status} ${res.statusText} for ${urls.length} URLs`);
  if (text) console.log(text);
  if (res.ok || res.status === 202) accepted += 1;
}

if (accepted === 0) {
  process.exitCode = 1;
}
