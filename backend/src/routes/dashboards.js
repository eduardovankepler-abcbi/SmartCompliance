import { Router } from "express";
import { requireRoles } from "../auth/middleware.js";

export function createDashboardsRouter(store) {
  const router = Router();

  router.get("/overview", requireRoles("admin", "hr", "manager"), async (req, res, next) => {
    try {
      res.json(
        await store.getDashboardOverview(req.auth.user, {
          area: req.query.area || null,
          teamManagerId: req.query.teamManagerId || null,
          timeGrouping: req.query.timeGrouping || "semester"
        })
      );
    } catch (error) {
      next(error);
    }
  });

  router.get("/compliance", requireRoles("admin", "hr", "manager"), async (req, res, next) => {
    try {
      res.json(
        await store.getComplianceDashboard(req.auth.user, {
          area: req.query.area || null,
          teamManagerId: req.query.teamManagerId || null,
          timeGrouping: req.query.timeGrouping || "semester"
        })
      );
    } catch (error) {
      next(error);
    }
  });

  router.get("/applause", requireRoles("admin", "hr", "manager"), async (req, res, next) => {
    try {
      res.json(
        await store.getApplauseDashboard(req.auth.user, {
          area: req.query.area || null,
          teamManagerId: req.query.teamManagerId || null,
          timeGrouping: req.query.timeGrouping || "semester",
          category: req.query.category || null
        })
      );
    } catch (error) {
      next(error);
    }
  });

  return router;
}
