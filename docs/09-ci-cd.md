# CI/CD на GitHub Actions

## Что настроено

Файл `.github/workflows/ci.yml` запускается на каждый push в `main` и на pull request.

| Job | Что делает | Время |
|---|---|---|
| `api-tests` | `npm test` — 24 API-теста на `node:test` | ~20 c |
| `e2e-tests` | 30 Playwright-тестов + генерация Allure | ~3 мин |
| `visual-tests` | 5 визуальных тестов на windows-latest | ~2 мин |
| `docker-build` | Собирает образ и проверяет, что контейнер отвечает на `/api/health` | ~2 мин |

## Артефакты

- `playwright-report` — HTML-отчёт с шагами и скриншотами (7 дней)
- `allure-report` — Allure-отчёт после генерации (7 дней)
- `playwright-traces` — трейсы упавших тестов
- `visual-diff` — диффы визуальных тестов

## Особенность визуальных тестов

Эталонные скриншоты привязаны к платформе (`*-win32.png` / `*-linux.png`), поэтому job `visual-tests` запускается на `windows-latest` и помечен `continue-on-error: true`. Если гоняете на Linux — сгенерируйте эталоны на нём и закоммитьте `*-linux.png`, после чего флаг можно снять.

## Как подключить репозиторий

```bash
cd shawarma-shop
git remote add origin https://github.com/<ваш-логин>/shawarma-shop.git
git push -u origin main
```

Дальше в GitHub: **Settings → Actions → General** — убедиться, что workflows разрешены.

## Бейджи в README

После первого прогона замени `<ваш-логин>` в README:

```markdown
![CI](https://github.com/<ваш-логин>/shawarma-shop/actions/workflows/ci.yml/badge.svg)
```

## Локальная проверка «как в CI»

```bash
npm ci
npm test
npx playwright test
docker build -t shawarma-shop:ci .
```

## Что можно добавить дальше

- Кэширование `~/.cache/ms-playwright` (ускоряет e2e на ~1 мин)
- Публикация образа в GHCR на тег `v*`
- Матрица версий Node (20, 22, 24)
- Прогон тестов на каждом PR с комментарием отчёта
- Линтер (ESLint + Prettier) отдельным job
