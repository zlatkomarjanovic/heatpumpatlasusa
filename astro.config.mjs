// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

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
      filter: (page) => !page.includes('/404'),
      serialize(item) {
        const url = item.url;
        const lastmod = new Date().toISOString();
        if (url === 'https://heatpumpatlasusa.com/') {
          return { ...item, lastmod, changefreq: 'daily', priority: 1.0 };
        }
        if (url.includes('/calculator/') || url.includes('/heat-pump-cost/')) {
          return { ...item, lastmod, changefreq: 'weekly', priority: 0.95 };
        }
        if (url.includes('/mini-split-cost/') || url.includes('/heat-pump-vs-furnace/') || url.includes('/rebates/')) {
          return { ...item, lastmod, changefreq: 'weekly', priority: 0.9 };
        }
        if (url.includes('/guides/') || url.includes('/markets/')) {
          return { ...item, lastmod, changefreq: 'weekly', priority: 0.8 };
        }
        return { ...item, lastmod, changefreq: 'weekly', priority: 0.7 };
      },
    }),
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