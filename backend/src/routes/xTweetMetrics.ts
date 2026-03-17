import type { FastifyInstance } from "fastify";
import { runXTweetMetricsDiagnostics } from "../services/xTweetMetricsService.js";

interface XTweetMetricsQuery {
  targetUrl?: string;
  waitStrategy?: string;
}

export async function registerXTweetMetricsRoutes(app: FastifyInstance) {
  app.get("/api/browser/x-tweet-metrics-test", async (request) => {
    const query = (request.query ?? {}) as XTweetMetricsQuery;
    const result = await runXTweetMetricsDiagnostics(
      {
        targetUrl: query.targetUrl,
        waitStrategy: query.waitStrategy
      },
      app.log
    );

    return {
      message:
        result.status === "ok"
          ? "Извлечение engagement metrics публичного твита X завершено успешно."
          : result.status === "partial"
            ? "Извлечение engagement metrics публичного твита X завершено частично."
            : "Извлечение engagement metrics публичного твита X завершилось диагностикой ошибки.",
      ...result
    };
  });
}
