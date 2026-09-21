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
  };
}) {
  const form = await context.request.formData();
  const wantsJson = (context.request.headers.get('accept') ?? '').includes('application/json');
  const turnstileError = await verifyTurnstile(context.request, form, context.env.TURNSTILE_SECRET);
  if (turnstileError) {
    return leadResponse(wantsJson, { ok: false, error: turnstileError }, 400);
  }
  const lead = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: String(form.get('name') ?? '').slice(0, 120),
    email: String(form.get('email') ?? '').slice(0, 200),
    phone: String(form.get('phone') ?? '').slice(0, 40),
    zip: String(form.get('zip') ?? '').slice(0, 10),
    market: String(form.get('market') ?? '').slice(0, 80),
    notes: String(form.get('notes') ?? '').slice(0, 2000),
    source: String(form.get('source') ?? 'site'),
    scenario: String(form.get('scenario') ?? '').slice(0, 8000),
  };

  if (!lead.email || !lead.zip) {
    return leadResponse(wantsJson, { ok: false, error: 'Email and ZIP are required.' }, 400);
  }

  if (context.env.LEADS) {
    await context.env.LEADS.put(`lead:${lead.id}`, JSON.stringify(lead));
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
