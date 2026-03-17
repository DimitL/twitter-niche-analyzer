import type { FastifyInstance } from "fastify";
import { analysisRequestSchema } from "@twitter-niche-analyzer/shared";
import { runMockAnalysis } from "../services/mockAnalysisService.js";

export async function registerAnalysisRoutes(app: FastifyInstance) {
  app.post("/api/analysis", async (request, reply) => {
    const parsedRequest = analysisRequestSchema.safeParse(request.body ?? {});

    if (!parsedRequest.success) {
      return reply.code(400).send({
        message: "Некорректные параметры анализа.",
        issues: parsedRequest.error.flatten()
      });
    }

    return runMockAnalysis(parsedRequest.data);
  });
}
