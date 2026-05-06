function countVisibleSensitiveAnswers(bundle) {
  return (bundle?.individualResponses || []).reduce((total, response) => {
    const visibleSensitiveAnswers = (response.answers || []).filter(
      (answer) => answer.isSensitive && answer.masked !== true
    ).length;
    return total + visibleSensitiveAnswers;
  }, 0);
}

function buildSensitiveResponseAccessDetail(bundle) {
  const responseIds = new Set();
  const revieweeIds = new Set();

  for (const response of bundle?.individualResponses || []) {
    const hasVisibleSensitiveAnswer = (response.answers || []).some(
      (answer) => answer.isSensitive && answer.masked !== true
    );
    if (!hasVisibleSensitiveAnswer) {
      continue;
    }
    responseIds.add(response.id);
    if (response.revieweePersonId) {
      revieweeIds.add(response.revieweePersonId);
    }
  }

  return `${responseIds.size} resposta(s) com itens sensiveis visiveis · ${revieweeIds.size} colaborador(es) afetados`;
}

export function createMemoryEvaluationReadStore({
  db,
  createId,
  customLibraryState,
  anonymousResponseState,
  saveCustomLibraryState,
  buildTemplate,
  evaluationLibrary,
  buildEvaluationLibraryPayload,
  preparePublishedCustomLibraryUpdate,
  getTemplateDefinitionForCycle,
  presentCycle,
  presentCycleParticipantStructure,
  isOrgWideUser,
  isCycleRelationshipEnabled,
  enrichAssignment,
  buildEvaluationResponseBundle,
  enrichSubmission,
  buildResponsesBundle,
  presentCycleReportSnapshot,
  buildPerformance360Reviews,
  filterReceivedManagerFeedback,
  pushAuditLog,
  AUDIT_CATEGORIES
}) {
  function buildTemplateFromAssignment(assignment) {
    if (assignment?.questionnaireId) {
      const questionnaire = db.questionnaires.find((item) => item.id === assignment.questionnaireId);
      if (questionnaire) {
        const questions = db.questionnaireQuestions
          .filter((item) => item.questionnaireId === questionnaire.id)
          .sort((left, right) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0));
        const accessPolicy =
          db.questionnaireAccessPolicies.find((item) => item.questionnaireId === questionnaire.id) ||
          null;
        return buildTemplate({
          id: questionnaire.id,
          key: questionnaire.relationshipType,
          relationshipType: questionnaire.relationshipType,
          modelName: questionnaire.title,
          description: questionnaire.description || "",
          policy: {
            confidentiality: questionnaire.visibilityLevel || "restricted",
            accessPolicy
          },
          questions: questions.map((question) => ({
            id: question.id,
            questionnaireQuestionId: question.id,
            sourceQuestionId: question.sourceQuestionId || null,
            sectionKey: question.sectionKey || "",
            sectionTitle: question.sectionTitle || "",
            sectionDescription: question.sectionDescription || "",
            dimensionKey: question.dimensionKey,
            dimensionTitle: question.dimensionTitle,
            prompt: question.promptText || "",
            helperText: question.helperText || "",
            inputType: question.inputType || "scale",
            scaleProfile: question.scaleProfile || null,
            visibility: question.visibility || "restricted",
            isRequired: question.isRequired !== false,
            collectEvidenceOnExtreme: Boolean(question.collectEvidenceOnExtreme),
            isSensitive: Boolean(question.isSensitive),
            options: Array.isArray(question.options) ? question.options : [],
            sortOrder: Number(question.sortOrder || 0)
          }))
        });
      }
    }

    const cycle = db.cycles.find((item) => item.id === assignment?.cycleId);
    return buildTemplate(
      getTemplateDefinitionForCycle({
        cycle: presentCycle(cycle || {}),
        relationshipType: assignment?.relationshipType,
        customLibraries: customLibraryState.published
      })
    );
  }

  return {
    async getEvaluationTemplate() {
      return buildTemplate(evaluationLibrary.templates.collaboration);
    },
    async getEvaluationLibrary() {
      return buildEvaluationLibraryPayload(customLibraryState.published);
    },
    async importCustomLibraryDraft(payload) {
      const draft = {
        id: createId("library_draft"),
        fileName: payload.fileName,
        createdAt: new Date().toISOString(),
        createdByUserId: payload.createdByUserId,
        errors: payload.errors,
        templates: payload.templates,
        summary: payload.summary
      };
      customLibraryState.drafts.unshift(draft);
      await saveCustomLibraryState(customLibraryState);
      return draft;
    },
    async publishCustomLibraryDraft(payload) {
      const draft = customLibraryState.drafts.find((item) => item.id === payload.draftId);
      if (!draft) {
        throw new Error("Rascunho da biblioteca nao encontrado.");
      }
      if (draft.errors.length) {
        throw new Error("Nao e possivel publicar uma biblioteca com erros.");
      }

      const published = {
        id: createId("library"),
        name: payload.name,
        description: payload.description || "",
        sourceFileName: draft.fileName,
        createdAt: new Date().toISOString(),
        createdByUserId: payload.createdByUserId,
        templateCount: draft.templates.length,
        questionCount: draft.summary.questions,
        templates: draft.templates
      };
      customLibraryState.published.unshift(published);
      customLibraryState.drafts = customLibraryState.drafts.filter(
        (item) => item.id !== payload.draftId
      );
      await saveCustomLibraryState(customLibraryState);
      return published;
    },
    async updateCustomLibrary(libraryId, payload) {
      const libraryIndex = customLibraryState.published.findIndex((item) => item.id === libraryId);
      if (libraryIndex < 0) {
        throw new Error("Biblioteca customizada nao encontrada.");
      }

      const updatedLibrary = preparePublishedCustomLibraryUpdate(
        customLibraryState.published[libraryIndex],
        payload
      );

      customLibraryState.published[libraryIndex] = updatedLibrary;
      await saveCustomLibraryState(customLibraryState);
      return updatedLibrary;
    },
    async getEvaluationTemplateForCycleRelationship(cycleId, relationshipType) {
      const cycle = db.cycles.find((item) => item.id === cycleId);
      return buildTemplate(
        getTemplateDefinitionForCycle({
          cycle: presentCycle(cycle || {}),
          relationshipType,
          customLibraries: customLibraryState.published
        })
      );
    },
    async getEvaluationCycles(actorUser = null) {
      const cycles = db.cycles.map((cycle) => {
        const cycleStructure = presentCycleParticipantStructure(
          db,
          cycle.id,
          customLibraryState.published
        );

        return {
          ...presentCycle(cycle),
          supportsConfig: true,
          participantCount: cycleStructure.cycle.participantCount,
          raterCount: cycleStructure.cycle.raterCount,
          reportSnapshotCount: db.cycleReports.filter((item) => item.cycleId === cycle.id).length
        };
      });

      if (actorUser && !isOrgWideUser(actorUser)) {
        return cycles.filter((cycle) => cycle.isEnabled);
      }

      return cycles;
    },
    async getEvaluationAssignmentsForUser(userId) {
      return db.assignments
        .filter((item) => item.reviewerUserId === userId)
        .filter((item) =>
          isCycleRelationshipEnabled(
            db.cycles.find((cycle) => cycle.id === item.cycleId),
            item.relationshipType
          )
        )
        .map((item) => enrichAssignment(db, item, customLibraryState.published));
    },
    async getEvaluationAssignmentById(assignmentId, userId) {
      const assignment = db.assignments.find(
        (item) => item.id === assignmentId && item.reviewerUserId === userId
      );
      if (!assignment) {
        return null;
      }
      if (
        !isCycleRelationshipEnabled(
          db.cycles.find((cycle) => cycle.id === assignment.cycleId),
          assignment.relationshipType
        )
      ) {
        return null;
      }
      return enrichAssignment(db, assignment, customLibraryState.published);
    },
    async getEvaluationTemplateForAssignment(assignmentId, userId) {
      const assignment = db.assignments.find(
        (item) => item.id === assignmentId && item.reviewerUserId === userId
      );
      if (!assignment) {
        return null;
      }
      return buildTemplateFromAssignment(assignment);
    },
    async getEvaluationResponses(actorUser) {
      const bundle = buildEvaluationResponseBundle({
        submissions: db.submissions,
        anonymousResponses: anonymousResponseState.responses,
        buildSubmission: (item) => enrichSubmission(db, item, customLibraryState.published),
        actorUser,
        buildResponsesBundle,
        cycles: db.cycles,
        cycleReports: db.cycleReports.map((item) => presentCycleReportSnapshot(item))
      });

      const visibleSensitiveAnswers = countVisibleSensitiveAnswers(bundle);
      if (visibleSensitiveAnswers > 0) {
        pushAuditLog(db.auditLogs, {
          category: AUDIT_CATEGORIES.cycle,
          action: "sensitive-viewed",
          entityType: "evaluation_response_bundle",
          entityId: actorUser?.id || "unknown",
          entityLabel: actorUser?.person?.name || actorUser?.email || "Leitura de respostas",
          actorUser,
          summary: "Visualizacao de respostas sensiveis de avaliacao",
          detail: buildSensitiveResponseAccessDetail(bundle)
        });
      }

      return bundle;
    },
    async getPerformance360Reviews(actorUser) {
      return buildPerformance360Reviews({
        people: db.people,
        cycles: db.cycles.map((cycle) => presentCycle(cycle)),
        responses: db.submissions.map((item) =>
          enrichSubmission(db, item, customLibraryState.published)
        ),
        actorUser
      });
    },
    async getReceivedManagerFeedback(actorUser) {
      return filterReceivedManagerFeedback({
        submissions: db.submissions,
        actorUser,
        buildSubmission: (item) => enrichSubmission(db, item, customLibraryState.published)
      });
    }
  };
}

export function createMysqlEvaluationReadStore({
  pool,
  createId,
  customLibraryState,
  anonymousResponseState,
  saveCustomLibraryState,
  buildTemplate,
  evaluationLibrary,
  buildEvaluationLibraryPayload,
  preparePublishedCustomLibraryUpdate,
  getTemplateDefinitionForCycle,
  presentCycle,
  supportsCycleConfig,
  supportsIndividualQuestionnaires,
  isOrgWideUser,
  isCycleRelationshipEnabled,
  presentAssignment,
  fetchMysqlResponses,
  supportsFeedbackAcknowledgement,
  buildEvaluationResponseBundle,
  buildResponsesBundle,
  fetchCycleReportRows,
  buildPerformance360Reviews,
  fetchPeopleRows,
  filterReceivedManagerFeedback,
  insertAuditLog,
  AUDIT_CATEGORIES
}) {
  async function fetchAssignmentQuestionnaire(assignmentId, reviewerUserId) {
    const [assignmentRows] = await pool.query(
      supportsIndividualQuestionnaires
        ? `SELECT a.id, a.cycle_id AS cycleId, a.reviewer_user_id AS reviewerUserId,
                a.reviewee_person_id AS revieweePersonId, a.questionnaire_id AS questionnaireId,
                a.relationship_type AS relationshipType,
                c.template_id AS templateId, c.library_id AS libraryId, c.library_name AS libraryName
         FROM evaluation_assignments a
         JOIN evaluation_cycles c ON c.id = a.cycle_id
         WHERE a.id = ? AND a.reviewer_user_id = ?
         LIMIT 1`
        : `SELECT a.id, a.cycle_id AS cycleId, a.reviewer_user_id AS reviewerUserId,
                a.reviewee_person_id AS revieweePersonId, NULL AS questionnaireId,
                a.relationship_type AS relationshipType,
                c.template_id AS templateId, c.library_id AS libraryId, c.library_name AS libraryName
         FROM evaluation_assignments a
         JOIN evaluation_cycles c ON c.id = a.cycle_id
         WHERE a.id = ? AND a.reviewer_user_id = ?
         LIMIT 1`,
      [assignmentId, reviewerUserId]
    );
    const assignment = assignmentRows[0];
    if (!assignment) {
      return null;
    }
    if (!assignment.questionnaireId) {
      return buildTemplate(
        getTemplateDefinitionForCycle({
          cycle: presentCycle(assignment),
          relationshipType: assignment.relationshipType,
          customLibraries: customLibraryState.published
        })
      );
    }

    const [questionnaireRows] = await pool.query(
      `SELECT q.id, q.relationship_type AS relationshipType, q.title, q.description,
              q.visibility_level AS visibilityLevel
       FROM evaluation_questionnaires q
       WHERE q.id = ?
       LIMIT 1`,
      [assignment.questionnaireId]
    );
    if (!questionnaireRows[0]) {
      return buildTemplate(
        getTemplateDefinitionForCycle({
          cycle: presentCycle(assignment),
          relationshipType: assignment.relationshipType,
          customLibraries: customLibraryState.published
        })
      );
    }
    const [questionRows] = await pool.query(
      `SELECT q.id, q.sort_order AS sortOrder, q.section_key AS sectionKey,
              q.section_title AS sectionTitle, q.section_description AS sectionDescription,
              q.dimension_key AS dimensionKey, q.dimension_title AS dimensionTitle,
              q.prompt_text AS promptText, q.helper_text AS helperText,
              q.input_type AS inputType, q.scale_profile AS scaleProfile,
              q.visibility, q.is_required AS isRequired,
              q.collect_evidence_on_extreme AS collectEvidenceOnExtreme,
              q.is_sensitive AS isSensitive, q.options_json AS optionsJson
       FROM evaluation_questionnaire_questions q
       WHERE q.questionnaire_id = ?
       ORDER BY q.sort_order`,
      [assignment.questionnaireId]
    );
    const [policyRows] = await pool.query(
      `SELECT can_view_reviewee AS canViewReviewee, can_view_reviewer AS canViewReviewer,
              can_view_manager AS canViewManager, can_view_hr AS canViewHr,
              can_view_admin AS canViewAdmin, can_view_raw_answers AS canViewRawAnswers,
              can_view_prompt_text_after_submission AS canViewPromptTextAfterSubmission
       FROM evaluation_questionnaire_access_policies
       WHERE questionnaire_id = ?
       LIMIT 1`,
      [assignment.questionnaireId]
    );
    return buildTemplate({
      id: questionnaireRows[0].id,
      key: questionnaireRows[0].relationshipType,
      relationshipType: questionnaireRows[0].relationshipType,
      modelName: questionnaireRows[0].title,
      description: questionnaireRows[0].description || "",
      policy: {
        confidentiality: questionnaireRows[0].visibilityLevel || "restricted",
        accessPolicy: policyRows[0] || null
      },
      questions: questionRows.map((question) => ({
        id: question.id,
        questionnaireQuestionId: question.id,
        sourceQuestionId: null,
        sectionKey: question.sectionKey || "",
        sectionTitle: question.sectionTitle || "",
        sectionDescription: question.sectionDescription || "",
        dimensionKey: question.dimensionKey,
        dimensionTitle: question.dimensionTitle,
        prompt: question.promptText || "",
        helperText: question.helperText || "",
        inputType: question.inputType || "scale",
        scaleProfile: question.scaleProfile || null,
        visibility: question.visibility || "restricted",
        isRequired: question.isRequired !== false,
        collectEvidenceOnExtreme: Boolean(question.collectEvidenceOnExtreme),
        isSensitive: Boolean(question.isSensitive),
        options:
          question.optionsJson
            ? typeof question.optionsJson === "string"
              ? JSON.parse(question.optionsJson)
              : question.optionsJson
            : [],
        sortOrder: Number(question.sortOrder || 0)
      }))
    });
  }

  return {
    async getEvaluationTemplate() {
      return buildTemplate(evaluationLibrary.templates.collaboration);
    },
    async getEvaluationLibrary() {
      return buildEvaluationLibraryPayload(customLibraryState.published);
    },
    async importCustomLibraryDraft(payload) {
      const draft = {
        id: createId("library_draft"),
        fileName: payload.fileName,
        createdAt: new Date().toISOString(),
        createdByUserId: payload.createdByUserId,
        errors: payload.errors,
        templates: payload.templates,
        summary: payload.summary
      };
      customLibraryState.drafts.unshift(draft);
      await saveCustomLibraryState(customLibraryState);
      return draft;
    },
    async publishCustomLibraryDraft(payload) {
      const draft = customLibraryState.drafts.find((item) => item.id === payload.draftId);
      if (!draft) {
        throw new Error("Rascunho da biblioteca nao encontrado.");
      }
      if (draft.errors.length) {
        throw new Error("Nao e possivel publicar uma biblioteca com erros.");
      }

      const published = {
        id: createId("library"),
        name: payload.name,
        description: payload.description || "",
        sourceFileName: draft.fileName,
        createdAt: new Date().toISOString(),
        createdByUserId: payload.createdByUserId,
        templateCount: draft.templates.length,
        questionCount: draft.summary.questions,
        templates: draft.templates
      };
      customLibraryState.published.unshift(published);
      customLibraryState.drafts = customLibraryState.drafts.filter(
        (item) => item.id !== payload.draftId
      );
      await saveCustomLibraryState(customLibraryState);
      return published;
    },
    async updateCustomLibrary(libraryId, payload) {
      const libraryIndex = customLibraryState.published.findIndex((item) => item.id === libraryId);
      if (libraryIndex < 0) {
        throw new Error("Biblioteca customizada nao encontrada.");
      }

      const updatedLibrary = preparePublishedCustomLibraryUpdate(
        customLibraryState.published[libraryIndex],
        payload
      );

      customLibraryState.published[libraryIndex] = updatedLibrary;
      await saveCustomLibraryState(customLibraryState);
      return updatedLibrary;
    },
    async getEvaluationTemplateForCycleRelationship(cycleId, relationshipType) {
      const [rows] = await pool.query(
        `SELECT id, template_id AS templateId, library_id AS libraryId, library_name AS libraryName
         FROM evaluation_cycles
         WHERE id = ?
         LIMIT 1`,
        [cycleId]
      );

      return buildTemplate(
        getTemplateDefinitionForCycle({
          cycle: presentCycle(rows[0] || {}),
          relationshipType,
          customLibraries: customLibraryState.published
        })
      );
    },
    async getEvaluationCycles(actorUser = null) {
      const [rows] = await pool.query(
        supportsCycleConfig
          ? `SELECT c.id, c.template_id AS templateId, c.title, c.semester_label AS semesterLabel,
                    c.status, c.is_enabled AS isEnabled, c.enabled_relationships_json AS enabledRelationshipsJson,
                    c.transversal_config_json AS transversalConfigJson,
                    c.due_date AS dueDate, c.target_group AS targetGroup,
                    c.library_id AS libraryId, c.library_name AS libraryName,
                    COALESCE(c.library_name, t.name) AS modelName, c.created_by_user_id AS createdByUserId,
                    COUNT(DISTINCT cp.person_id) AS participantCount,
                    COUNT(DISTINCT CONCAT(cr.participant_person_id, ':', cr.rater_user_id, ':', cr.relationship_type)) AS raterCount,
                    COUNT(DISTINCT er.id) AS reportSnapshotCount
             FROM evaluation_cycles c
             JOIN evaluation_templates t ON t.id = c.template_id
             LEFT JOIN evaluation_cycle_participants cp ON cp.cycle_id = c.id
             LEFT JOIN evaluation_cycle_raters cr ON cr.cycle_id = c.id
             LEFT JOIN evaluation_cycle_reports er ON er.cycle_id = c.id
             GROUP BY c.id, c.template_id, c.title, c.semester_label, c.status, c.is_enabled, c.enabled_relationships_json,
                      c.transversal_config_json,
                      c.due_date, c.target_group, c.library_id, c.library_name, t.name, c.created_by_user_id
             ORDER BY c.due_date DESC`
          : `SELECT c.id, c.template_id AS templateId, c.title, c.semester_label AS semesterLabel,
                    c.status, c.due_date AS dueDate, c.target_group AS targetGroup,
                    c.library_id AS libraryId, c.library_name AS libraryName,
                    COALESCE(c.library_name, t.name) AS modelName, c.created_by_user_id AS createdByUserId,
                    COUNT(DISTINCT cp.person_id) AS participantCount,
                    COUNT(DISTINCT CONCAT(cr.participant_person_id, ':', cr.rater_user_id, ':', cr.relationship_type)) AS raterCount,
                    COUNT(DISTINCT er.id) AS reportSnapshotCount
             FROM evaluation_cycles c
             JOIN evaluation_templates t ON t.id = c.template_id
             LEFT JOIN evaluation_cycle_participants cp ON cp.cycle_id = c.id
             LEFT JOIN evaluation_cycle_raters cr ON cr.cycle_id = c.id
             LEFT JOIN evaluation_cycle_reports er ON er.cycle_id = c.id
             GROUP BY c.id, c.template_id, c.title, c.semester_label, c.status, c.due_date, c.target_group,
                      c.library_id, c.library_name, t.name, c.created_by_user_id
             ORDER BY c.due_date DESC`
      );
      const cycles = rows.map((row) => ({
        ...presentCycle(row),
        supportsConfig: true,
        participantCount: Number(row.participantCount || 0),
        raterCount: Number(row.raterCount || 0),
        reportSnapshotCount: Number(row.reportSnapshotCount || 0)
      }));

      if (actorUser && !isOrgWideUser(actorUser)) {
        return cycles.filter((cycle) => cycle.isEnabled);
      }

      return cycles;
    },
    async getEvaluationAssignmentsForUser(userId) {
      const [rows] = await pool.query(
        supportsCycleConfig
          ? `SELECT a.id, a.cycle_id AS cycleId, a.reviewer_user_id AS reviewerUserId,
                    a.reviewee_person_id AS revieweePersonId, ${
                      supportsIndividualQuestionnaires
                        ? "a.questionnaire_id"
                        : "NULL"
                    } AS questionnaireId, a.relationship_type AS relationshipType,
                    a.project_context AS projectContext, a.collaboration_context AS collaborationContext,
                    a.status, a.due_date AS dueDate, c.title AS cycleTitle, c.semester_label AS semesterLabel,
                    c.template_id AS templateId, c.status AS cycleStatus, c.is_enabled AS isEnabled, c.enabled_relationships_json AS enabledRelationshipsJson, c.transversal_config_json AS transversalConfigJson,
                    c.library_id AS libraryId, c.library_name AS libraryName,
                    p.name AS revieweeName, p.area AS revieweeArea,
                    reviewer_person.name AS reviewerName, s.overall_score AS overallScore,
                    s.submitted_at AS submittedAt
             FROM evaluation_assignments a
             JOIN evaluation_cycles c ON c.id = a.cycle_id
             JOIN people p ON p.id = a.reviewee_person_id
             JOIN users reviewer_user ON reviewer_user.id = a.reviewer_user_id
             JOIN people reviewer_person ON reviewer_person.id = reviewer_user.person_id
             LEFT JOIN evaluation_submissions s ON s.assignment_id = a.id
             WHERE a.reviewer_user_id = ?
             ORDER BY a.due_date ASC`
          : `SELECT a.id, a.cycle_id AS cycleId, a.reviewer_user_id AS reviewerUserId,
                    a.reviewee_person_id AS revieweePersonId, ${
                      supportsIndividualQuestionnaires
                        ? "a.questionnaire_id"
                        : "NULL"
                    } AS questionnaireId, a.relationship_type AS relationshipType,
                    a.project_context AS projectContext, a.collaboration_context AS collaborationContext,
                    a.status, a.due_date AS dueDate, c.title AS cycleTitle, c.semester_label AS semesterLabel,
                    c.template_id AS templateId, c.status AS cycleStatus,
                    c.library_id AS libraryId, c.library_name AS libraryName,
                    p.name AS revieweeName, p.area AS revieweeArea,
                    reviewer_person.name AS reviewerName, s.overall_score AS overallScore,
                    s.submitted_at AS submittedAt
             FROM evaluation_assignments a
             JOIN evaluation_cycles c ON c.id = a.cycle_id
             JOIN people p ON p.id = a.reviewee_person_id
             JOIN users reviewer_user ON reviewer_user.id = a.reviewer_user_id
             JOIN people reviewer_person ON reviewer_person.id = reviewer_user.person_id
             LEFT JOIN evaluation_submissions s ON s.assignment_id = a.id
             WHERE a.reviewer_user_id = ?
             ORDER BY a.due_date ASC`,
        [userId]
      );
      return rows
        .map((row) => presentAssignment(row, customLibraryState.published))
        .filter((assignment) => isCycleRelationshipEnabled(assignment, assignment.relationshipType));
    },
    async getEvaluationAssignmentById(assignmentId, userId) {
      const [rows] = await pool.query(
        supportsCycleConfig
          ? `SELECT a.id, a.cycle_id AS cycleId, a.reviewer_user_id AS reviewerUserId,
                    a.reviewee_person_id AS revieweePersonId, ${
                      supportsIndividualQuestionnaires
                        ? "a.questionnaire_id"
                        : "NULL"
                    } AS questionnaireId, a.relationship_type AS relationshipType,
                    a.project_context AS projectContext, a.collaboration_context AS collaborationContext,
                    a.status, a.due_date AS dueDate, c.title AS cycleTitle, c.semester_label AS semesterLabel,
                    c.template_id AS templateId, c.status AS cycleStatus, c.is_enabled AS isEnabled, c.enabled_relationships_json AS enabledRelationshipsJson, c.transversal_config_json AS transversalConfigJson,
                    c.library_id AS libraryId, c.library_name AS libraryName,
                    p.name AS revieweeName, p.area AS revieweeArea
             FROM evaluation_assignments a
             JOIN evaluation_cycles c ON c.id = a.cycle_id
             JOIN people p ON p.id = a.reviewee_person_id
             WHERE a.id = ? AND a.reviewer_user_id = ?
             LIMIT 1`
          : `SELECT a.id, a.cycle_id AS cycleId, a.reviewer_user_id AS reviewerUserId,
                    a.reviewee_person_id AS revieweePersonId, ${
                      supportsIndividualQuestionnaires
                        ? "a.questionnaire_id"
                        : "NULL"
                    } AS questionnaireId, a.relationship_type AS relationshipType,
                    a.project_context AS projectContext, a.collaboration_context AS collaborationContext,
                    a.status, a.due_date AS dueDate, c.title AS cycleTitle, c.semester_label AS semesterLabel,
                    c.template_id AS templateId, c.status AS cycleStatus,
                    c.library_id AS libraryId, c.library_name AS libraryName,
                    p.name AS revieweeName, p.area AS revieweeArea
             FROM evaluation_assignments a
             JOIN evaluation_cycles c ON c.id = a.cycle_id
             JOIN people p ON p.id = a.reviewee_person_id
             WHERE a.id = ? AND a.reviewer_user_id = ?
             LIMIT 1`,
        [assignmentId, userId]
      );
      const assignment = rows[0] ? presentAssignment(rows[0], customLibraryState.published) : null;
      if (!assignment) {
        return null;
      }
      if (!isCycleRelationshipEnabled(assignment, assignment.relationshipType)) {
        return null;
      }
      return assignment;
    },
    async getEvaluationTemplateForAssignment(assignmentId, userId) {
      return fetchAssignmentQuestionnaire(assignmentId, userId);
    },
    async getEvaluationResponses(actorUser) {
      const submissions = await fetchMysqlResponses(pool, customLibraryState.published, {
        supportsFeedbackAcknowledgement,
        supportsIndividualQuestionnaires
      });
      const [cycles, cycleReports] = await Promise.all([
        this.getEvaluationCycles(),
        fetchCycleReportRows(pool)
      ]);
      const bundle = buildEvaluationResponseBundle({
        submissions,
        anonymousResponses: anonymousResponseState.responses,
        buildSubmission: (item) => item,
        actorUser,
        buildResponsesBundle,
        cycles,
        cycleReports
      });

      const visibleSensitiveAnswers = countVisibleSensitiveAnswers(bundle);
      if (visibleSensitiveAnswers > 0) {
        await insertAuditLog(pool, {
          category: AUDIT_CATEGORIES.cycle,
          action: "sensitive-viewed",
          entityType: "evaluation_response_bundle",
          entityId: actorUser?.id || "unknown",
          entityLabel: actorUser?.person?.name || actorUser?.email || "Leitura de respostas",
          actorUser,
          summary: "Visualizacao de respostas sensiveis de avaliacao",
          detail: buildSensitiveResponseAccessDetail(bundle)
        });
      }

      return bundle;
    },
    async getPerformance360Reviews(actorUser) {
      const [people, cycles, responses] = await Promise.all([
        fetchPeopleRows(pool),
        this.getEvaluationCycles(),
        fetchMysqlResponses(pool, customLibraryState.published, {
          supportsFeedbackAcknowledgement,
          supportsIndividualQuestionnaires
        })
      ]);

      return buildPerformance360Reviews({
        people,
        cycles,
        responses,
        actorUser
      });
    },
    async getReceivedManagerFeedback(actorUser) {
      const submissions = await fetchMysqlResponses(pool, customLibraryState.published, {
        supportsFeedbackAcknowledgement,
        supportsIndividualQuestionnaires
      });
      return filterReceivedManagerFeedback({
        submissions,
        actorUser,
        buildSubmission: (item) => item
      });
    }
  };
}
