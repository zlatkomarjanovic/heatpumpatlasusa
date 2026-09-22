/**
 * Calculator island.
 *
 * The only React island on the site. Everything it renders is recoverable from
 * the static page around it, so if JavaScript fails the user still gets the
 * national cost bands and the comparison content.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  runCalculator,
  formatUsd,
  type CalculatorInput,
  type CalculatorResult,
  type Distribution,
  type HeatingFuel,
  type PanelStatus,
} from '@/lib/calculator';
import { resolveZip, isValidZip } from '@/lib/zip';
import { GAS_MODELLED_STATES, STATES, type StateRecord } from '@/data/states';
import type { HomeAgeKey, InsulationKey } from '@/data/costs';
import { SITE } from '@/data/site';

type Step = 0 | 1 | 2 | 3;
type CoolingNeed = 'yes' | 'have' | 'no';

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: { sitekey: string; appearance?: string; theme?: string },
      ) => string;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
  }
}

// Ordered by US prevalence. Census ACS B25040: utility gas ~47% of homes,
// electricity ~40%, propane ~5%, fuel oil/kerosene ~4%, wood ~2%.
const FUEL_OPTIONS: { value: HeatingFuel; label: string; hint: string }[] = [
  { value: 'gas', label: 'Natural gas', hint: 'Furnace or boiler' },
  { value: 'electric-resistance', label: 'Electric resistance', hint: 'Baseboard, furnace or space heaters' },
  { value: 'propane', label: 'Propane', hint: 'Furnace or boiler' },
  { value: 'oil', label: 'Heating oil', hint: 'Furnace or boiler' },
  { value: 'wood', label: 'Wood or pellet stove', hint: 'Cordwood or pellet stove' },
];

const DISTRIBUTION_OPTIONS: { value: Distribution; label: string; hint: string }[] = [
  { value: 'ducted', label: 'Ducted', hint: 'Existing ducts throughout the house' },
  { value: 'mixed', label: 'Mixed', hint: 'Ducts in some rooms, none in others' },
  { value: 'ductless', label: 'Ductless', hint: 'Mini split heads, no ducts' },
];

const INSULATION_OPTIONS: { value: InsulationKey; label: string }[] = [
  { value: 'poor', label: 'Poor: drafty, cold floors' },
  { value: 'average', label: 'Average: typical for its age' },
  { value: 'good', label: 'Good: updated insulation' },
  { value: 'excellent', label: 'Excellent: new build or retrofit' },
];

const AGE_OPTIONS: { value: HomeAgeKey; label: string }[] = [
  { value: 'pre1950', label: 'Before 1950' },
  { value: '1950-1979', label: '1950 to 1979' },
  { value: '1980-1999', label: '1980 to 1999' },
  { value: '2000-2014', label: '2000 to 2014' },
  { value: '2015-plus', label: '2015 or newer' },
];

const PANEL_OPTIONS: { value: PanelStatus; label: string }[] = [
  { value: '200a', label: '200 amp' },
  { value: '100a', label: '100 amp' },
  { value: 'unknown', label: 'Not sure' },
];

const DEFAULT_INPUT: Omit<CalculatorInput, 'state'> = {
  zip: '',
  sqft: 1800,
  fuel: 'gas',
  annualHeatingSpend: null,
  distribution: 'ducted',
  zones: 1,
  insulation: 'average',
  homeAge: '1980-1999',
  panel: 'unknown',
};

/** Controls shared styling. */
const fieldLabel = 'block text-sm font-medium text-ink-800 mb-1.5';
const fieldInput =
  'w-full rounded-md border border-line-strong bg-white px-3.5 py-2.5 text-base outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30';
const chipBase =
  'flex flex-col rounded-lg border px-3 py-2.5 transition cursor-pointer';
const chipOn = 'border-brand-600 bg-brand-50 ring-1 ring-brand-600';
const chipOff = 'border-line-strong bg-white hover:border-ink-300';

const CALC_TICKS = [
  { label: 'Reading your state electricity price', source: 'EIA' },
  { label: 'Loading heating degree days for your climate', source: 'NOAA' },
  { label: 'Comparing your current fuel to a heat pump', source: 'Model' },
  { label: 'Checking rebates that are actually open', source: 'Programs' },
];

function defaultDistribution(fuel: HeatingFuel): Distribution {
  return fuel === 'electric-resistance' || fuel === 'wood' ? 'ductless' : 'ducted';
}

function spendLabel(fuel: HeatingFuel): string {
  switch (fuel) {
    case 'gas':
      return 'Annual gas heating spend';
    case 'oil':
      return 'Annual oil heating spend';
    case 'propane':
      return 'Annual propane spend';
    case 'electric-resistance':
      return 'Annual electric heating spend';
    case 'wood':
      return 'Annual pellet or wood spend';
    default:
      return 'Annual heating spend';
  }
}

export default function Calculator() {
  const [step, setStep] = useState<Step>(0);
  const [input, setInput] = useState(DEFAULT_INPUT);
  const [stateOverride, setStateOverride] = useState<string>('');
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [showAllRebates, setShowAllRebates] = useState(false);
  const [cooling, setCooling] = useState<CoolingNeed>('yes');
  const [calcTick, setCalcTick] = useState(0);
  const uid = useId();

  const resolution = useMemo(() => resolveZip(input.zip), [input.zip]);
  const resolvedState: StateRecord | null = useMemo(() => {
    if (stateOverride) return STATES.find((s) => s.code === stateOverride) ?? null;
    return resolution.state;
  }, [stateOverride, resolution.state]);

  const zipValid = isValidZip(input.zip);

  const calculate = useCallback(() => {
    setCalcTick(0);
    setStep(2);
  }, []);

  useEffect(() => {
    if (step !== 2) return;
    const reduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setResult(runCalculator({ ...input, state: resolvedState }));
      setStep(3);
      return;
    }
    const id = window.setInterval(() => {
      setCalcTick((tick) => {
        if (tick >= CALC_TICKS.length - 1) {
          window.clearInterval(id);
          setResult(runCalculator({ ...input, state: resolvedState }));
          setStep(3);
          return tick;
        }
        return tick + 1;
      });
    }, 700);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (step === 3) {
      setResult(runCalculator({ ...input, state: resolvedState }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, resolvedState]);

  const canContinue = step === 0 ? zipValid : true;

  return (
    <div className="not-prose">
      <div className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
        {/* Progress */}
        <div className="border-b border-line bg-paper-deep px-5 py-3.5 sm:px-6">
          <ol className="flex items-center gap-2 text-xs sm:gap-4">
            {['Your home', 'Systems', 'Your estimate'].map((label, index) => {
              const visualStep = step === 2 ? 1 : step === 3 ? 2 : step;
              const active = index === visualStep;
              const done = index < visualStep;
              return (
                <li key={label} className="flex min-w-0 items-center gap-2">
                  <span
                    className={
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold ' +
                      (active
                        ? 'bg-brand-700 text-white'
                        : done
                          ? 'bg-save-600 text-white'
                          : 'bg-line text-ink-500')
                    }
                    aria-hidden="true"
                  >
                    {done ? '✓' : index + 1}
                  </span>
                  <span
                    className={
                      'truncate font-medium ' + (active ? 'text-ink-900' : done ? 'text-ink-600' : 'text-ink-400')
                    }
                    aria-current={active ? 'step' : undefined}
                  >
                    {label}
                  </span>
                  {index < 2 && <span className="text-ink-300 ml-1 hidden sm:inline" aria-hidden="true">/</span>}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-stretch">
          {/* Form */}
          <div className="min-w-0 p-5 sm:p-6 lg:p-7 xl:p-8">
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg">Where is the home?</h2>
                  <p className="mt-1 text-sm text-ink-600">
                    ZIP code sets your electricity price, climate and which local programs apply. It never leaves your
                    browser in this step.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`${uid}-zip`} className={fieldLabel}>
                      ZIP code
                    </label>
                    <input
                      id={`${uid}-zip`}
                      name="zip"
                      type="text"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      maxLength={5}
                      value={input.zip}
                      onChange={(e) => {
                        setStateOverride('');
                        setInput((v) => ({ ...v, zip: e.target.value.replace(/\D/g, '').slice(0, 5) }));
                      }}
                      placeholder="02134"
                      aria-describedby={`${uid}-zip-help`}
                      className={fieldInput}
                    />
                    <p id={`${uid}-zip-help`} className="mt-1.5 text-xs text-ink-500">
                      {input.zip.length === 0 && 'Enter a five digit ZIP to continue.'}
                      {input.zip.length > 0 && !zipValid && 'A US ZIP code has five digits.'}
                      {zipValid && resolvedState && (
                        <span className="text-save-700 font-medium">
                          {resolution.borderPrefix ? 'Near ' : ''}
                          {resolvedState.name}
                          {resolution.borderPrefix ? ' (border area)' : ''}
                        </span>
                      )}
                      {zipValid && !resolvedState && 'We could not match this ZIP. Pick your state below.'}
                    </p>
                  </div>

                  <div>
                    <label htmlFor={`${uid}-state`} className={fieldLabel}>
                      State{' '}
                      <span className="font-normal text-ink-400">
                        {resolvedState ? 'resolved from ZIP' : 'required'}
                      </span>
                    </label>
                    <select
                      id={`${uid}-state`}
                      value={stateOverride || resolvedState?.code || ''}
                      onChange={(e) => setStateOverride(e.target.value)}
                      className={fieldInput}
                    >
                      <option value="">Select a state</option>
                      {STATES.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor={`${uid}-sqft`} className={fieldLabel}>
                    Heated square footage
                  </label>
                  <input
                    id={`${uid}-sqft`}
                    type="number"
                    inputMode="numeric"
                    min={300}
                    max={12000}
                    step={50}
                    value={input.sqft}
                    onChange={(e) =>
                      setInput((v) => ({ ...v, sqft: Math.max(0, Number(e.target.value) || 0) }))
                    }
                    className={fieldInput}
                  />
                  <p className="mt-1.5 text-xs text-ink-500">
                    Conditioned space only. Do not count a basement you do not heat.
                  </p>
                </div>

                <div>
                  <fieldset>
                    <legend className={fieldLabel}>What heats the home today?</legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {FUEL_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className={chipBase + ' items-start text-left ' + (input.fuel === opt.value ? chipOn : chipOff)}
                        >
                          <span className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`${uid}-fuel`}
                              value={opt.value}
                              checked={input.fuel === opt.value}
                              onChange={() =>
                                setInput((v) => ({
                                  ...v,
                                  fuel: opt.value,
                                  distribution: defaultDistribution(opt.value),
                                }))
                              }
                              className="sr-only"
                            />
                            <span className="text-sm font-medium text-ink-900">{opt.label}</span>
                          </span>
                          <span className="mt-0.5 text-xs text-ink-500">{opt.hint}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>

                {resolution.note && zipValid && (
                  <p className="rounded-md border border-flag-100 bg-flag-50 px-3 py-2 text-xs text-flag-700">
                    {resolution.note}
                  </p>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg">A few details about the house</h2>
                  <p className="mt-1 text-sm text-ink-600">
                    Only the questions that change the estimate for{' '}
                    {FUEL_OPTIONS.find((f) => f.value === input.fuel)?.label.toLowerCase() ?? 'your heat'}.
                  </p>
                </div>

                {(input.fuel === 'gas' || input.fuel === 'oil' || input.fuel === 'propane') && (
                  <fieldset>
                    <legend className={fieldLabel}>Do you already have ducts?</legend>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {DISTRIBUTION_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          className={
                            chipBase +
                            ' items-center text-center ' +
                            (input.distribution === opt.value ? chipOn : chipOff)
                          }
                        >
                          <input
                            type="radio"
                            name={`${uid}-dist`}
                            value={opt.value}
                            checked={input.distribution === opt.value}
                            onChange={() =>
                              setInput((v) => ({
                                ...v,
                                distribution: opt.value,
                                zones: opt.value === 'ductless' ? Math.max(1, v.zones) : 1,
                              }))
                            }
                            className="sr-only"
                          />
                          <span className="text-sm font-medium text-ink-900">{opt.label}</span>
                          <span className="mt-0.5 text-xs text-ink-500">{opt.hint}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}

                {(input.fuel === 'electric-resistance' || input.fuel === 'wood') && (
                  <div className="rounded-lg bg-paper-deep px-4 py-3 text-sm text-ink-600">
                    {input.fuel === 'wood'
                      ? 'Wood and pellet stoves usually heat one zone with no ducts, so we model a mini split unless you say otherwise.'
                      : 'Baseboard and resistance heat usually mean no ducts, so we model a mini split. Change that below if the house already has ductwork.'}
                    <fieldset className="mt-3">
                      <legend className="sr-only">Distribution</legend>
                      <div className="flex flex-wrap gap-2">
                        {DISTRIBUTION_OPTIONS.map((opt) => (
                          <label
                            key={opt.value}
                            className={
                              'cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium ' +
                              (input.distribution === opt.value ? chipOn : chipOff)
                            }
                          >
                            <input
                              type="radio"
                              name={`${uid}-dist-alt`}
                              className="sr-only"
                              checked={input.distribution === opt.value}
                              onChange={() =>
                                setInput((v) => ({
                                  ...v,
                                  distribution: opt.value,
                                  zones: opt.value === 'ductless' ? Math.max(1, v.zones) : 1,
                                }))
                              }
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                )}

                {input.distribution === 'ductless' && (
                  <div>
                    <label htmlFor={`${uid}-zones`} className={fieldLabel}>
                      Rooms or open areas to heat: {input.zones}
                    </label>
                    <input
                      id={`${uid}-zones`}
                      type="range"
                      min={1}
                      max={6}
                      step={1}
                      value={input.zones}
                      onChange={(e) => setInput((v) => ({ ...v, zones: Number(e.target.value) }))}
                      className="accent-brand-600 w-full"
                    />
                    <p className="mt-1 text-xs text-ink-500">
                      One indoor head per room or open area. Six or more usually needs a second outdoor unit.
                    </p>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`${uid}-age`} className={fieldLabel}>
                      When was the home built?
                    </label>
                    <select
                      id={`${uid}-age`}
                      value={input.homeAge}
                      onChange={(e) => setInput((v) => ({ ...v, homeAge: e.target.value as HomeAgeKey }))}
                      className={fieldInput}
                    >
                      {AGE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`${uid}-insulation`} className={fieldLabel}>
                      Insulation and air sealing
                    </label>
                    <select
                      id={`${uid}-insulation`}
                      value={input.insulation}
                      onChange={(e) => setInput((v) => ({ ...v, insulation: e.target.value as InsulationKey }))}
                      className={fieldInput}
                    >
                      {INSULATION_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <fieldset>
                  <legend className={fieldLabel}>Electrical panel</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {PANEL_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className={
                          'flex cursor-pointer items-center justify-center rounded-md border px-3 py-2.5 text-center text-sm font-medium transition ' +
                          (input.panel === opt.value ? chipOn : chipOff)
                        }
                      >
                        <input
                          type="radio"
                          name={`${uid}-panel`}
                          className="sr-only"
                          checked={input.panel === opt.value}
                          onChange={() => setInput((v) => ({ ...v, panel: opt.value }))}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-ink-500">
                    A 100 amp panel often needs an upgrade before a heat pump can land.
                  </p>
                </fieldset>

                <div>
                  <label htmlFor={`${uid}-spend`} className={fieldLabel}>
                    {spendLabel(input.fuel)} <span className="font-normal text-ink-400">Optional</span>
                  </label>
                  <div className="relative max-w-xs">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">
                      $
                    </span>
                    <input
                      id={`${uid}-spend`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={20000}
                      step={50}
                      value={input.annualHeatingSpend ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setInput((v) => ({
                          ...v,
                          annualHeatingSpend: raw === '' ? null : Math.max(0, Number(raw) || 0),
                        }));
                      }}
                      placeholder="1400"
                      className={fieldInput + ' pl-7'}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-ink-500">
                    Your best guess for a year. This is the single biggest accuracy upgrade you can make.
                  </p>
                </div>

                <fieldset>
                  <legend className={fieldLabel}>Do you also want cooling?</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { value: 'yes', label: 'Yes' },
                        { value: 'have', label: 'Already have AC' },
                        { value: 'no', label: 'Heat only' },
                      ] as { value: CoolingNeed; label: string }[]
                    ).map((opt) => (
                      <label
                        key={opt.value}
                        className={
                          'flex cursor-pointer items-center justify-center rounded-md border px-3 py-2.5 text-center text-sm font-medium ' +
                          (cooling === opt.value ? chipOn : chipOff)
                        }
                      >
                        <input
                          type="radio"
                          name={`${uid}-cool`}
                          className="sr-only"
                          checked={cooling === opt.value}
                          onChange={() => setCooling(opt.value)}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            )}

            {step === 2 && (
              <div className="flex min-h-[18rem] flex-col justify-center py-4" aria-live="polite">
                <h2 className="text-lg font-semibold text-ink-950">Working your numbers</h2>
                <p className="mt-1 text-sm text-ink-500">
                  {resolvedState ? resolvedState.name : 'Your ZIP'} · {input.sqft.toLocaleString()} sq ft ·{' '}
                  {FUEL_OPTIONS.find((f) => f.value === input.fuel)?.label}
                </p>
                <ol className="mt-6 space-y-3">
                  {CALC_TICKS.map((tick, index) => {
                    const done = index < calcTick;
                    const active = index === calcTick;
                    return (
                      <li key={tick.label} className="flex items-start gap-3">
                        <span
                          className={
                            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold ' +
                            (done
                              ? 'bg-save-600 text-white'
                              : active
                                ? 'bg-brand-700 text-white'
                                : 'bg-line text-ink-400')
                          }
                        >
                          {done ? '✓' : index + 1}
                        </span>
                        <span>
                          <span className={'block text-sm font-medium ' + (active || done ? 'text-ink-900' : 'text-ink-400')}>
                            {tick.label}
                          </span>
                          <span className="text-2xs text-ink-400">{tick.source}</span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {step === 3 && result && (
              <ResultPanel
                result={result}
                zip={input.zip}
                cooling={cooling}
                showAllRebates={showAllRebates}
                onToggleRebates={() => setShowAllRebates((v) => !v)}
              />
            )}

            {/* Controls */}
            {step !== 2 && (
            <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-line pt-5">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s === 3 ? 1 : 0) as Step)}
                  className="rounded-md border border-line-strong bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-paper-deep"
                >
                  Back
                </button>
              )}
              {step < 2 && (
                <button
                  type="button"
                  onClick={() => (step === 0 ? setStep(1) : calculate())}
                  disabled={!canContinue}
                  className="bg-brand-700 hover:bg-brand-800 rounded-md px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-ink-300"
                >
                  {step === 0 ? 'Continue' : 'Calculate my estimate'}
                </button>
              )}
              {step === 3 && (
                <button
                  type="button"
                  onClick={calculate}
                  className="rounded-md border border-line-strong bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-paper-deep"
                >
                  Recalculate
                </button>
              )}
              {step === 0 && !zipValid && (
                <p className="text-xs text-ink-500">Enter a valid ZIP code to continue.</p>
              )}
            </div>
            )}
          </div>

          {/* Live summary rail (40% width). Stacked rows, never a 2-up card grid. */}
          <aside
            className="flex min-w-0 flex-col self-stretch border-t border-line bg-paper-deep lg:border-l lg:border-t-0"
            aria-labelledby={`${uid}-scenario-heading`}
          >
            <div className="flex flex-1 flex-col p-5 sm:p-6 lg:p-6 xl:p-7">
              <h2
                id={`${uid}-scenario-heading`}
                className="text-xs font-semibold text-brand-700"
              >
                Your scenario
              </h2>
              <p className="mt-1 text-xs leading-snug text-ink-500 lg:hidden">
                Updates as you change answers. Nothing is sent unless you ask for the emailed estimate.
              </p>

              <dl className="mt-4 divide-y divide-line overflow-hidden rounded-lg bg-white ring-1 ring-line">
                <ScenarioRow
                  label="Location"
                  value={
                    resolvedState
                      ? `${resolvedState.name}${input.zip ? ` · ${input.zip}` : ''}`
                      : 'Add your ZIP'
                  }
                  highlight={Boolean(resolvedState && zipValid)}
                />
                <ScenarioRow label="Heated area" value={`${input.sqft.toLocaleString('en-US')} sq ft`} />
                <ScenarioRow
                  label="Current heat"
                  value={FUEL_OPTIONS.find((f) => f.value === input.fuel)?.label ?? 'Not set'}
                />
                <ScenarioRow
                  label="Layout"
                  value={
                    input.distribution === 'ductless'
                      ? `Ductless · ${input.zones} ${input.zones === 1 ? 'zone' : 'zones'}`
                      : DISTRIBUTION_OPTIONS.find((d) => d.value === input.distribution)?.label ?? ''
                  }
                />
                <ScenarioRow label="Panel" value={PANEL_OPTIONS.find((p) => p.value === input.panel)?.label ?? ''} />
                <ScenarioRow
                  label="Heating spend"
                  value={input.annualHeatingSpend ? formatUsd(input.annualHeatingSpend) : 'Optional'}
                  muted={!input.annualHeatingSpend}
                />
              </dl>

              {/*
                Always rendered so the rail keeps a stable height. Before a ZIP
                resolves it shows muted placeholders instead of popping into view
                and shoving the whole calculator taller.
              */}
              <div className="mt-4 rounded-lg bg-brand-50/80 p-4 ring-1 ring-brand-100">
                {result ? (
                  <>
                    <h3 className="text-xs font-semibold text-brand-800">Assumptions</h3>
                    <ul className="mt-3 space-y-2 text-xs leading-relaxed text-brand-900/80">
                      {result.assumptions.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <>
                    <h3 className="text-xs font-semibold text-brand-800">
                      {resolvedState ? `Local data for ${resolvedState.code}` : 'Local data'}
                    </h3>
                    <dl className="mt-3 space-y-2.5">
                      <ScenarioStat
                        label="Electricity"
                        value={resolvedState ? `${resolvedState.electricityCentsPerKwh.toFixed(2)}¢/kWh` : '-'}
                        hint={resolvedState ? 'EIA, Jun 2026' : 'Add your ZIP'}
                        muted={!resolvedState}
                      />
                      <ScenarioStat
                        label="Climate"
                        value={resolvedState ? `${resolvedState.heatingDegreeDays.toLocaleString()} HDD` : '-'}
                        hint={resolvedState ? 'NOAA, 2025-26' : 'Add your ZIP'}
                        muted={!resolvedState}
                      />
                      <ScenarioStat
                        label="Natural gas"
                        value={resolvedState ? `$${resolvedState.gasDollarsPerMcf.toFixed(2)}/Mcf` : '-'}
                        hint={
                          !resolvedState
                            ? 'Add your ZIP'
                            : GAS_MODELLED_STATES.has(resolvedState.code)
                              ? 'Regional estimate'
                              : 'EIA, May 2026'
                        }
                        muted={!resolvedState}
                      />
                    </dl>
                  </>
                )}
              </div>

              {!result && (
                <p className="mt-auto hidden pt-5 text-xs leading-relaxed text-ink-500 lg:block">
                  Runs in your browser on published EIA and NOAA data. Nothing leaves this page while you model.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ScenarioRow({
  label,
  value,
  highlight,
  muted,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-3.5 py-2.5">
      <dt className="shrink-0 text-xs text-ink-500">{label}</dt>
      <dd
        className={
          'min-w-0 text-right text-sm font-semibold leading-snug ' +
          (highlight ? 'text-save-700' : muted ? 'text-ink-400' : 'text-ink-900')
        }
      >
        {value}
      </dd>
    </div>
  );
}

function ScenarioStat({
  label,
  value,
  hint,
  muted,
}: {
  label: string;
  value: string;
  hint?: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-xs text-brand-800/80">
        {label}
        {hint && <span className="mt-0.5 block text-[0.65rem] leading-tight text-brand-700/60">{hint}</span>}
      </dt>
      <dd
        className={
          'min-w-0 text-right text-sm font-semibold tabular-nums ' +
          (muted ? 'text-ink-400' : 'text-brand-900')
        }
      >
        {value}
      </dd>
    </div>
  );
}

function ResultPanel({
  result,
  zip,
  cooling,
  showAllRebates,
  onToggleRebates,
}: {
  result: CalculatorResult;
  zip: string;
  cooling: CoolingNeed;
  showAllRebates: boolean;
  onToggleRebates: () => void;
}) {
  const openRebates = result.rebates.filter((r) => r.status === 'open');
  const otherRebates = result.rebates.filter((r) => r.status !== 'open');

  return (
    <section aria-labelledby="calc-result-heading" className="space-y-4">
      <div>
        <h2 id="calc-result-heading" className="text-lg">Your modelled estimate</h2>
        <p className="mt-1 text-sm text-ink-600">
          Ranges from published pricing and state energy data, not quotes. Two contractors in the same ZIP can differ by
          40%.
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-2.5">
        <StatBlock
          label="Installed"
          value={`${formatUsd(result.installedCost.low, { compact: true })} to ${formatUsd(result.installedCost.high, { compact: true })}`}
        />
        <StatBlock
          label="After rebates"
          value={`${formatUsd(result.effectiveUpfrontCost.low, { compact: true })} to ${formatUsd(result.effectiveUpfrontCost.high, { compact: true })}`}
          emphasis="save"
        />
        <StatBlock
          label={result.operating.difference >= 0 ? 'Save / year' : 'Extra / year'}
          value={formatUsd(Math.abs(result.operating.difference))}
          emphasis={result.operating.difference >= 0 ? 'save' : 'cost'}
        />
        <StatBlock
          label="Payback"
          value={result.paybackYears === null ? 'None' : `${result.paybackYears} yr`}
        />
      </dl>

      <table className="w-full overflow-hidden rounded-lg bg-paper-deep text-sm">
        <caption className="sr-only">Annual and 10-year cost comparison</caption>
        <tbody>
          {[
            {
              label: 'What you spend now, per year',
              value:
                result.operating.currentSystemAnnual === null
                  ? 'Not compared'
                  : formatUsd(result.operating.currentSystemAnnual),
            },
            { label: 'Heat pump, per year', value: formatUsd(result.operating.heatPumpAnnual) },
            { label: '10-year heat pump path', value: formatUsd(result.tenYear.heatPump) },
            result.tenYear.current !== null
              ? { label: '10-year if you stay put', value: formatUsd(result.tenYear.current) }
              : null,
          ]
            .filter((row): row is { label: string; value: string } => Boolean(row))
            .map((row) => (
              <tr key={row.label} className="border-b border-white/60 last:border-0">
                <th scope="row" className="px-3.5 py-2.5 text-left font-medium text-ink-600">
                  {row.label}
                </th>
                <td className="px-3.5 py-2.5 text-right font-semibold tabular-nums text-ink-950">{row.value}</td>
              </tr>
            ))}
        </tbody>
      </table>

      {result.warnings[0] && (
        <p className="rounded-md bg-paper-deep px-3 py-2 text-xs leading-relaxed text-ink-600">{result.warnings[0]}</p>
      )}

      <div className="space-y-2">
        {result.electricalAdders.length > 0 && (
          <details className="rounded-lg border border-line bg-white px-3.5 py-2.5">
            <summary className="cursor-pointer text-sm font-semibold text-ink-800">
              Electrical work to budget
            </summary>
            <ul className="mt-2 space-y-2 text-xs text-ink-600">
              {result.electricalAdders.map((adder) => (
                <li key={adder.label} className="flex items-baseline justify-between gap-3">
                  <span>{adder.label}</span>
                  <span className="tabular-nums text-ink-900">
                    {adder.range.low === 0
                      ? `up to ${formatUsd(adder.range.high)}`
                      : `${formatUsd(adder.range.low)} to ${formatUsd(adder.range.high)}`}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}

        <details className="rounded-lg border border-line bg-white px-3.5 py-2.5">
          <summary className="cursor-pointer text-sm font-semibold text-ink-800">
            Rebates ({openRebates.length} open)
          </summary>
          {otherRebates.length > 0 && (
            <button
              type="button"
              onClick={onToggleRebates}
              className="text-brand-700 mt-2 text-xs font-semibold underline"
            >
              {showAllRebates ? 'Hide paused programs' : `Show ${otherRebates.length} paused`}
            </button>
          )}
          {result.rebates.length === 0 ? (
            <p className="mt-2 text-xs text-ink-600">No live program tracked for this state yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {(showAllRebates ? result.rebates : openRebates).map((rebate) => (
                <li key={rebate.id} className="flex items-baseline justify-between gap-3 text-xs">
                  {rebate.href ? (
                    <a href={rebate.href} className="text-brand-700 underline decoration-brand-200 underline-offset-2 hover:decoration-brand-600">
                      {rebate.program}
                    </a>
                  ) : (
                    <span className="text-ink-700">{rebate.program}</span>
                  )}
                  <span className="shrink-0 tabular-nums text-ink-900">
                    {formatUsd(rebate.amountLow)} to {formatUsd(rebate.amountHigh)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </details>

      </div>

      <LeadCapture result={result} zip={zip} cooling={cooling} />
    </section>
  );
}

function LeadCapture({
  result,
  zip,
  cooling,
}: {
  result: CalculatorResult;
  zip: string;
  cooling: CoolingNeed;
}) {
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const widgetId = useRef<string | undefined>(undefined);
  const boxRef = useRef<HTMLDivElement>(null);
  const scenario = JSON.stringify({
    cooling,
    ...result.inputsEcho,
    installed: result.installedCost,
    afterRebates: result.effectiveUpfrontCost,
    annualSave: result.operating.difference,
    payback: result.paybackYears,
  });

  useEffect(() => {
    let cancelled = false;
    const mount = () => {
      if (cancelled || !boxRef.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(boxRef.current, {
        sitekey: SITE.turnstileSiteKey,
        appearance: 'interaction-only',
        theme: 'dark',
      });
    };
    mount();
    const timer = window.setInterval(() => {
      if (!window.turnstile) return;
      window.clearInterval(timer);
      mount();
    }, 250);
    const stop = window.setTimeout(() => window.clearInterval(timer), 10000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.clearTimeout(stop);
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = undefined;
    };
  }, []);

  return (
    <form
      className="rounded-xl bg-ink-950 p-4 text-white"
      action="/api/leads"
      method="post"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        try {
          const res = await fetch('/api/leads', {
            method: 'POST',
            body: new FormData(form),
            headers: { Accept: 'application/json' },
          });
          if (res.ok) {
            setStatus('sent');
            return;
          }
          setStatus('error');
          if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
        } catch {
          setStatus('error');
        }
      }}
    >
      <h3 className="text-sm font-semibold">Ask installers to price this job</h3>
      <p className="mt-1 text-xs leading-relaxed text-white/70">
        You already have the range. We send this ZIP and these numbers to installers who work it, and we tell them to
        quote this scope, not a different system. You get the emails.
      </p>
      <input type="hidden" name="scenario" value={scenario} />
      <input type="hidden" name="source" value="calculator" />
      {status === 'sent' ? (
        <p className="mt-3 rounded-md bg-white/10 px-3 py-2 text-sm">
          Sent. Check your inbox for the job brief and any installers we can route in this ZIP.
        </p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            name="name"
            required
            placeholder="Name"
            autoComplete="name"
            className="rounded-md border-0 bg-white px-3 py-2 text-sm text-ink-900 outline-none"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            autoComplete="email"
            className="rounded-md border-0 bg-white px-3 py-2 text-sm text-ink-900 outline-none"
          />
          <input
            name="phone"
            type="tel"
            placeholder="Phone"
            autoComplete="tel"
            className="rounded-md border-0 bg-white px-3 py-2 text-sm text-ink-900 outline-none"
          />
          <input
            name="zip"
            defaultValue={zip}
            required
            inputMode="numeric"
            maxLength={5}
            placeholder="ZIP"
            autoComplete="postal-code"
            className="rounded-md border-0 bg-white px-3 py-2 text-sm text-ink-900 outline-none"
          />
          <button
            type="submit"
            className="bg-brand-500 hover:bg-brand-600 col-span-full rounded-md px-4 py-2.5 text-sm font-semibold text-white"
          >
            Get installer quotes
          </button>
          <div ref={boxRef} className="cf-turnstile col-span-full" />
          {status === 'error' && (
            <p className="col-span-full text-xs text-flag-100">
              Could not send just now. Try again in a minute, or use the editorial contact on the About page.
            </p>
          )}
        </div>
      )}
    </form>
  );
}

function StatBlock({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: 'save' | 'cost';
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-3.5">
      <dt className="text-2xs text-ink-500">{label}</dt>
      <dd
        className={
          'mt-1 text-base font-semibold tabular-nums ' +
          (emphasis === 'save' ? 'text-save-700' : emphasis === 'cost' ? 'text-heat-700' : 'text-ink-950')
        }
      >
        {value}
      </dd>
    </div>
  );
}

