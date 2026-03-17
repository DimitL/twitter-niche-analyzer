import type { FastifyBaseLogger } from "fastify";
import { xSelectors } from "@twitter-niche-analyzer/shared";
import { browserConfig } from "../config/browserConfig.js";
import {
  getXProfileShellNotesSeed,
  resolveXProfileTarget,
  resolveXProfileWaitStrategy,
  xProfileShellConfig
} from "../config/xProfileShellConfig.js";
import { xNavigationConfig } from "../config/xNavigationConfig.js";
import {
  closeBrowserRuntime,
  createBrowserRuntime,
  type BrowserRuntime
} from "./browserBootstrapService.js";

type XProfileShellMarkerKey =
  | "profileHeaderShell"
  | "profileIdentityShell"
  | "profileTabsShell"
  | "mainTimelineShellContainer"
  | "tweetArticleShellVisible";

interface XProfileShellOptions {
  handle?: string;
  targetUrl?: string;
  waitStrategy?: string;
}

interface XProfileShellMarkerState {
  profileHeaderShell: boolean;
  profileIdentityShell: boolean;
  profileTabsShell: boolean;
  mainTimelineShellContainer: boolean;
  tweetArticleShellVisible: boolean;
}

interface XProfileShellTimings {
  browserReadyMs: number;
  navigationMs: number;
  afterLoadWaitMs: number;
  shellWaitMs: number;
  markerScanMs: number;
  retriesUsed: number;
  totalMs: number;
}

interface XProfileShellErrorDetails {
  name: string;
  message: string;
}

export interface XProfileShellDiagnostics {
  status: "ok" | "error";
  navigationSucceeded: boolean;
  requestedHandle: string | null;
  resolvedHandle: string | null;
  targetProfileUrl: string | null;
  finalUrl: string | null;
  pageTitle: string | null;
  httpStatus: number | null;
  waitStrategy: string;
  detectedMarkers: string[];
  missingMarkers: string[];
  markerState: XProfileShellMarkerState;
  timings: XProfileShellTimings;
  error: XProfileShellErrorDetails | null;
  notes: string[];
}

const markerLabels: Record<XProfileShellMarkerKey, string> = {
  profileHeaderShell: "profileHeaderShell",
  profileIdentityShell: "profileIdentityShell",
  profileTabsShell: "profileTabsShell",
  mainTimelineShellContainer: "mainTimelineShellContainer",
  tweetArticleShellVisible: "tweetArticleShellVisible"
};

const requiredMarkerKeys: XProfileShellMarkerKey[] = [
  "profileHeaderShell",
  "profileIdentityShell",
  "profileTabsShell",
  "mainTimelineShellContainer"
];

function createEmptyMarkerState(): XProfileShellMarkerState {
  return {
    profileHeaderShell: false,
    profileIdentityShell: false,
    profileTabsShell: false,
    mainTimelineShellContainer: false,
    tweetArticleShellVisible: false
  };
}

function serializeError(error: unknown): XProfileShellErrorDetails {
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

async function hasMatch(runtime: BrowserRuntime, selector: string) {
  return (await runtime.page.locator(selector).first().count()) > 0;
}

async function collectProfileShellMarkers(runtime: BrowserRuntime) {
  const markerScanStart = Date.now();

  const [
    profileHeaderShell,
    profileIdentityShell,
    profileTabsShell,
    mainTimelineShellContainer,
    tweetArticleShellVisible
  ] = await Promise.all([
    hasMatch(runtime, xSelectors.profile.headerShell),
    hasMatch(runtime, xSelectors.profile.identityShell),
    hasMatch(runtime, xSelectors.profile.tabsShell),
    hasMatch(runtime, xSelectors.profile.timelineShellContainer),
    hasMatch(runtime, xSelectors.profile.tweetArticleShell)
  ]);

  return {
    markerState: {
      profileHeaderShell,
      profileIdentityShell,
      profileTabsShell,
      mainTimelineShellContainer,
      tweetArticleShellVisible
    },
    markerScanMs: Date.now() - markerScanStart
  };
}

function getDetectedMarkers(markerState: XProfileShellMarkerState) {
  return (Object.entries(markerState) as [XProfileShellMarkerKey, boolean][])
    .filter(([, isPresent]) => isPresent)
    .map(([key]) => markerLabels[key]);
}

function getMissingMarkers(markerState: XProfileShellMarkerState) {
  return (Object.entries(markerState) as [XProfileShellMarkerKey, boolean][])
    .filter(([, isPresent]) => !isPresent)
    .map(([key]) => markerLabels[key]);
}

function hasRequiredProfileShell(markerState: XProfileShellMarkerState) {
  return requiredMarkerKeys.every((key) => markerState[key]);
}

async function waitForProfileShellSignals(runtime: BrowserRuntime) {
  await Promise.allSettled([
    runtime.page.waitForSelector(xSelectors.profile.shellRoot, {
      timeout: xProfileShellConfig.markerTimeoutMs
    }),
    runtime.page.waitForSelector(xSelectors.profile.identityShell, {
      timeout: xProfileShellConfig.markerTimeoutMs
    }),
    runtime.page.waitForSelector(xSelectors.profile.tabsShell, {
      timeout: xProfileShellConfig.markerTimeoutMs
    })
  ]);
}

export async function runXProfileShellDiagnostics(
  options: XProfileShellOptions,
  logger: FastifyBaseLogger
): Promise<XProfileShellDiagnostics> {
  const startedAt = Date.now();
  const notes = getXProfileShellNotesSeed();
  const waitStrategy = resolveXProfileWaitStrategy(options.waitStrategy);

  let runtime: Partial<BrowserRuntime> = {};
  let requestedHandle: string | null = options.handle?.trim() || null;
  let resolvedHandle: string | null = null;
  let targetProfileUrl: string | null = null;
  let finalUrl: string | null = null;
  let pageTitle: string | null = null;
  let httpStatus: number | null = null;
  let browserReadyMs = 0;
  let navigationMs = 0;
  let shellWaitMs = 0;
  let markerScanMs = 0;
  let retriesUsed = 0;
  let markerState = createEmptyMarkerState();
  let navigationSucceeded = false;

  logger.info(
    {
      requestedHandle,
      targetUrl: options.targetUrl,
      waitStrategy
    },
    "Running X profile shell diagnostics."
  );

  try {
    const resolvedTarget = resolveXProfileTarget({
      handle: options.handle,
      targetUrl: options.targetUrl
    });

    requestedHandle = requestedHandle || resolvedTarget.requestedHandle;
    resolvedHandle = resolvedTarget.normalizedHandle;
    targetProfileUrl = resolvedTarget.targetUrl;

    if (resolvedTarget.resolutionSource === "handle") {
      notes.push("URL профиля был собран из переданного handle.");
    }

    if (resolvedTarget.resolutionSource === "defaultHandle") {
      notes.push("Использован handle по умолчанию из конфигурации.");
    }

    if (resolvedTarget.resolutionSource === "targetUrl") {
      notes.push("Использован переданный URL публичного профиля X.");
    }

    const browserStart = Date.now();
    const browserRuntime = await createBrowserRuntime(logger);
    runtime = browserRuntime;
    browserReadyMs = Date.now() - browserStart;

    const navigationStart = Date.now();
    const response = await browserRuntime.page.goto(targetProfileUrl, {
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

    for (let attemptIndex = 0; attemptIndex <= xProfileShellConfig.retryCount; attemptIndex += 1) {
      await waitForProfileShellSignals(browserRuntime);

      const markerResult = await collectProfileShellMarkers(browserRuntime);
      markerState = markerResult.markerState;
      markerScanMs = markerResult.markerScanMs;

      if (hasRequiredProfileShell(markerState)) {
        break;
      }

      if (attemptIndex < xProfileShellConfig.retryCount) {
        retriesUsed += 1;
        await browserRuntime.page.waitForTimeout(xProfileShellConfig.retryDelayMs);
      }
    }

    shellWaitMs = Date.now() - shellWaitStart;

    if (retriesUsed > 0) {
      notes.push(`Для стабилизации shell выполнено повторных попыток: ${retriesUsed}.`);
    }

    if (!markerState.tweetArticleShellVisible) {
      notes.push(
        "Маркер tweet/article shell может отсутствовать, если лента ещё не успела полностью отрисоваться."
      );
    }

    const missingMarkers = getMissingMarkers(markerState);

    if (!hasRequiredProfileShell(markerState)) {
      return {
        status: "error",
        navigationSucceeded,
        requestedHandle,
        resolvedHandle,
        targetProfileUrl,
        finalUrl,
        pageTitle,
        httpStatus,
        waitStrategy,
        detectedMarkers: getDetectedMarkers(markerState),
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
          name: "XProfileShellValidationError",
          message: "Не все обязательные shell-маркеры публичного профиля X были обнаружены."
        },
        notes
      };
    }

    return {
      status: "ok",
      navigationSucceeded,
      requestedHandle,
      resolvedHandle,
      targetProfileUrl,
      finalUrl,
      pageTitle,
      httpStatus,
      waitStrategy,
      detectedMarkers: getDetectedMarkers(markerState),
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
        const markerResult = await collectProfileShellMarkers(runtime as BrowserRuntime);
        markerState = markerResult.markerState;
        markerScanMs = markerResult.markerScanMs;
      } catch {
        // Ignore secondary diagnostics failures and return what is already available.
      }
    }

    notes.push("Диагностика завершилась с ошибкой до полной валидации shell-маркеров.");
    logger.error({ err: serializeError(error) }, "X profile shell diagnostics failed.");

    return {
      status: "error",
      navigationSucceeded,
      requestedHandle,
      resolvedHandle,
      targetProfileUrl,
      finalUrl,
      pageTitle,
      httpStatus,
      waitStrategy,
      detectedMarkers: getDetectedMarkers(markerState),
      missingMarkers: getMissingMarkers(markerState),
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

// TODO: Add isolated public profile field extraction after shell validation is stable.
// TODO: Add isolated public tweet extraction only after profile shell and tweet shell markers are stable.
