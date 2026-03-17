import type { FastifyBaseLogger } from "fastify";
import { xSelectors } from "@twitter-niche-analyzer/shared";
import { browserConfig } from "../config/browserConfig.js";
import {
  getXProfileFieldsNotesSeed,
  resolveXProfileFieldsTarget,
  resolveXProfileFieldsWaitStrategy,
  xProfileFieldsConfig
} from "../config/xProfileFieldsConfig.js";
import { xNavigationConfig } from "../config/xNavigationConfig.js";
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

type XProfileFieldKey =
  | "profileUrl"
  | "handle"
  | "displayName"
  | "bio"
  | "location"
  | "websiteUrl"
  | "joinedAt"
  | "followerCount"
  | "followingCount"
  | "postCount"
  | "verifiedOrNotable";

interface XProfileFieldsOptions {
  handle?: string;
  targetUrl?: string;
  waitStrategy?: string;
}

export interface XProfileCountField {
  rawText: string | null;
  normalizedNumber: number | null;
  available: boolean;
}

export interface XProfileVerifiedOrNotableIndicators {
  available: boolean;
  hasVerifiedBadge: boolean;
  hasProfessionalCategory: boolean;
  professionalCategoryLabel: string | null;
  hasAffiliatesTab: boolean;
}

export interface ExtractedXProfileFieldsData {
  profileUrl: string | null;
  handle: string | null;
  displayName: string | null;
  bio: string | null;
  location: string | null;
  websiteUrl: string | null;
  joinedAt: string | null;
  followerCount: XProfileCountField;
  followingCount: XProfileCountField;
  postCount: XProfileCountField;
  verifiedOrNotable: XProfileVerifiedOrNotableIndicators;
}

interface XProfileFieldsTimings {
  browserReadyMs: number;
  navigationMs: number;
  afterLoadWaitMs: number;
  shellWaitMs: number;
  extractionMs: number;
  retriesUsed: number;
  totalMs: number;
}

interface XProfileFieldsErrorDetails {
  name: string;
  message: string;
}

export interface XProfileFieldsDiagnostics {
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
  extractedData: ExtractedXProfileFieldsData;
  timings: XProfileFieldsTimings;
  error: XProfileFieldsErrorDetails | null;
  notes: string[];
}

const fieldLabels: Record<XProfileFieldKey, string> = {
  profileUrl: "profileUrl",
  handle: "handle",
  displayName: "displayName",
  bio: "bio",
  location: "location",
  websiteUrl: "websiteUrl",
  joinedAt: "joinedAt",
  followerCount: "followerCount",
  followingCount: "followingCount",
  postCount: "postCount",
  verifiedOrNotable: "verifiedOrNotable"
};

const successBaselineFieldKeys: XProfileFieldKey[] = [
  "profileUrl",
  "handle",
  "displayName",
  "followerCount"
];

function normalizeText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() || null;
}

function createEmptyCountField(): XProfileCountField {
  return {
    rawText: null,
    normalizedNumber: null,
    available: false
  };
}

function createEmptyIndicators(): XProfileVerifiedOrNotableIndicators {
  return {
    available: false,
    hasVerifiedBadge: false,
    hasProfessionalCategory: false,
    professionalCategoryLabel: null,
    hasAffiliatesTab: false
  };
}

function createEmptyExtractedData(): ExtractedXProfileFieldsData {
  return {
    profileUrl: null,
    handle: null,
    displayName: null,
    bio: null,
    location: null,
    websiteUrl: null,
    joinedAt: null,
    followerCount: createEmptyCountField(),
    followingCount: createEmptyCountField(),
    postCount: createEmptyCountField(),
    verifiedOrNotable: createEmptyIndicators()
  };
}

function serializeError(error: unknown): XProfileFieldsErrorDetails {
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

function parseNormalizedNumber(rawValue: string | null) {
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

function isFieldAvailable(key: XProfileFieldKey, extractedData: ExtractedXProfileFieldsData) {
  switch (key) {
    case "profileUrl":
    case "handle":
    case "displayName":
    case "bio":
    case "location":
    case "websiteUrl":
    case "joinedAt":
      return Boolean(extractedData[key]);
    case "followerCount":
    case "followingCount":
    case "postCount":
      return extractedData[key].available;
    case "verifiedOrNotable":
      return extractedData.verifiedOrNotable.available;
  }
}

function getDetectedFields(extractedData: ExtractedXProfileFieldsData) {
  return (Object.keys(fieldLabels) as XProfileFieldKey[])
    .filter((key) => isFieldAvailable(key, extractedData))
    .map((key) => fieldLabels[key]);
}

function getMissingFields(extractedData: ExtractedXProfileFieldsData) {
  return (Object.keys(fieldLabels) as XProfileFieldKey[])
    .filter((key) => !isFieldAvailable(key, extractedData))
    .map((key) => fieldLabels[key]);
}

function hasSuccessfulProfileExtraction(extractedData: ExtractedXProfileFieldsData) {
  return successBaselineFieldKeys.every((key) => isFieldAvailable(key, extractedData));
}

function getProfileShellRootLocator(runtime: BrowserRuntime) {
  return runtime.page.locator(xSelectors.profile.shellRoot).first();
}

async function getLocatorTextOrNull(runtime: BrowserRuntime, selector: string) {
  const locator = getProfileShellRootLocator(runtime).locator(selector).first();

  if ((await locator.count()) === 0) {
    return null;
  }

  return normalizeText(await locator.textContent());
}

async function getProfileCountField(runtime: BrowserRuntime, selector: string) {
  const rawText = await getLocatorTextOrNull(runtime, selector);

  return {
    rawText,
    normalizedNumber: parseNormalizedNumber(rawText),
    available: Boolean(rawText)
  };
}

async function getProfilePostCountField(runtime: BrowserRuntime) {
  const shellRoot = getProfileShellRootLocator(runtime);

  if ((await shellRoot.count()) === 0) {
    return createEmptyCountField();
  }

  const textBlocks = (await shellRoot.locator(xSelectors.profile.headerTextBlock).allInnerTexts())
    .map((value) => normalizeText(value))
    .filter((value): value is string => Boolean(value));

  const rawText =
    textBlocks.find((value) => /\b\d[\d,.]*\s*[KMB]?\s+posts\b/i.test(value)) ?? null;

  return {
    rawText,
    normalizedNumber: parseNormalizedNumber(rawText),
    available: Boolean(rawText)
  };
}

function normalizeWebsiteUrl(rawHref: string | null, displayText: string | null) {
  if (displayText && !displayText.includes("…") && !displayText.includes("...")) {
    const normalizedDisplay = displayText.replace(/^https?:\/\//i, "");

    if (/^[A-Za-z0-9.-]+\.[A-Za-z]{2,}(\/.*)?$/.test(normalizedDisplay)) {
      return `https://${normalizedDisplay}`;
    }
  }

  if (rawHref) {
    return rawHref;
  }

  return null;
}

async function getProfileWebsiteUrl(runtime: BrowserRuntime) {
  const locator = getProfileShellRootLocator(runtime).locator(xSelectors.profile.url).first();

  if ((await locator.count()) === 0) {
    return null;
  }

  const [href, text] = await Promise.all([
    locator.getAttribute("href"),
    locator.textContent()
  ]);

  return normalizeWebsiteUrl(normalizeText(href), normalizeText(text));
}

function parseDisplayNameFromPageTitle(pageTitle: string | null) {
  if (!pageTitle) {
    return null;
  }

  const match = pageTitle.match(/^(.*?)\s+\(@[A-Za-z0-9_]{1,15}\)\s+\/\s+X$/);
  return normalizeText(match?.[1] ?? null);
}

function parseHandleFromPageTitle(pageTitle: string | null) {
  if (!pageTitle) {
    return null;
  }

  const match = pageTitle.match(/\(@([A-Za-z0-9_]{1,15})\)/);
  return match?.[1] ?? null;
}

async function getIdentityTexts(runtime: BrowserRuntime) {
  const locator = getProfileShellRootLocator(runtime)
    .locator(xSelectors.profile.identityShell)
    .first()
    .locator(xSelectors.profile.identityTextSpan);

  const texts = await locator.allInnerTexts();

  return Array.from(
    new Set(
      texts
        .map((value) => normalizeText(value))
        .filter((value): value is string => Boolean(value))
    )
  );
}

async function getVerifiedIndicators(runtime: BrowserRuntime) {
  const shellRoot = getProfileShellRootLocator(runtime);
  const [verifiedBadgeCount, professionalCategoryText, tabsText] = await Promise.all([
    shellRoot.locator(xSelectors.profile.verifiedBadgeIcon).first().count(),
    getLocatorTextOrNull(runtime, xSelectors.profile.professionalCategory),
    getLocatorTextOrNull(runtime, xSelectors.profile.tabsShell)
  ]);

  const indicators = {
    available: false,
    hasVerifiedBadge: verifiedBadgeCount > 0,
    hasProfessionalCategory: Boolean(professionalCategoryText),
    professionalCategoryLabel: professionalCategoryText,
    hasAffiliatesTab: /affiliates/i.test(tabsText || "")
  };

  indicators.available =
    indicators.hasVerifiedBadge ||
    indicators.hasProfessionalCategory ||
    indicators.hasAffiliatesTab;

  return indicators;
}

async function waitForProfileFieldSignals(runtime: BrowserRuntime) {
  await Promise.allSettled([
    runtime.page.waitForSelector(xSelectors.profile.identityShell, {
      timeout: xProfileFieldsConfig.extractionTimeoutMs
    }),
    runtime.page.waitForSelector(xSelectors.profile.followerLink, {
      timeout: xProfileFieldsConfig.extractionTimeoutMs
    }),
    runtime.page.waitForSelector(xSelectors.profile.followingLink, {
      timeout: xProfileFieldsConfig.extractionTimeoutMs
    }),
    runtime.page.waitForSelector(xSelectors.profile.joinDate, {
      timeout: xProfileFieldsConfig.extractionTimeoutMs
    })
  ]);
}

async function extractProfileFields(
  runtime: BrowserRuntime,
  pageTitle: string | null,
  resolvedHandle: string | null
) {
  const extractionStart = Date.now();
  const extractedData = createEmptyExtractedData();
  const canonicalProfileUrl = resolvedHandle ? `https://x.com/${resolvedHandle}` : null;

  extractedData.profileUrl = canonicalProfileUrl;

  const identityTexts = await getIdentityTexts(runtime);
  const handleFromIdentity =
    identityTexts.find((value) => /^@[A-Za-z0-9_]{1,15}$/.test(value))?.replace(/^@/, "") ??
    null;

  extractedData.handle = handleFromIdentity || resolvedHandle || parseHandleFromPageTitle(pageTitle);

  extractedData.displayName =
    identityTexts.find(
      (value) =>
        !/^@[A-Za-z0-9_]{1,15}$/.test(value) &&
        value !== "Verified account" &&
        value !== "Provides details about verified accounts."
    ) ?? parseDisplayNameFromPageTitle(pageTitle);

  const [bio, location, joinedAt, websiteUrl, followerCount, followingCount, postCount, indicators] =
    await Promise.all([
      getLocatorTextOrNull(runtime, xSelectors.profile.description),
      getLocatorTextOrNull(runtime, xSelectors.profile.location),
      getLocatorTextOrNull(runtime, xSelectors.profile.joinDate),
      getProfileWebsiteUrl(runtime),
      getProfileCountField(runtime, xSelectors.profile.followerLink),
      getProfileCountField(runtime, xSelectors.profile.followingLink),
      getProfilePostCountField(runtime),
      getVerifiedIndicators(runtime)
    ]);

  extractedData.bio = bio;
  extractedData.location = location;
  extractedData.joinedAt = joinedAt;
  extractedData.websiteUrl = websiteUrl;
  extractedData.followerCount = followerCount;
  extractedData.followingCount = followingCount;
  extractedData.postCount = postCount;
  extractedData.verifiedOrNotable = indicators;

  return {
    extractedData,
    extractionMs: Date.now() - extractionStart
  };
}

export async function runXProfileFieldsDiagnostics(
  options: XProfileFieldsOptions,
  logger: FastifyBaseLogger
): Promise<XProfileFieldsDiagnostics> {
  const startedAt = Date.now();
  const notes = getXProfileFieldsNotesSeed();
  const waitStrategy = resolveXProfileFieldsWaitStrategy(options.waitStrategy);

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
  let extractedData = createEmptyExtractedData();
  let markerState = createEmptyXProfileShellMarkerState();

  logger.info(
    {
      requestedHandle,
      targetUrl: options.targetUrl,
      waitStrategy
    },
    "Running X profile field extraction diagnostics."
  );

  try {
    const resolvedTarget = resolveXProfileFieldsTarget({
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
        `Извлечение остановлено из-за неполного profile shell: ${missingShellMarkers.join(", ")}.`
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
          name: "XProfileFieldsShellValidationError",
          message: "Не удалось безопасно подтвердить базовый shell публичного профиля X."
        },
        notes
      };
    }

    await waitForProfileFieldSignals(browserRuntime);

    const extractionResult = await extractProfileFields(
      browserRuntime,
      pageTitle,
      resolvedHandle
    );
    extractedData = extractionResult.extractedData;
    extractionMs = extractionResult.extractionMs;

    if (!extractedData.profileUrl && resolvedHandle) {
      extractedData.profileUrl = `https://x.com/${resolvedHandle}`;
    }

    if (!extractedData.profileUrl) {
      extractedData.profileUrl = finalUrl || targetProfileUrl;
    }

    if (!extractedData.handle) {
      extractedData.handle = resolvedHandle;
    }

    if (!extractedData.displayName) {
      notes.push(
        "Display name профиля не удалось надёжно подтвердить по текущему identity shell и он возвращён как `null`."
      );
    }

    if (!extractedData.bio) {
      notes.push("Bio может отсутствовать, если владелец профиля не заполнил описание.");
    }

    if (!extractedData.location) {
      notes.push("Location может отсутствовать, если владелец профиля не указал географию.");
    }

    if (!extractedData.websiteUrl) {
      notes.push("Website URL может отсутствовать, если ссылка профиля не заполнена или отрисована нестандартно.");
    }

    if (!extractedData.postCount.available) {
      notes.push(
        "Post count может отсутствовать, если X не показал его в верхней шапке профиля на текущей странице."
      );
    }

    if (!extractedData.verifiedOrNotable.available) {
      notes.push(
        "Verified/notable indicators не были явно обнаружены; это не означает автоматически, что профиль не верифицирован."
      );
    }

    const extractionSucceeded = hasSuccessfulProfileExtraction(extractedData);

    if (!extractionSucceeded) {
      notes.push(
        "Извлечение завершилось частично: доступны не все базовые identity/header поля профиля."
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
            name: "XProfileFieldsPartialExtraction",
            message: "Не все базовые identity/header поля профиля X удалось извлечь."
          },
      notes
    };
  } catch (error) {
    finalUrl = runtime.page?.url() || finalUrl;

    if (runtime.page) {
      try {
        pageTitle = (await runtime.page.title()) || pageTitle;
        const extractionResult = await extractProfileFields(
          runtime as BrowserRuntime,
          pageTitle,
          resolvedHandle
        );
        extractedData = extractionResult.extractedData;
        extractionMs = extractionResult.extractionMs;
      } catch {
        // Ignore secondary extraction failures and return what is already available.
      }
    }

    if (!extractedData.profileUrl) {
      extractedData.profileUrl =
        (resolvedHandle ? `https://x.com/${resolvedHandle}` : null) || finalUrl || targetProfileUrl;
    }

    if (!extractedData.handle) {
      extractedData.handle = resolvedHandle || parseHandleFromPageTitle(pageTitle);
    }

    notes.push("Диагностика завершилась с ошибкой до полного завершения profile field extraction.");
    logger.error({ err: serializeError(error) }, "X profile field extraction failed.");

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

// TODO: Add isolated profile timeline shell validation after identity/header extraction is stable.
// TODO: Add isolated profile post collection only after timeline shell requirements are defined.
