# Публикация проекта на GitHub

## 1. Создать репозиторий

Вариант А — через сайт: https://github.com/new → имя `shawarma-shop` → **без** README и .gitignore (они уже есть) → Create.

Вариант Б — через GitHub CLI:

```bash
winget install GitHub.cli
gh auth login
gh repo create shawarma-shop --public --source=. --remote=origin --push
```

## 2. Привязать remote и запушить

```bash
cd shawarma-shop
git remote add origin https://github.com/<логин>/shawarma-shop.git
git branch -M main
git push -u origin main
```

Если попросит пароль — используй **Personal Access Token** (Settings → Developer settings → Tokens), обычный пароль GitHub не подойдёт.

## 3. Проверить Actions

1. Открой вкладку **Actions** в репозитории
2. Должен идти workflow **CI** с тремя job'ами: `api-tests`, `e2e-tests`, `docker-build`
3. Первый прогон ~5 минут

## 4. Включить бейдж

В README замени `OWNER` в ссылке на свой логин:

```markdown
![CI](https://github.com/<логин>/shawarma-shop/actions/workflows/ci.yml/badge.svg)
```

## 5. Защита ветки (по желанию)

Settings → Branches → Add branch protection rule:
- Branch name pattern: `main`
- ✅ Require status checks to pass before merging
- Выбрать `api-tests` и `e2e-tests`

Теперь нельзя смержить PR с падающими тестами — это и есть настоящий CI-процесс.

## 6. Что показывать в резюме

Ссылку на репозиторий + вкладку Actions с зелёными прогонами. Для портфолио тестировщика это сильнее, чем список инструментов: видно, что ты умеешь настраивать проверки и находить баги.

Кстати, в этом проекте E2E-тесты нашли два дефекта, которые не видели API-тесты (BUG-009 и BUG-010) — это отличная история для собеседования.
