// ADF-описание тест-кейса v2: поля, предусловия, таблица шагов, сетевые проверки отдельным блоком.

function text(t) { return { type: 'text', text: t }; }
function para(t) { return { type: 'paragraph', content: t ? [text(t)] : [] }; }
function heading(t) { return { type: 'heading', attrs: { level: 3 }, content: [text(t)] }; }
function code(textValue) { return { type: 'codeBlock', attrs: { language: 'text' }, content: [text(textValue)] }; }

function cellFromText(value) {
  const lines = String(value).split('\n');
  return {
    type: 'tableCell',
    attrs: {},
    content: (lines.length ? lines : ['']).map(function (l) { return para(l); }),
  };
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
    content: c.preconditions.map(function (p) { return { type: 'listItem', content: [para(p)] }; }),
  });

  content.push(heading('Тестовые данные'));
  content.push(para(c.data));

  content.push(heading('Шаги выполнения'));

  const rows = [];
  rows.push({
    type: 'tableRow',
    content: [
      { type: 'tableHeader', attrs: {}, content: [para('№')] },
      { type: 'tableHeader', attrs: {}, content: [para('Действие')] },
      { type: 'tableHeader', attrs: {}, content: [para('Тестовые данные')] },
      { type: 'tableHeader', attrs: {}, content: [para('Ожидаемый результат')] },
    ],
  });

  const nets = [];

  c.steps.forEach(function (s, i) {
    let expected = s.expected;
    const idx = expected.indexOf('Network:');
    if (idx !== -1) {
      const uiPart = expected.slice(0, idx).replace(/[\s.;]+$/, '').trim();
      const netPart = expected.slice(idx).replace(/^Network:\s*/, '');
      expected = uiPart + '\n\nСетевые проверки: блок ниже, шаг ' + (i + 1);
      nets.push({ step: i + 1, lines: netPart.split(/;\s+/).filter(Boolean) });
    }
    rows.push({
      type: 'tableRow',
      content: [
        { type: 'tableCell', attrs: {}, content: [para(String(i + 1))] },
        cellFromText(s.action),
        cellFromText(s.data || '—'),
        cellFromText(expected),
      ],
    });
  });

  content.push({ type: 'table', attrs: { isNumberColumnEnabled: false, layout: 'full-width' }, content: rows });

  if (nets.length) {
    content.push(heading('Сетевые проверки'));
    nets.forEach(function (n) {
      content.push(para('Шаг ' + n.step));
      content.push(code(n.lines.join('\n')));
    });
  }

  content.push(heading('Постусловия'));
  content.push(para(c.postconditions || 'Нет'));

  content.push(para('Статус: Draft  |  Версия: 2.1  |  Автор: [ФИО]  |  Оценка: ' + (c.estimate || '5') + ' мин'));

  return { type: 'doc', version: 1, content: content };
}
