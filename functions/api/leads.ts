import { analyticsOptOut, analyticsPage, countAnalytics, type AnalyticsDatabase } from '../lib/analytics';

interface QuoteEmail {
  send(message: { from: string; to: string; subject: string; text: string }): Promise<unknown>;
}

/**
 * Lead intake for installer routing.
 *
 * Cloudflare Pages Function. Stores each quote request in KV when the
 * LEADS binding exists. This is the inventory sold to contractors: ZIP,
 * fuel, modelled range, and contact details.
 */
export async function onRequestPost(context: {
  request: Request;
  env: {
    LEADS?: { put(key: string, value: string): Promise<void> };
    TURNSTILE_SECRET?: string;
    ANALYTICS?: AnalyticsDatabase;
    QUOTE_EMAIL?: QuoteEmail;
    QUOTE_NOTIFICATION_TO?: string;
  };
  waitUntil(promise: Promise<unknown>): void;
}) {
  const wantsJson = (context.request.headers.get('accept') ?? '').includes('application/json');
  const host = new URL(context.request.url).hostname;
  const isProduction = host === 'heatpumpatlasusa.com' || host === 'www.heatpumpatlasusa.com';
  if (isProduction && !context.env.TURNSTILE_SECRET) {
    return leadResponse(wantsJson, { ok: false, error: 'Quote verification is temporarily unavailable.' }, 503);
  }

  const form = await context.request.formData().catch(() => null);
  if (!form) {
    return leadResponse(wantsJson, { ok: false, error: 'Invalid quote request.' }, 400);
  }
  const turnstileError = await verifyTurnstile(context.request, form, context.env.TURNSTILE_SECRET)
    .catch(() => 'Could not verify this submission. Try again in a minute.');
  if (turnstileError) {
    return leadResponse(wantsJson, { ok: false, error: turnstileError }, 400);
  }
  const lead = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: String(form.get('name') ?? '').slice(0, 120),
    email: String(form.get('email') ?? '').trim().slice(0, 200),
    phone: String(form.get('phone') ?? '').slice(0, 40),
    zip: String(form.get('zip') ?? '').trim(),
    market: String(form.get('market') ?? '').slice(0, 80),
    notes: String(form.get('notes') ?? '').slice(0, 2000),
    source: String(form.get('source') ?? 'site'),
    scenario: String(form.get('scenario') ?? '').slice(0, 8000),
  };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email) || !/^[0-9]{5}$/.test(lead.zip)) {
    return leadResponse(wantsJson, { ok: false, error: 'Enter a valid email and five-digit ZIP code.' }, 400);
  }

  if (!context.env.LEADS) {
    return leadResponse(wantsJson, { ok: false, error: 'Quote storage is unavailable. Try again later.' }, 503);
  }

  const quoteKey = `lead:${lead.id}`;
  await context.env.LEADS.put(quoteKey, JSON.stringify(lead));

  const { QUOTE_EMAIL, QUOTE_NOTIFICATION_TO } = context.env;
  if (QUOTE_EMAIL && QUOTE_NOTIFICATION_TO) {
    context.waitUntil(Promise.resolve().then(() => QUOTE_EMAIL.send({
      from: 'quote-alerts@heatpumpatlasusa.com',
      to: QUOTE_NOTIFICATION_TO,
      subject: `New Heat Pump Atlas USA quote: ${lead.id}`,
      text: [
        'A new installer quote request was saved at heatpumpatlasusa.com.',
        '',
        `Received: ${lead.createdAt} (UTC)`,
        `Reference: ${quoteKey}`,
        '',
        'Open Cloudflare Workers KV and choose heatpumpatlas-quote-leads to view the request.',
      ].join('\n'),
    })).catch((error: unknown) => {
      const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
      console.warn('Quote notification failed', lead.id, typeof code === 'string' ? code : 'email_send_failed');
    }));
  } else if (isProduction) {
    console.warn('Quote notification is not configured', lead.id);
  }

  const referrer = context.request.headers.get('Referer');
  if (context.env.ANALYTICS && !analyticsOptOut(context.request) && referrer && URL.canParse(referrer)) {
    const page = new URL(referrer);
    if (page.origin === new URL(context.request.url).origin && analyticsPage(page.pathname)) {
      context.waitUntil(countAnalytics(context.env.ANALYTICS, 'quote_saved', page.pathname).catch(() => {
        console.warn('Could not count a saved quote in analytics.');
      }));
    }
  }

  return leadResponse(wantsJson, { ok: true, id: lead.id }, 200);
}

function leadResponse(wantsJson: boolean, body: { ok: boolean; error?: string; id?: string }, status: number) {
  if (wantsJson) {
    return Response.json(body, { status });
  }
  const location = body.ok ? '/quote-sent/' : '/quote-sent/?error=1';
  return new Response(null, { status: 303, headers: { Location: location } });
}

async function verifyTurnstile(request: Request, form: FormData, secret: string | undefined) {
  if (!secret) return null;

  const token = String(form.get('cf-turnstile-response') ?? '');
  if (!token) return 'Could not verify this submission. Reload the page and try again.';

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      secret,
      response: token,
      remoteip: request.headers.get('CF-Connecting-IP') ?? undefined,
    }),
  });

  if (!response.ok) return 'Could not verify this submission. Try again in a minute.';

  const result = (await response.json()) as { success?: boolean };
  if (!result.success) return 'Could not verify this submission. Reload the page and try again.';
  return null;
}
