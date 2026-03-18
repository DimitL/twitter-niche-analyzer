import { xNavigationConfig } from "./xNavigationConfig.js";

function readBooleanEnv(value: string | undefined, fallback: boolean) {
  if (!value) {
    return fallback;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalizedValue)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalizedValue)) {
    return false;
  }

  return fallback;
}

export const xAccountScoreConfig = {
  defaultIncludeUncertain: readBooleanEnv(
    process.env.X_ACCOUNT_SCORE_INCLUDE_UNCERTAIN,
    false
  ),
  scoreWeights: {
    engagementEfficiency: 0.4,
    consistency: 0.2,
    reach: 0.15,
    dataConfidence: 0.25
  },
  dataQualityWeights: {
    usableCoverage: 0.35,
    coreMetricCoverage: 0.25,
    viewCoverage: 0.1,
    followerCoverage: 0.15,
    timestampCoverage: 0.15
  },
  normalizationTargets: {
    engagementPerFollowerProxy: 0.02,
    fallbackAvgEngagementProxy: 5_000,
    usablePostSampleSize: 5
  }
} as const;

export function resolveXAccountScoreIncludeUncertain(input?: string | boolean) {
  if (typeof input === "boolean") {
    return input;
  }

  if (!input) {
    return xAccountScoreConfig.defaultIncludeUncertain;
  }

  return readBooleanEnv(input, xAccountScoreConfig.defaultIncludeUncertain);
}

export function getXAccountScoreNotesSeed() {
  return [
    "Скоринг ограничивается одним публичным X-аккаунтом и использует уже собранный recent-posts dataset.",
    "Первая версия score-модели опирается на явные формулы для engagement efficiency, consistency, reach и data confidence.",
    "Classification-aware filter layer исключает likely replies и reposts до расчёта account-level signals.",
    "Uncertain items, quote posts и failed hydration учитываются как отдельные filter decisions и не ломают весь scoring flow.",
    xNavigationConfig.auth.sessionEnabled
      ? "Auth-сессия настроена, но текущий scoring route всё равно не выполняет login automation."
      : "Скоринг работает без авторизации и использует только публичные данные, доступные через текущие bootstrap/extraction слои."
  ];
}
