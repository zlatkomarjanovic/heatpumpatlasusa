/**
 * Cover images for guides.
 *
 * Maps guide slugs to self-hosted, phone-style illustrations.
 */
import type { ImageMetadata } from 'astro';

import airSource from '@/assets/images/phone-yard.webp';
import condenser from '@/assets/images/phone-condenser.webp';
import miniSplit from '@/assets/images/phone-mini-split.webp';
import coldClimate from '@/assets/images/phone-winter-heat-pump.webp';
import panel from '@/assets/images/phone-breaker-panel.webp';
import pellet from '@/assets/images/phone-pellet-stove.webp';

export interface GuideCover {
  image: ImageMetadata;
  alt: string;
}

const DEFAULT_COVER: GuideCover = {
  image: airSource,
  alt: 'Air source heat pump outdoor unit installed beside a home',
};

const COVERS: Record<string, GuideCover> = {
  'pellet-stove-heat-pump-together': {
    image: pellet,
    alt: 'Pellet stove in a living room used for supplemental heat',
  },
  'find-electricity-rate-on-bill': {
    image: condenser,
    alt: 'Outdoor heat pump beside a house',
  },
  'are-heat-pumps-worth-it': {
    image: airSource,
    alt: 'Air source heat pump outdoor unit, the equipment behind the payback question',
  },
  'do-heat-pumps-work-in-cold-weather': {
    image: coldClimate,
    alt: 'Cold climate heat pump running outdoors in snowy winter conditions',
  },
  'what-size-heat-pump-do-i-need': {
    image: panel,
    alt: 'Home electrical panel, one of the constraints that decides heat pump size and cost',
  },
  'ducted-vs-ductless-heat-pump': {
    image: miniSplit,
    alt: 'Ductless mini split indoor head mounted high on an interior wall',
  },
  'air-source-vs-geothermal-heat-pump': {
    image: condenser,
    alt: 'Air source heat pump outdoor condenser unit beside a house',
  },
  'heat-pump-vs-electric-baseboard': {
    image: airSource,
    alt: 'Heat pump outdoor unit that replaces electric resistance baseboard heating',
  },
  'dual-fuel-heat-pumps': {
    image: coldClimate,
    alt: 'Cold climate heat pump outdoors in winter, paired with a backup furnace',
  },
  'heat-pump-electric-bill': {
    image: condenser,
    alt: 'Heat pump condenser unit, the appliance that shifts heating onto the electric bill',
  },
  'heat-pump-vs-pellet-stove': {
    image: pellet,
    alt: 'Pellet stove on a tiled hearth beside a bag of wood pellets',
  },
  'do-i-need-a-panel-upgrade-for-a-heat-pump': {
    image: panel,
    alt: 'Home electrical panel, the service a heat pump may or may not require upgrading',
  },
};

export function guideCover(slug: string): GuideCover {
  return COVERS[slug] ?? DEFAULT_COVER;
}
