// Финализация: обновляем главную и удаляем устаревшие страницы прошлой версии.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const req = createRequire('C:/Playwright/Yandextests/package.json');
const { chromium } = req('playwright');

const DIR = path.dirname(fileURLToPath(import.meta.url));
const home = fs.readFileSync(path.join(DIR, 'pkg', '00-home.html'), 'utf8');
const HOME_ID = '1343597';

const OLD_IDS = ['1310722', '1310738', '1343683', '1343699', '1409037', '1441793', '1441809', '1441825', '1474561'];

const ctx = await chromium.launchPersistentContext('C:/Users/Пользователь/Documents/deepseek-harness/default-workspace/shawarma-shop/.tmp/cf-profile', {
  headless: true,
  viewport: { width: 1400, height: 900 },
});
const page = ctx.pages()[0] || await ctx.newPage();
await page.goto('https://boysporting.atlassian.net/wiki/spaces/QASHOP', { waitUntil: 'domcontentloaded', timeout: 60000 });
console.log('открыт:', await page.title());

// 1. Обновляем главную
const homeRes = await page.evaluate('(async () => {' +
  'const API = "/wiki/rest/api/content";' +
  'const H = {"Content-Type":"application/json","Accept":"application/json","X-Atlassian-Token":"no-check"};' +
  'const cur = await (await fetch(API + "/' + HOME_ID + '?expand=version", {headers:H})).json();' +
  'const r = await fetch(API + "/' + HOME_ID + '", {method:"PUT", headers:H, body: JSON.stringify({id:"' + HOME_ID + '", type:"page", title:"Шаурма-Мастер — документация", space:{key:"QASHOP"}, version:{number: cur.version.number + 1}, body:{storage:{value:' + JSON.stringify(home) + ', representation:"storage"}}})});' +
  'return "главная: " + r.status;' +
'})()');
console.log(homeRes);

// 2. Удаляем старые страницы
const delRes = await page.evaluate('(async () => {' +
  'const API = "/wiki/rest/api/content";' +
  'const H = {"Accept":"application/json","X-Atlassian-Token":"no-check"};' +
  'const ids = ' + JSON.stringify(OLD_IDS) + ';' +
  'const out = [];' +
  'for (const id of ids) {' +
  '  const r = await fetch(API + "/" + id, {method:"DELETE", headers:H});' +
  '  out.push(id + ":" + r.status);' +
'}' +
'return out.join(", ");' +
'})()');
console.log('удаление:', delRes);

// 3. Проверяем дерево
const tree = await page.evaluate('(async () => {' +
  'const API = "/wiki/rest/api/content";' +
  'const H = {"Accept":"application/json"};' +
  'const r = await fetch(API + "?spaceKey=QASHOP&limit=100&expand=ancestors&status=current", {headers:H});' +
  'const d = await r.json();' +
  'const rows = (d.results || []).map(function (p) {' +
  '  const parent = p.ancestors && p.ancestors.length ? p.ancestors[p.ancestors.length - 1].title : "(корень)";' +
  '  return parent + " >> " + p.title;' +
'}).sort();' +
'return rows.join("\\n");' +
'})()');
console.log('=== ДЕРЕВО ===');
console.log(tree);

await ctx.close();
process.exit(0);
