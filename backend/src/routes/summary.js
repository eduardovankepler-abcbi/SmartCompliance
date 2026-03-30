import { Router } from "express";

export function createSummaryRouter(store) {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      res.json(await store.getSummary(req.auth.user));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
