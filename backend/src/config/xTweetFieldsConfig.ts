import { xNavigationConfig } from "./xNavigationConfig.js";
import { resolveXTweetShellWaitStrategy, resolveXTweetTarget } from "./xTweetShellConfig.js";

function readNumberEnv(value: string | undefined, fallback: number) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return fallback;
  }

  return parsedValue;
}

export const xTweetFieldsConfig = {
  defaultTargetUrl: process.env.X_TWEET_FIELDS_DEFAULT_URL?.trim() || "",
  defaultWaitStrategy: resolveXTweetShellWaitStrategy(
    process.env.X_TWEET_FIELDS_WAIT_STRATEGY || "load"
  ),
  extractionTimeoutMs: readNumberEnv(
    process.env.X_TWEET_FIELDS_EXTRACTION_TIMEOUT_MS,
    2_500
  )
} as const;

interface ResolvedXTweetFieldsTarget {
  targetUrl: string;
  normalizedHandle: string;
  tweetId: string;
  resolutionSource: "targetUrl" | "defaultTargetUrl";
}

export function resolveXTweetFieldsTarget(
  inputUrl?: string
): ResolvedXTweetFieldsTarget {
  const requestedUrl = inputUrl?.trim() || xTweetFieldsConfig.defaultTargetUrl;

  return resolveXTweetTarget(requestedUrl);
}

export function resolveXTweetFieldsWaitStrategy(inputStrategy?: string) {
  return resolveXTweetShellWaitStrategy(
    inputStrategy || xTweetFieldsConfig.defaultWaitStrategy
  );
}

export function getXTweetFieldsNotesSeed() {
  return [
    "Извлечение ограничивается верхнеуровневыми полями одиночного публичного твита X.",
    "Маршрут не извлекает engagement metrics, replies, thread tree или расширенные author profile details.",
    xNavigationConfig.auth.sessionEnabled
      ? "Auth-сессия настроена, но текущий маршрут всё равно не выполняет login automation."
      : "Маршрут работает без авторизации и использует только публичную страницу твита."
  ];
}
