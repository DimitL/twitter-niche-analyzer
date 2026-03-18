import type { FastifyInstance } from "fastify";
import { runXProfileTimelineClassificationDiagnostics } from "../services/xProfileTimelineClassificationService.js";

interface XProfileTimelineClassificationQuery {
  handle?: string;
  targetUrl?: string;
  waitStrategy?: string;
  limit?: string;
  treatQuoteAsUsable?: string;
}

export async function registerXProfileTimelineClassificationRoutes(
  app: FastifyInstance
) {
  app.get("/api/browser/x-profile-timeline-classification-test", async (request) => {
    const query = (request.query ?? {}) as XProfileTimelineClassificationQuery;
    const result = await runXProfileTimelineClassificationDiagnostics(
      {
        handle: query.handle,
        targetUrl: query.targetUrl,
        waitStrategy: query.waitStrategy,
        limit: query.limit,
        treatQuoteAsUsable: query.treatQuoteAsUsable
      },
      app.log
    );

    return {
      message:
        result.status === "ok"
          ? "Классификация постов публичной X timeline завершена успешно."
          : result.status === "partial"
            ? "Классификация постов публичной X timeline завершена частично."
            : "Классификация постов публичной X timeline завершилась диагностикой ошибки.",
      ...result
    };
  });
}
