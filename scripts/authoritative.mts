// Authoritative numbers from the calculator model, so that page copy can be
// generated from computed output instead of asserted by hand.
import { runCalculator } from '../src/lib/calculator.ts';
import { STATE_BY_CODE, STATES } from '../src/data/states.ts';

const base = {
  zip: '00000',
  sqft: 1800,
  annualHeatingSpend: null,
  distribution: 'ducted',
  zones: 1,
  insulation: 'average',
  homeAge: '1980-1999',
  panel: '200a',
};

/** Heat pump beats gas, using the real calculator, per state. */
const gasStates = STATES.filter((s) => s.gasDollarsPerMcf !== null);
let hpWins = 0;
const results = [];
for (const s of gasStates) {
  const r = runCalculator({ ...base, fuel: 'gas', annualHeatingSpend: 1000, state: s });
  if (r.operating.difference > 0) hpWins += 1;
  results.push({ code: s.code, name: s.name, delta: r.operating.difference });
}
console.log(`SCORE: heat pump beats gas in ${hpWins} of ${gasStates.length} states with published gas prices`);
console.log('States where gas wins:', results.filter((r) => r.delta <= 0).map((r) => r.code).join(' '));
console.log('States where heat pump wins:', results.filter((r) => r.delta > 0).map((r) => r.code).join(' '));
console.log('');

/** Maine oil case, at several spending levels. */
console.log('MAINE OIL CONVERSION (ducted, 1,800 sqft)');
for (const spend of [1800, 2400, 3000, 3600]) {
  const r = runCalculator({ ...base, fuel: 'oil', annualHeatingSpend: spend, state: STATE_BY_CODE.ME });
  console.log(
    `  spend $${spend}: oil $${r.operating.currentSystemAnnual}, HP $${r.operating.heatPumpAnnual}, delta $${r.operating.difference}, payback ${r.paybackYears}`,
  );
}
console.log('');

/** Maine oil case at a range of square footages with modelled load. */
console.log('MAINE OIL, modelled load (no spend given)');
for (const sqft of [1200, 1800, 2400]) {
  const r = runCalculator({ ...base, sqft, fuel: 'oil', state: STATE_BY_CODE.ME });
  console.log(
    `  ${sqft} sqft: load ${r.heatingLoadKwhThermal}, oil $${r.operating.currentSystemAnnual}, HP $${r.operating.heatPumpAnnual}, delta $${r.operating.difference}`,
  );
}
console.log('');

/** Sanity: the load model against known consumption. */
console.log('LOAD MODEL CHECK (1,800 sqft, average envelope)');
for (const code of ['ME', 'MA', 'CO', 'TX', 'FL']) {
  const r = runCalculator({ ...base, fuel: 'gas', state: STATE_BY_CODE[code] });
  console.log(`  ${code} (${STATE_BY_CODE[code].heatingDegreeDays} HDD): ${r.heatingLoadKwhThermal} kWh thermal/yr`);
}
console.log('');

/** Gas vs heat pump delivered cost per MMBtu, for the comparison table. */
console.log('DELIVERED COST PER MMBTU (from the calculator, $1,000 gas spend reference)');
console.log('state  gasDelta  meaning');
for (const r of results.slice(0, 12)) {
  console.log(`  ${r.code}: ${r.delta > 0 ? '+' : ''}${r.delta}  ${r.delta > 0 ? 'heat pump cheaper' : 'gas cheaper'}`);
}

console.log('');
console.log('TEXAS GAS (should be gas-favourable)');
{
  const r = runCalculator({ ...base, fuel: 'gas', annualHeatingSpend: 700, state: STATE_BY_CODE.TX });
  console.log(`  delta ${r.operating.difference}, warning: ${r.warnings.length > 0}`);
}
console.log('MAINE ELECTRIC RESISTANCE (should be heat-pump-favourable)');
{
  const r = runCalculator({ ...base, fuel: 'electric-resistance', annualHeatingSpend: 3200, state: STATE_BY_CODE.ME });
  console.log(`  delta ${r.operating.difference}, ratio ${(r.operating.difference / r.operating.currentSystemAnnual).toFixed(2)}`);
}