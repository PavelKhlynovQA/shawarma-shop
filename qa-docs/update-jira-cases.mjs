// Обновляет описания тест-кейсов в Jira (формат: шаги + ожидаемые результаты).
import { createRequire } from 'node:module';
import { buildAdf } from './case-adf.mjs';

const req = createRequire('C:/Playwright/Yandextests/package.json');
const { chromium } = req('playwright');

const { DETAILED_UI } = await import('./content/cases-detailed-ui.mjs');
const { DETAILED_API } = await import('./content/cases-detailed-api.mjs');
const { DETAILED_DB } = await import('./content/cases-detailed-db.mjs');

const ALL = [].concat(DETAILED_UI, DETAILED_API, DETAILED_DB);

const ctx = await chromium.launchPersistentContext('C:/Users/Пользователь/Documents/deepseek-harness/default-workspace/shawarma-shop/.tmp/cf-profile', { headless: true });
const page = ctx.pages()[0] || await ctx.newPage();
await page.goto('https://boysporting.atlassian.net/jira/for-you', { waitUntil: 'domcontentloaded', timeout: 45000 });

const JQL = JSON.stringify('project = SCRUM AND labels = "test-case"');
const keysRaw = await page.evaluate('(async () => {' +
  'const H = {"Content-Type":"application/json","Accept":"application/json"};' +
  'const jql = ' + JQL + ';' +
  'const r = await fetch("/rest/api/3/search/jql", {method:"POST", headers:H, body: JSON.stringify({jql: jql, maxResults:500, fields:["summary"]})});' +
  'const d = await r.json();' +
  'return JSON.stringify((d.issues||[]).map(function(i){ return {key:i.key, s:i.fields.summary}; }));' +
'})()');
const issues = JSON.parse(keysRaw);
const keyById = {};
issues.forEach(function (i) { const m = /(TC-[A-Z]+-\d+)/.exec(i.s); if (m) keyById[m[1]] = i.key; });
console.log('задач в Jira:', issues.length);

let ok = 0, fail = 0;
const errors = [];

for (let i = 0; i < ALL.length; i += 8) {
  const chunk = ALL.slice(i, i + 8).map(function (c) {
    return { key: keyById[c.id], adf: buildAdf(c) };
  }).filter(function (x) { return x.key; });

  const res = await page.evaluate('(async () => {' +
    'const H = {"Content-Type":"application/json","Accept":"application/json"};' +
    'const items = ' + JSON.stringify(chunk) + ';' +
    'const out = [];' +
    'for (const it of items) {' +
    '  const r = await fetch("/rest/api/3/issue/" + it.key, {method:"PUT", headers:H, body: JSON.stringify({fields:{description: it.adf}})});' +
    '  out.push(it.key + ":" + r.status);' +
    '}' +
    'return JSON.stringify(out);' +
  '})()');

  JSON.parse(res || '[]').forEach(function (s) {
    if (s.endsWith(':204')) ok++; else { fail++; errors.push(s); }
  });
  console.log('обновлено ' + Math.min(i + 8, ALL.length) + '/' + ALL.length);
}

console.log('ИТОГО: ok=' + ok + ', fail=' + fail, errors.slice(0, 3).join(', '));
await ctx.close();
process.exit(0);
