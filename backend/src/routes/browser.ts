import type { FastifyInstance } from "fastify";
import { browserConfig } from "../config/browserConfig.js";
import {
  BrowserBootstrapError,
  runBrowserSmokeTest
} from "../services/browserBootstrapService.js";

export async function registerBrowserRoutes(app: FastifyInstance) {
  app.get("/api/browser/smoke-test", async (_request, reply) => {
    try {
      const result = await runBrowserSmokeTest(app.log);

      return {
        message: "Playwright smoke test выполнен успешно.",
        provider: "playwright-chromium",
        target: browserConfig.smokeTest.url,
        ...result
      };
    } catch (error) {
      const message =
        error instanceof BrowserBootstrapError
          ? error.message
          : "Не удалось проверить Playwright bootstrap.";

      return reply.code(500).send({
        message,
        provider: "playwright-chromium",
        target: browserConfig.smokeTest.url
      });
    }
  });
}
