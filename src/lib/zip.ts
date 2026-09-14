/**
 * ZIP prefix to state resolution.
 *
 * US ZIP codes are allocated in blocks whose leading three digits track state
 * boundaries closely, with a small number of border prefixes that straddle two
 * states. This table maps the three-digit prefix to the state that contains the
 * large majority of addresses in that prefix.
 *
 * This is deliberately a lookup table rather than a dependency: it is tiny,
 * auditable, and does not require a network call. It is accurate enough to pick
 * an electricity price and a climate zone. It is not accurate enough to price a
 * job, and the UI says so.
 *
 * For border prefix accuracy in production, replace `resolveZip` with a call to
 * a ZIP-level dataset (Census ZCTA to county to state). The interface below is
 * the only thing the rest of the app depends on.
 */

import { STATE_BY_CODE, type StateRecord } from '@/data/states';

/** [startInclusive, endInclusive, stateCode] in ascending order. */
const ZIP_PREFIX_RANGES: [number, number, string][] = [
  [0, 4, 'NY'],
  [5, 9, 'NY'],
  [10, 27, 'MA'],
  [28, 29, 'RI'],
  [30, 38, 'NH'],
  [39, 49, 'ME'],
  [50, 59, 'VT'],
  [60, 69, 'CT'],
  [70, 89, 'NJ'],
  [100, 149, 'NY'],
  [150, 196, 'PA'],
  [197, 199, 'DE'],
  [200, 205, 'DC'],
  [206, 219, 'MD'],
  [220, 246, 'VA'],
  [247, 268, 'WV'],
  [270, 289, 'NC'],
  [290, 299, 'SC'],
  [300, 319, 'GA'],
  [320, 349, 'FL'],
  [350, 369, 'AL'],
  [370, 385, 'TN'],
  [386, 397, 'MS'],
  [398, 399, 'GA'],
  [400, 427, 'KY'],
  [430, 459, 'OH'],
  [460, 479, 'IN'],
  [480, 499, 'MI'],
  [500, 528, 'IA'],
  [530, 549, 'WI'],
  [550, 567, 'MN'],
  [570, 577, 'SD'],
  [580, 588, 'ND'],
  [590, 599, 'MT'],
  [600, 629, 'IL'],
  [630, 658, 'MO'],
  [660, 679, 'KS'],
  [680, 693, 'NE'],
  [700, 714, 'LA'],
  [716, 729, 'AR'],
  [730, 749, 'OK'],
  [750, 799, 'TX'],
  [800, 816, 'CO'],
  [820, 831, 'WY'],
  [832, 838, 'ID'],
  [840, 847, 'UT'],
  [850, 865, 'AZ'],
  [870, 884, 'NM'],
  [889, 898, 'NV'],
  [900, 961, 'CA'],
  [967, 968, 'HI'],
  [970, 979, 'OR'],
  [980, 994, 'WA'],
  [995, 999, 'AK'],
];

export type ZipResolution = {
  zip: string;
  state: StateRecord | null;
  /** True when the three-digit prefix is a known border region serving two states. */
  borderPrefix: boolean;
  /** Human note shown in the UI when resolution is approximate. */
  note: string | null;
};

/** Prefixes that genuinely straddle a state line and are worth flagging. */
const BORDER_PREFIXES = new Set([
  100, 108, 110, 111, 112, 113, // NY metro edges
  197, 198, 199, // DE / PA / NJ corridor
  219, 220, // MD / VA
  267, 268, // WV / MD / VA
  398, 399, // GA / FL
  400, 401, // KY / IN
  497, 498, 499, // MI / WI upper peninsula edges
  540, 549, // WI / MN
  636, 637, // MO / IL
  700, 701, // LA / MS
  798, 799, // TX / NM El Paso
  820, 831, // WY border
  832, 838, // ID border
  845, // UT / CO
  860, 865, // AZ / NM
  890, 898, // NV border
  961, // CA / NV Tahoe
  976, 979, // OR / WA
]);

export function resolveZip(input: string): ZipResolution {
  const digits = (input || '').replace(/\D/g, '');
  if (digits.length !== 5) {
    return { zip: input, state: null, borderPrefix: false, note: null };
  }
  const prefix = Number.parseInt(digits.slice(0, 3), 10);
  const match = ZIP_PREFIX_RANGES.find(([lo, hi]) => prefix >= lo && prefix <= hi);
  if (!match) {
    return {
      zip: digits,
      state: null,
      borderPrefix: false,
      note: 'We could not resolve this ZIP to a state. Check the ZIP and try again.',
    };
  }
  const state = STATE_BY_CODE[match[2]] ?? null;
  const border = BORDER_PREFIXES.has(prefix);
  return {
    zip: digits,
    state,
    borderPrefix: border,
    note: border
      ? `ZIP prefix ${digits.slice(0, 3)} sits on a state border. Confirm the state on your utility bill before relying on the rate assumptions.`
      : null,
  };
}

export function isValidZip(input: string): boolean {
  return /^\d{5}$/.test((input || '').trim());
}
