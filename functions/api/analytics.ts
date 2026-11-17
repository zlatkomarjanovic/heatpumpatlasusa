import {
  analyticsOptOut,
  analyticsPage,
  countAnalytics,
  validClientEvent,
  type AnalyticsDatabase,
} from '../lib/analytics';

const maxBytes = 512;

async function readEvent(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return undefined;
  const decoder = new TextDecoder();
  let size = 0;
  let body = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return undefined;
    }
    body += decoder.decode(value, { stream: true });
  }
  try {
    return JSON.parse(body + decoder.decode()) as Record<string, unknown> | null;
  } catch {
    return undefined;
  }
}

export async function onRequestPost({ request, env }: {
  request: Request;
  env: { ANALYTICS?: AnalyticsDatabase };
}) {
  if (request.headers.get('Origin') !== new URL(request.url).origin) {
    return new Response(null, { status: 403 });
  }
  if (!env.ANALYTICS || analyticsOptOut(request)) return new Response(null, { status: 204 });

  const data = await readEvent(request);
  if (!data || typeof data.detail !== 'string' ||
      !analyticsPage(data.page) || !validClientEvent(data.event, data.detail)) {
    return new Response(null, { status: 400 });
  }

  await countAnalytics(env.ANALYTICS, data.event, data.page, data.detail);
  return new Response(null, { status: 204 });
}
