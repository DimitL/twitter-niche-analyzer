import type { FastifyInstance } from "fastify";
import { registerAnalysisRoutes } from "./analysis.js";
import { registerHealthRoutes } from "./health.js";
import { registerXBootstrapRoutes } from "./xBootstrap.js";
import { registerXProfileShellRoutes } from "./xProfileShell.js";

export async function registerRoutes(app: FastifyInstance) {
  await registerHealthRoutes(app);
  await registerXBootstrapRoutes(app);
  await registerXProfileShellRoutes(app);
  await registerAnalysisRoutes(app);
}
