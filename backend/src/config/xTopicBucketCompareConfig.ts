import { xNavigationConfig } from "./xNavigationConfig.js";

export type XTopicBucketCompareSortBy =
  | "avgOverallAccountScore"
  | "avgEngagementEfficiencyScore"
  | "avgReachScore"
  | "avgConsistencyScore";

export interface XTopicBucketInput {
  bucketId?: string;
  label?: string;
  description?: string;
  handles?: string[] | string;
  targetUrls?: string[] | string;
}

export interface RequestedXTopicBucketInput {
  index: number;
  bucketId: string;
  label: string;
  description: string | null;
  handles: string[];
  targetUrls: string[];
  requestedAccountCount: number;
}

export class XTopicBucketCompareConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XTopicBucketCompareConfigError";
  }
}

export const xTopicBucketCompareConfig = {
  defaultSortBy: "avgOverallAccountScore" as XTopicBucketCompareSortBy,
  maxRequestedBuckets: 6
} as const;

function normalizeListInput(input?: string[] | string) {
  const rawValues = Array.isArray(input) ? input : input ? [input] : [];

  return rawValues
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

export function resolveXTopicBucketCompareSortBy(
  input?: string
): XTopicBucketCompareSortBy {
  const candidate = input?.trim() as XTopicBucketCompareSortBy | undefined;

  if (
    candidate === "avgOverallAccountScore" ||
    candidate === "avgEngagementEfficiencyScore" ||
    candidate === "avgReachScore" ||
    candidate === "avgConsistencyScore"
  ) {
    return candidate;
  }

  return xTopicBucketCompareConfig.defaultSortBy;
}

export function resolveRequestedXTopicBuckets(input?: XTopicBucketInput[]) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new XTopicBucketCompareConfigError(
      "Нужен хотя бы один topic bucket в поле `buckets`."
    );
  }

  const requestedBuckets: RequestedXTopicBucketInput[] = [];
  const seenBucketIds = new Set<string>();

  for (const [index, bucket] of input.entries()) {
    const bucketId = bucket.bucketId?.trim() || "";
    const label = bucket.label?.trim() || "";
    const description = bucket.description?.trim() || null;
    const handles = normalizeListInput(bucket.handles);
    const targetUrls = normalizeListInput(bucket.targetUrls);

    if (!bucketId) {
      throw new XTopicBucketCompareConfigError(
        `Bucket #${index + 1} должен содержать непустой \`bucketId\`.`
      );
    }

    const normalizedBucketId = bucketId.toLowerCase();

    if (seenBucketIds.has(normalizedBucketId)) {
      throw new XTopicBucketCompareConfigError(
        `Bucket id \`${bucketId}\` дублируется. Используйте уникальные bucketId.`
      );
    }

    if (!label) {
      throw new XTopicBucketCompareConfigError(
        `Bucket \`${bucketId}\` должен содержать непустой \`label\`.`
      );
    }

    if (handles.length + targetUrls.length === 0) {
      throw new XTopicBucketCompareConfigError(
        `Bucket \`${bucketId}\` должен содержать хотя бы один account через \`handles\` или \`targetUrls\`.`
      );
    }

    seenBucketIds.add(normalizedBucketId);
    requestedBuckets.push({
      index,
      bucketId,
      label,
      description,
      handles,
      targetUrls,
      requestedAccountCount: handles.length + targetUrls.length
    });
  }

  const truncatedBuckets = requestedBuckets.slice(
    0,
    xTopicBucketCompareConfig.maxRequestedBuckets
  );

  return {
    requestedBuckets: truncatedBuckets.map((bucket, index) => ({
      ...bucket,
      index
    })),
    truncatedCount: Math.max(
      requestedBuckets.length - xTopicBucketCompareConfig.maxRequestedBuckets,
      0
    )
  };
}

export function getXTopicBucketCompareNotesSeed() {
  return [
    "Сравнение topic buckets ограничивается вручную заданным небольшим списком bucket definitions.",
    "Каждый bucket агрегируется поверх уже существующего multi-account comparison и single-account scoring layers.",
    "Partial failures по аккаунтам и bucket-ам возвращаются как диагностические результаты и не ломают весь comparison run.",
    xNavigationConfig.auth.sessionEnabled
      ? "Auth-сессия настроена, но текущий topic-bucket route всё равно не выполняет login automation."
      : "Topic-bucket comparison работает без авторизации и использует только публичные X profile/tweet данные из текущих bootstrap/extraction слоёв."
  ];
}
