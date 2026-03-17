import type { FastifyInstance } from "fastify";
import { registerAnalysisRoutes } from "./analysis.js";
import { registerHealthRoutes } from "./health.js";

export async function registerRoutes(app: FastifyInstance) {
  await registerHealthRoutes(app);
  await registerAnalysisRoutes(app);
}
