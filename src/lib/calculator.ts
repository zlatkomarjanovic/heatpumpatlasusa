/**
 * Calculator engine.
 *
 * Pure functions only. No DOM, no React, no fetching. This is deliberate: the
 * numbers on the site must be reproducible and testable, and replacing this file
 * with a call to a real dataset or API later should not require touching the UI.
 *
 * Every output is tagged with a confidence level so the interface can be honest
 * about which figures are anchored to published data and which are modelled.
 */

import {
  COST_BANDS,
  EFFICIENCY,
  ELECTRICAL_ADDERS,
  ENERGY_UNITS,
  HIGH_COST_MULTIPLIER,
  HIGH_COST_STATES,
  HOME_AGE_FACTORS,
  INSULATION_FACTORS,
  REGION_MULTIPLIERS,
  BASE_KWH_THERMAL_PER_SQFT_PER_HDD,
  type HomeAgeKey,
  type InsulationKey,
  type SystemKey,
} from '@/data/costs';
import { FUEL_REFERENCE, NATIONAL_AVERAGE, type StateRecord } from '@/data/states';

export type HeatingFuel = 'gas' | 'oil' | 'propane' | 'electric-resistance' | 'wood' | 'unknown';
export type Distribution = 'ducted' | 'ductless' | 'mixed';
export type PanelStatus = '200a' | '100a' | 'unknown';
export type Confidence = 'high' | 'medium' | 'low';

export type CalculatorInput = {
  zip: string;
  sqft: number;
  fuel: HeatingFuel;
  /** Annual heating spend in USD, optional. When provided it calibrates the load estimate. */
  annualHeatingSpend: number | null;
  distribution: Distribution;
  zones: number;
  insulation: InsulationKey;
  homeAge: HomeAgeKey;
  panel: PanelStatus;
  /** State resolved from ZIP by the caller; the engine never guesses geography. */
  state: StateRecord | null;
  /** Recommended system, defaults to ducted standard unless the caller overrides. */
  system?: SystemKey;
};

export type CostRange = { low: number; high: number };

export type RebateLine = {
  id: string;
  program: string;
  amountLow: number;
  amountHigh: number;
  status: 'open' | 'enrolling' | 'reserved' | 'expired' | 'unknown';
  note: string;
  /** Internal program page, when we publish one. */
  href?: string;
};

export type CalculatorResult = {
  /** Annual space-heating load in kWh thermal, before system efficiency. */
  heatingLoadKwhThermal: number;
  loadConfidence: Confidence;
  installedCost: CostRange;
  installedCostConfidence: Confidence;
  electricalAdders: { label: string; range: CostRange; reason: string }[];
  operating: {
    currentSystemAnnual: number | null;
    heatPumpAnnual: number;
    difference: number;
    cheaperToRunHeatPump: boolean;
  };
  tenYear: {
    heatPump: number;
    current: number | null;
    difference: number | null;
  };
  rebates: RebateLine[];
  rebateConfidence: Confidence;
  paybackYears: number | null;
  effectiveUpfrontCost: CostRange;
  emissions: {
    heatPumpTonsPerYear: number;
    currentTonsPerYear: number | null;
    difference: number | null;
  };
  assumptions: string[];
  warnings: string[];
  inputsEcho: {
    zip: string;
    sqft: number;
    fuel: HeatingFuel;
    distribution: Distribution;
    system: SystemKey;
    stateCode: string | null;
  };
};

/** kWh of electricity per kWh of delivered heat, including duct losses. */
function seasonalEfficiencyFor(system: SystemKey, distribution: Distribution): number {
  const ductLoss = distribution === 'ductless' ? EFFICIENCY.ductLossDuctless : EFFICIENCY.ductLossDucted;
  switch (system) {
    case 'ductless-single-zone':
    case 'ductless-multi-zone':
      return EFFICIENCY.ductless * (1 - EFFICIENCY.ductLossDuctless);
    case 'ducted-ashp-cold-climate':
      return EFFICIENCY.ashpColdClimate * (1 - ductLoss);
    case 'ducted-ashp-standard':
    case 'ducted-ashp-replacement':
      return EFFICIENCY.ashpStandard * (1 - ductLoss);
    case 'geothermal':
      return 3.6;
    default:
      return EFFICIENCY.ashpStandard * (1 - ductLoss);
  }
}

/**
 * Estimate annual space heating load.
 *
 * Preferred path: back out the load from the homeowner's actual spend, which is
 * the single most reliable signal they can give us. Fallback path: model from
 * square footage, climate, envelope and vintage, and mark it lower confidence.
 */
function estimateHeatingLoad(
  input: CalculatorInput,
  state: StateRecord | null,
): { load: number; confidence: Confidence; method: string } {
  if (input.annualHeatingSpend && input.annualHeatingSpend > 100 && input.fuel !== 'unknown') {
    const deliveredKwhThermal = spendToDeliveredHeat(
      input.annualHeatingSpend,
      input.fuel,
      state,
      input.distribution,
    );
    if (deliveredKwhThermal > 0) {
      return {
        load: deliveredKwhThermal,
        confidence: 'high',
        method: 'Derived from your reported annual heating spend and the current fuel efficiency assumption',
      };
    }
  }

  const hdd = state?.heatingDegreeDays ?? NATIONAL_AVERAGE.heatingDegreeDays;
  const insulationFactor = INSULATION_FACTORS[input.insulation];
  const ageFactor = HOME_AGE_FACTORS[input.homeAge];
  const baseLoad = input.sqft * hdd * BASE_KWH_THERMAL_PER_SQFT_PER_HDD;
  const load = baseLoad * insulationFactor * ageFactor;

  return {
    load: Math.max(load, 0),
    confidence: hdd === NATIONAL_AVERAGE.heatingDegreeDays ? 'low' : 'medium',
    method: 'Modelled from floor area, heating degree days, envelope quality and build vintage',
  };
}

/**
 * Convert an annual fuel spend into delivered kWh of heat.
 *
 * Note the efficiency direction throughout this file: `kwhThermal` is measured
 * before the heating system's efficiency is applied. A furnace burning fuel
 * produces less delivered heat than the fuel's energy content, so delivered
 * equals input multiplied by efficiency. A heat pump produces more delivered
 * heat than the electricity it consumes, so delivered equals input multiplied
 * by COP. Getting this backwards flips the entire comparison.
 */
/**
 * Convert an annual fuel spend into delivered kWh of heat (at the register).
 *
 * Ducted fossil systems lose heat in the same ductwork a ducted heat pump would
 * use, so we apply the duct penalty when the home is ducted. Baseboard, boilers
 * feeding radiators, and wood or pellet stoves deliver heat straight into the
 * room, so they take no duct loss.
 */
function spendToDeliveredHeat(
  spend: number,
  fuel: HeatingFuel,
  state: StateRecord | null,
  distribution: Distribution,
): number {
  const ductFactor = 1 - incumbentDuctLoss(distribution);
  switch (fuel) {
    case 'gas': {
      const pricePerMcf = state?.gasDollarsPerMcf ?? NATIONAL_AVERAGE.gasDollarsPerMcf;
      const therms = (spend / pricePerMcf) * ENERGY_UNITS.thermsPerMcf;
      return therms * ENERGY_UNITS.kwhPerTherm * EFFICIENCY.gasFurnace * ductFactor;
    }
    case 'oil': {
      const gallons = spend / FUEL_REFERENCE.heatingOilDollarsPerGallon;
      return gallons * ENERGY_UNITS.kwhPerGallonOil * EFFICIENCY.oilFurnace * ductFactor;
    }
    case 'propane': {
      const gallons = spend / FUEL_REFERENCE.propaneDollarsPerGallon;
      return gallons * ENERGY_UNITS.kwhPerGallonPropane * EFFICIENCY.propaneFurnace * ductFactor;
    }
    case 'electric-resistance': {
      // Baseboard heat has no duct system, so the full input becomes delivered heat.
      const rate = state?.electricityCentsPerKwh ?? NATIONAL_AVERAGE.electricityCentsPerKwh;
      return ((spend * 100) / rate) * EFFICIENCY.resistance;
    }
    case 'wood': {
      // Pellet or cordwood stove: spend buys tons of pellets, burned at stove efficiency.
      const tons = spend / FUEL_REFERENCE.pelletDollarsPerTon;
      return tons * ENERGY_UNITS.kwhPerTonPellet * EFFICIENCY.woodStove;
    }
    default:
      return 0;
  }
}

/**
 * Duct loss applies to whichever system distributes heat through ducts.
 *
 * This matters for fairness. A gas, oil or propane furnace delivers its heat
 * through the same leaky ductwork as a ducted heat pump, so applying a duct
 * penalty only to the heat pump would bias every comparison against it. When the
 * home is ducted, both sides take the loss. When the home is ductless, neither
 * does, because a boiler feeding radiators and a mini split head both deliver
 * heat into the room they serve.
 */
function incumbentDuctLoss(distribution: Distribution): number {
  return distribution === 'ductless' ? 0 : EFFICIENCY.ductLossDucted;
}

/**
 * Annual cost to run the existing heating system for a given delivered heat load.
 *
 * The incumbent must clear the same duct-loss hurdle as a ducted heat pump,
 * because it distributes heat through the same ductwork. Electric resistance is
 * baseboard or space heating and has no ducts, so it takes no loss.
 */
function currentSystemAnnualCost(
  loadKwhThermal: number,
  input: CalculatorInput,
  state: StateRecord | null,
): number | null {
  if (input.fuel === 'unknown') return null;

  // Baseboard and stoves have no ductwork, so they take no duct loss on the load.
  const ductless = input.fuel === 'electric-resistance' || input.fuel === 'wood';
  const ductLoss = ductless ? 0 : incumbentDuctLoss(input.distribution);
  const loadAtEquipment = loadKwhThermal / (1 - ductLoss);

  switch (input.fuel) {
    case 'gas': {
      const pricePerMcf = state?.gasDollarsPerMcf ?? NATIONAL_AVERAGE.gasDollarsPerMcf;
      const therms = loadAtEquipment / EFFICIENCY.gasFurnace / ENERGY_UNITS.kwhPerTherm;
      return (therms / ENERGY_UNITS.thermsPerMcf) * pricePerMcf;
    }
    case 'oil': {
      const gallons = loadAtEquipment / EFFICIENCY.oilFurnace / ENERGY_UNITS.kwhPerGallonOil;
      return gallons * FUEL_REFERENCE.heatingOilDollarsPerGallon;
    }
    case 'propane': {
      const gallons = loadAtEquipment / EFFICIENCY.propaneFurnace / ENERGY_UNITS.kwhPerGallonPropane;
      return gallons * FUEL_REFERENCE.propaneDollarsPerGallon;
    }
    case 'electric-resistance': {
      const rate = (state?.electricityCentsPerKwh ?? NATIONAL_AVERAGE.electricityCentsPerKwh) / 100;
      return (loadKwhThermal / EFFICIENCY.resistance) * rate;
    }
    case 'wood': {
      // Stove delivers heat straight into the room, so no duct loss on the load.
      const tons = loadKwhThermal / EFFICIENCY.woodStove / ENERGY_UNITS.kwhPerTonPellet;
      return tons * FUEL_REFERENCE.pelletDollarsPerTon;
    }
    default:
      return null;
  }
}

/** Regional multiplier for installed cost. */
function regionalMultiplier(state: StateRecord | null): number {
  if (!state) return 1;
  const regional = REGION_MULTIPLIERS[state.region] ?? 1;
  const highCost = HIGH_COST_STATES.has(state.code) ? HIGH_COST_MULTIPLIER : 1;
  return regional * highCost;
}

/**
 * Rebate lines for a state.
 *
 * This is intentionally a small, hand-maintained table rather than a scraped
 * national database. Programs change status faster than any automated feed we
 * evaluated, and publishing a stale "open" rebate would be worse than publishing
 * fewer programs. See /methodology/#rebates.
 */
export const STATE_REBATES: Record<string, RebateLine[]> = {
  MA: [
    { id: 'ma-mass-save-whole-home', program: 'Mass Save whole-home air source heat pump', amountLow: 1250, amountHigh: 10000, status: 'open', note: 'Rebate scales with tons installed and whether the heat pump covers the whole home. Income-qualified tiers can exceed the standard cap.', href: '/rebates/mass-save/' },
    { id: 'ma-mass-save-partial', program: 'Mass Save partial-home air source heat pump', amountLow: 500, amountHigh: 2500, status: 'open', note: 'Partial-home projects are eligible for a lower rebate, plus a sizing bonus in some cases.', href: '/rebates/mass-save/' },
    { id: 'ma-hear', program: 'Massachusetts HEAR (federal home energy rebate)', amountLow: 0, amountHigh: 8000, status: 'enrolling', note: 'Federal HEAR funds are allocated to Massachusetts; consumer portal timing and income gates have moved. Confirm status before promising a figure.' },
  ],
  ME: [
    { id: 'me-efficiency-maine-standard', program: 'Efficiency Maine standard heat pump rebate', amountLow: 500, amountHigh: 1000, status: 'open', note: 'Per eligible outdoor unit, with a lifetime cap per housing unit.', href: '/rebates/efficiency-maine/' },
    { id: 'me-efficiency-maine-moderate', program: 'Efficiency Maine moderate-income rebate', amountLow: 1000, amountHigh: 2000, status: 'open', note: 'Income-qualified tier.', href: '/rebates/efficiency-maine/' },
    { id: 'me-efficiency-maine-low', program: 'Efficiency Maine low-income rebate', amountLow: 3000, amountHigh: 9000, status: 'open', note: 'Per eligible outdoor unit up to a lifetime cap of $9,000 per housing unit.', href: '/rebates/efficiency-maine/' },
    { id: 'me-hear', program: 'Maine HEAR', amountLow: 0, amountHigh: 8000, status: 'reserved', note: 'Maine reached its initial reservation ceiling quickly and paused new applications. Treat as waitlist, not available.' },
  ],
  CO: [
    { id: 'co-hear-space-heating', program: 'Colorado HEAR heat pump for space heating and cooling', amountLow: 3000, amountHigh: 8000, status: 'open', note: '$3,000 standard, or up to $8,000 for qualifying cold-climate equipment. Income limits apply to the higher tier.' },
    { id: 'co-hear-hpwh', program: 'Colorado HEAR heat pump water heater', amountLow: 1750, amountHigh: 1750, status: 'open', note: 'Fixed per-unit rebate.' },
    { id: 'co-state-tax-credit', program: 'Colorado heat pump state tax credit', amountLow: 1000, amountHigh: 3000, status: 'open', note: 'Claimed by the registered contractor and passed through on the invoice, per four tons of installed capacity.' },
    { id: 'co-xcel', program: 'Xcel Energy Colorado heat pump rebate', amountLow: 400, amountHigh: 2400, status: 'open', note: 'Varies by equipment tier and whether the home is gas-heated.', href: '/rebates/xcel-energy/' },
    { id: 'co-power-ahead', program: 'Power Ahead Colorado heat pump rebate', amountLow: 1500, amountHigh: 1500, status: 'open', note: 'Denver-region rebate for qualifying ENERGY STAR equipment.' },
  ],
  NY: [
    { id: 'ny-clean-heat', program: 'NYS Clean Heat heat pump rebate', amountLow: 1000, amountHigh: 8000, status: 'open', note: 'Administered per utility territory; amounts vary by contractor and equipment tier.', href: '/rebates/nys-clean-heat/' },
    { id: 'ny-hear', program: 'New York HEAR', amountLow: 0, amountHigh: 8000, status: 'open', note: 'New York is one of the states with a fully live consumer portal. Income-qualified.', href: '/rebates/nys-clean-heat/' },
    { id: 'ny-con-edison', program: 'Con Edison heat pump rebate', amountLow: 1000, amountHigh: 6000, status: 'open', note: 'Utility-level program on top of NYS Clean Heat for qualifying projects.', href: '/rebates/nys-clean-heat/' },
  ],
  VT: [
    { id: 'vt-efficiency-vermont', program: 'Efficiency Vermont heat pump rebate', amountLow: 500, amountHigh: 4500, status: 'open', note: 'Tiered by income and system type.', href: '/rebates/efficiency-vermont/' },
    { id: 'vt-hear', program: 'Vermont HEAR', amountLow: 0, amountHigh: 8000, status: 'reserved', note: 'Vermont consumed its initial tranche and waitlists new applications.' },
  ],
  CA: [
    { id: 'ca-tec-heehra', program: 'TECH Clean California / HEEHRA heat pump rebate', amountLow: 1000, amountHigh: 8000, status: 'reserved', note: 'Single-family HEEHRA was fully reserved statewide by February 2026 and stopped accepting new income verifications. Do not quote as available.' },
    { id: 'ca-sce', program: 'Southern California Edison heat pump rebate', amountLow: 500, amountHigh: 3000, status: 'open', note: 'Utility program, amount varies by equipment and territory.' },
    { id: 'ca-pge', program: 'PG&E heat pump rebate', amountLow: 500, amountHigh: 3000, status: 'open', note: 'Utility program, subject to capacity and program year.' },
  ],
  WA: [
    { id: 'wa-commerce-hear', program: 'Washington HEAR (Commerce)', amountLow: 1000, amountHigh: 8000, status: 'open', note: 'Income-qualified; program year funding can close mid-year.' },
  ],
  OR: [
    { id: 'or-energy-trust', program: 'Energy Trust of Oregon heat pump incentive', amountLow: 400, amountHigh: 2500, status: 'open', note: 'Varies by existing fuel, equipment tier and whether ductwork is included.', href: '/rebates/energy-trust-oregon/' },
  ],
  MN: [
    { id: 'mn-hear', program: 'Minnesota HEAR', amountLow: 1000, amountHigh: 8000, status: 'enrolling', note: 'Accepted federal funding; portal availability has lagged. Confirm before quoting.' },
  ],
  IL: [
    { id: 'il-hear', program: 'Illinois HEAR', amountLow: 1000, amountHigh: 8000, status: 'enrolling', note: 'Program design and contractor certification in progress during 2026.' },
  ],
  NJ: [
    { id: 'nj-hear', program: 'New Jersey HEAR', amountLow: 1000, amountHigh: 8000, status: 'enrolling', note: 'Accepted federal funding; consumer portal timing has moved.' },
  ],
  MD: [
    { id: 'md-hear', program: 'Maryland HEAR', amountLow: 1000, amountHigh: 8000, status: 'enrolling', note: 'Enrolling; confirm current incentive schedule.' },
  ],
  NH: [
    { id: 'nh-hear', program: 'New Hampshire HEAR', amountLow: 1000, amountHigh: 14000, status: 'enrolling', note: 'Program has been launching during 2026; totals depend on income tier and measures.' },
  ],
  RI: [
    { id: 'ri-clean-heat', program: 'Rhode Island Clean Heat heat pump rebate', amountLow: 500, amountHigh: 3000, status: 'open', note: 'Utility program, tiered.' },
  ],
  CT: [
    { id: 'ct-energize', program: 'Energize CT heat pump rebate', amountLow: 500, amountHigh: 3500, status: 'open', note: 'Tiered by income and system.', href: '/rebates/energize-ct/' },
  ],
  PA: [
    { id: 'pa-hear', program: 'Pennsylvania HEAR', amountLow: 1000, amountHigh: 8000, status: 'enrolling', note: 'Enrolling during 2026.' },
  ],
  MI: [
    { id: 'mi-hear', program: 'Michigan HEAR', amountLow: 1000, amountHigh: 8000, status: 'open', note: 'Launched; funding is first-come.' },
  ],
  WI: [
    { id: 'wi-focus-on-energy', program: 'Focus on Energy heat pump incentive', amountLow: 400, amountHigh: 2000, status: 'open', note: 'Residential tiered incentive.', href: '/rebates/focus-on-energy/' },
  ],
  GA: [
    { id: 'ga-hear', program: 'Georgia HEAR', amountLow: 1000, amountHigh: 8000, status: 'open', note: 'One of the earlier live programs, with income tiers.' },
  ],
  NM: [
    { id: 'nm-hear', program: 'New Mexico HEAR', amountLow: 1000, amountHigh: 8000, status: 'open', note: 'Live consumer portal.' },
  ],
  VA: [
    { id: 'va-hear', program: 'Virginia HEAR', amountLow: 1000, amountHigh: 8000, status: 'open', note: 'Launched; confirm current funding tranche.' },
  ],
  HI: [
    { id: 'hi-hear', program: 'Hawaii HEAR', amountLow: 1000, amountHigh: 8000, status: 'open', note: 'Live consumer portal.' },
  ],
  AK: [
    { id: 'ak-ahfc', program: 'Alaska AHFC home energy rebate', amountLow: 5000, amountHigh: 10000, status: 'open', note: 'AHFC rebates stack with HEAR in Alaska, producing the highest combined totals in the country.' },
  ],
};

export function rebatesForState(stateCode: string | null): RebateLine[] {
  if (!stateCode) return [];
  return STATE_REBATES[stateCode] ?? [];
}

/** Determine the recommended system from the distribution and climate. */
function recommendSystem(input: CalculatorInput, state: StateRecord | null): SystemKey {
  if (input.system) return input.system;
  if (input.distribution === 'ductless') {
    return input.zones > 1 ? 'ductless-multi-zone' : 'ductless-single-zone';
  }
  const hdd = state?.heatingDegreeDays ?? NATIONAL_AVERAGE.heatingDegreeDays;
  if (hdd >= 6000) return 'ducted-ashp-cold-climate';
  return 'ducted-ashp-standard';
}

export function runCalculator(input: CalculatorInput): CalculatorResult {
  const state = input.state;
  const system = recommendSystem(input, state);
  const band = COST_BANDS[system];
  const multiplier = regionalMultiplier(state);
  const assumptions: string[] = [];
  const warnings: string[] = [];

  const installedCost: CostRange = {
    low: Math.round((band.low * multiplier) / 100) * 100,
    high: Math.round((band.high * multiplier) / 100) * 100,
  };

  const { load, confidence: loadConfidence, method } = estimateHeatingLoad(input, state);
  assumptions.push(`Heating load: ${method}.`);

  if (loadConfidence === 'low') {
    warnings.push('We could not resolve an energy price for your state, so operating costs use the national average.');
  }

  // Electrical adders.
  const electricalAdders: CalculatorResult['electricalAdders'] = [];
  if (input.panel === '100a') {
    electricalAdders.push({
      label: 'Electrical panel upgrade to 200A',
      range: ELECTRICAL_ADDERS.panelUpgrade as unknown as CostRange,
      reason: 'A 100A service often cannot carry a heat pump, backup heat and an electric range or dryer at once. An electrician must confirm with a load calculation.',
    });
  } else if (input.panel === 'unknown') {
    electricalAdders.push({
      label: 'Possible panel work (not confirmed)',
      range: { low: 0, high: 5500 },
      reason: 'Panel capacity is unconfirmed. Get an electrician to run a load calculation before signing a heat pump contract.',
    });
  }
  if (system === 'ductless-single-zone' || system === 'ductless-multi-zone') {
    electricalAdders.push({
      label: 'Dedicated 240V circuit per outdoor unit',
      range: ELECTRICAL_ADDERS.dedicated240vCircuit as unknown as CostRange,
      reason: 'Ductless systems need a dedicated circuit at the outdoor unit.',
    });
  }

  // Operating costs.
  // heatPumpAnnual is electricity purchased, so delivered heat is divided by COP.
  const efficiency = seasonalEfficiencyFor(system, input.distribution);
  const electricRate = (state?.electricityCentsPerKwh ?? NATIONAL_AVERAGE.electricityCentsPerKwh) / 100;
  const heatPumpAnnual = (load / efficiency) * electricRate;
  const currentAnnual = currentSystemAnnualCost(load, input, state);
  const difference = currentAnnual === null ? 0 : currentAnnual - heatPumpAnnual;

  if (input.fuel === 'gas' && difference < 0) {
    warnings.push(
      'In your state, modelled gas heating is cheaper to run than a heat pump at current rates. The case for switching here is comfort, cooling, or incentives, not the monthly bill.',
    );
  }
  if (input.fuel === 'unknown') {
    warnings.push('No current fuel selected, so we could not compare against what you run today.');
  }

  // Rebates.
  const rebates = rebatesForState(state?.code ?? null);
  const openRebates = rebates.filter((r) => r.status === 'open');
  const rebateLow = openRebates.reduce((sum, r) => sum + r.amountLow, 0);
  const rebateHigh = openRebates.reduce((sum, r) => sum + r.amountHigh, 0);

  if (rebates.some((r) => r.status === 'reserved')) {
    warnings.push('At least one program in your state is reserved or paused. It is excluded from the totals.');
  }

  const rebateConfidence: Confidence = rebates.length === 0 ? 'low' : 'medium';

  const effectiveUpfrontCost: CostRange = {
    low: Math.max(0, installedCost.low - rebateHigh),
    high: Math.max(0, installedCost.high - rebateLow),
  };

  // Totals.
  const adderLow = electricalAdders.reduce((sum, a) => sum + a.range.low, 0);
  const adderHigh = electricalAdders.reduce((sum, a) => sum + a.range.high, 0);
  const upfrontLow = installedCost.low + adderLow;
  const upfrontHigh = installedCost.high + adderHigh;

  const tenYearHeatPump = upfrontLow - rebateHigh + heatPumpAnnual * 10;
  const tenYearCurrent = currentAnnual === null ? null : currentAnnual * 10;
  const tenYearDifference = tenYearCurrent === null ? null : tenYearCurrent - tenYearHeatPump;

  let paybackYears: number | null = null;
  if (difference > 0) {
    const netCost = Math.max(floorForPayback(upfrontLow - rebateHigh), 0);
    paybackYears = Math.max(0, Math.round((netCost / difference) * 10) / 10);
  }

  // Emissions. US grid average is roughly 0.85 lb CO2 per kWh delivered (eGRID-class factor).
  const gridLbCo2PerKwh = 0.85;
  const heatPumpTonsPerYear = ((load / efficiency) * gridLbCo2PerKwh) / 2000;
  const currentTonsPerYear = currentEmissions(load, input.fuel);

  assumptions.push(
    `Installed cost bands are national ranges with a ${multiplier.toFixed(2)}x regional factor applied for ${state?.name ?? 'the national average'}.`,
  );
  assumptions.push(
    `Heat pump seasonal efficiency assumed at COP ${efficiency.toFixed(2)} including duct losses for a ${input.distribution} system.`,
  );
  if (state) {
    assumptions.push(
      `Electricity at ${state.electricityCentsPerKwh.toFixed(2)} cents per kWh, EIA residential average for ${state.name}, June 2026.`,
    );
  }

  return {
    heatingLoadKwhThermal: Math.round(load),
    loadConfidence,
    installedCost,
    installedCostConfidence: 'medium',
    electricalAdders,
    operating: {
      currentSystemAnnual: currentAnnual === null ? null : Math.round(currentAnnual),
      heatPumpAnnual: Math.round(heatPumpAnnual),
      difference: Math.round(difference),
      cheaperToRunHeatPump: difference > 0,
    },
    tenYear: {
      heatPump: Math.round(tenYearHeatPump),
      current: tenYearCurrent === null ? null : Math.round(tenYearCurrent),
      difference: tenYearDifference === null ? null : Math.round(tenYearDifference),
    },
    rebates,
    rebateConfidence,
    paybackYears,
    effectiveUpfrontCost: {
      low: Math.round(Math.max(0, upfrontLow - rebateHigh)),
      high: Math.round(Math.max(0, upfrontHigh - rebateLow)),
    },
    emissions: {
      heatPumpTonsPerYear: Math.round(heatPumpTonsPerYear * 10) / 10,
      currentTonsPerYear: currentTonsPerYear === null ? null : Math.round(currentTonsPerYear * 10) / 10,
      difference:
        currentTonsPerYear === null ? null : Math.round((currentTonsPerYear - heatPumpTonsPerYear) * 10) / 10,
    },
    assumptions,
    warnings,
    inputsEcho: {
      zip: input.zip,
      sqft: input.sqft,
      fuel: input.fuel,
      distribution: input.distribution,
      system,
      stateCode: state?.code ?? null,
    },
  };
}

function floorForPayback(value: number): number {
  return value > 0 ? value : 0;
}

/**
 * Annual CO2 in short tons for the incumbent system, given delivered heat.
 * Fuel use in input units equals delivered heat divided by efficiency.
 */
function currentEmissions(load: number, fuel: HeatingFuel): number | null {
  switch (fuel) {
    case 'gas': {
      // ~53.1 kg CO2 per million BTU of gas burned, converted to short tons.
      const inputKwh = load / EFFICIENCY.gasFurnace;
      const mmbtu = (inputKwh * 3412) / 1_000_000;
      return (mmbtu * 53.1 * 2.20462) / 2000;
    }
    case 'oil': {
      // ~22.4 lb CO2 per gallon of heating oil.
      const gallons = load / EFFICIENCY.oilFurnace / ENERGY_UNITS.kwhPerGallonOil;
      return (gallons * 22.4) / 2000;
    }
    case 'propane': {
      // ~12.7 lb CO2 per gallon of propane.
      const gallons = load / EFFICIENCY.propaneFurnace / ENERGY_UNITS.kwhPerGallonPropane;
      return (gallons * 12.7) / 2000;
    }
    case 'electric-resistance':
      return (load * 0.85) / 2000;
    case 'wood': {
      // Biogenic CO2 from combustion, about 93.8 kg per MMBTU of wood burned.
      const inputKwh = load / EFFICIENCY.woodStove;
      const mmbtu = inputKwh / ENERGY_UNITS.kwhPerMmbtu;
      return (mmbtu * 93.8 * 2.20462) / 2000;
    }
    default:
      return null;
  }
}

/** Format helpers shared by the UI and the server-rendered fallback copy. */
export function formatUsd(value: number, opts: { compact?: boolean } = {}): string {
  if (opts.compact && Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  }
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

export function formatRange(range: CostRange, opts: { compact?: boolean } = {}): string {
  return `${formatUsd(range.low, opts)} to ${formatUsd(range.high, opts)}`;
}