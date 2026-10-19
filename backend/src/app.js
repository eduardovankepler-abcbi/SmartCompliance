import cors from "cors";
import crypto from "crypto";
import express from "express";
import { requireAuth } from "./auth/middleware.js";
import { env } from "./config/env.js";
import { logger } from "./observability/logger.js";
import { createAuthRouter } from "./routes/auth.js";
import { createAuditRouter } from "./routes/audit.js";
import { createApplauseRouter } from "./routes/applause.js";
import { createAnalyticsRouter } from "./routes/analytics.js";
import { createAreasRouter } from "./routes/areas.js";
import { createCompetenciesRouter } from "./routes/competencies.js";
import { createDashboardsRouter } from "./routes/dashboards.js";
import { createDevelopmentRouter } from "./routes/development.js";
import { createEvaluationsRouter } from "./routes/evaluations.js";
import { createIncidentsRouter } from "./routes/incidents.js";
import { createPeopleRouter } from "./routes/people.js";
import { createSummaryRouter } from "./routes/summary.js";
import { createUsersRouter } from "./routes/users.js";

export function shouldSendHsts(nodeEnv, isSecure) {
  return nodeEnv === "production" && isSecure;
}

export function hasTrustedMutationOrigin(origin, corsOrigin = env.corsOrigin) {
  if (!origin) {
    return true;
  }
  if (typeof corsOrigin === "string") {
    return corsOrigin === origin;
  }

  let allowed = false;
  corsOrigin(origin, (error, result) => {
    allowed = !error && result === true;
  });
  return allowed;
}

export function createApp(store) {
  const app = express();

  app.disable("x-powered-by");
  if (env.trustProxy !== false) {
    app.set("trust proxy", env.trustProxy);
  }
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true
    })
  );
  app.use("/api", (req, res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      !hasTrustedMutationOrigin(req.headers.origin)
    ) {
      return res.status(403).json({ error: "Origem da solicitacao nao autorizada." });
    }
    next();
  });
  app.use((req, res, next) => {
    const requestId =
      req.headers["x-request-id"] ||
      `req_${crypto.randomUUID()}`;
    req.requestId = String(requestId);
    res.setHeader("X-Request-Id", req.requestId);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Resource-Policy", "same-site");
    if (shouldSendHsts(env.nodeEnv, req.secure)) {
      res.setHeader("Strict-Transport-Security", "max-age=31536000");
    }
    next();
  });
  app.use("/api", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.use(express.json({ limit: "50kb" }));

  app.get("/health", async (_req, res) => {
    const checkedAt = new Date().toISOString();
    try {
      const storeHealth = store.checkHealth ? await store.checkHealth() : {};
      const databaseReady =
        storeHealth.database === "ok" || storeHealth.database === "memory";
      res.json({
        status: "ok",
        ready: databaseReady,
        checkedAt
      });
    } catch (error) {
      logger.error("healthcheck.failed", {
        requestId: _req.requestId,
        storageMode: env.storageMode,
        error
      });
      res.status(503).json({
        status: "degraded",
        ready: false,
        checkedAt
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
  app.use("/api/analytics", createAnalyticsRouter(store));

  app.use((error, req, res, _next) => {
    if (error.type === "entity.parse.failed") {
      return res.status(400).json({ error: "JSON invalido." });
    }
    if (error.type === "entity.too.large" || error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "Conteudo excede o limite permitido." });
    }
    logger.error("http.unhandled_error", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      error
    });
    res.status(500).json({
      error: "Erro interno ao processar a solicitacao."
    });
  });

  return app;
}
