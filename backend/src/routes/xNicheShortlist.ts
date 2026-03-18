import type { FastifyInstance } from "fastify";
import type { XTopicBucketInput } from "../config/xTopicBucketCompareConfig.js";
import { runXNicheShortlistDiagnostics } from "../services/xNicheShortlistService.js";

interface XNicheShortlistBody {
  buckets?: XTopicBucketInput[];
  limit?: string | number;
  includeUncertain?: string | boolean;
  treatQuoteAsUsable?: string | boolean;
  sortBy?: string;
  topN?: string | number;
  emphasizeGrowth?: string | boolean;
  emphasizeMonetization?: string | boolean;
  emphasizeEase?: string | boolean;
}

export async function registerXNicheShortlistRoutes(app: FastifyInstance) {
  app.post("/api/browser/x-niche-shortlist-test", async (request) => {
    const body = (request.body ?? {}) as XNicheShortlistBody;
    const result = await runXNicheShortlistDiagnostics(
      {
        buckets: body.buckets,
        limit: body.limit,
        includeUncertain: body.includeUncertain,
        treatQuoteAsUsable: body.treatQuoteAsUsable,
        sortBy: body.sortBy,
        topN: body.topN,
        emphasizeGrowth: body.emphasizeGrowth,
        emphasizeMonetization: body.emphasizeMonetization,
        emphasizeEase: body.emphasizeEase
      },
      app.log
    );

    return {
      message:
        result.status === "ok"
          ? "Niche shortlist сформирован успешно."
          : result.status === "partial"
            ? "Niche shortlist сформирован частично."
            : "Niche shortlist завершился диагностикой ошибки.",
      ...result
    };
  });
}
