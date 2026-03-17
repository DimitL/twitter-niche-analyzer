import type { FastifyBaseLogger } from "fastify";
import type {
  DiscoveredXProfileTimelineTweetRef,
  ExtractedXProfileTimelineUrlsData
} from "./xProfileTimelineUrlsService.js";
import type {
  ExtractedXProfileFieldsData,
  XProfileCountField
} from "./xProfileFieldsService.js";
import type {
  ExtractedXTweetFieldsData,
  XTweetFieldsDiagnostics
} from "./xTweetFieldsService.js";
import type {
  ExtractedXTweetMetricsData,
  XTweetMetricValue,
  XTweetMetricsDiagnostics
} from "./xTweetMetricsService.js";
import {
  getXAccountRecentPostsNotesSeed,
  resolveXAccountRecentPostsLimit,
  resolveXAccountRecentPostsTarget,
  resolveXAccountRecentPostsWaitStrategy
} from "../config/xAccountRecentPostsConfig.js";
import { runXProfileFieldsDiagnostics } from "./xProfileFieldsService.js";
import { runXProfileTimelineUrlsDiagnostics } from "./xProfileTimelineUrlsService.js";
import { runXTweetFieldsDiagnostics } from "./xTweetFieldsService.js";
import { runXTweetMetricsDiagnostics } from "./xTweetMetricsService.js";

interface XAccountRecentPostsOptions {
  handle?: string;
  targetUrl?: string;
  waitStrategy?: string;
  limit?: string | number;
}

type HydrationStatus = "ok" | "partial" | "error";

interface XAccountRecentPostsResolvedTarget {
  requestedHandle: string | null;
  normalizedHandle: string;
  targetUrl: string;
  resolutionSource: "defaultHandle" | "handle" | "targetUrl" | "defaultTargetUrl";
}

interface XAccountRecentPostErrorDetails {
  name: string;
  message: string;
}

interface XAccountRecentPostsTimings {
  profileFieldsMs: number;
  timelineDiscoveryMs: number;
  tweetHydrationMs: number;
  perTweetHydrationMs: Array<{
    tweetUrl: string | null;
    tweetId: string | null;
    totalMs: number;
  }>;
  totalMs: number;
}

export interface HydratedXAccountRecentPost {
  sortIndex: number;
  isPinned: boolean;
  isReplyOrRepostUncertain: boolean;
  uncertaintyReasons: string[];
  tweetUrl: string | null;
  tweetId: string | null;
  authorHandle: string | null;
  authorDisplayName: string | null;
  publishedAt: string | null;
  tweetText: string | null;
  language: string | null;
  replyCount: XTweetMetricValue;
  repostCount: XTweetMetricValue;
  likeCount: XTweetMetricValue;
  bookmarkCount: XTweetMetricValue;
  viewCount: XTweetMetricValue;
  hydrationStatus: HydrationStatus;
}

export interface XAccountRecentPostsSummary {
  discoveredCount: number;
  hydratedCount: number;
  failedHydrationCount: number;
  avgLikeCount: number | null;
  avgRepostCount: number | null;
  avgReplyCount: number | null;
  avgViewCount: number | null;
  followerCount: number | null;
  simpleEngagementPerFollowerProxy: number | null;
}

export interface XAccountRecentPostsDiagnostics {
  status: "ok" | "partial" | "error";
  navigationSucceeded: boolean;
  aggregationSucceeded: boolean;
  profile: ExtractedXProfileFieldsData;
  discoveredTweetRefs: ExtractedXProfileTimelineUrlsData;
  hydratedTweets: HydratedXAccountRecentPost[];
  accountSummary: XAccountRecentPostsSummary;
  timings: XAccountRecentPostsTimings;
  error: XAccountRecentPostErrorDetails | null;
  notes: string[];
}

function createEmptyCountField(): XProfileCountField {
  return {
    rawText: null,
    normalizedNumber: null,
    available: false
  };
}

function createEmptyMetricValue(): XTweetMetricValue {
  return {
    rawText: null,
    normalizedNumber: null,
    available: false
  };
}

function createEmptyProfileData(): ExtractedXProfileFieldsData {
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
    verifiedOrNotable: {
      available: false,
      hasVerifiedBadge: false,
      hasProfessionalCategory: false,
      professionalCategoryLabel: null,
      hasAffiliatesTab: false
    }
  };
}

function createEmptyDiscoveredTweetRefs(limit: number): ExtractedXProfileTimelineUrlsData {
  return {
    profileUrl: null,
    requestedLimit: limit,
    appliedLimit: limit,
    discoveredCount: 0,
    items: []
  };
}

function createEmptyTweetFieldsData(): ExtractedXTweetFieldsData {
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

function createEmptyTweetMetricsData(): ExtractedXTweetMetricsData {
  return {
    replyCount: createEmptyMetricValue(),
    repostCount: createEmptyMetricValue(),
    likeCount: createEmptyMetricValue(),
    bookmarkCount: createEmptyMetricValue(),
    viewCount: createEmptyMetricValue()
  };
}

function serializeError(error: unknown): XAccountRecentPostErrorDetails {
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

function dedupeNotes(notes: string[]) {
  return Array.from(new Set(notes.map((note) => note.trim()).filter(Boolean)));
}

function prefixNotes(prefix: string, notes: string[]) {
  return notes.map((note) => `${prefix}: ${note}`);
}

function averageNumbers(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function pickAvailableMetricValues(
  hydratedTweets: HydratedXAccountRecentPost[],
  metricKey:
    | "replyCount"
    | "repostCount"
    | "likeCount"
    | "bookmarkCount"
    | "viewCount"
) {
  return hydratedTweets
    .map((tweet) => tweet[metricKey].normalizedNumber)
    .filter((value): value is number => value !== null);
}

function getHydrationStatus(
  fieldResult: XTweetFieldsDiagnostics | null,
  metricsResult: XTweetMetricsDiagnostics | null
): HydrationStatus {
  if (fieldResult?.status === "ok" && metricsResult?.status === "ok") {
    return "ok";
  }

  const hasAnyExtractedData = Boolean(
    fieldResult?.detectedFields.length || metricsResult?.detectedFields.length
  );

  if (hasAnyExtractedData) {
    return "partial";
  }

  return "error";
}

function buildHydratedTweet(
  discoveredRef: DiscoveredXProfileTimelineTweetRef,
  fieldResult: XTweetFieldsDiagnostics | null,
  metricsResult: XTweetMetricsDiagnostics | null
): HydratedXAccountRecentPost {
  const fieldsData = fieldResult?.extractedData ?? createEmptyTweetFieldsData();
  const metricsData = metricsResult?.extractedData ?? createEmptyTweetMetricsData();

  return {
    sortIndex: discoveredRef.sortIndex,
    isPinned: discoveredRef.isPinned,
    isReplyOrRepostUncertain: discoveredRef.isReplyOrRepostUncertain,
    uncertaintyReasons: [...discoveredRef.uncertaintyReasons],
    tweetUrl: fieldsData.tweetUrl || discoveredRef.tweetUrl,
    tweetId: fieldsData.tweetId || discoveredRef.tweetId,
    authorHandle: fieldsData.authorHandle || discoveredRef.authorHandle,
    authorDisplayName: fieldsData.authorDisplayName,
    publishedAt: fieldsData.publishedAt,
    tweetText: fieldsData.tweetText,
    language: fieldsData.language,
    replyCount: metricsData.replyCount,
    repostCount: metricsData.repostCount,
    likeCount: metricsData.likeCount,
    bookmarkCount: metricsData.bookmarkCount,
    viewCount: metricsData.viewCount,
    hydrationStatus: getHydrationStatus(fieldResult, metricsResult)
  };
}

function buildAccountSummary(
  discoveredTweetRefs: ExtractedXProfileTimelineUrlsData,
  hydratedTweets: HydratedXAccountRecentPost[],
  followerCount: number | null
): XAccountRecentPostsSummary {
  const successfulHydratedTweets = hydratedTweets.filter(
    (tweet) => tweet.hydrationStatus !== "error"
  );
  const avgLikeCount = averageNumbers(
    pickAvailableMetricValues(successfulHydratedTweets, "likeCount")
  );
  const avgRepostCount = averageNumbers(
    pickAvailableMetricValues(successfulHydratedTweets, "repostCount")
  );
  const avgReplyCount = averageNumbers(
    pickAvailableMetricValues(successfulHydratedTweets, "replyCount")
  );
  const avgViewCount = averageNumbers(
    pickAvailableMetricValues(successfulHydratedTweets, "viewCount")
  );

  const engagementSignals = successfulHydratedTweets
    .map((tweet) => [
      tweet.likeCount.normalizedNumber,
      tweet.repostCount.normalizedNumber,
      tweet.replyCount.normalizedNumber
    ])
    .map((values) => values.filter((value): value is number => value !== null))
    .filter((values) => values.length > 0)
    .map((values) => values.reduce((sum, value) => sum + value, 0));

  const avgEngagementSignal =
    engagementSignals.length > 0
      ? engagementSignals.reduce((sum, value) => sum + value, 0) / engagementSignals.length
      : null;

  const simpleEngagementPerFollowerProxy =
    followerCount && followerCount > 0 && avgEngagementSignal !== null
      ? Number((avgEngagementSignal / followerCount).toFixed(6))
      : null;

  return {
    discoveredCount: discoveredTweetRefs.items.length,
    hydratedCount: successfulHydratedTweets.length,
    failedHydrationCount: hydratedTweets.length - successfulHydratedTweets.length,
    avgLikeCount,
    avgRepostCount,
    avgReplyCount,
    avgViewCount,
    followerCount,
    simpleEngagementPerFollowerProxy
  };
}

async function hydrateTweetRef(
  discoveredRef: DiscoveredXProfileTimelineTweetRef,
  waitStrategy: string,
  logger: FastifyBaseLogger
) {
  const startedAt = Date.now();
  let fieldResult: XTweetFieldsDiagnostics | null = null;
  let metricsResult: XTweetMetricsDiagnostics | null = null;
  const notes: string[] = [];

  if (!discoveredRef.tweetUrl) {
    notes.push(
      `Hydration пропущен для элемента #${discoveredRef.sortIndex}: отсутствует tweet URL.`
    );

    return {
      hydratedTweet: buildHydratedTweet(discoveredRef, fieldResult, metricsResult),
      notes,
      totalMs: Date.now() - startedAt
    };
  }

  try {
    fieldResult = await runXTweetFieldsDiagnostics(
      {
        targetUrl: discoveredRef.tweetUrl,
        waitStrategy
      },
      logger
    );
  } catch (error) {
    notes.push(
      `Top-level tweet field extraction завершился исключением для ${discoveredRef.tweetUrl}.`
    );
    logger.error({ err: serializeError(error), tweetUrl: discoveredRef.tweetUrl }, "Tweet field hydration failed.");
  }

  try {
    metricsResult = await runXTweetMetricsDiagnostics(
      {
        targetUrl: discoveredRef.tweetUrl,
        waitStrategy
      },
      logger
    );
  } catch (error) {
    notes.push(
      `Tweet metrics extraction завершился исключением для ${discoveredRef.tweetUrl}.`
    );
    logger.error({ err: serializeError(error), tweetUrl: discoveredRef.tweetUrl }, "Tweet metrics hydration failed.");
  }

  if (fieldResult && fieldResult.status !== "ok") {
    notes.push(
      `Hydration полей твита ${discoveredRef.tweetId || discoveredRef.tweetUrl} завершён со статусом ${fieldResult.status}.`
    );
  }

  if (metricsResult && metricsResult.status !== "ok") {
    notes.push(
      `Hydration метрик твита ${discoveredRef.tweetId || discoveredRef.tweetUrl} завершён со статусом ${metricsResult.status}.`
    );
  }

  if (discoveredRef.isReplyOrRepostUncertain) {
    notes.push(
      `Tweet ${discoveredRef.tweetId || discoveredRef.tweetUrl} помечен как uncertain для reply/repost filtering.`
    );
  }

  return {
    hydratedTweet: buildHydratedTweet(discoveredRef, fieldResult, metricsResult),
    notes: [
      ...notes,
      ...prefixNotes(
        `tweet-fields ${discoveredRef.tweetId || discoveredRef.sortIndex}`,
        fieldResult?.notes ?? []
      ),
      ...prefixNotes(
        `tweet-metrics ${discoveredRef.tweetId || discoveredRef.sortIndex}`,
        metricsResult?.notes ?? []
      )
    ],
    totalMs: Date.now() - startedAt
  };
}

export async function runXAccountRecentPostsDiagnostics(
  options: XAccountRecentPostsOptions,
  logger: FastifyBaseLogger
): Promise<XAccountRecentPostsDiagnostics> {
  const startedAt = Date.now();
  const notes = getXAccountRecentPostsNotesSeed();
  let waitStrategy = "load";
  let requestedLimit = resolveXAccountRecentPostsLimit(options.limit);
  let resolvedTarget: XAccountRecentPostsResolvedTarget = {
    requestedHandle: null,
    normalizedHandle: "",
    targetUrl: "",
    resolutionSource: "handle"
  };

  let profile = createEmptyProfileData();
  let discoveredTweetRefs = createEmptyDiscoveredTweetRefs(requestedLimit);
  const hydratedTweets: HydratedXAccountRecentPost[] = [];
  const perTweetHydrationMs: XAccountRecentPostsTimings["perTweetHydrationMs"] = [];
  let profileFieldsMs = 0;
  let timelineDiscoveryMs = 0;
  let tweetHydrationMs = 0;

  try {
    waitStrategy = resolveXAccountRecentPostsWaitStrategy(options.waitStrategy);
    requestedLimit = resolveXAccountRecentPostsLimit(options.limit);
    resolvedTarget = resolveXAccountRecentPostsTarget({
      handle: options.handle,
      targetUrl: options.targetUrl
    });

    logger.info(
      {
        handle: resolvedTarget.normalizedHandle,
        targetUrl: resolvedTarget.targetUrl,
        requestedLimit
      },
      "Starting X account recent-posts aggregation."
    );

    const profileFieldsResult = await runXProfileFieldsDiagnostics(
      {
        handle: resolvedTarget.normalizedHandle,
        targetUrl: resolvedTarget.targetUrl,
        waitStrategy
      },
      logger
    );
    profileFieldsMs = profileFieldsResult.timings.totalMs;
    profile = {
      ...profileFieldsResult.extractedData,
      profileUrl:
        profileFieldsResult.extractedData.profileUrl || resolvedTarget.targetUrl,
      handle:
        profileFieldsResult.extractedData.handle || resolvedTarget.normalizedHandle
    };
    notes.push(...prefixNotes("profile-fields", profileFieldsResult.notes));

    const timelineResult = await runXProfileTimelineUrlsDiagnostics(
      {
        handle: resolvedTarget.normalizedHandle,
        targetUrl: resolvedTarget.targetUrl,
        waitStrategy,
        limit: requestedLimit
      },
      logger
    );
    timelineDiscoveryMs = timelineResult.timings.totalMs;
    discoveredTweetRefs = {
      ...timelineResult.extractedData,
      profileUrl:
        timelineResult.extractedData.profileUrl || profile.profileUrl || resolvedTarget.targetUrl
    };
    notes.push(...prefixNotes("timeline-urls", timelineResult.notes));

    for (const discoveredRef of discoveredTweetRefs.items) {
      const hydrationResult = await hydrateTweetRef(discoveredRef, waitStrategy, logger);
      hydratedTweets.push(hydrationResult.hydratedTweet);
      perTweetHydrationMs.push({
        tweetUrl: hydrationResult.hydratedTweet.tweetUrl,
        tweetId: hydrationResult.hydratedTweet.tweetId,
        totalMs: hydrationResult.totalMs
      });
      tweetHydrationMs += hydrationResult.totalMs;
      notes.push(...hydrationResult.notes);
    }

    const navigationSucceeded =
      profileFieldsResult.navigationSucceeded || timelineResult.navigationSucceeded;
    const accountSummary = buildAccountSummary(
      discoveredTweetRefs,
      hydratedTweets,
      profile.followerCount.normalizedNumber
    );
    const aggregationSucceeded =
      navigationSucceeded &&
      Boolean(profile.profileUrl || profile.handle) &&
      accountSummary.hydratedCount > 0;

    if (accountSummary.failedHydrationCount > 0) {
      notes.push(
        `Частичная гидратация: ${accountSummary.failedHydrationCount} из ${discoveredTweetRefs.items.length} tweet URL не удалось объединить полностью.`
      );
    }

    if (accountSummary.simpleEngagementPerFollowerProxy === null) {
      notes.push(
        "Simple engagement-per-follower proxy может отсутствовать, если follower count или базовые engagement signals не удалось нормализовать."
      );
    } else {
      notes.push(
        "Simple engagement-per-follower proxy вычислен как среднее `(likes + reposts + replies)` по гидратированным твитам, делённое на follower count."
      );
    }

    const allHydrationsSuccessful =
      hydratedTweets.length > 0 &&
      hydratedTweets.every((tweet) => tweet.hydrationStatus === "ok");
    const status =
      aggregationSucceeded &&
      profileFieldsResult.status === "ok" &&
      timelineResult.status === "ok" &&
      allHydrationsSuccessful
        ? "ok"
        : navigationSucceeded || hydratedTweets.length > 0 || discoveredTweetRefs.items.length > 0
          ? "partial"
          : "error";

    logger.info(
      {
        handle: profile.handle,
        discoveredCount: accountSummary.discoveredCount,
        hydratedCount: accountSummary.hydratedCount,
        failedHydrationCount: accountSummary.failedHydrationCount
      },
      "Finished X account recent-posts aggregation."
    );

    return {
      status,
      navigationSucceeded,
      aggregationSucceeded,
      profile,
      discoveredTweetRefs,
      hydratedTweets,
      accountSummary,
      timings: {
        profileFieldsMs,
        timelineDiscoveryMs,
        tweetHydrationMs,
        perTweetHydrationMs,
        totalMs: Date.now() - startedAt
      },
      error:
        status === "ok"
          ? null
          : {
              name:
                status === "partial"
                  ? "XAccountRecentPostsPartialAggregation"
                  : "XAccountRecentPostsAggregationError",
              message:
                status === "partial"
                  ? "Не все recent posts удалось гидратировать полностью, но частичные account-level данные доступны."
                  : "Не удалось собрать даже частичный recent-posts набор для публичного профиля X."
            },
      notes: dedupeNotes(notes)
    };
  } catch (error) {
    notes.push("Агрегация завершилась с ошибкой до полного завершения account-level hydration.");
    logger.error(
      {
        err: serializeError(error),
        handle: resolvedTarget.normalizedHandle,
        targetUrl: resolvedTarget.targetUrl
      },
      "X account recent-posts aggregation failed."
    );

    return {
      status: "error",
      navigationSucceeded: false,
      aggregationSucceeded: false,
      profile: {
        ...profile,
        profileUrl: profile.profileUrl || resolvedTarget.targetUrl || null,
        handle: profile.handle || resolvedTarget.normalizedHandle || null
      },
      discoveredTweetRefs,
      hydratedTweets,
      accountSummary: buildAccountSummary(
        discoveredTweetRefs,
        hydratedTweets,
        profile.followerCount.normalizedNumber
      ),
      timings: {
        profileFieldsMs,
        timelineDiscoveryMs,
        tweetHydrationMs,
        perTweetHydrationMs,
        totalMs: Date.now() - startedAt
      },
      error: serializeError(error),
      notes: dedupeNotes(notes)
    };
  }
}

// TODO: Filter reposts and replies more reliably before using timeline items in scoring.
// TODO: Add richer account-level scoring only after recent-posts aggregation is stable.
// TODO: Add lightweight batching or bounded concurrency only after baseline aggregation quality is validated.
// TODO: Integrate a persistence layer only after account-level aggregation contracts are stable.
