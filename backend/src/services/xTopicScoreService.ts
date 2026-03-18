import type { FastifyBaseLogger } from "fastify";
import type { XTopicBucketInput } from "../config/xTopicBucketCompareConfig.js";
import type { RequestedXTopicBucketInput } from "../config/xTopicBucketCompareConfig.js";
import type { ComparedXTopicBucketResult } from "./xTopicBucketCompareService.js";
import type { XTopicBucketCompareDiagnostics } from "./xTopicBucketCompareService.js";
import {
  getXTopicScoreNotesSeed,
  resolveXTopicScoreSortBy,
  type XTopicScoreSortBy,
  xTopicScoreConfig
} from "../config/xTopicScoreConfig.js";
import { runXTopicBucketCompareDiagnostics } from "./xTopicBucketCompareService.js";

interface XTopicScoreOptions {
  buckets?: XTopicBucketInput[];
  limit?: string | number;
  includeUncertain?: string | boolean;
  treatQuoteAsUsable?: string | boolean;
  sortBy?: string;
}

interface XTopicScoreErrorDetails {
  name: string;
  message: string;
}

interface XTopicScoreTimings {
  comparisonMs: number;
  scoringMs: number;
  rankingMs: number;
  perBucketScoreMs: Array<{
    bucketId: string;
    totalMs: number;
  }>;
  totalMs: number;
}

interface XTopicSignalSet {
  averageAccountQuality: number | null;
  averageEngagementEfficiency: number | null;
  averageReach: number | null;
  averageConsistency: number | null;
  averageDataConfidence: number | null;
  averageEngagementPerFollowerProxy: number | null;
  accountCoverageRatio: number;
  usableAccountDensity: number;
  accountCoverageSignal: number;
  usableAccountDensitySignal: number;
}

interface XWeightedTopicScoreComponent {
  key: string;
  label: string;
  value: number;
  weight: number;
}

interface XWeightedTopicScoreBreakdown {
  score: number;
  formula: string;
  components: XWeightedTopicScoreComponent[];
  notes: string[];
}

export interface XTopicScoreValues {
  growthPotential: number;
  monetizationPotential: number;
  contentEase: number;
  dataConfidence: number;
  overallTopicScore: number;
}

interface XTopicScoreBreakdown {
  growthPotential: XWeightedTopicScoreBreakdown;
  monetizationPotential: XWeightedTopicScoreBreakdown;
  contentEase: XWeightedTopicScoreBreakdown;
  dataConfidence: XWeightedTopicScoreBreakdown;
  overallTopicScore: XWeightedTopicScoreBreakdown;
}

interface RankedXTopicBucketSummary {
  bucketId: string;
  label: string;
  status: "ok" | "partial" | "error";
  sortBy: XTopicScoreSortBy;
  sortValue: number;
  overallTopicScore: number;
  growthPotential: number;
  monetizationPotential: number;
  contentEase: number;
  dataConfidence: number;
  requestedAccountCount: number;
  successfulAccountCount: number;
  usableAccountCount: number;
}

export interface ScoredXTopicBucketResult {
  bucket: RequestedXTopicBucketInput;
  status: "ok" | "partial" | "error";
  comparisonSucceeded: boolean;
  scoringSucceeded: boolean;
  bucketAggregates: ComparedXTopicBucketResult["bucketSignals"];
  topicSignals: XTopicSignalSet;
  topicScores: XTopicScoreValues;
  scoreBreakdown: XTopicScoreBreakdown;
  topAccounts: ComparedXTopicBucketResult["topAccounts"];
  error: XTopicScoreErrorDetails | null;
  notes: string[];
  totalMs: number;
}

interface XTopicScoreComparisonSummary {
  totalRequestedBuckets: number;
  successfulBuckets: number;
  failedBuckets: number;
  totalRequestedAccounts: number;
  totalSuccessfulAccounts: number;
  totalFailedAccounts: number;
  sortBy: XTopicScoreSortBy;
  topBucketBySelectedMetric: {
    bucketId: string;
    label: string;
    metric: XTopicScoreSortBy;
    value: number;
  } | null;
}

export interface XTopicScoreDiagnostics {
  status: "ok" | "partial" | "error";
  scoringSucceeded: boolean;
  requestedBuckets: RequestedXTopicBucketInput[];
  scoredBuckets: ScoredXTopicBucketResult[];
  topicRanking: RankedXTopicBucketSummary[];
  comparisonSummary: XTopicScoreComparisonSummary;
  timings: XTopicScoreTimings;
  error: XTopicScoreErrorDetails | null;
  notes: string[];
}

function clamp(value: number, minValue: number, maxValue: number) {
  return Math.min(Math.max(value, minValue), maxValue);
}

function roundNumber(value: number, fractionDigits = 1) {
  return Number(value.toFixed(fractionDigits));
}

function serializeError(error: unknown): XTopicScoreErrorDetails {
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

function createEmptySignals(): XTopicSignalSet {
  return {
    averageAccountQuality: null,
    averageEngagementEfficiency: null,
    averageReach: null,
    averageConsistency: null,
    averageDataConfidence: null,
    averageEngagementPerFollowerProxy: null,
    accountCoverageRatio: 0,
    usableAccountDensity: 0,
    accountCoverageSignal: 0,
    usableAccountDensitySignal: 0
  };
}

function createEmptyScores(): XTopicScoreValues {
  return {
    growthPotential: 0,
    monetizationPotential: 0,
    contentEase: 0,
    dataConfidence: 0,
    overallTopicScore: 0
  };
}

function createEmptyWeightedBreakdown(
  formula: string,
  notes: string[] = []
): XWeightedTopicScoreBreakdown {
  return {
    score: 0,
    formula,
    components: [],
    notes
  };
}

function createEmptyScoreBreakdown(): XTopicScoreBreakdown {
  return {
    growthPotential: createEmptyWeightedBreakdown(
      "0.45*averageEngagementEfficiency + 0.25*averageConsistency + 0.20*usableAccountDensitySignal + 0.10*averageReach"
    ),
    monetizationPotential: createEmptyWeightedBreakdown(
      "0.40*averageAccountQuality + 0.35*averageReach + 0.15*averageDataConfidence + 0.10*accountCoverageSignal"
    ),
    contentEase: createEmptyWeightedBreakdown(
      "0.45*averageConsistency + 0.35*usableAccountDensitySignal + 0.20*accountCoverageSignal"
    ),
    dataConfidence: createEmptyWeightedBreakdown(
      "0.70*averageDataConfidence + 0.20*accountCoverageSignal + 0.10*usableAccountDensitySignal"
    ),
    overallTopicScore: createEmptyWeightedBreakdown(
      "0.35*growthPotential + 0.25*monetizationPotential + 0.15*contentEase + 0.25*dataConfidence"
    )
  };
}

function createEmptyComparisonSummary(
  requestedBuckets: RequestedXTopicBucketInput[],
  sortBy: XTopicScoreSortBy
): XTopicScoreComparisonSummary {
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

function createEmptyScoredBucket(
  bucket: RequestedXTopicBucketInput
): ScoredXTopicBucketResult {
  return {
    bucket,
    status: "error",
    comparisonSucceeded: false,
    scoringSucceeded: false,
    bucketAggregates: {
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
    topicSignals: createEmptySignals(),
    topicScores: createEmptyScores(),
    scoreBreakdown: createEmptyScoreBreakdown(),
    topAccounts: {
      topByOverall: null,
      topByEngagementEfficiency: null
    },
    error: null,
    notes: [],
    totalMs: 0
  };
}

function buildTopicSignals(bucketResult: ComparedXTopicBucketResult): XTopicSignalSet {
  const requestedAccountCount = Math.max(
    bucketResult.accountResultsSummary.requestedAccountCount,
    1
  );
  const accountCoverageRatio =
    bucketResult.accountResultsSummary.successfulAccountCount / requestedAccountCount;
  const usableAccountDensity =
    bucketResult.accountResultsSummary.usableAccountCount / requestedAccountCount;

  return {
    averageAccountQuality: bucketResult.bucketSignals.avgOverallAccountScore,
    averageEngagementEfficiency:
      bucketResult.bucketSignals.avgEngagementEfficiencyScore,
    averageReach: bucketResult.bucketSignals.avgReachScore,
    averageConsistency: bucketResult.bucketSignals.avgConsistencyScore,
    averageDataConfidence: bucketResult.bucketSignals.avgDataConfidenceScore,
    averageEngagementPerFollowerProxy:
      bucketResult.bucketSignals.avgEngagementPerFollowerProxy,
    accountCoverageRatio: roundNumber(accountCoverageRatio, 3),
    usableAccountDensity: roundNumber(usableAccountDensity, 3),
    accountCoverageSignal: roundNumber(accountCoverageRatio * 100, 1),
    usableAccountDensitySignal: roundNumber(usableAccountDensity * 100, 1)
  };
}

function computeWeightedScore(
  formula: string,
  components: XWeightedTopicScoreComponent[],
  notes: string[] = []
): XWeightedTopicScoreBreakdown {
  const score = roundNumber(
    clamp(
      components.reduce((sum, component) => sum + component.value * component.weight, 0),
      0,
      100
    ),
    1
  );

  return {
    score,
    formula,
    components,
    notes
  };
}

function buildTopicScoresAndBreakdown(
  topicSignals: XTopicSignalSet,
  comparisonSucceeded: boolean
) {
  if (!comparisonSucceeded) {
    return {
      topicScores: createEmptyScores(),
      scoreBreakdown: {
        growthPotential: createEmptyWeightedBreakdown(
          "0.45*averageEngagementEfficiency + 0.25*averageConsistency + 0.20*usableAccountDensitySignal + 0.10*averageReach",
          ["Bucket comparison не дал usable account-level data, поэтому topic scores зафиксированы на нуле."]
        ),
        monetizationPotential: createEmptyWeightedBreakdown(
          "0.40*averageAccountQuality + 0.35*averageReach + 0.15*averageDataConfidence + 0.10*accountCoverageSignal",
          ["Monetization potential пока остаётся proxy и без usable accounts не вычисляется содержательно."]
        ),
        contentEase: createEmptyWeightedBreakdown(
          "0.45*averageConsistency + 0.35*usableAccountDensitySignal + 0.20*accountCoverageSignal",
          ["Content-ease proxy требует хотя бы минимальный usable account coverage."]
        ),
        dataConfidence: createEmptyWeightedBreakdown(
          "0.70*averageDataConfidence + 0.20*accountCoverageSignal + 0.10*usableAccountDensitySignal",
          ["Data-confidence proxy деградировал до нуля из-за отсутствия usable bucket aggregates."]
        ),
        overallTopicScore: createEmptyWeightedBreakdown(
          "0.35*growthPotential + 0.25*monetizationPotential + 0.15*contentEase + 0.25*dataConfidence",
          ["Overall topic score не может быть положительным без хотя бы одного scored account."]
        )
      }
    };
  }

  const growthPotential = computeWeightedScore(
    "0.45*averageEngagementEfficiency + 0.25*averageConsistency + 0.20*usableAccountDensitySignal + 0.10*averageReach",
    [
      {
        key: "averageEngagementEfficiency",
        label: "Average Engagement Efficiency",
        value: topicSignals.averageEngagementEfficiency ?? 0,
        weight:
          xTopicScoreConfig.componentWeights.growthPotential.averageEngagementEfficiency
      },
      {
        key: "averageConsistency",
        label: "Average Consistency",
        value: topicSignals.averageConsistency ?? 0,
        weight: xTopicScoreConfig.componentWeights.growthPotential.averageConsistency
      },
      {
        key: "usableAccountDensitySignal",
        label: "Usable Account Density Signal",
        value: topicSignals.usableAccountDensitySignal,
        weight:
          xTopicScoreConfig.componentWeights.growthPotential.usableAccountDensitySignal
      },
      {
        key: "averageReach",
        label: "Average Reach",
        value: topicSignals.averageReach ?? 0,
        weight: xTopicScoreConfig.componentWeights.growthPotential.averageReach
      }
    ]
  );

  const monetizationPotential = computeWeightedScore(
    "0.40*averageAccountQuality + 0.35*averageReach + 0.15*averageDataConfidence + 0.10*accountCoverageSignal",
    [
      {
        key: "averageAccountQuality",
        label: "Average Account Quality",
        value: topicSignals.averageAccountQuality ?? 0,
        weight:
          xTopicScoreConfig.componentWeights.monetizationPotential.averageAccountQuality
      },
      {
        key: "averageReach",
        label: "Average Reach",
        value: topicSignals.averageReach ?? 0,
        weight: xTopicScoreConfig.componentWeights.monetizationPotential.averageReach
      },
      {
        key: "averageDataConfidence",
        label: "Average Data Confidence",
        value: topicSignals.averageDataConfidence ?? 0,
        weight:
          xTopicScoreConfig.componentWeights.monetizationPotential.averageDataConfidence
      },
      {
        key: "accountCoverageSignal",
        label: "Account Coverage Signal",
        value: topicSignals.accountCoverageSignal,
        weight:
          xTopicScoreConfig.componentWeights.monetizationPotential.accountCoverageSignal
      }
    ],
    [
      "Monetization potential пока является explicit proxy, а не прямой revenue estimate."
    ]
  );

  const contentEase = computeWeightedScore(
    "0.45*averageConsistency + 0.35*usableAccountDensitySignal + 0.20*accountCoverageSignal",
    [
      {
        key: "averageConsistency",
        label: "Average Consistency",
        value: topicSignals.averageConsistency ?? 0,
        weight: xTopicScoreConfig.componentWeights.contentEase.averageConsistency
      },
      {
        key: "usableAccountDensitySignal",
        label: "Usable Account Density Signal",
        value: topicSignals.usableAccountDensitySignal,
        weight: xTopicScoreConfig.componentWeights.contentEase.usableAccountDensitySignal
      },
      {
        key: "accountCoverageSignal",
        label: "Account Coverage Signal",
        value: topicSignals.accountCoverageSignal,
        weight: xTopicScoreConfig.componentWeights.contentEase.accountCoverageSignal
      }
    ],
    [
      "Content ease пока означает, насколько стабильно и насколько широко bucket даёт usable account-level signals."
    ]
  );

  const dataConfidence = computeWeightedScore(
    "0.70*averageDataConfidence + 0.20*accountCoverageSignal + 0.10*usableAccountDensitySignal",
    [
      {
        key: "averageDataConfidence",
        label: "Average Data Confidence",
        value: topicSignals.averageDataConfidence ?? 0,
        weight: xTopicScoreConfig.componentWeights.dataConfidence.averageDataConfidence
      },
      {
        key: "accountCoverageSignal",
        label: "Account Coverage Signal",
        value: topicSignals.accountCoverageSignal,
        weight: xTopicScoreConfig.componentWeights.dataConfidence.accountCoverageSignal
      },
      {
        key: "usableAccountDensitySignal",
        label: "Usable Account Density Signal",
        value: topicSignals.usableAccountDensitySignal,
        weight:
          xTopicScoreConfig.componentWeights.dataConfidence.usableAccountDensitySignal
      }
    ]
  );

  const overallTopicScore = computeWeightedScore(
    "0.35*growthPotential + 0.25*monetizationPotential + 0.15*contentEase + 0.25*dataConfidence",
    [
      {
        key: "growthPotential",
        label: "Growth Potential",
        value: growthPotential.score,
        weight: xTopicScoreConfig.overallScoreWeights.growthPotential
      },
      {
        key: "monetizationPotential",
        label: "Monetization Potential",
        value: monetizationPotential.score,
        weight: xTopicScoreConfig.overallScoreWeights.monetizationPotential
      },
      {
        key: "contentEase",
        label: "Content Ease",
        value: contentEase.score,
        weight: xTopicScoreConfig.overallScoreWeights.contentEase
      },
      {
        key: "dataConfidence",
        label: "Data Confidence",
        value: dataConfidence.score,
        weight: xTopicScoreConfig.overallScoreWeights.dataConfidence
      }
    ]
  );

  return {
    topicScores: {
      growthPotential: growthPotential.score,
      monetizationPotential: monetizationPotential.score,
      contentEase: contentEase.score,
      dataConfidence: dataConfidence.score,
      overallTopicScore: overallTopicScore.score
    },
    scoreBreakdown: {
      growthPotential,
      monetizationPotential,
      contentEase,
      dataConfidence,
      overallTopicScore
    }
  };
}

function buildScoredBucket(
  bucketResult: ComparedXTopicBucketResult
): ScoredXTopicBucketResult {
  const topicSignals = buildTopicSignals(bucketResult);
  const { topicScores, scoreBreakdown } = buildTopicScoresAndBreakdown(
    topicSignals,
    bucketResult.comparisonSucceeded
  );

  return {
    bucket: bucketResult.bucket,
    status: bucketResult.status,
    comparisonSucceeded: bucketResult.comparisonSucceeded,
    scoringSucceeded:
      bucketResult.comparisonSucceeded &&
      bucketResult.accountResultsSummary.usableAccountCount > 0,
    bucketAggregates: bucketResult.bucketSignals,
    topicSignals,
    topicScores,
    scoreBreakdown,
    topAccounts: bucketResult.topAccounts,
    error: bucketResult.error,
    notes: bucketResult.notes,
    totalMs: bucketResult.totalMs
  };
}

function buildRankedTopicBucketSummary(
  bucket: ScoredXTopicBucketResult,
  sortBy: XTopicScoreSortBy
): RankedXTopicBucketSummary {
  return {
    bucketId: bucket.bucket.bucketId,
    label: bucket.bucket.label,
    status: bucket.status,
    sortBy,
    sortValue: bucket.topicScores[sortBy],
    overallTopicScore: bucket.topicScores.overallTopicScore,
    growthPotential: bucket.topicScores.growthPotential,
    monetizationPotential: bucket.topicScores.monetizationPotential,
    contentEase: bucket.topicScores.contentEase,
    dataConfidence: bucket.topicScores.dataConfidence,
    requestedAccountCount: bucket.bucketAggregates.requestedAccountCount,
    successfulAccountCount: bucket.bucketAggregates.successfulAccountCount,
    usableAccountCount: bucket.bucketAggregates.usableAccountCount
  };
}

function sortScoredBuckets(
  buckets: ScoredXTopicBucketResult[],
  sortBy: XTopicScoreSortBy
) {
  return [...buckets].sort((left, right) => {
    const leftSuccessful = left.scoringSucceeded ? 1 : 0;
    const rightSuccessful = right.scoringSucceeded ? 1 : 0;

    if (leftSuccessful !== rightSuccessful) {
      return rightSuccessful - leftSuccessful;
    }

    const scoreDifference = right.topicScores[sortBy] - left.topicScores[sortBy];

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    return left.bucket.index - right.bucket.index;
  });
}

export async function runXTopicScoreDiagnostics(
  options: XTopicScoreOptions,
  logger: FastifyBaseLogger
): Promise<XTopicScoreDiagnostics> {
  const startedAt = Date.now();
  const notes = getXTopicScoreNotesSeed();
  const sortBy = resolveXTopicScoreSortBy(options.sortBy);
  let requestedBuckets: RequestedXTopicBucketInput[] = [];
  let scoredBuckets: ScoredXTopicBucketResult[] = [];
  let comparisonMs = 0;
  let scoringMs = 0;
  let rankingMs = 0;
  const perBucketScoreMs: XTopicScoreTimings["perBucketScoreMs"] = [];

  try {
    logger.info(
      {
        bucketCount: options.buckets?.length ?? 0,
        sortBy,
        limit: options.limit
      },
      "Starting X topic scoring."
    );

    const comparisonResult = await runXTopicBucketCompareDiagnostics(
      {
        buckets: options.buckets,
        limit: options.limit,
        includeUncertain: options.includeUncertain,
        treatQuoteAsUsable: options.treatQuoteAsUsable,
        sortBy: "avgOverallAccountScore"
      },
      logger
    );
    comparisonMs = comparisonResult.timings.totalMs;
    requestedBuckets = comparisonResult.requestedBuckets;
    notes.push(...prefixNotes("topic-bucket-compare", comparisonResult.notes));

    const scoringStartedAt = Date.now();
    scoredBuckets = comparisonResult.comparedBuckets.map((bucketResult) => {
      const bucketStartedAt = Date.now();
      const scoredBucket = buildScoredBucket(bucketResult);
      perBucketScoreMs.push({
        bucketId: bucketResult.bucket.bucketId,
        totalMs: Date.now() - bucketStartedAt
      });
      return scoredBucket;
    });
    scoringMs = Date.now() - scoringStartedAt;

    const rankingStartedAt = Date.now();
    const sortedScoredBuckets = sortScoredBuckets(scoredBuckets, sortBy);
    const topicRanking = sortedScoredBuckets.map((bucket) =>
      buildRankedTopicBucketSummary(bucket, sortBy)
    );
    rankingMs = Date.now() - rankingStartedAt;

    const successfulBuckets = sortedScoredBuckets.filter((bucket) => bucket.scoringSucceeded);
    const failedBuckets = sortedScoredBuckets.filter((bucket) => !bucket.scoringSucceeded);

    if (failedBuckets.length > 0) {
      notes.push(
        `Не все topic buckets удалось скорить полностью: failed buckets = ${failedBuckets.length}.`
      );
    }

    notes.push(`Topic ranking применён по полю \`${sortBy}\`.`);
    notes.push(
      "Overall topic score вычисляется явно: 35% growth potential, 25% monetization potential, 15% content ease, 25% data confidence."
    );

    const scoringSucceeded = successfulBuckets.length > 0;
    const comparisonSummary: XTopicScoreComparisonSummary = {
      totalRequestedBuckets: requestedBuckets.length,
      successfulBuckets: successfulBuckets.length,
      failedBuckets: failedBuckets.length,
      totalRequestedAccounts: sortedScoredBuckets.reduce(
        (sum, bucket) => sum + bucket.bucketAggregates.requestedAccountCount,
        0
      ),
      totalSuccessfulAccounts: sortedScoredBuckets.reduce(
        (sum, bucket) => sum + bucket.bucketAggregates.successfulAccountCount,
        0
      ),
      totalFailedAccounts: sortedScoredBuckets.reduce(
        (sum, bucket) => sum + bucket.bucketAggregates.failedAccountCount,
        0
      ),
      sortBy,
      topBucketBySelectedMetric:
        successfulBuckets.length > 0
          ? {
              bucketId: successfulBuckets[0].bucket.bucketId,
              label: successfulBuckets[0].bucket.label,
              metric: sortBy,
              value: successfulBuckets[0].topicScores[sortBy]
            }
          : null
    };

    const partialBucketCount = sortedScoredBuckets.filter(
      (bucket) => bucket.status === "partial"
    ).length;
    const status =
      scoringSucceeded && failedBuckets.length === 0 && partialBucketCount === 0
        ? "ok"
        : scoringSucceeded
          ? "partial"
          : "error";

    logger.info(
      {
        requestedBuckets: requestedBuckets.length,
        successfulBuckets: successfulBuckets.length,
        failedBuckets: failedBuckets.length,
        sortBy
      },
      "Finished X topic scoring."
    );

    return {
      status,
      scoringSucceeded,
      requestedBuckets,
      scoredBuckets: sortedScoredBuckets,
      topicRanking,
      comparisonSummary,
      timings: {
        comparisonMs,
        scoringMs,
        rankingMs,
        perBucketScoreMs,
        totalMs: Date.now() - startedAt
      },
      error:
        status === "ok"
          ? null
          : {
              name:
                status === "partial"
                  ? "XTopicScorePartialResult"
                  : "XTopicScoreError",
              message:
                status === "partial"
                  ? "Topic scoring завершён частично: часть bucket-ов содержит неполные signals или score proxies."
                  : "Не удалось собрать даже частичный topic scoring result."
            },
      notes: dedupeNotes(notes)
    };
  } catch (error) {
    logger.error({ err: serializeError(error) }, "X topic scoring failed.");
    notes.push("Topic scoring завершился с ошибкой до полного завершения topic-level score computation.");

    return {
      status: "error",
      scoringSucceeded: scoredBuckets.some((bucket) => bucket.scoringSucceeded),
      requestedBuckets,
      scoredBuckets,
      topicRanking: sortScoredBuckets(scoredBuckets, sortBy).map((bucket) =>
        buildRankedTopicBucketSummary(bucket, sortBy)
      ),
      comparisonSummary:
        scoredBuckets.length === 0
          ? createEmptyComparisonSummary(requestedBuckets, sortBy)
          : {
              totalRequestedBuckets: requestedBuckets.length,
              successfulBuckets: scoredBuckets.filter((bucket) => bucket.scoringSucceeded).length,
              failedBuckets: scoredBuckets.filter((bucket) => !bucket.scoringSucceeded).length,
              totalRequestedAccounts: scoredBuckets.reduce(
                (sum, bucket) => sum + bucket.bucketAggregates.requestedAccountCount,
                0
              ),
              totalSuccessfulAccounts: scoredBuckets.reduce(
                (sum, bucket) => sum + bucket.bucketAggregates.successfulAccountCount,
                0
              ),
              totalFailedAccounts: scoredBuckets.reduce(
                (sum, bucket) => sum + bucket.bucketAggregates.failedAccountCount,
                0
              ),
              sortBy,
              topBucketBySelectedMetric: null
            },
      timings: {
        comparisonMs,
        scoringMs,
        rankingMs,
        perBucketScoreMs,
        totalMs: Date.now() - startedAt
      },
      error: serializeError(error),
      notes: dedupeNotes(notes)
    };
  }
}

// TODO: Add automatic topic discovery only after manual topic scoring proves stable on repeated runs.
// TODO: Add richer monetization modeling only after we have stronger business/content signals than account proxies.
// TODO: Add final niche ranking across many buckets only after topic-level score contracts stabilize.
// TODO: Add persistence/history only after topic scoring outputs are stable enough to compare over time.
// TODO: Add interactive UI integration in a separate step after API contracts settle.
