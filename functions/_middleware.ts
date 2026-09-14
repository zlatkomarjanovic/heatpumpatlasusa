/**
 * Force HTTPS at the Worker edge.
 *
 * Cloudflare "Always Use HTTPS" should also be on in the zone. This covers
 * requests that still arrive as http via X-Forwarded-Proto.
 */
export const onRequest = async (context: { request: Request; next: () => Promise<Response> }) => {
  const url = new URL(context.request.url);
  const proto = context.request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '');

  if (proto === 'http') {
    url.protocol = 'https:';
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
};
