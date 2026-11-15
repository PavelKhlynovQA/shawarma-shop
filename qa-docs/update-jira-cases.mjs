// Обновляет описания тест-кейсов и прикрепляет скриншот к каждому.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { buildAdf } from './case-adf.mjs';

const req = createRequire('C:/Playwright/Yandextests/package.json');
const { chromium } = req('playwright');

const { DETAILED_UI } = await import('./content/cases-detailed-ui.mjs');
const { DETAILED_API } = await import('./content/cases-detailed-api.mjs');
const { DETAILED_DB } = await import('./content/cases-detailed-db.mjs');
const ALL = [].concat(DETAILED_UI, DETAILED_API, DETAILED_DB);

const SHOTS = {
  'TC-UI-01': '.tmp/shots/ui-01-storefront.png',
  'TC-UI-02': '.tmp/shots/TC-UI-02.png',
  'TC-UI-03': '.tmp/shots/ui-05-product-modal.png',
  'TC-UI-04': '.tmp/shots/ui-05-cart.png',
  'TC-UI-05': '.tmp/shots/ui-05-product-modal.png',
  'TC-UI-06': '.tmp/shots/TC-UI-06.png',
  'TC-UI-07': '.tmp/shots/TC-UI-07.png',
  'TC-UI-08': '.tmp/shots/TC-UI-08.png',
  'TC-UI-09': '.tmp/shots/ui-09-login.png',
  'TC-UI-10': '.tmp/shots/TC-UI-10.png',
  'TC-UI-11': '.tmp/shots/TC-UI-11.png',
  'TC-UI-12': '.tmp/shots/ui-payment.png',
  'TC-UI-13': 'docs/screenshots/journey-3-payment.png',
  'TC-UI-14': 'docs/screenshots/journey-3-payment.png',
  'TC-UI-15': 'docs/screenshots/journey-5-ready.png',
  'TC-UI-16': '.tmp/shots/ui-16-admin.png',
  'TC-UI-17': '.tmp/shots/TC-UI-17.png',
  'TC-UI-18': '.tmp/shots/TC-UI-18.png',
};

const ctx = await chromium.launchPersistentContext('C:/Users/Пользователь/Documents/deepseek-harness/default-workspace/shawarma-shop/.tmp/cf-profile', { headless: true });
const page = ctx.pages()[0] || await ctx.newPage();
await page.goto('https://boysporting.atlassian.net/jira/for-you', { waitUntil: 'domcontentloaded', timeout: 45000 });

const JQL = JSON.stringify('project = SCRUM AND labels = "test-case"');
const raw = await page.evaluate('(async () => {' +
  'const H = {"Content-Type":"application/json","Accept":"application/json"};' +
  'const jql = ' + JQL + ';' +
  'const r = await fetch("/rest/api/3/search/jql", {method:"POST", headers:H, body: JSON.stringify({jql: jql, maxResults:500, fields:["summary","attachment"]})});' +
  'const d = await r.json();' +
  'return JSON.stringify((d.issues||[]).map(function(i){ return {key:i.key, s:i.fields.summary, att:(i.fields.attachment||[]).length}; }));' +
'})()');
const issues = JSON.parse(raw);
const keyById = {};
issues.forEach(function (i) { const m = /(TC-[A-Z]+-\d+)/.exec(i.s); if (m) keyById[m[1]] = i; });
console.log('задач:', issues.length);

let descOk = 0, attOk = 0;
for (let i = 0; i < ALL.length; i += 5) {
  const chunk = ALL.slice(i, i + 5);
  const payload = chunk.map(function (c) {
    const it = keyById[c.id];
    if (!it) return null;
    const shot = SHOTS[c.id] || ('.tmp/shots/' + c.id + '.png');
    let b64 = null, name = null;
    if (fs.existsSync(shot)) { b64 = fs.readFileSync(shot).toString('base64'); name = c.id + '.png'; }
    return { key: it.key, adf: buildAdf(c), b64: b64, name: name, hasAttachment: it.att > 0 };
  }).filter(Boolean);

  const res = await page.evaluate('(async () => {' +
    'const H = {"Content-Type":"application/json","Accept":"application/json"};' +
    'const items = ' + JSON.stringify(payload) + ';' +
    'const out = [];' +
    'for (const it of items) {' +
    '  const r1 = await fetch("/rest/api/3/issue/" + it.key, {method:"PUT", headers:H, body: JSON.stringify({fields:{description: it.adf}})});' +
    '  let r2 = "skip";' +
    '  if (it.b64 && !it.hasAttachment) {' +
    '    const bin = atob(it.b64); const arr = new Uint8Array(bin.length);' +
    '    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);' +
    '    const fd = new FormData();' +
    '    fd.append("file", new Blob([arr], {type:"image/png"}), it.name);' +
    '    const ra = await fetch("/rest/api/3/issue/" + it.key + "/attachments", {method:"POST", headers:{"X-Atlassian-Token":"no-check"}, body: fd});' +
    '    r2 = ra.status;' +
    '  }' +
    '  out.push(it.key + "|" + r1.status + "|" + r2);' +
    '}' +
    'return JSON.stringify(out);' +
  '})()');

  JSON.parse(res || '[]').forEach(function (s) {
    const p = s.split('|');
    if (p[1] === '204') descOk++;
    if (p[2] === '200') attOk++;
  });
  console.log('обработано ' + Math.min(i + 5, ALL.length) + '/' + ALL.length);
}

console.log('ИТОГО: описаний=' + descOk + ', вложений=' + attOk);
await ctx.close();
process.exit(0);
