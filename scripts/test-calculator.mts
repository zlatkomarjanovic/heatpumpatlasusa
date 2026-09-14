// Sanity tests for the calculator model.
//
// These are not exhaustive unit tests. They check that the model produces
// directionally correct results for the cases the site claims, which is the
// failure mode that would actually mislead a reader:
//   - oil conversion should save money in Maine
//   - gas in a cheap-gas state should be competitive or better
//   - electric resistance should always lose to a heat pump
//   - raises should never be silently invented
import { runCalculator } from '../src/lib/calculator.ts';
import { STATE_BY_CODE } from '../src/data/states.ts';

let pass = 0;
let fail = 0;

function check(name, condition, detail = '') {
  if (condition) {
    pass += 1;
    console.log(`  ok   ${name}`);
  } else {
    fail += 1;
    console.log(`  FAIL ${name}${detail ? ' :: ' + detail : ''}`);
  }
}

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

console.log('\nMaine: oil conversion (7,800 HDD, 29.59 c/kWh)');
{
  const r = runCalculator({ ...base, fuel: 'oil', annualHeatingSpend: 2700, state: STATE_BY_CODE.ME });
  // Maine electricity is ~29.6 c/kWh, so the heat pump wins on running cost but
  // the margin is honestly modest, not the huge number cheap-electricity states show.
  check('heat pump is cheaper to run than oil', r.operating.cheaperToRunHeatPump, `delta ${r.operating.difference}`);
  check('saving is positive and non-trivial (> $100/yr)', r.operating.difference > 100, `delta ${r.operating.difference}`);
  check('payback is under 15 years after rebates', r.paybackYears !== null && r.paybackYears < 15, `payback ${r.paybackYears}`);
  check('open rebates are applied', r.rebates.some((x) => x.status === 'open'));
  check('modelled cost is in a sane band', r.installedCost.low >= 9000 && r.installedCost.high <= 40000, `${r.installedCost.low}-${r.installedCost.high}`);
}

console.log('\nColorado: cheap gas (11.92/Mcf, 17.13 c/kWh) should favour the furnace');
{
  const r = runCalculator({ ...base, fuel: 'gas', annualHeatingSpend: 900, state: STATE_BY_CODE.CO });
  check('gas is at least competitive with the heat pump', r.operating.difference <= 0, `delta ${r.operating.difference}`);
  check('warning is emitted for the losing case', r.warnings.some((w) => /gas heating is cheaper/i.test(w)));
  check('no payback is claimed', r.paybackYears === null, `payback ${r.paybackYears}`);
}

console.log('\nTexas: high effective residential gas ($30.48/Mcf) lets the heat pump win');
{
  const r = runCalculator({ ...base, fuel: 'gas', annualHeatingSpend: 700, state: STATE_BY_CODE.TX });
  check('heat pump wins where residential gas is expensive', r.operating.cheaperToRunHeatPump, `delta ${r.operating.difference}`);
  check('no false cheap-gas warning fires', !r.warnings.some((w) => /gas heating is cheaper/i.test(w)));
}

console.log('\nMaine: electric resistance (should always win)');
{
  const r = runCalculator({ ...base, fuel: 'electric-resistance', annualHeatingSpend: 3200, state: STATE_BY_CODE.ME });
  check('heat pump beats resistance', r.operating.cheaperToRunHeatPump, `delta ${r.operating.difference}`);
  check('saving ratio is roughly 2x or better', r.operating.difference / r.operating.currentSystemAnnual > 0.4);
}

console.log('\nMaine: wood/pellet stove (2,700/yr in pellets)');
{
  const r = runCalculator({ ...base, fuel: 'wood', annualHeatingSpend: 2700, state: STATE_BY_CODE.ME });
  check('current-system figure is produced for wood', r.operating.currentSystemAnnual !== null, `${r.operating.currentSystemAnnual}`);
  check('current-system figure is sane (> $1000/yr)', (r.operating.currentSystemAnnual ?? 0) > 1000, `${r.operating.currentSystemAnnual}`);
  check('heat pump annual is a positive number', r.operating.heatPumpAnnual > 0, `${r.operating.heatPumpAnnual}`);
  check('emissions are compared for wood', r.emissions.currentTonsPerYear !== null, `${r.emissions.currentTonsPerYear}`);
}

console.log('\nUnknown fuel: no invented comparison');
{
  const r = runCalculator({ ...base, fuel: 'unknown', state: STATE_BY_CODE.CO });
  check('no current-system figure is produced', r.operating.currentSystemAnnual === null);
  check('no payback is produced', r.paybackYears === null);
  check('warning explains the gap', r.warnings.some((w) => /No current fuel/i.test(w)));
}

console.log('\n100A panel adds a flagged electrical adder');
{
  const r = runCalculator({ ...base, fuel: 'gas', panel: '100a', state: STATE_BY_CODE.MA });
  check('panel upgrade adder present', r.electricalAdders.some((a) => /panel upgrade/i.test(a.label)));
}

console.log('\nDuctless multi-zone selects the right system');
{
  const r = runCalculator({ ...base, fuel: 'oil', distribution: 'ductless', zones: 4, state: STATE_BY_CODE.ME });
  check('system is ductless multi-zone', r.inputsEcho.system === 'ductless-multi-zone', r.inputsEcho.system);
  check('cost band is the ductless band', r.installedCost.low >= 6000 && r.installedCost.high <= 25000, `${r.installedCost.low}-${r.installedCost.high}`);
}

console.log('\nMassachusetts: whole-home rebate is reflected after rebates');
{
  const r = runCalculator({ ...base, fuel: 'oil', annualHeatingSpend: 3000, state: STATE_BY_CODE.MA });
  check('after-rebate low is below installed low', r.effectiveUpfrontCost.low < r.installedCost.low);
}

console.log('\nReserved programs are excluded from totals and flagged');
{
  const r = runCalculator({ ...base, fuel: 'oil', annualHeatingSpend: 2600, state: STATE_BY_CODE.ME });
  check('Maine HEAR is present as reserved', r.rebates.some((x) => x.status === 'reserved'));
  check('reserved program triggers a warning', r.warnings.some((w) => /reserved or paused/i.test(w)));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);