type EventName = 'view' | 'click' | 'calculator_started' | 'estimate_completed' | 'quote_attempted';

export function trackAnalytics(event: EventName, detail = '') {
  const privacy = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (privacy.globalPrivacyControl || privacy.doNotTrack === '1') return;
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) return;
  const page = new URL(canonical.href).pathname;
  if (page === '/404/') return;

  void fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'omit',
    keepalive: true,
    body: JSON.stringify({ event, page, detail }),
  }).catch(() => {});
}

function sourceGroup(referrer: string) {
  if (!referrer) return 'direct';
  const source = new URL(referrer);
  if (source.origin === location.origin) return 'internal';
  const host = source.hostname.replace(/^www\./, '');
  if (/^google\.[a-z.]+$/.test(host)) return 'google';
  if (host === 'bing.com' || host.endsWith('.bing.com')) return 'bing';
  if (host === 'duckduckgo.com') return 'duckduckgo';
  if (['facebook.com', 'instagram.com', 'reddit.com', 'x.com', 't.co', 'youtube.com', 'linkedin.com']
    .some((domain) => host === domain || host.endsWith('.' + domain))) return 'social';
  return 'other';
}

export function initAnalytics() {
  trackAnalytics('view', sourceGroup(document.referrer));

  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
    if (!link) return;
    const destination = new URL(link.href);
    if (destination.origin !== location.origin) return;
    const fragment = ['#quote', '#calculator'].includes(destination.hash) ? destination.hash : '';
    if (!fragment && destination.pathname === location.pathname) return;
    if (!destination.pathname.endsWith('/')) return;
    trackAnalytics('click', destination.pathname + fragment);
  });

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (form instanceof HTMLFormElement && form.getAttribute('action') === '/api/leads') {
      trackAnalytics('quote_attempted');
    }
  }, { capture: true });
}
