import type { FastifyBaseLogger } from "fastify";
import type { ExtractedXProfileFieldsData } from "./xProfileFieldsService.js";
import type {
  HydratedXAccountRecentPost,
  XAccountRecentPostsDiagnostics
} from "./xAccountRecentPostsService.js";
import {
  getXAccountScoreNotesSeed,
  resolveXAccountScoreIncludeUncertain,
  xAccountScoreConfig
} from "../config/xAccountScoreConfig.js";
import { runXAccountRecentPostsDiagnostics } from "./xAccountRecentPostsService.js";

interface XAccountScoreOptions {
  handle?: string;
  targetUrl?: string;
  waitStrategy?: string;
  limit?: string | number;
  includeUncertain?: string | boolean;
}

interface XAccountScoreErrorDetails {
  name: string;
  message: string;
}

interface XAccountScoreTimings {
  aggregationMs: number;
  filteringMs: number;
  scoringMs: number;
  totalMs: number;
}

export interface XAccountScoreFiltersApplied {
  includeUncertain: boolean;
  excludeFailedHydration: boolean;
  excludeUncertain: boolean;
  discoveredCount: number;
  hydratedCount: number;
  usablePostCount: number;
  excludedUncertainCount: number;
  excludedFailedCount: number;
}

export interface ScoredUsableXAccountTweet extends HydratedXAccountRecentPost {
  engagementProxy: number | null;
  engagementPerFollowerProxy: number | null;
}

export interface ExcludedXAccountTweet extends HydratedXAccountRecentPost {
  exclusionReasons: string[];
}

export interface XAccountScoreSignals {
  discoveredCount: number;
  hydratedCount: number;
  usablePostCount: number;
  excludedUncertainCount: number;
  excludedFailedCount: number;
  avgLikeCount: number | null;
  avgRepostCount: number | null;
  avgReplyCount: number | null;
  avgViewCount: number | null;
  medianLikeCount: number | null;
  medianViewCount: number | null;
  followerCount: number | null;
  avgEngagementProxy: number | null;
  avgEngagementPerFollowerProxy: number | null;
  postingDensityProxy: number | null;
  dataQualityScore: number;
}

export interface XAccountScoreBreakdown {
  engagementEfficiencyScore: number;
  consistencyScore: number;
  reachScore: number;
  dataConfidenceScore: number;
  overallAccountScore: number;
}

export interface XAccountScoreDiagnostics {
  status: "ok" | "partial" | "error";
  aggregationSucceeded: boolean;
  scoringSucceeded: boolean;
  profile: ExtractedXProfileFieldsData;
  filtersApplied: XAccountScoreFiltersApplied;
  usableTweets: ScoredUsableXAccountTweet[];
  excludedTweets: ExcludedXAccountTweet[];
  accountSignals: XAccountScoreSignals;
  accountScores: XAccountScoreBreakdown;
  timings: XAccountScoreTimings;
  error: XAccountScoreErrorDetails | null;
  notes: string[];
}

function clamp(value: number, minValue: number, maxValue: number) {
  return Math.min(Math.max(value, minValue), maxValue);
}

function roundNumber(value: number, fractionDigits = 1) {
  return Number(value.toFixed(fractionDigits));
}

function averageNumbers(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return roundNumber(values.reduce((sum, value) => sum + value, 0) / values.length, 1);
}

function medianNumbers(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  const sortedValues = [...values].sort((left, right) => left - right);
  const middleIndex = Math.floor(sortedValues.length / 2);

  if (sortedValues.length % 2 === 0) {
    return roundNumber(
      (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2,
      1
    );
  }

  return roundNumber(sortedValues[middleIndex], 1);
}

function serializeError(error: unknown): XAccountScoreErrorDetails {
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

function getMetricValueNumbers(
  tweets: ScoredUsableXAccountTweet[],
  metricKey: "replyCount" | "repostCount" | "likeCount" | "viewCount"
) {
  return tweets
    .map((tweet) => tweet[metricKey].normalizedNumber)
    .filter((value): value is number => value !== null);
}

function getEngagementProxy(tweet: HydratedXAccountRecentPost) {
  const metricValues = [
    tweet.likeCount.normalizedNumber,
    tweet.repostCount.normalizedNumber,
    tweet.replyCount.normalizedNumber
  ].filter((value): value is number => value !== null);

  if (metricValues.length === 0) {
    return null;
  }

  return metricValues.reduce((sum, value) => sum + value, 0);
}

function getEngagementPerFollowerProxy(
  engagementProxy: number | null,
  followerCount: number | null
) {
  if (
    engagementProxy === null ||
    followerCount === null ||
    !Number.isFinite(followerCount) ||
    followerCount <= 0
  ) {
    return null;
  }

  return Number((engagementProxy / followerCount).toFixed(6));
}

function createEmptySignals(): XAccountScoreSignals {
  return {
    discoveredCount: 0,
    hydratedCount: 0,
    usablePostCount: 0,
    excludedUncertainCount: 0,
    excludedFailedCount: 0,
    avgLikeCount: null,
    avgRepostCount: null,
    avgReplyCount: null,
    avgViewCount: null,
    medianLikeCount: null,
    medianViewCount: null,
    followerCount: null,
    avgEngagementProxy: null,
    avgEngagementPerFollowerProxy: null,
    postingDensityProxy: null,
    dataQualityScore: 0
  };
}

function createEmptyScores(): XAccountScoreBreakdown {
  return {
    engagementEfficiencyScore: 0,
    consistencyScore: 0,
    reachScore: 0,
    dataConfidenceScore: 0,
    overallAccountScore: 0
  };
}

function buildFiltersApplied(
  includeUncertain: boolean,
  recentPostsResult: XAccountRecentPostsDiagnostics,
  usableTweets: ScoredUsableXAccountTweet[],
  excludedTweets: ExcludedXAccountTweet[]
): XAccountScoreFiltersApplied {
  return {
    includeUncertain,
    excludeFailedHydration: true,
    excludeUncertain: !includeUncertain,
    discoveredCount: recentPostsResult.discoveredTweetRefs.items.length,
    hydratedCount: recentPostsResult.accountSummary.hydratedCount,
    usablePostCount: usableTweets.length,
    excludedUncertainCount: excludedTweets.filter((tweet) =>
      tweet.exclusionReasons.includes("uncertain")
    ).length,
    excludedFailedCount: excludedTweets.filter((tweet) =>
      tweet.exclusionReasons.includes("failedHydration")
    ).length
  };
}

function buildTweetBuckets(
  tweets: HydratedXAccountRecentPost[],
  followerCount: number | null,
  includeUncertain: boolean
) {
  const usableTweets: ScoredUsableXAccountTweet[] = [];
  const excludedTweets: ExcludedXAccountTweet[] = [];

  for (const tweet of tweets) {
    const exclusionReasons: string[] = [];

    if (tweet.hydrationStatus === "error") {
      exclusionReasons.push("failedHydration");
    }

    if (!includeUncertain && tweet.isReplyOrRepostUncertain) {
      exclusionReasons.push("uncertain");
    }

    if (exclusionReasons.length > 0) {
      excludedTweets.push({
        ...tweet,
        exclusionReasons
      });
      continue;
    }

    const engagementProxy = getEngagementProxy(tweet);
    usableTweets.push({
      ...tweet,
      engagementProxy,
      engagementPerFollowerProxy: getEngagementPerFollowerProxy(
        engagementProxy,
        followerCount
      )
    });
  }

  return {
    usableTweets,
    excludedTweets
  };
}

function computePostingDensityProxy(usableTweets: ScoredUsableXAccountTweet[]) {
  const timestamps = usableTweets
    .map((tweet) => tweet.publishedAt)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value))
    .sort((left, right) => right - left);

  if (timestamps.length === 0) {
    return null;
  }

  if (timestamps.length === 1) {
    return 1;
  }

  const newestTimestamp = timestamps[0];
  const oldestTimestamp = timestamps[timestamps.length - 1];
  const spanDays = Math.max((newestTimestamp - oldestTimestamp) / 86_400_000, 1);

  return roundNumber(timestamps.length / spanDays, 3);
}

function computeDataQualityScore(
  usableTweets: ScoredUsableXAccountTweet[],
  recentPostsResult: XAccountRecentPostsDiagnostics,
  followerCount: number | null
) {
  const discoveredCount = recentPostsResult.discoveredTweetRefs.items.length;
  const usableCoverage =
    discoveredCount > 0 ? usableTweets.length / discoveredCount : 0;
  const coreMetricCoverageDenominator = usableTweets.length * 3;
  const coreMetricCoverageNumerator = usableTweets.reduce(
    (sum, tweet) =>
      sum +
      Number(tweet.likeCount.available) +
      Number(tweet.repostCount.available) +
      Number(tweet.replyCount.available),
    0
  );
  const coreMetricCoverage =
    coreMetricCoverageDenominator > 0
      ? coreMetricCoverageNumerator / coreMetricCoverageDenominator
      : 0;
  const viewCoverage =
    usableTweets.length > 0
      ? usableTweets.filter((tweet) => tweet.viewCount.available).length / usableTweets.length
      : 0;
  const timestampCoverage =
    usableTweets.length > 0
      ? usableTweets.filter((tweet) => Boolean(tweet.publishedAt)).length / usableTweets.length
      : 0;
  const followerCoverage = followerCount ? 1 : 0;

  return roundNumber(
    100 *
      (usableCoverage * xAccountScoreConfig.dataQualityWeights.usableCoverage +
        coreMetricCoverage * xAccountScoreConfig.dataQualityWeights.coreMetricCoverage +
        viewCoverage * xAccountScoreConfig.dataQualityWeights.viewCoverage +
        followerCoverage * xAccountScoreConfig.dataQualityWeights.followerCoverage +
        timestampCoverage * xAccountScoreConfig.dataQualityWeights.timestampCoverage),
    1
  );
}

function computeConsistencyScore(usableTweets: ScoredUsableXAccountTweet[]) {
  const engagementValues = usableTweets
    .map((tweet) => tweet.engagementProxy)
    .filter((value): value is number => value !== null);

  if (engagementValues.length < 2) {
    return 35;
  }

  const meanValue =
    engagementValues.reduce((sum, value) => sum + value, 0) / engagementValues.length;

  if (meanValue <= 0) {
    return 0;
  }

  const variance =
    engagementValues.reduce((sum, value) => sum + (value - meanValue) ** 2, 0) /
    engagementValues.length;
  const standardDeviation = Math.sqrt(variance);
  const coefficientOfVariation = standardDeviation / meanValue;

  return roundNumber(clamp(100 - coefficientOfVariation * 60, 0, 100), 1);
}

function computeReachScore(
  followerCount: number | null,
  avgViewCount: number | null
) {
  const followerSignal =
    followerCount && followerCount > 0
      ? clamp((Math.log10(followerCount + 1) / 7) * 100, 0, 100)
      : null;
  const viewSignal =
    avgViewCount && avgViewCount > 0
      ? clamp((Math.log10(avgViewCount + 1) / 7) * 100, 0, 100)
      : null;

  if (followerSignal !== null && viewSignal !== null) {
    return roundNumber(followerSignal * 0.6 + viewSignal * 0.4, 1);
  }

  if (followerSignal !== null) {
    return roundNumber(followerSignal, 1);
  }

  if (viewSignal !== null) {
    return roundNumber(viewSignal, 1);
  }

  return 0;
}

function computeSignals(
  recentPostsResult: XAccountRecentPostsDiagnostics,
  filtersApplied: XAccountScoreFiltersApplied,
  usableTweets: ScoredUsableXAccountTweet[]
) {
  const followerCount = recentPostsResult.profile.followerCount.normalizedNumber;
  const likeNumbers = getMetricValueNumbers(usableTweets, "likeCount");
  const repostNumbers = getMetricValueNumbers(usableTweets, "repostCount");
  const replyNumbers = getMetricValueNumbers(usableTweets, "replyCount");
  const viewNumbers = getMetricValueNumbers(usableTweets, "viewCount");
  const engagementValues = usableTweets
    .map((tweet) => tweet.engagementProxy)
    .filter((value): value is number => value !== null);
  const avgEngagementProxy = averageNumbers(engagementValues);
  const avgEngagementPerFollowerProxy =
    avgEngagementProxy !== null && followerCount
      ? Number((avgEngagementProxy / followerCount).toFixed(6))
      : null;
  const postingDensityProxy = computePostingDensityProxy(usableTweets);
  const dataQualityScore = computeDataQualityScore(
    usableTweets,
    recentPostsResult,
    followerCount
  );

  return {
    discoveredCount: filtersApplied.discoveredCount,
    hydratedCount: filtersApplied.hydratedCount,
    usablePostCount: filtersApplied.usablePostCount,
    excludedUncertainCount: filtersApplied.excludedUncertainCount,
    excludedFailedCount: filtersApplied.excludedFailedCount,
    avgLikeCount: averageNumbers(likeNumbers),
    avgRepostCount: averageNumbers(repostNumbers),
    avgReplyCount: averageNumbers(replyNumbers),
    avgViewCount: averageNumbers(viewNumbers),
    medianLikeCount: medianNumbers(likeNumbers),
    medianViewCount: medianNumbers(viewNumbers),
    followerCount,
    avgEngagementProxy,
    avgEngagementPerFollowerProxy,
    postingDensityProxy,
    dataQualityScore
  };
}

function buildScores(
  usableTweets: ScoredUsableXAccountTweet[],
  accountSignals: XAccountScoreSignals
) {
  if (usableTweets.length === 0) {
    return createEmptyScores();
  }

  const engagementEfficiencyScore =
    accountSignals.avgEngagementPerFollowerProxy !== null
      ? roundNumber(
          clamp(
            (accountSignals.avgEngagementPerFollowerProxy /
              xAccountScoreConfig.normalizationTargets.engagementPerFollowerProxy) *
              100,
            0,
            100
          ),
          1
        )
      : accountSignals.avgEngagementProxy !== null
        ? roundNumber(
            clamp(
              (accountSignals.avgEngagementProxy /
                xAccountScoreConfig.normalizationTargets.fallbackAvgEngagementProxy) *
                100 *
                0.6,
              0,
              100
            ),
            1
          )
        : 0;
  const consistencyScore = computeConsistencyScore(usableTweets);
  const reachScore = computeReachScore(
    accountSignals.followerCount,
    accountSignals.avgViewCount
  );
  const sampleSizeScore = clamp(
    (usableTweets.length / xAccountScoreConfig.normalizationTargets.usablePostSampleSize) * 100,
    0,
    100
  );
  const dataConfidenceScore = roundNumber(
    accountSignals.dataQualityScore * 0.7 + sampleSizeScore * 0.3,
    1
  );
  const overallAccountScore = roundNumber(
    engagementEfficiencyScore * xAccountScoreConfig.scoreWeights.engagementEfficiency +
      consistencyScore * xAccountScoreConfig.scoreWeights.consistency +
      reachScore * xAccountScoreConfig.scoreWeights.reach +
      dataConfidenceScore * xAccountScoreConfig.scoreWeights.dataConfidence,
    1
  );

  return {
    engagementEfficiencyScore,
    consistencyScore,
    reachScore,
    dataConfidenceScore,
    overallAccountScore
  };
}

export async function runXAccountScoreDiagnostics(
  options: XAccountScoreOptions,
  logger: FastifyBaseLogger
): Promise<XAccountScoreDiagnostics> {
  const startedAt = Date.now();
  const notes = getXAccountScoreNotesSeed();
  const profile = {
    profileUrl: null,
    handle: null,
    displayName: null,
    bio: null,
    location: null,
    websiteUrl: null,
    joinedAt: null,
    followerCount: {
      rawText: null,
      normalizedNumber: null,
      available: false
    },
    followingCount: {
      rawText: null,
      normalizedNumber: null,
      available: false
    },
    postCount: {
      rawText: null,
      normalizedNumber: null,
      available: false
    },
    verifiedOrNotable: {
      available: false,
      hasVerifiedBadge: false,
      hasProfessionalCategory: false,
      professionalCategoryLabel: null,
      hasAffiliatesTab: false
    }
  };
  let filtersApplied: XAccountScoreFiltersApplied = {
    includeUncertain: false,
    excludeFailedHydration: true,
    excludeUncertain: true,
    discoveredCount: 0,
    hydratedCount: 0,
    usablePostCount: 0,
    excludedUncertainCount: 0,
    excludedFailedCount: 0
  };
  let usableTweets: ScoredUsableXAccountTweet[] = [];
  let excludedTweets: ExcludedXAccountTweet[] = [];
  let accountSignals = createEmptySignals();
  let accountScores = createEmptyScores();
  let aggregationMs = 0;
  let filteringMs = 0;
  let scoringMs = 0;

  try {
    const includeUncertain = resolveXAccountScoreIncludeUncertain(
      options.includeUncertain
    );

    logger.info(
      {
        handle: options.handle,
        targetUrl: options.targetUrl,
        limit: options.limit,
        includeUncertain
      },
      "Starting X account scoring."
    );

    const aggregationResult = await runXAccountRecentPostsDiagnostics(
      {
        handle: options.handle,
        targetUrl: options.targetUrl,
        waitStrategy: options.waitStrategy,
        limit: options.limit
      },
      logger
    );
    aggregationMs = aggregationResult.timings.totalMs;
    notes.push(...prefixNotes("recent-posts", aggregationResult.notes));

    const followerCount = aggregationResult.profile.followerCount.normalizedNumber;
    const filteringStartedAt = Date.now();
    const buckets = buildTweetBuckets(
      aggregationResult.hydratedTweets,
      followerCount,
      includeUncertain
    );
    usableTweets = buckets.usableTweets;
    excludedTweets = buckets.excludedTweets;
    filtersApplied = buildFiltersApplied(
      includeUncertain,
      aggregationResult,
      usableTweets,
      excludedTweets
    );
    filteringMs = Date.now() - filteringStartedAt;

    const scoringStartedAt = Date.now();
    accountSignals = computeSignals(aggregationResult, filtersApplied, usableTweets);
    accountScores = buildScores(usableTweets, accountSignals);
    scoringMs = Date.now() - scoringStartedAt;

    if (!aggregationResult.aggregationSucceeded) {
      notes.push(
        "Базовая recent-posts агрегация завершилась неполно, поэтому scoring result может быть частичным."
      );
    }

    if (!includeUncertain && filtersApplied.excludedUncertainCount > 0) {
      notes.push(
        `Из usable набора исключены uncertain items: ${filtersApplied.excludedUncertainCount}.`
      );
    }

    if (filtersApplied.excludedFailedCount > 0) {
      notes.push(
        `Из usable набора исключены failed hydration items: ${filtersApplied.excludedFailedCount}.`
      );
    }

    if (accountSignals.followerCount === null) {
      notes.push(
        "Follower count отсутствует, поэтому engagement efficiency score использует fallback по avgEngagementProxy и считается менее надёжным."
      );
    }

    const missingViewCountPosts = usableTweets.filter(
      (tweet) => !tweet.viewCount.available
    ).length;

    if (missingViewCountPosts > 0) {
      notes.push(
        `View count отсутствует у ${missingViewCountPosts} usable posts; reach score деградирует мягко и не ломает scoring route.`
      );
    }

    if (usableTweets.length < 2) {
      notes.push(
        "Usable sample меньше двух постов, поэтому consistency score остаётся предварительным."
      );
    }

    if (accountSignals.postingDensityProxy === null) {
      notes.push(
        "Posting density proxy не удалось вычислить надёжно из-за недостатка timestamp данных."
      );
    } else {
      notes.push(
        "Posting density proxy вычислен как число usable posts на день в пределах доступного timestamp span."
      );
    }

    notes.push(
      "Overall account score вычисляется явно: 40% engagement efficiency, 20% consistency, 15% reach, 25% data confidence."
    );

    const scoringSucceeded =
      aggregationResult.aggregationSucceeded && filtersApplied.usablePostCount > 0;
    const status =
      scoringSucceeded &&
      aggregationResult.status === "ok" &&
      filtersApplied.excludedFailedCount === 0
        ? "ok"
        : aggregationResult.aggregationSucceeded || filtersApplied.usablePostCount > 0
          ? "partial"
          : "error";

    logger.info(
      {
        handle: aggregationResult.profile.handle,
        usablePostCount: filtersApplied.usablePostCount,
        overallAccountScore: accountScores.overallAccountScore
      },
      "Finished X account scoring."
    );

    return {
      status,
      aggregationSucceeded: aggregationResult.aggregationSucceeded,
      scoringSucceeded,
      profile: aggregationResult.profile,
      filtersApplied,
      usableTweets,
      excludedTweets,
      accountSignals,
      accountScores,
      timings: {
        aggregationMs,
        filteringMs,
        scoringMs,
        totalMs: Date.now() - startedAt
      },
      error:
        status === "ok"
          ? null
          : {
              name:
                status === "partial"
                  ? "XAccountScorePartialResult"
                  : "XAccountScoreError",
              message:
                status === "partial"
                  ? "Single-account scoring завершился частично: часть постов была исключена или некоторые сигналы неполны."
                  : "Не удалось собрать даже частичный scoring result для публичного X-аккаунта."
            },
      notes: dedupeNotes(notes)
    };
  } catch (error) {
    logger.error({ err: serializeError(error) }, "X account scoring failed.");
    notes.push("Scoring завершился с ошибкой до полного завершения signal and score computation.");

    return {
      status: "error",
      aggregationSucceeded: false,
      scoringSucceeded: false,
      profile,
      filtersApplied,
      usableTweets,
      excludedTweets,
      accountSignals,
      accountScores,
      timings: {
        aggregationMs,
        filteringMs,
        scoringMs,
        totalMs: Date.now() - startedAt
      },
      error: serializeError(error),
      notes: dedupeNotes(notes)
    };
  }
}

// TODO: Add multi-account comparison only after single-account scoring is stable.
// TODO: Add niche-level aggregation only after multi-account scoring contracts are defined.
// TODO: Improve reply/repost filtering before promoting account scoring into discovery workflows.
// TODO: Add persistent run history only after scoring inputs and outputs are stable.
