import type { FastifyInstance } from "fastify";
import { runXTweetFieldsDiagnostics } from "../services/xTweetFieldsService.js";

interface XTweetFieldsQuery {
  targetUrl?: string;
  waitStrategy?: string;
}

export async function registerXTweetFieldsRoutes(app: FastifyInstance) {
  app.get("/api/browser/x-tweet-fields-test", async (request) => {
    const query = (request.query ?? {}) as XTweetFieldsQuery;
    const result = await runXTweetFieldsDiagnostics(
      {
        targetUrl: query.targetUrl,
        waitStrategy: query.waitStrategy
      },
      app.log
    );

    return {
      message:
        result.status === "ok"
          ? "Извлечение верхнеуровневых полей публичного твита X завершено успешно."
          : result.status === "partial"
            ? "Извлечение верхнеуровневых полей публичного твита X завершено частично."
            : "Извлечение верхнеуровневых полей публичного твита X завершилось диагностикой ошибки.",
      ...result
    };
  });
}
