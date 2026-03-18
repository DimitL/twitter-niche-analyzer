import type { FastifyBaseLogger } from "fastify";
import type {
  RequestedXTopicBucketInput,
  XTopicBucketInput
} from "../config/xTopicBucketCompareConfig.js";
import {
  getXNicheShortlistNotesSeed,
  resolveXNicheShortlistEmphasisFlags,
  resolveXNicheShortlistSortBy,
  resolveXNicheShortlistTopN,
  xNicheShortlistConfig,
  type XNicheShortlistEmphasisFlags,
  type XNicheShortlistSortBy
} from "../config/xNicheShortlistConfig.js";
import {
  runXTopicScoreDiagnostics,
  type ScoredXTopicBucketResult
} from "./xTopicScoreService.js";

interface XNicheShortlistOptions {
  buckets?: XTopicBucketInput[];
  limit?: string | number;
  includeUncertain?: string | boolean;
  treatQuoteAsUsable?: string | boolean;
  sortBy?: string;
  topN?: string | number;
  emphasizeGrowth?: string | boolean;
  emphasizeMonetization?: string | boolean;
  emphasizeEase?: string | boolean;
}

interface XNicheShortlistErrorDetails {
  name: string;
  message: string;
}

interface XNicheShortlistTimings {
  topicScoringMs: number;
  rankingMs: number;
  summaryMs: number;
  totalMs: number;
}

interface XNicheStrongestAccountSummary {
  handle: string | null;
  displayName: string | null;
  profileUrl: string | null;
  metric: "overallAccountScore" | "engagementEfficiencyScore";
  value: number;
  usablePostCount: number;
  reason: string;
}

interface XNicheRankingComponent {
  key: string;
  label: string;
  value: number;
  weight: number;
}

interface XNicheRankingBreakdown {
  sortBy: XNicheShortlistSortBy;
  formula: string;
  rankingScore: number;
  components: XNicheRankingComponent[];
  emphasisFlags: XNicheShortlistEmphasisFlags;
}

interface XNicheDecisionLabels {
  bestOverall: boolean;
  bestForGrowth: boolean;
  bestForMonetization: boolean;
  easiestToStart: boolean;
  bestBalancedOption: boolean;
}

interface XNicheSummaryBucketRef {
  bucketId: string;
  label: string;
  score: number;
}

interface XNicheShortlistSummary {
  totalRequestedBuckets: number;
  successfullyRankedBuckets: number;
  shortlistSize: number;
  rankingSortBy: XNicheShortlistSortBy;
  topN: number;
  emphasisFlags: XNicheShortlistEmphasisFlags;
  bestOverall: XNicheSummaryBucketRef | null;
  bestForGrowth: XNicheSummaryBucketRef | null;
  bestForMonetization: XNicheSummaryBucketRef | null;
  easiestToStart: XNicheSummaryBucketRef | null;
  bestBalanced: XNicheSummaryBucketRef | null;
}

export interface RankedXNicheBucket {
  bucketId: string;
  label: string;
  description: string | null;
  status: "ok" | "partial" | "error";
  shortlistIncluded: boolean;
  rank: number | null;
  rankingReason: string;
  pros: string[];
  cons: string[];
  recommendedUseCase: string;
  strongestAccounts: XNicheStrongestAccountSummary[];
  decisionLabels: XNicheDecisionLabels;
  bucketAggregates: ScoredXTopicBucketResult["bucketAggregates"];
  topicSignals: ScoredXTopicBucketResult["topicSignals"];
  topicScores: ScoredXTopicBucketResult["topicScores"];
  scoreBreakdown: ScoredXTopicBucketResult["scoreBreakdown"];
  rankingBreakdown: XNicheRankingBreakdown | null;
  error: XNicheShortlistErrorDetails | null;
}

export interface XNicheShortlistDiagnostics {
  status: "ok" | "partial" | "error";
  shortlistSucceeded: boolean;
  requestedBuckets: RequestedXTopicBucketInput[];
  rankedBuckets: RankedXNicheBucket[];
  shortlistSummary: XNicheShortlistSummary;
  timings: XNicheShortlistTimings;
  error: XNicheShortlistErrorDetails | null;
  notes: string[];
}

interface ScoredBucketWithRanking {
  bucket: ScoredXTopicBucketResult;
  rankingBreakdown: XNicheRankingBreakdown;
  rankingScore: number;
  balancedOptionScore: number;
}

function clamp(value: number, minValue: number, maxValue: number) {
  return Math.min(Math.max(value, minValue), maxValue);
}

function roundNumber(value: number, fractionDigits = 1) {
  return Number(value.toFixed(fractionDigits));
}

function serializeError(error: unknown): XNicheShortlistErrorDetails {
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

function dedupeItemsByKey<T>(items: T[], getKey: (item: T) => string) {
  const seenKeys = new Set<string>();
  const dedupedItems: T[] = [];

  for (const item of items) {
    const key = getKey(item);

    if (seenKeys.has(key)) {
      continue;
    }

    seenKeys.add(key);
    dedupedItems.push(item);
  }

  return dedupedItems;
}

function getTopicMetricLabel(metric: XNicheShortlistSortBy) {
  switch (metric) {
    case "growthPotential":
      return "growth potential";
    case "monetizationPotential":
      return "monetization potential";
    case "contentEase":
      return "content ease";
    case "dataConfidence":
      return "data confidence";
    case "overallTopicScore":
    default:
      return "overall topic score";
  }
}

function buildRankingBreakdown(
  bucket: ScoredXTopicBucketResult,
  sortBy: XNicheShortlistSortBy,
  emphasisFlags: XNicheShortlistEmphasisFlags
): XNicheRankingBreakdown {
  const components: XNicheRankingComponent[] = [
    {
      key: sortBy,
      label: getTopicMetricLabel(sortBy),
      value: bucket.topicScores[sortBy],
      weight: xNicheShortlistConfig.rankingWeights.primaryMetric
    }
  ];

  if (emphasisFlags.emphasizeGrowth) {
    components.push({
      key: "growthPotential",
      label: getTopicMetricLabel("growthPotential"),
      value: bucket.topicScores.growthPotential,
      weight: xNicheShortlistConfig.rankingWeights.emphasizeGrowth
    });
  }

  if (emphasisFlags.emphasizeMonetization) {
    components.push({
      key: "monetizationPotential",
      label: getTopicMetricLabel("monetizationPotential"),
      value: bucket.topicScores.monetizationPotential,
      weight: xNicheShortlistConfig.rankingWeights.emphasizeMonetization
    });
  }

  if (emphasisFlags.emphasizeEase) {
    components.push({
      key: "contentEase",
      label: getTopicMetricLabel("contentEase"),
      value: bucket.topicScores.contentEase,
      weight: xNicheShortlistConfig.rankingWeights.emphasizeEase
    });
  }

  const totalWeight = components.reduce(
    (sum, component) => sum + component.weight,
    0
  );
  const rankingScore = roundNumber(
    components.reduce(
      (sum, component) => sum + component.value * component.weight,
      0
    ) / totalWeight,
    1
  );

  return {
    sortBy,
    formula:
      "weighted average of primary sort metric plus optional emphasis bonuses for growth, monetization, and ease",
    rankingScore,
    components,
    emphasisFlags
  };
}

function computeBalancedOptionScore(bucket: ScoredXTopicBucketResult) {
  const weights = xNicheShortlistConfig.balancedScoreWeights;
  const metrics = [
    bucket.topicScores.growthPotential,
    bucket.topicScores.monetizationPotential,
    bucket.topicScores.contentEase,
    bucket.topicScores.dataConfidence
  ];
  const weightedAverage =
    bucket.topicScores.growthPotential * weights.growthPotential +
    bucket.topicScores.monetizationPotential * weights.monetizationPotential +
    bucket.topicScores.contentEase * weights.contentEase +
    bucket.topicScores.dataConfidence * weights.dataConfidence;
  const spreadPenalty =
    (Math.max(...metrics) - Math.min(...metrics)) * weights.spreadPenaltyMultiplier;

  return roundNumber(clamp(weightedAverage - spreadPenalty, 0, 100), 1);
}

function createSummaryBucketRef(
  bucket: ScoredXTopicBucketResult,
  score: number
): XNicheSummaryBucketRef {
  return {
    bucketId: bucket.bucket.bucketId,
    label: bucket.bucket.label,
    score
  };
}

function selectTopBucketByMetric(
  buckets: ScoredBucketWithRanking[],
  getScore: (bucket: ScoredBucketWithRanking) => number
) {
  if (buckets.length === 0) {
    return null;
  }

  const [bestBucket] = [...buckets].sort((left, right) => {
    const scoreDifference = getScore(right) - getScore(left);

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    return left.bucket.bucket.index - right.bucket.bucket.index;
  });

  return bestBucket;
}

function buildDecisionLeaders(buckets: ScoredBucketWithRanking[]) {
  const bestOverall = selectTopBucketByMetric(
    buckets,
    (bucket) => bucket.bucket.topicScores.overallTopicScore
  );
  const bestForGrowth = selectTopBucketByMetric(
    buckets,
    (bucket) => bucket.bucket.topicScores.growthPotential
  );
  const bestForMonetization = selectTopBucketByMetric(
    buckets,
    (bucket) => bucket.bucket.topicScores.monetizationPotential
  );
  const easiestToStart = selectTopBucketByMetric(
    buckets,
    (bucket) => bucket.bucket.topicScores.contentEase
  );
  const bestBalanced = selectTopBucketByMetric(
    buckets,
    (bucket) => bucket.balancedOptionScore
  );

  return {
    bestOverall,
    bestForGrowth,
    bestForMonetization,
    easiestToStart,
    bestBalanced
  };
}

function buildStrongestAccounts(
  bucket: ScoredXTopicBucketResult
): XNicheStrongestAccountSummary[] {
  return dedupeItemsByKey(
    [bucket.topAccounts.topByOverall, bucket.topAccounts.topByEngagementEfficiency]
      .filter((account) => account !== null)
      .map((account) => ({
        handle: account.handle,
        displayName: account.displayName,
        profileUrl: account.profileUrl,
        metric: account.metric,
        value: account.value,
        usablePostCount: account.usablePostCount,
        reason:
          account.metric === "overallAccountScore"
            ? "Лидер bucket-а по общему account score."
            : "Лидер bucket-а по engagement efficiency."
      })),
    (account) => `${account.handle ?? "unknown"}:${account.metric}`
  );
}

function getPrimaryStrengths(bucket: ScoredXTopicBucketResult) {
  const strengths: Array<[XNicheShortlistSortBy, number]> = [
    ["growthPotential", bucket.topicScores.growthPotential],
    ["monetizationPotential", bucket.topicScores.monetizationPotential],
    ["contentEase", bucket.topicScores.contentEase],
    ["dataConfidence", bucket.topicScores.dataConfidence]
  ];

  return strengths.sort((left, right) => right[1] - left[1]).slice(0, 2);
}

function buildRankingReason(
  bucket: ScoredXTopicBucketResult,
  rankingBreakdown: XNicheRankingBreakdown,
  shortlistIncluded: boolean
) {
  const strongestMetrics = getPrimaryStrengths(bucket)
    .map(
      ([metric, value]) =>
        `${getTopicMetricLabel(metric)} ${value.toFixed(1)}`
    )
    .join(" и ");

  if (!shortlistIncluded) {
    return `Bucket остался вне верхней части shortlist: primary ranking score ${rankingBreakdown.rankingScore.toFixed(
      1
    )}, strongest visible signals — ${strongestMetrics}.`;
  }

  return `Bucket вошёл в shortlist по \`${rankingBreakdown.sortBy}\` с итоговым ranking score ${rankingBreakdown.rankingScore.toFixed(
    1
  )}; сильнее всего он выглядит по ${strongestMetrics}.`;
}

function buildPros(bucket: ScoredXTopicBucketResult) {
  const pros: string[] = [];

  if (bucket.topicScores.growthPotential >= 60) {
    pros.push("Есть заметный growth proxy по engagement efficiency и охвату аккаунтов.");
  }

  if (bucket.topicScores.monetizationPotential >= 60) {
    pros.push("Monetization proxy выглядит сильнее среднего за счёт account quality и reach.");
  }

  if (bucket.topicScores.contentEase >= 65) {
    pros.push("Ниша выглядит относительно простой для старта по текущему content-ease proxy.");
  }

  if (bucket.topicScores.dataConfidence >= 70) {
    pros.push("Данные по bucket выглядят достаточно устойчивыми для first-pass решения.");
  }

  if (bucket.topicSignals.usableAccountDensity >= 0.8) {
    pros.push("У bucket хороший usable account density, значит pipeline даёт мало потерь на текущем шаге.");
  }

  if (pros.length === 0) {
    pros.push("Есть хотя бы минимальный usable signal set, достаточный для раннего сравнения.");
  }

  return pros.slice(0, 4);
}

function buildCons(bucket: ScoredXTopicBucketResult) {
  const cons: string[] = [];

  if (bucket.topicScores.growthPotential < 50) {
    cons.push("Growth proxy пока умеренный, без явного fast-growth сигнала.");
  }

  if (bucket.topicScores.monetizationPotential < 55) {
    cons.push("Monetization proxy пока слабее желаемого и остаётся только прозрачным приближением.");
  }

  if (bucket.topicScores.contentEase < 55) {
    cons.push("Content-ease proxy не показывает особенно лёгкий старт.");
  }

  if (bucket.topicScores.dataConfidence < 65) {
    cons.push("Data-confidence сигнал пока ограничен качеством и полнотой текущего публичного набора данных.");
  }

  if (bucket.topicSignals.usableAccountDensity < 0.7) {
    cons.push("В bucket пока маловато usable accounts для уверенного решения.");
  }

  if (bucket.status !== "ok") {
    cons.push("Часть bucket-а отработала неполно, поэтому итог стоит трактовать осторожно.");
  }

  if (cons.length === 0) {
    cons.push("Явных слабых мест немного, но этот вывод всё ещё основан на небольшом ручном sample.");
  }

  return cons.slice(0, 4);
}

function buildRecommendedUseCase(
  bucket: ScoredXTopicBucketResult,
  decisionLabels: XNicheDecisionLabels
) {
  if (decisionLabels.bestForGrowth) {
    return "Подходит, если цель — быстро найти направление с лучшим growth proxy и сильным engagement-relative-to-scale сигналом.";
  }

  if (decisionLabels.bestForMonetization) {
    return "Подходит, если важнее тема с более сильным monetization proxy и достаточным reach.";
  }

  if (decisionLabels.easiestToStart) {
    return "Подходит, если нужен более простой стартовый контентный формат с меньшим friction на запуск.";
  }

  if (decisionLabels.bestBalancedOption || decisionLabels.bestOverall) {
    return "Подходит как сбалансированное направление, если нужен компромисс между ростом, monetization proxy, ease и надёжностью данных.";
  }

  if (bucket.topicScores.dataConfidence >= 75) {
    return "Подходит для осторожного входа, когда важнее сначала опереться на более надёжный signal set.";
  }

  return "Подходит как дополнительная гипотеза для теста, но требует следующего шага с более глубоким niche validation.";
}

function buildEmptySummary(
  requestedBuckets: RequestedXTopicBucketInput[],
  sortBy: XNicheShortlistSortBy,
  topN: number,
  emphasisFlags: XNicheShortlistEmphasisFlags
): XNicheShortlistSummary {
  return {
    totalRequestedBuckets: requestedBuckets.length,
    successfullyRankedBuckets: 0,
    shortlistSize: 0,
    rankingSortBy: sortBy,
    topN,
    emphasisFlags,
    bestOverall: null,
    bestForGrowth: null,
    bestForMonetization: null,
    easiestToStart: null,
    bestBalanced: null
  };
}

function buildFailedRankedBucket(
  bucket: ScoredXTopicBucketResult
): RankedXNicheBucket {
  return {
    bucketId: bucket.bucket.bucketId,
    label: bucket.bucket.label,
    description: bucket.bucket.description,
    status: bucket.status,
    shortlistIncluded: false,
    rank: null,
    rankingReason:
      "Bucket не вошёл в shortlist, потому что topic scoring не дал usable result для ранжирования.",
    pros: [],
    cons: [
      "Bucket не дал достаточный usable result для decision-ready shortlist.",
      "Нужно сначала стабилизировать upstream topic scoring или account-level data."
    ],
    recommendedUseCase:
      "Пока не подходит для shortlist-решения; лучше вернуться к нему после усиления upstream signals.",
    strongestAccounts: buildStrongestAccounts(bucket),
    decisionLabels: {
      bestOverall: false,
      bestForGrowth: false,
      bestForMonetization: false,
      easiestToStart: false,
      bestBalancedOption: false
    },
    bucketAggregates: bucket.bucketAggregates,
    topicSignals: bucket.topicSignals,
    topicScores: bucket.topicScores,
    scoreBreakdown: bucket.scoreBreakdown,
    rankingBreakdown: null,
    error: bucket.error
  };
}

export async function runXNicheShortlistDiagnostics(
  options: XNicheShortlistOptions,
  logger: FastifyBaseLogger
): Promise<XNicheShortlistDiagnostics> {
  const startedAt = Date.now();
  const sortBy = resolveXNicheShortlistSortBy(options.sortBy);
  const topN = resolveXNicheShortlistTopN(options.topN);
  const emphasisFlags = resolveXNicheShortlistEmphasisFlags({
    emphasizeGrowth: options.emphasizeGrowth,
    emphasizeMonetization: options.emphasizeMonetization,
    emphasizeEase: options.emphasizeEase
  });
  const notes = getXNicheShortlistNotesSeed();
  let requestedBuckets: RequestedXTopicBucketInput[] = [];
  let rankedBuckets: RankedXNicheBucket[] = [];
  let topicScoringMs = 0;
  let rankingMs = 0;
  let summaryMs = 0;

  try {
    logger.info(
      {
        bucketCount: options.buckets?.length ?? 0,
        sortBy,
        topN,
        emphasisFlags
      },
      "Starting X niche shortlist."
    );

    const topicScoreResult = await runXTopicScoreDiagnostics(
      {
        buckets: options.buckets,
        limit: options.limit,
        includeUncertain: options.includeUncertain,
        treatQuoteAsUsable: options.treatQuoteAsUsable,
        sortBy: sortBy
      },
      logger
    );
    topicScoringMs = topicScoreResult.timings.totalMs;
    requestedBuckets = topicScoreResult.requestedBuckets;

    const rankingStartedAt = Date.now();
    const successfulBuckets = topicScoreResult.scoredBuckets
      .filter((bucket) => bucket.scoringSucceeded)
      .map((bucket) => {
        const rankingBreakdown = buildRankingBreakdown(bucket, sortBy, emphasisFlags);

        return {
          bucket,
          rankingBreakdown,
          rankingScore: rankingBreakdown.rankingScore,
          balancedOptionScore: computeBalancedOptionScore(bucket)
        };
      })
      .sort((left, right) => {
        const rankingDifference = right.rankingScore - left.rankingScore;

        if (rankingDifference !== 0) {
          return rankingDifference;
        }

        const overallDifference =
          right.bucket.topicScores.overallTopicScore -
          left.bucket.topicScores.overallTopicScore;

        if (overallDifference !== 0) {
          return overallDifference;
        }

        return left.bucket.bucket.index - right.bucket.bucket.index;
      });

    const failedBuckets = topicScoreResult.scoredBuckets
      .filter((bucket) => !bucket.scoringSucceeded)
      .map((bucket) => buildFailedRankedBucket(bucket));
    rankingMs = Date.now() - rankingStartedAt;

    const summaryStartedAt = Date.now();
    const leaders = buildDecisionLeaders(successfulBuckets);
    const shortlistCount = Math.min(topN, successfulBuckets.length);
    const shortlistIds = new Set(
      successfulBuckets
        .slice(0, shortlistCount)
        .map((bucket) => bucket.bucket.bucket.bucketId)
    );

    rankedBuckets = [
      ...successfulBuckets.map((entry, index) => {
        const decisionLabels: XNicheDecisionLabels = {
          bestOverall:
            leaders.bestOverall?.bucket.bucket.bucketId === entry.bucket.bucket.bucketId,
          bestForGrowth:
            leaders.bestForGrowth?.bucket.bucket.bucketId === entry.bucket.bucket.bucketId,
          bestForMonetization:
            leaders.bestForMonetization?.bucket.bucket.bucketId ===
            entry.bucket.bucket.bucketId,
          easiestToStart:
            leaders.easiestToStart?.bucket.bucket.bucketId === entry.bucket.bucket.bucketId,
          bestBalancedOption:
            leaders.bestBalanced?.bucket.bucket.bucketId === entry.bucket.bucket.bucketId
        };
        const shortlistIncluded = shortlistIds.has(entry.bucket.bucket.bucketId);

        return {
          bucketId: entry.bucket.bucket.bucketId,
          label: entry.bucket.bucket.label,
          description: entry.bucket.bucket.description,
          status: entry.bucket.status,
          shortlistIncluded,
          rank: index + 1,
          rankingReason: buildRankingReason(
            entry.bucket,
            entry.rankingBreakdown,
            shortlistIncluded
          ),
          pros: buildPros(entry.bucket),
          cons: buildCons(entry.bucket),
          recommendedUseCase: buildRecommendedUseCase(entry.bucket, decisionLabels),
          strongestAccounts: buildStrongestAccounts(entry.bucket),
          decisionLabels,
          bucketAggregates: entry.bucket.bucketAggregates,
          topicSignals: entry.bucket.topicSignals,
          topicScores: entry.bucket.topicScores,
          scoreBreakdown: entry.bucket.scoreBreakdown,
          rankingBreakdown: entry.rankingBreakdown,
          error: entry.bucket.error
        };
      }),
      ...failedBuckets
    ];

    const shortlistSummary: XNicheShortlistSummary = {
      totalRequestedBuckets: requestedBuckets.length,
      successfullyRankedBuckets: successfulBuckets.length,
      shortlistSize: shortlistCount,
      rankingSortBy: sortBy,
      topN,
      emphasisFlags,
      bestOverall: leaders.bestOverall
        ? createSummaryBucketRef(
            leaders.bestOverall.bucket,
            leaders.bestOverall.bucket.topicScores.overallTopicScore
          )
        : null,
      bestForGrowth: leaders.bestForGrowth
        ? createSummaryBucketRef(
            leaders.bestForGrowth.bucket,
            leaders.bestForGrowth.bucket.topicScores.growthPotential
          )
        : null,
      bestForMonetization: leaders.bestForMonetization
        ? createSummaryBucketRef(
            leaders.bestForMonetization.bucket,
            leaders.bestForMonetization.bucket.topicScores.monetizationPotential
          )
        : null,
      easiestToStart: leaders.easiestToStart
        ? createSummaryBucketRef(
            leaders.easiestToStart.bucket,
            leaders.easiestToStart.bucket.topicScores.contentEase
          )
        : null,
      bestBalanced: leaders.bestBalanced
        ? createSummaryBucketRef(
            leaders.bestBalanced.bucket,
            leaders.bestBalanced.balancedOptionScore
          )
        : null
    };
    summaryMs = Date.now() - summaryStartedAt;

    if (topicScoreResult.status !== "ok") {
      notes.push(
        `Upstream topic scoring вернул статус \`${topicScoreResult.status}\`, поэтому shortlist может содержать неполные buckets.`
      );
    }

    if (successfulBuckets.length === 0) {
      notes.push("Ни один bucket не дал usable topic score для shortlist decision.");
    }

    if (emphasisFlags.emphasizeGrowth) {
      notes.push("Ranking усиливает growthPotential при расчёте shortlist order.");
    }

    if (emphasisFlags.emphasizeMonetization) {
      notes.push("Ranking усиливает monetizationPotential при расчёте shortlist order.");
    }

    if (emphasisFlags.emphasizeEase) {
      notes.push("Ranking усиливает contentEase при расчёте shortlist order.");
    }

    notes.push(`Shortlist ranking применён по полю \`${sortBy}\`.`);
    notes.push(
      "Best balanced option считается как weighted average topic scores с небольшим spread penalty за сильный перекос между компонентами."
    );

    const shortlistSucceeded = successfulBuckets.length > 0;
    const partialStatus =
      shortlistSucceeded && (failedBuckets.length > 0 || topicScoreResult.status !== "ok");
    const status = shortlistSucceeded
      ? partialStatus
        ? "partial"
        : "ok"
      : "error";

    logger.info(
      {
        requestedBuckets: requestedBuckets.length,
        successfullyRankedBuckets: successfulBuckets.length,
        shortlistSize: shortlistCount,
        sortBy,
        emphasisFlags
      },
      "Finished X niche shortlist."
    );

    return {
      status,
      shortlistSucceeded,
      requestedBuckets,
      rankedBuckets,
      shortlistSummary,
      timings: {
        topicScoringMs,
        rankingMs,
        summaryMs,
        totalMs: Date.now() - startedAt
      },
      error:
        status === "ok"
          ? null
          : {
              name:
                status === "partial"
                  ? "XNicheShortlistPartialResult"
                  : "XNicheShortlistError",
              message:
                status === "partial"
                  ? "Niche shortlist завершён частично: часть buckets содержит неполные topic signals."
                  : "Не удалось построить даже частичный niche shortlist."
            },
      notes: dedupeNotes(notes)
    };
  } catch (error) {
    logger.error({ err: serializeError(error) }, "X niche shortlist failed.");
    notes.push("Niche shortlist завершился с ошибкой до полного ranking orchestration.");

    return {
      status: "error",
      shortlistSucceeded: rankedBuckets.some((bucket) => bucket.rank !== null),
      requestedBuckets,
      rankedBuckets,
      shortlistSummary: buildEmptySummary(
        requestedBuckets,
        sortBy,
        topN,
        emphasisFlags
      ),
      timings: {
        topicScoringMs,
        rankingMs,
        summaryMs,
        totalMs: Date.now() - startedAt
      },
      error: serializeError(error),
      notes: dedupeNotes(notes)
    };
  }
}

// TODO: Add automatic topic discovery only after manual shortlist quality is validated on repeated runs.
// TODO: Add richer monetization modeling only after we have stronger business-side signals than current proxies.
// TODO: Add final top-10 niche generation across discovered buckets only after manual shortlist contracts stabilize.
// TODO: Add interactive UI integration in a separate step after shortlist API output settles.
