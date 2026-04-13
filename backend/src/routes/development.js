import { Router } from "express";
import { requireRoles } from "../auth/middleware.js";
import { badRequest } from "./helpers.js";

export function createDevelopmentRouter(store) {
  const router = Router();

  router.get("/integrations/learning-events", requireRoles("admin", "hr"), async (req, res, next) => {
    try {
      res.json(await store.getLearningIntegrationEvents(req.auth.user));
    } catch (error) {
      next(error);
    }
  });

  router.post("/integrations/learning-events", requireRoles("admin", "hr"), async (req, res) => {
    try {
      const result = await store.ingestLearningIntegrationEvents(req.body, req.auth.user);
      res.status(202).json(result);
    } catch (error) {
      res.status(400).json({
        error: error.message || "Falha ao receber cursos e treinamentos da integracao."
      });
    }
  });

  router.post("/integrations/learning-events/:eventId/apply", requireRoles("admin", "hr"), async (req, res) => {
    try {
      const result = await store.applyLearningIntegrationEvent(
        req.params.eventId,
        req.body || {},
        req.auth.user
      );
      res.json(result);
    } catch (error) {
      res.status(400).json({
        error: error.message || "Falha ao aplicar curso ou treinamento da integracao."
      });
    }
  });

  router.get("/records", async (req, res, next) => {
    try {
      res.json(await store.getDevelopmentRecords(req.auth.user));
    } catch (error) {
      next(error);
    }
  });

  router.post("/records", async (req, res, next) => {
    const {
      personId,
      recordType,
      title,
      providerName,
      completedAt,
      skillSignal,
      notes
    } = req.body;

    if (
      !personId ||
      !recordType ||
      !title ||
      !providerName ||
      !completedAt ||
      !skillSignal
    ) {
      return badRequest(
        res,
        "Campos obrigatorios do registro de desenvolvimento nao informados."
      );
    }

    try {
      const record = await store.createDevelopmentRecord({
        personId,
        recordType,
        title,
        providerName,
        completedAt,
        skillSignal,
        notes: notes || ""
      }, req.auth.user);

      res.status(201).json(record);
    } catch (error) {
      res
        .status(400)
        .json({ error: error.message || "Falha ao registrar desenvolvimento." });
    }
  });

  router.patch("/records/:recordId", async (req, res, next) => {
    const { recordId } = req.params;
    const {
      personId,
      recordType,
      title,
      providerName,
      completedAt,
      skillSignal,
      notes,
      status
    } = req.body;

    if (
      !personId ||
      !recordType ||
      !title ||
      !providerName ||
      !completedAt ||
      !skillSignal ||
      !status
    ) {
      return badRequest(
        res,
        "Campos obrigatorios do registro de desenvolvimento nao informados."
      );
    }

    try {
      const record = await store.updateDevelopmentRecord(
        recordId,
        {
          personId,
          recordType,
          title,
          providerName,
          completedAt,
          skillSignal,
          notes: notes || "",
          status
        },
        req.auth.user
      );

      res.json(record);
    } catch (error) {
      res
        .status(400)
        .json({ error: error.message || "Falha ao atualizar desenvolvimento." });
    }
  });

  router.get("/plans", async (req, res, next) => {
    try {
      res.json(await store.getDevelopmentPlans(req.auth.user));
    } catch (error) {
      next(error);
    }
  });

  router.post("/plans", async (req, res, next) => {
    const {
      personId,
      cycleId,
      competencyId,
      focusTitle,
      actionText,
      dueDate,
      expectedEvidence
    } = req.body;

    if (!personId || !focusTitle || !actionText || !dueDate || !expectedEvidence) {
      return badRequest(res, "Campos obrigatorios do PDI nao informados.");
    }

    try {
      const plan = await store.createDevelopmentPlan(
        {
          personId,
          cycleId: cycleId || null,
          competencyId: competencyId || null,
          focusTitle,
          actionText,
          dueDate,
          expectedEvidence
        },
        req.auth.user
      );

      res.status(201).json(plan);
    } catch (error) {
      res.status(400).json({ error: error.message || "Falha ao registrar PDI." });
    }
  });

  router.patch("/plans/:planId", async (req, res, next) => {
    const { planId } = req.params;
    const {
      personId,
      cycleId,
      competencyId,
      focusTitle,
      actionText,
      dueDate,
      expectedEvidence,
      status
    } = req.body;

    if (
      !personId ||
      !focusTitle ||
      !actionText ||
      !dueDate ||
      !expectedEvidence ||
      !status
    ) {
      return badRequest(res, "Campos obrigatorios do PDI nao informados.");
    }

    try {
      const plan = await store.updateDevelopmentPlan(
        planId,
        {
          personId,
          cycleId: cycleId || null,
          competencyId: competencyId || null,
          focusTitle,
          actionText,
          dueDate,
          expectedEvidence,
          status
        },
        req.auth.user
      );

      res.json(plan);
    } catch (error) {
      res.status(400).json({ error: error.message || "Falha ao atualizar PDI." });
    }
  });

  return router;
}
