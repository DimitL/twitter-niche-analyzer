import type { FastifyBaseLogger } from "fastify";
import { browserConfig } from "../config/browserConfig.js";
import { xNavigationConfig } from "../config/xNavigationConfig.js";
import {
  getXTweetShellNotesSeed,
  resolveXTweetShellWaitStrategy,
  resolveXTweetTarget,
  xTweetShellConfig
} from "../config/xTweetShellConfig.js";
import {
  closeBrowserRuntime,
  createBrowserRuntime,
  type BrowserRuntime
} from "./browserBootstrapService.js";
import {
  collectXTweetShellMarkers,
  createEmptyXTweetShellMarkerState,
  getDetectedXTweetShellMarkers,
  getMissingXTweetShellMarkers,
  hasRequiredXTweetShell,
  type XTweetShellMarkerState,
  waitForXTweetShellSignals
} from "./xTweetPageShellService.js";

interface XTweetShellOptions {
  targetUrl?: string;
  waitStrategy?: string;
}

interface XTweetShellTimings {
  browserReadyMs: number;
  navigationMs: number;
  afterLoadWaitMs: number;
  shellWaitMs: number;
  markerScanMs: number;
  retriesUsed: number;
  totalMs: number;
}

interface XTweetShellErrorDetails {
  name: string;
  message: string;
}

export interface XTweetShellDiagnostics {
  status: "ok" | "error";
  navigationSucceeded: boolean;
  targetTweetUrl: string | null;
  resolvedHandle: string | null;
  tweetId: string | null;
  finalUrl: string | null;
  pageTitle: string | null;
  httpStatus: number | null;
  waitStrategy: string;
  detectedMarkers: string[];
  missingMarkers: string[];
  markerState: XTweetShellMarkerState;
  timings: XTweetShellTimings;
  error: XTweetShellErrorDetails | null;
  notes: string[];
}

function serializeError(error: unknown): XTweetShellErrorDetails {
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

export async function runXTweetShellDiagnostics(
  options: XTweetShellOptions,
  logger: FastifyBaseLogger
): Promise<XTweetShellDiagnostics> {
  const startedAt = Date.now();
  const notes = getXTweetShellNotesSeed();
  const waitStrategy = resolveXTweetShellWaitStrategy(options.waitStrategy);

  let runtime: Partial<BrowserRuntime> = {};
  let targetTweetUrl: string | null = null;
  let resolvedHandle: string | null = null;
  let tweetId: string | null = null;
  let finalUrl: string | null = null;
  let pageTitle: string | null = null;
  let httpStatus: number | null = null;
  let browserReadyMs = 0;
  let navigationMs = 0;
  let shellWaitMs = 0;
  let markerScanMs = 0;
  let retriesUsed = 0;
  let markerState = createEmptyXTweetShellMarkerState();
  let navigationSucceeded = false;

  logger.info(
    {
      targetUrl: options.targetUrl,
      waitStrategy
    },
    "Running X tweet shell diagnostics."
  );

  try {
    const resolvedTarget = resolveXTweetTarget(options.targetUrl);
    targetTweetUrl = resolvedTarget.targetUrl;
    resolvedHandle = resolvedTarget.normalizedHandle;
    tweetId = resolvedTarget.tweetId;

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
      markerScanMs = markerResult.markerScanMs;

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
      notes.push(`Для стабилизации shell выполнено повторных попыток: ${retriesUsed}.`);
    }

    if (!markerState.replyThreadRegionShellVisible) {
      notes.push(
        "Маркер reply/thread region shell может отсутствовать, если дополнительная дискуссия не видна на текущем экране."
      );
    }

    const missingMarkers = getMissingXTweetShellMarkers(markerState);

    if (!hasRequiredXTweetShell(markerState)) {
      return {
        status: "error",
        navigationSucceeded,
        targetTweetUrl,
        resolvedHandle,
        tweetId,
        finalUrl,
        pageTitle,
        httpStatus,
        waitStrategy,
        detectedMarkers: getDetectedXTweetShellMarkers(markerState),
        missingMarkers,
        markerState,
        timings: {
          browserReadyMs,
          navigationMs,
          afterLoadWaitMs: xNavigationConfig.afterLoadWaitMs,
          shellWaitMs,
          markerScanMs,
          retriesUsed,
          totalMs: Date.now() - startedAt
        },
        error: {
          name: "XTweetShellValidationError",
          message: "Не все обязательные shell-маркеры страницы твита X были обнаружены."
        },
        notes
      };
    }

    return {
      status: "ok",
      navigationSucceeded,
      targetTweetUrl,
      resolvedHandle,
      tweetId,
      finalUrl,
      pageTitle,
      httpStatus,
      waitStrategy,
      detectedMarkers: getDetectedXTweetShellMarkers(markerState),
      missingMarkers,
      markerState,
      timings: {
        browserReadyMs,
        navigationMs,
        afterLoadWaitMs: xNavigationConfig.afterLoadWaitMs,
        shellWaitMs,
        markerScanMs,
        retriesUsed,
        totalMs: Date.now() - startedAt
      },
      error: null,
      notes
    };
  } catch (error) {
    finalUrl = runtime.page?.url() || finalUrl;

    if (runtime.page) {
      try {
        pageTitle = (await runtime.page.title()) || pageTitle;
        const markerResult = await collectXTweetShellMarkers(runtime as BrowserRuntime);
        markerState = markerResult.markerState;
        markerScanMs = markerResult.markerScanMs;
      } catch {
        // Ignore secondary diagnostics failures and return what is already available.
      }
    }

    notes.push("Диагностика завершилась с ошибкой до полной валидации shell-маркеров.");
    logger.error({ err: serializeError(error) }, "X tweet shell diagnostics failed.");

    return {
      status: "error",
      navigationSucceeded,
      targetTweetUrl,
      resolvedHandle,
      tweetId,
      finalUrl,
      pageTitle,
      httpStatus,
      waitStrategy,
      detectedMarkers: getDetectedXTweetShellMarkers(markerState),
      missingMarkers: getMissingXTweetShellMarkers(markerState),
      markerState,
      timings: {
        browserReadyMs,
        navigationMs,
        afterLoadWaitMs: xNavigationConfig.afterLoadWaitMs,
        shellWaitMs,
        markerScanMs,
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

// TODO: Add isolated top-level tweet extraction after shell validation is stable.
// TODO: Add isolated metrics extraction only after top-level tweet extraction is stable.
// TODO: Add isolated reply/thread extraction after single-tweet shell and field extraction are stable.
