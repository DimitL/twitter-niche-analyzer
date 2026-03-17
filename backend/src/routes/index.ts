import type { FastifyInstance } from "fastify";
import { registerAnalysisRoutes } from "./analysis.js";
import { registerHealthRoutes } from "./health.js";
import { registerXProfileFieldsRoutes } from "./xProfileFields.js";
import { registerXProfileTimelineUrlsRoutes } from "./xProfileTimelineUrls.js";
import { registerXBootstrapRoutes } from "./xBootstrap.js";
import { registerXTweetFieldsRoutes } from "./xTweetFields.js";
import { registerXTweetMetricsRoutes } from "./xTweetMetrics.js";
import { registerXProfileShellRoutes } from "./xProfileShell.js";
import { registerXTweetShellRoutes } from "./xTweetShell.js";

export async function registerRoutes(app: FastifyInstance) {
  await registerHealthRoutes(app);
  await registerXBootstrapRoutes(app);
  await registerXProfileShellRoutes(app);
  await registerXProfileFieldsRoutes(app);
  await registerXProfileTimelineUrlsRoutes(app);
  await registerXTweetShellRoutes(app);
  await registerXTweetFieldsRoutes(app);
  await registerXTweetMetricsRoutes(app);
  await registerAnalysisRoutes(app);
}
