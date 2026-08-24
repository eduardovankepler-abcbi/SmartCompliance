import { Router } from "express";
import multer from "multer";
import { PERMISSIONS } from "../auth/permissions.js";
import { requireRoles } from "../auth/middleware.js";
import { INCIDENT_EVIDENCE_MAX_BYTES } from "../data/storeIncidentsDomain.js";
import { badRequest } from "./helpers.js";

export function createIncidentsRouter(store) {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: INCIDENT_EVIDENCE_MAX_BYTES
    }
  });

  router.get("/", requireRoles(...PERMISSIONS.incidentQueue), async (req, res, next) => {
    try {
      res.json(await store.getIncidents(req.auth.user));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", requireRoles(...PERMISSIONS.complianceWorkspace), async (req, res, next) => {
    const {
      title,
      category,
      classification,
      anonymity,
      reporterLabel,
      responsibleArea,
      assignedPersonId,
      subjectPersonId,
      description
    } =
      req.body;

    if (!title || !category || !classification || !anonymity || !responsibleArea || !description) {
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
        responsibleArea,
        assignedPersonId: assignedPersonId || null,
        subjectPersonId: subjectPersonId || null,
        description
      }, req.auth.user);

      res.status(201).json(incident);
    } catch (error) {
      res.status(400).json({ error: error.message || "Falha ao registrar relato." });
    }
  });

  router.patch(
    "/:incidentId",
    requireRoles(...PERMISSIONS.incidentQueue),
    async (req, res) => {
      const { classification, status, responsibleArea, assignedPersonId, subjectPersonId, findingStatus, closureNote } = req.body;

      if (!classification || !status || !responsibleArea) {
        return badRequest(res, "classification, status e responsibleArea sao obrigatorios.");
      }

      try {
        const incident = await store.updateIncident(
          req.params.incidentId,
          {
            classification,
            status,
            responsibleArea,
            assignedPersonId: assignedPersonId || null,
            subjectPersonId: subjectPersonId || null,
            findingStatus: findingStatus || "pending",
            closureNote: closureNote || ""
          },
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

  router.get(
    "/:incidentId/evidences",
    requireRoles(...PERMISSIONS.incidentQueue),
    async (req, res, next) => {
      try {
        res.json(await store.listIncidentEvidences(req.params.incidentId, req.auth.user));
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    "/:incidentId/evidences",
    requireRoles(...PERMISSIONS.incidentQueue),
    upload.single("file"),
    async (req, res) => {
      try {
        const evidence = await store.addIncidentEvidence(
          req.params.incidentId,
          req.file,
          req.auth.user
        );
        res.status(201).json(evidence);
      } catch (error) {
        res.status(400).json({ error: error.message || "Falha ao anexar evidencia." });
      }
    }
  );

  router.get(
    "/:incidentId/evidences/:evidenceId",
    requireRoles(...PERMISSIONS.incidentQueue),
    async (req, res) => {
      try {
        const evidence = await store.getIncidentEvidenceFile(
          req.params.incidentId,
          req.params.evidenceId,
          req.auth.user
        );
        res.setHeader("Content-Type", evidence.mimeType);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${encodeURIComponent(evidence.fileName)}"`
        );
        res.send(evidence.content);
      } catch (error) {
        res.status(404).json({ error: error.message || "Evidencia nao encontrada." });
      }
    }
  );

  return router;
}
