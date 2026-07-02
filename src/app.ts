import express from "express";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import type { DB } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { tasksRouter } from "./routes/tasks.js";
import { openapiSpec } from "./openapi.js";

/**
 * Build the Express app around a database instance. Kept as a factory so tests
 * can inject an in-memory database.
 */
export function createApp(db: DB) {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  // Tighter limit on auth to slow down credential stuffing.
  const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 20 });
  const apiLimiter = rateLimit({ windowMs: 60_000, limit: 100 });

  app.use("/api/auth", authLimiter, authRouter(db));
  app.use("/api/tasks", apiLimiter, tasksRouter(db));

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));
  app.get("/openapi.json", (_req, res) => res.json(openapiSpec));

  // 404 + error handlers
  app.use((_req, res) => res.status(404).json({ error: "Not found." }));
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error(err);
      res.status(500).json({ error: "Internal server error." });
    }
  );

  return app;
}
