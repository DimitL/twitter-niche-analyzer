import { appConfig } from "@twitter-niche-analyzer/shared";

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
  locale: process.env.BROWSER_LOCALE?.trim() || "ru-RU",
  smokeTest: {
    url: process.env.BROWSER_SMOKE_TEST_URL?.trim() || "https://example.com",
    probeSelector: process.env.BROWSER_SMOKE_TEST_SELECTOR?.trim() || "h1",
    expectedTitle: process.env.BROWSER_SMOKE_TEST_EXPECTED_TITLE?.trim() || "Example Domain",
    expectedText: process.env.BROWSER_SMOKE_TEST_EXPECTED_TEXT?.trim() || "Example Domain"
  },
  futureX: {
    baseUrl: "https://x.com",
    loginUrl: "https://x.com/i/flow/login",
    selectorsVersion: appConfig.collection.selectorsVersion
  }
} as const;

// TODO: Add session persistence, proxy handling, and storage state for X collection.
// TODO: Move X auth/navigation bootstrap into dedicated collector modules.
