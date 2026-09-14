/**
 * Shared content and UI types.
 *
 * Types live here rather than inside .astro components because Astro components
 * do not export TypeScript types that other modules can import.
 */

export type Citation = {
  label: string;
  url: string;
  publisher?: string;
  supports?: string;
  /** Primary government, program or utility source rather than a secondary benchmark. */
  primary?: boolean;
};

export type Breadcrumb = {
  label: string;
  href?: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type Column = {
  key: string;
  label: string;
  numeric?: boolean;
  emphasis?: boolean;
  hideOnMobile?: boolean;
};

export type Row = Record<string, string | number | null | undefined>;

export type CompareVerdict = 'left' | 'right' | 'depends';

export type CompareRow = {
  criterion: string;
  left: string;
  right: string;
  verdict: CompareVerdict;
  note?: string;
};

export type ProgramStatus = 'open' | 'enrolling' | 'reserved' | 'expired' | 'unknown';

export type NavItem = {
  label: string;
  href: string;
  description?: string;
  children?: NavItem[];
};