// Публикует пакет документации в Confluence: 4 раздела + 23 страницы.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const req = createRequire('C:/Playwright/Yandextests/package.json');
const { chromium } = req('playwright');

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PKG = path.join(DIR, 'pkg');
const PROFILE = 'C:/Users/Пользователь/Documents/deepseek-harness/default-workspace/shawarma-shop/.tmp/cf-profile';
const HOME_ID = '1343597';

const manifest = JSON.parse(fs.readFileSync(path.join(PKG, 'manifest.json'), 'utf8'));
const home = fs.readFileSync(path.join(PKG, '00-home.html'), 'utf8');

function read(file) { return fs.readFileSync(path.join(PKG, file), 'utf8'); }

const ctx = await chromium.launchPersistentContext(PROFILE, {
  headless: true,
  viewport: { width: 1400, height: 900 },
});
const page = ctx.pages()[0] || await ctx.newPage();
await page.goto('https://boysporting.atlassian.net/wiki/spaces/QASHOP', { waitUntil: 'domcontentloaded', timeout: 60000 });
console.log('открыт Confluence:', await page.title());

const HELPERS = `
const API = '/wiki/rest/api/content';
const H = { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Atlassian-Token': 'no-check' };
async function upsert(title, html, parentId) {
  const s = await fetch(API + '?spaceKey=QASHOP&title=' + encodeURIComponent(title) + '&expand=version', { headers: H });
  const d = await s.json();
  if (d.results && d.results.length) {
    const p = d.results[0];
    const body = { id: p.id, type: 'page', title: title, space: { key: 'QASHOP' }, version: { number: p.version.number + 1 }, body: { storage: { value: html, representation: 'storage' } } };
    if (parentId) body.ancestors = [{ id: parentId }];
    const r = await fetch(API + '/' + p.id, { method: 'PUT', headers: H, body: JSON.stringify(body) });
    return { id: p.id, status: r.status, action: 'upd' };
  }
  const body = { type: 'page', title: title, space: { key: 'QASHOP' }, body: { storage: { value: html, representation: 'storage' } } };
  if (parentId) body.ancestors = [{ id: parentId }];
  const r = await fetch(API, { method: 'POST', headers: H, body: JSON.stringify(body) });
  let id = null; try { id = (await r.json()).id; } catch (e) {}
  return { id: id, status: r.status, action: 'new' };
}
`;

// 1. Главная
const homeRes = await page.evaluate(new Function('return (async () => {' + HELPERS + '  const r = await upsert("Шаурма-Мастер — документация", ' + JSON.stringify(home) + ', null); return r; })()').toString().replace(/^function anonymous\(/, 'function (') );
console.log('главная:', JSON.stringify(homeRes));
const HOME = homeRes && homeRes.id ? String(homeRes.id) : HOME_ID;

// 2. Разделы
const sections = manifest.sections;
const sectionIds = {};

for (const section of sections) {
  const res = await page.evaluate('(async () => {' + HELPERS +
    ' const r = await upsert(' + JSON.stringify(section) + ', "<p>Раздел документации проекта «Шаурма-Мастер».</p>", ' + JSON.stringify(HOME) + ');' +
    ' return r; })()');
  sectionIds[section] = res.id;
  console.log('раздел:', section, '->', res.status, res.id);
  await new Promise((r) => setTimeout(r, 400));
}

// 3. Страницы
for (const item of manifest.pages) {
  const html = read(item.file);
  const parent = sectionIds[item.section];
  const res = await page.evaluate('(async () => {' + HELPERS +
    ' const r = await upsert(' + JSON.stringify(item.title) + ', ' + JSON.stringify(html) + ', ' + JSON.stringify(String(parent)) + ');' +
    ' return r; })()');
  console.log('  ' + item.title + ' -> ' + res.status + ' (' + res.action + ')');
  await new Promise((r) => setTimeout(r, 350));
}

console.log('ГОТОВО');
await ctx.close();
process.exit(0);
