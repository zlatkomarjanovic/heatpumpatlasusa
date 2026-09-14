/**
 * Installed cost model.
 *
 * These are ranges derived from the competitor and quote research documented in
 * seo-research plus published contractor pricing. They intentionally overlap and
 * are wide, because a single national average is misleading. The UI must label
 * these as modelled ranges, not quotes.
 *
 * Sources behind these bands:
 * - Rewiring America published whole-home and single-zone ranges
 * - Bryant / Carrier / Trane published 2026 pricing guides
 * - This Old House 2026 installed averages
 * - HomeGuide / Homewyse national trade pricing
 * - Live contractor pages in Denver, Boston, Seattle
 */

export type SystemKey =
  | 'ducted-ashp-standard'
  | 'ducted-ashp-cold-climate'
  | 'ducted-ashp-replacement'
  | 'ductless-single-zone'
  | 'ductless-multi-zone'
  | 'geothermal'
  | 'hpwh'
  | 'panel-upgrade';

export type CostBand = {
  key: SystemKey;
  label: string;
  shortLabel: string;
  /** Low end of installed cost, USD, for a typical 1,800 to 2,200 sqft US home. */
  low: number;
  /** High end of installed cost, USD. */
  high: number;
  /** What is included in the band. */
  includes: string;
  /** What routinely pushes a project above the band. */
  excludes: string;
  /** True when the band already reflects a ducted system in an existing ducted home. */
  assumesExistingDucts: boolean;
};

export const COST_BANDS: Record<SystemKey, CostBand> = {
  'ducted-ashp-standard': {
    key: 'ducted-ashp-standard',
    label: 'Ducted air source heat pump, new install',
    shortLabel: 'Ducted heat pump',
    low: 9500,
    high: 22000,
    includes: 'Outdoor unit, indoor air handler or coil, line set, thermostat, standard labor, permit',
    excludes: 'New ductwork, electrical panel upgrade, duct sealing, asbestos or code remediation',
    assumesExistingDucts: true,
  },
  'ducted-ashp-cold-climate': {
    key: 'ducted-ashp-cold-climate',
    label: 'Cold-climate ducted heat pump',
    shortLabel: 'Cold-climate heat pump',
    low: 12000,
    high: 28000,
    includes: 'Cold-climate rated outdoor unit, matched indoor unit, low-ambient controls, standard labor',
    excludes: 'Panel upgrade, ductwork replacement, backup heat staging changes',
    assumesExistingDucts: true,
  },
  'ducted-ashp-replacement': {
    key: 'ducted-ashp-replacement',
    label: 'Like-for-like replacement of an existing ducted system',
    shortLabel: 'Replacement',
    low: 7000,
    high: 16000,
    includes: 'Equipment swap reusing existing line set and ductwork where code allows',
    excludes: 'R-22 to R-410A or R-32 line set changes, duct repairs, electrical work',
    assumesExistingDucts: true,
  },
  'ductless-single-zone': {
    key: 'ductless-single-zone',
    label: 'Single-zone ductless mini split',
    shortLabel: 'Single-zone mini split',
    low: 2800,
    high: 8500,
    includes: 'One outdoor unit, one indoor head, line set, electrical whip, standard labor',
    excludes: 'Additional heads, long line runs, panel work, condensate routing in finished walls',
    assumesExistingDucts: false,
  },
  'ductless-multi-zone': {
    key: 'ductless-multi-zone',
    label: 'Multi-zone ductless mini split',
    shortLabel: 'Multi-zone mini split',
    low: 6500,
    high: 20000,
    includes: 'One outdoor unit, three to five indoor heads, line sets, standard labor',
    excludes: 'More than five zones, very long line runs, panel upgrade, drywall repair',
    assumesExistingDucts: false,
  },
  geothermal: {
    key: 'geothermal',
    label: 'Geothermal ground source heat pump',
    shortLabel: 'Geothermal',
    low: 18000,
    high: 45000,
    includes: 'Ground loop, indoor unit, circulating pumps, excavation or drilling, standard labor',
    excludes: 'Rock drilling surcharges, landscape restoration, long loop runs',
    assumesExistingDucts: true,
  },
  hpwh: {
    key: 'hpwh',
    label: 'Heat pump water heater, installed',
    shortLabel: 'Heat pump water heater',
    low: 1800,
    high: 5200,
    includes: '50 to 80 gallon hybrid unit, standard install, condensate handling, permit',
    excludes: 'Electrical circuit adds, pan and drain work, tight-space ducting',
    assumesExistingDucts: false,
  },
  'panel-upgrade': {
    key: 'panel-upgrade',
    label: 'Electrical panel upgrade to 200A',
    shortLabel: 'Panel upgrade',
    low: 1400,
    high: 5500,
    includes: '200A panel and breakers, permit, standard service entrance work',
    excludes: 'Meter relocation, service mast replacement, utility-side feeds, trenching',
    assumesExistingDucts: false,
  },
};

/** Electrical work that a heat pump sometimes forces, priced separately. */
export const ELECTRICAL_ADDERS = {
  dedicated240vCircuit: { low: 350, high: 1200, label: 'Dedicated 240V circuit' },
  panelUpgrade: COST_BANDS['panel-upgrade'],
  serviceUpgrade: { low: 5000, high: 18000, label: 'Service entrance upgrade' },
} as const;

/** Regional multipliers applied to the national bands. Modelled, not measured. */
export const REGION_MULTIPLIERS: Record<string, number> = {
  Northeast: 1.15,
  West: 1.2,
  Midwest: 0.95,
  South: 0.92,
};

/** Dense urban and high-cost metros carry a further premium. Modelled. */
export const HIGH_COST_MULTIPLIER = 1.12;

export const HIGH_COST_STATES = new Set(['CA', 'MA', 'NY', 'CT', 'WA', 'HI', 'AK', 'NJ', 'RI', 'DC']);

/** Efficiency assumptions used by the operating cost model. */
export const EFFICIENCY = {
  /** Seasonal heating COP for a standard cold-climate ducted heat pump. */
  ashpStandard: 2.6,
  ashpColdClimate: 2.9,
  /** Seasonal COP for ductless mini splits, which avoid duct losses. */
  ductless: 3.0,
  /** Coefficient of performance for electric resistance. */
  resistance: 1.0,
  /** Annual fuel utilization efficiency for a gas furnace. */
  gasFurnace: 0.9,
  /** AFUE for oil furnaces and boilers. */
  oilFurnace: 0.82,
  /** AFUE for propane furnaces. */
  propaneFurnace: 0.82,
  /** Combustion efficiency for a modern EPA-certified wood or pellet stove. */
  woodStove: 0.75,
  /** Duct loss factor applied to ducted systems in unconditioned space. */
  ductLossDucted: 0.15,
  /** Duct loss for ductless, effectively zero. */
  ductLossDuctless: 0.02,
} as const;

/** Energy content constants. */
export const ENERGY_UNITS = {
  /** Therms per Mcf, using the EIA residential heat content convention. */
  thermsPerMcf: 10.27,
  /** kWh per therm of delivered heat. */
  kwhPerTherm: 29.31,
  /** kWh thermal per gallon of heating oil. */
  kwhPerGallonOil: 40.6,
  /** kWh thermal per gallon of propane. */
  kwhPerGallonPropane: 27.0,
  /** kWh thermal per ton of wood pellets (about 16.4 MMBTU per ton). */
  kwhPerTonPellet: 4806,
  /** kWh thermal per MMBTU, used for combustion emissions math. */
  kwhPerMmbtu: 293.071,
} as const;

/** Insulation quality adjustments applied to modelled heating load. */
export const INSULATION_FACTORS = {
  poor: 1.3,
  average: 1.0,
  good: 0.82,
  excellent: 0.7,
} as const;

export type InsulationKey = keyof typeof INSULATION_FACTORS;

/** Home age adjustments applied on top of insulation quality. */
export const HOME_AGE_FACTORS = {
  pre1950: 1.18,
  '1950-1979': 1.06,
  '1980-1999': 1.0,
  '2000-2014': 0.95,
  '2015-plus': 0.88,
} as const;

export type HomeAgeKey = keyof typeof HOME_AGE_FACTORS;

/**
 * Base annual heating load in kWh thermal per square foot per heating degree day,
 * measured before equipment efficiency and before duct losses.
 *
 * Calibration: an 1,800 sqft home in a 7,826 HDD climate (Maine) should consume
 * roughly 850 to 900 gallons of heating oil a year, which is about 33,000 to
 * 36,000 kWh thermal. Using 0.0025 gives 1800 * 7826 * 0.0025 = 35,217 kWh,
 * which matches. An earlier value of 0.0125 produced 176,085 kWh, a five-fold
 * overstatement that made every modelled bill absurd.
 */
export const BASE_KWH_THERMAL_PER_SQFT_PER_HDD = 0.0025;