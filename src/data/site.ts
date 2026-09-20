/**
 * Site-wide configuration and editorial metadata.
 *
 * Everything the SEO component, schema builders and footer need lives here so
 * that changing the brand, contact address or data revision note is a one-file edit.
 */

export const SITE = {
  name: 'HeatPumpAtlasUSA',
  shortName: 'Heat Pump Atlas',
  domain: 'heatpumpatlasusa.com',
  url: 'https://heatpumpatlasusa.com',
  tagline: 'Data-driven heat pump costs, comparisons, rebates and switching economics for US homeowners.',
  description:
    'Heat pump installation cost, mini split prices, operating cost by state, open heat pump rebates, and a free calculator that models whether switching pays off where you live.',
  locale: 'en-US',
  email: 'editor@heatpumpatlasusa.com',
  /** Bump when the underlying dataset is refreshed. Surfaced on methodology and in schema. */
  dataRevision: '2026.09',
  /** Human-readable date of the last data refresh, ISO format. */
  dataUpdated: '2026-09-14',
  founded: '2026',
  /** Public IndexNow key. The matching file lives at /{key}.txt. */
  indexNowKey: '7c4e9a2b8f1d6e0a3c5b9d4f8a2e1c70',
} as const;

/**
 * Public profiles linked from Organization schema sameAs.
 * The footer deliberately does not render these; schema keeps the single copy.
 */
export const SOCIAL_PROFILES = [
  { label: 'GitHub', href: 'https://github.com/zlatkomarjanovic/heatpumpatlasusa' },
] as const;

/**
 * Primary navigation. Kept short on purpose: hub pages only.
 * `children` renders as a dropdown on desktop and an expandable group on mobile.
 */
export type NavItem = {
  label: string;
  href: string;
  description?: string;
  children?: NavItem[];
};

export const PRIMARY_NAV: NavItem[] = [
  {
    label: 'Costs',
    href: '/heat-pump-cost/',
    description: 'What heat pumps actually cost to install',
    children: [
      { label: 'Heat pump cost', href: '/heat-pump-cost/', description: 'Installed cost by system type and region' },
      { label: 'Mini split cost', href: '/mini-split-cost/', description: 'Single and multi-zone ductless pricing' },
      { label: 'Operating cost', href: '/heat-pump-operating-cost/', description: 'What it costs to run, by fuel and state' },
      { label: 'Heat pump water heaters', href: '/heat-pump-water-heater-cost/', description: 'Hybrid water heater pricing and payback' },
      { label: 'Panel upgrades', href: '/electrical-panel-upgrade-cost/', description: 'When a heat pump forces an electrical upgrade' },
    ],
  },
  {
    label: 'Compare',
    href: '/compare/',
    description: 'Heat pumps against the system you already have',
    children: [
      { label: 'Heat pump vs furnace', href: '/heat-pump-vs-furnace/', description: 'Gas, propane and electric resistance' },
      { label: 'Heat pump vs oil', href: '/heat-pump-vs-oil/', description: 'The Northeast oil conversion case' },
      { label: 'Heat pump vs electric baseboard', href: '/guides/heat-pump-vs-electric-baseboard/', description: 'The biggest running-cost cut of any switch' },
      { label: 'Ducted vs ductless', href: '/guides/ducted-vs-ductless-heat-pump/', description: 'Which layout fits your house and budget' },
      { label: 'Air source vs geothermal', href: '/guides/air-source-vs-geothermal-heat-pump/', description: 'When the ground loop is worth the premium' },
      { label: 'Heat pump vs pellet stove', href: '/guides/heat-pump-vs-pellet-stove/', description: 'Cheap hands-on heat vs hands-off whole-home' },
      { label: 'All comparisons', href: '/compare/', description: 'Every head-to-head we publish' },
    ],
  },
  {
    label: 'Guides',
    href: '/guides/',
    description: 'Plain-English answers to the big questions',
    children: [
      { label: 'Are heat pumps worth it?', href: '/guides/are-heat-pumps-worth-it/', description: 'The honest answer, state by state' },
      { label: 'Do they work in cold weather?', href: '/guides/do-heat-pumps-work-in-cold-weather/', description: 'Cold-climate performance, explained' },
      { label: 'What size do I need?', href: '/guides/what-size-heat-pump-do-i-need/', description: 'Sizing, Manual J and tonnage' },
      { label: 'Do I need a panel upgrade?', href: '/guides/do-i-need-a-panel-upgrade-for-a-heat-pump/', description: 'When a 100 amp service is enough' },
      { label: 'Heat pumps and your electric bill', href: '/guides/heat-pump-electric-bill/', description: 'What actually happens to the bill' },
      { label: 'All guides', href: '/guides/', description: 'The full guide library' },
    ],
  },
  {
    label: 'Calculator',
    href: '/calculator/',
    description: 'Model your own switch',
  },
  {
    label: 'Rebates',
    href: '/rebates/',
    description: 'Which programs are open right now',
    children: [
      { label: 'All heat pump rebates', href: '/rebates/', description: 'Only programs still accepting applications' },
      { label: 'Mass Save heat pump rebate', href: '/rebates/mass-save/', description: 'Massachusetts, up to $10,000' },
      { label: 'Efficiency Maine heat pump rebate', href: '/rebates/efficiency-maine/', description: 'Income tiers and the reserved HEAR money' },
      { label: 'NYSERDA heat pump rebate', href: '/rebates/nys-clean-heat/', description: 'NYS Clean Heat plus New York HEAR' },
      { label: 'Efficiency Vermont heat pump rebate', href: '/rebates/efficiency-vermont/', description: 'Open rebate, waitlisted HEAR' },
      { label: 'Energize CT heat pump rebate', href: '/rebates/energize-ct/', description: 'Connecticut utility rebate and rates' },
      { label: 'Heat pump tax credit', href: '/heat-pump-tax-credit/', description: '25C ended for 2026 installs' },
    ],
  },
  {
    label: 'Markets',
    href: '/markets/',
    description: 'Where switching pays off',
  },
  {
    label: 'Methodology',
    href: '/methodology/',
    description: 'How every number on this site is produced',
  },
];

export const FOOTER_NAV: { title: string; links: NavItem[] }[] = [
  {
    title: 'Costs',
    links: [
      { label: 'Heat pump installation cost', href: '/heat-pump-cost/' },
      { label: 'Mini split installation cost', href: '/mini-split-cost/' },
      { label: 'Heat pump operating cost', href: '/heat-pump-operating-cost/' },
      { label: 'Heat pump water heater cost', href: '/heat-pump-water-heater-cost/' },
      { label: 'Electrical panel upgrade cost', href: '/electrical-panel-upgrade-cost/' },
      { label: 'Heat pump cost calculator', href: '/calculator/' },
    ],
  },
  {
    title: 'Compare & guides',
    links: [
      { label: 'All comparisons', href: '/compare/' },
      { label: 'Heat pump vs furnace', href: '/heat-pump-vs-furnace/' },
      { label: 'Heat pump vs oil', href: '/heat-pump-vs-oil/' },
      { label: 'Are heat pumps worth it?', href: '/guides/are-heat-pumps-worth-it/' },
      { label: 'Guide library', href: '/guides/' },
    ],
  },
  {
    title: 'Rebates',
    links: [
      { label: 'Heat pump rebates', href: '/rebates/' },
      { label: 'Heat pump tax credit', href: '/heat-pump-tax-credit/' },
      { label: 'Mass Save heat pump rebate', href: '/rebates/mass-save/' },
      { label: 'Efficiency Maine heat pump rebate', href: '/rebates/efficiency-maine/' },
      { label: 'NYSERDA heat pump rebate', href: '/rebates/nys-clean-heat/' },
      { label: 'Efficiency Vermont heat pump rebate', href: '/rebates/efficiency-vermont/' },
      { label: 'Energize CT heat pump rebate', href: '/rebates/energize-ct/' },
      { label: 'Xcel Energy heat pump rebate', href: '/rebates/xcel-energy/' },
    ],
  },
  {
    title: 'Markets',
    links: [
      { label: 'All markets', href: '/markets/' },
      { label: 'Boston, MA', href: '/markets/boston-ma/' },
      { label: 'Denver, CO', href: '/markets/denver-co/' },
      { label: 'Portland, ME', href: '/markets/portland-me/' },
      { label: 'Seattle, WA', href: '/markets/seattle-wa/' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: 'About us', href: '/about/' },
      { label: 'Data sources', href: '/methodology/#sources' },
      { label: 'Privacy policy', href: '/privacy/' },
      { label: 'Terms of service', href: '/terms/' },
      { label: 'Disclaimer', href: '/disclaimer/' },
    ],
  },
];

export const AUTHOR = {
  name: 'HeatPumpAtlasUSA Editorial',
  role: 'Research and data team',
  url: '/about/',
} as const;