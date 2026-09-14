// Post-build audit: crawlability, internal links, metadata and schema.
//
// Runs against ./dist so it validates the actual shipped HTML rather than the
// source. Exits non-zero on any hard failure so it can gate a deploy.
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const SITE = 'https://heatpumpatlasusa.com';

const failures = [];
const warnings = [];
const notes = [];

function fail(msg) {
  failures.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const allFiles = walk(DIST);
const htmlFiles = allFiles.filter((f) => f.endsWith('.html'));

/** Map every built HTML file to its URL path as the site would serve it. */
const pages = new Map();
for (const file of htmlFiles) {
  let rel = path.relative(DIST, file).replace(/\\/g, '/');
  let url;
  if (rel === 'index.html') url = '/';
  else if (rel.endsWith('/index.html')) url = '/' + rel.slice(0, -'index.html'.length);
  else if (rel === '404.html') url = '/404.html';
  else url = '/' + rel;
  pages.set(url, file);
}

notes.push(`Built HTML pages: ${htmlFiles.length}`);

// ---------------------------------------------------------------------------
// 1. Every page must have a unique title, a meta description and a canonical.
// ---------------------------------------------------------------------------
const titles = new Map();
const descriptions = new Map();
const canonicals = new Map();

for (const [url, file] of pages) {
  const html = fs.readFileSync(file, 'utf8');

  const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim();
  if (!title) fail(`Missing <title>: ${url}`);
  else {
    if (title.length > 70) warn(`Title over 70 chars (${title.length}): ${url}`);
    if (title.length < 15) warn(`Title under 15 chars: ${url}`);
    if (titles.has(title)) fail(`Duplicate title "${title}" on ${url} and ${titles.get(title)}`);
    else titles.set(title, url);
  }

  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1]?.trim();
  if (!desc) fail(`Missing meta description: ${url}`);
  else {
    if (desc.length > 175) warn(`Description over 175 chars (${desc.length}): ${url}`);
    if (desc.length < 60) warn(`Description under 60 chars: ${url}`);
    if (descriptions.has(desc)) fail(`Duplicate description on ${url} and ${descriptions.get(desc)}`);
    else descriptions.set(desc, url);
  }

  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  if (!canonical) fail(`Missing canonical: ${url}`);
  else {
    if (!canonical.startsWith(SITE)) fail(`Canonical not absolute or wrong host on ${url}: ${canonical}`);
    if (canonicals.has(canonical)) fail(`Duplicate canonical ${canonical} on ${url} and ${canonicals.get(canonical)}`);
    else canonicals.set(canonical, url);

    // Canonical must match the page's own URL.
    const expected = url === '/404.html' ? `${SITE}/404/` : `${SITE}${url}`;
    if (canonical !== expected && !(url === '/' && canonical === `${SITE}/`)) {
      if (url === '/404.html') {
        // 404 canonical points at /404/, which is fine.
      } else {
        warn(`Canonical mismatch on ${url}: expected ${expected}, got ${canonical}`);
      }
    }
  }

  // Heading hierarchy: exactly one h1.
  const h1Count = (html.match(/<h1[\s>]/g) || []).length;
  if (h1Count === 0) fail(`No <h1> on ${url}`);
  if (h1Count > 1) fail(`${h1Count} <h1> elements on ${url}`);

  // Open Graph essentials.
  if (!html.includes('property="og:title"')) fail(`Missing og:title: ${url}`);
  if (!html.includes('property="og:description"')) fail(`Missing og:description: ${url}`);
  if (!html.includes('property="og:image"')) fail(`Missing og:image: ${url}`);
  if (!html.includes('name="twitter:card"')) fail(`Missing twitter:card: ${url}`);

  // Structured data must parse.
  const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (ldBlocks.length === 0) fail(`No JSON-LD on ${url}`);
  for (const [, raw] of ldBlocks) {
    try {
      const parsed = JSON.parse(raw);
      const graph = Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed];
      for (const node of graph) {
        if (!node['@type']) fail(`JSON-LD node missing @type on ${url}`);
      }
    } catch (error) {
      fail(`Invalid JSON-LD on ${url}: ${String(error.message).slice(0, 80)}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Internal link integrity.
// ---------------------------------------------------------------------------
let internalLinkCount = 0;
const inbound = new Map([...pages.keys()].map((u) => [u, 0]));
const brokenLinks = new Map();

for (const [url, file] of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);

  for (const href of hrefs) {
    if (!href.startsWith('/')) continue;
    if (href.startsWith('//')) continue;
    internalLinkCount += 1;

    const target = href.split('#')[0].split('?')[0];
    if (!target) continue; // pure fragment link on the same page

    // Normalise to the served URL form.
    let resolved = target;
    if (!resolved.endsWith('/') && !path.extname(resolved)) resolved += '/';

    const existsInPages = pages.has(resolved);
    const existsAsFile = fs.existsSync(path.join(DIST, resolved.replace(/^\//, '')));
    const existsAsAsset = allFiles.some(
      (f) => '/' + path.relative(DIST, f).replace(/\\/g, '/') === resolved,
    );

    if (!existsInPages && !existsAsFile && !existsAsAsset) {
      if (!brokenLinks.has(resolved)) brokenLinks.set(resolved, []);
      brokenLinks.get(resolved).push(url);
    } else if (existsInPages) {
      inbound.set(resolved, (inbound.get(resolved) || 0) + 1);
    }
  }
}

for (const [target, sources] of brokenLinks) {
  fail(`Broken internal link: ${target} (linked from ${[...new Set(sources)].slice(0, 4).join(', ')})`);
}

notes.push(`Internal links checked: ${internalLinkCount}`);

// ---------------------------------------------------------------------------
// 3. Orphan detection: every page should have at least one inbound internal link.
// ---------------------------------------------------------------------------
for (const [url, count] of inbound) {
  if (url === '/' ) continue;
  // 404 is intentionally unreachable from navigation.
  if (url === '/404.html') continue;
  if (count === 0) fail(`Orphan page (no inbound internal links): ${url}`);
}

// ---------------------------------------------------------------------------
// 4. Required infrastructure files.
// ---------------------------------------------------------------------------
for (const required of ['robots.txt', 'sitemap-index.xml', 'rss.xml', 'favicon.svg', 'og-default.svg']) {
  if (!fs.existsSync(path.join(DIST, required))) fail(`Missing required file: ${required}`);
}

const robots = fs.existsSync(path.join(DIST, 'robots.txt'))
  ? fs.readFileSync(path.join(DIST, 'robots.txt'), 'utf8')
  : '';
if (robots && !/Sitemap:\s*https:\/\/heatpumpatlasusa\.com\/sitemap-index\.xml/.test(robots)) {
  fail('robots.txt does not reference the sitemap at the canonical host');
}
if (robots && /Disallow:\s*\/\s*$/m.test(robots)) {
  fail('robots.txt blocks the whole site');
}

// Sitemap should include every indexable page.
if (fs.existsSync(path.join(DIST, 'sitemap-0.xml'))) {
  const sitemap = fs.readFileSync(path.join(DIST, 'sitemap-0.xml'), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  notes.push(`Sitemap entries: ${urls.length}`);
  for (const [url] of pages) {
    if (url === '/404.html') continue;
    const expected = `${SITE}${url}`;
    if (!urls.includes(expected)) warn(`Page missing from sitemap: ${url}`);
  }
}

// ---------------------------------------------------------------------------
// 5. Crawlable content: no important text injected only by client JS.
// ---------------------------------------------------------------------------
for (const [url, file] of pages) {
  const html = fs.readFileSync(file, 'utf8');
  // Strip scripts and styles, then check there is meaningful visible text.
  const text = html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length < 600) fail(`Page has very little server-rendered text (${text.length} chars): ${url}`);
}

// ---------------------------------------------------------------------------
// 6. Image and accessibility basics.
// ---------------------------------------------------------------------------
for (const [url, file] of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  for (const img of imgs) {
    if (!/\balt=/.test(img)) fail(`<img> without alt on ${url}`);
  }
  // Anchors with no accessible text.
  const emptyAnchors = [...html.matchAll(/<a\b[^>]*>(\s*)<\/a>/g)];
  if (emptyAnchors.length > 0) warn(`${emptyAnchors.length} empty anchor(s) on ${url}`);
  if (!html.includes('id="main"')) fail(`Missing main landmark: ${url}`);
  if (!html.includes('class="skip-link"')) fail(`Missing skip link: ${url}`);
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log('\n=== AUDIT NOTES ===');
for (const n of notes) console.log('  ' + n);

if (warnings.length) {
  console.log('\n=== WARNINGS (' + warnings.length + ') ===');
  for (const w of warnings) console.log('  ! ' + w);
}

if (failures.length) {
  console.log('\n=== FAILURES (' + failures.length + ') ===');
  for (const f of failures) console.log('  X ' + f);
  process.exit(1);
}

console.log('\nAll audit checks passed.');