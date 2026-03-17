import {
  resolveXTargetUrl,
  resolveXWaitStrategy,
  type XWaitStrategy,
  xNavigationConfig
} from "./xNavigationConfig.js";

function readNumberEnv(value: string | undefined, fallback: number) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return fallback;
  }

  return parsedValue;
}

function normalizeHandle(rawHandle: string) {
  const normalizedHandle = rawHandle.trim().replace(/^@+/, "");

  if (!/^[A-Za-z0-9_]{1,15}$/.test(normalizedHandle)) {
    throw new XTweetShellConfigError("Некорректный handle в URL твита X.");
  }

  return normalizedHandle;
}

export const xTweetShellConfig = {
  defaultTargetUrl: process.env.X_TWEET_SHELL_DEFAULT_URL?.trim() || "",
  defaultWaitStrategy: resolveXWaitStrategy(
    process.env.X_TWEET_SHELL_WAIT_STRATEGY || "load"
  ),
  markerTimeoutMs: readNumberEnv(process.env.X_TWEET_SHELL_MARKER_TIMEOUT_MS, 3_500),
  retryCount: readNumberEnv(process.env.X_TWEET_SHELL_RETRY_COUNT, 2),
  retryDelayMs: readNumberEnv(process.env.X_TWEET_SHELL_RETRY_DELAY_MS, 1_200)
} as const;

export class XTweetShellConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XTweetShellConfigError";
  }
}

interface ResolvedXTweetTarget {
  targetUrl: string;
  normalizedHandle: string;
  tweetId: string;
  resolutionSource: "targetUrl" | "defaultTargetUrl";
}

function extractTweetTargetParts(targetUrl: string) {
  const resolvedUrl = new URL(resolveXTargetUrl(targetUrl));
  const pathSegments = resolvedUrl.pathname.split("/").filter(Boolean);

  if (pathSegments.length !== 3) {
    throw new XTweetShellConfigError(
      "Нужен URL одиночного публичного твита X формата /handle/status/id."
    );
  }

  const [rawHandle, rawStatusSegment, rawTweetId] = pathSegments;

  if (rawStatusSegment.toLowerCase() !== "status") {
    throw new XTweetShellConfigError(
      "Нужен URL одиночного публичного твита X формата /handle/status/id."
    );
  }

  if (!/^[0-9]+$/.test(rawTweetId)) {
    throw new XTweetShellConfigError("Некорректный идентификатор твита в URL X.");
  }

  return {
    normalizedHandle: normalizeHandle(rawHandle),
    tweetId: rawTweetId
  };
}

export function resolveXTweetTarget(inputUrl?: string): ResolvedXTweetTarget {
  const requestedUrl = inputUrl?.trim() || xTweetShellConfig.defaultTargetUrl;

  if (!requestedUrl) {
    throw new XTweetShellConfigError("Нужно передать targetUrl публичного твита X.");
  }

  const targetUrl = resolveXTargetUrl(requestedUrl);
  const { normalizedHandle, tweetId } = extractTweetTargetParts(targetUrl);

  return {
    targetUrl,
    normalizedHandle,
    tweetId,
    resolutionSource: inputUrl?.trim() ? "targetUrl" : "defaultTargetUrl"
  };
}

export function resolveXTweetShellWaitStrategy(inputStrategy?: string): XWaitStrategy {
  return resolveXWaitStrategy(inputStrategy || xTweetShellConfig.defaultWaitStrategy);
}

export function getXTweetShellNotesSeed() {
  return [
    "Проверка ограничивается shell-маркерами страницы одиночного твита и не извлекает содержимое твита.",
    xNavigationConfig.auth.sessionEnabled
      ? "Auth-сессия настроена, но текущий маршрут всё равно не выполняет login automation."
      : "Маршрут работает без авторизации и проверяет только публичную страницу твита."
  ];
}
