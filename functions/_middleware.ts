/**
 * Force HTTPS and apex host at the Worker edge.
 *
 * Static assets are served without this file unless wrangler.toml sets
 * run_worker_first. Cloudflare "Always Use HTTPS" should also be on.
 */
export const onRequest = async (context: { request: Request; next: () => Promise<Response> }) => {
  const url = new URL(context.request.url);
  const host = url.hostname.replace(/\.$/, '').toLowerCase();
  const protoHeader = context.request.headers.get('x-forwarded-proto');
  const visitor = context.request.headers.get('cf-visitor') ?? '';
  const isHttp =
    protoHeader === 'http' || visitor.includes('"scheme":"http"') || url.protocol === 'http:';
  const isWww = host === 'www.heatpumpatlasusa.com';

  if (isHttp || isWww) {
    url.protocol = 'https:';
    url.hostname = 'heatpumpatlasusa.com';
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
};
