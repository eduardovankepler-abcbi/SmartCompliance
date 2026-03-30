import { Router } from "express";
import { requireRoles } from "../auth/middleware.js";
import { badRequest } from "./helpers.js";

export function createPeopleRouter(store) {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      res.json(await store.getPeople(req.auth.user));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", requireRoles("admin", "hr"), async (req, res) => {
    const {
      name,
      roleTitle,
      area,
      managerPersonId,
      employmentType,
      satisfactionScore
    } = req.body;

    if (!name || !roleTitle || !area || !employmentType) {
      return badRequest(res, "Campos obrigatorios da pessoa nao informados.");
    }

    try {
      const person = await store.createPerson(
        {
          name,
          roleTitle,
          area,
          managerPersonId: managerPersonId || null,
          employmentType,
          satisfactionScore: Number(satisfactionScore || 0)
        },
        req.auth.user
      );
      res.status(201).json(person);
    } catch (error) {
      res.status(400).json({ error: error.message || "Falha ao cadastrar pessoa." });
    }
  });

  return router;
}
