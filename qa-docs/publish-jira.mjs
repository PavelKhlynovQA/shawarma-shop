// Готовит выражение для создания задач в Jira через REST API v2 из контекста браузера.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { UI_CASES } from './content/cases-ui.mjs';
import { API_CASES, DB_CASES } from './content/cases-api.mjs';
import { BUGS } from './content/bugs.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));

const TASK_TYPE = '10003';
const EPIC_TYPE = '10001';
const PROJECT = 'SCRUM';

function caseDescription(c) {
  const lines = [];
  lines.push('Модуль: ' + c.module + ' | Тип: ' + (c.type || 'Функциональный') + ' | Приоритет: ' + c.priority);
  lines.push('');
  if (c.preconditions) lines.push('Предусловия: ' + c.preconditions);
  if (c.steps && c.steps.length) {
    lines.push('Шаги:');
    c.steps.forEach(function (s, i) { lines.push('  ' + (i + 1) + '. ' + s); });
  } else {
    lines.push('Запрос: ' + (c.request || c.sql));
  }
  lines.push('');
  lines.push('Ожидаемый результат: ' + c.expected);
  if (c.data && c.data !== '—') lines.push('Тестовые данные: ' + c.data);
  lines.push('Автотест: ' + c.automation);
  if (c.requirement) lines.push('Требование: ' + c.requirement);
  return lines.join('\n');
}

function bugDescription(b) {
  return [
    'Серьёзность: ' + b.severity + ' | Приоритет: ' + b.priority + ' | Компонент: ' + b.component,
    'Окружение: ' + b.environment,
    '',
    'Предусловия: ' + (b.preconditions || '—'),
    'Шаги:',
  ].concat(b.steps.map(function (s, i) { return '  ' + (i + 1) + '. ' + s; })).concat([
    '',
    'Фактический результат: ' + b.actual,
    'Ожидаемый результат: ' + b.expected,
    'Связанный тест-кейс: ' + b.linkedCase,
  ]).join('\n');
}

const items = [];

items.push({ summary: 'QA: Шаурма-Мастер — документация и тестирование v1.0', description: 'Эпик объединяет тест-кейсы и дефекты проекта «Шаурма-Мастер».\nАртефакты: Confluence QASHOP, автотесты в GitHub.', labels: ['qa', 'epic'], type: EPIC_TYPE });

[].concat(UI_CASES, API_CASES, DB_CASES).forEach(function (c) {
  items.push({
    summary: c.id + ' — ' + c.title,
    description: caseDescription(c),
    labels: ['qa', 'test-case', c.module.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-')],
    type: TASK_TYPE,
  });
});

BUGS.forEach(function (b) {
  items.push({
    summary: '[BUG] ' + b.id + ' — ' + b.title,
    description: bugDescription(b),
    labels: ['qa', 'bug', b.severity.toLowerCase()],
    type: TASK_TYPE,
  });
});

const script = '(async () => {' +
  'const ITEMS = ' + JSON.stringify(items) + ';' +
  'const PROJECT = "' + PROJECT + '";' +
  'const H = {"Content-Type":"application/json","Accept":"application/json","X-Atlassian-Token":"no-check"};' +
  'let ok = 0, fail = 0; const errors = [];' +
  'for (const item of ITEMS) {' +
  '  try {' +
  '    const res = await fetch("/rest/api/2/issue", {method:"POST", headers:H, body: JSON.stringify({fields:{project:{key:PROJECT}, summary:item.summary.slice(0,250), description:item.description, issuetype:{id:item.type}, labels:item.labels}})});' +
  '    if (res.status === 201) { ok++; } else { fail++; errors.push(item.summary.slice(0,40) + " -> " + res.status + " " + (await res.text()).slice(0,100)); }' +
  '  } catch (e) { fail++; errors.push(item.summary.slice(0,40) + " -> " + e.message); }' +
  '}' +
  'return JSON.stringify({created: ok, failed: fail, errors: errors.slice(0,5)});' +
'})()';

fs.writeFileSync(path.join(DIR, '..', '.tmp', 'expr-jira-bulk.js'), script, 'utf8');
console.log('задач к созданию:', items.length, ', размер:', Math.round(script.length / 1024), 'КБ');
