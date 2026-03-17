# Twitter/X Niche Analyzer MVP Scaffold

Начальный каркас веб-приложения для анализа перспективных ниш в Twitter/X без официального API.  
Текущая версия намеренно использует mock-данные, чтобы быстро запустить архитектуру и дальше наращивать scraping, scoring и reporting шаг за шагом.

## Что уже есть

- `frontend` на React + Vite + TypeScript
- `backend` на Fastify + TypeScript
- `shared` с общими типами, mock seeds, scoring stub и placeholder selectors
- mock flow: UI отправляет запрос в backend, backend возвращает топ ниш и influencer accounts
- bootstrap-слой Playwright + Chromium на backend
- безопасный smoke-test route для проверки browser launch без Twitter/X scraping
- централизованная точка для будущих X/Twitter selectors
- централизованная точка для будущей логики оценки ниш

## Структура

```text
.
├── backend
│   ├── .env.example
│   ├── package.json
│   ├── src
│   │   ├── app.ts
│   │   ├── config
│   │   │   └── browserConfig.ts
│   │   ├── index.ts
│   │   ├── routes
│   │   │   ├── analysis.ts
│   │   │   ├── browser.ts
│   │   │   ├── health.ts
│   │   │   └── index.ts
│   │   └── services
│   │       ├── browserBootstrapService.ts
│   │       └── mockAnalysisService.ts
├── frontend
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── src
│   │   ├── api
│   │   │   └── client.ts
│   │   ├── components
│   │   │   └── NicheCard.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── styles.css
│   │   └── vite-env.d.ts
│   ├── tsconfig.json
│   └── vite.config.ts
├── shared
│   ├── package.json
│   ├── src
│   │   ├── config
│   │   │   └── appConfig.ts
│   │   ├── scoring
│   │   │   └── nicheScoring.ts
│   │   ├── seeds
│   │   │   └── mockNiches.ts
│   │   ├── selectors
│   │   │   └── xSelectors.ts
│   │   ├── types
│   │   │   └── analysis.ts
│   │   └── index.ts
│   └── tsconfig.json
├── AGENTS.md
├── package.json
└── tsconfig.base.json
```

## Как запустить

1. Установить зависимости:

```bash
npm install
```

2. Установить Chromium для Playwright:

```bash
npm run browsers:install
```

3. Запустить frontend, backend и shared watcher:

```bash
npm run dev
```

4. Открыть UI:

```text
http://localhost:5173
```

5. Backend API:

```text
http://localhost:3001/api/health
http://localhost:3001/api/analysis
http://localhost:3001/api/browser/smoke-test
```

## Доступные команды

```bash
npm run dev
npm run browsers:install
npm run build
npm run typecheck
```

## Переменные окружения

`frontend/.env.example`

```bash
VITE_API_URL=http://localhost:3001
```

`backend/.env.example`

```bash
PORT=3001
FRONTEND_ORIGIN=http://localhost:5173
BROWSER_HEADLESS=true
BROWSER_LAUNCH_TIMEOUT_MS=30000
BROWSER_ACTION_TIMEOUT_MS=15000
BROWSER_NAVIGATION_TIMEOUT_MS=30000
BROWSER_LOCALE=ru-RU
BROWSER_SMOKE_TEST_URL=https://example.com
BROWSER_SMOKE_TEST_SELECTOR=h1
BROWSER_SMOKE_TEST_EXPECTED_TITLE=Example Domain
BROWSER_SMOKE_TEST_EXPECTED_TEXT=Example Domain
```

Все значения имеют безопасные значения по умолчанию, поэтому проект можно поднять и без `.env`.

## Как проверить Playwright bootstrap

1. Установить зависимости:

```bash
npm install
```

2. Установить Chromium:

```bash
npm run browsers:install
```

3. Запустить backend:

```bash
npm run dev:backend
```

4. В отдельном терминале вызвать smoke-test route:

```bash
curl http://localhost:3001/api/browser/smoke-test
```

Ожидаемый результат:
- backend успешно запускает Chromium через Playwright
- открывает безопасную публичную страницу
- возвращает `pageTitle`, `httpStatus`, `finalUrl` и `probeText`
- не выполняет scraping Twitter/X

## Что строить следующим

1. Добавить X login/session bootstrap поверх текущего browser layer.
2. Вынести scraping pipeline по шагам: search, account scan, post scan, aggregation.
3. Заполнить реальные селекторы и добавить стратегию fallback при изменениях DOM.
4. Заменить mock scoring на реальный multi-signal niche scoring.
5. Добавить сохранение запусков анализа и экспорт отчёта по топ-10 нишам.
