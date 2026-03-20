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
- public X profile field extraction слой для безопасного извлечения identity/header полей публичного профиля
- public X profile timeline URL discovery слой для безопасного поиска недавних tweet URL из публичной ленты профиля
- public X profile timeline classification слой для rule-based разделения timeline items на original/reply/repost/quote/uncertain
- public X account recent-posts aggregation слой для безопасного объединения profile fields, timeline URL discovery, classification enrichment и hydration недавних твитов
- isolated single-account scoring слой для вычисления first-pass account signals и account score на основе classification-aware recent-posts dataset
- manual multi-account comparison слой для раннего benchmarking нескольких публичных X-аккаунтов через existing scoring layer
- manual topic-bucket comparison слой для раннего benchmarking вручную заданных групп X-аккаунтов как первых topic/niche proxies
- first topic-level scoring слой для перевода bucket aggregates в явные topic scores для ранней niche evaluation
- first manual niche shortlist / ranking слой для decision-ready выбора направления блога на основе вручную scored topic buckets
- first frontend niche shortlist integration слой для запуска shortlist flow напрямую из web UI без ручного curl
- first structured bucket editor слой во frontend для работы с shortlist без ручного JSON
- next bucket UX improvement слой во frontend: duplicate bucket, быстрый handle entry и inline payload preview
- first frontend scenario switcher / local history слой для сохранения нескольких shortlist-конфигураций в localStorage
- first frontend scenario diff / pinned last-result слой для локального сравнения 2-3 shortlist-сценариев по последнему сохранённому результату
- first shortlisted niche evidence-pack слой для объяснимого evidence trail по каждой shortlisted niche прямо во frontend
- first top-10 supporting accounts roster слой для expanded evidence-pack view с up to 10 supporting accounts на shortlisted niche
- first supporting-account evidence snippet слой для показа 1-2 recent tweet references у supporting accounts внутри evidence-pack
- first supporting-account tweet reference mode слой для переключения snippets между `recent` и `best-performing`
- first best-hooks / content-pattern слой для best-performing tweet references с pattern tags и short strength reasons
- first supporting-account content archetype слой для account-level summary по сильным твитам: dominant patterns, archetype label и short explanation
- first niche-level content archetype rollup слой для сводки повторяющихся content patterns и archetypes по supporting accounts внутри shortlisted niche
- first niche-level content gaps / whitespace hints слой для underrepresented content patterns и positioning hints внутри shortlisted niche evidence pack
- public X tweet shell diagnostic слой для проверки каркаса страницы одиночного твита
- public X tweet field extraction слой для безопасного извлечения верхнеуровневых полей одиночного твита
- public X tweet metrics extraction слой для безопасного извлечения engagement metrics одиночного твита
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
│   │   │   ├── xAccountRecentPostsConfig.ts
│   │   │   ├── xAccountScoreConfig.ts
│   │   │   ├── xMultiAccountCompareConfig.ts
│   │   │   ├── xNavigationConfig.ts
│   │   │   ├── xNicheShortlistConfig.ts
│   │   │   ├── xProfileFieldsConfig.ts
│   │   │   ├── xProfileTimelineClassificationConfig.ts
│   │   │   ├── xProfileTimelineUrlsConfig.ts
│   │   │   ├── xTopicBucketCompareConfig.ts
│   │   │   ├── xTopicScoreConfig.ts
│   │   │   ├── xTweetFieldsConfig.ts
│   │   │   ├── xTweetMetricsConfig.ts
│   │   │   ├── xProfileShellConfig.ts
│   │   │   └── xTweetShellConfig.ts
│   │   ├── index.ts
│   │   ├── routes
│   │   │   ├── analysis.ts
│   │   │   ├── health.ts
│   │   │   ├── index.ts
│   │   │   ├── xAccountRecentPosts.ts
│   │   │   ├── xAccountScore.ts
│   │   │   ├── xMultiAccountCompare.ts
│   │   │   ├── xBootstrap.ts
│   │   │   ├── xNicheShortlist.ts
│   │   │   ├── xProfileFields.ts
│   │   │   ├── xProfileTimelineClassification.ts
│   │   │   ├── xProfileTimelineUrls.ts
│   │   │   ├── xProfileShell.ts
│   │   │   ├── xTopicBucketCompare.ts
│   │   │   ├── xTopicScore.ts
│   │   │   ├── xTweetFields.ts
│   │   │   ├── xTweetMetrics.ts
│   │   │   └── xTweetShell.ts
│   │   └── services
│   │       ├── browserBootstrapService.ts
│   │       ├── mockAnalysisService.ts
│   │       ├── xNicheShortlistService.ts
│   │       ├── xAccountRecentPostsService.ts
│   │       ├── xAccountScoreService.ts
│   │       ├── xMultiAccountCompareService.ts
│   │       ├── xProfileFieldsService.ts
│   │       ├── xProfilePageShellService.ts
│   │       ├── xProfileTimelineClassificationService.ts
│   │       ├── xProfileTimelineUrlsService.ts
│   │       ├── xTopicBucketCompareService.ts
│   │       ├── xTopicScoreService.ts
│   │       ├── xTweetFieldsService.ts
│   │       ├── xTweetMetricsService.ts
│   │       ├── xTweetPageShellService.ts
│   │       ├── xBootstrapService.ts
│   │       ├── xProfileShellService.ts
│   │       └── xTweetShellService.ts
├── frontend
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── src
│   │   ├── api
│   │   │   └── client.ts
│   │   ├── components
│   │   │   ├── BucketCardEditor.tsx
│   │   │   ├── BucketEditor.tsx
│   │   │   ├── HandleListEditor.tsx
│   │   │   ├── NicheCard.tsx
│   │   │   ├── NicheEvidencePack.tsx
│   │   │   ├── NicheShortlistCard.tsx
│   │   │   ├── NicheShortlistSummary.tsx
│   │   │   ├── ShortlistScenarioComparison.tsx
│   │   │   ├── ShortlistScenarioSwitcher.tsx
│   │   │   └── ShortlistPayloadPreview.tsx
│   │   ├── data
│   │   │   └── nicheShortlistExamples.ts
│   │   ├── types
│   │   │   └── nicheShortlist.ts
│   │   ├── utils
│   │   │   ├── nicheShortlistBucketEditor.ts
│   │   │   ├── nicheEvidencePack.ts
│   │   │   └── nicheShortlistScenarios.ts
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
http://localhost:3001/api/browser/x-profile-fields-test
http://localhost:3001/api/browser/x-profile-timeline-urls-test
http://localhost:3001/api/browser/x-profile-timeline-classification-test
http://localhost:3001/api/browser/x-account-recent-posts-test
http://localhost:3001/api/browser/x-account-score-test
http://localhost:3001/api/browser/x-multi-account-compare-test
http://localhost:3001/api/browser/x-topic-bucket-compare-test
http://localhost:3001/api/browser/x-topic-score-test
http://localhost:3001/api/browser/x-niche-shortlist-test
http://localhost:3001/api/browser/x-tweet-shell-test
http://localhost:3001/api/browser/x-tweet-fields-test
http://localhost:3001/api/browser/x-tweet-metrics-test
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
X_PROFILE_FIELDS_DEFAULT_HANDLE=
X_PROFILE_FIELDS_DEFAULT_URL=
X_PROFILE_FIELDS_WAIT_STRATEGY=load
X_PROFILE_FIELDS_EXTRACTION_TIMEOUT_MS=2500
X_PROFILE_TIMELINE_URLS_DEFAULT_HANDLE=
X_PROFILE_TIMELINE_URLS_DEFAULT_URL=
X_PROFILE_TIMELINE_URLS_WAIT_STRATEGY=load
X_PROFILE_TIMELINE_URLS_EXTRACTION_TIMEOUT_MS=2500
X_PROFILE_TIMELINE_URLS_DEFAULT_LIMIT=10
X_PROFILE_TIMELINE_URLS_MAX_LIMIT=20
X_PROFILE_TIMELINE_CLASSIFICATION_TREAT_QUOTE_AS_USABLE=false
X_ACCOUNT_RECENT_POSTS_DEFAULT_HANDLE=
X_ACCOUNT_RECENT_POSTS_DEFAULT_URL=
X_ACCOUNT_RECENT_POSTS_WAIT_STRATEGY=load
X_ACCOUNT_RECENT_POSTS_DEFAULT_LIMIT=5
X_ACCOUNT_RECENT_POSTS_MAX_LIMIT=10
X_ACCOUNT_SCORE_INCLUDE_UNCERTAIN=false
X_TWEET_SHELL_DEFAULT_URL=
X_TWEET_SHELL_WAIT_STRATEGY=load
X_TWEET_SHELL_MARKER_TIMEOUT_MS=3500
X_TWEET_SHELL_RETRY_COUNT=2
X_TWEET_SHELL_RETRY_DELAY_MS=1200
X_TWEET_FIELDS_DEFAULT_URL=
X_TWEET_FIELDS_WAIT_STRATEGY=load
X_TWEET_FIELDS_EXTRACTION_TIMEOUT_MS=2500
X_TWEET_METRICS_DEFAULT_URL=
X_TWEET_METRICS_WAIT_STRATEGY=load
X_TWEET_METRICS_EXTRACTION_TIMEOUT_MS=2500
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

## Как проверить X account recent-posts aggregation

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

4. Проверить агрегацию по handle:

```bash
curl -G "http://localhost:3001/api/browser/x-account-recent-posts-test" \
  --data-urlencode "handle=OpenAI" \
  --data-urlencode "limit=3" \
  --data-urlencode "waitStrategy=load" \
  --data-urlencode "treatQuoteAsUsable=false"
```

5. Проверить агрегацию по profile URL:

```bash
curl -G "http://localhost:3001/api/browser/x-account-recent-posts-test" \
  --data-urlencode "targetUrl=https://x.com/OpenAI" \
  --data-urlencode "limit=5" \
  --data-urlencode "waitStrategy=load" \
  --data-urlencode "treatQuoteAsUsable=true"
```

Что вернётся:
- `navigationSucceeded`
- `aggregationSucceeded`
- `classificationSucceeded`
- `profile` с уже доступными identity/header полями
- `discoveredTweetRefs` с recent tweet URL discovery
- `hydratedTweets` с объединёнными top-level fields, metrics и classification-полями по каждому твиту
- `classificationSummary`
- `accountSummary` с простыми first-pass aggregate значениями
- `timings`
- `error`
- `notes`

Ограничения текущего шага:
- маршрут не извлекает timeline post content напрямую из profile page
- маршрут не парсит replies и thread tree
- classification помогает очистить scoring inputs, но recent-posts route сам по себе ещё не делает жёсткий final filtering
- simple engagement-per-follower proxy пока является только первым приближением

## Как проверить X profile timeline classification

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

4. Проверить classification по handle:

```bash
curl -G "http://localhost:3001/api/browser/x-profile-timeline-classification-test" \
  --data-urlencode "handle=OpenAI" \
  --data-urlencode "limit=5" \
  --data-urlencode "treatQuoteAsUsable=false"
```

5. Проверить classification по profile URL:

```bash
curl -G "http://localhost:3001/api/browser/x-profile-timeline-classification-test" \
  --data-urlencode "targetUrl=https://x.com/OpenAI" \
  --data-urlencode "limit=5" \
  --data-urlencode "treatQuoteAsUsable=true"
```

Что вернётся:
- `navigationSucceeded`
- `classificationSucceeded`
- `profile`
- `discoveredItems`
- `classifiedItems`
- `classificationSummary`
- `timings`
- `error`
- `notes`

Ограничения текущего шага:
- классификация остаётся rule-based и deliberately conservative
- quote-post detection пока срабатывает только на сильных signals
- thread trees и reply lists ещё не извлекаются
- scoring/comparison pipelines уже используют этот слой через recent-posts integration

## Как проверить X account scoring

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

4. Проверить scoring по handle:

```bash
curl -G "http://localhost:3001/api/browser/x-account-score-test" \
  --data-urlencode "handle=OpenAI" \
  --data-urlencode "limit=3" \
  --data-urlencode "includeUncertain=false" \
  --data-urlencode "treatQuoteAsUsable=false"
```

5. Проверить scoring по profile URL:

```bash
curl -G "http://localhost:3001/api/browser/x-account-score-test" \
  --data-urlencode "targetUrl=https://x.com/OpenAI" \
  --data-urlencode "limit=5" \
  --data-urlencode "includeUncertain=true" \
  --data-urlencode "treatQuoteAsUsable=true"
```

Что вернётся:
- `aggregationSucceeded`
- `scoringSucceeded`
- `profile`
- `filtersApplied`
- `usableTweets`
- `excludedTweets`
- `exclusionReasonsSummary`
- `accountSignals`
- `accountScores`
- `timings`
- `error`
- `notes`

Ограничения текущего шага:
- scoring пока выполняется только для одного аккаунта
- final niche discovery и large-scale ranking across many topics ещё не реализованы
- classification-aware filtering остаётся first-pass и будет усиливаться отдельно
- overall account score пока служит как прозрачный preliminary signal, а не как финальный ranking layer

## Как проверить X multi-account comparison

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

4. Проверить сравнение по handles:

```bash
curl -G "http://localhost:3001/api/browser/x-multi-account-compare-test" \
  --data-urlencode "handles=OpenAI,AnthropicAI" \
  --data-urlencode "limit=3" \
  --data-urlencode "includeUncertain=false" \
  --data-urlencode "sortBy=overallAccountScore"
```

5. Проверить mixed input с profile URLs:

```bash
curl -G "http://localhost:3001/api/browser/x-multi-account-compare-test" \
  --data-urlencode "handles=OpenAI" \
  --data-urlencode "targetUrls=https://x.com/AnthropicAI,https://x.com/home" \
  --data-urlencode "limit=3" \
  --data-urlencode "sortBy=engagementEfficiencyScore"
```

Что вернётся:
- `comparisonSucceeded`
- `requestedAccounts`
- `successfulComparisons`
- `failedComparisons`
- `comparedAccounts`
- `comparisonSummary`
- `timings`
- `error`
- `notes`

Ограничения текущего шага:
- сравнение пока работает только по вручную переданному списку аккаунтов
- sequential execution сохранён намеренно, без batching/concurrency optimization
- automatic account discovery by topic и финальный niche discovery ещё не реализованы
- better reply/repost classification будет вынесена в отдельный следующий шаг

## Как проверить X topic-bucket comparison

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

4. Проверить topic buckets через POST JSON payload:

```bash
curl -X POST "http://localhost:3001/api/browser/x-topic-bucket-compare-test" \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 1,
    "includeUncertain": false,
    "treatQuoteAsUsable": false,
    "sortBy": "avgOverallAccountScore",
    "buckets": [
      {
        "bucketId": "frontier-labs",
        "label": "Frontier Labs",
        "description": "Публичные аккаунты frontier-model лабораторий",
        "handles": ["OpenAI", "AnthropicAI"]
      },
      {
        "bucketId": "research-platforms",
        "label": "Research Platforms",
        "description": "Платформы и исследовательские экосистемы",
        "handles": ["GoogleDeepMind", "huggingface"]
      }
    ]
  }'
```

Что вернётся:
- `comparisonSucceeded`
- `requestedBuckets`
- `successfulBuckets`
- `failedBuckets`
- `comparedBuckets`
- `bucketRanking`
- `comparisonSummary`
- `timings`
- `error`
- `notes`

Ограничения текущего шага:
- topic buckets пока задаются только вручную
- bucket scoring остаётся first-pass и агрегирует существующие account-level scores
- sequential execution сохранён намеренно для прозрачности и низкого риска
- automatic account discovery, persistence/history и UI integration ещё не реализованы

## Как проверить X topic scoring

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

4. Проверить topic scoring через POST JSON payload:

```bash
curl -X POST "http://localhost:3001/api/browser/x-topic-score-test" \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 1,
    "includeUncertain": false,
    "treatQuoteAsUsable": false,
    "sortBy": "overallTopicScore",
    "buckets": [
      {
        "bucketId": "frontier-labs",
        "label": "Frontier Labs",
        "description": "Публичные аккаунты frontier-model лабораторий",
        "handles": ["OpenAI", "AnthropicAI"]
      },
      {
        "bucketId": "research-platforms",
        "label": "Research Platforms",
        "description": "Платформы и исследовательские экосистемы",
        "handles": ["GoogleDeepMind", "huggingface"]
      }
    ]
  }'
```

Что вернётся:
- `scoringSucceeded`
- `requestedBuckets`
- `scoredBuckets`
- `topicRanking`
- `comparisonSummary`
- `timings`
- `error`
- `notes`

Ограничения текущего шага:
- topic scoring пока работает только по вручную переданным bucket definitions
- monetization potential пока является прозрачным proxy, а не прямой revenue estimate
- final top-10 niche discovery и automatic topic discovery ещё не реализованы
- persistence/history и interactive UI integration будут вынесены в отдельные следующие шаги

## Как проверить X niche shortlist

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

4. Проверить niche shortlist через POST JSON payload:

```bash
curl -X POST "http://localhost:3001/api/browser/x-niche-shortlist-test" \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 1,
    "topN": 2,
    "sortBy": "overallTopicScore",
    "includeUncertain": false,
    "treatQuoteAsUsable": false,
    "emphasizeGrowth": true,
    "emphasizeMonetization": false,
    "emphasizeEase": false,
    "buckets": [
      {
        "bucketId": "frontier-labs",
        "label": "Frontier Labs",
        "description": "Публичные аккаунты frontier-model лабораторий",
        "handles": ["OpenAI", "AnthropicAI"]
      },
      {
        "bucketId": "research-platforms",
        "label": "Research Platforms",
        "description": "Платформы и исследовательские экосистемы",
        "handles": ["GoogleDeepMind", "huggingface"]
      },
      {
        "bucketId": "ai-builders",
        "label": "AI Builders",
        "description": "Публичные аккаунты builder-oriented AI проектов",
        "handles": ["cursor_ai", "v0", "Replit"]
      }
    ]
  }'
```

Что вернётся:
- `shortlistSucceeded`
- `requestedBuckets`
- `rankedBuckets`
- `shortlistSummary`
- `timings`
- `error`
- `notes`

Что именно появится в `rankedBuckets`:
- `rank`
- `rankingReason`
- `pros`
- `cons`
- `recommendedUseCase`
- `strongestAccounts`
- `decisionLabels`
- `topicSignals`
- `topicScores`
- `rankingBreakdown`

Ограничения текущего шага:
- shortlist работает только по вручную переданным buckets
- ranking logic остаётся first-pass и строится поверх уже готовых topic scores
- monetization остаётся прозрачным proxy, а не прямой business estimate
- automatic topic discovery, final top-10 niche generation и UI shortlist display ещё не реализованы

## Как проверить shortlist UI во frontend

1. Установить зависимости:

```bash
npm install
```

2. Установить Chromium:

```bash
npm run browsers:install
```

3. Запустить frontend и backend:

```bash
npm run dev
```

4. Открыть UI:

```text
http://localhost:5173
```

5. В интерфейсе:
- найти блок `Собрать shortlist без curl`
- в секции `Локальные сценарии` увидеть активный сценарий, который создаётся автоматически при пустом localStorage
- при необходимости сохранить текущую конфигурацию через `Сохранить текущий` или сделать новый вариант через `Сохранить как новый`
- для возврата к старому варианту использовать `Загрузить`, для чистого эксперимента `Дублировать`, для переименования `Переименовать`
- либо нажать один из example presets, либо оставить `Пустой editor`
- заполнить хотя бы один bucket: `Название bucket` + минимум один `X handle`
- для быстрого ввода handles можно вставить несколько значений через пробел, запятую или новую строку
- для повторного эксперимента можно нажать `Дублировать` у любого bucket-а
- при необходимости открыть `Предпросмотр запроса в backend` и проверить итоговый payload перед submit
- при первом запуске оставить `limit=1` и `topN=2`
- нажать `Запустить shortlist ниш`
- после успешного run убедиться, что активный сценарий получил pinned result с `Последний run`, `Best overall` и `Shortlist size`
- открыть `Evidence pack` внутри одной из shortlisted ниш и проверить supporting accounts roster, score drivers, caution flags, затем посмотреть niche-level archetype rollup и новый whitespace-блок с underrepresented patterns и positioning hints, а после этого переключить режим `Свежие` / `Лучшие по реакции` и сверить pattern tags, account archetypes и короткие explanations
- нажать `Добавить к сравнению` у 1-2 дополнительных сценариев и проверить блок `Сравнение сохранённых сценариев`
- в `Scenario Diff` сравнить flags, bucket labels, handle counts и top summary без ручного переключения editor-а

6. Что появится в UI:
- summary card с `bestOverall`, `bestForGrowth`, `bestForMonetization`, `easiestToStart`, `bestBalanced`
- ranked niche cards с `overallTopicScore`, `growthPotential`, `monetizationPotential`, `contentEase`, `dataConfidence`
- decision labels
- ranking reasons
- pros / cons
- strongest accounts
- top supporting accounts roster до 10 аккаунтов на shortlisted niche, если хватает account-level data
- до 2 recent tweet references у каждого supporting account, если usable posts доступны
- отдельный режим `Лучшие по реакции` для поддержки manual review не только по свежести, но и по силе сигнала
- у best-performing snippets появляются content-pattern tags и short strength reasons для быстрого понимания сильных hooks
- у supporting accounts появляется account-level content archetype summary по сильным твитам: dominant patterns, archetype label и confidence note при слабом evidence
- у shortlisted niche появляется niche-level content archetype rollup: dominant patterns, common archetypes, short summary и confidence note
- у shortlisted niche появляется whitespace/gaps section: underrepresented patterns, short whitespace hints, positioning ideas и confidence note
- pinned result snapshot у каждого локального сценария
- отдельный comparison panel для 2-3 сценариев с lightweight diff по настройкам и последнему shortlist result
- внутри shortlisted niche cards можно открыть `Evidence pack` и увидеть up to 10 supporting accounts, niche-level archetype rollup, whitespace hints, relevance notes, score chips, account-level content archetype summary, 1-2 recent или best-performing tweet references, content-pattern tags, coverage notes и recommended next action

Ограничения текущего frontend шага:
- buckets пока задаются только вручную через structured editor
- target URLs из UI пока не редактируются, только handles
- сценарии сохраняются только локально в браузере, без backend persistence
- pinned results и diff тоже сохраняются только локально в `localStorage`, без общей истории запусков на backend
- comparison panel хранит только lightweight snapshot последнего успешного run, а не полный архив всех shortlist результатов
- evidence pack и top supporting accounts roster пока строятся поверх уже существующего shortlist payload и не добавляют отдельный deep-validation pipeline
- UI ещё не умеет автоматически находить topics
- текущий frontend только визуализирует existing backend shortlist route и не меняет scoring model
- если bucket дал меньше 10 usable supporting accounts, UI честно покажет только доступный roster без искусственного заполнения
- если у supporting account нет подходящих usable posts, UI честно покажет, что recent tweet references пока недоступны
- если metric-rich posts мало, режим `Лучшие по реакции` может частично дополняться recent references и прямо сообщает об этом
- content-pattern tags пока rule-based и объяснимые, но ещё не являются полноценной NLP-классификацией
- content archetype summary тоже пока rule-based и строится всего по 1-2 best-performing snippets, поэтому его стоит читать как быстрый manual-review shortcut, а не как строгую taxonomy
- niche-level archetype rollup тоже остаётся rule-based и зависит от того, насколько много supporting accounts уже получили usable archetype summary
- whitespace hints тоже rule-based и зависят от текущего roster supporting accounts, поэтому их лучше читать как идеи для ручной проверки, а не как готовые окончательные gaps
- следующий UI шаг лучше делать уже с более явным cross-scenario evidence/history view, чтобы сравнивать не только summary, но и закреплённые shortlist cards по нескольким прогонам

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

## Как проверить X profile fields

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

4. Проверить извлечение identity/header полей профиля по handle:

```bash
curl -G "http://localhost:3001/api/browser/x-profile-fields-test" \
  --data-urlencode "handle=Google" \
  --data-urlencode "waitStrategy=load"
```

5. Проверить извлечение identity/header полей профиля по публичному URL:

```bash
curl -G "http://localhost:3001/api/browser/x-profile-fields-test" \
  --data-urlencode "targetUrl=https://x.com/OpenAI" \
  --data-urlencode "waitStrategy=load"
```

Что вернётся:
- `navigationSucceeded`
- `extractionSucceeded`
- `finalUrl`
- `pageTitle`
- `detectedFields`
- `missingFields`
- `extractedData`
- `timings`
- `error`
- `notes`

Что именно извлекается:
- `profileUrl`
- `handle`
- `displayName`
- `bio`
- `location`
- `websiteUrl`
- `joinedAt`
- `followerCount`
- `followingCount`
- `postCount`
- `verifiedOrNotable`

Формат count-like полей:
- `rawText`
- `normalizedNumber`
- `available`

Ограничения текущего шага:
- маршрут принимает `handle` профиля или публичный profile-like URL
- маршрут извлекает только identity/header поля профиля
- маршрут не извлекает timeline tweets, pinned tweet details, media grid или follower/following lists
- `location`, `websiteUrl`, `postCount` и `verifiedOrNotable` могут отсутствовать на конкретной публичной странице и это не считается фатальной ошибкой
- маршрут не выполняет login automation

## Как проверить X profile timeline URL discovery

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

4. Проверить discovery tweet URL по handle:

```bash
curl -G "http://localhost:3001/api/browser/x-profile-timeline-urls-test" \
  --data-urlencode "handle=OpenAI" \
  --data-urlencode "limit=5" \
  --data-urlencode "waitStrategy=load"
```

5. Проверить discovery tweet URL по публичному URL:

```bash
curl -G "http://localhost:3001/api/browser/x-profile-timeline-urls-test" \
  --data-urlencode "targetUrl=https://x.com/OpenAI" \
  --data-urlencode "limit=10" \
  --data-urlencode "waitStrategy=load"
```

Что вернётся:
- `navigationSucceeded`
- `extractionSucceeded`
- `finalUrl`
- `pageTitle`
- `detectedFields`
- `missingFields`
- `extractedData`
- `timings`
- `error`
- `notes`

Что именно извлекается для каждого timeline item:
- `tweetUrl`
- `tweetId`
- `authorHandle`
- `sortIndex`
- `isPinned`
- `isReplyOrRepostUncertain`
- `uncertaintyReasons`

Ограничения текущего шага:
- маршрут принимает `handle` профиля или публичный profile-like URL и optional `limit`
- маршрут делает только URL discovery для недавних tweet items
- маршрут не извлекает полный tweet text и не извлекает timeline metrics с profile page
- repost/reply-похожие элементы пока помечаются как uncertain, а не отфильтровываются идеально
- маршрут не выполняет login automation

## Как проверить X tweet shell

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

4. Проверить shell одиночного твита по публичному URL:

```bash
curl -G "http://localhost:3001/api/browser/x-tweet-shell-test" \
  --data-urlencode "targetUrl=https://x.com/<handle>/status/<tweet_id>" \
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
- `mainTweetArticleShell`
- `authorShellBlock`
- `tweetContentContainerShell`
- `actionBarShell`
- `replyThreadRegionShellVisible`

Ограничения текущего шага:
- маршрут принимает только публичный tweet URL формата `/handle/status/id`
- маршрут не извлекает tweet text, tweet metrics или author metrics
- маршрут не парсит replies, thread content или profile details
- маршрут не выполняет login automation

## Как проверить X tweet fields

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

4. Проверить извлечение верхнеуровневых полей одиночного твита:

```bash
curl -G "http://localhost:3001/api/browser/x-tweet-fields-test" \
  --data-urlencode "targetUrl=https://x.com/<handle>/status/<tweet_id>" \
  --data-urlencode "waitStrategy=load"
```

Что вернётся:
- `navigationSucceeded`
- `extractionSucceeded`
- `finalUrl`
- `pageTitle`
- `detectedFields`
- `missingFields`
- `extractedData`
- `timings`
- `error`
- `notes`

Что именно извлекается:
- `tweetUrl`
- `tweetId`
- `authorHandle`
- `authorDisplayName`
- `publishedAt`
- `tweetText`
- `language`

Ограничения текущего шага:
- маршрут принимает только публичный tweet URL формата `/handle/status/id`
- маршрут извлекает только верхнеуровневые поля одиночного твита
- маршрут не извлекает like/repost/reply/bookmark/view counts
- маршрут не парсит replies, thread structure или расширенные author profile details
- маршрут не выполняет login automation

## Как проверить X tweet metrics

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

4. Проверить извлечение engagement metrics одиночного твита:

```bash
curl -G "http://localhost:3001/api/browser/x-tweet-metrics-test" \
  --data-urlencode "targetUrl=https://x.com/<handle>/status/<tweet_id>" \
  --data-urlencode "waitStrategy=load"
```

Что вернётся:
- `navigationSucceeded`
- `extractionSucceeded`
- `finalUrl`
- `pageTitle`
- `detectedFields`
- `missingFields`
- `extractedData`
- `timings`
- `error`
- `notes`

Что именно извлекается:
- `replyCount`
- `repostCount`
- `likeCount`
- `bookmarkCount`
- `viewCount`

Формат каждой метрики:
- `rawText`
- `normalizedNumber`
- `available`

Ограничения текущего шага:
- маршрут принимает только публичный tweet URL формата `/handle/status/id`
- маршрут извлекает только engagement metrics одиночного твита
- маршрут не парсит replies list, thread tree или author profile metrics
- `bookmarkCount` и `viewCount` могут отсутствовать на конкретной публичной странице и это не считается фатальной ошибкой
- маршрут не выполняет login automation

## Что строить следующим

1. Добавить изолированный per-item timeline tweet field hydration слой, который прогоняет найденные profile timeline URLs через existing single-tweet field route/service.
2. Затем перейти к безопасному per-item timeline tweet metrics hydration слою поверх existing single-tweet metrics extraction.
3. После этого переходить к account extraction и post extraction отдельными шагами.
4. Потом заменять mock scoring на реальный multi-signal niche scoring.
5. И только затем добавлять сохранение запусков и финальный отчёт по топ-10 нишам.
