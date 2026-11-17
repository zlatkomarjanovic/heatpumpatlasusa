import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const local = args.includes('--local');
const windowArg = args.find((arg) => arg.startsWith('--days='));
const days = Number(windowArg?.slice(7) ?? 30);
if (!Number.isInteger(days) || days < 1 || days > 90 ||
    args.some((arg) => arg !== '--local' && arg !== windowArg)) {
  throw new Error('Usage: npm run analytics -- [--local] [--days=1 to 90]');
}

const filter = `day >= date('now', '-${days - 1} days')`;
const sql = [
  `SELECT event, SUM(count) AS total FROM analytics_daily WHERE ${filter} GROUP BY event`,
  `SELECT page AS label, SUM(count) AS total FROM analytics_daily WHERE ${filter} AND event = 'view' GROUP BY page ORDER BY total DESC, page LIMIT 15`,
  `SELECT detail AS label, SUM(count) AS total FROM analytics_daily WHERE ${filter} AND event = 'view' AND detail <> 'internal' GROUP BY detail ORDER BY total DESC`,
  `SELECT page, detail, SUM(count) AS total FROM analytics_daily WHERE ${filter} AND event = 'click' GROUP BY page, detail ORDER BY total DESC, page, detail LIMIT 20`,
  `SELECT day AS label, SUM(count) AS total FROM analytics_daily WHERE ${filter} AND event = 'view' GROUP BY day ORDER BY day DESC`,
  `SELECT page, SUM(CASE WHEN event = 'calculator_started' THEN count ELSE 0 END) AS starts,
          SUM(CASE WHEN event = 'estimate_completed' THEN count ELSE 0 END) AS estimates,
          SUM(CASE WHEN event = 'quote_attempted' THEN count ELSE 0 END) AS attempts,
          SUM(CASE WHEN event = 'quote_saved' THEN count ELSE 0 END) AS saved
    FROM analytics_daily WHERE ${filter} AND event IN ('calculator_started','estimate_completed','quote_attempted','quote_saved')
    GROUP BY page ORDER BY estimates DESC, starts DESC, attempts DESC, page LIMIT 15`,
].join('; ');

const raw = execFileSync(process.execPath, [
  'node_modules/wrangler/bin/wrangler.js', 'd1', 'execute', 'heatpumpatlas-analytics',
  local ? '--local' : '--remote', '--json', '--command', sql,
], {
  encoding: 'utf8',
  env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
  maxBuffer: 4 * 1024 * 1024,
});

const response = JSON.parse(raw);
if (response.length !== 6 || response.some((result) => !result.success)) {
  throw new Error('Cloudflare did not return all six analytics queries.');
}
const [events, pages, sources, clicks, daily, activity] = response.map((result) => result.results);
const totals = Object.fromEntries(events.map(({ event, total }) => [event, total]));
const format = new Intl.NumberFormat('en-US');
const sourceNames = { direct: 'Direct or unknown', google: 'Google', bing: 'Bing', duckduckgo: 'DuckDuckGo', social: 'Social', other: 'Other referral' };
const escape = (value) => String(value).replace(/[&<>"']/g, (char) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const number = (value) => format.format(value ?? 0);
const table = (headings, rows) => rows.length ? `
  <table><thead><tr>${headings.map((heading) => `<th scope="col">${escape(heading)}</th>`).join('')}</tr></thead>
  <tbody>${rows.map((values) => `<tr>${values.map((value) => `<td>${escape(value)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
  : '<p class="empty">No events in this period.</p>';

const cards = [
  ['Page views', 'view'],
  ['Calculator starts', 'calculator_started'],
  ['Estimates completed', 'estimate_completed'],
  ['Quotes saved', 'quote_saved'],
];

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Heat Pump Atlas USA Analytics</title>
<style>
  :root{color-scheme:light;font:15px/1.5 "Segoe UI",system-ui,sans-serif;background:#f4f7f8;color:#14242a}
  body{max-width:1080px;margin:0 auto;padding:32px 18px 56px}header{margin-bottom:24px}
  h1{margin:0;font-size:clamp(1.7rem,5vw,2.5rem);letter-spacing:-.03em}h2{font-size:1.15rem;margin:0 0 12px}
  p{margin:6px 0;color:#52646b}.cards,.grid{display:grid;gap:14px}
  .cards{grid-template-columns:repeat(auto-fit,minmax(148px,1fr));margin-bottom:16px}
  .grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr))}
  section,.card{padding:16px;background:#fff;border:1px solid #dce6e8;border-radius:10px}
  .card strong{display:block;font-size:1.8rem;color:#075964}.wide{grid-column:1/-1}
  table{width:100%;border-collapse:collapse}th,td{text-align:left;vertical-align:top;padding:8px 6px;border-bottom:1px solid #e7edef;overflow-wrap:anywhere}
  th{font-size:.84rem;color:#455961}td:last-child,th:last-child{text-align:right}
  tr:last-child td{border-bottom:0}.empty{padding:8px 0 2px}.scroll{overflow-x:auto}
  .chart{display:flex;gap:3px;align-items:end;height:85px;margin:8px 0 12px}
  .chart span{flex:1;min-width:1px;background:#0d8290;border-radius:2px 2px 0 0}
</style></head><body>
<header><h1>Heat Pump Atlas USA Analytics</h1><p>${local ? 'Local test data' : 'Cloudflare production data'} · Last ${days} ${days === 1 ? 'day' : 'days'} · UTC · ${new Date().toISOString().slice(0, 10)}</p>
<p>Counts reflect events. Repeat visits and actions can count more than once.</p></header>
<div class="cards">${cards.map(([title, event]) => `<div class="card">${title}<strong>${number(totals[event])}</strong></div>`).join('')}</div>
<div class="grid">
<section><h2>Most viewed pages</h2>${table(['Page', 'Views'], pages.map((row) => [row.label, number(row.total)]))}</section>
<section><h2>Where visits came from</h2>${table(['Source', 'Page views'], sources.map((row) => [sourceNames[row.label] ?? row.label, number(row.total)]))}</section>
<section class="wide"><h2>Most clicked links</h2><div class="scroll">${table(['From page', 'Destination', 'Clicks'], clicks.map((row) => [row.page, row.detail, number(row.total)]))}</div></section>
<section class="wide"><h2>Calculator and quote activity by page</h2><div class="scroll">${table(['Page', 'Starts', 'Estimates', 'Quote attempts', 'Quotes saved'], activity.map((row) => [row.page, number(row.starts), number(row.estimates), number(row.attempts), number(row.saved)]))}</div></section>
<section class="wide"><h2>Page views by day</h2>${daily.length ? `<div class="chart" aria-hidden="true">${daily.slice().reverse().map(({ label, total }) =>
  `<span title="${escape(label)}: ${number(total)}" style="height:${100 * total / Math.max(...daily.map((row) => row.total))}%"></span>`).join('')}</div>` : ''}
${table(['Date (UTC)', 'Views'], daily.map((row) => [row.label, number(row.total)]))}</section>
</div></body></html>`;

mkdirSync('.wrangler', { recursive: true });
const path = resolve('.wrangler', local ? 'analytics-local.html' : 'analytics.html');
writeFileSync(path, html);
console.log(path);
