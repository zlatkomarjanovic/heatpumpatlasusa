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
    { title: 'Heat pump cost: $9,500 to $22,000 installed (2026)', description: 'Installed cost bands by system type for US homes.', link: '/heat-pump-cost/' },
    { title: 'Mini split heat pump installation cost (2026)', description: 'Per-zone ductless pricing and when ductless beats ducted.', link: '/mini-split-cost/' },
    { title: 'Heat pump water heater cost', description: 'Hybrid tank pricing, payback vs electric or propane, and when it is not worth it.', link: '/heat-pump-water-heater-cost/' },
    { title: 'Heat pump vs gas furnace cost', description: 'State-by-state running cost model, including where the furnace wins.', link: '/heat-pump-vs-furnace/' },
    { title: 'Heat pump vs oil heat', description: 'Why the Northeast oil conversion is the strongest case in the country.', link: '/heat-pump-vs-oil/' },
    { title: 'Heat pump comparisons', description: 'Furnace, oil, baseboard, ducted vs ductless, and geothermal on real energy prices.', link: '/compare/' },
    { title: 'Heat pump cost calculator', description: 'ZIP-level installed cost, operating cost, open rebates and payback.', link: '/calculator/' },
    { title: 'Heat pump rebates still open', description: 'Verified program status for Mass Save, Efficiency Maine, NYSERDA, Vermont and more.', link: '/rebates/' },
    { title: 'Heat pump tax credit ended in 2026', description: '25C is gone for 2026 installs. What Massachusetts and other states still pay.', link: '/heat-pump-tax-credit/' },
    { title: 'Mass Save heat pump rebate Massachusetts', description: '2026 amounts, whole-home vs partial-home, and the reservation rule.', link: '/rebates/mass-save/' },
    { title: 'Efficiency Maine heat pump rebate', description: 'Income tiers, caps and which Maine programs are reserved.', link: '/rebates/efficiency-maine/' },
    { title: 'NYSERDA heat pump rebate', description: 'NYS Clean Heat amounts, New York HEAR, and what no longer stacks.', link: '/rebates/nys-clean-heat/' },
    { title: 'Efficiency Vermont heat pump rebate', description: 'Open Vermont tiers and why HEAR is waitlisted.', link: '/rebates/efficiency-vermont/' },
    { title: 'Electrical panel upgrade cost', description: '200 amp panel pricing and when a heat pump actually needs one.', link: '/electrical-panel-upgrade-cost/' },
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
      pubDate: new Date('2026-09-22'),
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
