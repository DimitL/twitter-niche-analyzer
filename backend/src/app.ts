import cors from "@fastify/cors";
import Fastify from "fastify";
import { registerRoutes } from "./routes/index.js";

export async function buildApp() {
  const app = Fastify({
    logger: true
  });

  const configuredOrigins = process.env.FRONTEND_ORIGIN?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  await app.register(cors, {
    origin: configuredOrigins?.length ? configuredOrigins : true
  });

  await registerRoutes(app);

  return app;
}
