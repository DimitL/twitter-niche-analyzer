import type { FastifyBaseLogger } from "fastify";
import { xSelectors } from "@twitter-niche-analyzer/shared";
import {
  closeBrowserRuntime,
  createBrowserRuntime,
  type BrowserRuntime
} from "./browserBootstrapService.js";
import { browserConfig } from "../config/browserConfig.js";
import {
  resolveXTargetUrl,
  resolveXWaitStrategy,
  xNavigationConfig,
  type XWaitStrategy
} from "../config/xNavigationConfig.js";

interface XBootstrapOptions {
  targetUrl?: string;
  waitStrategy?: string;
}

interface XPageMarkers {
  hasAppShell: boolean;
  hasPrimaryColumn: boolean;
  hasProfileHeader: boolean;
  hasTweetArticle: boolean;
  hasLoginLink: boolean;
  hasSideNav: boolean;
  hasErrorDetail: boolean;
}

interface XMarkerScanResult extends XPageMarkers {
  markerScanMs: number;
}

interface XBootstrapTimings {
  browserReadyMs: number;
  navigationMs: number;
  afterLoadWaitMs: number;
  markerScanMs: number;
  totalMs: number;
}

interface XBootstrapErrorDetails {
  name: string;
  message: string;
}

export interface XBootstrapDiagnostics {
  status: "ok" | "error";
  navigationSucceeded: boolean;
  requestedUrl: string;
  resolvedTargetUrl: string | null;
  finalUrl: string | null;
  waitStrategy: XWaitStrategy;
  pageTitle: string | null;
  httpStatus: number | null;
  markers: XPageMarkers;
  timings: XBootstrapTimings;
  authSessionConfigured: boolean;
  diagnosticsCheckedAt: string;
  error: XBootstrapErrorDetails | null;
}

function createEmptyMarkers(): XPageMarkers {
  return {
    hasAppShell: false,
    hasPrimaryColumn: false,
    hasProfileHeader: false,
    hasTweetArticle: false,
    hasLoginLink: false,
    hasSideNav: false,
    hasErrorDetail: false
  };
}

function serializeError(error: unknown): XBootstrapErrorDetails {
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

async function hasMatch(
  runtime: BrowserRuntime,
  selector: string
): Promise<boolean> {
  return (await runtime.page.locator(selector).first().count()) > 0;
}

async function collectXPageMarkers(
  runtime: BrowserRuntime
): Promise<XMarkerScanResult> {
  const markerStart = Date.now();

  const [
    hasAppShell,
    hasPrimaryColumn,
    hasProfileHeader,
    hasTweetArticle,
    hasLoginLink,
    hasSideNav,
    hasErrorDetail
  ] = await Promise.all([
    hasMatch(runtime, xSelectors.navigation.appShell),
    hasMatch(runtime, xSelectors.navigation.primaryColumn),
    hasMatch(runtime, xSelectors.navigation.profileHeader),
    hasMatch(runtime, xSelectors.navigation.tweetArticle),
    hasMatch(runtime, xSelectors.navigation.loginLink),
    hasMatch(runtime, xSelectors.navigation.sideNav),
    hasMatch(runtime, xSelectors.navigation.errorDetail)
  ]);

  return {
    hasAppShell,
    hasPrimaryColumn,
    hasProfileHeader,
    hasTweetArticle,
    hasLoginLink,
    hasSideNav,
    hasErrorDetail,
    markerScanMs: Date.now() - markerStart
  };
}

export async function runXBootstrapDiagnostics(
  options: XBootstrapOptions,
  logger: FastifyBaseLogger
): Promise<XBootstrapDiagnostics> {
  const startedAt = Date.now();
  const requestedUrl = options.targetUrl?.trim() || xNavigationConfig.defaultTargetUrl;
  const waitStrategy = resolveXWaitStrategy(options.waitStrategy);

  let resolvedTargetUrl: string | null = null;
  let runtime: Partial<BrowserRuntime> = {};
  let browserReadyMs = 0;
  let navigationMs = 0;
  let markerScanMs = 0;
  let pageTitle: string | null = null;
  let httpStatus: number | null = null;
  let finalUrl: string | null = null;
  let markers = createEmptyMarkers();

  logger.info(
    {
      requestedUrl,
      waitStrategy
    },
    "Running X bootstrap diagnostics."
  );

  try {
    resolvedTargetUrl = resolveXTargetUrl(options.targetUrl);

    const browserStart = Date.now();
    const browserRuntime = await createBrowserRuntime(logger);
    runtime = browserRuntime;
    browserReadyMs = Date.now() - browserStart;

    const navigationStart = Date.now();
    const response = await browserRuntime.page.goto(resolvedTargetUrl, {
      waitUntil: waitStrategy,
      timeout: browserConfig.navigationTimeoutMs
    });
    navigationMs = Date.now() - navigationStart;

    if (xNavigationConfig.afterLoadWaitMs > 0) {
      await browserRuntime.page.waitForTimeout(xNavigationConfig.afterLoadWaitMs);
    }

    pageTitle = (await browserRuntime.page.title()) || null;
    httpStatus = response?.status() ?? null;
    finalUrl = browserRuntime.page.url();

    const markerResult = await collectXPageMarkers(browserRuntime);
    markerScanMs = markerResult.markerScanMs;
    markers = {
      hasAppShell: markerResult.hasAppShell,
      hasPrimaryColumn: markerResult.hasPrimaryColumn,
      hasProfileHeader: markerResult.hasProfileHeader,
      hasTweetArticle: markerResult.hasTweetArticle,
      hasLoginLink: markerResult.hasLoginLink,
      hasSideNav: markerResult.hasSideNav,
      hasErrorDetail: markerResult.hasErrorDetail
    };

    return {
      status: "ok",
      navigationSucceeded: true,
      requestedUrl,
      resolvedTargetUrl,
      finalUrl,
      waitStrategy,
      pageTitle,
      httpStatus,
      markers,
      timings: {
        browserReadyMs,
        navigationMs,
        afterLoadWaitMs: xNavigationConfig.afterLoadWaitMs,
        markerScanMs,
        totalMs: Date.now() - startedAt
      },
      authSessionConfigured: xNavigationConfig.auth.sessionEnabled,
      diagnosticsCheckedAt: new Date().toISOString(),
      error: null
    };
  } catch (error) {
    finalUrl = runtime.page?.url() || finalUrl;

    if (runtime.page) {
      try {
        pageTitle = (await runtime.page.title()) || pageTitle;
        const markerResult = await collectXPageMarkers(runtime as BrowserRuntime);
        markerScanMs = markerResult.markerScanMs;
        markers = {
          hasAppShell: markerResult.hasAppShell,
          hasPrimaryColumn: markerResult.hasPrimaryColumn,
          hasProfileHeader: markerResult.hasProfileHeader,
          hasTweetArticle: markerResult.hasTweetArticle,
          hasLoginLink: markerResult.hasLoginLink,
          hasSideNav: markerResult.hasSideNav,
          hasErrorDetail: markerResult.hasErrorDetail
        };
      } catch {
        // Ignore secondary diagnostics failures and return what is already available.
      }
    }

    logger.error({ err: serializeError(error) }, "X bootstrap diagnostics failed.");

    return {
      status: "error",
      navigationSucceeded: false,
      requestedUrl,
      resolvedTargetUrl,
      finalUrl,
      waitStrategy,
      pageTitle,
      httpStatus,
      markers,
      timings: {
        browserReadyMs,
        navigationMs,
        afterLoadWaitMs: xNavigationConfig.afterLoadWaitMs,
        markerScanMs,
        totalMs: Date.now() - startedAt
      },
      authSessionConfigured: xNavigationConfig.auth.sessionEnabled,
      diagnosticsCheckedAt: new Date().toISOString(),
      error: serializeError(error)
    };
  } finally {
    await closeBrowserRuntime(runtime, logger);
  }
}

// TODO: Add isolated account extraction bootstrap after public-page navigation is stable.
// TODO: Add isolated post extraction bootstrap after account bootstrap has stable markers.
