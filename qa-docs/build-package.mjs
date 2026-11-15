// Собирает полный пакет документации в формате Confluence Storage Format.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PROJECT } from './content/meta.mjs';
import { REQUIREMENTS } from './content/requirements.mjs';
import { VISION, SPEC } from './content/doc-vision.mjs';
import { ARCH, DB_SCHEMA, API_SPEC } from './content/doc-arch.mjs';
import { MOCKUPS } from './content/doc-design.mjs';
import { STRATEGY, DEPLOY, USER_GUIDE, ADMIN_GUIDE, CHANGELOG } from './content/doc-ops.mjs';
import { STORIES } from './content/doc-stories.mjs';
import { UI_CASES } from './content/cases-ui.mjs';
import { API_CASES, DB_CASES } from './content/cases-api.mjs';
import { BUGS } from './content/bugs.mjs';
import { PLAN_SECTIONS, CHECKLIST } from './content/plan.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'pkg');
fs.mkdirSync(OUT, { recursive: true });

function esc(v) {
  return String(v === undefined || v === null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function table(head, rows, wide) {
  const cols = head.map(function () { return '<col style="width:auto"/>'; }).join('');
  const headHtml = '<tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr>';
  const body = rows.map(function (r) {
    return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>';
  }).join('');
  return '<table' + (wide ? ' data-layout="wide"' : '') + '><colgroup>' + cols + '</colgroup><thead>' + headHtml + '</thead><tbody>' + body + '</tbody></table>';
}

function code(text) {
  return '<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">text</ac:parameter><ac:plain-text-body><![CDATA[' + text + ']]></ac:plain-text-body></ac:structured-macro>';
}

function render(blocks) {
  return (blocks || []).map(function (b) {
    if (b.t === 'h2') return '<h2>' + esc(b.v) + '</h2>';
    if (b.t === 'h3') return '<h3>' + esc(b.v) + '</h3>';
    if (b.t === 'p') return '<p>' + esc(b.v) + '</p>';
    if (b.t === 'ul') return '<ul>' + b.v.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    if (b.t === 'ol') return '<ol>' + b.v.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>';
    if (b.t === 'table') return table(b.head, b.rows, true);
    if (b.t === 'code') return code(b.v);
    if (b.t === 'note') return '<p><strong>Примечание.</strong> ' + esc(b.v) + '</p>';
    return '';
  }).join('\n');
}

// --- Таблицы из существующих данных ---
const FR = REQUIREMENTS.filter(function (r) { return r.id.indexOf('FR-') === 0; });
const NFR = REQUIREMENTS.filter(function (r) { return r.id.indexOf('NFR-') === 0; });

function reqTable(list) {
  return table(['ID', 'Модуль', 'Требование', 'Приоритет', 'Критерии приёмки'],
    list.map(function (r) { return [r.id, r.module, r.title, r.priority, r.acceptance]; }));
}

function caseTable(cases, kind) {
  const fifth = kind === 'api' ? 'Запрос' : (kind === 'db' ? 'SQL' : 'Шаги');
  const head = ['ID', 'Название', 'Приоритет', fifth, 'Ожидаемый результат', 'Автотест'];
  const widths = ['8%', '19%', '9%', '31%', '25%', '8%'];
  const colgroup = '<colgroup>' + widths.map(function (w) { return '<col style="width:' + w + '"/>'; }).join('') + '</colgroup>';
  const headHtml = '<tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr>';
  const body = cases.map(function (c) {
    const detail = (c.steps && c.steps.length)
      ? c.steps.map(function (s, i) { return (i + 1) + '. ' + esc(s); }).join('<br/>')
      : '<code>' + esc(c.request || c.sql) + '</code>';
    return '<tr><td>' + esc(c.id) + '</td><td><strong>' + esc(c.title) + '</strong><br/><em>' + esc(c.preconditions || '') + '</em></td><td>' + esc(c.priority) + '</td><td>' + detail + '</td><td>' + esc(c.expected) + '</td><td>' + esc(c.automation) + '</td></tr>';
  }).join('');
  return '<table data-layout="wide">' + colgroup + '<thead>' + headHtml + '</thead><tbody>' + body + '</tbody></table>';
}

// --- Страницы ---
const PAGES = [
  { section: '1. Требования', title: '1.1 Постановка задачи и видение продукта', blocks: VISION },
  { section: '1. Требования', title: '1.2 Функциональные требования', html: '<p>14 функциональных требований с критериями приёмки.</p>' + reqTable(FR) },
  { section: '1. Требования', title: '1.3 Нефункциональные требования', html: '<p>Требования к производительности, наблюдаемости, безопасности и развёртыванию.</p>' + reqTable(NFR) },
  { section: '1. Требования', title: '1.4 Пользовательские истории', html: '<p>10 историй: что хочет каждая роль и как это проверяется.</p>' + table(['ID', 'Роль', 'Хочу', 'Чтобы', 'Критерии приёмки'], STORIES.map(function (s) { return [s.id, s.role, s.want, s.why, s.acceptance]; }), true) },
  { section: '1. Требования', title: '1.5 Техническое задание', blocks: SPEC },

  { section: '2. Проектирование', title: '2.1 Архитектура приложения', blocks: ARCH },
  { section: '2. Проектирование', title: '2.2 Схема базы данных', blocks: DB_SCHEMA },
  { section: '2. Проектирование', title: '2.3 Спецификация API', blocks: API_SPEC },
  { section: '2. Проектирование', title: '2.4 Макеты интерфейса', blocks: MOCKUPS },

  { section: '3. Тестирование', title: '3.1 Стратегия тестирования', blocks: STRATEGY },
  { section: '3. Тестирование', title: '3.2 План тестирования', html: PLAN_SECTIONS.map(function (s) {
      return '<h2>' + esc(s.title) + '</h2>' + (s.paragraphs || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + ((s.bullets && s.bullets.length) ? '<ul>' + s.bullets.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' : '');
    }).join('\n') },
  { section: '3. Тестирование', title: '3.3 Тест-кейсы UI', html: '<p>18 кейсов уровня интерфейса.</p>' + caseTable(UI_CASES, 'ui') },
  { section: '3. Тестирование', title: '3.4 Тест-кейсы API', html: '<p>27 кейсов контракта и бизнес-правил.</p>' + caseTable(API_CASES, 'api') },
  { section: '3. Тестирование', title: '3.5 Тест-кейсы БД', html: '<p>8 SQL-проверок целостности.</p>' + caseTable(DB_CASES, 'db') },
  { section: '3. Тестирование', title: '3.6 Чек-листы', html: CHECKLIST.map(function (g) { return '<h2>' + esc(g.group) + '</h2><ul>' + g.items.map(function (i) { return '<li>☐ ' + esc(i) + '</li>'; }).join('') + '</ul>'; }).join('\n') },
  { section: '3. Тестирование', title: '3.7 Баг-репорты', html: '<p>10 дефектов, все воспроизведены на проекте.</p>' + table(['ID', 'Заголовок', 'Серьёзность', 'Приоритет', 'Статус', 'Компонент', 'Кейс'], BUGS.map(function (b) { return [b.id, b.title, b.severity, b.priority, b.status, b.component, b.linkedCase]; }), true) },
  { section: '3. Тестирование', title: '3.8 Отчёт о тестировании', html: reportHtml() },
  { section: '3. Тестирование', title: '3.9 Матрица трассировки', html: traceHtml() },
  { section: '3. Тестирование', title: '3.10 Тестовые данные', html: dataHtml() },

  { section: '4. Эксплуатация', title: '4.1 Руководство по развёртыванию', blocks: DEPLOY },
  { section: '4. Эксплуатация', title: '4.2 Руководство пользователя', blocks: USER_GUIDE },
  { section: '4. Эксплуатация', title: '4.3 Руководство администратора', blocks: ADMIN_GUIDE },
  { section: '4. Эксплуатация', title: '4.4 История изменений', blocks: CHANGELOG },
];

function reportHtml() {
  return [
    '<p><strong>Дата:</strong> ' + esc(PROJECT.releaseDate) + ' · <strong>Версия:</strong> ' + esc(PROJECT.version) + '</p>',
    table(['Показатель', 'Значение'], [
      ['Всего тест-кейсов', '53'],
      ['UI / API / БД', '18 / 27 / 8'],
      ['API-автотесты', '23 из 23'],
      ['E2E-автотесты', '35 из 35'],
      ['Визуальные тесты', '5 из 5'],
      ['Найдено дефектов', String(BUGS.length)],
      ['Исправлено', String(BUGS.filter(function (b) { return b.status === 'Исправлен'; }).length)],
    ], true),
    '<h2>Вывод</h2><p>Основные сценарии работают: заказ, оплата, уведомление, админские операции. Релиз не готов из-за BUG-005 (утечка ПДн) и BUG-006 (нет транзакций).</p>',
    '<h2>Рекомендации</h2><ul><li>Ввести схему валидации вместо ручной</li><li>Обернуть создание заказа в транзакцию</li><li>Закрыть публичный доступ к заказу</li><li>Добавить rate limiting</li></ul>',
  ].join('\n');
}

function traceHtml() {
  const all = [].concat(UI_CASES, API_CASES, DB_CASES);
  const rows = REQUIREMENTS.map(function (r) {
    const related = all.filter(function (c) { return String(c.requirement || '').indexOf(r.id) !== -1; });
    const autos = related.map(function (c) { return c.automation; }).filter(function (a, i, arr) { return a && a !== '—' && a !== 'ручная проверка' && arr.indexOf(a) === i; });
    return [r.id, r.title, related.map(function (c) { return c.id; }).join(', ') || '—', autos.join(', ') || '—'];
  });
  return '<p>Покрытие требований тест-кейсами и автотестами.</p>' + table(['Требование', 'Описание', 'Тест-кейсы', 'Автотесты'], rows, true);
}

function dataHtml() {
  return [
    '<h2>Учётные записи</h2>' + table(['Роль', 'Email', 'Пароль'], PROJECT.accounts.map(function (a) { return [a.role, a.email, a.password]; })),
    '<h2>Промокоды</h2>' + table(['Код', 'Скидка', 'Состояние', 'Назначение'], PROJECT.promocodes.map(function (p) { return [p.code, p.discount, p.state, p.use]; })),
    '<h2>Тестовые карты</h2>' + table(['Номер', 'Срок', 'CVV', 'Результат'], PROJECT.testCards.map(function (c) { return [c.number, c.expiry, c.cvv, c.result]; })),
  ].join('\n');
}

// --- Запись ---
const manifest = [];
let index = 0;

PAGES.forEach(function (page) {
  index += 1;
  const file = String(index).padStart(2, '0') + '.html';
  const body = page.html !== undefined ? page.html : render(page.blocks);
  fs.writeFileSync(path.join(OUT, file), body, 'utf8');
  manifest.push({ file: file, title: page.title, section: page.section });
});

// Главная страница
const sections = [];
PAGES.forEach(function (p) { if (sections.indexOf(p.section) === -1) sections.push(p.section); });
const home = [
  '<p><strong>' + esc(PROJECT.name) + '</strong> — ' + esc(PROJECT.tagline) + '. Полный пакет документации проекта версии ' + esc(PROJECT.version) + '.</p>',
  '<h2>Структура документации</h2>',
  table(['Раздел', 'Что внутри'], [
    ['1. Требования', 'Постановка и видение, функциональные и нефункциональные требования, пользовательские истории, техническое задание'],
    ['2. Проектирование', 'Архитектура, схема базы данных, спецификация API, макеты интерфейса'],
    ['3. Тестирование', 'Стратегия и план, тест-кейсы UI/API/БД, чек-листы, баг-репорты, отчёт, трассировка, тестовые данные'],
    ['4. Эксплуатация', 'Развёртывание, руководство пользователя и администратора, история изменений'],
  ], true),
  '<h2>Ссылки</h2>',
  '<p>Репозиторий: <a href="' + PROJECT.repo + '">' + PROJECT.repo + '</a><br/>CI: <a href="' + PROJECT.repo + '/actions">GitHub Actions</a></p>',
  '<p>Объём: ' + sections.length + ' раздела, ' + PAGES.length + ' страниц, 53 тест-кейса, 10 баг-репортов.</p>',
].join('\n');

fs.writeFileSync(path.join(OUT, '00-home.html'), home, 'utf8');
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({ sections: sections, pages: manifest }, null, 2), 'utf8');

console.log('Страниц собрано:', manifest.length + 1, '| разделов:', sections.length);
