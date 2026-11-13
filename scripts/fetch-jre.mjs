// Скачивает портативный JRE (Temurin 21) для генерации Allure-отчёта.
import fs from 'node:fs';
import path from 'node:path';

const url = 'https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jre/hotspot/normal/eclipse';
const outDir = path.join('tools');
fs.mkdirSync(outDir, { recursive: true });
const target = path.join(outDir, 'jre.zip');

console.log('Скачивание JRE...');
const response = await fetch(url, { redirect: 'follow' });
if (!response.ok) {
  console.log('ОШИБКА HTTP', response.status);
  process.exit(1);
}
const buffer = Buffer.from(await response.arrayBuffer());
fs.writeFileSync(target, buffer);
console.log('Скачано:', (buffer.length / 1024 / 1024).toFixed(1), 'МБ ->', target);
