/**
 * Primary keyword map.
 *
 * Every money page on the site owns one exact-match query. Footer, related
 * blocks and schema all read from this list so internal anchors stay consistent.
 */
export type KeywordTarget = {
  href: string;
  keyword: string;
  group: 'cost' | 'compare' | 'rebate' | 'guide' | 'market' | 'tool';
};

export const KEYWORD_TARGETS: KeywordTarget[] = [
  { href: '/', keyword: 'heat pump cost', group: 'cost' },
  { href: '/heat-pump-cost/', keyword: 'heat pump installation cost', group: 'cost' },
  { href: '/mini-split-cost/', keyword: 'mini split installation cost', group: 'cost' },
  { href: '/heat-pump-operating-cost/', keyword: 'heat pump operating cost', group: 'cost' },
  { href: '/heat-pump-water-heater-cost/', keyword: 'heat pump water heater cost', group: 'cost' },
  { href: '/electrical-panel-upgrade-cost/', keyword: 'electrical panel upgrade cost', group: 'cost' },
  { href: '/calculator/', keyword: 'heat pump cost calculator', group: 'tool' },
  { href: '/heat-pump-vs-furnace/', keyword: 'heat pump vs furnace', group: 'compare' },
  { href: '/heat-pump-vs-oil/', keyword: 'heat pump vs oil', group: 'compare' },
  { href: '/compare/', keyword: 'heat pump comparison', group: 'compare' },
  { href: '/rebates/', keyword: 'heat pump rebates', group: 'rebate' },
  { href: '/heat-pump-tax-credit/', keyword: 'heat pump tax credit', group: 'rebate' },
  { href: '/rebates/mass-save/', keyword: 'mass save heat pump rebate', group: 'rebate' },
  { href: '/rebates/efficiency-maine/', keyword: 'efficiency maine heat pump rebate', group: 'rebate' },
  { href: '/rebates/xcel-energy/', keyword: 'xcel energy heat pump rebate', group: 'rebate' },
  { href: '/rebates/eversource/', keyword: 'eversource heat pump rebate', group: 'rebate' },
  { href: '/guides/are-heat-pumps-worth-it/', keyword: 'are heat pumps worth it', group: 'guide' },
  { href: '/guides/do-heat-pumps-work-in-cold-weather/', keyword: 'do heat pumps work in cold weather', group: 'guide' },
  { href: '/guides/what-size-heat-pump-do-i-need/', keyword: 'what size heat pump do i need', group: 'guide' },
  { href: '/guides/heat-pump-electric-bill/', keyword: 'heat pump electric bill', group: 'guide' },
  { href: '/guides/ducted-vs-ductless-heat-pump/', keyword: 'ducted vs ductless heat pump', group: 'guide' },
  { href: '/guides/air-source-vs-geothermal-heat-pump/', keyword: 'air source vs geothermal heat pump', group: 'guide' },
  { href: '/guides/dual-fuel-heat-pumps/', keyword: 'dual fuel heat pump', group: 'guide' },
  { href: '/guides/heat-pump-vs-electric-baseboard/', keyword: 'heat pump vs electric baseboard', group: 'guide' },
  { href: '/guides/heat-pump-vs-pellet-stove/', keyword: 'heat pump vs pellet stove', group: 'guide' },
  { href: '/markets/', keyword: 'heat pump cost by state', group: 'market' },
  { href: '/markets/boston-ma/', keyword: 'heat pump cost boston', group: 'market' },
  { href: '/markets/denver-co/', keyword: 'heat pump cost denver', group: 'market' },
  { href: '/markets/portland-me/', keyword: 'heat pump cost portland maine', group: 'market' },
  { href: '/markets/seattle-wa/', keyword: 'heat pump cost seattle', group: 'market' },
];

const RELATED_HREFS: Record<string, string[]> = {
  '/': [
    '/heat-pump-cost/',
    '/calculator/',
    '/mini-split-cost/',
    '/heat-pump-vs-furnace/',
    '/rebates/',
    '/guides/are-heat-pumps-worth-it/',
  ],
  '/heat-pump-cost/': [
    '/calculator/',
    '/mini-split-cost/',
    '/heat-pump-operating-cost/',
    '/electrical-panel-upgrade-cost/',
    '/rebates/',
    '/heat-pump-vs-furnace/',
  ],
  '/mini-split-cost/': [
    '/heat-pump-cost/',
    '/guides/ducted-vs-ductless-heat-pump/',
    '/calculator/',
    '/guides/what-size-heat-pump-do-i-need/',
    '/rebates/',
  ],
  '/heat-pump-operating-cost/': [
    '/heat-pump-vs-furnace/',
    '/heat-pump-vs-oil/',
    '/guides/heat-pump-electric-bill/',
    '/calculator/',
    '/markets/',
  ],
  '/heat-pump-water-heater-cost/': ['/heat-pump-cost/', '/rebates/', '/calculator/', '/electrical-panel-upgrade-cost/'],
  '/electrical-panel-upgrade-cost/': ['/heat-pump-cost/', '/calculator/', '/mini-split-cost/', '/rebates/'],
  '/calculator/': [
    '/heat-pump-cost/',
    '/heat-pump-operating-cost/',
    '/rebates/',
    '/heat-pump-vs-furnace/',
    '/guides/what-size-heat-pump-do-i-need/',
  ],
  '/heat-pump-vs-furnace/': [
    '/heat-pump-vs-oil/',
    '/guides/dual-fuel-heat-pumps/',
    '/heat-pump-operating-cost/',
    '/calculator/',
    '/guides/are-heat-pumps-worth-it/',
  ],
  '/heat-pump-vs-oil/': [
    '/heat-pump-vs-furnace/',
    '/rebates/efficiency-maine/',
    '/rebates/mass-save/',
    '/markets/portland-me/',
    '/calculator/',
  ],
  '/compare/': [
    '/heat-pump-vs-furnace/',
    '/heat-pump-vs-oil/',
    '/guides/heat-pump-vs-electric-baseboard/',
    '/guides/ducted-vs-ductless-heat-pump/',
    '/guides/air-source-vs-geothermal-heat-pump/',
  ],
  '/rebates/': [
    '/rebates/mass-save/',
    '/rebates/efficiency-maine/',
    '/rebates/xcel-energy/',
    '/rebates/eversource/',
    '/heat-pump-tax-credit/',
    '/calculator/',
  ],
  '/heat-pump-tax-credit/': ['/rebates/', '/rebates/mass-save/', '/calculator/', '/heat-pump-cost/'],
  '/rebates/mass-save/': ['/markets/boston-ma/', '/rebates/eversource/', '/heat-pump-vs-oil/', '/calculator/', '/rebates/'],
  '/rebates/efficiency-maine/': ['/markets/portland-me/', '/heat-pump-vs-oil/', '/calculator/', '/rebates/'],
  '/rebates/xcel-energy/': ['/markets/denver-co/', '/heat-pump-vs-furnace/', '/calculator/', '/rebates/'],
  '/rebates/eversource/': ['/rebates/mass-save/', '/markets/boston-ma/', '/calculator/', '/rebates/'],
  '/guides/are-heat-pumps-worth-it/': [
    '/heat-pump-vs-furnace/',
    '/heat-pump-operating-cost/',
    '/calculator/',
    '/guides/do-heat-pumps-work-in-cold-weather/',
  ],
  '/guides/do-heat-pumps-work-in-cold-weather/': [
    '/guides/what-size-heat-pump-do-i-need/',
    '/guides/dual-fuel-heat-pumps/',
    '/heat-pump-operating-cost/',
    '/calculator/',
  ],
  '/guides/what-size-heat-pump-do-i-need/': [
    '/calculator/',
    '/guides/ducted-vs-ductless-heat-pump/',
    '/mini-split-cost/',
    '/guides/do-heat-pumps-work-in-cold-weather/',
  ],
  '/guides/heat-pump-electric-bill/': [
    '/heat-pump-operating-cost/',
    '/calculator/',
    '/guides/are-heat-pumps-worth-it/',
    '/heat-pump-vs-furnace/',
  ],
  '/guides/ducted-vs-ductless-heat-pump/': ['/mini-split-cost/', '/heat-pump-cost/', '/guides/what-size-heat-pump-do-i-need/'],
  '/guides/air-source-vs-geothermal-heat-pump/': ['/heat-pump-cost/', '/calculator/', '/guides/are-heat-pumps-worth-it/'],
  '/guides/dual-fuel-heat-pumps/': ['/heat-pump-vs-furnace/', '/guides/do-heat-pumps-work-in-cold-weather/', '/calculator/'],
  '/guides/heat-pump-vs-electric-baseboard/': ['/heat-pump-operating-cost/', '/mini-split-cost/', '/calculator/'],
  '/guides/heat-pump-vs-pellet-stove/': ['/heat-pump-vs-oil/', '/heat-pump-operating-cost/', '/calculator/'],
  '/markets/': ['/markets/boston-ma/', '/markets/portland-me/', '/markets/denver-co/', '/markets/seattle-wa/', '/calculator/'],
  '/markets/boston-ma/': ['/rebates/mass-save/', '/heat-pump-cost/', '/heat-pump-vs-oil/', '/calculator/'],
  '/markets/denver-co/': ['/rebates/xcel-energy/', '/heat-pump-vs-furnace/', '/calculator/'],
  '/markets/portland-me/': ['/rebates/efficiency-maine/', '/heat-pump-vs-oil/', '/calculator/'],
  '/markets/seattle-wa/': ['/heat-pump-operating-cost/', '/heat-pump-cost/', '/calculator/'],
};

const byHref = new Map(KEYWORD_TARGETS.map((t) => [t.href, t]));

export function keywordFor(path: string): string | undefined {
  return byHref.get(path)?.keyword;
}

export function relatedKeywords(path: string): KeywordTarget[] {
  const hrefs = RELATED_HREFS[path] ?? KEYWORD_TARGETS.filter((t) => t.href !== path).slice(0, 6).map((t) => t.href);
  return hrefs.map((href) => byHref.get(href)).filter((t): t is KeywordTarget => Boolean(t));
}

export const KEYWORD_GROUPS: { title: string; items: KeywordTarget[] }[] = [
  { title: 'Costs', items: KEYWORD_TARGETS.filter((t) => t.group === 'cost' || t.group === 'tool') },
  { title: 'Compare', items: KEYWORD_TARGETS.filter((t) => t.group === 'compare') },
  { title: 'Rebates', items: KEYWORD_TARGETS.filter((t) => t.group === 'rebate') },
  { title: 'Guides', items: KEYWORD_TARGETS.filter((t) => t.group === 'guide') },
  { title: 'Markets', items: KEYWORD_TARGETS.filter((t) => t.group === 'market') },
];
