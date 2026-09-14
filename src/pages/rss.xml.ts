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

  const moneyPages = [
    { title: 'Heat pump installation cost (2026)', description: 'Installed cost bands by system type for US homes.', link: '/heat-pump-cost/' },
    { title: 'Mini split installation cost (2026)', description: 'Per-zone ductless pricing and when ductless beats ducted.', link: '/mini-split-cost/' },
    { title: 'Heat pump vs furnace', description: 'State-by-state running cost model, including where the furnace wins.', link: '/heat-pump-vs-furnace/' },
    { title: 'Heat pump vs oil', description: 'Why the Northeast oil conversion is the strongest case in the country.', link: '/heat-pump-vs-oil/' },
    { title: 'Heat pump cost calculator', description: 'ZIP-level installed cost, operating cost, open rebates and payback.', link: '/calculator/' },
    { title: 'Heat pump rebates still open', description: 'Verified program status for Mass Save, Efficiency Maine, Xcel and Eversource.', link: '/rebates/' },
    { title: 'Mass Save heat pump rebate', description: '2026 amounts, whole-home vs partial-home, and the reservation rule.', link: '/rebates/mass-save/' },
    { title: 'Efficiency Maine heat pump rebate', description: 'Income tiers, caps and which Maine programs are reserved.', link: '/rebates/efficiency-maine/' },
  ];

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
    ...moneyPages.map((page) => ({
      title: page.title,
      description: page.description,
      pubDate: new Date('2026-09-14'),
      link: page.link,
      categories: ['cost'],
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
