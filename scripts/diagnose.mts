// Diagnostic: print the model's actual delivered-heat economics per state so the
// written copy can be checked against computed output rather than assumption.
import { runCalculator } from '../src/lib/calculator.ts';
import { STATE_BY_CODE, STATES } from '../src/data/states.ts';
import { EFFICIENCY, ENERGY_UNITS } from '../src/data/costs.ts';
import { FUEL_REFERENCE } from '../src/data/states.ts';

const KWH_PER_MMBTU = 1_000_000 / 3412;
const seasonalCop = EFFICIENCY.ashpColdClimate * (1 - EFFICIENCY.ductLossDucted);
const seasonalCopDuctless = EFFICIENCY.ductless * (1 - EFFICIENCY.ductLossDuctless);

function hp(stateCode, ductless = false) {
  const s = STATE_BY_CODE[stateCode];
  const elec = (s.electricityCentsPerKwh / 100) * KWH_PER_MMBTU;
  return elec / (ductless ? seasonalCopDuctless : seasonalCop);
}
function gas(stateCode) {
  const s = STATE_BY_CODE[stateCode];
  if (!s.gasDollarsPerMcf) return null;
  return ((s.gasDollarsPerMcf / ENERGY_UNITS.thermsPerMcf) / EFFICIENCY.gasFurnace) * 10;
}
const oil =
  (FUEL_REFERENCE.heatingOilDollarsPerGallon /
    ((ENERGY_UNITS.kwhPerGallonOil * 3412 / 1_000_000) * EFFICIENCY.oilFurnace)) /
  (1 - EFFICIENCY.ductLossDucted);
const propane =
  FUEL_REFERENCE.propaneDollarsPerGallon /
  ((ENERGY_UNITS.kwhPerGallonPropane * 3412 / 1_000_000) * EFFICIENCY.propaneFurnace);

console.log('Constants');
console.log('  seasonal COP, ducted  :', seasonalCop.toFixed(3));
console.log('  seasonal COP, ductless:', seasonalCopDuctless.toFixed(3));
console.log('  oil per MMBtu delivered    : $' + oil.toFixed(2));
console.log('  propane per MMBtu delivered: $' + propane.toFixed(2));
console.log('');

console.log('Selected states, $/MMBtu delivered (lower wins)');
console.log('state  elec    HP-duct  HP-ductless  gas     oil     propane  winner');
let hpWinsGas = 0;
let gasStates = 0;
// Gas and oil furnaces run through ducts, so they take the same duct loss the
// ducted heat pump does. This is the fair comparison.
const ductFair = (costPerMmbtuAtEquipment, ducted) => (ducted ? costPerMmbtuAtEquipment / (1 - EFFICIENCY.ductLossDucted) : costPerMmbtuAtEquipment);
for (const code of ['ME', 'MA', 'VT', 'NH', 'CT', 'NY', 'CO', 'TX', 'WA', 'OR', 'MN', 'UT', 'IL', 'GA', 'CA', 'FL']) {
  const s = STATE_BY_CODE[code];
  const hpD = hp(code);
  const hpL = hp(code, true);
  const gRaw = gas(code);
  const g = gRaw === null ? null : ductFair(gRaw, true);
  const oilFair = ductFair(oil, true);
  const options = [
    ['HP', hpD],
    ['gas', g],
    ['oil', oilFair],
  ].filter(([, v]) => v !== null);
  const winner = options.sort((a, b) => a[1] - b[1])[0][0];
  if (g !== null) {
    gasStates += 1;
    if (hpD < g) hpWinsGas += 1;
  }
  console.log(
    `${code.padEnd(6)} ${String(s.electricityCentsPerKwh).padStart(5)}  $${hpD.toFixed(1).padStart(6)}  $${hpL
      .toFixed(1)
      .padStart(9)}  ${g === null ? '  n/a ' : '$' + g.toFixed(1).padStart(6)}  $${oilFair.toFixed(1)}  $${propane.toFixed(
      1,
    )}  ${winner}`,
  );
}

console.log('');
console.log(`Heat pump beats gas on delivered cost in ${hpWinsGas} of ${gasStates} sampled gas states`);

// Full national count, as the furnace page reports it.
let allHpWins = 0;
let allGas = 0;
for (const s of STATES) {
  if (!s.gasDollarsPerMcf) continue;
  allGas += 1;
  if (hp(s.code) < ductFair(gas(s.code), true)) allHpWins += 1;
}
console.log(`Full model: heat pump beats gas in ${allHpWins} of ${allGas} states with published gas prices`);

// Realistic annual figures for a Maine home.
console.log('');
const me = runCalculator({
  zip: '04101',
  sqft: 1800,
  fuel: 'oil',
  annualHeatingSpend: 2700,
  distribution: 'ducted',
  zones: 1,
  insulation: 'average',
  homeAge: '1980-1999',
  panel: '200a',
  state: STATE_BY_CODE.ME,
});
console.log('Maine, 1,800 sqft, $2,700/yr oil');
console.log('  heating load      :', me.heatingLoadKwhThermal.toLocaleString(), 'kWh thermal');
console.log('  oil per year      : $' + me.operating.currentSystemAnnual);
console.log('  heat pump per year: $' + me.operating.heatPumpAnnual);
console.log('  delta             : $' + me.operating.difference);
console.log('  payback           :', me.paybackYears);

const meDuctless = runCalculator({
  zip: '04101',
  sqft: 1800,
  fuel: 'oil',
  annualHeatingSpend: 2700,
  distribution: 'ductless',
  zones: 3,
  insulation: 'average',
  homeAge: '1980-1999',
  panel: '200a',
  state: STATE_BY_CODE.ME,
});
console.log('  ductless delta    : $' + meDuctless.operating.difference);