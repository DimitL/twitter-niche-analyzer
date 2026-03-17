import type { FastifyInstance } from "fastify";
import { runXAccountRecentPostsDiagnostics } from "../services/xAccountRecentPostsService.js";

interface XAccountRecentPostsQuery {
  handle?: string;
  targetUrl?: string;
  waitStrategy?: string;
  limit?: string;
}

export async function registerXAccountRecentPostsRoutes(app: FastifyInstance) {
  app.get("/api/browser/x-account-recent-posts-test", async (request) => {
    const query = (request.query ?? {}) as XAccountRecentPostsQuery;
    const result = await runXAccountRecentPostsDiagnostics(
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
          ? "Агрегация недавних постов публичного X-аккаунта завершена успешно."
          : result.status === "partial"
            ? "Агрегация недавних постов публичного X-аккаунта завершена частично."
            : "Агрегация недавних постов публичного X-аккаунта завершилась диагностикой ошибки.",
      ...result
    };
  });
}
