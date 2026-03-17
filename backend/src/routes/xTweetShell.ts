import type { FastifyInstance } from "fastify";
import { runXTweetShellDiagnostics } from "../services/xTweetShellService.js";

interface XTweetShellQuery {
  targetUrl?: string;
  waitStrategy?: string;
}

export async function registerXTweetShellRoutes(app: FastifyInstance) {
  app.get("/api/browser/x-tweet-shell-test", async (request) => {
    const query = (request.query ?? {}) as XTweetShellQuery;
    const result = await runXTweetShellDiagnostics(
      {
        targetUrl: query.targetUrl,
        waitStrategy: query.waitStrategy
      },
      app.log
    );

    return {
      message:
        result.status === "ok"
          ? "Проверка shell публичного твита X завершена успешно."
          : "Проверка shell публичного твита X завершилась диагностикой ошибки.",
      ...result
    };
  });
}
