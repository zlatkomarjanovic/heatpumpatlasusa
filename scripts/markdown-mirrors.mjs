import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const markdown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
});

markdown.use(gfm);
markdown.addRule('definition', {
  filter: 'dt',
  replacement: (content) => '\n\n**' + content.trim() + '**\n',
});
markdown.addRule('definitionValue', {
  filter: 'dd',
  replacement: (content) => content.trim() + '\n\n',
});
markdown.addRule('disclosureLabel', {
  filter: 'summary',
  replacement: (content) => '\n\n**' + content.trim() + '**\n\n',
});
markdown.addRule('tableCell', {
  filter: ['th', 'td'],
  replacement: (content, node) => {
    const text = content.trim().replace(/\r?\n/g, ' ').replace(/(?<!\\)\|/g, '\\|');
    return (node.previousElementSibling ? ' ' : '| ') + text + ' |';
  },
});

function mirrorPath(pathname) {
  return pathname === '/' ? '/index.md' : pathname.replace(/\/$/, '') + '.md';
}

function meta($, property) {
  return $('meta[name="' + property + '"], meta[property="' + property + '"]').first().attr('content');
}

function validDate(date) {
  return typeof date === 'string' && !Number.isNaN(Date.parse(date)) ? date : null;
}

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const pathname = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('_')) return htmlFiles(pathname);
    return entry.isFile() && entry.name.endsWith('.html') ? [pathname] : [];
  }));
  return files.flat();
}

function dateModified($, canonical) {
  const date = validDate(meta($, 'article:modified_time'));
  if (date) return date;
  for (const node of $('script[type="application/ld+json"]').toArray()) {
    const data = JSON.parse($(node).text());
    const graph = Array.isArray(data['@graph']) ? data['@graph'] : [data];
    const entity = graph.find((value) =>
      value.url === canonical || value.mainEntityOfPage?.['@id'] === canonical,
    );
    const result = validDate(entity?.dateModified);
    if (result) return result;
  }
  return null;
}

function formatFrontMatter(fields) {
  return ['---', ...Object.entries(fields)
    .filter(([, value]) => value)
    .map(([name, value]) => name + ': ' + JSON.stringify(value)), '---'].join('\n');
}

function extractMain($, canonical) {
  const main = $('main').first().clone();
  if (!main.find('h1').length) throw new Error('No main heading for ' + canonical);

  main.find([
    'script', 'style', 'title', 'meta', 'link', 'template', 'noscript', 'svg', 'input', 'option',
    '[hidden]', '[aria-hidden="true"]', '.hidden[role="alert"]', '.hidden[role="status"]',
  ].join(', ')).remove();

  // DataTable emits the same facts as desktop rows and mobile cards.
  for (const table of main.find('figure table').toArray()) {
    $(table).parent().siblings('div[class~="sm:hidden"]').remove();
  }
  for (const caption of main.find('table > caption').toArray()) {
    $(caption).parent().before($('<p><strong></strong></p>').find('strong').text($(caption).text()).end());
    $(caption).remove();
  }

  for (const element of main.find('a[href], img[src]').toArray()) {
    const key = element.tagName === 'a' ? 'href' : 'src';
    const value = $(element).attr(key);
    const target = new URL(value, canonical);
    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(target.protocol)) {
      $(element).removeAttr(key);
    } else {
      $(element).attr(key, target.href);
    }
  }

  return main.html() ?? '';
}

export function markdownMirrors() {
  return {
    name: 'heat-pump-markdown-mirrors',
    hooks: {
      async 'astro:build:done'({ dir, logger }) {
        const root = fileURLToPath(dir);
        const sitemapIndex = load(await readFile(path.join(root, 'sitemap-index.xml'), 'utf8'), { xmlMode: true });
        const listed = new Map();
        const sitemaps = [];
        for (const locator of sitemapIndex('sitemap > loc').toArray()) {
          const filename = path.join(root, path.basename(new URL(sitemapIndex(locator).text()).pathname));
          const xml = load(await readFile(filename, 'utf8'), { xmlMode: true });
          sitemaps.push({ filename, xml });

          for (const location of xml('url > loc').toArray()) {
            const canonical = xml(location).text();
            if (listed.has(canonical)) throw new Error('Duplicate sitemap URL: ' + canonical);
            listed.set(canonical, { node: xml(location).parent(), xml });
          }
        }

        if (!listed.size) throw new Error('Markdown mirror generation requires an HTML sitemap.');
        const pages = [];
        for (const file of await htmlFiles(root)) {
          const raw = await readFile(file, 'utf8');
          const $ = load(raw);
          const canonical = $('link[rel="canonical"]').attr('href');
          if (/\bnoindex\b/i.test(meta($, 'robots') ?? '') || path.basename(file) === '404.html') continue;
          const sitemap = listed.get(canonical);
          if (!sitemap) throw new Error('Indexable HTML page missing from sitemap: ' + file);
          listed.delete(canonical);

          const mirrorUrl = new URL(mirrorPath(new URL(canonical).pathname), canonical);
          const title = $('title').first().text().trim();
          const description = meta($, 'description');
          const updated = dateModified($, canonical);
          if (!title || !description) throw new Error('Incomplete SEO metadata: ' + canonical);
          const body = markdown.turndown(extractMain($, canonical)).trim();
          if (!/^# .+/m.test(body)) throw new Error('Incomplete Markdown body: ' + canonical);

          const frontMatter = formatFrontMatter({
            title,
            description,
            canonical,
            language: $('html').attr('lang'),
            author: meta($, 'author'),
            published: validDate(meta($, 'article:published_time')),
            updated,
          });
          const mirror = path.join(root, mirrorUrl.pathname.slice(1));
          await writeFile(mirror, frontMatter + '\n\n' + body + '\n', { flag: 'wx' });

          const alternate = '<link rel="alternate" type="text/markdown" href="' + mirrorUrl.href + '">';
          if (!raw.includes('</head>')) throw new Error('Missing closing document head: ' + canonical);
          await writeFile(file, raw.replace('</head>', alternate + '</head>'));
          if (updated) sitemap.node.append(sitemap.xml('<lastmod>').text(updated));
          pages.push({ title, description, mirror: mirrorUrl.href });
        }

        if (listed.size) throw new Error('Sitemap URLs without indexable HTML: ' + [...listed.keys()].join(', '));
        for (const { filename, xml } of sitemaps) await writeFile(filename, xml.xml());

        pages.sort((a, b) => a.mirror.localeCompare(b.mirror));
        const directory = pages.map(({ title, description, mirror }) =>
          '- [' + markdown.escape(title) + '](' + mirror + '): ' + description,
        ).join('\n');
        const introduction = (await readFile(path.join(root, 'llms.txt'), 'utf8')).trimEnd();
        await writeFile(path.join(root, 'llms.txt'), introduction + '\n\n## Markdown copies\n\n' + directory + '\n');
        logger.info('Generated ' + pages.length + ' Markdown mirrors from current sitemap HTML.');
      },
    },
  };
}
