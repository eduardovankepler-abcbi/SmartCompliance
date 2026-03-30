import { Router } from "express";
import { requireRoles } from "../auth/middleware.js";
import { badRequest } from "./helpers.js";

export function createIncidentsRouter(store) {
  const router = Router();

  router.get("/", async (req, res, next) => {
    try {
      res.json(await store.getIncidents(req.auth.user));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    const {
      title,
      category,
      classification,
      anonymity,
      reporterLabel,
      assignedTo,
      description
    } =
      req.body;

    if (!title || !category || !classification || !anonymity || !assignedTo || !description) {
      return badRequest(res, "Campos obrigatorios do relato nao informados.");
    }

    try {
      const incident = await store.createIncident({
        title,
        category,
        classification,
        anonymity,
        reporterLabel:
          reporterLabel || (anonymity === "anonymous" ? "Anonimo" : "Identificado"),
        assignedTo,
        description
      }, req.auth.user);

      res.status(201).json(incident);
    } catch (error) {
      res.status(400).json({ error: error.message || "Falha ao registrar relato." });
    }
  });

  router.patch(
    "/:incidentId",
    requireRoles("admin", "hr", "compliance"),
    async (req, res) => {
      const { classification, status, assignedTo } = req.body;

      if (!classification || !status || !assignedTo) {
        return badRequest(res, "classification, status e assignedTo sao obrigatorios.");
      }

      try {
        const incident = await store.updateIncident(
          req.params.incidentId,
          { classification, status, assignedTo },
          req.auth.user
        );
        res.json(incident);
      } catch (error) {
        res
          .status(400)
          .json({ error: error.message || "Falha ao atualizar o caso de compliance." });
      }
    }
  );

  return router;
}
