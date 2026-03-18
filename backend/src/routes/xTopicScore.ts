import type { FastifyInstance } from "fastify";
import type { XTopicBucketInput } from "../config/xTopicBucketCompareConfig.js";
import { runXTopicScoreDiagnostics } from "../services/xTopicScoreService.js";

interface XTopicScoreBody {
  buckets?: XTopicBucketInput[];
  limit?: string | number;
  includeUncertain?: string | boolean;
  treatQuoteAsUsable?: string | boolean;
  sortBy?: string;
}

export async function registerXTopicScoreRoutes(app: FastifyInstance) {
  app.post("/api/browser/x-topic-score-test", async (request) => {
    const body = (request.body ?? {}) as XTopicScoreBody;
    const result = await runXTopicScoreDiagnostics(
      {
        buckets: body.buckets,
        limit: body.limit,
        includeUncertain: body.includeUncertain,
        treatQuoteAsUsable: body.treatQuoteAsUsable,
        sortBy: body.sortBy
      },
      app.log
    );

    return {
      message:
        result.status === "ok"
          ? "Topic-level scoring завершён успешно."
          : result.status === "partial"
            ? "Topic-level scoring завершён частично."
            : "Topic-level scoring завершился диагностикой ошибки.",
      ...result
    };
  });
}
