import type { FastifyInstance } from "fastify";
import { runXAccountScoreDiagnostics } from "../services/xAccountScoreService.js";

interface XAccountScoreQuery {
  handle?: string;
  targetUrl?: string;
  waitStrategy?: string;
  limit?: string;
  includeUncertain?: string;
}

export async function registerXAccountScoreRoutes(app: FastifyInstance) {
  app.get("/api/browser/x-account-score-test", async (request) => {
    const query = (request.query ?? {}) as XAccountScoreQuery;
    const result = await runXAccountScoreDiagnostics(
      {
        handle: query.handle,
        targetUrl: query.targetUrl,
        waitStrategy: query.waitStrategy,
        limit: query.limit,
        includeUncertain: query.includeUncertain
      },
      app.log
    );

    return {
      message:
        result.status === "ok"
          ? "Скоринг публичного X-аккаунта завершён успешно."
          : result.status === "partial"
            ? "Скоринг публичного X-аккаунта завершён частично."
            : "Скоринг публичного X-аккаунта завершился диагностикой ошибки.",
      ...result
    };
  });
}
