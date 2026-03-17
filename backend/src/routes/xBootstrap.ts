import type { FastifyInstance } from "fastify";
import { runXBootstrapDiagnostics } from "../services/xBootstrapService.js";

interface XBootstrapQuery {
  targetUrl?: string;
  waitStrategy?: string;
}

export async function registerXBootstrapRoutes(app: FastifyInstance) {
  app.get("/api/browser/x-bootstrap-test", async (request) => {
    const query = (request.query ?? {}) as XBootstrapQuery;
    const result = await runXBootstrapDiagnostics(
      {
        targetUrl: query.targetUrl,
        waitStrategy: query.waitStrategy
      },
      app.log
    );

    return {
      message:
        result.status === "ok"
          ? "X bootstrap проверка завершена успешно."
          : "X bootstrap проверка завершилась с диагностикой ошибки.",
      ...result
    };
  });
}
