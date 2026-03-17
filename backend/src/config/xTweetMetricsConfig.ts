import { xNavigationConfig } from "./xNavigationConfig.js";
import { resolveXTweetShellWaitStrategy, resolveXTweetTarget } from "./xTweetShellConfig.js";

function readNumberEnv(value: string | undefined, fallback: number) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return fallback;
  }

  return parsedValue;
}

export const xTweetMetricsConfig = {
  defaultTargetUrl: process.env.X_TWEET_METRICS_DEFAULT_URL?.trim() || "",
  defaultWaitStrategy: resolveXTweetShellWaitStrategy(
    process.env.X_TWEET_METRICS_WAIT_STRATEGY || "load"
  ),
  extractionTimeoutMs: readNumberEnv(
    process.env.X_TWEET_METRICS_EXTRACTION_TIMEOUT_MS,
    2_500
  )
} as const;

interface ResolvedXTweetMetricsTarget {
  targetUrl: string;
  normalizedHandle: string;
  tweetId: string;
  resolutionSource: "targetUrl" | "defaultTargetUrl";
}

export function resolveXTweetMetricsTarget(
  inputUrl?: string
): ResolvedXTweetMetricsTarget {
  const requestedUrl = inputUrl?.trim() || xTweetMetricsConfig.defaultTargetUrl;

  return resolveXTweetTarget(requestedUrl);
}

export function resolveXTweetMetricsWaitStrategy(inputStrategy?: string) {
  return resolveXTweetShellWaitStrategy(
    inputStrategy || xTweetMetricsConfig.defaultWaitStrategy
  );
}

export function getXTweetMetricsNotesSeed() {
  return [
    "Извлечение ограничивается engagement metrics одиночного публичного твита X.",
    "Маршрут не извлекает replies list, thread tree или author profile metrics.",
    xNavigationConfig.auth.sessionEnabled
      ? "Auth-сессия настроена, но текущий маршрут всё равно не выполняет login automation."
      : "Маршрут работает без авторизации и использует только публичную страницу твита."
  ];
}
