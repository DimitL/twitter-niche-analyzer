import type { FastifyInstance } from "fastify";
import { registerAnalysisRoutes } from "./analysis.js";
import { registerHealthRoutes } from "./health.js";
import { registerXAccountRecentPostsRoutes } from "./xAccountRecentPosts.js";
import { registerXAccountScoreRoutes } from "./xAccountScore.js";
import { registerXMultiAccountCompareRoutes } from "./xMultiAccountCompare.js";
import { registerXProfileFieldsRoutes } from "./xProfileFields.js";
import { registerXProfileTimelineClassificationRoutes } from "./xProfileTimelineClassification.js";
import { registerXProfileTimelineUrlsRoutes } from "./xProfileTimelineUrls.js";
import { registerXBootstrapRoutes } from "./xBootstrap.js";
import { registerXNicheShortlistRoutes } from "./xNicheShortlist.js";
import { registerXTopicBucketCompareRoutes } from "./xTopicBucketCompare.js";
import { registerXTopicScoreRoutes } from "./xTopicScore.js";
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
  await registerXProfileTimelineClassificationRoutes(app);
  await registerXTweetShellRoutes(app);
  await registerXTweetFieldsRoutes(app);
  await registerXTweetMetricsRoutes(app);
  await registerXAccountRecentPostsRoutes(app);
  await registerXAccountScoreRoutes(app);
  await registerXMultiAccountCompareRoutes(app);
  await registerXTopicBucketCompareRoutes(app);
  await registerXTopicScoreRoutes(app);
  await registerXNicheShortlistRoutes(app);
  await registerAnalysisRoutes(app);
}
