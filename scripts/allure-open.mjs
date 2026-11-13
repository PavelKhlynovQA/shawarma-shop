// Раздаёт готовый Allure-отчёт локально на http://localhost:5050
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('allure-report');
const indexFile = path.join(root, 'index.html');

if (!fs.existsSync(indexFile)) {
  console.error('Отчёт не найден. Сначала выполни: npm run allure:generate');
  process.exit(1);
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

http
  .createServer(function (req, res) {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    let file = path.join(root, urlPath === '/' ? 'index.html' : urlPath);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = indexFile;
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(5050, function () {
    console.log('Allure отчёт: http://localhost:5050');
    console.log('Остановить: Ctrl+C');
  });
