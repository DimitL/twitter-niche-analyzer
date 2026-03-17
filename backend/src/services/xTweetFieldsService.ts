import type { FastifyBaseLogger } from "fastify";
import { xSelectors } from "@twitter-niche-analyzer/shared";
import { browserConfig } from "../config/browserConfig.js";
import { xNavigationConfig } from "../config/xNavigationConfig.js";
import {
  getXTweetFieldsNotesSeed,
  resolveXTweetFieldsTarget,
  resolveXTweetFieldsWaitStrategy,
  xTweetFieldsConfig
} from "../config/xTweetFieldsConfig.js";
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

type XTweetFieldKey =
  | "tweetUrl"
  | "tweetId"
  | "authorHandle"
  | "authorDisplayName"
  | "publishedAt"
  | "tweetText"
  | "language";

interface XTweetFieldsOptions {
  targetUrl?: string;
  waitStrategy?: string;
}

export interface ExtractedXTweetFieldsData {
  tweetUrl: string | null;
  tweetId: string | null;
  authorHandle: string | null;
  authorDisplayName: string | null;
  publishedAt: string | null;
  tweetText: string | null;
  language: string | null;
}

interface XTweetFieldsTimings {
  browserReadyMs: number;
  navigationMs: number;
  afterLoadWaitMs: number;
  shellWaitMs: number;
  extractionMs: number;
  retriesUsed: number;
  totalMs: number;
}

interface XTweetFieldsErrorDetails {
  name: string;
  message: string;
}

export interface XTweetFieldsDiagnostics {
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
  extractedData: ExtractedXTweetFieldsData;
  timings: XTweetFieldsTimings;
  error: XTweetFieldsErrorDetails | null;
  notes: string[];
}

const fieldLabels: Record<XTweetFieldKey, string> = {
  tweetUrl: "tweetUrl",
  tweetId: "tweetId",
  authorHandle: "authorHandle",
  authorDisplayName: "authorDisplayName",
  publishedAt: "publishedAt",
  tweetText: "tweetText",
  language: "language"
};

const successBaselineFieldKeys: XTweetFieldKey[] = [
  "tweetUrl",
  "tweetId",
  "authorHandle",
  "publishedAt"
];

function createEmptyExtractedData(): ExtractedXTweetFieldsData {
  return {
    tweetUrl: null,
    tweetId: null,
    authorHandle: null,
    authorDisplayName: null,
    publishedAt: null,
    tweetText: null,
    language: null
  };
}

function serializeError(error: unknown): XTweetFieldsErrorDetails {
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

function getDetectedFields(extractedData: ExtractedXTweetFieldsData) {
  return (Object.entries(extractedData) as [XTweetFieldKey, string | null][])
    .filter(([, value]) => Boolean(value))
    .map(([key]) => fieldLabels[key]);
}

function getMissingFields(extractedData: ExtractedXTweetFieldsData) {
  return (Object.entries(extractedData) as [XTweetFieldKey, string | null][])
    .filter(([, value]) => !value)
    .map(([key]) => fieldLabels[key]);
}

function hasSuccessfulTopLevelExtraction(extractedData: ExtractedXTweetFieldsData) {
  return successBaselineFieldKeys.every((key) => Boolean(extractedData[key]));
}

async function waitForTweetFieldSignals(runtime: BrowserRuntime) {
  await Promise.allSettled([
    runtime.page.waitForSelector(xSelectors.post.publishedTime, {
      timeout: xTweetFieldsConfig.extractionTimeoutMs
    }),
    runtime.page.waitForSelector(xSelectors.post.authorShellBlock, {
      timeout: xTweetFieldsConfig.extractionTimeoutMs
    }),
    runtime.page.waitForSelector(xSelectors.post.tweetText, {
      timeout: xTweetFieldsConfig.extractionTimeoutMs
    })
  ]);
}

async function extractTopLevelTweetFields(runtime: BrowserRuntime) {
  const extractionStart = Date.now();
  const mainArticleLocator = runtime.page.locator(xSelectors.post.shellArticle).first();

  if ((await mainArticleLocator.count()) === 0) {
    return {
      extractedData: createEmptyExtractedData(),
      extractionMs: Date.now() - extractionStart
    };
  }

  const extractedData = await mainArticleLocator.evaluate(
    (article, selectors) => {
      const authorShellBlock = article.querySelector(selectors.authorShellBlock);
      const publishedTime = article.querySelector(selectors.publishedTime);
      const tweetTextNode = article.querySelector(selectors.tweetText);

      const canonicalTweetLink =
        publishedTime?.closest("a[href]") ??
        article.querySelector(selectors.canonicalTweetLink);
      let tweetUrl: string | null = null;

      if (canonicalTweetLink?.getAttribute("href")) {
        try {
          tweetUrl = new URL(
            canonicalTweetLink.getAttribute("href") ?? "",
            window.location.origin
          ).toString();
        } catch {
          tweetUrl = null;
        }
      }

      const tweetIdMatch = tweetUrl?.match(/\/status\/([0-9]+)/);
      const tweetId = tweetIdMatch?.[1] ?? null;

      const authorProfileLinkCandidates: string[] = [];

      for (const link of Array.from(
        authorShellBlock?.querySelectorAll(selectors.authorProfileLink) ?? []
      )) {
        const rawHref = link.getAttribute("href");

        if (!rawHref) {
          continue;
        }

        try {
          const absoluteUrl = new URL(rawHref, window.location.origin).toString();

          if (/\/[A-Za-z0-9_]{1,15}$/.test(new URL(absoluteUrl).pathname)) {
            authorProfileLinkCandidates.push(absoluteUrl);
          }
        } catch {
          // Ignore malformed author profile links and keep extracting what is available.
        }
      }

      const authorProfileUrl = authorProfileLinkCandidates[0] ?? null;
      let authorHandleFromUrl: string | null = null;

      if (authorProfileUrl) {
        try {
          const parsedAuthorProfileUrl = new URL(authorProfileUrl);
          const handleCandidate =
            parsedAuthorProfileUrl.pathname.split("/").filter(Boolean)[0] || "";

          if (/^[A-Za-z0-9_]{1,15}$/.test(handleCandidate)) {
            authorHandleFromUrl = handleCandidate;
          }
        } catch {
          authorHandleFromUrl = null;
        }
      }

      const authorTextParts: string[] = [];

      for (const node of Array.from(
        authorShellBlock?.querySelectorAll(selectors.authorTextSpan) ?? []
      )) {
        const normalizedText = node.textContent?.replace(/\s+/g, " ").trim() || "";

        if (normalizedText) {
          authorTextParts.push(normalizedText);
        }
      }

      const authorHandleFromText = authorTextParts
        .find((value) => /^@[A-Za-z0-9_]{1,15}$/.test(value))
        ?.replace(/^@/, "") ?? null;

      const authorDisplayName =
        authorTextParts.find(
          (value) =>
            !/^@[A-Za-z0-9_]{1,15}$/.test(value) &&
            value !== "·" &&
            value !== "Following" &&
            value !== "Подписки"
        ) ?? null;

      const publishedAt = publishedTime?.getAttribute("datetime")?.replace(/\s+/g, " ").trim() || null;
      const rawTweetText =
        (tweetTextNode instanceof HTMLElement ? tweetTextNode.innerText : tweetTextNode?.textContent) ??
        null;
      const tweetText =
        typeof rawTweetText === "string"
          ? rawTweetText.replace(/\s+/g, " ").trim() || null
          : null;

      const inlineLanguageNode =
        (tweetTextNode?.querySelector(selectors.tweetLanguageNode) as HTMLElement | null) ??
        ((tweetTextNode instanceof HTMLElement && tweetTextNode.matches(selectors.tweetLanguageNode)
          ? tweetTextNode
          : null) as HTMLElement | null) ??
        (article.querySelector(selectors.tweetLanguageNodeFallback) as HTMLElement | null);

      const language = inlineLanguageNode?.getAttribute("lang")?.replace(/\s+/g, " ").trim() || null;

      return {
        tweetUrl,
        tweetId,
        authorHandle: authorHandleFromText || authorHandleFromUrl,
        authorDisplayName,
        publishedAt,
        tweetText,
        language
      };
    },
    {
      authorShellBlock: xSelectors.post.authorShellBlock,
      publishedTime: xSelectors.post.publishedTime,
      tweetText: xSelectors.post.tweetText,
      canonicalTweetLink: xSelectors.post.canonicalTweetLink,
      authorProfileLink: xSelectors.post.authorProfileLink,
      authorTextSpan: xSelectors.post.authorTextSpan,
      tweetLanguageNode: xSelectors.post.tweetLanguageNode,
      tweetLanguageNodeFallback: xSelectors.post.tweetLanguageNodeFallback
    }
  );

  return {
    extractedData,
    extractionMs: Date.now() - extractionStart
  };
}

export async function runXTweetFieldsDiagnostics(
  options: XTweetFieldsOptions,
  logger: FastifyBaseLogger
): Promise<XTweetFieldsDiagnostics> {
  const startedAt = Date.now();
  const notes = getXTweetFieldsNotesSeed();
  const waitStrategy = resolveXTweetFieldsWaitStrategy(options.waitStrategy);

  let runtime: Partial<BrowserRuntime> = {};
  let targetTweetUrl: string | null = null;
  let resolvedHandle: string | null = null;
  let resolvedTweetId: string | null = null;
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
  let markerState = createEmptyXTweetShellMarkerState();

  logger.info(
    {
      targetUrl: options.targetUrl,
      waitStrategy
    },
    "Running X tweet field extraction diagnostics."
  );

  try {
    const resolvedTarget = resolveXTweetFieldsTarget(options.targetUrl);
    targetTweetUrl = resolvedTarget.targetUrl;
    resolvedHandle = resolvedTarget.normalizedHandle;
    resolvedTweetId = resolvedTarget.tweetId;

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
        `Извлечение остановлено из-за неполного tweet shell: ${missingShellMarkers.join(", ")}.`
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
          name: "XTweetFieldsShellValidationError",
          message: "Не удалось безопасно подтвердить базовый shell страницы одиночного твита X."
        },
        notes
      };
    }

    await waitForTweetFieldSignals(browserRuntime);

    const extractionResult = await extractTopLevelTweetFields(browserRuntime);
    extractedData = extractionResult.extractedData;
    extractionMs = extractionResult.extractionMs;

    if (!extractedData.tweetUrl && finalUrl) {
      extractedData.tweetUrl = finalUrl;
    }

    if (!extractedData.tweetId) {
      extractedData.tweetId = resolvedTweetId;
    }

    if (!extractedData.authorHandle) {
      extractedData.authorHandle = resolvedHandle;
    }

    if (!extractedData.language) {
      notes.push(
        "Язык может отсутствовать, если X не выставил атрибут `lang` на верхнеуровневом контейнере твита."
      );
    }

    if (!extractedData.tweetText) {
      notes.push(
        "Текст твита может отсутствовать у media-only постов или если X отрисовал контент нестандартно."
      );
    }

    if (!extractedData.authorDisplayName) {
      notes.push(
        "Display name автора не удалось надёжно подтвердить по текущему shell и он возвращён как `null`."
      );
    }

    const extractionSucceeded = hasSuccessfulTopLevelExtraction(extractedData);

    if (!extractionSucceeded) {
      notes.push("Извлечение завершилось частично: доступны не все базовые верхнеуровневые поля.");
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
            name: "XTweetFieldsPartialExtraction",
            message: "Не все базовые верхнеуровневые поля твита X удалось извлечь."
          },
      notes
    };
  } catch (error) {
    finalUrl = runtime.page?.url() || finalUrl;

    if (runtime.page) {
      try {
        pageTitle = (await runtime.page.title()) || pageTitle;
        const extractionResult = await extractTopLevelTweetFields(runtime as BrowserRuntime);
        extractedData = extractionResult.extractedData;
        extractionMs = extractionResult.extractionMs;
      } catch {
        // Ignore secondary extraction failures and return what is already available.
      }
    }

    if (!extractedData.tweetUrl) {
      extractedData.tweetUrl = finalUrl || targetTweetUrl;
    }

    if (!extractedData.tweetId) {
      extractedData.tweetId = resolvedTweetId;
    }

    if (!extractedData.authorHandle) {
      extractedData.authorHandle = resolvedHandle;
    }

    notes.push("Диагностика завершилась с ошибкой до полного завершения top-level field extraction.");
    logger.error({ err: serializeError(error) }, "X tweet field extraction failed.");

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

// TODO: Add isolated engagement metrics extraction after top-level tweet fields are stable.
// TODO: Add isolated reply parsing only after top-level tweet fields and metrics extraction are stable.
// TODO: Add isolated thread parsing only after reply parsing requirements are defined.
