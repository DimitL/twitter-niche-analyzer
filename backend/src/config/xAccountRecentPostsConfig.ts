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

function buildCanonicalProfileUrl(handle: string) {
  return `https://x.com/${handle}`;
}

export const xAccountRecentPostsConfig = {
  defaultHandle: process.env.X_ACCOUNT_RECENT_POSTS_DEFAULT_HANDLE?.trim() || "",
  defaultTargetUrl: process.env.X_ACCOUNT_RECENT_POSTS_DEFAULT_URL?.trim() || "",
  defaultWaitStrategy: resolveXProfileWaitStrategy(
    process.env.X_ACCOUNT_RECENT_POSTS_WAIT_STRATEGY || "load"
  ),
  defaultLimit: clampLimit(
    readNumberEnv(process.env.X_ACCOUNT_RECENT_POSTS_DEFAULT_LIMIT, 5),
    1,
    20
  ),
  maxLimit: clampLimit(
    readNumberEnv(process.env.X_ACCOUNT_RECENT_POSTS_MAX_LIMIT, 10),
    1,
    20
  )
} as const;

interface ResolvedXAccountRecentPostsTarget {
  requestedHandle: string | null;
  normalizedHandle: string;
  targetUrl: string;
  resolutionSource: "defaultHandle" | "handle" | "targetUrl" | "defaultTargetUrl";
}

export function resolveXAccountRecentPostsTarget(input: {
  handle?: string;
  targetUrl?: string;
}): ResolvedXAccountRecentPostsTarget {
  const requestedHandle =
    input.handle?.trim() || xAccountRecentPostsConfig.defaultHandle;
  const requestedTargetUrl =
    input.targetUrl?.trim() || xAccountRecentPostsConfig.defaultTargetUrl;

  const resolvedTarget = resolveXProfileTarget({
    handle: requestedHandle || undefined,
    targetUrl: requestedTargetUrl || undefined
  });

  return {
    ...resolvedTarget,
    targetUrl: buildCanonicalProfileUrl(resolvedTarget.normalizedHandle)
  };
}

export function resolveXAccountRecentPostsWaitStrategy(inputStrategy?: string) {
  return resolveXProfileWaitStrategy(
    inputStrategy || xAccountRecentPostsConfig.defaultWaitStrategy
  );
}

export function resolveXAccountRecentPostsLimit(inputLimit?: string | number) {
  if (inputLimit === undefined || inputLimit === null || inputLimit === "") {
    return Math.min(
      xAccountRecentPostsConfig.defaultLimit,
      xAccountRecentPostsConfig.maxLimit
    );
  }

  const numericLimit =
    typeof inputLimit === "number" ? inputLimit : Number.parseInt(inputLimit, 10);

  if (!Number.isFinite(numericLimit) || numericLimit <= 0) {
    return Math.min(
      xAccountRecentPostsConfig.defaultLimit,
      xAccountRecentPostsConfig.maxLimit
    );
  }

  return clampLimit(Math.floor(numericLimit), 1, xAccountRecentPostsConfig.maxLimit);
}

export function getXAccountRecentPostsNotesSeed() {
  return [
    "Агрегация ограничивается небольшим recent-posts набором из одного публичного профиля X.",
    "Текущий маршрут комбинирует profile fields, timeline URL discovery, top-level tweet fields и tweet metrics без timeline-level extraction.",
    "Replies и reposts пока фильтруются нестрого и при сомнениях помечаются как uncertain.",
    xNavigationConfig.auth.sessionEnabled
      ? "Auth-сессия настроена, но текущий маршрут всё равно не выполняет login automation."
      : "Маршрут работает без авторизации и использует только публичный профиль и публичные страницы твитов."
  ];
}
