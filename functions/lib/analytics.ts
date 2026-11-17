export interface AnalyticsDatabase {
  prepare(sql: string): {
    bind(...values: string[]): { run(): Promise<unknown> };
  };
}

const pagePattern = /^\/(?:[a-z0-9-]{1,65}\/){0,2}$/;
const sources = new Set(['direct', 'internal', 'google', 'bing', 'duckduckgo', 'social', 'other']);
const milestones = new Set(['calculator_started', 'estimate_completed', 'quote_attempted']);

export function analyticsPage(path: unknown): path is string {
  return typeof path === 'string' && pagePattern.test(path) && path !== '/404/';
}

export function analyticsOptOut(request: Request) {
  return request.headers.get('Sec-GPC') === '1' || request.headers.get('DNT') === '1';
}

export function validClientEvent(event: unknown, detail: unknown): event is string {
  if (typeof event !== 'string' || typeof detail !== 'string') return false;
  if (event === 'view') return sources.has(detail);
  if (event === 'click') return analyticsPage(detail.replace(/#(?:quote|calculator)$/, ''));
  return milestones.has(event) && detail === '';
}

export async function countAnalytics(
  db: AnalyticsDatabase,
  event: string,
  page: string,
  detail = '',
) {
  const day = new Date().toISOString().slice(0, 10);
  await db.prepare(
    `INSERT INTO analytics_daily (day, event, page, detail, count)
      VALUES (?, ?, ?, ?, 1)
      ON CONFLICT (day, event, page, detail) DO UPDATE SET count = count + 1`,
  ).bind(day, event, page, detail).run();
}
