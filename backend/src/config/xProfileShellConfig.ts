import {
  resolveXTargetUrl,
  resolveXWaitStrategy,
  type XWaitStrategy,
  xNavigationConfig
} from "./xNavigationConfig.js";

const reservedProfilePathRoots = new Set([
  "home",
  "explore",
  "search",
  "i",
  "settings",
  "notifications",
  "messages",
  "compose",
  "login",
  "signup",
  "tos",
  "privacy"
]);

const allowedProfileSubpaths = new Set([
  "with_replies",
  "media",
  "likes",
  "articles",
  "followers",
  "following",
  "verified_followers"
]);

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
    throw new XProfileShellConfigError("Некорректный handle для профиля X.");
  }

  return normalizedHandle;
}

export const xProfileShellConfig = {
  defaultHandle: process.env.X_PROFILE_SHELL_DEFAULT_HANDLE?.trim() || "OpenAI",
  defaultTargetUrl: process.env.X_PROFILE_SHELL_DEFAULT_URL?.trim() || "",
  defaultWaitStrategy: resolveXWaitStrategy(
    process.env.X_PROFILE_SHELL_WAIT_STRATEGY || "load"
  ),
  markerTimeoutMs: readNumberEnv(process.env.X_PROFILE_SHELL_MARKER_TIMEOUT_MS, 3_500),
  retryCount: readNumberEnv(process.env.X_PROFILE_SHELL_RETRY_COUNT, 2),
  retryDelayMs: readNumberEnv(process.env.X_PROFILE_SHELL_RETRY_DELAY_MS, 1_200)
} as const;

export class XProfileShellConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XProfileShellConfigError";
  }
}

interface ResolveXProfileTargetInput {
  handle?: string;
  targetUrl?: string;
}

interface ResolvedXProfileTarget {
  requestedHandle: string | null;
  normalizedHandle: string;
  targetUrl: string;
  resolutionSource: "defaultHandle" | "handle" | "targetUrl" | "defaultTargetUrl";
}

function buildXProfileUrl(handle: string) {
  return `https://x.com/${handle}`;
}

function extractHandleFromProfileUrl(targetUrl: string) {
  const resolvedUrl = new URL(resolveXTargetUrl(targetUrl));
  const pathSegments = resolvedUrl.pathname.split("/").filter(Boolean);

  if (pathSegments.length === 0) {
    throw new XProfileShellConfigError("Нужен URL публичного профиля X, а не главная страница.");
  }

  const firstSegment = pathSegments[0].replace(/^@+/, "");

  if (reservedProfilePathRoots.has(firstSegment.toLowerCase())) {
    throw new XProfileShellConfigError("Нужен URL публичного профиля X, а не служебная страница.");
  }

  if (pathSegments.length > 2) {
    throw new XProfileShellConfigError("Для profile shell test разрешены только URL профиля и его основных вкладок.");
  }

  if (
    pathSegments.length === 2 &&
    !allowedProfileSubpaths.has(pathSegments[1].toLowerCase())
  ) {
    throw new XProfileShellConfigError("Для profile shell test разрешены только URL профиля и его основных вкладок.");
  }

  return normalizeHandle(firstSegment);
}

export function resolveXProfileTarget(
  input: ResolveXProfileTargetInput
): ResolvedXProfileTarget {
  if (input.targetUrl?.trim()) {
    const normalizedHandle = extractHandleFromProfileUrl(input.targetUrl);

    return {
      requestedHandle: null,
      normalizedHandle,
      targetUrl: resolveXTargetUrl(input.targetUrl),
      resolutionSource: "targetUrl"
    };
  }

  if (input.handle?.trim()) {
    const normalizedHandle = normalizeHandle(input.handle);

    return {
      requestedHandle: input.handle,
      normalizedHandle,
      targetUrl: buildXProfileUrl(normalizedHandle),
      resolutionSource: "handle"
    };
  }

  if (xProfileShellConfig.defaultTargetUrl) {
    const normalizedHandle = extractHandleFromProfileUrl(
      xProfileShellConfig.defaultTargetUrl
    );

    return {
      requestedHandle: null,
      normalizedHandle,
      targetUrl: resolveXTargetUrl(xProfileShellConfig.defaultTargetUrl),
      resolutionSource: "defaultTargetUrl"
    };
  }

  const normalizedHandle = normalizeHandle(xProfileShellConfig.defaultHandle);

  return {
    requestedHandle: xProfileShellConfig.defaultHandle,
    normalizedHandle,
    targetUrl: buildXProfileUrl(normalizedHandle),
    resolutionSource: "defaultHandle"
  };
}

export function resolveXProfileWaitStrategy(inputStrategy?: string): XWaitStrategy {
  return resolveXWaitStrategy(inputStrategy || xProfileShellConfig.defaultWaitStrategy);
}

export function getXProfileShellNotesSeed() {
  return [
    "Проверка ограничивается shell-маркерами публичного профиля и не извлекает содержимое профиля.",
    xNavigationConfig.auth.sessionEnabled
      ? "Auth-сессия настроена, но текущий маршрут всё равно не выполняет login automation."
      : "Маршрут работает без авторизации и проверяет только публичный профиль."
  ];
}
