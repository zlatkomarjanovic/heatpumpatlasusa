// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { markdownMirrors } from './scripts/markdown-mirrors.mjs';

/**
 * HeatPumpAtlasUSA build config.
 *
 * Output is static HTML rendered at build time and served from Cloudflare.
 * There is no adapter because the site has no server runtime; form posts are
 * handled by a separate endpoint (see README) so the site stays cacheable.
 */
export default defineConfig({
  site: 'https://heatpumpatlasusa.com',
  trailingSlash: 'always',
  output: 'static',
  integrations: [
    react(),
    sitemap({
      filter: (page) => !['/404', '/404/', '/quote-sent/'].includes(new URL(page).pathname),
    }),
    markdownMirrors(),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Keep the client bundle tiny; the only interactive island is the calculator.
      assetsInlineLimit: 2048,
    },
  },
  build: {
    inlineStylesheets: 'auto',
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  compressHTML: true,
});