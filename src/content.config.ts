import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Content collections.
 *
 * Every collection carries the fields the SEO layer, schema builders and trust
 * components need: primary keyword, review date, sources, and FAQs. Guides are
 * markdown files so the editorial team can write without touching components.
 */

const sourceSchema = z.object({
  label: z.string(),
  url: z.string().url(),
  publisher: z.string().optional(),
  /** What this source is used for on the page. */
  supports: z.string().optional(),
});

const faqSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

/** Shared frontmatter for anything that renders an article layout. */
const editorialBase = {
  title: z.string(),
  description: z.string(),
  primaryKeyword: z.string(),
  updated: z.coerce.date(),
  published: z.coerce.date().optional(),
  author: z.string().default('HeatPumpAtlasUSA Editorial'),
  reviewedBy: z.string().optional(),
  citations: z.array(sourceSchema).default([]),
  faqs: z.array(faqSchema).default([]),
  related: z.array(z.string()).default([]),
  /** Free-form tags used for related-page grouping. */
  tags: z.array(z.string()).default([]),
  /** Exclude from sitemap and index if a page is genuinely not ready. */
  draft: z.boolean().default(false),
  /** Optional hero statistic rendered as a pull-quote. */
  keyStat: z
    .object({
      value: z.string(),
      label: z.string(),
      source: z.string().optional(),
    })
    .optional(),
  /** Longer card excerpt for hubs and teasers. Falls back to description. */
  excerpt: z.string().optional(),
};

const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object(editorialBase),
});

const comparisons = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/comparisons' }),
  schema: z.object({
    ...editorialBase,
    /** The two systems being compared, for structured rendering. */
    leftLabel: z.string(),
    rightLabel: z.string(),
  }),
});

const markets = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/markets' }),
  schema: z.object({
    ...editorialBase,
    stateCode: z.string().length(2),
    city: z.string(),
    metro: z.string().optional(),
    /** Whether this market is live for installer routing. */
    routingLive: z.boolean().default(false),
  }),
});

const rebates = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/rebates' }),
  schema: z.object({
    ...editorialBase,
    program: z.string(),
    administrator: z.string(),
    stateCodes: z.array(z.string().length(2)).min(1),
    /** Structured amounts so the calculator and cards can render consistently. */
    incentives: z
      .array(
        z.object({
          label: z.string(),
          amountLow: z.number().nonnegative(),
          amountHigh: z.number().nonnegative(),
          unit: z.string().optional(),
          status: z.enum(['open', 'enrolling', 'reserved', 'expired', 'unknown']),
          note: z.string().optional(),
        }),
      )
      .default([]),
    programStatus: z.enum(['open', 'enrolling', 'reserved', 'expired', 'unknown']),
    lastVerified: z.coerce.date(),
    officialUrl: z.string().url(),
    incomeGated: z.boolean().default(false),
  }),
});

export const collections = {
  guides,
  comparisons,
  markets,
  rebates,
};
