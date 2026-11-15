// ADF-описание тест-кейса v2: поля, предусловия списком, шаги таблицей.

function text(t) { return { type: 'text', text: t }; }
function para(t) { return { type: 'paragraph', content: t ? [text(t)] : [] }; }
function heading(t) { return { type: 'heading', attrs: { level: 3 }, content: [text(t)] }; }

function cell(content, header) {
  const type = header ? 'tableHeader' : 'tableCell';
  return { type: type, attrs: {}, content: content };
}

function cellFromText(value) {
  const lines = String(value).split('\n');
  const content = [];
  lines.forEach(function (line) {
    content.push(para(line));
  });
  return cell(content.length ? content : [para('')], false);
}

export function buildAdfV2(c) {
  const content = [];

  content.push(para('МОДУЛЬ: ' + c.module + '  |  ТИП: ' + c.type + '  |  ВИД: ' + c.kind));
  content.push(para('ПРИОРИТЕТ: ' + c.priority + '  |  МЕТКИ: ' + c.labels.join(', ')));
  content.push(para('СВЯЗИ: ' + c.linked));

  content.push(heading('Предусловия'));
  content.push({
    type: 'orderedList',
    attrs: { order: 1 },
    content: c.preconditions.map(function (p) {
      return { type: 'listItem', content: [para(p)] };
    }),
  });

  content.push(heading('Тестовые данные'));
  content.push(para(c.data));

  content.push(heading('Шаги выполнения'));
  const rows = [];
  rows.push({
    type: 'tableRow',
    content: [
      cell([para('№')], true),
      cell([para('Действие')], true),
      cell([para('Тестовые данные')], true),
      cell([para('Ожидаемый результат')], true),
    ],
  });
  c.steps.forEach(function (s, i) {
    rows.push({
      type: 'tableRow',
      content: [
        cell([para(String(i + 1))], false),
        cellFromText(s.action),
        cellFromText(s.data || '—'),
        cellFromText(s.expected),
      ],
    });
  });
  content.push({ type: 'table', attrs: { isNumberColumnEnabled: false, layout: 'full-width' }, content: rows });

  content.push(heading('Постусловия'));
  content.push(para(c.postconditions || 'Нет'));

  content.push(para('Статус: Draft  |  Версия: 2.0  |  Автор: [ФИО]  |  Оценка: ' + (c.estimate || '5') + ' мин'));

  return { type: 'doc', version: 1, content: content };
}
