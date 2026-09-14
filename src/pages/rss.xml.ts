import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '@/data/site';
import type { APIContext } from 'astro';

/**
 * RSS feed for guides and market analyses.
 * Rebate pages are excluded because their verification dates move independently
 * of an editorial publish cadence and would spam the feed.
 */
export async function GET(context: APIContext) {
  const guides = await getCollection('guides', (g) => !g.data.draft);
  const markets = await getCollection('markets', (m) => !m.data.draft);

  const items = [
    ...guides.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.published ?? entry.data.updated,
      link: `/guides/${entry.id}/`,
      categories: entry.data.tags,
    })),
    ...markets.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.published ?? entry.data.updated,
      link: `/markets/${entry.id}/`,
      categories: entry.data.tags,
    })),
  ].sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  return rss({
    title: `${SITE.name}: heat pump costs, comparisons and rebates`,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items,
    customData: `<language>en-us</language><copyright>${SITE.name}</copyright>`,
  });
}
