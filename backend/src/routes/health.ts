import type { FastifyInstance } from "fastify";
import { appConfig } from "@twitter-niche-analyzer/shared";
import { browserConfig } from "../config/browserConfig.js";

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/api/health", async () => ({
    status: "ok",
    service: "backend",
    collectionProvider: appConfig.collection.provider,
    selectorsVersion: appConfig.collection.selectorsVersion,
    browserHeadless: browserConfig.headless,
    timestamp: new Date().toISOString()
  }));
}
