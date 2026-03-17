# Twitter/X Niche Analyzer MVP Scaffold

Начальный каркас веб-приложения для анализа перспективных ниш в Twitter/X без официального API.  
Текущая версия намеренно использует mock-данные, чтобы быстро запустить архитектуру и дальше наращивать scraping, scoring и reporting шаг за шагом.

## Что уже есть

- `frontend` на React + Vite + TypeScript
- `backend` на Fastify + TypeScript
- `shared` с общими типами, mock seeds, scoring stub и placeholder selectors
- mock flow: UI отправляет запрос в backend, backend возвращает топ ниш и influencer accounts
- Playwright + Chromium foundation на backend
- X-specific bootstrap слой для безопасной навигации по публичным страницам X
- public X profile shell diagnostic слой для проверки каркаса публичного профиля
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
│   │   │   ├── browserConfig.ts
│   │   │   ├── xNavigationConfig.ts
│   │   │   └── xProfileShellConfig.ts
│   │   ├── index.ts
│   │   ├── routes
│   │   │   ├── analysis.ts
│   │   │   ├── health.ts
│   │   │   ├── index.ts
│   │   │   ├── xBootstrap.ts
│   │   │   └── xProfileShell.ts
│   │   └── services
│   │       ├── browserBootstrapService.ts
│   │       ├── mockAnalysisService.ts
│   │       ├── xBootstrapService.ts
│   │       └── xProfileShellService.ts
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
http://localhost:3001/api/browser/x-bootstrap-test
http://localhost:3001/api/browser/x-profile-shell-test
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
BROWSER_LOCALE=en-US
X_BOOTSTRAP_DEFAULT_URL=https://x.com/OpenAI
X_BOOTSTRAP_WAIT_STRATEGY=domcontentloaded
X_BOOTSTRAP_AFTER_LOAD_WAIT_MS=1500
X_PROFILE_SHELL_DEFAULT_HANDLE=OpenAI
X_PROFILE_SHELL_DEFAULT_URL=
X_PROFILE_SHELL_WAIT_STRATEGY=load
X_PROFILE_SHELL_MARKER_TIMEOUT_MS=3500
X_PROFILE_SHELL_RETRY_COUNT=2
X_PROFILE_SHELL_RETRY_DELAY_MS=1200
X_AUTH_SESSION_ENABLED=false
X_AUTH_STORAGE_STATE_PATH=
X_LOGIN_EMAIL=
X_LOGIN_USERNAME=
X_LOGIN_PASSWORD=
X_LOGIN_TWO_FACTOR_SECRET=
```

Все значения имеют безопасные значения по умолчанию, поэтому проект можно поднять и без `.env`.

`X_AUTH_*` и `X_LOGIN_*` пока служат только как заготовки под будущий auth/session bootstrap и не обязательны для текущего маршрута.

## Как проверить X bootstrap

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

4. Проверить дефолтный X bootstrap test:

```bash
curl "http://localhost:3001/api/browser/x-bootstrap-test"
```

5. Проверить конкретный публичный профиль и wait strategy:

```bash
curl -G "http://localhost:3001/api/browser/x-bootstrap-test" \
  --data-urlencode "targetUrl=https://x.com/OpenAI" \
  --data-urlencode "waitStrategy=domcontentloaded"
```

Что вернётся:
- `navigationSucceeded`
- `finalUrl`
- `pageTitle`
- `httpStatus`
- `markers` с базовыми page markers
- `timings`
- `error`, если навигация завершилась неуспешно

Ограничения текущего шага:
- маршрут открывает только публичные `https` URL доменов `x.com` и `twitter.com`
- реальное извлечение аккаунтов и постов ещё не реализовано
- login automation ещё не реализована

## Как проверить X profile shell

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

4. Проверить shell профиля по handle:

```bash
curl -G "http://localhost:3001/api/browser/x-profile-shell-test" \
  --data-urlencode "handle=OpenAI"
```

5. Проверить shell профиля по публичному URL:

```bash
curl -G "http://localhost:3001/api/browser/x-profile-shell-test" \
  --data-urlencode "targetUrl=https://x.com/OpenAI" \
  --data-urlencode "waitStrategy=load"
```

Что вернётся:
- `navigationSucceeded`
- `finalUrl`
- `pageTitle`
- `httpStatus`
- `detectedMarkers`
- `missingMarkers`
- `timings`
- `error`
- `notes`

Что именно валидируется:
- `profileHeaderShell`
- `profileIdentityShell`
- `profileTabsShell`
- `mainTimelineShellContainer`
- `tweetArticleShellVisible`

Ограничения текущего шага:
- маршрут принимает только `handle` публичного профиля или публичный profile-like URL
- маршрут не извлекает bio, follower count, post text или tweet metrics
- маршрут не извлекает твиты и не выполняет login automation

## Что строить следующим

1. Добавить изолированный public tweet shell bootstrap для одиночного tweet URL без extraction текста и метрик.
2. Затем перейти к безопасному profile field extraction только после стабилизации shell-маркеров.
3. После этого переходить к account extraction и post extraction отдельными шагами.
4. Потом заменять mock scoring на реальный multi-signal niche scoring.
5. И только затем добавлять сохранение запусков и финальный отчёт по топ-10 нишам.
