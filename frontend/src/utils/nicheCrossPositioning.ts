import type {
  NicheShortlistContentPatternTag,
  NicheShortlistResponse,
  RankedNicheShortlistBucket
} from "../types/nicheShortlist.js";
import type {
  CrossNicheWhitespaceAngleSummary,
  CrossNicheWhitespaceBucketSummary,
  CrossNicheWhitespaceComparison
} from "./nicheCrossWhitespace.js";
import { buildCrossNicheWhitespaceComparison } from "./nicheCrossWhitespace.js";
import { buildNicheEvidencePack } from "./nicheEvidencePack.js";

export type NichePositioningAngle =
  | "education"
  | "contrarian"
  | "founderOperator"
  | "benchmarkResults"
  | "timelyNewsReactive"
  | "narrativeStorytelling";

export interface NichePositioningAngleRecommendation {
  angle: NichePositioningAngle;
  label: string;
  score: number;
}

export interface NichePositioningAngleLeader {
  angle: NichePositioningAngle;
  label: string;
  bucketId: string;
  bucketLabel: string;
  rank: number | null;
  score: number;
}

export interface NichePositioningBucketRecommendation {
  bucketId: string;
  label: string;
  rank: number | null;
  recommendedEntryAngles: NichePositioningAngleRecommendation[];
  strongestRecommendedAngle: NichePositioningAngleRecommendation | null;
  positioningWhyItFits: string;
  positioningRisks: string[];
  positioningConfidenceNote: string | null;
}

export interface CrossNichePositioningSummary {
  bestNicheForEducation: NichePositioningAngleLeader | null;
  bestNicheForContrarian: NichePositioningAngleLeader | null;
  bestNicheForFounderOperator: NichePositioningAngleLeader | null;
  bestNicheForBenchmarkResults: NichePositioningAngleLeader | null;
  bestNicheForNewsReactive: NichePositioningAngleLeader | null;
}

export interface CrossNichePositioningRecommendations {
  comparedBucketCount: number;
  comparableBucketCount: number;
  positioningSummary: string;
  perBucketRecommendations: NichePositioningBucketRecommendation[];
  summary: CrossNichePositioningSummary;
  globalConfidenceNote: string | null;
}

interface PositioningAngleConfig {
  angle: NichePositioningAngle;
  label: string;
  primaryPatterns: NicheShortlistContentPatternTag[];
  supportingPatterns: NicheShortlistContentPatternTag[];
  archetypeKeywords: string[];
  genericWhy: string;
  genericRisk: string;
}

const positioningAngleConfigs: PositioningAngleConfig[] = [
  {
    angle: "education",
    label: "Обучающий вход",
    primaryPatterns: ["educationalBreakdown"],
    supportingPatterns: ["benchmarkOrResult", "audienceQuestion", "strongHook"],
    archetypeKeywords: ["практичный аналитик", "обучающий разборщик"],
    genericWhy:
      "в этой нише есть пространство для понятных разборов и перевода сложных тем в удобный формат для аудитории.",
    genericRisk:
      "если уйти в слишком общий education-контент без конкретики, можно быстро слиться с уже существующими обзорными аккаунтами."
  },
  {
    angle: "contrarian",
    label: "Контрарный вход",
    primaryPatterns: ["contrarianTake"],
    supportingPatterns: ["strongHook", "timelyNewsTieIn", "benchmarkOrResult"],
    archetypeKeywords: ["контрарный", "attention-driver"],
    genericWhy:
      "ниша позволяет зайти через более острый угол интерпретации и clearer disagreement framing.",
    genericRisk:
      "контрарный заход быстро выглядит шумным, если не подкрепить его реальными наблюдениями и фактами."
  },
  {
    angle: "founderOperator",
    label: "Founder / operator вход",
    primaryPatterns: ["founderInsight", "productUpdate"],
    supportingPatterns: ["narrativeStorytelling", "benchmarkOrResult"],
    archetypeKeywords: ["founder", "оператор", "продуктовый"],
    genericWhy:
      "личный operator perspective может дать нише более редкий и практичный голос.",
    genericRisk:
      "если за founder/operator углом не стоит реальный опыт или регулярные кейсы, он быстро теряет доверие."
  },
  {
    angle: "benchmarkResults",
    label: "Вход через результаты и benchmarks",
    primaryPatterns: ["benchmarkOrResult"],
    supportingPatterns: ["productUpdate", "educationalBreakdown"],
    archetypeKeywords: ["результат", "аналитик", "доказательщик"],
    genericWhy:
      "ниша хорошо поддерживает доказательную подачу через outcomes, benchmarks и разбор того, что реально сработало.",
    genericRisk:
      "угол результатов требует более дисциплинированной фактологии; без неё обещание быстро выглядит слабее."
  },
  {
    angle: "timelyNewsReactive",
    label: "Новостной реактивный вход",
    primaryPatterns: ["timelyNewsTieIn"],
    supportingPatterns: ["strongHook", "contrarianTake", "productUpdate"],
    archetypeKeywords: ["новостной"],
    genericWhy:
      "в этой нише можно входить через быструю интерпретацию свежих событий без полной смены тематического ядра.",
    genericRisk:
      "реактивный угол требует темпа и дисциплины; без регулярности он быстро теряет преимущество."
  },
  {
    angle: "narrativeStorytelling",
    label: "Нарративный вход",
    primaryPatterns: ["narrativeStorytelling"],
    supportingPatterns: ["founderInsight", "audienceQuestion", "strongHook"],
    archetypeKeywords: ["рассказчик", "нарративный"],
    genericWhy:
      "ниша может выиграть от более человечной и narrative-подачи, если сейчас в ней доминируют более сухие форматы.",
    genericRisk:
      "истории работают хуже, если они не привязаны к полезному выводу или сильному практическому контексту."
  }
];

function roundScore(value: number) {
  return Number(value.toFixed(1));
}

function pushUnique(target: string[], value: string) {
  if (!target.includes(value)) {
    target.push(value);
  }
}

function getWhitespaceBucketSummary(
  whitespace: CrossNicheWhitespaceComparison,
  bucketId: string
): CrossNicheWhitespaceBucketSummary | null {
  return (
    whitespace.comparativelyOpenAnglesByBucket.find((bucket) => bucket.bucketId === bucketId) ??
    whitespace.nicheSpecificWhitespaceByBucket.find((bucket) => bucket.bucketId === bucketId) ??
    whitespace.crowdedAnglesByBucket.find((bucket) => bucket.bucketId === bucketId) ??
    null
  );
}

function getAngleSummaryMap(
  angleSummaries: CrossNicheWhitespaceAngleSummary[]
) {
  return new Map(angleSummaries.map((summary) => [summary.tag, summary]));
}

function getPatternLabel(tag: NicheShortlistContentPatternTag) {
  const summary = positioningAngleConfigs.flatMap((config) => [
    ...config.primaryPatterns,
    ...config.supportingPatterns
  ]);

  if (!summary.includes(tag)) {
    switch (tag) {
      case "strongHook":
        return "сильный hook";
      case "contrarianTake":
        return "контрарный угол";
      case "productUpdate":
        return "продуктовый апдейт";
      case "benchmarkOrResult":
        return "результаты и benchmark-подача";
      case "educationalBreakdown":
        return "обучающий breakdown";
      case "founderInsight":
        return "founder/operator perspective";
      case "timelyNewsTieIn":
        return "привязка к актуальным новостям";
      case "audienceQuestion":
        return "вопросы к аудитории";
      case "narrativeStorytelling":
        return "нарративный storytelling";
      default:
        return tag;
    }
  }

  switch (tag) {
    case "strongHook":
      return "сильный hook";
    case "contrarianTake":
      return "контрарный угол";
    case "productUpdate":
      return "продуктовый апдейт";
    case "benchmarkOrResult":
      return "результаты и benchmark-подача";
    case "educationalBreakdown":
      return "обучающий breakdown";
    case "founderInsight":
      return "founder/operator perspective";
    case "timelyNewsTieIn":
      return "новостная реактивность";
    case "audienceQuestion":
      return "question-led вовлечение";
    case "narrativeStorytelling":
      return "storytelling";
    default:
      return tag;
  }
}

function buildAngleLeader(
  recommendation: NichePositioningBucketRecommendation,
  angle: NichePositioningAngle
): NichePositioningAngleLeader | null {
  const entry = recommendation.recommendedEntryAngles.find((item) => item.angle === angle);

  if (!entry || entry.score < 1.5) {
    return null;
  }

  return {
    angle,
    label: entry.label,
    bucketId: recommendation.bucketId,
    bucketLabel: recommendation.label,
    rank: recommendation.rank,
    score: entry.score
  };
}

function buildPositioningSummary(
  recommendations: NichePositioningBucketRecommendation[]
): CrossNichePositioningSummary {
  function findLeader(angle: NichePositioningAngle) {
    return recommendations
      .map((recommendation) => buildAngleLeader(recommendation, angle))
      .filter((entry): entry is NichePositioningAngleLeader => Boolean(entry))
      .sort((left, right) => right.score - left.score)[0] ?? null;
  }

  return {
    bestNicheForEducation: findLeader("education"),
    bestNicheForContrarian: findLeader("contrarian"),
    bestNicheForFounderOperator: findLeader("founderOperator"),
    bestNicheForBenchmarkResults: findLeader("benchmarkResults"),
    bestNicheForNewsReactive: findLeader("timelyNewsReactive")
  };
}

function buildPositioningSummaryText(summary: CrossNichePositioningSummary) {
  const parts: string[] = [];

  if (summary.bestNicheForEducation) {
    parts.push(`для обучающего захода сильнее всего выглядит ${summary.bestNicheForEducation.bucketLabel}`);
  }

  if (summary.bestNicheForContrarian) {
    parts.push(`контрарный вход лучше всего читается в ${summary.bestNicheForContrarian.bucketLabel}`);
  }

  if (summary.bestNicheForFounderOperator) {
    parts.push(`founder/operator угол логичнее всего пробовать в ${summary.bestNicheForFounderOperator.bucketLabel}`);
  }

  if (summary.bestNicheForBenchmarkResults) {
    parts.push(`вход через результаты сильнее всего выглядит в ${summary.bestNicheForBenchmarkResults.bucketLabel}`);
  }

  if (summary.bestNicheForNewsReactive) {
    parts.push(`новостной реактивный формат ярче всего раскрывается в ${summary.bestNicheForNewsReactive.bucketLabel}`);
  }

  if (parts.length === 0) {
    return "Пока ни один угол входа не отрывается достаточно сильно от альтернатив, поэтому этот блок лучше читать как shortlist гипотез для ручной проверки.";
  }

  return `Сейчас картина выглядит так: ${parts.join("; ")}.`;
}

function buildGlobalConfidenceNote(
  recommendations: NichePositioningBucketRecommendation[],
  whitespace: CrossNicheWhitespaceComparison
) {
  const weakBuckets = recommendations.filter(
    (recommendation) => Boolean(recommendation.positioningConfidenceNote)
  );

  if (weakBuckets.length === recommendations.length && recommendations.length > 0) {
    return "Большая часть positioning-рекомендаций пока предварительная: shortlist ещё держится на ограниченном покрытии supporting accounts и rule-based whitespace выводах.";
  }

  if (weakBuckets.length > 0) {
    return `У ${weakBuckets.length} из ${recommendations.length} ниш positioning-рекомендации пока умеренной уверенности, поэтому их лучше подтверждать ручной проверкой supporting accounts.`;
  }

  return whitespace.crossNicheConfidenceNote;
}

function buildRecommendationForBucket(options: {
  bucket: RankedNicheShortlistBucket;
  whitespaceBucket: CrossNicheWhitespaceBucketSummary | null;
}) {
  const { bucket, whitespaceBucket } = options;
  const evidence = buildNicheEvidencePack(bucket);
  const underrepresentedSet = new Set(evidence.underrepresentedPatterns);
  const dominantSet = new Set(bucket.dominantNichePatterns);
  const secondarySet = new Set(bucket.secondaryNichePatterns);
  const openAngleMap = getAngleSummaryMap(whitespaceBucket?.comparativelyOpenAngles ?? []);
  const specificAngleMap = getAngleSummaryMap(whitespaceBucket?.nicheSpecificWhitespace ?? []);
  const crowdedAngleMap = getAngleSummaryMap(whitespaceBucket?.crowdedAngles ?? []);

  const scoredAngles = positioningAngleConfigs.map((config) => {
    let score = 0;
    const positiveReasons: string[] = [];
    const negativeReasons: string[] = [];

    config.primaryPatterns.forEach((pattern) => {
      if (underrepresentedSet.has(pattern)) {
        score += 3.2;
        pushUnique(
          positiveReasons,
          `${getPatternLabel(pattern)} в этой нише пока недопокрыт`
        );
      }

      if (openAngleMap.has(pattern)) {
        score += 2.2;
        pushUnique(
          positiveReasons,
          `${getPatternLabel(pattern)} здесь выглядит свободнее, чем в соседних shortlist-нишах`
        );
      }

      if (specificAngleMap.has(pattern)) {
        score += 1.2;
        pushUnique(
          positiveReasons,
          `${getPatternLabel(pattern)} выглядит более нишеспецифичным окном входа`
        );
      }

      if (secondarySet.has(pattern)) {
        score += 0.5;
      }

      if (dominantSet.has(pattern)) {
        score -= 1;
        pushUnique(
          negativeReasons,
          `${getPatternLabel(pattern)} уже заметно присутствует в доминирующих паттернах ниши`
        );
      }

      if (crowdedAngleMap.has(pattern)) {
        score -= 1.4;
        pushUnique(
          negativeReasons,
          `${getPatternLabel(pattern)} уже выглядит более перегретым на фоне других shortlist-ниш`
        );
      }
    });

    config.supportingPatterns.forEach((pattern) => {
      if (underrepresentedSet.has(pattern)) {
        score += 1.2;
      }

      if (openAngleMap.has(pattern)) {
        score += 0.9;
      }

      if (specificAngleMap.has(pattern)) {
        score += 0.6;
      }

      if (dominantSet.has(pattern)) {
        score += 0.9;
        pushUnique(
          positiveReasons,
          `supporting accounts уже подтверждают смежный сигнал через ${getPatternLabel(pattern)}`
        );
      }

      if (secondarySet.has(pattern)) {
        score += 0.7;
      }

      if (crowdedAngleMap.has(pattern)) {
        score -= 0.4;
      }
    });

    const matchedArchetypes = bucket.commonArchetypes.filter((archetype) =>
      config.archetypeKeywords.some((keyword) =>
        archetype.label.toLowerCase().includes(keyword)
      )
    );

    if (matchedArchetypes.length > 0) {
      score += Math.min(matchedArchetypes.length * 0.9, 1.8);
      pushUnique(
        positiveReasons,
        `повторяющиеся archetype-ярлыки внутри ниши уже частично подтверждают такой формат входа`
      );
    }

    switch (config.angle) {
      case "education":
        if (bucket.topicScores.contentEase >= 65) {
          score += 0.9;
        }
        if (bucket.topicScores.dataConfidence >= 60) {
          score += 0.6;
        }
        break;
      case "contrarian":
        if (bucket.topicScores.growthPotential >= 65) {
          score += 1;
        }
        break;
      case "founderOperator":
        if (bucket.topicScores.monetizationPotential >= 60) {
          score += 0.8;
        }
        if (bucket.topicScores.contentEase >= 60) {
          score += 0.5;
        }
        break;
      case "benchmarkResults":
        if (bucket.topicScores.dataConfidence >= 65) {
          score += 1;
        }
        if (bucket.topicScores.monetizationPotential >= 60) {
          score += 0.7;
        }
        break;
      case "timelyNewsReactive":
        if (bucket.topicScores.growthPotential >= 65) {
          score += 0.9;
        }
        if (bucket.topicScores.contentEase >= 60) {
          score += 0.4;
        }
        break;
      case "narrativeStorytelling":
        if (bucket.topicScores.contentEase >= 65) {
          score += 0.9;
        }
        if (bucket.topicScores.growthPotential >= 60) {
          score += 0.5;
        }
        break;
      default:
        break;
    }

    return {
      angle: config.angle,
      label: config.label,
      score: roundScore(score),
      positiveReasons,
      negativeReasons,
      genericWhy: config.genericWhy,
      genericRisk: config.genericRisk
    };
  });

  const recommendedEntryAngles = scoredAngles
    .slice()
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label))
    .filter((angle, index) => angle.score >= 1.5 || index < 2)
    .slice(0, 3)
    .map((angle) => ({
      angle: angle.angle,
      label: angle.label,
      score: angle.score
    }));

  const strongestAngle = scoredAngles
    .slice()
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label))[0] ?? null;
  const secondAngle = scoredAngles
    .slice()
    .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label))[1] ?? null;

  const strongestRecommendedAngle = strongestAngle
    ? {
        angle: strongestAngle.angle,
        label: strongestAngle.label,
        score: strongestAngle.score
      }
    : null;

  const whyItFits = strongestAngle
    ? `Для ниши ${bucket.label} лучше всего выглядит ${strongestAngle.label.toLowerCase()}: ${
        strongestAngle.positiveReasons.slice(0, 2).join("; ") || strongestAngle.genericWhy
      }.`
    : `Для ниши ${bucket.label} пока не выделяется один очевидный угол входа, поэтому лучше держать несколько гипотез параллельно.`;

  const positioningRisks = strongestAngle
    ? Array.from(
        new Set([
          ...strongestAngle.negativeReasons.slice(0, 2),
          strongestAngle.genericRisk
        ])
      ).slice(0, 3)
    : ["Угол входа пока не отделяется достаточно явно от соседних альтернатив."];

  const confidenceNotes: string[] = [];

  if (evidence.archetypeCoverageCount < 2 || evidence.topSupportingAccounts.length < 2) {
    confidenceNotes.push(
      "Рекомендация пока предварительная: supporting accounts и archetype coverage для этой ниши ещё ограничены."
    );
  }

  if (
    strongestAngle &&
    secondAngle &&
    strongestAngle.score - secondAngle.score < 0.8
  ) {
    confidenceNotes.push(
      "Угол входа пока лишь немного опережает альтернативы, поэтому стоит вручную проверить 1-2 соседних варианта."
    );
  }

  if (evidence.gapsConfidenceNote) {
    confidenceNotes.push(evidence.gapsConfidenceNote);
  }

  if (!strongestAngle || strongestAngle.score < 2) {
    confidenceNotes.push(
      "Сигнал по позиционированию пока слабый: shortlist даёт гипотезу, но не окончательный выбор угла входа."
    );
  }

  return {
    bucketId: bucket.bucketId,
    label: bucket.label,
    rank: bucket.rank,
    recommendedEntryAngles,
    strongestRecommendedAngle,
    positioningWhyItFits: whyItFits,
    positioningRisks,
    positioningConfidenceNote: confidenceNotes[0] ?? null
  };
}

export function buildCrossNichePositioningRecommendations(
  shortlist: NicheShortlistResponse,
  existingWhitespace?: CrossNicheWhitespaceComparison | null
): CrossNichePositioningRecommendations {
  const whitespace =
    existingWhitespace ?? buildCrossNicheWhitespaceComparison(shortlist);
  const shortlistedBuckets = shortlist.rankedBuckets.filter(
    (bucket) => bucket.shortlistIncluded && bucket.status !== "error"
  );
  const perBucketRecommendations = shortlistedBuckets.map((bucket) =>
    buildRecommendationForBucket({
      bucket,
      whitespaceBucket: getWhitespaceBucketSummary(whitespace, bucket.bucketId)
    })
  );
  const summary = buildPositioningSummary(perBucketRecommendations);

  return {
    comparedBucketCount: shortlist.rankedBuckets.length,
    comparableBucketCount: shortlistedBuckets.length,
    positioningSummary: buildPositioningSummaryText(summary),
    perBucketRecommendations,
    summary,
    globalConfidenceNote: buildGlobalConfidenceNote(perBucketRecommendations, whitespace)
  };
}
