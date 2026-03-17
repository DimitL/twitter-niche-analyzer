import { xNavigationConfig } from "./xNavigationConfig.js";
import {
  resolveXProfileTarget,
  resolveXProfileWaitStrategy
} from "./xProfileShellConfig.js";

function readNumberEnv(value: string | undefined, fallback: number) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return fallback;
  }

  return parsedValue;
}

function clampLimit(value: number, minValue: number, maxValue: number) {
  return Math.min(Math.max(value, minValue), maxValue);
}

export const xProfileTimelineUrlsConfig = {
  defaultHandle: process.env.X_PROFILE_TIMELINE_URLS_DEFAULT_HANDLE?.trim() || "",
  defaultTargetUrl: process.env.X_PROFILE_TIMELINE_URLS_DEFAULT_URL?.trim() || "",
  defaultWaitStrategy: resolveXProfileWaitStrategy(
    process.env.X_PROFILE_TIMELINE_URLS_WAIT_STRATEGY || "load"
  ),
  extractionTimeoutMs: readNumberEnv(
    process.env.X_PROFILE_TIMELINE_URLS_EXTRACTION_TIMEOUT_MS,
    2_500
  ),
  defaultLimit: clampLimit(
    readNumberEnv(process.env.X_PROFILE_TIMELINE_URLS_DEFAULT_LIMIT, 10),
    1,
    50
  ),
  maxLimit: clampLimit(
    readNumberEnv(process.env.X_PROFILE_TIMELINE_URLS_MAX_LIMIT, 20),
    1,
    50
  )
} as const;

interface ResolvedXProfileTimelineUrlsTarget {
  requestedHandle: string | null;
  normalizedHandle: string;
  targetUrl: string;
  resolutionSource: "defaultHandle" | "handle" | "targetUrl" | "defaultTargetUrl";
}

export function resolveXProfileTimelineUrlsTarget(input: {
  handle?: string;
  targetUrl?: string;
}): ResolvedXProfileTimelineUrlsTarget {
  const requestedHandle =
    input.handle?.trim() || xProfileTimelineUrlsConfig.defaultHandle;
  const requestedTargetUrl =
    input.targetUrl?.trim() || xProfileTimelineUrlsConfig.defaultTargetUrl;

  return resolveXProfileTarget({
    handle: requestedHandle || undefined,
    targetUrl: requestedTargetUrl || undefined
  });
}

export function resolveXProfileTimelineUrlsWaitStrategy(inputStrategy?: string) {
  return resolveXProfileWaitStrategy(
    inputStrategy || xProfileTimelineUrlsConfig.defaultWaitStrategy
  );
}

export function resolveXProfileTimelineUrlsLimit(inputLimit?: string | number) {
  if (inputLimit === undefined || inputLimit === null || inputLimit === "") {
    return Math.min(
      xProfileTimelineUrlsConfig.defaultLimit,
      xProfileTimelineUrlsConfig.maxLimit
    );
  }

  const numericLimit =
    typeof inputLimit === "number" ? inputLimit : Number.parseInt(inputLimit, 10);

  if (!Number.isFinite(numericLimit) || numericLimit <= 0) {
    return Math.min(
      xProfileTimelineUrlsConfig.defaultLimit,
      xProfileTimelineUrlsConfig.maxLimit
    );
  }

  return clampLimit(Math.floor(numericLimit), 1, xProfileTimelineUrlsConfig.maxLimit);
}

export function getXProfileTimelineUrlsNotesSeed() {
  return [
    "Извлечение ограничивается discovery недавних tweet URL из публичной ленты профиля X.",
    "Маршрут не извлекает текст постов, timeline metrics, replies или thread tree.",
    xNavigationConfig.auth.sessionEnabled
      ? "Auth-сессия настроена, но текущий маршрут всё равно не выполняет login automation."
      : "Маршрут работает без авторизации и использует только публичный профиль."
  ];
}
