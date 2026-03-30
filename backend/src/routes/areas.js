import { Router } from "express";
import { requireRoles } from "../auth/middleware.js";
import { badRequest } from "./helpers.js";

export function createAreasRouter(store) {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      res.json(await store.getAreas(req.auth.user));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", requireRoles("admin", "hr"), async (req, res) => {
    const { name, managerPersonId } = req.body;

    if (!name) {
      return badRequest(res, "Nome da area e obrigatorio.");
    }

    try {
      const area = await store.createArea(
        {
          name,
          managerPersonId: managerPersonId || null
        },
        req.auth.user
      );
      res.status(201).json(area);
    } catch (error) {
      res.status(400).json({ error: error.message || "Falha ao cadastrar area." });
    }
  });

  router.patch("/:areaId", requireRoles("admin", "hr"), async (req, res) => {
    const { name, managerPersonId } = req.body;

    if (!name) {
      return badRequest(res, "Nome da area e obrigatorio.");
    }

    try {
      const area = await store.updateArea(
        req.params.areaId,
        {
          name,
          managerPersonId: managerPersonId || null
        },
        req.auth.user
      );
      res.json(area);
    } catch (error) {
      res.status(400).json({ error: error.message || "Falha ao atualizar area." });
    }
  });

  return router;
}
