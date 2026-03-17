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

export const xProfileFieldsConfig = {
  defaultHandle: process.env.X_PROFILE_FIELDS_DEFAULT_HANDLE?.trim() || "",
  defaultTargetUrl: process.env.X_PROFILE_FIELDS_DEFAULT_URL?.trim() || "",
  defaultWaitStrategy: resolveXProfileWaitStrategy(
    process.env.X_PROFILE_FIELDS_WAIT_STRATEGY || "load"
  ),
  extractionTimeoutMs: readNumberEnv(
    process.env.X_PROFILE_FIELDS_EXTRACTION_TIMEOUT_MS,
    2_500
  )
} as const;

interface ResolvedXProfileFieldsTarget {
  requestedHandle: string | null;
  normalizedHandle: string;
  targetUrl: string;
  resolutionSource: "defaultHandle" | "handle" | "targetUrl" | "defaultTargetUrl";
}

export function resolveXProfileFieldsTarget(input: {
  handle?: string;
  targetUrl?: string;
}): ResolvedXProfileFieldsTarget {
  const requestedHandle = input.handle?.trim() || xProfileFieldsConfig.defaultHandle;
  const requestedTargetUrl =
    input.targetUrl?.trim() || xProfileFieldsConfig.defaultTargetUrl;

  return resolveXProfileTarget({
    handle: requestedHandle || undefined,
    targetUrl: requestedTargetUrl || undefined
  });
}

export function resolveXProfileFieldsWaitStrategy(inputStrategy?: string) {
  return resolveXProfileWaitStrategy(
    inputStrategy || xProfileFieldsConfig.defaultWaitStrategy
  );
}

export function getXProfileFieldsNotesSeed() {
  return [
    "Извлечение ограничивается identity/header полями публичного профиля X.",
    "Маршрут не извлекает timeline tweets, pinned post details, media grid или follower/following lists.",
    xNavigationConfig.auth.sessionEnabled
      ? "Auth-сессия настроена, но текущий маршрут всё равно не выполняет login automation."
      : "Маршрут работает без авторизации и использует только публичный профиль."
  ];
}
