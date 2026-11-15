// Собирает описание в формате ADF: обычный текст + блоки кода для JSON.
import { buildDescription } from './case-format.mjs';

function countChars(s, ch) {
  let n = 0;
  for (const c of s) if (c === ch) n++;
  return n;
}

export function buildAdf(c) {
  const text = buildDescription(c);
  const lines = text.split('\n');
  const content = [];
  let buffer = [];
  let code = [];
  let inCode = false;
  let depth = 0;

  function flushText() {
    if (!buffer.length) return;
    content.push({ type: 'paragraph', content: [{ type: 'text', text: buffer.join('\n') }] });
    buffer = [];
  }
  function flushCode() {
    if (!code.length) return;
    content.push({ type: 'codeBlock', attrs: { language: 'json' }, content: [{ type: 'text', text: code.join('\n') }] });
    code = [];
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (!inCode && (trimmed.endsWith('{') || trimmed.endsWith('['))) {
      flushText();
      inCode = true;
      depth = 0;
    }

    if (inCode) {
      code.push(line);
      depth += countChars(trimmed, '{') + countChars(trimmed, '[');
      depth -= countChars(trimmed, '}') + countChars(trimmed, ']');
      if (depth <= 0 && code.length > 1) {
        flushCode();
        inCode = false;
      }
      continue;
    }

    buffer.push(line);
  }

  flushCode();
  flushText();

  return { type: 'doc', version: 1, content: content };
}
