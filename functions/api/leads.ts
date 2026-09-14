/**
 * Lead intake for installer routing.
 *
 * Cloudflare Pages Function. Stores each quote request in KV when the
 * LEADS binding exists. This is the inventory sold to contractors: ZIP,
 * fuel, modelled range, and contact details.
 */
export async function onRequestPost(context: {
  request: Request;
  env: { LEADS?: { put(key: string, value: string): Promise<void> } };
}) {
  const form = await context.request.formData();
  const lead = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: String(form.get('name') ?? '').slice(0, 120),
    email: String(form.get('email') ?? '').slice(0, 200),
    phone: String(form.get('phone') ?? '').slice(0, 40),
    zip: String(form.get('zip') ?? '').slice(0, 10),
    source: String(form.get('source') ?? 'site'),
    scenario: String(form.get('scenario') ?? '').slice(0, 8000),
  };

  if (!lead.email || !lead.zip) {
    return Response.json({ ok: false, error: 'Email and ZIP are required.' }, { status: 400 });
  }

  if (context.env.LEADS) {
    await context.env.LEADS.put(`lead:${lead.id}`, JSON.stringify(lead));
  }

  return Response.json({ ok: true, id: lead.id });
}
