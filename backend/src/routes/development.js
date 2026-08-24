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

  router.get("/records", requireRoles("admin", "hr", "manager", "employee"), async (req, res, next) => {
    try {
      res.json(await store.getDevelopmentRecords(req.auth.user));
    } catch (error) {
      next(error);
    }
  });

  router.post("/records", requireRoles("admin", "hr", "manager", "employee"), async (req, res, next) => {
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

  router.patch(
    "/records/:recordId",
    requireRoles("admin", "hr", "manager", "employee"),
    async (req, res, next) => {
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
    }
  );

  router.get("/plans", requireRoles("admin", "hr", "manager", "employee"), async (req, res, next) => {
    try {
      res.json(await store.getDevelopmentPlans(req.auth.user));
    } catch (error) {
      next(error);
    }
  });

  router.post("/plans", requireRoles("admin", "hr", "manager", "employee"), async (req, res, next) => {
    const {
      personId,
      cycleId,
      competencyId,
      focusTitle,
      actionText,
      dueDate,
      expectedEvidence,
      isComplianceRequired
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
          expectedEvidence,
          isComplianceRequired: Boolean(isComplianceRequired)
        },
        req.auth.user
      );

      res.status(201).json(plan);
    } catch (error) {
      res.status(400).json({ error: error.message || "Falha ao registrar PDI." });
    }
  });

  router.patch(
    "/plans/:planId",
    requireRoles("admin", "hr", "manager", "employee"),
    async (req, res, next) => {
    const { planId } = req.params;
    const {
      personId,
      cycleId,
      competencyId,
      focusTitle,
      actionText,
      dueDate,
      expectedEvidence,
      status,
      isComplianceRequired
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
          status,
          isComplianceRequired: Boolean(isComplianceRequired)
        },
        req.auth.user
      );

      res.json(plan);
    } catch (error) {
      res.status(400).json({ error: error.message || "Falha ao atualizar PDI." });
    }
    }
  );

  router.patch(
    "/plans/:planId/progress",
    requireRoles("admin", "hr", "manager", "employee"),
    async (req, res, next) => {
    const { planId } = req.params;
    const { progressStatus, progressNote } = req.body;

    if (!progressStatus) {
      return badRequest(res, "Status de andamento do PDI nao informado.");
    }

    try {
      const plan = await store.updateDevelopmentPlanProgress(
        planId,
        {
          progressStatus,
          progressNote: progressNote || ""
        },
        req.auth.user
      );

      res.json(plan);
    } catch (error) {
      res
        .status(400)
        .json({ error: error.message || "Falha ao atualizar andamento do PDI." });
    }
    }
  );

  router.get(
    "/plans/extensions",
    requireRoles("admin", "hr", "manager"),
    async (req, res, next) => {
      try {
        res.json(await store.listDevelopmentPlanExtensions(req.auth.user));
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    "/plans/:planId/extensions",
    requireRoles("admin", "hr", "manager"),
    async (req, res) => {
      const { requestedDueDate, reason } = req.body || {};
      if (!requestedDueDate || !reason) {
        return badRequest(res, "requestedDueDate e reason sao obrigatorios.");
      }

      try {
        const extension = await store.requestDevelopmentPlanExtension(
          req.params.planId,
          { requestedDueDate, reason },
          req.auth.user
        );
        res.status(201).json(extension);
      } catch (error) {
        res
          .status(400)
          .json({ error: error.message || "Falha ao solicitar extensao do PDI." });
      }
    }
  );

  router.patch(
    "/plans/:planId/extensions/:extensionId",
    requireRoles("admin", "hr", "manager"),
    async (req, res) => {
      const { status, decisionNote } = req.body || {};
      if (!status) {
        return badRequest(res, "status da decisao obrigatorio.");
      }

      try {
        const extension = await store.decideDevelopmentPlanExtension(
          req.params.planId,
          req.params.extensionId,
          { status, decisionNote: decisionNote || "" },
          req.auth.user
        );
        res.json(extension);
      } catch (error) {
        res
          .status(400)
          .json({ error: error.message || "Falha ao decidir extensao do PDI." });
      }
    }
  );

  return router;
}
