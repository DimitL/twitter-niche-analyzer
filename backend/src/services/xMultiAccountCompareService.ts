import type { FastifyBaseLogger } from "fastify";
import type { ExtractedXProfileFieldsData } from "./xProfileFieldsService.js";
import type {
  XAccountScoreBreakdown,
  XAccountScoreDiagnostics,
  XAccountScoreFiltersApplied,
  XAccountScoreSignals
} from "./xAccountScoreService.js";
import type { RequestedXCompareAccountInput } from "../config/xMultiAccountCompareConfig.js";
import {
  getXMultiAccountCompareNotesSeed,
  resolveXMultiAccountCompareSortBy,
  resolveXMultiAccountRequestedAccounts,
  type XMultiAccountCompareSortBy
} from "../config/xMultiAccountCompareConfig.js";
import { runXAccountScoreDiagnostics } from "./xAccountScoreService.js";

interface XMultiAccountCompareOptions {
  handles?: string | string[];
  handle?: string | string[];
  targetUrls?: string | string[];
  targetUrl?: string | string[];
  waitStrategy?: string;
  limit?: string | number;
  includeUncertain?: string | boolean;
  sortBy?: string;
}

interface XMultiAccountCompareErrorDetails {
  name: string;
  message: string;
}

interface XMultiAccountCompareTimings {
  accountScoringMs: number;
  sortingMs: number;
  perAccountMs: Array<{
    label: string;
    totalMs: number;
  }>;
  totalMs: number;
}

export interface ComparedXAccountResult {
  request: RequestedXCompareAccountInput;
  status: "ok" | "partial" | "error";
  aggregationSucceeded: boolean;
  scoringSucceeded: boolean;
  profile: ExtractedXProfileFieldsData;
  filtersApplied: XAccountScoreFiltersApplied;
  accountSignals: XAccountScoreSignals;
  accountScores: XAccountScoreBreakdown;
  error: XMultiAccountCompareErrorDetails | null;
  notes: string[];
  totalMs: number;
}

interface SuccessfulXAccountComparisonSummary {
  request: RequestedXCompareAccountInput;
  profile: {
    handle: string | null;
    displayName: string | null;
    profileUrl: string | null;
  };
  status: "ok" | "partial";
  overallAccountScore: number;
  engagementEfficiencyScore: number;
  reachScore: number;
  consistencyScore: number;
  dataConfidenceScore: number;
  usablePostCount: number;
}

interface FailedXAccountComparisonSummary {
  request: RequestedXCompareAccountInput;
  status: "partial" | "error";
  aggregationSucceeded: boolean;
  scoringSucceeded: boolean;
  error: XMultiAccountCompareErrorDetails | null;
}

interface TopComparedAccountSummary {
  handle: string | null;
  displayName: string | null;
  profileUrl: string | null;
  metric: XMultiAccountCompareSortBy;
  value: number;
}

interface XMultiAccountComparisonSummary {
  totalRequestedAccounts: number;
  successfulAccounts: number;
  failedAccounts: number;
  sortBy: XMultiAccountCompareSortBy;
  topByOverall: TopComparedAccountSummary | null;
  topByEngagementEfficiency: TopComparedAccountSummary | null;
  topByReach: TopComparedAccountSummary | null;
  topByConsistency: TopComparedAccountSummary | null;
}

export interface XMultiAccountCompareDiagnostics {
  status: "ok" | "partial" | "error";
  comparisonSucceeded: boolean;
  requestedAccounts: RequestedXCompareAccountInput[];
  successfulComparisons: SuccessfulXAccountComparisonSummary[];
  failedComparisons: FailedXAccountComparisonSummary[];
  comparedAccounts: ComparedXAccountResult[];
  comparisonSummary: XMultiAccountComparisonSummary;
  timings: XMultiAccountCompareTimings;
  error: XMultiAccountCompareErrorDetails | null;
  notes: string[];
}

function serializeError(error: unknown): XMultiAccountCompareErrorDetails {
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

function createEmptyProfile(): ExtractedXProfileFieldsData {
  return {
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
}

function createEmptyFiltersApplied(): XAccountScoreFiltersApplied {
  return {
    includeUncertain: false,
    treatQuoteAsUsable: false,
    excludeFailedHydration: true,
    excludeReplies: true,
    excludeReposts: true,
    excludeQuotePosts: true,
    excludeUncertain: true,
    excludeClassificationUnavailable: true,
    discoveredCount: 0,
    hydratedCount: 0,
    usablePostCount: 0,
    excludedUncertainCount: 0,
    excludedFailedCount: 0,
    excludedReplyCount: 0,
    excludedRepostCount: 0,
    excludedQuotePostCount: 0,
    excludedClassificationUnavailableCount: 0
  };
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

function getSortableMetricValue(
  account: ComparedXAccountResult,
  sortBy: XMultiAccountCompareSortBy
) {
  return account.accountScores[sortBy];
}

function buildSuccessfulSummary(
  account: ComparedXAccountResult
): SuccessfulXAccountComparisonSummary {
  return {
    request: account.request,
    profile: {
      handle: account.profile.handle,
      displayName: account.profile.displayName,
      profileUrl: account.profile.profileUrl
    },
    status: account.status === "error" ? "partial" : account.status,
    overallAccountScore: account.accountScores.overallAccountScore,
    engagementEfficiencyScore: account.accountScores.engagementEfficiencyScore,
    reachScore: account.accountScores.reachScore,
    consistencyScore: account.accountScores.consistencyScore,
    dataConfidenceScore: account.accountScores.dataConfidenceScore,
    usablePostCount: account.filtersApplied.usablePostCount
  };
}

function buildFailedSummary(
  account: ComparedXAccountResult
): FailedXAccountComparisonSummary {
  return {
    request: account.request,
    status: account.status === "ok" ? "partial" : account.status,
    aggregationSucceeded: account.aggregationSucceeded,
    scoringSucceeded: account.scoringSucceeded,
    error: account.error
  };
}

function buildTopSummary(
  accounts: ComparedXAccountResult[],
  metric: XMultiAccountCompareSortBy
): TopComparedAccountSummary | null {
  if (accounts.length === 0) {
    return null;
  }

  const [topAccount] = [...accounts].sort((left, right) => {
    const scoreDifference = right.accountScores[metric] - left.accountScores[metric];

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    return left.request.index - right.request.index;
  });

  return {
    handle: topAccount.profile.handle,
    displayName: topAccount.profile.displayName,
    profileUrl: topAccount.profile.profileUrl,
    metric,
    value: topAccount.accountScores[metric]
  };
}

function buildEmptyComparisonSummary(
  requestedAccounts: RequestedXCompareAccountInput[],
  sortBy: XMultiAccountCompareSortBy
): XMultiAccountComparisonSummary {
  return {
    totalRequestedAccounts: requestedAccounts.length,
    successfulAccounts: 0,
    failedAccounts: requestedAccounts.length,
    sortBy,
    topByOverall: null,
    topByEngagementEfficiency: null,
    topByReach: null,
    topByConsistency: null
  };
}

async function compareSingleAccount(
  request: RequestedXCompareAccountInput,
  options: XMultiAccountCompareOptions,
  logger: FastifyBaseLogger
): Promise<ComparedXAccountResult> {
  const startedAt = Date.now();

  try {
    const result = await runXAccountScoreDiagnostics(
      {
        handle: request.source === "handle" ? request.handle || undefined : undefined,
        targetUrl:
          request.source === "targetUrl" ? request.targetUrl || undefined : undefined,
        waitStrategy: options.waitStrategy,
        limit: options.limit,
        includeUncertain: options.includeUncertain
      },
      logger
    );

    return {
      request,
      status: result.status,
      aggregationSucceeded: result.aggregationSucceeded,
      scoringSucceeded: result.scoringSucceeded,
      profile: result.profile,
      filtersApplied: result.filtersApplied,
      accountSignals: result.accountSignals,
      accountScores: result.accountScores,
      error: result.error,
      notes: result.notes,
      totalMs: result.timings.totalMs
    };
  } catch (error) {
    return {
      request,
      status: "error",
      aggregationSucceeded: false,
      scoringSucceeded: false,
      profile: createEmptyProfile(),
      filtersApplied: createEmptyFiltersApplied(),
      accountSignals: createEmptySignals(),
      accountScores: createEmptyScores(),
      error: serializeError(error),
      notes: [
        `Comparison для ${request.label} завершился исключением до возврата scoring result.`
      ],
      totalMs: Date.now() - startedAt
    };
  }
}

export async function runXMultiAccountCompareDiagnostics(
  options: XMultiAccountCompareOptions,
  logger: FastifyBaseLogger
): Promise<XMultiAccountCompareDiagnostics> {
  const startedAt = Date.now();
  const notes = getXMultiAccountCompareNotesSeed();
  let requestedAccounts: RequestedXCompareAccountInput[] = [];
  const comparedAccounts: ComparedXAccountResult[] = [];
  let accountScoringMs = 0;
  let sortingMs = 0;
  const perAccountMs: XMultiAccountCompareTimings["perAccountMs"] = [];

  try {
    const resolvedSortBy = resolveXMultiAccountCompareSortBy(options.sortBy);
    const requestedAccountsResolution = resolveXMultiAccountRequestedAccounts({
      handles: options.handles,
      handle: options.handle,
      targetUrls: options.targetUrls,
      targetUrl: options.targetUrl
    });
    requestedAccounts = requestedAccountsResolution.requestedAccounts;

    if (requestedAccountsResolution.duplicateCount > 0) {
      notes.push(
        `Удалены дублирующиеся account inputs: ${requestedAccountsResolution.duplicateCount}.`
      );
    }

    if (requestedAccountsResolution.truncatedCount > 0) {
      notes.push(
        `Список comparison inputs ограничен первыми ${requestedAccounts.length} аккаунтами; отброшено: ${requestedAccountsResolution.truncatedCount}.`
      );
    }

    logger.info(
      {
        requestedAccounts: requestedAccounts.map((account) => account.label),
        sortBy: resolvedSortBy,
        limit: options.limit
      },
      "Starting X multi-account comparison."
    );

    for (const requestedAccount of requestedAccounts) {
      const comparisonResult = await compareSingleAccount(requestedAccount, options, logger);
      comparedAccounts.push(comparisonResult);
      accountScoringMs += comparisonResult.totalMs;
      perAccountMs.push({
        label: requestedAccount.label,
        totalMs: comparisonResult.totalMs
      });
      notes.push(...prefixNotes(`account ${requestedAccount.label}`, comparisonResult.notes));
    }

    const sortingStartedAt = Date.now();
    const successfulAccounts = comparedAccounts
      .filter((account) => account.scoringSucceeded)
      .sort((left, right) => {
        const scoreDifference =
          getSortableMetricValue(right, resolvedSortBy) -
          getSortableMetricValue(left, resolvedSortBy);

        if (scoreDifference !== 0) {
          return scoreDifference;
        }

        return left.request.index - right.request.index;
      });
    const failedAccounts = comparedAccounts
      .filter((account) => !account.scoringSucceeded)
      .sort((left, right) => left.request.index - right.request.index);
    const sortedComparedAccounts = [...successfulAccounts, ...failedAccounts];
    sortingMs = Date.now() - sortingStartedAt;

    if (failedAccounts.length > 0) {
      notes.push(
        `Не все аккаунты удалось сравнить успешно: failed accounts = ${failedAccounts.length}.`
      );
    }

    notes.push(`Сортировка comparison results применена по полю \`${resolvedSortBy}\`.`);

    const comparisonSucceeded = successfulAccounts.length > 0;
    const comparisonSummary: XMultiAccountComparisonSummary = {
      totalRequestedAccounts: requestedAccounts.length,
      successfulAccounts: successfulAccounts.length,
      failedAccounts: failedAccounts.length,
      sortBy: resolvedSortBy,
      topByOverall: buildTopSummary(successfulAccounts, "overallAccountScore"),
      topByEngagementEfficiency: buildTopSummary(
        successfulAccounts,
        "engagementEfficiencyScore"
      ),
      topByReach: buildTopSummary(successfulAccounts, "reachScore"),
      topByConsistency: buildTopSummary(successfulAccounts, "consistencyScore")
    };

    const status =
      comparisonSucceeded && failedAccounts.length === 0
        ? "ok"
        : comparisonSucceeded
          ? "partial"
          : "error";

    logger.info(
      {
        requestedAccounts: requestedAccounts.length,
        successfulAccounts: successfulAccounts.length,
        failedAccounts: failedAccounts.length,
        sortBy: resolvedSortBy
      },
      "Finished X multi-account comparison."
    );

    return {
      status,
      comparisonSucceeded,
      requestedAccounts,
      successfulComparisons: successfulAccounts.map(buildSuccessfulSummary),
      failedComparisons: failedAccounts.map(buildFailedSummary),
      comparedAccounts: sortedComparedAccounts,
      comparisonSummary,
      timings: {
        accountScoringMs,
        sortingMs,
        perAccountMs,
        totalMs: Date.now() - startedAt
      },
      error:
        status === "ok"
          ? null
          : {
              name:
                status === "partial"
                  ? "XMultiAccountComparePartialResult"
                  : "XMultiAccountCompareError",
              message:
                status === "partial"
                  ? "Multi-account comparison завершён частично: часть аккаунтов не удалось скорить полностью."
                  : "Не удалось собрать даже частичный multi-account comparison result."
            },
      notes: dedupeNotes(notes)
    };
  } catch (error) {
    logger.error({ err: serializeError(error) }, "X multi-account comparison failed.");
    notes.push("Comparison завершился с ошибкой до полного завершения multi-account scoring orchestration.");
    const resolvedSortBy = resolveXMultiAccountCompareSortBy(options.sortBy);
    const successfulAccounts = comparedAccounts
      .filter((account) => account.scoringSucceeded)
      .sort((left, right) => {
        const scoreDifference =
          getSortableMetricValue(right, resolvedSortBy) -
          getSortableMetricValue(left, resolvedSortBy);

        if (scoreDifference !== 0) {
          return scoreDifference;
        }

        return left.request.index - right.request.index;
      });
    const failedAccounts = comparedAccounts
      .filter((account) => !account.scoringSucceeded)
      .sort((left, right) => left.request.index - right.request.index);

    return {
      status: "error",
      comparisonSucceeded: successfulAccounts.length > 0,
      requestedAccounts,
      successfulComparisons: successfulAccounts.map(buildSuccessfulSummary),
      failedComparisons: failedAccounts.map(buildFailedSummary),
      comparedAccounts: [...successfulAccounts, ...failedAccounts],
      comparisonSummary:
        comparedAccounts.length === 0
          ? buildEmptyComparisonSummary(requestedAccounts, resolvedSortBy)
          : {
              totalRequestedAccounts: requestedAccounts.length,
              successfulAccounts: successfulAccounts.length,
              failedAccounts: failedAccounts.length,
              sortBy: resolvedSortBy,
              topByOverall: buildTopSummary(successfulAccounts, "overallAccountScore"),
              topByEngagementEfficiency: buildTopSummary(
                successfulAccounts,
                "engagementEfficiencyScore"
              ),
              topByReach: buildTopSummary(successfulAccounts, "reachScore"),
              topByConsistency: buildTopSummary(successfulAccounts, "consistencyScore")
            },
      timings: {
        accountScoringMs,
        sortingMs,
        perAccountMs,
        totalMs: Date.now() - startedAt
      },
      error: serializeError(error),
      notes: dedupeNotes(notes)
    };
  }
}

// TODO: Add bounded batching or concurrency only after sequential multi-account compare is stable.
// TODO: Add automatic account discovery by topic only after manual comparison contracts are stable.
// TODO: Add niche-level aggregation only after multi-account scoring signals are validated.
// TODO: Improve reply/repost classification before using comparison outputs for ranking workflows.
