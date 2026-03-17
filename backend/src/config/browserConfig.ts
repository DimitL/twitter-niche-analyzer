function readBooleanEnv(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return value.trim().toLowerCase() === "true";
}

function readNumberEnv(value: string | undefined, fallback: number) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  return parsedValue;
}

export const browserConfig = {
  headless: readBooleanEnv(process.env.BROWSER_HEADLESS, true),
  launchTimeoutMs: readNumberEnv(process.env.BROWSER_LAUNCH_TIMEOUT_MS, 30_000),
  actionTimeoutMs: readNumberEnv(process.env.BROWSER_ACTION_TIMEOUT_MS, 15_000),
  navigationTimeoutMs: readNumberEnv(process.env.BROWSER_NAVIGATION_TIMEOUT_MS, 30_000),
  locale: process.env.BROWSER_LOCALE?.trim() || "en-US"
} as const;
