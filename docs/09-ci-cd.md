# CI/CD на GitHub Actions

## Что настроено

Файл `.github/workflows/ci.yml` запускается на каждый push в `main` и на pull request.

| Job | Что делает | Время |
|---|---|---|
| `api-tests` | `npm test` — 24 API-теста на `node:test` | ~20 c |
| `e2e-tests` | Устанавливает Chromium и гоняет 30 Playwright-тестов | ~3 мин |
| `docker-build` | Собирает образ и проверяет, что контейнер отвечает на `/api/health` | ~2 мин |

## Артефакты

- `playwright-report` — HTML-отчёт со шагами и скриншотами (хранится 7 дней)
- `playwright-traces` — трейсы упавших тестов

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
