import type { FastifyInstance } from "fastify";
import { runXMultiAccountCompareDiagnostics } from "../services/xMultiAccountCompareService.js";

interface XMultiAccountCompareQuery {
  handles?: string | string[];
  handle?: string | string[];
  targetUrls?: string | string[];
  targetUrl?: string | string[];
  waitStrategy?: string;
  limit?: string;
  includeUncertain?: string;
  treatQuoteAsUsable?: string;
  sortBy?: string;
}

export async function registerXMultiAccountCompareRoutes(app: FastifyInstance) {
  app.get("/api/browser/x-multi-account-compare-test", async (request) => {
    const query = (request.query ?? {}) as XMultiAccountCompareQuery;
    const result = await runXMultiAccountCompareDiagnostics(
      {
        handles: query.handles,
        handle: query.handle,
        targetUrls: query.targetUrls,
        targetUrl: query.targetUrl,
        waitStrategy: query.waitStrategy,
        limit: query.limit,
        includeUncertain: query.includeUncertain,
        treatQuoteAsUsable: query.treatQuoteAsUsable,
        sortBy: query.sortBy
      },
      app.log
    );

    return {
      message:
        result.status === "ok"
          ? "Сравнение публичных X-аккаунтов завершено успешно."
          : result.status === "partial"
            ? "Сравнение публичных X-аккаунтов завершено частично."
            : "Сравнение публичных X-аккаунтов завершилось диагностикой ошибки.",
      ...result
    };
  });
}
