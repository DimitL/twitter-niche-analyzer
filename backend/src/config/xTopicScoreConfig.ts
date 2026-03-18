import { xNavigationConfig } from "./xNavigationConfig.js";

export type XTopicScoreSortBy =
  | "overallTopicScore"
  | "growthPotential"
  | "monetizationPotential"
  | "contentEase"
  | "dataConfidence";

export const xTopicScoreConfig = {
  defaultSortBy: "overallTopicScore" as XTopicScoreSortBy,
  overallScoreWeights: {
    growthPotential: 0.35,
    monetizationPotential: 0.25,
    contentEase: 0.15,
    dataConfidence: 0.25
  },
  componentWeights: {
    growthPotential: {
      averageEngagementEfficiency: 0.45,
      averageConsistency: 0.25,
      usableAccountDensitySignal: 0.2,
      averageReach: 0.1
    },
    monetizationPotential: {
      averageAccountQuality: 0.4,
      averageReach: 0.35,
      averageDataConfidence: 0.15,
      accountCoverageSignal: 0.1
    },
    contentEase: {
      averageConsistency: 0.45,
      usableAccountDensitySignal: 0.35,
      accountCoverageSignal: 0.2
    },
    dataConfidence: {
      averageDataConfidence: 0.7,
      accountCoverageSignal: 0.2,
      usableAccountDensitySignal: 0.1
    }
  }
} as const;

export function resolveXTopicScoreSortBy(input?: string): XTopicScoreSortBy {
  const candidate = input?.trim() as XTopicScoreSortBy | undefined;

  if (
    candidate === "overallTopicScore" ||
    candidate === "growthPotential" ||
    candidate === "monetizationPotential" ||
    candidate === "contentEase" ||
    candidate === "dataConfidence"
  ) {
    return candidate;
  }

  return xTopicScoreConfig.defaultSortBy;
}

export function getXTopicScoreNotesSeed() {
  return [
    "Topic-level scoring ограничивается вручную заданными bucket definitions и использует уже собранные bucket aggregates.",
    "Первая версия topic score-модели опирается на явные proxy-formulas для growth potential, monetization potential, content ease и data confidence.",
    "Monetization potential пока считается только прозрачным proxy на основе account quality, reach и coverage, без прямых revenue signals.",
    xNavigationConfig.auth.sessionEnabled
      ? "Auth-сессия настроена, но текущий topic scoring route всё равно не выполняет login automation."
      : "Topic scoring работает без авторизации и использует только публичные X profile/tweet данные из текущих bootstrap/extraction слоёв."
  ];
}
