const supportedWaitStrategies = [
  "domcontentloaded",
  "load",
  "networkidle"
] as const;

const allowedHosts = [
  "x.com",
  "www.x.com",
  "twitter.com",
  "www.twitter.com",
  "mobile.twitter.com"
] as const;

export type XWaitStrategy = (typeof supportedWaitStrategies)[number];

function readNumberEnv(value: string | undefined, fallback: number) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return fallback;
  }

  return parsedValue;
}

function readBooleanEnv(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return value.trim().toLowerCase() === "true";
}

function parseWaitStrategy(value: string | undefined, fallback: XWaitStrategy): XWaitStrategy {
  if (!value) {
    return fallback;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (supportedWaitStrategies.includes(normalizedValue as XWaitStrategy)) {
    return normalizedValue as XWaitStrategy;
  }

  return fallback;
}

export const xNavigationConfig = {
  defaultTargetUrl: process.env.X_BOOTSTRAP_DEFAULT_URL?.trim() || "https://x.com/OpenAI",
  defaultWaitStrategy: parseWaitStrategy(
    process.env.X_BOOTSTRAP_WAIT_STRATEGY,
    "domcontentloaded"
  ),
  afterLoadWaitMs: readNumberEnv(process.env.X_BOOTSTRAP_AFTER_LOAD_WAIT_MS, 1500),
  supportedWaitStrategies,
  allowedHosts,
  auth: {
    sessionEnabled: readBooleanEnv(process.env.X_AUTH_SESSION_ENABLED, false),
    storageStatePath: process.env.X_AUTH_STORAGE_STATE_PATH?.trim() || "",
    loginEmail: process.env.X_LOGIN_EMAIL?.trim() || "",
    loginUsername: process.env.X_LOGIN_USERNAME?.trim() || "",
    loginPassword: process.env.X_LOGIN_PASSWORD?.trim() || "",
    twoFactorSecret: process.env.X_LOGIN_TWO_FACTOR_SECRET?.trim() || ""
  }
} as const;

export class XNavigationConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XNavigationConfigError";
  }
}

export function resolveXTargetUrl(inputUrl?: string) {
  const rawUrl = inputUrl?.trim() || xNavigationConfig.defaultTargetUrl;

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new XNavigationConfigError("Некорректный URL для X bootstrap test.");
  }

  const host = parsedUrl.hostname.toLowerCase();

  if (parsedUrl.protocol !== "https:") {
    throw new XNavigationConfigError("Для X bootstrap test разрешены только https URL.");
  }

  if (!xNavigationConfig.allowedHosts.includes(host as (typeof allowedHosts)[number])) {
    throw new XNavigationConfigError("Разрешены только публичные URL доменов x.com и twitter.com.");
  }

  return parsedUrl.toString();
}

export function resolveXWaitStrategy(inputStrategy?: string) {
  return parseWaitStrategy(inputStrategy, xNavigationConfig.defaultWaitStrategy);
}
