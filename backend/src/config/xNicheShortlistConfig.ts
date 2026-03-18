import { xNavigationConfig } from "./xNavigationConfig.js";
import {
  resolveXTopicScoreSortBy,
  type XTopicScoreSortBy
} from "./xTopicScoreConfig.js";

export type XNicheShortlistSortBy = XTopicScoreSortBy;

export interface XNicheShortlistEmphasisFlags {
  emphasizeGrowth: boolean;
  emphasizeMonetization: boolean;
  emphasizeEase: boolean;
}

export const xNicheShortlistConfig = {
  defaultSortBy: "overallTopicScore" as XNicheShortlistSortBy,
  defaultTopN: 3,
  maxTopN: 10,
  rankingWeights: {
    primaryMetric: 1,
    emphasizeGrowth: 0.35,
    emphasizeMonetization: 0.35,
    emphasizeEase: 0.35
  },
  balancedScoreWeights: {
    growthPotential: 0.3,
    monetizationPotential: 0.25,
    contentEase: 0.25,
    dataConfidence: 0.2,
    spreadPenaltyMultiplier: 0.1
  }
} as const;

function resolveBooleanInput(input: string | boolean | undefined) {
  if (typeof input === "boolean") {
    return input;
  }

  const normalizedValue = input?.trim().toLowerCase();

  if (
    normalizedValue === "true" ||
    normalizedValue === "1" ||
    normalizedValue === "yes"
  ) {
    return true;
  }

  if (
    normalizedValue === "false" ||
    normalizedValue === "0" ||
    normalizedValue === "no"
  ) {
    return false;
  }

  return false;
}

export function resolveXNicheShortlistSortBy(input?: string) {
  return resolveXTopicScoreSortBy(input);
}

export function resolveXNicheShortlistTopN(input?: string | number) {
  const parsedValue =
    typeof input === "number"
      ? input
      : Number.parseInt(String(input ?? xNicheShortlistConfig.defaultTopN), 10);

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return xNicheShortlistConfig.defaultTopN;
  }

  return Math.min(Math.floor(parsedValue), xNicheShortlistConfig.maxTopN);
}

export function resolveXNicheShortlistEmphasisFlags(input: {
  emphasizeGrowth?: string | boolean;
  emphasizeMonetization?: string | boolean;
  emphasizeEase?: string | boolean;
}): XNicheShortlistEmphasisFlags {
  return {
    emphasizeGrowth: resolveBooleanInput(input.emphasizeGrowth),
    emphasizeMonetization: resolveBooleanInput(input.emphasizeMonetization),
    emphasizeEase: resolveBooleanInput(input.emphasizeEase)
  };
}

export function getXNicheShortlistNotesSeed() {
  return [
    "Niche shortlist строится только поверх вручную переданных topic buckets и уже вычисленных topic-level scores.",
    "Первая версия shortlist-логики использует прозрачные ranking rules и не пытается автоматически находить темы.",
    "Decision labels помогают принять решение о направлении блога, но пока не заменяют полноценный long-run niche validation.",
    xNavigationConfig.auth.sessionEnabled
      ? "Auth-сессия настроена, но текущий niche shortlist route всё равно не выполняет login automation."
      : "Niche shortlist работает без авторизации и использует только публичные X profile/tweet данные из текущих bootstrap/extraction/scoring слоёв."
  ];
}
