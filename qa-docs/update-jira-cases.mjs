// Обновляет описания тест-кейсов в Jira детализированной версией.
import { createRequire } from 'node:module';

const req = createRequire('C:/Playwright/Yandextests/package.json');
const { chromium } = req('playwright');

const { DETAILED_UI } = await import('./content/cases-detailed-ui.mjs');
const { DETAILED_API } = await import('./content/cases-detailed-api.mjs');
const { DETAILED_DB } = await import('./content/cases-detailed-db.mjs');

const ALL = [].concat(DETAILED_UI, DETAILED_API, DETAILED_DB);

function buildDescription(c) {
  const lines = [];
  lines.push('МОДУЛЬ: ' + c.module + '  |  ТИП: ' + (c.type || 'Функциональный') + '  |  ПРИОРИТЕТ: ' + c.priority);
  lines.push('ТРЕБОВАНИЕ: ' + (c.requirement || '—') + '  |  АВТОТЕСТ: ' + (c.automation || '—'));
  lines.push('');
  lines.push('ПРЕДУСЛОВИЯ:');
  c.preconditions.forEach(function (p, i) { lines.push('  ' + (i + 1) + '. ' + p); });

  if (c.api) {
    lines.push('');
    lines.push('ЭНДПОИНТ: ' + c.api.method + ' ' + c.api.url);
    const hk = Object.keys(c.api.headers || {});
    if (hk.length) {
      lines.push('ЗАГОЛОВКИ: ' + hk.map(function (k) { return k + ': ' + c.api.headers[k]; }).join('; '));
    }
    if (c.api.body) {
      lines.push('ТЕЛО ЗАПРОСА:');
      lines.push(JSON.stringify(c.api.body, null, 2));
    } else {
      lines.push('ТЕЛО ЗАПРОСА: отсутствует');
    }
    lines.push('');
    lines.push('ОЖИДАЕМЫЙ ОТВЕТ: HTTP ' + c.api.status);
    lines.push(JSON.stringify(c.api.response, null, 2));
  }

  lines.push('');
  lines.push('ШАГИ И ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ:');
  c.steps.forEach(function (s, i) {
    lines.push('');
    lines.push('Шаг ' + (i + 1) + '. ' + s.action);
    lines.push('  → Ожидаемый результат: ' + s.expected);
  });

  if (c.notes) {
    lines.push('');
    lines.push('ПРИМЕЧАНИЕ: ' + c.notes);
  }
  return lines.join('\n');
}

const ctx = await chromium.launchPersistentContext('C:/Users/Пользователь/Documents/deepseek-harness/default-workspace/shawarma-shop/.tmp/cf-profile', { headless: true });
const page = ctx.pages()[0] || await ctx.newPage();
await page.goto('https://boysporting.atlassian.net/jira/for-you', { waitUntil: 'domcontentloaded', timeout: 45000 });

const JQL_CASES = JSON.stringify('project = SCRUM AND labels = "test-case"');
const keysRaw = await page.evaluate('(async () => {' +
  'const H = {"Content-Type":"application/json","Accept":"application/json"};' +
  'const jql = ' + JQL_CASES + ';' +
  'const r = await fetch("/rest/api/3/search/jql", {method:"POST", headers:H, body: JSON.stringify({jql: jql, maxResults:500, fields:["summary"]})});' +
  'const d = await r.json();' +
  'return JSON.stringify((d.issues||[]).map(function(i){ return {key:i.key, s:i.fields.summary}; }));' +
'})()');
const issues = JSON.parse(keysRaw);
console.log('задач в Jira:', issues.length);

const keyById = {};
issues.forEach(function (i) {
  const m = /(TC-[A-Z]+-\d+)/.exec(i.s);
  if (m) keyById[m[1]] = i.key;
});

let ok = 0, fail = 0;
const errors = [];

for (let i = 0; i < ALL.length; i += 8) {
  const chunk = ALL.slice(i, i + 8).map(function (c) {
    return { key: keyById[c.id], text: buildDescription(c) };
  }).filter(function (x) { return x.key; });

  const res = await page.evaluate('(async () => {' +
    'const H = {"Content-Type":"application/json","Accept":"application/json"};' +
    'const items = ' + JSON.stringify(chunk) + ';' +
    'const out = [];' +
    'for (const it of items) {' +
    '  const r = await fetch("/rest/api/2/issue/" + it.key, {method:"PUT", headers:H, body: JSON.stringify({fields:{description: it.text}})});' +
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
