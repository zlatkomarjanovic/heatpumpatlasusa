import { SITE } from '@/data/site';

type VerificationStatus = 'checking' | 'ready' | 'error';

interface Turnstile {
  render(element: HTMLElement, options: {
    sitekey: string;
    action: string;
    theme: 'light' | 'dark';
    size: 'compact';
    appearance: 'interaction-only';
    callback: () => void;
    'expired-callback': () => void;
    'error-callback': () => void;
  }): string;
  reset(id: string): void;
  remove(id: string): void;
}

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

let loading: Promise<Turnstile> | undefined;

function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    const fail = () => {
      script.remove();
      loading = undefined;
      reject(new Error('Cloudflare Turnstile is unavailable.'));
    };
    script.addEventListener('load', () => window.turnstile ? resolve(window.turnstile) : fail(), { once: true });
    script.addEventListener('error', fail, { once: true });
    document.head.append(script);
  });
  return loading;
}

export function mountQuoteVerification(
  box: HTMLElement,
  onStatus: (status: VerificationStatus) => void,
  theme: 'light' | 'dark' = 'light',
) {
  let active = true;
  let api: Turnstile | undefined;
  let widgetId: string | undefined;
  const report = (status: VerificationStatus) => {
    if (active) onStatus(status);
  };
  const start = async () => {
    if (!active) return;
    report('checking');
    try {
      api = await loadTurnstile();
      if (!active) return;
      widgetId = api.render(box, {
        sitekey: SITE.turnstileSiteKey,
        action: 'quote_request',
        theme,
        size: 'compact',
        appearance: 'interaction-only',
        callback: () => report('ready'),
        'expired-callback': () => report('error'),
        'error-callback': () => report('error'),
      });
    } catch {
      report('error');
    }
  };
  void start();
  return {
    reset() {
      if (!active) return;
      report('checking');
      if (api && widgetId) api.reset(widgetId);
      else void start();
    },
    remove() {
      active = false;
      if (api && widgetId) api.remove(widgetId);
    },
  };
}
