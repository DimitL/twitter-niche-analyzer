import type { FastifyBaseLogger } from "fastify";
import type { RequestedXCompareAccountInput } from "../config/xMultiAccountCompareConfig.js";
import type {
  RequestedXTopicBucketInput,
  XTopicBucketCompareSortBy,
  XTopicBucketInput
} from "../config/xTopicBucketCompareConfig.js";
import type { ComparedXAccountResult } from "./xMultiAccountCompareService.js";
import {
  getXTopicBucketCompareNotesSeed,
  resolveRequestedXTopicBuckets,
  resolveXTopicBucketCompareSortBy
} from "../config/xTopicBucketCompareConfig.js";
import { runXMultiAccountCompareDiagnostics } from "./xMultiAccountCompareService.js";

interface XTopicBucketCompareOptions {
  buckets?: XTopicBucketInput[];
  limit?: string | number;
  includeUncertain?: string | boolean;
  treatQuoteAsUsable?: string | boolean;
  sortBy?: string;
}

interface XTopicBucketCompareErrorDetails {
  name: string;
  message: string;
}

interface XTopicBucketCompareTimings {
  bucketComparisonMs: number;
  rankingMs: number;
  perBucketMs: Array<{
    bucketId: string;
    label: string;
    totalMs: number;
  }>;
  totalMs: number;
}

interface TopicBucketTopAccountSummary {
  handle: string | null;
  displayName: string | null;
  profileUrl: string | null;
  metric: "overallAccountScore" | "engagementEfficiencyScore";
  value: number;
  usablePostCount: number;
}

interface SuccessfulTopicBucketAccountSummary {
  request: RequestedXCompareAccountInput;
  status: "ok" | "partial";
  profile: {
    handle: string | null;
    displayName: string | null;
    profileUrl: string | null;
  };
  overallAccountScore: number;
  engagementEfficiencyScore: number;
  reachScore: number;
  consistencyScore: number;
  dataConfidenceScore: number;
  avgEngagementPerFollowerProxy: number | null;
  usablePostCount: number;
  recentTweetReferencesCount: number;
  recentTweetReferences: ComparedXAccountResult["recentTweetReferences"];
  recentTweetReferencesNote: string | null;
  bestPerformingTweetReferencesCount: number;
  bestPerformingTweetReferences:
    ComparedXAccountResult["bestPerformingTweetReferences"];
  bestPerformingTweetReferencesNote: string | null;
}

interface FailedTopicBucketAccountSummary {
  request: RequestedXCompareAccountInput;
  status: "partial" | "error";
  aggregationSucceeded: boolean;
  scoringSucceeded: boolean;
  error: XTopicBucketCompareErrorDetails | null;
}

interface XTopicBucketAccountResultsSummary {
  requestedAccountCount: number;
  successfulAccountCount: number;
  failedAccountCount: number;
  usableAccountCount: number;
}

interface XTopicBucketSignals {
  requestedAccountCount: number;
  successfulAccountCount: number;
  failedAccountCount: number;
  usableAccountCount: number;
  avgOverallAccountScore: number | null;
  avgEngagementEfficiencyScore: number | null;
  avgConsistencyScore: number | null;
  avgReachScore: number | null;
  avgDataConfidenceScore: number | null;
  avgEngagementPerFollowerProxy: number | null;
  medianOverallAccountScore: number | null;
  medianEngagementEfficiencyScore: number | null;
}

interface XTopicBucketRankingFields {
  sortBy: XTopicBucketCompareSortBy;
  sortValue: number | null;
  avgOverallAccountScore: number | null;
  avgEngagementEfficiencyScore: number | null;
  avgReachScore: number | null;
  avgConsistencyScore: number | null;
}

export interface ComparedXTopicBucketResult {
  bucket: RequestedXTopicBucketInput;
  status: "ok" | "partial" | "error";
  comparisonSucceeded: boolean;
  requestedAccounts: RequestedXCompareAccountInput[];
  successfulAccounts: SuccessfulTopicBucketAccountSummary[];
  failedAccounts: FailedTopicBucketAccountSummary[];
  accountResultsSummary: XTopicBucketAccountResultsSummary;
  bucketSignals: XTopicBucketSignals;
  bucketRankingFields: XTopicBucketRankingFields;
  topAccounts: {
    topByOverall: TopicBucketTopAccountSummary | null;
    topByEngagementEfficiency: TopicBucketTopAccountSummary | null;
  };
  error: XTopicBucketCompareErrorDetails | null;
  notes: string[];
  totalMs: number;
}

interface SuccessfulTopicBucketSummary {
  bucketId: string;
  label: string;
  status: "ok" | "partial";
  requestedAccountCount: number;
  successfulAccountCount: number;
  usableAccountCount: number;
  avgOverallAccountScore: number | null;
  avgEngagementEfficiencyScore: number | null;
  topByOverall: TopicBucketTopAccountSummary | null;
  topByEngagementEfficiency: TopicBucketTopAccountSummary | null;
}

interface FailedTopicBucketSummary {
  bucketId: string;
  label: string;
  status: "error";
  requestedAccountCount: number;
  failedAccountCount: number;
  error: XTopicBucketCompareErrorDetails | null;
}

interface RankedTopicBucketSummary {
  bucketId: string;
  label: string;
  status: "ok" | "partial" | "error";
  sortBy: XTopicBucketCompareSortBy;
  sortValue: number | null;
  requestedAccountCount: number;
  successfulAccountCount: number;
  failedAccountCount: number;
  usableAccountCount: number;
  avgOverallAccountScore: number | null;
  avgEngagementEfficiencyScore: number | null;
  avgReachScore: number | null;
  avgConsistencyScore: number | null;
  avgDataConfidenceScore: number | null;
}

interface XTopicBucketComparisonSummary {
  totalRequestedBuckets: number;
  successfulBuckets: number;
  failedBuckets: number;
  totalRequestedAccounts: number;
  totalSuccessfulAccounts: number;
  totalFailedAccounts: number;
  sortBy: XTopicBucketCompareSortBy;
  topBucketBySelectedMetric: {
    bucketId: string;
    label: string;
    metric: XTopicBucketCompareSortBy;
    value: number;
  } | null;
}

export interface XTopicBucketCompareDiagnostics {
  status: "ok" | "partial" | "error";
  comparisonSucceeded: boolean;
  requestedBuckets: RequestedXTopicBucketInput[];
  successfulBuckets: SuccessfulTopicBucketSummary[];
  failedBuckets: FailedTopicBucketSummary[];
  comparedBuckets: ComparedXTopicBucketResult[];
  bucketRanking: RankedTopicBucketSummary[];
  comparisonSummary: XTopicBucketComparisonSummary;
  timings: XTopicBucketCompareTimings;
  error: XTopicBucketCompareErrorDetails | null;
  notes: string[];
}

function serializeError(error: unknown): XTopicBucketCompareErrorDetails {
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

function roundNumber(value: number, fractionDigits = 1) {
  return Number(value.toFixed(fractionDigits));
}

function averageNumbers(values: number[], fractionDigits = 1) {
  if (values.length === 0) {
    return null;
  }

  return roundNumber(
    values.reduce((sum, value) => sum + value, 0) / values.length,
    fractionDigits
  );
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

function buildTopAccountSummary(
  accounts: ComparedXAccountResult[],
  metric: "overallAccountScore" | "engagementEfficiencyScore"
): TopicBucketTopAccountSummary | null {
  const successfulAccounts = accounts.filter((account) => account.scoringSucceeded);

  if (successfulAccounts.length === 0) {
    return null;
  }

  const [topAccount] = [...successfulAccounts].sort((left, right) => {
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
    value: topAccount.accountScores[metric],
    usablePostCount: topAccount.filtersApplied.usablePostCount
  };
}

function buildSuccessfulAccountSummary(
  account: ComparedXAccountResult
): SuccessfulTopicBucketAccountSummary {
  return {
    request: account.request,
    status: account.status === "error" ? "partial" : account.status,
    profile: {
      handle: account.profile.handle,
      displayName: account.profile.displayName,
      profileUrl: account.profile.profileUrl
    },
    overallAccountScore: account.accountScores.overallAccountScore,
    engagementEfficiencyScore: account.accountScores.engagementEfficiencyScore,
    reachScore: account.accountScores.reachScore,
    consistencyScore: account.accountScores.consistencyScore,
    dataConfidenceScore: account.accountScores.dataConfidenceScore,
    avgEngagementPerFollowerProxy: account.accountSignals.avgEngagementPerFollowerProxy,
    usablePostCount: account.filtersApplied.usablePostCount,
    recentTweetReferencesCount: account.recentTweetReferencesCount,
    recentTweetReferences: account.recentTweetReferences,
    recentTweetReferencesNote: account.recentTweetReferencesNote,
    bestPerformingTweetReferencesCount:
      account.bestPerformingTweetReferencesCount,
    bestPerformingTweetReferences: account.bestPerformingTweetReferences,
    bestPerformingTweetReferencesNote: account.bestPerformingTweetReferencesNote
  };
}

function buildFailedAccountSummary(
  account: ComparedXAccountResult
): FailedTopicBucketAccountSummary {
  return {
    request: account.request,
    status: account.status === "ok" ? "partial" : account.status,
    aggregationSucceeded: account.aggregationSucceeded,
    scoringSucceeded: account.scoringSucceeded,
    error: account.error
  };
}

function buildBucketSignals(
  requestedAccountCount: number,
  accounts: ComparedXAccountResult[]
): XTopicBucketSignals {
  const successfulAccounts = accounts.filter((account) => account.scoringSucceeded);
  const usableAccounts = successfulAccounts.filter(
    (account) => account.filtersApplied.usablePostCount > 0
  );

  const overallScores = usableAccounts.map((account) => account.accountScores.overallAccountScore);
  const engagementEfficiencyScores = usableAccounts.map(
    (account) => account.accountScores.engagementEfficiencyScore
  );
  const consistencyScores = usableAccounts.map(
    (account) => account.accountScores.consistencyScore
  );
  const reachScores = usableAccounts.map((account) => account.accountScores.reachScore);
  const dataConfidenceScores = usableAccounts.map(
    (account) => account.accountScores.dataConfidenceScore
  );
  const engagementPerFollowerValues = usableAccounts
    .map((account) => account.accountSignals.avgEngagementPerFollowerProxy)
    .filter((value): value is number => value !== null);

  return {
    requestedAccountCount,
    successfulAccountCount: successfulAccounts.length,
    failedAccountCount: Math.max(requestedAccountCount - successfulAccounts.length, 0),
    usableAccountCount: usableAccounts.length,
    avgOverallAccountScore: averageNumbers(overallScores),
    avgEngagementEfficiencyScore: averageNumbers(engagementEfficiencyScores),
    avgConsistencyScore: averageNumbers(consistencyScores),
    avgReachScore: averageNumbers(reachScores),
    avgDataConfidenceScore: averageNumbers(dataConfidenceScores),
    avgEngagementPerFollowerProxy: averageNumbers(engagementPerFollowerValues, 6),
    medianOverallAccountScore: medianNumbers(overallScores),
    medianEngagementEfficiencyScore: medianNumbers(engagementEfficiencyScores)
  };
}

function buildBucketRankingFields(
  signals: XTopicBucketSignals,
  sortBy: XTopicBucketCompareSortBy
): XTopicBucketRankingFields {
  const sortValue = signals[sortBy] ?? null;

  return {
    sortBy,
    sortValue,
    avgOverallAccountScore: signals.avgOverallAccountScore,
    avgEngagementEfficiencyScore: signals.avgEngagementEfficiencyScore,
    avgReachScore: signals.avgReachScore,
    avgConsistencyScore: signals.avgConsistencyScore
  };
}

function buildSuccessfulBucketSummary(
  bucketResult: ComparedXTopicBucketResult
): SuccessfulTopicBucketSummary {
  return {
    bucketId: bucketResult.bucket.bucketId,
    label: bucketResult.bucket.label,
    status: bucketResult.status === "error" ? "partial" : bucketResult.status,
    requestedAccountCount: bucketResult.accountResultsSummary.requestedAccountCount,
    successfulAccountCount: bucketResult.accountResultsSummary.successfulAccountCount,
    usableAccountCount: bucketResult.accountResultsSummary.usableAccountCount,
    avgOverallAccountScore: bucketResult.bucketSignals.avgOverallAccountScore,
    avgEngagementEfficiencyScore:
      bucketResult.bucketSignals.avgEngagementEfficiencyScore,
    topByOverall: bucketResult.topAccounts.topByOverall,
    topByEngagementEfficiency: bucketResult.topAccounts.topByEngagementEfficiency
  };
}

function buildFailedBucketSummary(
  bucketResult: ComparedXTopicBucketResult
): FailedTopicBucketSummary {
  return {
    bucketId: bucketResult.bucket.bucketId,
    label: bucketResult.bucket.label,
    status: "error",
    requestedAccountCount: bucketResult.accountResultsSummary.requestedAccountCount,
    failedAccountCount: bucketResult.accountResultsSummary.failedAccountCount,
    error: bucketResult.error
  };
}

function buildRankedBucketSummary(
  bucketResult: ComparedXTopicBucketResult
): RankedTopicBucketSummary {
  return {
    bucketId: bucketResult.bucket.bucketId,
    label: bucketResult.bucket.label,
    status: bucketResult.status,
    sortBy: bucketResult.bucketRankingFields.sortBy,
    sortValue: bucketResult.bucketRankingFields.sortValue,
    requestedAccountCount: bucketResult.accountResultsSummary.requestedAccountCount,
    successfulAccountCount: bucketResult.accountResultsSummary.successfulAccountCount,
    failedAccountCount: bucketResult.accountResultsSummary.failedAccountCount,
    usableAccountCount: bucketResult.accountResultsSummary.usableAccountCount,
    avgOverallAccountScore: bucketResult.bucketSignals.avgOverallAccountScore,
    avgEngagementEfficiencyScore:
      bucketResult.bucketSignals.avgEngagementEfficiencyScore,
    avgReachScore: bucketResult.bucketSignals.avgReachScore,
    avgConsistencyScore: bucketResult.bucketSignals.avgConsistencyScore,
    avgDataConfidenceScore: bucketResult.bucketSignals.avgDataConfidenceScore
  };
}

function sortBucketResults(
  buckets: ComparedXTopicBucketResult[],
  sortBy: XTopicBucketCompareSortBy
) {
  return [...buckets].sort((left, right) => {
    const leftSuccessful = left.comparisonSucceeded ? 1 : 0;
    const rightSuccessful = right.comparisonSucceeded ? 1 : 0;

    if (leftSuccessful !== rightSuccessful) {
      return rightSuccessful - leftSuccessful;
    }

    const leftSortValue = left.bucketRankingFields[sortBy] ?? -1;
    const rightSortValue = right.bucketRankingFields[sortBy] ?? -1;

    if (rightSortValue !== leftSortValue) {
      return rightSortValue - leftSortValue;
    }

    return left.bucket.index - right.bucket.index;
  });
}

async function compareSingleTopicBucket(
  bucket: RequestedXTopicBucketInput,
  options: XTopicBucketCompareOptions,
  resolvedSortBy: XTopicBucketCompareSortBy,
  logger: FastifyBaseLogger
): Promise<ComparedXTopicBucketResult> {
  const startedAt = Date.now();

  try {
    const comparisonResult = await runXMultiAccountCompareDiagnostics(
      {
        handles: bucket.handles,
        targetUrls: bucket.targetUrls,
        limit: options.limit,
        includeUncertain: options.includeUncertain,
        treatQuoteAsUsable: options.treatQuoteAsUsable,
        sortBy: "overallAccountScore"
      },
      logger
    );

    const requestedAccounts = comparisonResult.requestedAccounts;
    const successfulAccounts = comparisonResult.comparedAccounts
      .filter((account) => account.scoringSucceeded)
      .map(buildSuccessfulAccountSummary);
    const failedAccounts = comparisonResult.comparedAccounts
      .filter((account) => !account.scoringSucceeded)
      .map(buildFailedAccountSummary);
    const accountResultsSummary: XTopicBucketAccountResultsSummary = {
      requestedAccountCount: requestedAccounts.length,
      successfulAccountCount: successfulAccounts.length,
      failedAccountCount: failedAccounts.length,
      usableAccountCount: successfulAccounts.filter(
        (account) => account.usablePostCount > 0
      ).length
    };
    const bucketSignals = buildBucketSignals(
      requestedAccounts.length,
      comparisonResult.comparedAccounts
    );
    const bucketRankingFields = buildBucketRankingFields(bucketSignals, resolvedSortBy);
    const topAccounts = {
      topByOverall: buildTopAccountSummary(
        comparisonResult.comparedAccounts,
        "overallAccountScore"
      ),
      topByEngagementEfficiency: buildTopAccountSummary(
        comparisonResult.comparedAccounts,
        "engagementEfficiencyScore"
      )
    };

    return {
      bucket,
      status: comparisonResult.status,
      comparisonSucceeded: comparisonResult.comparisonSucceeded,
      requestedAccounts,
      successfulAccounts,
      failedAccounts,
      accountResultsSummary,
      bucketSignals,
      bucketRankingFields,
      topAccounts,
      error: comparisonResult.error,
      notes: comparisonResult.notes,
      totalMs: Date.now() - startedAt
    };
  } catch (error) {
    const serializedError = serializeError(error);

    return {
      bucket,
      status: "error",
      comparisonSucceeded: false,
      requestedAccounts: [],
      successfulAccounts: [],
      failedAccounts: [],
      accountResultsSummary: {
        requestedAccountCount: bucket.requestedAccountCount,
        successfulAccountCount: 0,
        failedAccountCount: bucket.requestedAccountCount,
        usableAccountCount: 0
      },
      bucketSignals: {
        requestedAccountCount: bucket.requestedAccountCount,
        successfulAccountCount: 0,
        failedAccountCount: bucket.requestedAccountCount,
        usableAccountCount: 0,
        avgOverallAccountScore: null,
        avgEngagementEfficiencyScore: null,
        avgConsistencyScore: null,
        avgReachScore: null,
        avgDataConfidenceScore: null,
        avgEngagementPerFollowerProxy: null,
        medianOverallAccountScore: null,
        medianEngagementEfficiencyScore: null
      },
      bucketRankingFields: {
        sortBy: resolvedSortBy,
        sortValue: null,
        avgOverallAccountScore: null,
        avgEngagementEfficiencyScore: null,
        avgReachScore: null,
        avgConsistencyScore: null
      },
      topAccounts: {
        topByOverall: null,
        topByEngagementEfficiency: null
      },
      error: serializedError,
      notes: [
        `Topic bucket \`${bucket.bucketId}\` завершился исключением до возврата partial comparison result.`
      ],
      totalMs: Date.now() - startedAt
    };
  }
}

function buildEmptyComparisonSummary(
  requestedBuckets: RequestedXTopicBucketInput[],
  sortBy: XTopicBucketCompareSortBy
): XTopicBucketComparisonSummary {
  return {
    totalRequestedBuckets: requestedBuckets.length,
    successfulBuckets: 0,
    failedBuckets: requestedBuckets.length,
    totalRequestedAccounts: requestedBuckets.reduce(
      (sum, bucket) => sum + bucket.requestedAccountCount,
      0
    ),
    totalSuccessfulAccounts: 0,
    totalFailedAccounts: requestedBuckets.reduce(
      (sum, bucket) => sum + bucket.requestedAccountCount,
      0
    ),
    sortBy,
    topBucketBySelectedMetric: null
  };
}

export async function runXTopicBucketCompareDiagnostics(
  options: XTopicBucketCompareOptions,
  logger: FastifyBaseLogger
): Promise<XTopicBucketCompareDiagnostics> {
  const startedAt = Date.now();
  const notes = getXTopicBucketCompareNotesSeed();
  let requestedBuckets: RequestedXTopicBucketInput[] = [];
  const comparedBuckets: ComparedXTopicBucketResult[] = [];
  let bucketComparisonMs = 0;
  let rankingMs = 0;
  const perBucketMs: XTopicBucketCompareTimings["perBucketMs"] = [];

  try {
    const resolvedSortBy = resolveXTopicBucketCompareSortBy(options.sortBy);
    const requestedBucketsResolution = resolveRequestedXTopicBuckets(options.buckets);
    requestedBuckets = requestedBucketsResolution.requestedBuckets;

    if (requestedBucketsResolution.truncatedCount > 0) {
      notes.push(
        `Список topic buckets ограничен первыми ${requestedBuckets.length}; отброшено: ${requestedBucketsResolution.truncatedCount}.`
      );
    }

    logger.info(
      {
        requestedBuckets: requestedBuckets.map((bucket) => bucket.bucketId),
        sortBy: resolvedSortBy,
        limit: options.limit
      },
      "Starting X topic-bucket comparison."
    );

    for (const bucket of requestedBuckets) {
      const bucketResult = await compareSingleTopicBucket(
        bucket,
        options,
        resolvedSortBy,
        logger
      );
      comparedBuckets.push(bucketResult);
      bucketComparisonMs += bucketResult.totalMs;
      perBucketMs.push({
        bucketId: bucket.bucketId,
        label: bucket.label,
        totalMs: bucketResult.totalMs
      });
      notes.push(...prefixNotes(`bucket ${bucket.bucketId}`, bucketResult.notes));
    }

    const rankingStartedAt = Date.now();
    const sortedBuckets = sortBucketResults(comparedBuckets, resolvedSortBy);
    const successfulBuckets = sortedBuckets.filter((bucket) => bucket.comparisonSucceeded);
    const failedBuckets = sortedBuckets.filter((bucket) => !bucket.comparisonSucceeded);
    const bucketRanking = sortedBuckets.map(buildRankedBucketSummary);
    rankingMs = Date.now() - rankingStartedAt;

    if (failedBuckets.length > 0) {
      notes.push(
        `Не все topic buckets удалось сравнить успешно: failed buckets = ${failedBuckets.length}.`
      );
    }

    notes.push(`Bucket ranking применён по полю \`${resolvedSortBy}\`.`);

    const comparisonSucceeded = successfulBuckets.length > 0;
    const comparisonSummary: XTopicBucketComparisonSummary = {
      totalRequestedBuckets: requestedBuckets.length,
      successfulBuckets: successfulBuckets.length,
      failedBuckets: failedBuckets.length,
      totalRequestedAccounts: sortedBuckets.reduce(
        (sum, bucket) => sum + bucket.accountResultsSummary.requestedAccountCount,
        0
      ),
      totalSuccessfulAccounts: sortedBuckets.reduce(
        (sum, bucket) => sum + bucket.accountResultsSummary.successfulAccountCount,
        0
      ),
      totalFailedAccounts: sortedBuckets.reduce(
        (sum, bucket) => sum + bucket.accountResultsSummary.failedAccountCount,
        0
      ),
      sortBy: resolvedSortBy,
      topBucketBySelectedMetric:
        successfulBuckets.length > 0 &&
        successfulBuckets[0].bucketRankingFields.sortValue !== null
          ? {
              bucketId: successfulBuckets[0].bucket.bucketId,
              label: successfulBuckets[0].bucket.label,
              metric: resolvedSortBy,
              value: successfulBuckets[0].bucketRankingFields.sortValue ?? 0
            }
          : null
    };

    const partialBucketCount = sortedBuckets.filter((bucket) => bucket.status === "partial").length;
    const status =
      comparisonSucceeded && failedBuckets.length === 0 && partialBucketCount === 0
        ? "ok"
        : comparisonSucceeded
          ? "partial"
          : "error";

    logger.info(
      {
        requestedBuckets: requestedBuckets.length,
        successfulBuckets: successfulBuckets.length,
        failedBuckets: failedBuckets.length,
        sortBy: resolvedSortBy
      },
      "Finished X topic-bucket comparison."
    );

    return {
      status,
      comparisonSucceeded,
      requestedBuckets,
      successfulBuckets: successfulBuckets.map(buildSuccessfulBucketSummary),
      failedBuckets: failedBuckets.map(buildFailedBucketSummary),
      comparedBuckets,
      bucketRanking,
      comparisonSummary,
      timings: {
        bucketComparisonMs,
        rankingMs,
        perBucketMs,
        totalMs: Date.now() - startedAt
      },
      error:
        status === "ok"
          ? null
          : {
              name:
                status === "partial"
                  ? "XTopicBucketComparePartialResult"
                  : "XTopicBucketCompareError",
              message:
                status === "partial"
                  ? "Topic-bucket comparison завершён частично: часть bucket-ов или аккаунтов не удалось обработать полностью."
                  : "Не удалось собрать даже частичный topic-bucket comparison result."
            },
      notes: dedupeNotes(notes)
    };
  } catch (error) {
    logger.error({ err: serializeError(error) }, "X topic-bucket comparison failed.");
    notes.push("Topic-bucket comparison завершился с ошибкой до полного завершения bucket orchestration.");
    const resolvedSortBy = resolveXTopicBucketCompareSortBy(options.sortBy);
    const sortedBuckets = sortBucketResults(comparedBuckets, resolvedSortBy);
    const successfulBuckets = sortedBuckets.filter((bucket) => bucket.comparisonSucceeded);
    const failedBuckets = sortedBuckets.filter((bucket) => !bucket.comparisonSucceeded);

    return {
      status: "error",
      comparisonSucceeded: successfulBuckets.length > 0,
      requestedBuckets,
      successfulBuckets: successfulBuckets.map(buildSuccessfulBucketSummary),
      failedBuckets: failedBuckets.map(buildFailedBucketSummary),
      comparedBuckets,
      bucketRanking: sortedBuckets.map(buildRankedBucketSummary),
      comparisonSummary:
        comparedBuckets.length === 0
          ? buildEmptyComparisonSummary(requestedBuckets, resolvedSortBy)
          : {
              totalRequestedBuckets: requestedBuckets.length,
              successfulBuckets: successfulBuckets.length,
              failedBuckets: failedBuckets.length,
              totalRequestedAccounts: sortedBuckets.reduce(
                (sum, bucket) => sum + bucket.accountResultsSummary.requestedAccountCount,
                0
              ),
              totalSuccessfulAccounts: sortedBuckets.reduce(
                (sum, bucket) => sum + bucket.accountResultsSummary.successfulAccountCount,
                0
              ),
              totalFailedAccounts: sortedBuckets.reduce(
                (sum, bucket) => sum + bucket.accountResultsSummary.failedAccountCount,
                0
              ),
              sortBy: resolvedSortBy,
              topBucketBySelectedMetric:
                successfulBuckets.length > 0 &&
                successfulBuckets[0].bucketRankingFields.sortValue !== null
                  ? {
                      bucketId: successfulBuckets[0].bucket.bucketId,
                      label: successfulBuckets[0].bucket.label,
                      metric: resolvedSortBy,
                      value: successfulBuckets[0].bucketRankingFields.sortValue ?? 0
                    }
                  : null
            },
      timings: {
        bucketComparisonMs,
        rankingMs,
        perBucketMs,
        totalMs: Date.now() - startedAt
      },
      error: serializeError(error),
      notes: dedupeNotes(notes)
    };
  }
}

// TODO: Add automatic topic/account discovery only after manual bucket contracts are stable.
// TODO: Add richer topic-level scoring only after bucket-level aggregates are validated on real runs.
// TODO: Add persistence/history only after topic-bucket outputs stabilize.
// TODO: Add API/UI integration for interactive topic analysis in a separate step.
