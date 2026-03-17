import type { FastifyBaseLogger } from "fastify";
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page
} from "playwright";
import { browserConfig } from "../config/browserConfig.js";

interface BrowserRuntime {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

export interface BrowserSmokeTestResult {
  status: "ok";
  pageTitle: string;
  finalUrl: string;
  httpStatus: number | null;
  probeSelector: string;
  probeText: string;
  checkedAt: string;
}

export class BrowserBootstrapError extends Error {
  declare cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "BrowserBootstrapError";
    this.cause = options?.cause;
  }
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return {
    message: String(error)
  };
}

export async function launchBrowser(logger: FastifyBaseLogger): Promise<Browser> {
  logger.info(
    {
      headless: browserConfig.headless,
      launchTimeoutMs: browserConfig.launchTimeoutMs
    },
    "Launching Chromium browser."
  );

  return chromium.launch({
    headless: browserConfig.headless,
    timeout: browserConfig.launchTimeoutMs
  });
}

export async function closeBrowser(
  browser: Browser | undefined,
  logger: FastifyBaseLogger
) {
  if (!browser) {
    return;
  }

  try {
    await browser.close();
    logger.info("Chromium browser closed.");
  } catch (error) {
    logger.error({ err: serializeError(error) }, "Failed to close Chromium browser gracefully.");
  }
}

export async function createBrowserContext(
  browser: Browser,
  logger: FastifyBaseLogger
): Promise<BrowserContext> {
  const context = await browser.newContext({
    locale: browserConfig.locale
  });

  context.setDefaultTimeout(browserConfig.actionTimeoutMs);
  context.setDefaultNavigationTimeout(browserConfig.navigationTimeoutMs);

  logger.info(
    {
      locale: browserConfig.locale,
      actionTimeoutMs: browserConfig.actionTimeoutMs,
      navigationTimeoutMs: browserConfig.navigationTimeoutMs
    },
    "Browser context created."
  );

  return context;
}

export async function closeBrowserContext(
  context: BrowserContext | undefined,
  logger: FastifyBaseLogger
) {
  if (!context) {
    return;
  }

  try {
    await context.close();
    logger.info("Browser context closed.");
  } catch (error) {
    logger.error({ err: serializeError(error) }, "Failed to close browser context gracefully.");
  }
}

export async function createBrowserPage(
  context: BrowserContext,
  logger: FastifyBaseLogger
): Promise<Page> {
  const page = await context.newPage();
  page.setDefaultTimeout(browserConfig.actionTimeoutMs);
  page.setDefaultNavigationTimeout(browserConfig.navigationTimeoutMs);

  logger.info("Browser page created.");

  return page;
}

export async function createBrowserRuntime(
  logger: FastifyBaseLogger
): Promise<BrowserRuntime> {
  const browser = await launchBrowser(logger);

  try {
    const context = await createBrowserContext(browser, logger);

    try {
      const page = await createBrowserPage(context, logger);

      return {
        browser,
        context,
        page
      };
    } catch (error) {
      await closeBrowserContext(context, logger);
      throw error;
    }
  } catch (error) {
    await closeBrowser(browser, logger);
    throw error;
  }
}

export async function closeBrowserRuntime(
  runtime: Partial<BrowserRuntime>,
  logger: FastifyBaseLogger
) {
  await closeBrowserContext(runtime.context, logger);
  await closeBrowser(runtime.browser, logger);
}

export async function runBrowserSmokeTest(
  logger: FastifyBaseLogger
): Promise<BrowserSmokeTestResult> {
  let runtime: Partial<BrowserRuntime> = {};

  try {
    const browserRuntime = await createBrowserRuntime(logger);
    runtime = browserRuntime;

    const response = await browserRuntime.page.goto(browserConfig.smokeTest.url, {
      waitUntil: "domcontentloaded",
      timeout: browserConfig.navigationTimeoutMs
    });

    await browserRuntime.page.waitForSelector(browserConfig.smokeTest.probeSelector, {
      timeout: browserConfig.actionTimeoutMs
    });

    const pageTitle = await browserRuntime.page.title();
    const probeText =
      (await browserRuntime.page
        .locator(browserConfig.smokeTest.probeSelector)
        .first()
        .textContent())?.trim() ??
      "";
    const titleMatches = pageTitle.includes(browserConfig.smokeTest.expectedTitle);
    const textMatches = probeText.includes(browserConfig.smokeTest.expectedText);

    if (!titleMatches || !textMatches) {
      throw new BrowserBootstrapError(
        "Playwright smoke test не прошёл проверку ожидаемого содержимого."
      );
    }

    return {
      status: "ok",
      pageTitle,
      finalUrl: browserRuntime.page.url(),
      httpStatus: response?.status() ?? null,
      probeSelector: browserConfig.smokeTest.probeSelector,
      probeText,
      checkedAt: new Date().toISOString()
    };
  } catch (error) {
    logger.error({ err: serializeError(error) }, "Playwright smoke test failed.");

    throw new BrowserBootstrapError("Не удалось выполнить Playwright smoke test.", {
      cause: error
    });
  } finally {
    await closeBrowserRuntime(runtime, logger);
  }
}

// TODO: Add X login bootstrap and authenticated context handoff after smoke test is stable.
