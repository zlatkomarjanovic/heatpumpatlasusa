const estimatePages = new Set([
  '/mini-split-cost/',
  '/electrical-panel-upgrade-cost/',
]);

export function embedsEstimate(pathname: string): boolean {
  return /^\/(?:guides|rebates|compare|markets)\//.test(pathname)
    || pathname.startsWith('/heat-pump-')
    || estimatePages.has(pathname);
}

export function estimateHref(pathname: string): string {
  return pathname === '/' || pathname === '/calculator/' || embedsEstimate(pathname)
    ? '#calculator'
    : '/calculator/';
}
