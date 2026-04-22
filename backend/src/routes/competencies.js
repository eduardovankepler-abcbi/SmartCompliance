import { Router } from "express";
import { requireRoles } from "../auth/middleware.js";
import { badRequest } from "./helpers.js";

export function createCompetenciesRouter(store) {
  const router = Router();

  router.get("/", requireRoles("admin", "hr", "manager"), async (req, res, next) => {
    try {
      res.json(await store.getCompetencies(req.auth.user));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", requireRoles("admin", "hr"), async (req, res) => {
    const { name, key, description, status } = req.body;

    if (!name) {
      return badRequest(res, "Nome da competencia e obrigatorio.");
    }

    try {
      const competency = await store.createCompetency(
        {
          name,
          key: key || "",
          description: description || "",
          status: status || "active"
        },
        req.auth.user
      );
      res.status(201).json(competency);
    } catch (error) {
      res.status(400).json({ error: error.message || "Falha ao cadastrar competencia." });
    }
  });

  router.patch("/:competencyId", requireRoles("admin", "hr"), async (req, res) => {
    const { name, key, description, status } = req.body;

    if (!name) {
      return badRequest(res, "Nome da competencia e obrigatorio.");
    }

    try {
      const competency = await store.updateCompetency(
        req.params.competencyId,
        {
          name,
          key: key || "",
          description: description || "",
          status: status || "active"
        },
        req.auth.user
      );
      res.json(competency);
    } catch (error) {
      res.status(400).json({ error: error.message || "Falha ao atualizar competencia." });
    }
  });

  return router;
}
