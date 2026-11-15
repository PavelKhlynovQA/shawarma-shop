// Генерирует карточки-скриншоты для API- и БД-кейсов.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const req = createRequire('C:/Playwright/Yandextests/package.json');
const { chromium } = req('playwright');

const { DETAILED_API } = await import('./content/cases-detailed-api.mjs');
const { DETAILED_DB } = await import('./content/cases-detailed-db.mjs');

fs.mkdirSync('.tmp/shots', { recursive: true });

const COLORS = { GET: '#2f81f7', POST: '#3fb950', PATCH: '#d29922', PUT: '#a371f7', DELETE: '#f85149' };

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function cardApi(c) {
  const m = c.api.method;
  const color = COLORS[m] || '#8b949e';
  const reqBody = m !== 'GET' && c.api.body ? JSON.stringify(c.api.body, null, 2) : null;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: 1200px; background: #0d1117; color: #c9d1d9; font-family: 'Segoe UI', sans-serif; padding: 28px 32px; }
  .top { display: flex; align-items: center; gap: 14px; margin-bottom: 6px; }
  .id { font-family: Consolas, monospace; font-size: 13px; color: #8b949e; }
  h1 { font-size: 22px; font-weight: 600; color: #f0f6fc; margin: 10px 0 22px; }
  .bar { display: flex; align-items: center; gap: 12px; background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 14px 16px; margin-bottom: 18px; }
  .method { font-family: Consolas, monospace; font-weight: 700; font-size: 13px; color: #fff; background: ${color}; padding: 4px 10px; border-radius: 5px; }
  .url { font-family: Consolas, monospace; font-size: 14px; color: #58a6ff; word-break: break-all; }
  .status { margin-left: auto; font-family: Consolas, monospace; font-size: 13px; padding: 4px 10px; border-radius: 5px; background: #1f6feb33; color: #58a6ff; border: 1px solid #1f6feb; }
  .status.err { background: #f8514922; color: #ff7b72; border-color: #f85149; }
  .block { margin-bottom: 16px; }
  .label { font-size: 11px; letter-spacing: .08em; color: #8b949e; text-transform: uppercase; margin-bottom: 8px; }
  pre { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 14px 16px; font-family: Consolas, monospace; font-size: 13px; line-height: 1.55; color: #d2a8ff; white-space: pre-wrap; }
  pre.res { color: #7ee787; }
  .foot { margin-top: 20px; font-size: 12px; color: #6e7681; }
  </style></head><body>
  <div class="top"><span class="id">${c.id}</span><span class="id">${esc(c.module)}</span><span class="id">Приоритет: ${esc(c.priority)}</span></div>
  <h1>${esc(c.title)}</h1>
  <div class="bar"><span class="method">${m}</span><span class="url">${esc(c.api.url)}</span>
    <span class="status ${c.api.status >= 400 ? 'err' : ''}">HTTP ${c.api.status}</span></div>
  ${reqBody ? '<div class="block"><div class="label">Тело запроса</div><pre>' + esc(reqBody) + '</pre></div>' : ''}
  <div class="block"><div class="label">Ответ</div><pre class="res">${esc(JSON.stringify(c.api.response, null, 2))}</pre></div>
  <div class="foot">${esc(c.requirement || '')} · автотест: ${esc(c.automation || '—')} · http://localhost:3000</div>
  </body></html>`;
}

function cardDb(c) {
  const sql = c.steps[0].action.replace(/^Выполнить:\s*/, '');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: 1200px; background: #0d1117; color: #c9d1d9; font-family: 'Segoe UI', sans-serif; padding: 28px 32px; }
  .id { font-family: Consolas, monospace; font-size: 13px; color: #8b949e; }
  h1 { font-size: 22px; font-weight: 600; color: #f0f6fc; margin: 10px 0 22px; }
  .label { font-size: 11px; letter-spacing: .08em; color: #8b949e; text-transform: uppercase; margin: 18px 0 8px; }
  pre { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 14px 16px; font-family: Consolas, monospace; font-size: 13px; line-height: 1.6; color: #79c0ff; white-space: pre-wrap; }
  .res { color: #7ee787; }
  .ok { display:inline-block; font-family: Consolas, monospace; font-size: 12px; color:#3fb950; border:1px solid #238636; background:#23863622; border-radius: 5px; padding: 3px 9px; }
  </style></head><body>
  <div class="id">${c.id} · ${esc(c.module)} · Приоритет: ${esc(c.priority)}</div>
  <h1>${esc(c.title)}</h1>
  <div class="label">SQL-запрос</div>
  <pre>${esc(sql)}</pre>
  <div class="label">Ожидаемый результат</div>
  <pre class="res">${esc(c.steps[0].expected)}</pre>
  <div style="margin-top:18px"><span class="ok">PG 16 · localhost:5432/shawarma</span></div>
  </body></html>`;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 });

let n = 0;
for (const c of DETAILED_API) {
  await page.setContent(cardApi(c), { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: '.tmp/shots/' + c.id + '.png', fullPage: true });
  n++;
}
for (const c of DETAILED_DB) {
  await page.setContent(cardDb(c), { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: '.tmp/shots/' + c.id + '.png', fullPage: true });
  n++;
}
console.log('сгенерировано карточек:', n);
await browser.close();
process.exit(0);
