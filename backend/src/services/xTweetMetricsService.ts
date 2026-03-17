import type { FastifyBaseLogger } from "fastify";
import { xSelectors } from "@twitter-niche-analyzer/shared";
import { browserConfig } from "../config/browserConfig.js";
import { xNavigationConfig } from "../config/xNavigationConfig.js";
import {
  getXTweetMetricsNotesSeed,
  resolveXTweetMetricsTarget,
  resolveXTweetMetricsWaitStrategy,
  xTweetMetricsConfig
} from "../config/xTweetMetricsConfig.js";
import { xTweetShellConfig } from "../config/xTweetShellConfig.js";
import {
  closeBrowserRuntime,
  createBrowserRuntime,
  type BrowserRuntime
} from "./browserBootstrapService.js";
import {
  collectXTweetShellMarkers,
  createEmptyXTweetShellMarkerState,
  getMissingXTweetShellMarkers,
  hasRequiredXTweetShell,
  waitForXTweetShellSignals
} from "./xTweetPageShellService.js";

type XTweetMetricKey =
  | "replyCount"
  | "repostCount"
  | "likeCount"
  | "bookmarkCount"
  | "viewCount";

interface XTweetMetricsOptions {
  targetUrl?: string;
  waitStrategy?: string;
}

export interface XTweetMetricValue {
  rawText: string | null;
  normalizedNumber: number | null;
  available: boolean;
}

export interface ExtractedXTweetMetricsData {
  replyCount: XTweetMetricValue;
  repostCount: XTweetMetricValue;
  likeCount: XTweetMetricValue;
  bookmarkCount: XTweetMetricValue;
  viewCount: XTweetMetricValue;
}

interface XTweetMetricsTimings {
  browserReadyMs: number;
  navigationMs: number;
  afterLoadWaitMs: number;
  shellWaitMs: number;
  extractionMs: number;
  retriesUsed: number;
  totalMs: number;
}

interface XTweetMetricsErrorDetails {
  name: string;
  message: string;
}

export interface XTweetMetricsDiagnostics {
  status: "ok" | "partial" | "error";
  navigationSucceeded: boolean;
  extractionSucceeded: boolean;
  targetTweetUrl: string | null;
  finalUrl: string | null;
  pageTitle: string | null;
  httpStatus: number | null;
  waitStrategy: string;
  detectedFields: string[];
  missingFields: string[];
  extractedData: ExtractedXTweetMetricsData;
  timings: XTweetMetricsTimings;
  error: XTweetMetricsErrorDetails | null;
  notes: string[];
}

const metricLabels: Record<XTweetMetricKey, string> = {
  replyCount: "replyCount",
  repostCount: "repostCount",
  likeCount: "likeCount",
  bookmarkCount: "bookmarkCount",
  viewCount: "viewCount"
};

const primaryMetricKeys: XTweetMetricKey[] = [
  "replyCount",
  "repostCount",
  "likeCount"
];

function createEmptyMetricValue(): XTweetMetricValue {
  return {
    rawText: null,
    normalizedNumber: null,
    available: false
  };
}

function createEmptyMetricsData(): ExtractedXTweetMetricsData {
  return {
    replyCount: createEmptyMetricValue(),
    repostCount: createEmptyMetricValue(),
    likeCount: createEmptyMetricValue(),
    bookmarkCount: createEmptyMetricValue(),
    viewCount: createEmptyMetricValue()
  };
}

function serializeError(error: unknown): XTweetMetricsErrorDetails {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message
    };
  }

  return {
    name: "UnknownError",
    message: String(error)
  };
}

function getDetectedFields(extractedData: ExtractedXTweetMetricsData) {
  return (Object.entries(extractedData) as [XTweetMetricKey, XTweetMetricValue][])
    .filter(([, value]) => value.available)
    .map(([key]) => metricLabels[key]);
}

function getMissingFields(extractedData: ExtractedXTweetMetricsData) {
  return (Object.entries(extractedData) as [XTweetMetricKey, XTweetMetricValue][])
    .filter(([, value]) => !value.available)
    .map(([key]) => metricLabels[key]);
}

function hasSuccessfulMetricsExtraction(extractedData: ExtractedXTweetMetricsData) {
  return primaryMetricKeys.every((key) => extractedData[key].available);
}

function parseNormalizedMetricNumber(rawValue: string | null) {
  if (!rawValue) {
    return null;
  }

  const normalizedText = rawValue.replace(/\s+/g, " ").trim();
  const numericMatch = normalizedText.match(/(\d[\d,.]*)(?:\s*([KMB]))?/i);

  if (!numericMatch) {
    return null;
  }

  const baseValue = Number(numericMatch[1].replace(/,/g, ""));

  if (!Number.isFinite(baseValue)) {
    return null;
  }

  const suffix = numericMatch[2]?.toUpperCase();

  if (!suffix) {
    return Math.round(baseValue);
  }

  const multiplierMap: Record<string, number> = {
    K: 1_000,
    M: 1_000_000,
    B: 1_000_000_000
  };

  const multiplier = multiplierMap[suffix];

  if (!multiplier) {
    return Math.round(baseValue);
  }

  return Math.round(baseValue * multiplier);
}

async function extractMetricValueFromLocator(
  runtime: BrowserRuntime,
  selector: string
): Promise<XTweetMetricValue> {
  const metricLocator = runtime.page
    .locator(xSelectors.post.shellArticle)
    .first()
    .locator(selector)
    .first();

  if ((await metricLocator.count()) === 0) {
    return createEmptyMetricValue();
  }

  const valueLocator = metricLocator.locator(xSelectors.post.metricValueText).first();
  const [valueText, textContent, ariaLabel, title] = await Promise.all([
    valueLocator.count().then((count) => (count > 0 ? valueLocator.textContent() : null)),
    metricLocator.textContent(),
    metricLocator.getAttribute("aria-label"),
    metricLocator.getAttribute("title")
  ]);

  const rawTextCandidates = [valueText, textContent, ariaLabel, title]
    .map((value) => value?.replace(/\s+/g, " ").trim() || null)
    .filter((value): value is string => Boolean(value));

  const rawText = rawTextCandidates[0] ?? null;
  const normalizedNumber =
    rawTextCandidates
      .map((value) => parseNormalizedMetricNumber(value))
      .find((value): value is number => value !== null) ?? null;

  return {
    rawText,
    normalizedNumber,
    available: true
  };
}

async function waitForTweetMetricSignals(runtime: BrowserRuntime) {
  await Promise.allSettled([
    runtime.page.waitForSelector(xSelectors.post.replyButton, {
      timeout: xTweetMetricsConfig.extractionTimeoutMs
    }),
    runtime.page.waitForSelector(xSelectors.post.repostButton, {
      timeout: xTweetMetricsConfig.extractionTimeoutMs
    }),
    runtime.page.waitForSelector(xSelectors.post.likeButton, {
      timeout: xTweetMetricsConfig.extractionTimeoutMs
    })
  ]);
}

async function extractTweetMetrics(runtime: BrowserRuntime) {
  const extractionStart = Date.now();
  const mainArticleLocator = runtime.page.locator(xSelectors.post.shellArticle).first();

  if ((await mainArticleLocator.count()) === 0) {
    return {
      extractedData: createEmptyMetricsData(),
      extractionMs: Date.now() - extractionStart
    };
  }

  const [replyCount, repostCount, likeCount, bookmarkCount, viewCount] =
    await Promise.all([
      extractMetricValueFromLocator(runtime, xSelectors.post.replyButton),
      extractMetricValueFromLocator(runtime, xSelectors.post.repostButton),
      extractMetricValueFromLocator(runtime, xSelectors.post.likeButton),
      extractMetricValueFromLocator(runtime, xSelectors.post.bookmarkButton),
      extractMetricValueFromLocator(runtime, xSelectors.post.viewLink)
    ]);

  const extractedData = {
    replyCount,
    repostCount,
    likeCount,
    bookmarkCount,
    viewCount
  };

  return {
    extractedData,
    extractionMs: Date.now() - extractionStart
  };
}

export async function runXTweetMetricsDiagnostics(
  options: XTweetMetricsOptions,
  logger: FastifyBaseLogger
): Promise<XTweetMetricsDiagnostics> {
  const startedAt = Date.now();
  const notes = getXTweetMetricsNotesSeed();
  const waitStrategy = resolveXTweetMetricsWaitStrategy(options.waitStrategy);

  let runtime: Partial<BrowserRuntime> = {};
  let targetTweetUrl: string | null = null;
  let finalUrl: string | null = null;
  let pageTitle: string | null = null;
  let httpStatus: number | null = null;
  let browserReadyMs = 0;
  let navigationMs = 0;
  let shellWaitMs = 0;
  let extractionMs = 0;
  let retriesUsed = 0;
  let navigationSucceeded = false;
  let extractedData = createEmptyMetricsData();
  let markerState = createEmptyXTweetShellMarkerState();

  logger.info(
    {
      targetUrl: options.targetUrl,
      waitStrategy
    },
    "Running X tweet metrics extraction diagnostics."
  );

  try {
    const resolvedTarget = resolveXTweetMetricsTarget(options.targetUrl);
    targetTweetUrl = resolvedTarget.targetUrl;

    if (resolvedTarget.resolutionSource === "targetUrl") {
      notes.push("Использован переданный URL публичного твита X.");
    } else {
      notes.push("Использован URL твита по умолчанию из конфигурации.");
    }

    const browserStart = Date.now();
    const browserRuntime = await createBrowserRuntime(logger);
    runtime = browserRuntime;
    browserReadyMs = Date.now() - browserStart;

    const navigationStart = Date.now();
    const response = await browserRuntime.page.goto(targetTweetUrl, {
      waitUntil: waitStrategy,
      timeout: browserConfig.navigationTimeoutMs
    });
    navigationMs = Date.now() - navigationStart;

    navigationSucceeded = true;
    pageTitle = (await browserRuntime.page.title()) || null;
    httpStatus = response?.status() ?? null;
    finalUrl = browserRuntime.page.url();

    if (xNavigationConfig.afterLoadWaitMs > 0) {
      await browserRuntime.page.waitForTimeout(xNavigationConfig.afterLoadWaitMs);
    }

    const shellWaitStart = Date.now();

    for (let attemptIndex = 0; attemptIndex <= xTweetShellConfig.retryCount; attemptIndex += 1) {
      await waitForXTweetShellSignals(browserRuntime);

      const markerResult = await collectXTweetShellMarkers(browserRuntime);
      markerState = markerResult.markerState;

      if (hasRequiredXTweetShell(markerState)) {
        break;
      }

      if (attemptIndex < xTweetShellConfig.retryCount) {
        retriesUsed += 1;
        await browserRuntime.page.waitForTimeout(xTweetShellConfig.retryDelayMs);
      }
    }

    shellWaitMs = Date.now() - shellWaitStart;

    if (retriesUsed > 0) {
      notes.push(`Для стабилизации tweet shell выполнено повторных попыток: ${retriesUsed}.`);
    }

    if (!hasRequiredXTweetShell(markerState)) {
      const missingShellMarkers = getMissingXTweetShellMarkers(markerState);
      notes.push(
        `Извлечение метрик остановлено из-за неполного tweet shell: ${missingShellMarkers.join(", ")}.`
      );

      return {
        status: "error",
        navigationSucceeded,
        extractionSucceeded: false,
        targetTweetUrl,
        finalUrl,
        pageTitle,
        httpStatus,
        waitStrategy,
        detectedFields: getDetectedFields(extractedData),
        missingFields: getMissingFields(extractedData),
        extractedData,
        timings: {
          browserReadyMs,
          navigationMs,
          afterLoadWaitMs: xNavigationConfig.afterLoadWaitMs,
          shellWaitMs,
          extractionMs,
          retriesUsed,
          totalMs: Date.now() - startedAt
        },
        error: {
          name: "XTweetMetricsShellValidationError",
          message: "Не удалось безопасно подтвердить базовый shell страницы одиночного твита X."
        },
        notes
      };
    }

    await waitForTweetMetricSignals(browserRuntime);

    const extractionResult = await extractTweetMetrics(browserRuntime);
    extractedData = extractionResult.extractedData;
    extractionMs = extractionResult.extractionMs;

    if (!extractedData.bookmarkCount.available) {
      notes.push(
        "Bookmark count может быть скрыт на публичной странице или зависеть от состояния текущей сессии."
      );
    }

    if (!extractedData.viewCount.available) {
      notes.push(
        "View count может отсутствовать, если X не показал analytics link на текущей публичной странице."
      );
    }

    const extractionSucceeded = hasSuccessfulMetricsExtraction(extractedData);

    if (!extractionSucceeded) {
      notes.push(
        "Извлечение завершилось частично: доступны не все базовые tweet engagement metrics."
      );
    }

    return {
      status: extractionSucceeded ? "ok" : "partial",
      navigationSucceeded,
      extractionSucceeded,
      targetTweetUrl,
      finalUrl,
      pageTitle,
      httpStatus,
      waitStrategy,
      detectedFields: getDetectedFields(extractedData),
      missingFields: getMissingFields(extractedData),
      extractedData,
      timings: {
        browserReadyMs,
        navigationMs,
        afterLoadWaitMs: xNavigationConfig.afterLoadWaitMs,
        shellWaitMs,
        extractionMs,
        retriesUsed,
        totalMs: Date.now() - startedAt
      },
      error: extractionSucceeded
        ? null
        : {
            name: "XTweetMetricsPartialExtraction",
            message: "Не все базовые engagement metrics твита X удалось извлечь."
          },
      notes
    };
  } catch (error) {
    finalUrl = runtime.page?.url() || finalUrl;

    if (runtime.page) {
      try {
        pageTitle = (await runtime.page.title()) || pageTitle;
        const extractionResult = await extractTweetMetrics(runtime as BrowserRuntime);
        extractedData = extractionResult.extractedData;
        extractionMs = extractionResult.extractionMs;
      } catch {
        // Ignore secondary extraction failures and return what is already available.
      }
    }

    notes.push("Диагностика завершилась с ошибкой до полного завершения tweet metrics extraction.");
    logger.error({ err: serializeError(error) }, "X tweet metrics extraction failed.");

    return {
      status: "error",
      navigationSucceeded,
      extractionSucceeded: false,
      targetTweetUrl,
      finalUrl,
      pageTitle,
      httpStatus,
      waitStrategy,
      detectedFields: getDetectedFields(extractedData),
      missingFields: getMissingFields(extractedData),
      extractedData,
      timings: {
        browserReadyMs,
        navigationMs,
        afterLoadWaitMs: xNavigationConfig.afterLoadWaitMs,
        shellWaitMs,
        extractionMs,
        retriesUsed,
        totalMs: Date.now() - startedAt
      },
      error: serializeError(error),
      notes
    };
  } finally {
    await closeBrowserRuntime(runtime, logger);
  }
}

// TODO: Add isolated reply parsing only after tweet metrics extraction is stable.
// TODO: Add isolated thread parsing only after reply parsing requirements are defined.
// TODO: Add isolated author profile metrics extraction in a separate profile-focused step.
