import { Router } from "express";
import { requireRoles } from "../auth/middleware.js";

export function createAuditRouter(store) {
  const router = Router();

  router.get(
    "/",
    requireRoles("admin", "hr", "compliance", "manager"),
    async (req, res, next) => {
      try {
        const limit = Number(req.query.limit || 40);
        res.json(
          await store.getAuditTrail(req.auth.user, {
            category: req.query.category || null,
            limit: Number.isFinite(limit) ? limit : 40
          })
        );
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
