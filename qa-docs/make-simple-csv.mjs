// Упрощённый CSV: только поля, которые Jira просит обязательно.
import fs from 'node:fs';
import { UI_CASES } from './content/cases-ui.mjs';
import { API_CASES, DB_CASES } from './content/cases-api.mjs';
import { BUGS } from './content/bugs.mjs';

function q(v) {
  const t = String(v === undefined || v === null ? '' : v);
  return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
}

const rows = [['Issue Type', 'Summary', 'Priority', 'Labels', 'Description'].join(',')];

[].concat(UI_CASES, API_CASES, DB_CASES).forEach(function (c) {
  const desc = [
    'Модуль: ' + c.module,
    c.preconditions ? 'Предусловия: ' + c.preconditions : '',
    (c.steps && c.steps.length) ? 'Шаги: ' + c.steps.map(function (s, i) { return (i + 1) + '. ' + s; }).join(' ') : 'Запрос: ' + (c.request || c.sql || ''),
    'Ожидаемый результат: ' + c.expected,
    'Автотест: ' + c.automation,
    c.requirement ? 'Требование: ' + c.requirement : '',
  ].filter(Boolean).join('\n');

  rows.push(['Task', q(c.id + ' — ' + c.title), q(c.priority), q('qa,test-case'), q(desc)].join(','));
});

BUGS.forEach(function (b) {
  const desc = [
    'Серьёзность: ' + b.severity,
    'Шаги: ' + b.steps.map(function (s, i) { return (i + 1) + '. ' + s; }).join(' '),
    'Фактический результат: ' + b.actual,
    'Ожидаемый результат: ' + b.expected,
  ].join('\n');
  rows.push(['Bug', q('[BUG] ' + b.id + ' — ' + b.title), q(b.priority), q('qa,bug'), q(desc)].join(','));
});

fs.writeFileSync('qa-docs/jira/jira-import-simple.csv', '\uFEFF' + rows.join('\r\n'), 'utf8');
console.log('строк:', rows.length - 1);
