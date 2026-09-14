/**
 * Cover images for guides.
 *
 * Maps a guide slug to a self-hosted, build-optimised image. These are stock
 * heat pump photos for now and are intended to be replaced with commissioned
 * artwork later. A default keeps every guide covered even before it is mapped.
 */
import type { ImageMetadata } from 'astro';

import airSource from '@/assets/images/outdoor-heat-pump-yard.jpg';
import condenser from '@/assets/images/heat-pump-outdoor-condenser.jpg';
import miniSplit from '@/assets/images/mini-split-living-room.jpg';
import coldClimate from '@/assets/images/cold-climate-heat-pump-snow.jpg';
import panel from '@/assets/images/electrical-panel.jpg';

export interface GuideCover {
  image: ImageMetadata;
  alt: string;
}

const DEFAULT_COVER: GuideCover = {
  image: airSource,
  alt: 'Air source heat pump outdoor unit installed beside a home',
};

const COVERS: Record<string, GuideCover> = {
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
    image: coldClimate,
    alt: 'Heat pump outdoor unit in winter, an alternative to burning wood pellets',
  },
  'do-i-need-a-panel-upgrade-for-a-heat-pump': {
    image: panel,
    alt: 'Home electrical panel, the service a heat pump may or may not require upgrading',
  },
};

export function guideCover(slug: string): GuideCover {
  return COVERS[slug] ?? DEFAULT_COVER;
}
