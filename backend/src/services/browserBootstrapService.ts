import type { FastifyBaseLogger } from "fastify";
import {
  chromium,
  type Browser,
  type BrowserContext,
  type BrowserContextOptions,
  type Page
} from "playwright";
import { browserConfig } from "../config/browserConfig.js";

export interface BrowserRuntime {
  browser: Browser;
  context: BrowserContext;
  page: Page;
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

export async function launchBrowser(logger: FastifyBaseLogger) {
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
  logger: FastifyBaseLogger,
  options: BrowserContextOptions = {}
) {
  const context = await browser.newContext({
    locale: browserConfig.locale,
    ...options
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
) {
  const page = await context.newPage();
  page.setDefaultTimeout(browserConfig.actionTimeoutMs);
  page.setDefaultNavigationTimeout(browserConfig.navigationTimeoutMs);

  logger.info("Browser page created.");

  return page;
}

export async function createBrowserRuntime(
  logger: FastifyBaseLogger,
  options: BrowserContextOptions = {}
): Promise<BrowserRuntime> {
  const browser = await launchBrowser(logger);

  try {
    const context = await createBrowserContext(browser, logger, options);

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
