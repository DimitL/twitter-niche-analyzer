import type { FastifyBaseLogger } from "fastify";
import type { Locator } from "playwright";
import { xSelectors } from "@twitter-niche-analyzer/shared";
import { browserConfig } from "../config/browserConfig.js";
import { xNavigationConfig } from "../config/xNavigationConfig.js";
import {
  getXProfileTimelineUrlsNotesSeed,
  resolveXProfileTimelineUrlsLimit,
  resolveXProfileTimelineUrlsTarget,
  resolveXProfileTimelineUrlsWaitStrategy,
  xProfileTimelineUrlsConfig
} from "../config/xProfileTimelineUrlsConfig.js";
import { xProfileShellConfig } from "../config/xProfileShellConfig.js";
import {
  closeBrowserRuntime,
  createBrowserRuntime,
  type BrowserRuntime
} from "./browserBootstrapService.js";
import {
  collectXProfileShellMarkers,
  createEmptyXProfileShellMarkerState,
  getMissingXProfileShellMarkers,
  hasRequiredXProfileShell,
  waitForXProfileShellSignals
} from "./xProfilePageShellService.js";

type XProfileTimelineUrlFieldKey =
  | "profileUrl"
  | "tweetUrl"
  | "tweetId"
  | "authorHandle"
  | "sortIndex"
  | "isPinned";

interface XProfileTimelineUrlsOptions {
  handle?: string;
  targetUrl?: string;
  waitStrategy?: string;
  limit?: string | number;
}

export interface DiscoveredXProfileTimelineTweetRef {
  tweetUrl: string | null;
  tweetId: string | null;
  authorHandle: string | null;
  sortIndex: number;
  isPinned: boolean;
  isReplyOrRepostUncertain: boolean;
  uncertaintyReasons: string[];
  evidenceMarkers: string[];
  additionalStatusLinkCount: number;
}

export interface ExtractedXProfileTimelineUrlsData {
  profileUrl: string | null;
  requestedLimit: number;
  appliedLimit: number;
  discoveredCount: number;
  items: DiscoveredXProfileTimelineTweetRef[];
}

interface XProfileTimelineUrlsTimings {
  browserReadyMs: number;
  navigationMs: number;
  afterLoadWaitMs: number;
  shellWaitMs: number;
  extractionMs: number;
  retriesUsed: number;
  totalMs: number;
}

interface XProfileTimelineUrlsErrorDetails {
  name: string;
  message: string;
}

export interface XProfileTimelineUrlsDiagnostics {
  status: "ok" | "partial" | "error";
  navigationSucceeded: boolean;
  extractionSucceeded: boolean;
  requestedHandle: string | null;
  resolvedHandle: string | null;
  targetProfileUrl: string | null;
  finalUrl: string | null;
  pageTitle: string | null;
  httpStatus: number | null;
  waitStrategy: string;
  detectedFields: string[];
  missingFields: string[];
  extractedData: ExtractedXProfileTimelineUrlsData;
  timings: XProfileTimelineUrlsTimings;
  error: XProfileTimelineUrlsErrorDetails | null;
  notes: string[];
}

const fieldLabels: Record<XProfileTimelineUrlFieldKey, string> = {
  profileUrl: "profileUrl",
  tweetUrl: "tweetUrl",
  tweetId: "tweetId",
  authorHandle: "authorHandle",
  sortIndex: "sortIndex",
  isPinned: "isPinned"
};

function createEmptyExtractedData(limit: number): ExtractedXProfileTimelineUrlsData {
  return {
    profileUrl: null,
    requestedLimit: limit,
    appliedLimit: limit,
    discoveredCount: 0,
    items: []
  };
}

function serializeError(error: unknown): XProfileTimelineUrlsErrorDetails {
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

function hasAvailableField(
  key: XProfileTimelineUrlFieldKey,
  extractedData: ExtractedXProfileTimelineUrlsData
) {
  switch (key) {
    case "profileUrl":
      return Boolean(extractedData.profileUrl);
    case "tweetUrl":
      return extractedData.items.some((item) => Boolean(item.tweetUrl));
    case "tweetId":
      return extractedData.items.some((item) => Boolean(item.tweetId));
    case "authorHandle":
      return extractedData.items.some((item) => Boolean(item.authorHandle));
    case "sortIndex":
      return extractedData.items.length > 0;
    case "isPinned":
      return extractedData.items.length > 0;
  }
}

function getDetectedFields(extractedData: ExtractedXProfileTimelineUrlsData) {
  return (Object.keys(fieldLabels) as XProfileTimelineUrlFieldKey[])
    .filter((key) => hasAvailableField(key, extractedData))
    .map((key) => fieldLabels[key]);
}

function getMissingFields(extractedData: ExtractedXProfileTimelineUrlsData) {
  return (Object.keys(fieldLabels) as XProfileTimelineUrlFieldKey[])
    .filter((key) => !hasAvailableField(key, extractedData))
    .map((key) => fieldLabels[key]);
}

function hasSuccessfulTimelineDiscovery(extractedData: ExtractedXProfileTimelineUrlsData) {
  return extractedData.items.some((item) => Boolean(item.tweetUrl) && Boolean(item.tweetId));
}

function normalizeText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() || null;
}

function normalizeStatusUrl(rawHref: string | null, currentPageUrl: string) {
  if (!rawHref) {
    return null;
  }

  try {
    const currentUrl = new URL(currentPageUrl);
    return new URL(rawHref, currentUrl.origin).toString();
  } catch {
    return null;
  }
}

function extractTweetPartsFromUrl(tweetUrl: string | null) {
  if (!tweetUrl) {
    return {
      authorHandle: null,
      tweetId: null
    };
  }

  try {
    const parsedUrl = new URL(tweetUrl);
    const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);

    if (pathSegments.length < 3 || pathSegments[1].toLowerCase() !== "status") {
      return {
        authorHandle: null,
        tweetId: null
      };
    }

    return {
      authorHandle: /^[A-Za-z0-9_]{1,15}$/.test(pathSegments[0]) ? pathSegments[0] : null,
      tweetId: /^[0-9]+$/.test(pathSegments[2]) ? pathSegments[2] : null
    };
  } catch {
    return {
      authorHandle: null,
      tweetId: null
    };
  }
}

function computeTimelineScanLimit(limit: number) {
  return Math.min(Math.max(limit * 4, limit + 5), 60);
}

function countDistinctRelatedStatusLinks(statusUrls: string[], canonicalTweetId: string | null) {
  if (!canonicalTweetId) {
    return 0;
  }

  const relatedTweetIds = statusUrls
    .map((statusUrl) => extractTweetPartsFromUrl(statusUrl).tweetId)
    .filter((tweetId): tweetId is string => Boolean(tweetId) && tweetId !== canonicalTweetId);

  return new Set(relatedTweetIds).size;
}

async function getTimelineCanonicalHref(articleLocator: Locator) {
  const timeLocator = articleLocator.locator(xSelectors.profile.timelinePublishedTime).first();

  if ((await timeLocator.count()) > 0) {
    const hrefFromTime = await timeLocator.evaluate(
      (timeElement) => timeElement.closest("a[href]")?.getAttribute("href") ?? null
    );

    if (hrefFromTime) {
      return hrefFromTime;
    }
  }

  const statusLinkLocator = articleLocator
    .locator(xSelectors.profile.timelineStatusLink)
    .first();

  if ((await statusLinkLocator.count()) === 0) {
    return null;
  }

  return statusLinkLocator.getAttribute("href");
}

async function getTimelineStatusUrls(articleLocator: Locator, currentPageUrl: string) {
  const statusLinkLocator = articleLocator.locator(xSelectors.profile.timelineStatusLink);

  if ((await statusLinkLocator.count()) === 0) {
    return [];
  }

  const rawHrefs = await statusLinkLocator.evaluateAll((links) =>
    links
      .map((link) => link.getAttribute("href"))
      .filter((value): value is string => Boolean(value))
  );

  const normalizedUrls = rawHrefs
    .map((href) => normalizeStatusUrl(href, currentPageUrl))
    .filter((value): value is string => Boolean(value));

  return Array.from(new Set(normalizedUrls));
}

async function getTimelineSocialContextText(articleLocator: Locator) {
  const locator = articleLocator.locator(xSelectors.profile.timelineSocialContext).first();

  if ((await locator.count()) === 0) {
    return null;
  }

  return normalizeText(await locator.textContent());
}

async function waitForTimelineDiscoverySignals(runtime: BrowserRuntime) {
  await Promise.allSettled([
    runtime.page.waitForSelector(xSelectors.profile.tweetArticleShell, {
      timeout: xProfileTimelineUrlsConfig.extractionTimeoutMs
    }),
    runtime.page.waitForSelector(xSelectors.profile.timelinePublishedTime, {
      timeout: xProfileTimelineUrlsConfig.extractionTimeoutMs
    }),
    runtime.page.waitForSelector(xSelectors.profile.timelineStatusLink, {
      timeout: xProfileTimelineUrlsConfig.extractionTimeoutMs
    })
  ]);
}

async function discoverTimelineTweetRefs(
  runtime: BrowserRuntime,
  resolvedHandle: string | null,
  limit: number
) {
  const extractionStart = Date.now();
  const shellRoot = runtime.page.locator(xSelectors.profile.shellRoot).first();
  const articleLocators = shellRoot.locator(xSelectors.profile.tweetArticleShell);
  const articleCount = await articleLocators.count();
  const scanLimit = Math.min(articleCount, computeTimelineScanLimit(limit));
  const preferredItems: Omit<DiscoveredXProfileTimelineTweetRef, "sortIndex">[] = [];
  const uncertainItems: Omit<DiscoveredXProfileTimelineTweetRef, "sortIndex">[] = [];
  const seenTweetUrls = new Set<string>();

  for (
    let articleIndex = 0;
    articleIndex < scanLimit && preferredItems.length < limit;
    articleIndex += 1
  ) {
    const articleLocator = articleLocators.nth(articleIndex);
    const [canonicalHref, socialContextText, articleText] = await Promise.all([
      getTimelineCanonicalHref(articleLocator),
      getTimelineSocialContextText(articleLocator),
      articleLocator.textContent().then((value) => normalizeText(value))
    ]);

    const tweetUrl = normalizeStatusUrl(canonicalHref, runtime.page.url());
    const statusUrls = await getTimelineStatusUrls(articleLocator, runtime.page.url());
    const { authorHandle, tweetId } = extractTweetPartsFromUrl(tweetUrl);

    if (!tweetUrl || !tweetId || seenTweetUrls.has(tweetUrl)) {
      continue;
    }

    seenTweetUrls.add(tweetUrl);

    const uncertaintyReasons: string[] = [];
    const evidenceMarkers: string[] = [];
    const normalizedSocialContext = socialContextText?.toLowerCase() || "";
    const normalizedArticleText = articleText?.toLowerCase() || "";
    const isPinned =
      normalizedSocialContext.includes("pinned") ||
      normalizedArticleText.includes("pinned");
    const additionalStatusLinkCount = countDistinctRelatedStatusLinks(statusUrls, tweetId);

    if (isPinned) {
      evidenceMarkers.push("pinnedItem");
    }

    if (socialContextText && !normalizedSocialContext.includes("pinned")) {
      uncertaintyReasons.push("socialContextPresent");
      evidenceMarkers.push("socialContextPresent");
    }

    if (normalizedArticleText.includes("replying to")) {
      uncertaintyReasons.push("replyingContextVisible");
      evidenceMarkers.push("replyingContextVisible");
    }

    if (
      resolvedHandle &&
      authorHandle &&
      authorHandle.toLowerCase() !== resolvedHandle.toLowerCase()
    ) {
      uncertaintyReasons.push("authorHandleMismatch");
      evidenceMarkers.push("authorHandleMismatch");
    }

    if (additionalStatusLinkCount > 0) {
      evidenceMarkers.push("additionalStatusLinkVisible");
    }

    const discoveredItem = {
      tweetUrl,
      tweetId,
      authorHandle,
      isPinned,
      isReplyOrRepostUncertain: uncertaintyReasons.length > 0,
      uncertaintyReasons,
      evidenceMarkers,
      additionalStatusLinkCount
    };

    if (discoveredItem.isReplyOrRepostUncertain) {
      uncertainItems.push(discoveredItem);
      continue;
    }

    preferredItems.push(discoveredItem);
  }

  const discoveredItems = [...preferredItems, ...uncertainItems]
    .slice(0, limit)
    .map((item, index) => ({
      ...item,
      sortIndex: index
    }));

  return {
    extractedData: {
      profileUrl: resolvedHandle ? `https://x.com/${resolvedHandle}` : runtime.page.url(),
      requestedLimit: limit,
      appliedLimit: limit,
      discoveredCount: discoveredItems.length,
      items: discoveredItems
    },
    extractionMs: Date.now() - extractionStart,
    scannedArticleCount: scanLimit,
    skippedUncertainCount: Math.max(
      uncertainItems.length - Math.max(limit - preferredItems.length, 0),
      0
    )
  };
}

export async function runXProfileTimelineUrlsDiagnostics(
  options: XProfileTimelineUrlsOptions,
  logger: FastifyBaseLogger
): Promise<XProfileTimelineUrlsDiagnostics> {
  const startedAt = Date.now();
  const requestedLimit = resolveXProfileTimelineUrlsLimit(options.limit);
  const notes = getXProfileTimelineUrlsNotesSeed();
  const waitStrategy = resolveXProfileTimelineUrlsWaitStrategy(options.waitStrategy);

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
  let extractionMs = 0;
  let retriesUsed = 0;
  let navigationSucceeded = false;
  let extractedData = createEmptyExtractedData(requestedLimit);
  let markerState = createEmptyXProfileShellMarkerState();

  logger.info(
    {
      requestedHandle,
      targetUrl: options.targetUrl,
      waitStrategy,
      requestedLimit
    },
    "Running X profile timeline URL discovery diagnostics."
  );

  try {
    const resolvedTarget = resolveXProfileTimelineUrlsTarget({
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

    if (resolvedTarget.resolutionSource === "defaultTargetUrl") {
      notes.push("Использован URL профиля по умолчанию из конфигурации.");
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
      await waitForXProfileShellSignals(browserRuntime);

      const markerResult = await collectXProfileShellMarkers(browserRuntime);
      markerState = markerResult.markerState;

      if (hasRequiredXProfileShell(markerState)) {
        break;
      }

      if (attemptIndex < xProfileShellConfig.retryCount) {
        retriesUsed += 1;
        await browserRuntime.page.waitForTimeout(xProfileShellConfig.retryDelayMs);
      }
    }

    shellWaitMs = Date.now() - shellWaitStart;

    if (retriesUsed > 0) {
      notes.push(`Для стабилизации profile shell выполнено повторных попыток: ${retriesUsed}.`);
    }

    if (!hasRequiredXProfileShell(markerState)) {
      const missingShellMarkers = getMissingXProfileShellMarkers(markerState);
      notes.push(
        `Discovery остановлен из-за неполного profile shell: ${missingShellMarkers.join(", ")}.`
      );

      return {
        status: "error",
        navigationSucceeded,
        extractionSucceeded: false,
        requestedHandle,
        resolvedHandle,
        targetProfileUrl,
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
          name: "XProfileTimelineUrlsShellValidationError",
          message: "Не удалось безопасно подтвердить базовый shell публичного профиля X."
        },
        notes
      };
    }

    await waitForTimelineDiscoverySignals(browserRuntime);

    const discoveryResult = await discoverTimelineTweetRefs(
      browserRuntime,
      resolvedHandle,
      requestedLimit
    );
    extractedData = discoveryResult.extractedData;
    extractionMs = discoveryResult.extractionMs;

    if (discoveryResult.scannedArticleCount === 0) {
      notes.push("На текущем экране не найдено ни одного видимого tweet/article shell для discovery URL.");
    }

    if (discoveryResult.skippedUncertainCount > 0) {
      notes.push(
        `Некоторые uncertain timeline items были пропущены, потому что найдены более надёжные top-level candidates: ${discoveryResult.skippedUncertainCount}.`
      );
    }

    if (extractedData.discoveredCount < requestedLimit) {
      notes.push(
        `Обнаружено ${extractedData.discoveredCount} URL при requested limit ${requestedLimit}.`
      );
    }

    const uncertainItemsCount = extractedData.items.filter(
      (item) => item.isReplyOrRepostUncertain
    ).length;

    if (uncertainItemsCount > 0) {
      notes.push(
        `Часть элементов помечена как uncertain (${uncertainItemsCount}), потому что repost/reply пока фильтруются нестрого.`
      );
    }

    const extractionSucceeded = hasSuccessfulTimelineDiscovery(extractedData);

    if (!extractionSucceeded) {
      notes.push(
        "Discovery завершился частично: не удалось надёжно собрать ни одного полноценного tweet URL + tweetId."
      );
    }

    return {
      status: extractionSucceeded ? "ok" : "partial",
      navigationSucceeded,
      extractionSucceeded,
      requestedHandle,
      resolvedHandle,
      targetProfileUrl,
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
            name: "XProfileTimelineUrlsPartialExtraction",
            message: "Не удалось надёжно собрать недавние tweet URL из публичной ленты профиля X."
          },
      notes
    };
  } catch (error) {
    finalUrl = runtime.page?.url() || finalUrl;

    if (!extractedData.profileUrl) {
      extractedData.profileUrl =
        (resolvedHandle ? `https://x.com/${resolvedHandle}` : null) || finalUrl || targetProfileUrl;
    }

    notes.push("Диагностика завершилась с ошибкой до полного завершения profile timeline URL discovery.");
    logger.error({ err: serializeError(error) }, "X profile timeline URL discovery failed.");

    return {
      status: "error",
      navigationSucceeded,
      extractionSucceeded: false,
      requestedHandle,
      resolvedHandle,
      targetProfileUrl,
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

// TODO: Filter reposts and replies more reliably after the timeline-shell step is stable.
// TODO: Add per-item timeline field extraction after URL discovery requirements are stable.
// TODO: Add per-item timeline metric collection only after per-item field extraction is stable.
