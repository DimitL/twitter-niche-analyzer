import type { FastifyInstance } from "fastify";
import type { XTopicBucketInput } from "../config/xTopicBucketCompareConfig.js";
import { runXTopicBucketCompareDiagnostics } from "../services/xTopicBucketCompareService.js";

interface XTopicBucketCompareBody {
  buckets?: XTopicBucketInput[];
  limit?: string | number;
  includeUncertain?: string | boolean;
  treatQuoteAsUsable?: string | boolean;
  sortBy?: string;
}

export async function registerXTopicBucketCompareRoutes(app: FastifyInstance) {
  app.post("/api/browser/x-topic-bucket-compare-test", async (request) => {
    const body = (request.body ?? {}) as XTopicBucketCompareBody;
    const result = await runXTopicBucketCompareDiagnostics(
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
          ? "Сравнение topic buckets завершено успешно."
          : result.status === "partial"
            ? "Сравнение topic buckets завершено частично."
            : "Сравнение topic buckets завершилось диагностикой ошибки.",
      ...result
    };
  });
}
