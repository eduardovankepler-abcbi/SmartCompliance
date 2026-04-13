import cors from "cors";
import express from "express";
import { requireAuth } from "./auth/middleware.js";
import { env } from "./config/env.js";
import { createAuthRouter } from "./routes/auth.js";
import { createAuditRouter } from "./routes/audit.js";
import { createApplauseRouter } from "./routes/applause.js";
import { createAreasRouter } from "./routes/areas.js";
import { createCompetenciesRouter } from "./routes/competencies.js";
import { createDashboardsRouter } from "./routes/dashboards.js";
import { createDevelopmentRouter } from "./routes/development.js";
import { createEvaluationsRouter } from "./routes/evaluations.js";
import { createIncidentsRouter } from "./routes/incidents.js";
import { createPeopleRouter } from "./routes/people.js";
import { createSummaryRouter } from "./routes/summary.js";
import { createUsersRouter } from "./routes/users.js";

export function createApp(store) {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    cors({
      origin: env.corsOrigin
    })
  );
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Resource-Policy", "same-site");
    next();
  });
  app.use(express.json({ limit: "50kb" }));

  app.get("/health", async (_req, res) => {
    try {
      const storeHealth = store.checkHealth ? await store.checkHealth() : {};
      res.json({
        status: "ok",
        storageMode: env.storageMode,
        ...storeHealth
      });
    } catch (error) {
      console.error("Health check failed", error);
      res.status(503).json({
        status: "degraded",
        storageMode: env.storageMode,
        database: "unavailable"
      });
    }
  });

  app.use("/api/auth", createAuthRouter(store));
  app.use("/api", requireAuth(store));
  app.use("/api/summary", createSummaryRouter(store));
  app.use("/api/audit-trail", createAuditRouter(store));
  app.use("/api/areas", createAreasRouter(store));
  app.use("/api/competencies", createCompetenciesRouter(store));
  app.use("/api/people", createPeopleRouter(store));
  app.use("/api/users", createUsersRouter(store));
  app.use("/api/incidents", createIncidentsRouter(store));
  app.use("/api/evaluations", createEvaluationsRouter(store));
  app.use("/api/applause", createApplauseRouter(store));
  app.use("/api/development", createDevelopmentRouter(store));
  app.use("/api/dashboards", createDashboardsRouter(store));

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({
      error: "Erro interno ao processar a solicitacao."
    });
  });

  return app;
}
