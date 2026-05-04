export function createMemoryEvaluationSubmissionStore({
  db,
  createId,
  customLibraryState,
  anonymousResponseState,
  saveAnonymousResponseState,
  isReleasedCycle,
  isCycleRelationshipEnabled,
  getTemplateDefinitionForCycle,
  validateEvaluationAnswers,
  isAnonymousRelationship,
  createAnonymousSubmissionPayload,
  updatePersonSatisfactionScoreInMemory,
  prepareEvaluationSubmission,
  getAnsweredScaleScores,
  average,
  buildEvaluationAnswerRows,
  hydrateCycleStructure,
  enrichSubmission,
  validateFeedbackAcknowledgementPayload,
  pushAuditLog,
  AUDIT_CATEGORIES,
  FEEDBACK_ACKNOWLEDGEMENT_STATUS
}) {
  return {
    async submitEvaluationAssignment(payload) {
      const assignment = db.assignments.find((item) => item.id === payload.assignmentId);
      if (!assignment) {
        throw new Error("Assignment de avaliacao nao encontrado.");
      }
      if (assignment.reviewerUserId !== payload.reviewerUserId) {
        throw new Error("Usuario nao autorizado a responder esta avaliacao.");
      }
      if (assignment.status === "submitted") {
        throw new Error("Esta avaliacao ja foi enviada.");
      }

      const cycle = db.cycles.find((item) => item.id === assignment.cycleId);
      if (!cycle) {
        throw new Error("Ciclo de avaliacao nao encontrado.");
      }
      if (!isReleasedCycle(cycle.status)) {
        throw new Error("As avaliacoes deste ciclo ainda nao foram liberadas pelo RH.");
      }
      if (!isCycleRelationshipEnabled(cycle, assignment.relationshipType)) {
        throw new Error("Este questionario nao esta ativo neste ciclo.");
      }

      const templateDefinition = getTemplateDefinitionForCycle({
        cycle,
        relationshipType: assignment.relationshipType,
        customLibraries: customLibraryState.published
      });
      validateEvaluationAnswers(payload.answers, templateDefinition);

      if (isAnonymousRelationship(assignment.relationshipType)) {
        const anonymousSubmission = createAnonymousSubmissionPayload(
          assignment,
          payload,
          templateDefinition
        );
        anonymousResponseState.responses.unshift(anonymousSubmission);
        await saveAnonymousResponseState(anonymousResponseState);
        if (assignment.relationshipType === "company") {
          updatePersonSatisfactionScoreInMemory(
            db,
            assignment.revieweePersonId,
            anonymousSubmission.overallScore
          );
        }
        assignment.status = "submitted";
        hydrateCycleStructure(db, assignment.cycleId);
        return anonymousSubmission;
      }

      const submission = prepareEvaluationSubmission({
        assignment,
        payload,
        createId,
        getAnsweredScaleScores,
        average
      });

      const answerRows = buildEvaluationAnswerRows({
        answers: payload.answers,
        templateDefinition,
        submissionId: submission.id,
        createId
      });

      db.submissions.unshift(submission);
      db.answers.unshift(...answerRows);
      assignment.status = "submitted";
      hydrateCycleStructure(db, assignment.cycleId);

      return enrichSubmission(db, submission);
    },
    async acknowledgeReceivedManagerFeedback(submissionId, payload, actorUser) {
      const submission = db.submissions.find((item) => item.id === submissionId);
      if (!submission) {
        throw new Error("Feedback do lider nao encontrado.");
      }

      const assignment = db.assignments.find((item) => item.id === submission.assignmentId);
      if (assignment?.relationshipType !== "manager") {
        throw new Error("Somente feedback do lider permite concordancia do colaborador.");
      }

      if (submission.revieweePersonId !== actorUser?.person?.id) {
        throw new Error("Usuario nao autorizado a responder este feedback.");
      }

      const acknowledgement = validateFeedbackAcknowledgementPayload(payload);
      submission.revieweeAcknowledgementStatus = acknowledgement.status;
      submission.revieweeAcknowledgementNote = acknowledgement.note;
      submission.revieweeAcknowledgedAt = new Date().toISOString();

      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.cycle,
        action:
          acknowledgement.status === FEEDBACK_ACKNOWLEDGEMENT_STATUS.agreed
            ? "manager_feedback_agreed"
            : "manager_feedback_disagreed",
        entityType: "evaluation_submission",
        entityId: submission.id,
        entityLabel:
          db.people.find((item) => item.id === submission.revieweePersonId)?.name || submission.id,
        actorUser,
        summary:
          acknowledgement.status === FEEDBACK_ACKNOWLEDGEMENT_STATUS.agreed
            ? "Colaborador concordou com o feedback do lider"
            : "Colaborador discordou do feedback do lider",
        detail: acknowledgement.note || "Sem observacoes adicionais."
      });

      return enrichSubmission(db, submission, customLibraryState.published);
    }
  };
}

export function createMysqlEvaluationSubmissionStore({
  pool,
  createId,
  customLibraryState,
  anonymousResponseState,
  saveAnonymousResponseState,
  supportsFeedbackAcknowledgement,
  isReleasedCycle,
  isCycleRelationshipEnabled,
  getTemplateDefinitionForCycle,
  validateEvaluationAnswers,
  isAnonymousRelationship,
  createAnonymousSubmissionPayload,
  prepareEvaluationSubmission,
  getAnsweredScaleScores,
  average,
  buildEvaluationAnswerRows,
  fetchMysqlResponses,
  validateFeedbackAcknowledgementPayload,
  insertAuditLog,
  AUDIT_CATEGORIES,
  FEEDBACK_ACKNOWLEDGEMENT_STATUS
}) {
  return {
    async submitEvaluationAssignment(payload) {
      const assignment = await this.getEvaluationAssignmentById(
        payload.assignmentId,
        payload.reviewerUserId
      );
      if (!assignment) {
        throw new Error("Assignment de avaliacao nao encontrado.");
      }
      if (assignment.status === "submitted") {
        throw new Error("Esta avaliacao ja foi enviada.");
      }
      if (!isReleasedCycle(assignment.cycleStatus)) {
        throw new Error("As avaliacoes deste ciclo ainda nao foram liberadas pelo RH.");
      }
      if (!isCycleRelationshipEnabled(assignment, assignment.relationshipType)) {
        throw new Error("Este questionario nao esta ativo neste ciclo.");
      }

      const templateDefinition = getTemplateDefinitionForCycle({
        cycle: assignment,
        relationshipType: assignment.relationshipType,
        customLibraries: customLibraryState.published
      });
      validateEvaluationAnswers(payload.answers, templateDefinition);

      if (isAnonymousRelationship(assignment.relationshipType)) {
        const anonymousSubmission = createAnonymousSubmissionPayload(
          assignment,
          payload,
          templateDefinition
        );
        anonymousResponseState.responses.unshift(anonymousSubmission);
        await saveAnonymousResponseState(anonymousResponseState);
        await pool.query(
          `UPDATE evaluation_assignments SET status = 'submitted' WHERE id = ?`,
          [assignment.id]
        );
        await pool.query(
          `UPDATE evaluation_cycle_raters
           SET status = 'completed'
           WHERE cycle_id = ? AND participant_person_id = ? AND rater_user_id = ? AND relationship_type = ?`,
          [
            assignment.cycleId,
            assignment.revieweePersonId,
            assignment.reviewerUserId,
            assignment.relationshipType
          ]
        );
        if (
          assignment.relationshipType === "company" &&
          Number.isFinite(Number(anonymousSubmission.overallScore))
        ) {
          await pool.query(
            `UPDATE people
             SET satisfaction_score = ?
             WHERE id = ?`,
            [Number(Number(anonymousSubmission.overallScore).toFixed(2)), assignment.revieweePersonId]
          );
        }
        return anonymousSubmission;
      }

      const submission = prepareEvaluationSubmission({
        assignment,
        payload,
        createId,
        getAnsweredScaleScores,
        average
      });

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        await connection.query(
          `INSERT INTO evaluation_submissions
          (id, assignment_id, cycle_id, reviewer_user_id, reviewee_person_id, overall_score,
            strengths_note, development_note, submitted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            submission.id,
            submission.assignmentId,
            submission.cycleId,
            submission.reviewerUserId,
            submission.revieweePersonId,
            submission.overallScore,
            submission.strengthsNote,
            submission.developmentNote,
            submission.submittedAt
          ]
        );

        for (const answer of buildEvaluationAnswerRows({
          answers: payload.answers,
          templateDefinition,
          submissionId: submission.id,
          createId
        })) {
          await connection.query(
            `INSERT INTO evaluation_answers
             (id, submission_id, question_id, answer_type, score, evidence_note, answer_text, answer_options_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              answer.id,
              answer.submissionId,
              answer.questionId,
              answer.answerType,
              answer.score,
              answer.evidenceNote,
              answer.textValue,
              JSON.stringify(answer.selectedOptions)
            ]
          );
        }

        await connection.query(
          `UPDATE evaluation_assignments SET status = 'submitted' WHERE id = ?`,
          [assignment.id]
        );

        await connection.query(
          `UPDATE evaluation_cycle_raters
           SET status = 'completed'
           WHERE cycle_id = ? AND participant_person_id = ? AND rater_user_id = ? AND relationship_type = ?`,
          [
            assignment.cycleId,
            assignment.revieweePersonId,
            assignment.reviewerUserId,
            assignment.relationshipType
          ]
        );

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      const responses = await fetchMysqlResponses(pool, customLibraryState.published, {
        supportsFeedbackAcknowledgement
      });
      return responses.find((item) => item.id === submission.id);
    },
    async acknowledgeReceivedManagerFeedback(submissionId, payload, actorUser) {
      if (!supportsFeedbackAcknowledgement) {
        throw new Error(
          "Este ambiente ainda nao suporta o registro de concordancia do colaborador."
        );
      }

      const acknowledgement = validateFeedbackAcknowledgementPayload(payload);
      const [rows] = await pool.query(
        `SELECT s.id, s.assignment_id AS assignmentId, s.reviewee_person_id AS revieweePersonId,
                a.relationship_type AS relationshipType
         FROM evaluation_submissions s
         JOIN evaluation_assignments a ON a.id = s.assignment_id
         WHERE s.id = ?
         LIMIT 1`,
        [submissionId]
      );

      if (!rows[0]) {
        throw new Error("Feedback do lider nao encontrado.");
      }
      if (rows[0].relationshipType !== "manager") {
        throw new Error("Somente feedback do lider permite concordancia do colaborador.");
      }
      if (rows[0].revieweePersonId !== actorUser?.person?.id) {
        throw new Error("Usuario nao autorizado a responder este feedback.");
      }

      const acknowledgedAt = new Date().toISOString();
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(
          `UPDATE evaluation_submissions
           SET reviewee_acknowledgement_status = ?, reviewee_acknowledgement_note = ?, reviewee_acknowledged_at = ?
           WHERE id = ?`,
          [acknowledgement.status, acknowledgement.note, acknowledgedAt, submissionId]
        );

        await insertAuditLog(connection, {
          category: AUDIT_CATEGORIES.cycle,
          action:
            acknowledgement.status === FEEDBACK_ACKNOWLEDGEMENT_STATUS.agreed
              ? "manager_feedback_agreed"
              : "manager_feedback_disagreed",
          entityType: "evaluation_submission",
          entityId: submissionId,
          entityLabel: actorUser.person?.name || actorUser.email,
          actorUser,
          summary:
            acknowledgement.status === FEEDBACK_ACKNOWLEDGEMENT_STATUS.agreed
              ? "Colaborador concordou com o feedback do lider"
              : "Colaborador discordou do feedback do lider",
          detail: acknowledgement.note || "Sem observacoes adicionais."
        });

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      const responses = await fetchMysqlResponses(pool, customLibraryState.published, {
        supportsFeedbackAcknowledgement
      });
      return responses.find((item) => item.id === submissionId) || null;
    }
  };
}
