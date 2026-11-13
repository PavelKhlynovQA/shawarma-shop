// Генерация Allure-отчёта. Сам находит портативную JRE в tools/jre.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function findJavaHome() {
  if (process.env.JAVA_HOME && fs.existsSync(process.env.JAVA_HOME)) return process.env.JAVA_HOME;

  const jreDir = path.resolve('tools', 'jre');
  if (!fs.existsSync(jreDir)) return null;

  const exe = process.platform === 'win32' ? 'java.exe' : 'java';
  for (const entry of fs.readdirSync(jreDir)) {
    const candidate = path.join(jreDir, entry);
    if (fs.existsSync(path.join(candidate, 'bin', exe))) return candidate;
  }
  return null;
}

const javaHome = findJavaHome();
if (!javaHome) {
  console.error('JRE не найдена. Установи Java 17+ или положи портативную JRE в tools/jre.');
  process.exit(1);
}

if (!fs.existsSync('allure-results')) {
  console.error('Нет папки allure-results. Сначала прогони тесты: npm run test:e2e');
  process.exit(1);
}

const tmpDir = path.resolve('.tmp');
fs.mkdirSync(tmpDir, { recursive: true });

const allureBin = path.resolve(
  'node_modules/allure-commandline/dist/bin',
  process.platform === 'win32' ? 'allure.bat' : 'allure'
);

const result = spawnSync(allureBin, ['generate', 'allure-results', '-o', 'allure-report', '--clean'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: Object.assign({}, process.env, {
    JAVA_HOME: javaHome,
    PATH: path.join(javaHome, 'bin') + path.delimiter + process.env.PATH,
    JAVA_TOOL_OPTIONS: '-Djava.io.tmpdir=' + tmpDir,
  }),
});

if (result.status === 0) {
  console.log('\nОтчёт готов: allure-report/index.html');
  console.log('Открыть: npm run allure:open');
}
process.exit(result.status === null ? 1 : result.status);
