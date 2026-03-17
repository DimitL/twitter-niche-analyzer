import type { FastifyInstance } from "fastify";
import { appConfig } from "@twitter-niche-analyzer/shared";

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/api/health", async () => ({
    status: "ok",
    service: "backend",
    collectionProvider: appConfig.collection.provider,
    selectorsVersion: appConfig.collection.selectorsVersion,
    timestamp: new Date().toISOString()
  }));
}
