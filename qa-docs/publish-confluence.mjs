// Публикует страницы в Confluence через REST API из контекста авторизованного браузера.
// Запуск: node qa-docs/publish-confluence.mjs  → готовит .tmp/expr-publish.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(DIR, 'confluence');

const PAGES = [
  ['01-requirements.html', 'Требования'],
  ['02-test-plan.html', 'Тест-план'],
  ['03-cases-ui.html', 'Тест-кейсы UI'],
  ['04-cases-api.html', 'Тест-кейсы API'],
  ['05-cases-db.html', 'Тест-кейсы БД'],
  ['06-traceability.html', 'Матрица трассировки'],
  ['07-bugs.html', 'Баг-репорты'],
  ['08-test-data.html', 'Тестовые данные'],
  ['09-test-report.html', 'Отчёт о тестировании'],
];

const payload = PAGES.map(function (entry) {
  const raw = fs.readFileSync(path.join(SRC, entry[0]), 'utf8');
  const body = raw.replace(/^<h1>[\s\S]*?<\/h1>\s*/, '');
  return { title: entry[1], html: body };
});

const script = '(async () => {' +
  'const PAGES = ' + JSON.stringify(payload) + ';' +
  'const SPACE = "QASHOP";' +
  'const HOME_ID = "1343597";' +
  'const API = "/wiki/rest/api/content";' +
  'const H = {"Content-Type":"application/json","Accept":"application/json","X-Atlassian-Token":"no-check"};' +
  'const log = [];' +
  'for (const p of PAGES) {' +
  '  try {' +
  '    const search = await fetch(API + "?spaceKey=" + SPACE + "&title=" + encodeURIComponent(p.title) + "&expand=version", {headers:H});' +
  '    const found = await search.json();' +
  '    if (found.results && found.results.length) {' +
  '      const page = found.results[0];' +
  '      const r = await fetch(API + "/" + page.id, {method:"PUT", headers:H, body: JSON.stringify({id: page.id, type:"page", title: p.title, space:{key:SPACE}, version:{number: page.version.number + 1}, body:{storage:{value: p.html, representation:"storage"}}})});' +
  '      log.push("UPD " + p.title + " -> " + r.status);' +
  '    } else {' +
  '      const r = await fetch(API, {method:"POST", headers:H, body: JSON.stringify({type:"page", title:p.title, space:{key:SPACE}, ancestors:[{id:HOME_ID}], body:{storage:{value:p.html, representation:"storage"}}})});' +
  '      log.push("NEW " + p.title + " -> " + r.status);' +
  '    }' +
  '  } catch (e) { log.push("ERR " + p.title + ": " + e.message); }' +
  '}' +
  'return log.join("\\n");' +
'})()';

fs.writeFileSync(path.join(DIR, '..', '.tmp', 'expr-publish.js'), script, 'utf8');
console.log('выражение готово, страниц:', payload.length, ', размер:', Math.round(script.length / 1024), 'КБ');
