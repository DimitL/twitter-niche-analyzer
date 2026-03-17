import type { FastifyInstance } from "fastify";
import { runXProfileTimelineUrlsDiagnostics } from "../services/xProfileTimelineUrlsService.js";

interface XProfileTimelineUrlsQuery {
  handle?: string;
  targetUrl?: string;
  waitStrategy?: string;
  limit?: string;
}

export async function registerXProfileTimelineUrlsRoutes(app: FastifyInstance) {
  app.get("/api/browser/x-profile-timeline-urls-test", async (request) => {
    const query = (request.query ?? {}) as XProfileTimelineUrlsQuery;
    const result = await runXProfileTimelineUrlsDiagnostics(
      {
        handle: query.handle,
        targetUrl: query.targetUrl,
        waitStrategy: query.waitStrategy,
        limit: query.limit
      },
      app.log
    );

    return {
      message:
        result.status === "ok"
          ? "Discovery недавних tweet URL из публичной ленты профиля X завершён успешно."
          : result.status === "partial"
            ? "Discovery недавних tweet URL из публичной ленты профиля X завершён частично."
            : "Discovery недавних tweet URL из публичной ленты профиля X завершился диагностикой ошибки.",
      ...result
    };
  });
}
