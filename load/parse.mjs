import fs from 'node:fs';

const rawLines = fs.readFileSync('load/results.jtl', 'utf8').split('\n').filter(Boolean);
const header = rawLines[0].split(',');
// JMeter писал в один файл дважды (listener + -l) — убираем дубли
const seen = new Set();
const lines = [rawLines[0]].concat(rawLines.slice(1).filter(function (l) {
  if (seen.has(l)) return false;
  seen.add(l);
  return true;
}));
console.log('строк в файле:', rawLines.length, '| уникальных:', lines.length);
const idx = {
  ts: header.indexOf('timeStamp'),
  elapsed: header.indexOf('elapsed'),
  label: header.indexOf('label'),
  code: header.indexOf('responseCode'),
  success: header.indexOf('success'),
};

const rows = lines.slice(1).map(function (l) {
  const p = l.split(',');
  return {
    ts: Number(p[idx.ts]),
    elapsed: Number(p[idx.elapsed]),
    label: p[idx.label],
    code: p[idx.code],
    success: p[idx.success] === 'true',
  };
});

function pct(arr, p) {
  if (!arr.length) return 0;
  const sorted = arr.slice().sort(function (a, b) { return a - b; });
  const pos = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[pos];
}

function stats(list) {
  const el = list.map(function (r) { return r.elapsed; });
  const errors = list.filter(function (r) { return !r.success; }).length;
  return {
    count: list.length,
    avg: Math.round(el.reduce(function (a, b) { return a + b; }, 0) / Math.max(1, el.length)),
    min: el.reduce(function (a, b) { return Math.min(a, b); }, Infinity),
    max: el.reduce(function (a, b) { return Math.max(a, b); }, 0),
    p50: pct(el, 50),
    p90: pct(el, 90),
    p95: pct(el, 95),
    p99: pct(el, 99),
    errors: errors,
    errorRate: el.length ? +(100 * errors / el.length).toFixed(3) : 0,
  };
}

const byLabel = {};
rows.forEach(function (r) { (byLabel[r.label] = byLabel[r.label] || []).push(r); });

const overall = stats(rows);
const first = rows.reduce(function (a, r) { return Math.min(a, r.ts); }, Infinity);
const last = rows.reduce(function (a, r) { return Math.max(a, r.ts + r.elapsed); }, 0);
const durationSec = (last - first) / 1000;

const buckets = {};
rows.forEach(function (r) {
  const sec = Math.floor((r.ts - first) / 1000);
  buckets[sec] = (buckets[sec] || 0) + 1;
});
const rpsSeries = [];
const maxSec = Object.keys(buckets).reduce(function (a, k) { return Math.max(a, Number(k)); }, 0);
for (let s = 0; s <= maxSec; s++) rpsSeries.push(buckets[s] || 0);

const result = {
  startedAt: new Date(first).toISOString(),
  durationSec: Math.round(durationSec),
  totalRequests: rows.length,
  throughput: +(rows.length / durationSec).toFixed(1),
  overall: overall,
  byLabel: Object.keys(byLabel).map(function (k) { return Object.assign({ label: k }, stats(byLabel[k])); }),
  rpsSeries: rpsSeries,
};

fs.mkdirSync('load', { recursive: true });
fs.writeFileSync('load/metrics.json', JSON.stringify(result, null, 2), 'utf8');

console.log('длительность:', result.durationSec, 'с | запросов:', result.totalRequests, '| RPS:', result.throughput);
console.log('общие: avg', overall.avg, 'p95', overall.p95, 'p99', overall.p99, 'ошибок', overall.errors);
console.log('--- по эндпоинтам ---');
result.byLabel.forEach(function (s) {
  console.log(s.label.padEnd(24), 'n=' + String(s.count).padStart(6), 'avg=' + String(s.avg).padStart(4) + 'ms', 'p95=' + String(s.p95).padStart(4) + 'ms', 'max=' + String(s.max).padStart(5) + 'ms', 'err=' + s.errors);
});
