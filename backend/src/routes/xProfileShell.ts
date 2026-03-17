import type { FastifyInstance } from "fastify";
import { runXProfileShellDiagnostics } from "../services/xProfileShellService.js";

interface XProfileShellQuery {
  handle?: string;
  targetUrl?: string;
  waitStrategy?: string;
}

export async function registerXProfileShellRoutes(app: FastifyInstance) {
  app.get("/api/browser/x-profile-shell-test", async (request) => {
    const query = (request.query ?? {}) as XProfileShellQuery;
    const result = await runXProfileShellDiagnostics(
      {
        handle: query.handle,
        targetUrl: query.targetUrl,
        waitStrategy: query.waitStrategy
      },
      app.log
    );

    return {
      message:
        result.status === "ok"
          ? "Проверка shell публичного профиля X завершена успешно."
          : "Проверка shell публичного профиля X завершилась диагностикой ошибки.",
      ...result
    };
  });
}
