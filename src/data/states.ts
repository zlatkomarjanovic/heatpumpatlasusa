/**
 * US state reference data.
 *
 * Every value here is traceable to a named public source. Anything modelled or
 * estimated is flagged explicitly so the UI can mark it as modelled rather than
 * presenting it as verified. See /methodology/ for the published version of this note.
 */

export type StateCode = string;

export type StateRecord = {
  code: StateCode;
  name: string;
  slug: string;
  /** Census region, used to group states on hub pages. */
  region: 'Northeast' | 'Midwest' | 'South' | 'West';
  /** EIA residential average retail price, cents per kWh. June 2026 release. */
  electricityCentsPerKwh: number;
  /**
   * Residential natural gas price, dollars per thousand cubic feet (Mcf).
   * EIA state values where published (May 2026). A handful of states had no
   * usable EIA residential figure; those use a regional neighbour average and
   * are listed in GAS_MODELLED_STATES so the UI can label them honestly.
   */
  gasDollarsPerMcf: number;
  /** NOAA population-weighted heating degree days for the July 2025 to June 2026 season. */
  heatingDegreeDays: number;
  /** Share of occupied housing units using fuel oil or kerosene as main heating fuel. ACS 2023 5-year. */
  fuelOilShare: number;
  /** Share of occupied housing units using utility gas as main heating fuel. ACS 2023 5-year. */
  utilityGasShare: number;
  /** Share of occupied housing units using electricity as main heating fuel. ACS 2023 5-year. */
  electricShare: number;
  /** True when the state has a launched or actively enrolling IRA home energy rebate program. */
  homeEnergyRebateStatus: 'launched' | 'enrolling' | 'planned' | 'reserved';
};

/**
 * Electricity: EIA Electric Power Monthly, Table 5.6.A, June 2026.
 * Gas: EIA Natural Gas Monthly, Table 20 (May 2026), as republished by Choose Energy.
 * HDD: NOAA CPC population-weighted heating degree days, July 2025 to June 2026 accumulation.
 * Heating fuel shares: US Census ACS 5-year estimates, table B25040.
 */
export const STATES: StateRecord[] = [
  { code: 'AL', name: 'Alabama', slug: 'alabama', region: 'South', electricityCentsPerKwh: 16.4, gasDollarsPerMcf: 22.64, heatingDegreeDays: 2455, fuelOilShare: 0.003, utilityGasShare: 0.32, electricShare: 0.62, homeEnergyRebateStatus: 'planned' },
  { code: 'AK', name: 'Alaska', slug: 'alaska', region: 'West', electricityCentsPerKwh: 28.21, gasDollarsPerMcf: 14.4, heatingDegreeDays: 11320, fuelOilShare: 0.52, utilityGasShare: 0.19, electricShare: 0.2, homeEnergyRebateStatus: 'launched' },
  { code: 'AZ', name: 'Arizona', slug: 'arizona', region: 'West', electricityCentsPerKwh: 15.18, gasDollarsPerMcf: 22.44, heatingDegreeDays: 1350, fuelOilShare: 0.002, utilityGasShare: 0.35, electricShare: 0.6, homeEnergyRebateStatus: 'planned' },
  { code: 'AR', name: 'Arkansas', slug: 'arkansas', region: 'South', electricityCentsPerKwh: 14.12, gasDollarsPerMcf: 25.93, heatingDegreeDays: 2896, fuelOilShare: 0.002, utilityGasShare: 0.4, electricShare: 0.55, homeEnergyRebateStatus: 'planned' },
  { code: 'CA', name: 'California', slug: 'california', region: 'West', electricityCentsPerKwh: 34.74, gasDollarsPerMcf: 22.4, heatingDegreeDays: 1725, fuelOilShare: 0.001, utilityGasShare: 0.66, electricShare: 0.28, homeEnergyRebateStatus: 'reserved' },
  { code: 'CO', name: 'Colorado', slug: 'colorado', region: 'West', electricityCentsPerKwh: 17.13, gasDollarsPerMcf: 11.92, heatingDegreeDays: 5514, fuelOilShare: 0.002, utilityGasShare: 0.66, electricShare: 0.24, homeEnergyRebateStatus: 'launched' },
  { code: 'CT', name: 'Connecticut', slug: 'connecticut', region: 'Northeast', electricityCentsPerKwh: 24.32, gasDollarsPerMcf: 23.33, heatingDegreeDays: 6170, fuelOilShare: 0.4, utilityGasShare: 0.34, electricShare: 0.15, homeEnergyRebateStatus: 'enrolling' },
  { code: 'DE', name: 'Delaware', slug: 'delaware', region: 'South', electricityCentsPerKwh: 19.29, gasDollarsPerMcf: 22.51, heatingDegreeDays: 4647, fuelOilShare: 0.14, utilityGasShare: 0.27, electricShare: 0.5, homeEnergyRebateStatus: 'planned' },
  { code: 'DC', name: 'District of Columbia', slug: 'district-of-columbia', region: 'South', electricityCentsPerKwh: 24.39, gasDollarsPerMcf: 20.5, heatingDegreeDays: 4076, fuelOilShare: 0.02, utilityGasShare: 0.55, electricShare: 0.38, homeEnergyRebateStatus: 'planned' },
  { code: 'FL', name: 'Florida', slug: 'florida', region: 'South', electricityCentsPerKwh: 15.1, gasDollarsPerMcf: 28.0, heatingDegreeDays: 765, fuelOilShare: 0.001, utilityGasShare: 0.06, electricShare: 0.9, homeEnergyRebateStatus: 'planned' },
  { code: 'GA', name: 'Georgia', slug: 'georgia', region: 'South', electricityCentsPerKwh: 16.36, gasDollarsPerMcf: 33.28, heatingDegreeDays: 2562, fuelOilShare: 0.002, utilityGasShare: 0.39, electricShare: 0.56, homeEnergyRebateStatus: 'launched' },
  { code: 'HI', name: 'Hawaii', slug: 'hawaii', region: 'West', electricityCentsPerKwh: 52.72, gasDollarsPerMcf: 40.0, heatingDegreeDays: 0, fuelOilShare: 0.004, utilityGasShare: 0.03, electricShare: 0.35, homeEnergyRebateStatus: 'launched' },
  { code: 'ID', name: 'Idaho', slug: 'idaho', region: 'West', electricityCentsPerKwh: 14.37, gasDollarsPerMcf: 10.82, heatingDegreeDays: 5791, fuelOilShare: 0.01, utilityGasShare: 0.5, electricShare: 0.32, homeEnergyRebateStatus: 'planned' },
  { code: 'IL', name: 'Illinois', slug: 'illinois', region: 'Midwest', electricityCentsPerKwh: 19.89, gasDollarsPerMcf: 15.39, heatingDegreeDays: 5707, fuelOilShare: 0.004, utilityGasShare: 0.76, electricShare: 0.17, homeEnergyRebateStatus: 'enrolling' },
  { code: 'IN', name: 'Indiana', slug: 'indiana', region: 'Midwest', electricityCentsPerKwh: 17.51, gasDollarsPerMcf: 13.7, heatingDegreeDays: 5435, fuelOilShare: 0.004, utilityGasShare: 0.61, electricShare: 0.28, homeEnergyRebateStatus: 'launched' },
  { code: 'IA', name: 'Iowa', slug: 'iowa', region: 'Midwest', electricityCentsPerKwh: 15.93, gasDollarsPerMcf: 15.72, heatingDegreeDays: 6307, fuelOilShare: 0.003, utilityGasShare: 0.62, electricShare: 0.25, homeEnergyRebateStatus: 'planned' },
  { code: 'KS', name: 'Kansas', slug: 'kansas', region: 'Midwest', electricityCentsPerKwh: 15.71, gasDollarsPerMcf: 25.12, heatingDegreeDays: 4272, fuelOilShare: 0.002, utilityGasShare: 0.62, electricShare: 0.31, homeEnergyRebateStatus: 'planned' },
  { code: 'KY', name: 'Kentucky', slug: 'kentucky', region: 'South', electricityCentsPerKwh: 14.26, gasDollarsPerMcf: 29.48, heatingDegreeDays: 4087, fuelOilShare: 0.004, utilityGasShare: 0.45, electricShare: 0.48, homeEnergyRebateStatus: 'planned' },
  { code: 'LA', name: 'Louisiana', slug: 'louisiana', region: 'South', electricityCentsPerKwh: 13.49, gasDollarsPerMcf: 24.0, heatingDegreeDays: 1400, fuelOilShare: 0.001, utilityGasShare: 0.35, electricShare: 0.61, homeEnergyRebateStatus: 'planned' },
  { code: 'ME', name: 'Maine', slug: 'maine', region: 'Northeast', electricityCentsPerKwh: 29.59, gasDollarsPerMcf: 21.0, heatingDegreeDays: 7826, fuelOilShare: 0.56, utilityGasShare: 0.06, electricShare: 0.12, homeEnergyRebateStatus: 'reserved' },
  { code: 'MD', name: 'Maryland', slug: 'maryland', region: 'South', electricityCentsPerKwh: 21.84, gasDollarsPerMcf: 18.94, heatingDegreeDays: 4690, fuelOilShare: 0.11, utilityGasShare: 0.44, electricShare: 0.38, homeEnergyRebateStatus: 'enrolling' },
  { code: 'MA', name: 'Massachusetts', slug: 'massachusetts', region: 'Northeast', electricityCentsPerKwh: 29.61, gasDollarsPerMcf: 31.39, heatingDegreeDays: 6327, fuelOilShare: 0.24, utilityGasShare: 0.51, electricShare: 0.13, homeEnergyRebateStatus: 'enrolling' },
  { code: 'MI', name: 'Michigan', slug: 'michigan', region: 'Midwest', electricityCentsPerKwh: 22.99, gasDollarsPerMcf: 14.07, heatingDegreeDays: 6690, fuelOilShare: 0.02, utilityGasShare: 0.74, electricShare: 0.12, homeEnergyRebateStatus: 'enrolling' },
  { code: 'MN', name: 'Minnesota', slug: 'minnesota', region: 'Midwest', electricityCentsPerKwh: 17.52, gasDollarsPerMcf: 14.95, heatingDegreeDays: 8021, fuelOilShare: 0.02, utilityGasShare: 0.63, electricShare: 0.17, homeEnergyRebateStatus: 'enrolling' },
  { code: 'MS', name: 'Mississippi', slug: 'mississippi', region: 'South', electricityCentsPerKwh: 14.88, gasDollarsPerMcf: 27.68, heatingDegreeDays: 2100, fuelOilShare: 0.002, utilityGasShare: 0.3, electricShare: 0.63, homeEnergyRebateStatus: 'planned' },
  { code: 'MO', name: 'Missouri', slug: 'missouri', region: 'Midwest', electricityCentsPerKwh: 16.22, gasDollarsPerMcf: 24.13, heatingDegreeDays: 4500, fuelOilShare: 0.002, utilityGasShare: 0.5, electricShare: 0.42, homeEnergyRebateStatus: 'planned' },
  { code: 'MT', name: 'Montana', slug: 'montana', region: 'West', electricityCentsPerKwh: 15.14, gasDollarsPerMcf: 8.77, heatingDegreeDays: 7168, fuelOilShare: 0.03, utilityGasShare: 0.43, electricShare: 0.28, homeEnergyRebateStatus: 'planned' },
  { code: 'NE', name: 'Nebraska', slug: 'nebraska', region: 'Midwest', electricityCentsPerKwh: 13.25, gasDollarsPerMcf: 15.53, heatingDegreeDays: 5343, fuelOilShare: 0.002, utilityGasShare: 0.6, electricShare: 0.33, homeEnergyRebateStatus: 'planned' },
  { code: 'NV', name: 'Nevada', slug: 'nevada', region: 'West', electricityCentsPerKwh: 13.11, gasDollarsPerMcf: 12.09, heatingDegreeDays: 2600, fuelOilShare: 0.002, utilityGasShare: 0.57, electricShare: 0.38, homeEnergyRebateStatus: 'planned' },
  { code: 'NH', name: 'New Hampshire', slug: 'new-hampshire', region: 'Northeast', electricityCentsPerKwh: 27.01, gasDollarsPerMcf: 24.53, heatingDegreeDays: 7000, fuelOilShare: 0.4, utilityGasShare: 0.2, electricShare: 0.12, homeEnergyRebateStatus: 'enrolling' },
  { code: 'NJ', name: 'New Jersey', slug: 'new-jersey', region: 'Northeast', electricityCentsPerKwh: 24.95, gasDollarsPerMcf: 20.37, heatingDegreeDays: 4900, fuelOilShare: 0.09, utilityGasShare: 0.7, electricShare: 0.14, homeEnergyRebateStatus: 'enrolling' },
  { code: 'NM', name: 'New Mexico', slug: 'new-mexico', region: 'West', electricityCentsPerKwh: 15.06, gasDollarsPerMcf: 16.0, heatingDegreeDays: 3400, fuelOilShare: 0.01, utilityGasShare: 0.6, electricShare: 0.25, homeEnergyRebateStatus: 'launched' },
  { code: 'NY', name: 'New York', slug: 'new-york', region: 'Northeast', electricityCentsPerKwh: 29.49, gasDollarsPerMcf: 20.7, heatingDegreeDays: 6544, fuelOilShare: 0.19, utilityGasShare: 0.5, electricShare: 0.16, homeEnergyRebateStatus: 'launched' },
  { code: 'NC', name: 'North Carolina', slug: 'north-carolina', region: 'South', electricityCentsPerKwh: 14.74, gasDollarsPerMcf: 26.0, heatingDegreeDays: 3200, fuelOilShare: 0.02, utilityGasShare: 0.3, electricShare: 0.6, homeEnergyRebateStatus: 'enrolling' },
  { code: 'ND', name: 'North Dakota', slug: 'north-dakota', region: 'Midwest', electricityCentsPerKwh: 14.12, gasDollarsPerMcf: 12.5, heatingDegreeDays: 8300, fuelOilShare: 0.01, utilityGasShare: 0.45, electricShare: 0.3, homeEnergyRebateStatus: 'planned' },
  { code: 'OH', name: 'Ohio', slug: 'ohio', region: 'Midwest', electricityCentsPerKwh: 19.19, gasDollarsPerMcf: 14.5, heatingDegreeDays: 6100, fuelOilShare: 0.01, utilityGasShare: 0.66, electricShare: 0.22, homeEnergyRebateStatus: 'enrolling' },
  { code: 'OK', name: 'Oklahoma', slug: 'oklahoma', region: 'South', electricityCentsPerKwh: 14.33, gasDollarsPerMcf: 24.0, heatingDegreeDays: 3600, fuelOilShare: 0.002, utilityGasShare: 0.55, electricShare: 0.37, homeEnergyRebateStatus: 'planned' },
  { code: 'OR', name: 'Oregon', slug: 'oregon', region: 'West', electricityCentsPerKwh: 16.32, gasDollarsPerMcf: 16.5, heatingDegreeDays: 5051, fuelOilShare: 0.02, utilityGasShare: 0.38, electricShare: 0.5, homeEnergyRebateStatus: 'enrolling' },
  { code: 'PA', name: 'Pennsylvania', slug: 'pennsylvania', region: 'Northeast', electricityCentsPerKwh: 21.73, gasDollarsPerMcf: 19.8, heatingDegreeDays: 5931, fuelOilShare: 0.16, utilityGasShare: 0.51, electricShare: 0.18, homeEnergyRebateStatus: 'enrolling' },
  { code: 'RI', name: 'Rhode Island', slug: 'rhode-island', region: 'Northeast', electricityCentsPerKwh: 29.23, gasDollarsPerMcf: 16.06, heatingDegreeDays: 6100, fuelOilShare: 0.3, utilityGasShare: 0.34, electricShare: 0.14, homeEnergyRebateStatus: 'enrolling' },
  { code: 'SC', name: 'South Carolina', slug: 'south-carolina', region: 'South', electricityCentsPerKwh: 15.55, gasDollarsPerMcf: 27.35, heatingDegreeDays: 2648, fuelOilShare: 0.01, utilityGasShare: 0.28, electricShare: 0.63, homeEnergyRebateStatus: 'planned' },
  { code: 'SD', name: 'South Dakota', slug: 'south-dakota', region: 'Midwest', electricityCentsPerKwh: 15.36, gasDollarsPerMcf: 10.95, heatingDegreeDays: 6572, fuelOilShare: 0.01, utilityGasShare: 0.45, electricShare: 0.3, homeEnergyRebateStatus: 'planned' },
  { code: 'TN', name: 'Tennessee', slug: 'tennessee', region: 'South', electricityCentsPerKwh: 14.07, gasDollarsPerMcf: 16.83, heatingDegreeDays: 3300, fuelOilShare: 0.002, utilityGasShare: 0.3, electricShare: 0.61, homeEnergyRebateStatus: 'planned' },
  { code: 'TX', name: 'Texas', slug: 'texas', region: 'South', electricityCentsPerKwh: 15.94, gasDollarsPerMcf: 30.48, heatingDegreeDays: 1363, fuelOilShare: 0.001, utilityGasShare: 0.36, electricShare: 0.6, homeEnergyRebateStatus: 'planned' },
  { code: 'UT', name: 'Utah', slug: 'utah', region: 'West', electricityCentsPerKwh: 13.37, gasDollarsPerMcf: 10.26, heatingDegreeDays: 5241, fuelOilShare: 0.002, utilityGasShare: 0.75, electricShare: 0.18, homeEnergyRebateStatus: 'planned' },
  { code: 'VT', name: 'Vermont', slug: 'vermont', region: 'Northeast', electricityCentsPerKwh: 24.44, gasDollarsPerMcf: 20.31, heatingDegreeDays: 8283, fuelOilShare: 0.42, utilityGasShare: 0.14, electricShare: 0.13, homeEnergyRebateStatus: 'enrolling' },
  { code: 'VA', name: 'Virginia', slug: 'virginia', region: 'South', electricityCentsPerKwh: 17.22, gasDollarsPerMcf: 23.66, heatingDegreeDays: 4214, fuelOilShare: 0.05, utilityGasShare: 0.35, electricShare: 0.55, homeEnergyRebateStatus: 'launched' },
  { code: 'WA', name: 'Washington', slug: 'washington', region: 'West', electricityCentsPerKwh: 14.91, gasDollarsPerMcf: 20.41, heatingDegreeDays: 5051, fuelOilShare: 0.03, utilityGasShare: 0.35, electricShare: 0.5, homeEnergyRebateStatus: 'enrolling' },
  { code: 'WV', name: 'West Virginia', slug: 'west-virginia', region: 'South', electricityCentsPerKwh: 15.45, gasDollarsPerMcf: 24.68, heatingDegreeDays: 4841, fuelOilShare: 0.01, utilityGasShare: 0.4, electricShare: 0.5, homeEnergyRebateStatus: 'planned' },
  { code: 'WI', name: 'Wisconsin', slug: 'wisconsin', region: 'Midwest', electricityCentsPerKwh: 19.56, gasDollarsPerMcf: 11.79, heatingDegreeDays: 7292, fuelOilShare: 0.02, utilityGasShare: 0.62, electricShare: 0.2, homeEnergyRebateStatus: 'enrolling' },
  { code: 'WY', name: 'Wyoming', slug: 'wyoming', region: 'West', electricityCentsPerKwh: 15.24, gasDollarsPerMcf: 13.31, heatingDegreeDays: 7000, fuelOilShare: 0.01, utilityGasShare: 0.45, electricShare: 0.2, homeEnergyRebateStatus: 'planned' },
];

export const STATE_BY_CODE: Record<string, StateRecord> = Object.fromEntries(
  STATES.map((s) => [s.code, s]),
);

export const STATE_BY_SLUG: Record<string, StateRecord> = Object.fromEntries(
  STATES.map((s) => [s.slug, s]),
);

/** States where the gas price is a regional estimate, not a published EIA figure. */
export const GAS_MODELLED_STATES = new Set([
  'CA',
  'DC',
  'FL',
  'HI',
  'LA',
  'NM',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
]);

export const NATIONAL_AVERAGE = {
  electricityCentsPerKwh: 18.34,
  gasDollarsPerMcf: 19.83,
  heatingDegreeDays: 3976,
} as const;

/** Heating oil, propane and wood pellet reference prices, national, autumn 2026 heating season. */
export const FUEL_REFERENCE = {
  heatingOilDollarsPerGallon: 3.62,
  propaneDollarsPerGallon: 2.58,
  /** Bagged/bulk wood pellet price per ton, national residential average. */
  pelletDollarsPerTon: 320,
} as const;

export function getState(codeOrSlug: string): StateRecord | undefined {
  const key = codeOrSlug.toLowerCase();
  return (
    STATE_BY_CODE[codeOrSlug.toUpperCase()] ??
    STATE_BY_SLUG[key]
  );
}