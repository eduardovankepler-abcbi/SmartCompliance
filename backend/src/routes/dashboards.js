import { Router } from "express";
import { requireRoles } from "../auth/middleware.js";

export function createDashboardsRouter(store) {
  const router = Router();

  router.get("/overview", requireRoles("admin", "hr", "compliance", "manager"), async (req, res, next) => {
    try {
      res.json(
        await store.getDashboardOverview(req.auth.user, {
          area: req.query.area || null,
          timeGrouping: req.query.timeGrouping || "semester"
        })
      );
    } catch (error) {
      next(error);
    }
  });

  return router;
}
