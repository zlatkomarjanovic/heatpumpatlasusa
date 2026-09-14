/**
 * Shared source library.
 *
 * Pages import named source objects rather than retyping URLs, so a changed URL
 * is a single edit and citation consistency is automatic.
 */
import type { Citation } from '@/types/content';

export const SOURCES = {
  eiaElectricity: {
    label: 'Electric Power Monthly, Table 5.6.A: average price of electricity by state',
    url: 'https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_a',
    publisher: 'US Energy Information Administration',
    supports: 'Residential electricity price by state. June 2026 release used across the site.',
    primary: true,
  },
  eiaMonthly: {
    label: 'Electric Power Monthly',
    url: 'https://www.eia.gov/electricity/monthly/',
    publisher: 'US Energy Information Administration',
    supports: 'Release schedule and full tables, including 5.6.B year-to-date prices.',
    primary: true,
  },
  eiaGas: {
    label: 'Natural gas prices, residential sector by state',
    url: 'https://www.eia.gov/dnav/ng/ng_pri_sum_a_epg0_prs_dmcf_m.htm',
    publisher: 'US Energy Information Administration',
    supports: 'Residential natural gas price per thousand cubic feet. May 2026 used for operating cost comparisons.',
    primary: true,
  },
  eiaHeatingOil: {
    label: 'Heating oil and propane prices',
    url: 'https://www.eia.gov/petroleum/heatingoilpropane/',
    publisher: 'US Energy Information Administration',
    supports: 'Weekly Northeast heating oil and propane reference prices.',
    primary: true,
  },
  noaaHdd: {
    label: 'Population-weighted heating degree day data, state monthly summaries',
    url: 'https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/cdus/degree_days/',
    publisher: 'NOAA Climate Prediction Center',
    supports: 'Season heating degree days used to scale the modelled heating load.',
    primary: true,
  },
  censusFuel: {
    label: 'American Community Survey, table B25040: house heating fuel',
    url: 'https://data.census.gov/table?q=B25040',
    publisher: 'US Census Bureau',
    supports: 'Share of homes heating with utility gas, fuel oil, propane and electricity.',
    primary: true,
  },
  censusVintage: {
    label: 'American Community Survey, table B25034: year structure built',
    url: 'https://data.census.gov/table?q=B25034',
    publisher: 'US Census Bureau',
    supports: 'Housing vintage, used as an envelope-efficiency input.',
    primary: true,
  },
  dsire: {
    label: 'Database of State Incentives for Renewables and Efficiency',
    url: 'https://www.dsireusa.org/',
    publisher: 'NC Clean Energy Technology Center',
    supports: 'Program inventory used to find incentives, then verified against the administrator.',
    primary: true,
  },
  doeHomeUpgrades: {
    label: 'Home energy rebates and upgrades',
    url: 'https://www.energy.gov/save/home-upgrades',
    publisher: 'US Department of Energy',
    supports: 'Federal HEAR and HOMES program structure and eligible measures.',
    primary: true,
  },
  irs25c: {
    label: 'Energy Efficient Home Improvement Credit (25C)',
    url: 'https://www.irs.gov/credits-deductions/energy-efficient-home-improvement-credit',
    publisher: 'Internal Revenue Service',
    supports: 'Federal tax credit rules. The credit expired for property placed in service after 31 December 2025.',
    primary: true,
  },
  energyStarTaxCredits: {
    label: 'Federal tax credits for energy efficiency',
    url: 'https://www.energystar.gov/about/federal-tax-credits',
    publisher: 'ENERGY STAR',
    supports: 'Equipment eligibility and credit amounts. Still displays 25C terms that no longer apply to 2026 installations.',
    primary: true,
  },
  energyStarCalculator: {
    label: 'ENERGY STAR savings calculator',
    url: 'https://www.energystar.gov/products/heating_cooling/guide/savings-calculator/standalone',
    publisher: 'ENERGY STAR',
    supports: 'Consumer-facing comparison tool used as a calculator benchmark.',
    primary: true,
  },
  nrelResStock: {
    label: 'ResStock building stock datasets',
    url: 'https://resstock.nrel.gov/datasets',
    publisher: 'National Renewable Energy Laboratory',
    supports: 'End-use load profiles and heat pump upgrade packages by climate and vintage.',
    primary: true,
  },
  epriCalculator: {
    label: 'Residential space heating cost comparison calculator',
    url: 'https://apps.epri.com/ResidentialSpaceHeatingCalculator/',
    publisher: 'Electric Power Research Institute',
    supports: 'Lifecycle cost methodology reference for heating system comparison.',
    primary: true,
  },
  rewiringAmericaCosts: {
    label: "Here's how much heat pumps cost to install",
    url: 'https://homes.rewiringamerica.org/articles/heating-and-cooling/heat-pump-costs',
    publisher: 'Rewiring America',
    supports: 'Published whole-home and single-zone installed cost ranges, used as a benchmark for our bands.',
  },
  rewiringAmericaPanel: {
    label: 'Pros and cons of a panel upgrade',
    url: 'https://homes.rewiringamerica.org/articles/electrical-panel/electrical-panel-upgrade-pros-cons',
    publisher: 'Rewiring America',
    supports: 'Typical panel upgrade cost range used in the electrical adder model.',
  },
  thisOldHouseCost: {
    label: 'How much does a heat pump cost? (2026 pricing)',
    url: 'https://www.thisoldhouse.com/heating-cooling/heat-pump-cost',
    publisher: 'This Old House',
    supports: '2026 installed averages for central heat pumps and mini splits.',
  },
  massSaveHeatPumps: {
    label: 'Mass Save air source heat pump rebates',
    url: 'https://www.masssave.com/residential/rebates-offers-services/heating-and-cooling/heat-pumps/air-source-heat-pumps',
    publisher: 'Mass Save',
    supports: 'Massachusetts rebate tiers, sizing bonus and financing terms.',
    primary: true,
  },
  efficiencyMaineRebates: {
    label: 'Efficiency Maine residential heat pump rebates',
    url: 'https://www.efficiencymaine.com/at-home/residential-heat-pump-rebates/',
    publisher: 'Efficiency Maine',
    supports: 'Maine rebate tiers by income and outdoor unit limits.',
    primary: true,
  },
  coloradoEnergyOffice: {
    label: 'Colorado home energy rebate program',
    url: 'https://energyoffice.colorado.gov/home-energy-rebates',
    publisher: 'Colorado Energy Office',
    supports: 'Colorado HEAR amounts for space heating, cold climate equipment and water heaters.',
    primary: true,
  },
  coloradoTaxCredit: {
    label: 'Colorado heat pump tax credits',
    url: 'https://energyoffice.colorado.gov/hptc',
    publisher: 'Colorado Energy Office',
    supports: 'State heat pump tax credit claimed per four tons of installed capacity.',
    primary: true,
  },
  xcelHeatPumps: {
    label: 'Xcel Energy Colorado heat pump rebates',
    url: 'https://co.my.xcelenergy.com/s/residential/heating-cooling/heat-pumps',
    publisher: 'Xcel Energy',
    supports: 'Utility rebate tiers for Colorado residential customers.',
    primary: true,
  },
  nyserdaCleanHeat: {
    label: 'NYS Clean Heat heat pump program',
    url: 'https://cleanheat.ny.gov/',
    publisher: 'NYSERDA',
    supports: 'New York heat pump incentives by utility territory.',
    primary: true,
  },
  techCleanCalifornia: {
    label: 'TECH Clean California / HEEHRA rebate status',
    url: 'https://techcleanca.com/incentives/heehrarebates/',
    publisher: 'TECH Clean California',
    supports: 'California HEEHRA reservation status for single-family projects.',
    primary: true,
  },
  cecRebates: {
    label: 'Inflation Reduction Act residential energy rebate programs',
    url: 'https://www.energy.ca.gov/programs-and-topics/programs/inflation-reduction-act-residential-energy-rebate-programs',
    publisher: 'California Energy Commission',
    supports: 'California HEEHRA program structure and income qualification.',
    primary: true,
  },
  agaComparison: {
    label: 'Natural gas or a heat pump? Where you live matters',
    url: 'https://www.aga.org/natural-gas-or-a-heat-pump-where-you-live-matters/',
    publisher: 'American Gas Association',
    supports: 'The gas industry claim that a least-efficient gas furnace beats a best-in-class heat pump in 36 states. Used as the position our comparison model tests.',
  },
  acDirectComparison: {
    label: 'Heat pump vs gas furnace in 2026: the real cost comparison',
    url: 'https://www.acdirect.com/blog/heat-pump-vs-gas-furnace-2026-cost-comparison',
    publisher: 'AC Direct',
    supports: 'Contractor-side 10-year cost comparison framing.',
  },
  leadCosts99Calls: {
    label: 'Google Ads lead costs for HVAC services in 2026',
    url: 'https://99calls.com/blog/google-ads-lead-costs-hvac-2026',
    publisher: '99 Calls',
    supports: 'Observed HVAC cost per lead, roughly $190 to $335 for average campaigns.',
  },
  leadCostsElevarus: {
    label: 'HVAC lead generation costs',
    url: 'https://elevarus.com/hvac-lead-generation/',
    publisher: 'Elevarus',
    supports: 'Shared versus exclusive lead pricing ranges and typical close rates.',
  },
  energysageMarketplace: {
    label: 'Heat Pump Marketplace overview',
    url: 'https://info.energysage.com/partner-resources/heat-pump-marketplace',
    publisher: 'EnergySage',
    supports: 'Incumbent marketplace model: homeowners select which installers receive their request.',
  },
} satisfies Record<string, Citation>;

export type SourceKey = keyof typeof SOURCES;

/** Resolve a list of keys into citation objects, dropping unknown keys. */
export function pickSources(keys: SourceKey[]): Citation[] {
  return keys.map((k) => SOURCES[k]).filter(Boolean);
}
