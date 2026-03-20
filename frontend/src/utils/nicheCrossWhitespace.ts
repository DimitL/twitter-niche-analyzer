import type {
  NicheShortlistContentPatternTag,
  NicheShortlistResponse,
  RankedNicheShortlistBucket
} from "../types/nicheShortlist.js";
import { buildNicheEvidencePack } from "./nicheEvidencePack.js";

export interface CrossNicheWhitespaceAngleSummary {
  tag: NicheShortlistContentPatternTag;
  label: string;
  count: number;
  bucketIds: string[];
  bucketLabels: string[];
}

export interface CrossNicheWhitespaceBucketSummary {
  bucketId: string;
  label: string;
  rank: number | null;
  nicheSpecificWhitespace: CrossNicheWhitespaceAngleSummary[];
  comparativelyOpenAngles: CrossNicheWhitespaceAngleSummary[];
  crowdedAngles: CrossNicheWhitespaceAngleSummary[];
  whitespaceHints: string[];
  positioningIdeas: string[];
}

export interface CrossNicheWhitespaceComparison {
  comparedBucketCount: number;
  comparableBucketCount: number;
  crossNicheWhitespaceSummary: string;
  recurringWhitespaceAngles: CrossNicheWhitespaceAngleSummary[];
  nicheSpecificWhitespaceByBucket: CrossNicheWhitespaceBucketSummary[];
  comparativelyOpenAnglesByBucket: CrossNicheWhitespaceBucketSummary[];
  crowdedAnglesByBucket: CrossNicheWhitespaceBucketSummary[];
  crossNicheConfidenceNote: string | null;
}

const contentPatternLabelMap: Record<NicheShortlistContentPatternTag, string> = {
  strongHook: "сильный hook",
  contrarianTake: "контрарный угол",
  productUpdate: "продуктовый апдейт",
  benchmarkOrResult: "результат или benchmark",
  educationalBreakdown: "обучающий breakdown",
  founderInsight: "founder insight",
  timelyNewsTieIn: "привязка к актуальной новости",
  audienceQuestion: "вопрос к аудитории",
  narrativeStorytelling: "нарративная подача"
};

function formatContentPatternLabel(tag: NicheShortlistContentPatternTag) {
  return contentPatternLabelMap[tag];
}

function joinHumanList(items: string[]) {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} и ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")} и ${items[items.length - 1]}`;
}

function addPatternToBucketMap(
  target: Map<NicheShortlistContentPatternTag, Set<string>>,
  pattern: NicheShortlistContentPatternTag,
  bucketId: string
) {
  const nextBucketIds = target.get(pattern) ?? new Set<string>();
  nextBucketIds.add(bucketId);
  target.set(pattern, nextBucketIds);
}

function buildAngleSummary(
  tag: NicheShortlistContentPatternTag,
  bucketIds: Set<string>,
  bucketLabelMap: Map<string, string>
): CrossNicheWhitespaceAngleSummary {
  const normalizedBucketIds = Array.from(bucketIds);

  return {
    tag,
    label: formatContentPatternLabel(tag),
    count: normalizedBucketIds.length,
    bucketIds: normalizedBucketIds,
    bucketLabels: normalizedBucketIds
      .map((bucketId) => bucketLabelMap.get(bucketId))
      .filter((label): label is string => Boolean(label))
  };
}

function buildCrossNicheSummary(
  comparableBucketCount: number,
  recurringWhitespaceAngles: CrossNicheWhitespaceAngleSummary[],
  bucketComparisons: CrossNicheWhitespaceBucketSummary[]
) {
  if (comparableBucketCount < 2) {
    return "Для межнишевого сравнения whitespace-углов пока нужен shortlist минимум из двух сопоставимых ниш.";
  }

  if (recurringWhitespaceAngles.length === 0) {
    return "Повторяющихся whitespace-углов между shortlisted нишами пока немного: у каждой ниши проявляется свой собственный недопокрытый контентный зазор.";
  }

  const recurringLabels = recurringWhitespaceAngles.slice(0, 2).map((angle) => angle.label);
  const nicheSpecificLabels = bucketComparisons
    .filter((bucket) => bucket.nicheSpecificWhitespace.length > 0)
    .slice(0, 2)
    .map((bucket) => bucket.label);

  const recurringSummary = `Во всей shortlist-подборке чаще всего повторяются whitespace-углы вокруг ${joinHumanList(
    recurringLabels
  )}.`;

  if (nicheSpecificLabels.length === 0) {
    return `${recurringSummary} При этом часть свободных углов всё равно остаётся нишеспецифичной и не повторяется у соседних bucket-ов.`;
  }

  return `${recurringSummary} Более нишеспецифичные свободные углы сейчас заметнее в ${joinHumanList(
    nicheSpecificLabels
  )}.`;
}

function buildConfidenceNote(
  comparableBuckets: Array<{
    bucket: RankedNicheShortlistBucket;
    evidence: ReturnType<typeof buildNicheEvidencePack>;
  }>,
  recurringWhitespaceAngles: CrossNicheWhitespaceAngleSummary[]
) {
  if (comparableBuckets.length < 2) {
    return "Сравнение предварительное: для действительно полезного межнишевого вывода желательно иметь хотя бы две shortlist-ниши с полноценным пакетом доказательств.";
  }

  const lowCoverageBuckets = comparableBuckets.filter(
    ({ evidence }) =>
      evidence.archetypeCoverageCount < 2 || evidence.topSupportingAccounts.length < 2
  );

  if (lowCoverageBuckets.length > 0) {
    return `Сравнение частично предварительное: у ${lowCoverageBuckets.length} из ${comparableBuckets.length} shortlist-ниш покрытие подтверждающих аккаунтов пока слабее желаемого.`;
  }

  if (recurringWhitespaceAngles.length === 0) {
    return "Повторяющиеся whitespace-темы выражены слабо, поэтому этот блок лучше читать как ориентир для ручной проверки, а не как окончательный вывод.";
  }

  return null;
}

export function buildCrossNicheWhitespaceComparison(
  shortlist: NicheShortlistResponse
): CrossNicheWhitespaceComparison {
  const shortlistedBuckets = shortlist.rankedBuckets.filter(
    (bucket) => bucket.shortlistIncluded && bucket.status !== "error"
  );
  const comparableBuckets = shortlistedBuckets.map((bucket) => ({
    bucket,
    evidence: buildNicheEvidencePack(bucket)
  }));
  const bucketLabelMap = new Map(
    comparableBuckets.map(({ bucket }) => [bucket.bucketId, bucket.label])
  );
  const whitespaceMap = new Map<NicheShortlistContentPatternTag, Set<string>>();
  const dominantMap = new Map<NicheShortlistContentPatternTag, Set<string>>();

  comparableBuckets.forEach(({ bucket, evidence }) => {
    evidence.underrepresentedPatterns.forEach((pattern) => {
      addPatternToBucketMap(whitespaceMap, pattern, bucket.bucketId);
    });

    evidence.dominantNichePatterns.forEach((pattern) => {
      addPatternToBucketMap(dominantMap, pattern, bucket.bucketId);
    });
  });

  const recurringWhitespaceAngles = [...whitespaceMap.entries()]
    .filter(([, bucketIds]) => bucketIds.size >= 2)
    .map(([tag, bucketIds]) => buildAngleSummary(tag, bucketIds, bucketLabelMap))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));

  const bucketComparisons = comparableBuckets.map(({ bucket, evidence }) => {
    const nicheSpecificWhitespace = evidence.underrepresentedPatterns
      .filter((pattern) => (whitespaceMap.get(pattern)?.size ?? 0) === 1)
      .map((pattern) =>
        buildAngleSummary(
          pattern,
          whitespaceMap.get(pattern) ?? new Set([bucket.bucketId]),
          bucketLabelMap
        )
      );

    const comparativelyOpenAngles = evidence.underrepresentedPatterns
      .slice()
      .sort((left, right) => {
        const leftDominantCount = dominantMap.get(left)?.size ?? 0;
        const rightDominantCount = dominantMap.get(right)?.size ?? 0;
        const leftWhitespaceCount = whitespaceMap.get(left)?.size ?? 0;
        const rightWhitespaceCount = whitespaceMap.get(right)?.size ?? 0;

        return (
          leftDominantCount - rightDominantCount ||
          leftWhitespaceCount - rightWhitespaceCount ||
          formatContentPatternLabel(left).localeCompare(formatContentPatternLabel(right))
        );
      })
      .slice(0, 3)
      .map((pattern) =>
        buildAngleSummary(
          pattern,
          whitespaceMap.get(pattern) ?? new Set([bucket.bucketId]),
          bucketLabelMap
        )
      );

    const crowdedAngles = evidence.dominantNichePatterns
      .filter((pattern) => (dominantMap.get(pattern)?.size ?? 0) >= 2)
      .map((pattern) =>
        buildAngleSummary(
          pattern,
          dominantMap.get(pattern) ?? new Set([bucket.bucketId]),
          bucketLabelMap
        )
      )
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
      .slice(0, 3);

    return {
      bucketId: bucket.bucketId,
      label: bucket.label,
      rank: bucket.rank,
      nicheSpecificWhitespace,
      comparativelyOpenAngles,
      crowdedAngles,
      whitespaceHints: evidence.whitespaceHints.slice(0, 2),
      positioningIdeas: evidence.nichePositioningIdeas.slice(0, 2)
    };
  });

  return {
    comparedBucketCount: shortlist.rankedBuckets.length,
    comparableBucketCount: comparableBuckets.length,
    crossNicheWhitespaceSummary: buildCrossNicheSummary(
      comparableBuckets.length,
      recurringWhitespaceAngles,
      bucketComparisons
    ),
    recurringWhitespaceAngles: recurringWhitespaceAngles.slice(0, 4),
    nicheSpecificWhitespaceByBucket: bucketComparisons.filter(
      (bucket) => bucket.nicheSpecificWhitespace.length > 0
    ),
    comparativelyOpenAnglesByBucket: bucketComparisons.filter(
      (bucket) => bucket.comparativelyOpenAngles.length > 0
    ),
    crowdedAnglesByBucket: bucketComparisons.filter(
      (bucket) => bucket.crowdedAngles.length > 0
    ),
    crossNicheConfidenceNote: buildConfidenceNote(
      comparableBuckets,
      recurringWhitespaceAngles
    )
  };
}
