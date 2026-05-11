import { Router } from "express";
import { requireRoles } from "../auth/middleware.js";

export function createAnalyticsRouter(store) {
  const router = Router();

  router.get("/powerbi/evaluation-results", requireRoles("admin", "hr"), async (_req, res, next) => {
    try {
      res.json(await store.getPowerBiEvaluationDataset());
    } catch (error) {
      next(error);
    }
  });

  router.get("/powerbi/rls-viewers", requireRoles("admin", "hr"), async (_req, res, next) => {
    try {
      const dataset = await store.getPowerBiEvaluationDataset();
      res.json({
        generatedAt: dataset.generatedAt,
        rlsViewers: dataset.security.rlsViewers
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
