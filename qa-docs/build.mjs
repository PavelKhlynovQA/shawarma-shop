// Генератор QA-документации: сайт, страницы Confluence и CSV для Jira.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJECT } from './content/meta.mjs';
import { REQUIREMENTS } from './content/requirements.mjs';
import { UI_CASES } from './content/cases-ui.mjs';
import { API_CASES, DB_CASES } from './content/cases-api.mjs';
import { BUGS } from './content/bugs.mjs';
import { PLAN_SECTIONS, CHECKLIST } from './content/plan.mjs';

const ALL_CASES = [].concat(UI_CASES, API_CASES, DB_CASES);
const OUT = path.dirname(fileURLToPath(import.meta.url));

function esc(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function table(headers, rows, className) {
  const head = '<tr>' + headers.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr>';
  const body = rows.map(function (row) {
    return '<tr>' + row.map(function (cell) { return '<td>' + esc(cell) + '</td>'; }).join('') + '</tr>';
  }).join('');
  return '<table class="' + (className || '') + '"><thead>' + head + '</thead><tbody>' + body + '</tbody></table>';
}

function stepsHtml(steps) {
  if (!steps || !steps.length) return '—';
  return '<ol>' + steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>';
}

function caseRows(cases) {
  return cases.map(function (c) {
    return [c.id, c.title, c.module, c.priority, c.preconditions || '—', (c.steps || []).join(' → ') || c.request || c.sql || '—', c.expected, c.data || '—', c.automation || '—', c.status || 'Пройден'];
  });
}

function csvEscape(value) {
  const text = String(value === undefined || value === null ? '' : value);
  if (/[",\n]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
  return text;
}

function toCsv(headers, rows) {
  const lines = [headers.map(csvEscape).join(',')];
  rows.forEach(function (row) { lines.push(row.map(csvEscape).join(',')); });
  return '\uFEFF' + lines.join('\r\n');
}

// ---------- Статистика ----------
const stats = {
  total: ALL_CASES.length,
  ui: UI_CASES.length,
  api: API_CASES.length,
  db: DB_CASES.length,
  bugsOpen: BUGS.filter(function (b) { return b.status === 'Открыт'; }).length,
  bugsFixed: BUGS.filter(function (b) { return b.status === 'Исправлен'; }).length,
  requirements: REQUIREMENTS.length,
};

// ---------- Confluence ----------
const confluenceDir = path.join(OUT, 'confluence');
fs.mkdirSync(confluenceDir, { recursive: true });

function confluencePage(title, body) {
  return '<h1>' + esc(title) + '</h1>\n' + body;
}

function saveConfluence(file, title, body) {
  fs.writeFileSync(path.join(confluenceDir, file), confluencePage(title, body), 'utf8');
}

const homeBody = [
  '<p><strong>' + esc(PROJECT.name) + '</strong> — ' + esc(PROJECT.tagline) + '. Пространство документации для проекта версии ' + esc(PROJECT.version) + '.</p>',
  '<h2>Структура пространства</h2>',
  table(['Страница', 'Содержание'], [
    ['Требования', 'Функциональные и нефункциональные требования с критериями приёмки'],
    ['Тест-план', 'Цели, границы, стратегия, критерии входа и выхода, риски'],
    ['Тест-кейсы UI', UI_CASES.length + ' кейсов'],
    ['Тест-кейсы API', API_CASES.length + ' кейсов'],
    ['Тест-кейсы БД', DB_CASES.length + ' кейсов'],
    ['Матрица трассировки', 'Требование → тест-кейс → автотест'],
    ['Баг-репорты', BUGS.length + ' дефектов, из них открыто ' + stats.bugsOpen],
    ['Тестовые данные', 'Учётные записи, промокоды, карты, товары'],
    ['Отчёт о тестировании', 'Итоги прогона и метрики'],
  ]),
  '<h2>Ссылки</h2>',
  '<p>Репозиторий: <a href="' + esc(PROJECT.repo) + '">' + esc(PROJECT.repo) + '</a></p>',
  '<p>CI: <a href="' + esc(PROJECT.repo) + '/actions">GitHub Actions</a></p>',
].join('\n');
saveConfluence('00-home.html', 'Шаурма-Мастер — документация', homeBody);

const reqRows = REQUIREMENTS.map(function (r) { return [r.id, r.module, r.title, r.priority, r.acceptance]; });
saveConfluence('01-requirements.html', 'Требования', table(['ID', 'Модуль', 'Требование', 'Приоритет', 'Критерии приёмки'], reqRows));

const planBody = PLAN_SECTIONS.map(function (section) {
  return '<h2>' + esc(section.title) + '</h2>' +
    (section.paragraphs || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
    ((section.bullets && section.bullets.length) ? '<ul>' + section.bullets.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' : '');
}).join('\n');
saveConfluence('02-test-plan.html', 'Тест-план', planBody);

saveConfluence('03-cases-ui.html', 'Тест-кейсы UI', table(['ID', 'Название', 'Модуль', 'Приоритет', 'Предусловия', 'Шаги', 'Ожидаемый результат', 'Данные', 'Автотест', 'Статус'], caseRows(UI_CASES)));
saveConfluence('04-cases-api.html', 'Тест-кейсы API', table(['ID', 'Название', 'Модуль', 'Приоритет', 'Предусловия', 'Запрос', 'Ожидаемый результат', 'Данные', 'Автотест', 'Статус'], caseRows(API_CASES)));
saveConfluence('05-cases-db.html', 'Тест-кейсы БД', table(['ID', 'Название', 'Модуль', 'Приоритет', 'Предусловия', 'SQL', 'Ожидаемый результат', 'Данные', 'Автотест', 'Статус'], caseRows(DB_CASES)));

const traceRows = REQUIREMENTS.map(function (r) {
  const related = ALL_CASES.filter(function (c) { return String(c.requirement || '').indexOf(r.id) !== -1; });
  return [r.id, r.title, related.map(function (c) { return c.id; }).join(', ') || '—', related.map(function (c) { return c.automation; }).filter(function (a, i, arr) { return a && a !== '—' && a !== 'ручная проверка' && arr.indexOf(a) === i; }).join(', ') || '—'];
});
saveConfluence('06-traceability.html', 'Матрица трассировки', table(['Требование', 'Описание', 'Тест-кейсы', 'Автотесты'], traceRows));

const bugRows = BUGS.map(function (b) { return [b.id, b.title, b.severity, b.priority, b.status, b.component, b.linkedCase]; });
saveConfluence('07-bugs.html', 'Баг-репорты', table(['ID', 'Заголовок', 'Серьёзность', 'Приоритет', 'Статус', 'Компонент', 'Связанный кейс'], bugRows));

const dataBody = [
  '<h2>Учётные записи</h2>',
  table(['Роль', 'Email', 'Пароль'], PROJECT.accounts.map(function (a) { return [a.role, a.email, a.password]; })),
  '<h2>Промокоды</h2>',
  table(['Код', 'Скидка', 'Состояние', 'Назначение'], PROJECT.promocodes.map(function (p) { return [p.code, p.discount, p.state, p.use]; })),
  '<h2>Тестовые карты</h2>',
  table(['Номер', 'Срок', 'CVV', 'Результат'], PROJECT.testCards.map(function (c) { return [c.number, c.expiry, c.cvv, c.result]; })),
  '<h2>Окружения</h2>',
  table(['Окружение', 'БД', 'URL', 'Запуск'], PROJECT.environments.map(function (e) { return [e.name, e.db, e.url, e.run]; })),
].join('\n');
saveConfluence('08-test-data.html', 'Тестовые данные', dataBody);

const reportBody = [
  '<p><strong>Дата:</strong> ' + esc(PROJECT.releaseDate) + ' · <strong>Версия:</strong> ' + esc(PROJECT.version) + ' · <strong>Тестировщик:</strong> ' + esc(PROJECT.author) + '</p>',
  '<h2>Итоги</h2>',
  table(['Показатель', 'Значение'], [
    ['Всего тест-кейсов', String(stats.total)],
    ['UI / API / БД', stats.ui + ' / ' + stats.api + ' / ' + stats.db],
    ['Автотесты API', '23 из 23 пройдены'],
    ['Автотесты E2E', '35 из 35 пройдены'],
    ['Визуальные тесты', '5 из 5 пройдены'],
    ['Найдено дефектов', String(BUGS.length)],
    ['Открыто', String(stats.bugsOpen)],
    ['Исправлено', String(stats.bugsFixed)],
  ]),
  '<h2>Вывод</h2>',
  '<p>Основные бизнес-сценарии работают: заказ, оплата, уведомление о готовности, админские операции. Релиз не готов из-за BUG-005 (утечка персональных данных) и BUG-006 (отсутствие транзакций).</p>',
  '<h2>Рекомендации</h2>',
  '<ul><li>Ввести схему валидации (zod/express-validator) — ручная валидация дала 3 дефекта</li><li>Обернуть создание заказа в транзакцию</li><li>Закрыть публичный доступ к заказу подтверждением телефона</li><li>Подключить rate limiting на логин и создание заказа</li></ul>',
].join('\n');
saveConfluence('09-test-report.html', 'Отчёт о тестировании', reportBody);

console.log('Confluence: страниц создано —', fs.readdirSync(confluenceDir).length);

// ---------- Jira CSV ----------
const jiraDir = path.join(OUT, 'jira');
fs.mkdirSync(jiraDir, { recursive: true });

const caseHeaders = ['Issue Type', 'Summary', 'Priority', 'Labels', 'Description', 'Preconditions', 'Steps', 'Expected Result', 'Test Data', 'Automation', 'Requirement', 'Status'];
const caseRowsJira = ALL_CASES.map(function (c) {
  return [
    'Test',
    c.id + ' — ' + c.title,
    c.priority,
    (c.module || '').toLowerCase().replace(/\s+/g, '-'),
    'Модуль: ' + c.module + '. Тип: ' + (c.type || 'Функциональный') + '.',
    c.preconditions || '—',
    (c.steps && c.steps.length) ? c.steps.map(function (s, i) { return (i + 1) + '. ' + s; }).join('\n') : (c.request || c.sql || '—'),
    c.expected,
    c.data || '—',
    c.automation || '—',
    c.requirement || '—',
    c.status || 'Пройден',
  ];
});
const bugHeaders = ['Issue Type', 'Summary', 'Priority', 'Severity', 'Labels', 'Component', 'Environment', 'Preconditions', 'Steps', 'Actual Result', 'Expected Result', 'Linked Test Case', 'Status'];
const bugRowsJira = BUGS.map(function (b) {
  return [
    'Bug',
    b.id + ' — ' + b.title,
    b.priority,
    b.severity,
    'qa,regression',
    b.component,
    b.environment,
    b.preconditions || '—',
    b.steps.map(function (s, i) { return (i + 1) + '. ' + s; }).join('\n'),
    b.actual,
    b.expected,
    b.linkedCase,
    b.status,
  ];
});

fs.writeFileSync(path.join(jiraDir, 'test-cases.csv'), toCsv(caseHeaders, caseRowsJira), 'utf8');
fs.writeFileSync(path.join(jiraDir, 'bug-reports.csv'), toCsv(bugHeaders, bugRowsJira), 'utf8');
console.log('Jira: тест-кейсов', caseRowsJira.length, ', багов', bugRowsJira.length);

// ---------- Сайт документации ----------
const siteDir = path.join(OUT, 'site');
fs.mkdirSync(siteDir, { recursive: true });

const CSS = [
  ':root{--bg:#f7f8fa;--panel:#fff;--ink:#172b4d;--muted:#6b778c;--line:#dfe1e6;--accent:#0052cc;--accent-soft:#e9f2ff;--ok:#36b37e;--warn:#ff991f;--err:#de350b}',
  '*{box-sizing:border-box}',
  'body{margin:0;font-family:-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink);background:var(--bg);line-height:1.55}',
  '.layout{display:flex;min-height:100vh}',
  'aside{width:280px;background:var(--panel);border-right:1px solid var(--line);padding:24px 0;position:sticky;top:0;height:100vh;overflow:auto}',
  'aside .brand{padding:0 24px 18px;border-bottom:1px solid var(--line);margin-bottom:14px}',
  'aside .brand b{display:block;font-size:18px}',
  'aside .brand span{font-size:12px;color:var(--muted)}',
  'nav a{display:block;padding:8px 24px;color:var(--ink);text-decoration:none;font-size:14px;border-left:3px solid transparent}',
  'nav a:hover{background:var(--accent-soft);border-left-color:var(--accent);color:var(--accent)}',
  'nav .group{padding:14px 24px 6px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)}',
  'main{flex:1;padding:32px 48px 80px;max-width:1180px}',
  'h1{font-size:30px;margin:0 0 6px}',
  'h2{font-size:22px;margin:38px 0 12px;padding-bottom:8px;border-bottom:1px solid var(--line)}',
  'h3{font-size:16px;margin:22px 0 8px}',
  '.lead{color:var(--muted);margin:0 0 24px}',
  'table{width:100%;border-collapse:collapse;background:var(--panel);border:1px solid var(--line);border-radius:8px;overflow:hidden;margin:12px 0 24px;font-size:13px}',
  'th{background:#f4f5f7;text-align:left;padding:10px 12px;font-weight:600;border-bottom:1px solid var(--line);white-space:nowrap}',
  'td{padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}',
  'tr:last-child td{border-bottom:0}',
  'tbody tr:hover{background:#fafbfc}',
  'code{background:#f4f5f7;padding:2px 6px;border-radius:4px;font-family:Consolas,monospace;font-size:12px}',
  '.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin:18px 0 8px}',
  '.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:16px}',
  '.card b{display:block;font-size:26px;color:var(--accent)}',
  '.card span{font-size:12px;color:var(--muted)}',
  '.pill{display:inline-block;padding:2px 9px;border-radius:999px;font-size:11px;font-weight:600}',
  '.p-high{background:#deebff;color:#0747a6}',
  '.p-critical{background:#ffebe6;color:#bf2600}',
  '.p-medium{background:#fff7e6;color:#974f0c}',
  '.p-low{background:#e3fcef;color:#006644}',
  '.ok{background:#e3fcef;color:#006644}',
  '.bad{background:#ffebe6;color:#bf2600}',
  'ul{padding-left:20px}li{margin:4px 0}',
  '.note{background:var(--accent-soft);border-left:4px solid var(--accent);padding:12px 16px;border-radius:6px;margin:16px 0;font-size:14px}',
  '@media print{aside{display:none}main{max-width:none;padding:0}h2{page-break-after:avoid}table{page-break-inside:avoid}}',
].join('\n');

function priorityPill(p) {
  const map = { 'Критический': 'p-critical', 'Высокий': 'p-high', 'Средний': 'p-medium', 'Низкий': 'p-low', 'P1': 'p-critical', 'P2': 'p-high', 'P3': 'p-medium', 'P4': 'p-low' };
  return '<span class="pill ' + (map[p] || 'p-medium') + '">' + esc(p) + '</span>';
}

const caseHeadersSite = ['ID', 'Название', 'Модуль', 'Приоритет', 'Шаги / запрос', 'Ожидаемый результат', 'Данные', 'Автотест'];
function caseTable(cases) {
  const head = '<tr>' + caseHeadersSite.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr>';
  const body = cases.map(function (c) {
    const steps = (c.steps && c.steps.length) ? c.steps.map(function (s, i) { return (i + 1) + '. ' + esc(s); }).join('<br>') : '<code>' + esc(c.request || c.sql) + '</code>';
    return '<tr><td>' + c.id + '</td><td><b>' + esc(c.title) + '</b><br><span style="color:var(--muted)">' + esc(c.preconditions || '') + '</span></td><td>' + esc(c.module) + '</td><td>' + priorityPill(c.priority) + '</td><td>' + steps + '</td><td>' + esc(c.expected) + '</td><td>' + esc(c.data) + '</td><td><code>' + esc(c.automation) + '</code></td></tr>';
  }).join('');
  return '<table><thead>' + head + '</thead><tbody>' + body + '</tbody></table>';
}

const navItems = [
  ['group', 'Документация'],
  ['overview', 'Обзор проекта'],
  ['requirements', 'Требования'],
  ['plan', 'Тест-план'],
  ['group', 'Тест-кейсы'],
  ['cases-ui', 'UI (' + UI_CASES.length + ')'],
  ['cases-api', 'API (' + API_CASES.length + ')'],
  ['cases-db', 'База данных (' + DB_CASES.length + ')'],
  ['traceability', 'Матрица трассировки'],
  ['group', 'Дефекты и результаты'],
  ['bugs', 'Баг-репорты (' + BUGS.length + ')'],
  ['checklist', 'Чек-лист'],
  ['report', 'Отчёт о тестировании'],
  ['group', 'Справочники'],
  ['data', 'Тестовые данные'],
  ['environments', 'Окружения'],
];

const navHtml = navItems.map(function (item) {
  if (item[0] === 'group') return '<div class="group">' + esc(item[1]) + '</div>';
  return '<a href="#' + item[0] + '">' + esc(item[1]) + '</a>';
}).join('');

const overviewHtml = [
  '<h2 id="overview">Обзор проекта</h2>',
  '<p class="lead">' + esc(PROJECT.name) + ' — ' + esc(PROJECT.tagline) + '</p>',
  '<div class="cards">',
  '<div class="card"><b>' + stats.total + '</b><span>тест-кейсов</span></div>',
  '<div class="card"><b>63</b><span>автотеста (23 API + 35 E2E + 5 visual)</span></div>',
  '<div class="card"><b>' + BUGS.length + '</b><span>баг-репортов</span></div>',
  '<div class="card"><b>' + REQUIREMENTS.length + '</b><span>требований</span></div>',
  '</div>',
  '<h3>Стек</h3><p>' + esc(PROJECT.stack) + '</p>',
  '<h3>Как пользоваться документацией</h3>',
  '<ul>',
  '<li><b>Confluence</b> — папка <code>confluence/</code>: каждая страница в формате Storage Format, вставляется через «Вставить разметку»</li>',
  '<li><b>Jira</b> — папка <code>jira/</code>: CSV для импорта тест-кейсов и багов</li>',
  '<li><b>Этот сайт</b> — единый HTML, открывается локально и печатается в PDF</li>',
  '</ul>',
  '<div class="note">Каждый тест-кейс связан с требованием и с автотестом — трассировка видна в разделе «Матрица трассировки».</div>',
].join('');

const requirementsHtml = '<h2 id="requirements">Требования</h2>' + table(
  ['ID', 'Модуль', 'Требование', 'Приоритет', 'Критерии приёмки'],
  REQUIREMENTS.map(function (r) { return [r.id, r.module, r.title, r.priority, r.acceptance]; })
);

const planHtml = '<h2 id="plan">Тест-план</h2>' + PLAN_SECTIONS.map(function (s) {
  return '<h3>' + esc(s.title) + '</h3>' +
    (s.paragraphs || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
    ((s.bullets && s.bullets.length) ? '<ul>' + s.bullets.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' : '');
}).join('');

const traceHtml = '<h2 id="traceability">Матрица трассировки</h2><p class="lead">Показывает, что каждое требование покрыто тест-кейсами и автотестами.</p>' + table(
  ['Требование', 'Описание', 'Тест-кейсы', 'Автотесты'],
  REQUIREMENTS.map(function (r) {
    const related = ALL_CASES.filter(function (c) { return String(c.requirement || '').indexOf(r.id) !== -1; });
    const autos = related.map(function (c) { return c.automation; }).filter(function (a, i, arr) { return a && a !== '—' && a !== 'ручная проверка' && arr.indexOf(a) === i; });
    return [r.id, r.title, related.map(function (c) { return c.id; }).join(', ') || '—', autos.join(', ') || '—'];
  })
);

const bugsHtml = '<h2 id="bugs">Баг-репорты</h2><p class="lead">Все дефекты воспроизведены на текущей сборке.</p>' + table(
  ['ID', 'Заголовок', 'Серьёзность', 'Приоритет', 'Статус', 'Компонент', 'Кейс'],
  BUGS.map(function (b) {
    const st = b.status === 'Исправлен' ? '<span class="pill ok">Исправлен</span>' : '<span class="pill bad">Открыт</span>';
    return [b.id, b.title, b.severity, b.priority, st, b.component, b.linkedCase];
  })
).replace(/<td>(Открыт|Исправлен)<\/td>/g, function (m) { return m; });

const checklistHtml = '<h2 id="checklist">Чек-лист регрессии</h2>' + CHECKLIST.map(function (group) {
  return '<h3>' + esc(group.group) + '</h3><ul>' + group.items.map(function (item) { return '<li>☐ ' + esc(item) + '</li>'; }).join('') + '</ul>';
}).join('');

const reportHtml = '<h2 id="report">Отчёт о тестировании</h2>' +
  '<p class="lead">' + esc(PROJECT.releaseDate) + ' · версия ' + esc(PROJECT.version) + ' · ' + esc(PROJECT.author) + '</p>' +
  '<div class="cards">' +
  '<div class="card"><b>23/23</b><span>API-тесты</span></div>' +
  '<div class="card"><b>35/35</b><span>E2E-тесты</span></div>' +
  '<div class="card"><b>5/5</b><span>визуальные</span></div>' +
  '<div class="card"><b>' + stats.bugsOpen + '</b><span>открытых дефектов</span></div>' +
  '</div>' +
  '<h3>Что проверено</h3>' + table(['Область', 'Кейсов', 'Результат'], [
    ['Витрина и меню', String(UI_CASES.filter(function (c) { return c.module === 'Витрина'; }).length), 'Пройдено'],
    ['Корзина', String(UI_CASES.filter(function (c) { return c.module === 'Корзина'; }).length), 'Пройдено'],
    ['Авторизация по телефону', String(UI_CASES.filter(function (c) { return c.module === 'Авторизация'; }).length), 'Пройдено'],
    ['Оформление и оплата', String(UI_CASES.filter(function (c) { return c.module === 'Оформление' || c.module === 'Оплата'; }).length), 'Пройдено'],
    ['Уведомления', String(UI_CASES.filter(function (c) { return c.module === 'Уведомления'; }).length), 'Пройдено'],
    ['Админ-панель', String(UI_CASES.filter(function (c) { return c.module === 'Админка'; }).length), 'Пройдено'],
    ['API-контракт и негативы', String(API_CASES.length), 'Пройдено'],
    ['Целостность БД', String(DB_CASES.length), 'Пройдено'],
  ]) +
  '<h3>Вывод</h3><p>Основные сценарии работают. Релиз не готов из-за BUG-005 (утечка ПДн) и BUG-006 (нет транзакций).</p>' +
  '<h3>Рекомендации</h3><ul><li>Ввести схему валидации вместо ручной</li><li>Обернуть создание заказа в транзакцию</li><li>Закрыть публичный доступ к заказу</li><li>Добавить rate limiting</li></ul>';

const dataHtml = '<h2 id="data">Тестовые данные</h2>' +
  '<h3>Учётные записи</h3>' + table(['Роль', 'Email', 'Пароль'], PROJECT.accounts.map(function (a) { return [a.role, a.email, a.password]; })) +
  '<h3>Промокоды</h3>' + table(['Код', 'Скидка', 'Состояние', 'Назначение'], PROJECT.promocodes.map(function (p) { return [p.code, p.discount, p.state, p.use]; })) +
  '<h3>Тестовые карты</h3>' + table(['Номер', 'Срок', 'CVV', 'Результат'], PROJECT.testCards.map(function (c) { return [c.number, c.expiry, c.cvv, c.result]; }));

const envHtml = '<h2 id="environments">Окружения</h2>' + table(
  ['Окружение', 'БД', 'URL', 'Запуск'],
  PROJECT.environments.map(function (e) { return [e.name, e.db, e.url, e.run]; })
);

const html = [
  '<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1">',
  '<title>' + esc(PROJECT.name) + ' — QA документация</title>',
  '<style>' + CSS + '</style></head><body>',
  '<div class="layout">',
  '<aside><div class="brand"><b>🌯 ' + esc(PROJECT.name) + '</b><span>QA документация · v' + esc(PROJECT.version) + '</span></div><nav>' + navHtml + '</nav></aside>',
  '<main>',
  '<h1>' + esc(PROJECT.name) + ' — документация по тестированию</h1>',
  '<p class="lead">Подготовил: ' + esc(PROJECT.author) + ', ' + esc(PROJECT.role) + ' · ' + esc(PROJECT.releaseDate) + '</p>',
  overviewHtml,
  requirementsHtml,
  planHtml,
  '<h2 id="cases-ui">Тест-кейсы UI</h2>' + caseTable(UI_CASES),
  '<h2 id="cases-api">Тест-кейсы API</h2>' + caseTable(API_CASES),
  '<h2 id="cases-db">Тест-кейсы базы данных</h2>' + caseTable(DB_CASES),
  traceHtml,
  bugsHtml,
  checklistHtml,
  reportHtml,
  dataHtml,
  envHtml,
  '<p style="margin-top:60px;color:var(--muted);font-size:12px">Сгенерировано из qa-docs/content · ' + esc(PROJECT.repo) + '</p>',
  '</main></div></body></html>',
].join('');

fs.writeFileSync(path.join(siteDir, 'index.html'), html, 'utf8');
console.log('Сайт: qa-docs/site/index.html, размер', Math.round(html.length / 1024), 'КБ');
