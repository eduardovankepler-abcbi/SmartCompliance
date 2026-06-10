import { Router } from "express";
import multer from "multer";
import { requireRoles } from "../auth/middleware.js";
import {
  buildLibraryTemplateWorkbook,
  parseLibraryFile,
  validateImportedLibraryRows
} from "../services/libraryImport.js";
import { badRequest } from "./helpers.js";

export function createEvaluationsRouter(store) {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 1024 * 1024 * 2
    }
  });

  router.get("/template", requireRoles("admin", "hr", "manager", "employee"), async (_req, res, next) => {
    try {
      res.json(await store.getEvaluationTemplate());
    } catch (error) {
      next(error);
    }
  });

  router.get("/library", requireRoles("admin", "hr"), async (_req, res, next) => {
    try {
      res.json(await store.getEvaluationLibrary());
    } catch (error) {
      next(error);
    }
  });

  router.post("/library/questions", requireRoles("hr"), async (req, res) => {
    try {
      res.status(201).json(
        await store.createEvaluationLibraryQuestion(req.body || {}, req.auth.user)
      );
    } catch (error) {
      res.status(400).json({ error: error.message || "Falha ao criar pergunta de avaliacao." });
    }
  });

  router.patch("/library/questions/:questionId", requireRoles("hr"), async (req, res) => {
    try {
      res.json(
        await store.updateEvaluationLibraryQuestion(
          req.params.questionId,
          req.body || {},
          req.auth.user
        )
      );
    } catch (error) {
      res.status(400).json({ error: error.message || "Falha ao atualizar pergunta de avaliacao." });
    }
  });

  router.delete("/library/questions/:questionId", requireRoles("hr"), async (req, res) => {
    try {
      res.json(await store.deleteEvaluationLibraryQuestion(req.params.questionId, req.auth.user));
    } catch (error) {
      res.status(400).json({ error: error.message || "Falha ao remover pergunta de avaliacao." });
    }
  });

  router.post("/library/questions/reorder", requireRoles("hr"), async (req, res) => {
    try {
      const { relationshipType, questionIds } = req.body || {};
      res.json(
        await store.reorderEvaluationLibraryQuestions(
          relationshipType,
          questionIds,
          req.auth.user
        )
      );
    } catch (error) {
      res.status(400).json({ error: error.message || "Falha ao reordenar perguntas." });
    }
  });

  router.get("/cycles", requireRoles("admin", "hr", "manager", "employee"), async (req, res, next) => {
    try {
      res.json(await store.getEvaluationCycles(req.auth.user));
    } catch (error) {
      next(error);
    }
  });

  router.get("/questionnaires", requireRoles("admin", "hr"), async (req, res) => {
    try {
      const { cycleId, revieweePersonId, relationshipType, status } = req.query || {};
      res.json(
        await store.getEvaluationQuestionnaires(
          { cycleId, revieweePersonId, relationshipType, status },
          req.auth.user
        )
      );
    } catch (error) {
      res
        .status(400)
        .json({ error: error.message || "Falha ao carregar questionarios individuais." });
    }
  });

  router.get("/questionnaires/:questionnaireId", requireRoles("admin", "hr"), async (req, res) => {
    try {
      res.json(
        await store.getEvaluationQuestionnaireById(req.params.questionnaireId, req.auth.user)
      );
    } catch (error) {
      res
        .status(400)
        .json({ error: error.message || "Falha ao carregar questionario individual." });
    }
  });

  router.post("/questionnaires", requireRoles("admin", "hr"), async (req, res) => {
    try {
      const questionnaire = await store.createEvaluationQuestionnaire(req.body || {}, req.auth.user);
      res.status(201).json(questionnaire);
    } catch (error) {
      res
        .status(400)
        .json({ error: error.message || "Falha ao criar questionario individual." });
    }
  });

  router.patch("/questionnaires/:questionnaireId", requireRoles("admin", "hr"), async (req, res) => {
    try {
      const questionnaire = await store.updateEvaluationQuestionnaire(
        req.params.questionnaireId,
        req.body || {},
        req.auth.user
      );
      res.json(questionnaire);
    } catch (error) {
      res
        .status(400)
        .json({ error: error.message || "Falha ao atualizar questionario individual." });
    }
  });

  router.post(
    "/questionnaires/:questionnaireId/publish",
    requireRoles("admin", "hr"),
    async (req, res) => {
      try {
        res.json(
          await store.publishEvaluationQuestionnaire(req.params.questionnaireId, req.auth.user)
        );
      } catch (error) {
        res
          .status(400)
          .json({ error: error.message || "Falha ao publicar questionario individual." });
      }
    }
  );

  router.post(
    "/questionnaires/:questionnaireId/archive",
    requireRoles("admin", "hr"),
    async (req, res) => {
      try {
        res.json(
          await store.archiveEvaluationQuestionnaire(req.params.questionnaireId, req.auth.user)
        );
      } catch (error) {
        res
          .status(400)
          .json({ error: error.message || "Falha ao arquivar questionario individual." });
      }
    }
  );

  router.post(
    "/questionnaires/:questionnaireId/questions",
    requireRoles("admin", "hr"),
    async (req, res) => {
      try {
        res.status(201).json(
          await store.addEvaluationQuestionnaireQuestion(
            req.params.questionnaireId,
            req.body || {},
            req.auth.user
          )
        );
      } catch (error) {
        res
          .status(400)
          .json({ error: error.message || "Falha ao adicionar pergunta ao questionario." });
      }
    }
  );

  router.patch(
    "/questionnaire-questions/:questionId",
    requireRoles("admin", "hr"),
    async (req, res) => {
      try {
        res.json(
          await store.updateEvaluationQuestionnaireQuestion(
            req.params.questionId,
            req.body || {},
            req.auth.user
          )
        );
      } catch (error) {
        res
          .status(400)
          .json({ error: error.message || "Falha ao atualizar pergunta do questionario." });
      }
    }
  );

  router.delete(
    "/questionnaire-questions/:questionId",
    requireRoles("admin", "hr"),
    async (req, res) => {
      try {
        res.json(
          await store.deleteEvaluationQuestionnaireQuestion(req.params.questionId, req.auth.user)
        );
      } catch (error) {
        res
          .status(400)
          .json({ error: error.message || "Falha ao remover pergunta do questionario." });
      }
    }
  );

  router.post(
    "/questionnaires/:questionnaireId/reorder",
    requireRoles("admin", "hr"),
    async (req, res) => {
      try {
        res.json(
          await store.reorderEvaluationQuestionnaireQuestions(
            req.params.questionnaireId,
            req.body || {},
            req.auth.user
          )
        );
      } catch (error) {
        res
          .status(400)
          .json({ error: error.message || "Falha ao reordenar perguntas do questionario." });
      }
    }
  );

  router.post("/cycles", requireRoles("admin", "hr"), async (req, res, next) => {
    const { title, semesterLabel, dueDate, targetGroup, libraryId } = req.body;

    if (!title || !semesterLabel || !dueDate || !targetGroup) {
      return badRequest(res, "Campos obrigatorios do ciclo nao informados.");
    }

    try {
      const cycle = await store.createEvaluationCycle({
        libraryId,
        title,
        semesterLabel,
        dueDate,
        targetGroup,
        createdByUserId: req.auth.user.id
      }, req.auth.user);

      res.status(201).json(cycle);
    } catch (error) {
      res.status(400).json({ error: error.message || "Falha ao abrir ciclo." });
    }
  });

  router.patch(
    "/cycles/:cycleId/status",
    requireRoles("admin", "hr"),
    async (req, res) => {
      const { status } = req.body;
      if (!status) {
        return badRequest(res, "Status do ciclo obrigatorio.");
      }

      try {
        const cycle = await store.updateEvaluationCycleStatus(
          req.params.cycleId,
          status,
          req.auth.user
        );
        res.json(cycle);
      } catch (error) {
        res
          .status(400)
          .json({ error: error.message || "Falha ao atualizar status do ciclo." });
      }
    }
  );

  router.patch(
    "/cycles/:cycleId/config",
    requireRoles("admin", "hr"),
    async (req, res) => {
      const { isEnabled, moduleAvailability, transversalConfig } = req.body || {};

      if (
        isEnabled === undefined &&
        moduleAvailability === undefined &&
        transversalConfig === undefined
      ) {
        return badRequest(
          res,
          "Informe isEnabled, moduleAvailability e/ou transversalConfig."
        );
      }

      try {
        const cycle = await store.updateEvaluationCycleConfig(
          req.params.cycleId,
          { isEnabled, moduleAvailability, transversalConfig },
          req.auth.user
        );
        res.json(cycle);
      } catch (error) {
        res
          .status(400)
          .json({ error: error.message || "Falha ao configurar ciclo." });
      }
    }
  );

  router.get(
    "/cycles/:cycleId/participants",
    requireRoles("admin", "hr"),
    async (req, res) => {
      try {
        const structure = await store.getEvaluationCycleParticipants(req.params.cycleId);
        res.json(structure);
      } catch (error) {
        res
          .status(400)
          .json({ error: error.message || "Falha ao carregar participantes do ciclo." });
      }
    }
  );

  router.post(
    "/cycles/:cycleId/notify-delinquents",
    requireRoles("admin", "hr"),
    async (req, res) => {
      try {
        const result = await store.notifyCycleDelinquents(req.params.cycleId, req.auth.user);
        res.json(result);
      } catch (error) {
        res
          .status(400)
          .json({ error: error.message || "Falha ao notificar inadimplentes do ciclo." });
      }
    }
  );

  router.post(
    "/cycles/:cycleId/transversal-pairings/force",
    requireRoles("admin", "hr"),
    async (req, res) => {
      const { reviewerUserId, revieweePersonId, reason } = req.body || {};
      if (!reviewerUserId || !revieweePersonId || !reason) {
        return badRequest(res, "reviewerUserId, revieweePersonId e reason sao obrigatorios.");
      }

      try {
        const structure = await store.forceCrossFunctionalPairing(
          req.params.cycleId,
          { reviewerUserId, revieweePersonId, reason },
          req.auth.user
        );
        res.json(structure);
      } catch (error) {
        res
          .status(400)
          .json({ error: error.message || "Falha ao ajustar pareamento transversal." });
      }
    }
  );

  router.post(
    "/cycles/:cycleId/transversal-pairings/:pairingId/block",
    requireRoles("admin", "hr"),
    async (req, res) => {
      const { reason } = req.body || {};
      if (!reason) {
        return badRequest(res, "reason obrigatorio.");
      }

      try {
        const structure = await store.blockCrossFunctionalPairing(
          req.params.cycleId,
          req.params.pairingId,
          reason,
          req.auth.user
        );
        res.json(structure);
      } catch (error) {
        res
          .status(400)
          .json({ error: error.message || "Falha ao bloquear pareamento transversal." });
      }
    }
  );

  router.get("/assignments", requireRoles("admin", "hr", "manager", "employee"), async (req, res, next) => {
    try {
      res.json(await store.getEvaluationAssignmentsForUser(req.auth.user.id));
    } catch (error) {
      next(error);
    }
  });

  router.get(
    "/assignments/:assignmentId",
    requireRoles("admin", "hr", "manager", "employee"),
    async (req, res, next) => {
    try {
      const assignment = await store.getEvaluationAssignmentById(
        req.params.assignmentId,
        req.auth.user.id
      );
      if (!assignment) {
        return res.status(404).json({ error: "Assignment nao encontrado." });
      }

      const template =
        (await store.getEvaluationTemplateForAssignment?.(
          req.params.assignmentId,
          req.auth.user.id
        )) ||
        (await store.getEvaluationTemplateForCycleRelationship(
          assignment.cycleId,
          assignment.relationshipType
        ));
      res.json({
        assignment,
        template
      });
    } catch (error) {
      next(error);
    }
    }
  );

  router.get("/received-feedback", requireRoles("employee"), async (req, res, next) => {
    try {
      res.json(await store.getReceivedManagerFeedback(req.auth.user));
    } catch (error) {
      next(error);
    }
  });

  router.get(
    "/performance-360",
    requireRoles("admin", "manager", "employee"),
    async (req, res, next) => {
      try {
        res.json(await store.getPerformance360Reviews(req.auth.user));
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    "/responses",
    requireRoles("admin", "hr", "manager"),
    async (req, res, next) => {
    try {
      res.json(await store.getEvaluationResponses(req.auth.user));
    } catch (error) {
      next(error);
      }
    }
  );

  router.patch(
    "/responses/:submissionId/acknowledgement",
    requireRoles("employee"),
    async (req, res) => {
    const { status, note } = req.body || {};
    if (!status) {
      return badRequest(res, "Status de concordancia obrigatorio.");
    }

    try {
      const response = await store.acknowledgeReceivedManagerFeedback(
        req.params.submissionId,
        { status, note },
        req.auth.user
      );
      res.json(response);
    } catch (error) {
      res
        .status(400)
        .json({ error: error.message || "Falha ao registrar retorno do colaborador." });
    }
    }
  );

  router.get("/feedback-requests", requireRoles("admin", "hr", "manager", "employee"), async (req, res, next) => {
    try {
      res.json(await store.getFeedbackRequests(req.auth.user));
    } catch (error) {
      next(error);
    }
  });

  router.post("/feedback-requests", requireRoles("admin", "hr", "manager", "employee"), async (req, res) => {
    const { cycleId, providerPersonIds, contextNote } = req.body;

    if (!cycleId || !Array.isArray(providerPersonIds) || !contextNote) {
      return badRequest(res, "cycleId, providerPersonIds e contextNote sao obrigatorios.");
    }

    try {
      const request = await store.createFeedbackRequest(
        { cycleId, providerPersonIds, contextNote },
        req.auth.user
      );
      res.status(201).json(request);
    } catch (error) {
      res
        .status(400)
        .json({ error: error.message || "Falha ao registrar solicitacao de feedback." });
    }
  });

  router.patch(
    "/feedback-requests/:requestId",
    requireRoles("admin", "hr"),
    async (req, res) => {
      const { status } = req.body;
      if (!status) {
        return badRequest(res, "Status da solicitacao obrigatorio.");
      }

      try {
        const request = await store.reviewFeedbackRequest(
          req.params.requestId,
          { status },
          req.auth.user
        );
        res.json(request);
      } catch (error) {
        res
          .status(400)
          .json({ error: error.message || "Falha ao tratar solicitacao de feedback." });
      }
    }
  );

  router.get(
    "/custom-libraries/template",
    requireRoles("admin", "hr"),
    async (_req, res, next) => {
      try {
        const buffer = await buildLibraryTemplateWorkbook();
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="biblioteca-avaliacoes-template.xlsx"'
        );
        res.send(Buffer.from(buffer));
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    "/custom-libraries/import",
    requireRoles("admin", "hr"),
    upload.single("file"),
    async (req, res) => {
      if (!req.file) {
        return badRequest(res, "Arquivo obrigatorio. Envie um CSV ou XLSX.");
      }

      try {
        const rows = await parseLibraryFile(req.file);
        const result = validateImportedLibraryRows(rows);
        const draft = await store.importCustomLibraryDraft({
          fileName: req.file.originalname,
          createdByUserId: req.auth.user.id,
          errors: result.errors,
          templates: result.templates,
          summary: result.summary
        });

        res.status(201).json(draft);
      } catch (error) {
        res.status(400).json({ error: error.message || "Falha ao importar biblioteca." });
      }
    }
  );

  router.post(
    "/custom-libraries/publish",
    requireRoles("admin", "hr"),
    async (req, res) => {
      const { draftId, name, description } = req.body;
      if (!draftId || !name) {
        return badRequest(res, "draftId e name sao obrigatorios para publicar.");
      }

      try {
        const library = await store.publishCustomLibraryDraft({
          draftId,
          name,
          description,
          createdByUserId: req.auth.user.id
        });
        res.status(201).json(library);
      } catch (error) {
        res.status(400).json({ error: error.message || "Falha ao publicar biblioteca." });
      }
    }
  );

  router.patch(
    "/custom-libraries/:libraryId",
    requireRoles("admin", "hr"),
    async (req, res) => {
      const { name, description, templates } = req.body || {};

      try {
        const library = await store.updateCustomLibrary(
          req.params.libraryId,
          { name, description, templates },
          req.auth.user
        );
        res.json(library);
      } catch (error) {
        res.status(400).json({ error: error.message || "Falha ao atualizar biblioteca." });
      }
    }
  );

  router.post("/submit", requireRoles("admin", "hr", "manager", "employee"), async (req, res, next) => {
    const { assignmentId, answers, strengthsNote, developmentNote } = req.body;

    if (!assignmentId || !answers) {
      return badRequest(res, "Campos obrigatorios da resposta nao informados.");
    }

    try {
      const response = await store.submitEvaluationAssignment({
        assignmentId,
        reviewerUserId: req.auth.user.id,
        answers,
        strengthsNote,
        developmentNote
      });

      res.status(201).json(response);
    } catch (error) {
      res
        .status(400)
        .json({ error: error.message || "Falha ao enviar avaliacao." });
    }
  });

  return router;
}
