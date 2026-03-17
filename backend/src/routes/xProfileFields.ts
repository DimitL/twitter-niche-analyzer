import type { FastifyInstance } from "fastify";
import { runXProfileFieldsDiagnostics } from "../services/xProfileFieldsService.js";

interface XProfileFieldsQuery {
  handle?: string;
  targetUrl?: string;
  waitStrategy?: string;
}

export async function registerXProfileFieldsRoutes(app: FastifyInstance) {
  app.get("/api/browser/x-profile-fields-test", async (request) => {
    const query = (request.query ?? {}) as XProfileFieldsQuery;
    const result = await runXProfileFieldsDiagnostics(
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
          ? "Извлечение identity/header полей публичного профиля X завершено успешно."
          : result.status === "partial"
            ? "Извлечение identity/header полей публичного профиля X завершено частично."
            : "Извлечение identity/header полей публичного профиля X завершилось диагностикой ошибки.",
      ...result
    };
  });
}
