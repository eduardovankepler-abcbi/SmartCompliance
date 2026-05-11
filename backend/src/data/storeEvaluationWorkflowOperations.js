import { toMysqlDateTime } from "./mysqlDateTime.js";

export function createMemoryEvaluationWorkflowStore({
  db,
  createId,
  customLibraryState,
  anonymousResponseState,
  presentCycle,
  pushAuditLog,
  AUDIT_CATEGORIES,
  isAssignmentDelinquent,
  presentDelinquentAssignment,
  buildCycleReminderAuditDetail,
  assertCycleStatusTransition,
  CYCLE_STATUS,
  enrichSubmission,
  buildCycleReportSnapshots,
  buildCycleStatusAuditDetail,
  normalizeCycleModuleAvailability,
  normalizeTransversalConfig,
  resolveCycleConfigUpdate,
  buildCycleConfigAuditDetail,
  filterFeedbackRequestsForUser,
  assertCanCreateFeedbackRequest,
  prepareFeedbackRequest,
  buildFeedbackRequestItems,
  buildFeedbackRequestCreateAuditDetail,
  assertValidFeedbackRequestStatus,
  FEEDBACK_REQUEST_STATUS,
  isCycleRelationshipEnabled,
  getFeedbackRequestItems,
  pushAssignment,
  buildFeedbackRequestReviewAuditDetail,
  presentFeedbackRequest
}) {
  return {
    async notifyCycleDelinquents(cycleId, actorUser) {
      const cycle = db.cycles.find((item) => item.id === cycleId);
      if (!cycle) {
        throw new Error("Ciclo de avaliacao nao encontrado.");
      }

      const delinquentAssignments = db.assignments.filter(
        (assignment) => assignment.cycleId === cycleId && isAssignmentDelinquent(assignment, cycle.status)
      );

      if (!delinquentAssignments.length) {
        return {
          cycleId,
          notifiedAssignments: 0,
          delinquentAssignments: []
        };
      }

      const reminderSentAt = new Date().toISOString();
      delinquentAssignments.forEach((assignment) => {
        assignment.reminderCount = Number(assignment.reminderCount || 0) + 1;
        assignment.lastReminderSentAt = reminderSentAt;
      });

      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.cycle,
        action: "delinquent_reminder_sent",
        entityType: "evaluation_cycle",
        entityId: cycle.id,
        entityLabel: cycle.title,
        actorUser,
        summary: `Lembrete enviado para inadimplentes: ${cycle.title}`,
        detail: buildCycleReminderAuditDetail(delinquentAssignments.length)
      });

      return {
        cycleId,
        notifiedAssignments: delinquentAssignments.length,
        delinquentAssignments: delinquentAssignments.map((assignment) =>
          presentDelinquentAssignment(assignment, db, cycle.status)
        )
      };
    },
    async updateEvaluationCycleStatus(cycleId, nextStatus, actorUser) {
      const cycle = db.cycles.find((item) => item.id === cycleId);
      if (!cycle) {
        throw new Error("Ciclo de avaliacao nao encontrado.");
      }

      const previousStatus = cycle.status;
      assertCycleStatusTransition(cycle.status, nextStatus);
      cycle.status = nextStatus;
      if (nextStatus === CYCLE_STATUS.processed) {
        const responses = [
          ...db.submissions
            .filter((submission) => submission.cycleId === cycleId)
            .map((item) => enrichSubmission(db, item, customLibraryState.published)),
          ...anonymousResponseState.responses.filter((response) => response.cycleId === cycleId)
        ];
        const snapshots = buildCycleReportSnapshots(cycleId, responses);
        db.cycleReports = db.cycleReports.filter((item) => item.cycleId !== cycleId);
        db.cycleReports.unshift(...snapshots);
      }
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.cycle,
        action: nextStatus === CYCLE_STATUS.processed ? "processed" : "status_changed",
        entityType: "cycle",
        entityId: cycle.id,
        entityLabel: cycle.title,
        actorUser,
        summary: `Status do ciclo atualizado: ${cycle.title}`,
        detail: buildCycleStatusAuditDetail(previousStatus, nextStatus)
      });
      return { ...presentCycle(cycle), supportsConfig: true };
    },
    async updateEvaluationCycleConfig(cycleId, payload, actorUser) {
      if (!["admin", "hr"].includes(actorUser?.roleKey || "")) {
        throw new Error("Perfil sem permissao para configurar ciclos.");
      }

      const cycle = db.cycles.find((item) => item.id === cycleId);
      if (!cycle) {
        throw new Error("Ciclo de avaliacao nao encontrado.");
      }

      const currentModuleAvailability = normalizeCycleModuleAvailability(cycle.moduleAvailability);
      const cycleConfigUpdate = resolveCycleConfigUpdate(
        currentModuleAvailability,
        normalizeTransversalConfig(cycle.transversalConfig),
        payload
      );

      if (cycleConfigUpdate.nextIsEnabled !== undefined) {
        cycle.isEnabled = cycleConfigUpdate.nextIsEnabled;
      }

      if (cycleConfigUpdate.nextModuleAvailability) {
        cycle.moduleAvailability = cycleConfigUpdate.nextModuleAvailability;
      }
      if (cycleConfigUpdate.nextTransversalConfig) {
        cycle.transversalConfig = cycleConfigUpdate.nextTransversalConfig;
      }

      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.cycle,
        action: "config_changed",
        entityType: "cycle",
        entityId: cycle.id,
        entityLabel: cycle.title,
        actorUser,
        summary: `Configuracao do ciclo atualizada: ${cycle.title}`,
        detail: buildCycleConfigAuditDetail(cycle.isEnabled)
      });

      return presentCycle(cycle);
    },
    async getFeedbackRequests(actorUser) {
      return filterFeedbackRequestsForUser(db, actorUser);
    },
    async createFeedbackRequest(payload, actorUser) {
      const providerPersonIds = assertCanCreateFeedbackRequest(db, actorUser, payload);

      const request = {
        ...prepareFeedbackRequest({
          payload,
          actorUser,
          createId,
          requestedAt: new Date().toISOString()
        }),
        decidedAt: null,
        decidedByUserId: null
      };
      db.feedbackRequests.unshift(request);

      const items = buildFeedbackRequestItems({
        providerPersonIds,
        requestId: request.id,
        createId
      });
      db.feedbackRequestItems.unshift(...items);

      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.feedbackRequest,
        action: "created",
        entityType: "feedback_request",
        entityId: request.id,
        entityLabel: actorUser.person?.name || actorUser.email,
        actorUser,
        summary: "Solicitacao de feedback direto registrada",
        detail: buildFeedbackRequestCreateAuditDetail(providerPersonIds, request.cycleId)
      });

      return presentFeedbackRequest(db, request);
    },
    async reviewFeedbackRequest(requestId, payload, actorUser) {
      if (!["admin", "hr"].includes(actorUser.roleKey)) {
        throw new Error("Perfil sem permissao para aprovar solicitacoes de feedback.");
      }

      assertValidFeedbackRequestStatus(payload.status);
      const request = db.feedbackRequests.find((item) => item.id === requestId);
      if (!request) {
        throw new Error("Solicitacao de feedback nao encontrada.");
      }
      if (request.status !== FEEDBACK_REQUEST_STATUS.pending) {
        throw new Error("A solicitacao ja foi tratada.");
      }

      request.status = payload.status;
      request.decidedAt = new Date().toISOString();
      request.decidedByUserId = actorUser.id;

      if (payload.status === FEEDBACK_REQUEST_STATUS.approved) {
        const cycle = db.cycles.find((item) => item.id === request.cycleId);
        if (!cycle) {
          throw new Error("Ciclo de avaliacao nao encontrado.");
        }
        if (!isCycleRelationshipEnabled(cycle, "peer")) {
          throw new Error("Feedback direto esta desativado neste ciclo.");
        }
        const items = getFeedbackRequestItems(db, request.id);

        for (const item of items) {
          const reviewerUser = db.users.find(
            (user) => user.personId === item.providerPersonId && user.status === "active"
          );
          if (!reviewerUser) {
            continue;
          }

          const assignment = {
            id: createId("assignment"),
            cycleId: request.cycleId,
            reviewerUserId: reviewerUser.id,
            revieweePersonId: request.revieweePersonId,
            relationshipType: "peer",
            projectContext: "Feedback direto solicitado",
            collaborationContext: request.contextNote,
            status: "pending",
            dueDate: cycle.dueDate || ""
          };
          pushAssignment(db.assignments, assignment);
          const createdAssignment = db.assignments.find(
            (entry) =>
              entry.cycleId === assignment.cycleId &&
              entry.reviewerUserId === assignment.reviewerUserId &&
              entry.revieweePersonId === assignment.revieweePersonId &&
              entry.relationshipType === assignment.relationshipType
          );
          item.assignmentId = createdAssignment?.id || null;
        }
      }

      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.feedbackRequest,
        action: payload.status === FEEDBACK_REQUEST_STATUS.approved ? "approved" : "rejected",
        entityType: "feedback_request",
        entityId: request.id,
        entityLabel:
          db.people.find((item) => item.id === request.revieweePersonId)?.name || request.id,
        actorUser,
        summary:
          payload.status === FEEDBACK_REQUEST_STATUS.approved
            ? "Solicitacao de feedback aprovada"
            : "Solicitacao de feedback rejeitada",
        detail: buildFeedbackRequestReviewAuditDetail(request)
      });

      return presentFeedbackRequest(db, request);
    }
  };
}

export function createMysqlEvaluationWorkflowStore({
  pool,
  createId,
  customLibraryState,
  anonymousResponseState,
  supportsAssignmentReminder,
  supportsCycleConfig,
  supportsFeedbackAcknowledgement,
  fetchCycleAssignmentRows,
  fetchPeopleRows,
  fetchUserRows,
  fetchMysqlResponses,
  insertAuditLog,
  presentDelinquentAssignment,
  isAssignmentDelinquent,
  AUDIT_CATEGORIES,
  buildCycleReminderAuditDetail,
  assertCycleStatusTransition,
  CYCLE_STATUS,
  buildCycleReportSnapshots,
  buildCycleStatusAuditDetail,
  presentCycle,
  normalizeCycleModuleAvailability,
  normalizeTransversalConfig,
  resolveCycleConfigUpdate,
  buildCycleConfigAuditDetail,
  isOrgWideUser,
  isManagerUser,
  assertCanCreateFeedbackRequest,
  prepareFeedbackRequest,
  buildFeedbackRequestItems,
  buildFeedbackRequestCreateAuditDetail,
  assertValidFeedbackRequestStatus,
  FEEDBACK_REQUEST_STATUS,
  isCycleRelationshipEnabled,
  buildFeedbackRequestReviewAuditDetail
}) {
  return {
    async notifyCycleDelinquents(cycleId, actorUser) {
      const [cycleRows] = await pool.query(
        `SELECT id, title, status
         FROM evaluation_cycles
         WHERE id = ?
         LIMIT 1`,
        [cycleId]
      );
      if (!cycleRows[0]) {
        throw new Error("Ciclo de avaliacao nao encontrado.");
      }

      const assignments = await fetchCycleAssignmentRows(pool, cycleId, {
        supportsAssignmentReminder
      });
      const delinquentAssignments = assignments.filter((assignment) =>
        isAssignmentDelinquent(assignment, cycleRows[0].status)
      );

      if (!delinquentAssignments.length) {
        return {
          cycleId,
          notifiedAssignments: 0,
          delinquentAssignments: []
        };
      }

      const reminderSentAt = new Date().toISOString();
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        for (const assignment of delinquentAssignments) {
          if (supportsAssignmentReminder) {
            await connection.query(
              `UPDATE evaluation_assignments
               SET reminder_count = COALESCE(reminder_count, 0) + 1,
                   last_reminder_sent_at = ?
               WHERE id = ?`,
              [reminderSentAt, assignment.id]
            );
          }
        }

        await insertAuditLog(connection, {
          category: AUDIT_CATEGORIES.cycle,
          action: "delinquent_reminder_sent",
          entityType: "evaluation_cycle",
          entityId: cycleRows[0].id,
          entityLabel: cycleRows[0].title,
          actorUser,
          summary: `Lembrete enviado para inadimplentes: ${cycleRows[0].title}`,
          detail: buildCycleReminderAuditDetail(delinquentAssignments.length)
        });

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      const [people, users] = await Promise.all([fetchPeopleRows(pool), fetchUserRows(pool)]);
      const refreshedAssignments = await fetchCycleAssignmentRows(pool, cycleId, {
        supportsAssignmentReminder
      });

      return {
        cycleId,
        notifiedAssignments: delinquentAssignments.length,
        delinquentAssignments: refreshedAssignments
          .filter((assignment) => isAssignmentDelinquent(assignment, cycleRows[0].status))
          .map((assignment) =>
            presentDelinquentAssignment(
              assignment,
              { people, users },
              cycleRows[0].status
            )
          )
      };
    },
    async updateEvaluationCycleStatus(cycleId, nextStatus, actorUser) {
      const [rows] = await pool.query(
        `SELECT id, status
         FROM evaluation_cycles
         WHERE id = ?
         LIMIT 1`,
        [cycleId]
      );

      if (!rows[0]) {
        throw new Error("Ciclo de avaliacao nao encontrado.");
      }

      const previousStatus = rows[0].status;
      assertCycleStatusTransition(rows[0].status, nextStatus);

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        await connection.query(
          `UPDATE evaluation_cycles
           SET status = ?
           WHERE id = ?`,
          [nextStatus, cycleId]
        );

        if (nextStatus === CYCLE_STATUS.processed) {
          const responses = [
            ...(await fetchMysqlResponses(pool, customLibraryState.published, {
              supportsFeedbackAcknowledgement
            })).filter((response) => response.cycleId === cycleId),
            ...anonymousResponseState.responses.filter((response) => response.cycleId === cycleId)
          ];
          const snapshots = buildCycleReportSnapshots(cycleId, responses);

          await connection.query(`DELETE FROM evaluation_cycle_reports WHERE cycle_id = ?`, [
            cycleId
          ]);

          for (const snapshot of snapshots) {
            await connection.query(
              `INSERT INTO evaluation_cycle_reports
               (id, cycle_id, relationship_type, total_responses, average_score, question_averages_json, generated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                snapshot.id,
                snapshot.cycleId,
                snapshot.relationshipType,
                snapshot.totalResponses,
                snapshot.averageScore,
                JSON.stringify(snapshot.questionAverages),
                snapshot.generatedAt
              ]
            );
          }
        }

        const [updatedRows] = await connection.query(
          `SELECT c.id, c.template_id AS templateId, c.title, c.semester_label AS semesterLabel,
                  c.status, c.due_date AS dueDate, c.target_group AS targetGroup,
                  c.library_id AS libraryId, c.library_name AS libraryName,
                  COALESCE(c.library_name, t.name) AS modelName, c.created_by_user_id AS createdByUserId,
                  COUNT(DISTINCT er.id) AS reportSnapshotCount
           FROM evaluation_cycles c
           JOIN evaluation_templates t ON t.id = c.template_id
           LEFT JOIN evaluation_cycle_reports er ON er.cycle_id = c.id
           WHERE c.id = ?
           GROUP BY c.id, c.template_id, c.title, c.semester_label, c.status, c.due_date, c.target_group,
                    c.library_id, c.library_name, t.name, c.created_by_user_id`,
          [cycleId]
        );

        await insertAuditLog(connection, {
          category: AUDIT_CATEGORIES.cycle,
          action: nextStatus === CYCLE_STATUS.processed ? "processed" : "status_changed",
          entityType: "cycle",
          entityId: cycleId,
          entityLabel: updatedRows[0].title,
          actorUser,
          summary:
            nextStatus === CYCLE_STATUS.processed
              ? `Ciclo processado: ${updatedRows[0].title}`
              : `Status do ciclo atualizado: ${updatedRows[0].title}`,
          detail: buildCycleStatusAuditDetail(previousStatus, nextStatus)
        });

        await connection.commit();
        return presentCycle(updatedRows[0]);
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
    async updateEvaluationCycleConfig(cycleId, payload, actorUser) {
      if (!["admin", "hr"].includes(actorUser?.roleKey || "")) {
        throw new Error("Perfil sem permissao para configurar ciclos.");
      }

      const [rows] = await pool.query(
        `SELECT id, title, is_enabled AS isEnabled, enabled_relationships_json AS enabledRelationshipsJson, transversal_config_json AS transversalConfigJson
         FROM evaluation_cycles
         WHERE id = ?
         LIMIT 1`,
        [cycleId]
      );

      if (!rows[0]) {
        throw new Error("Ciclo de avaliacao nao encontrado.");
      }

      const current = presentCycle(rows[0]);
      const cycleConfigUpdate = resolveCycleConfigUpdate(
        normalizeCycleModuleAvailability(current.moduleAvailability),
        normalizeTransversalConfig(current.transversalConfig),
        payload
      );
      const nextIsEnabled =
        cycleConfigUpdate.nextIsEnabled === undefined
          ? current.isEnabled
          : cycleConfigUpdate.nextIsEnabled;
      const nextModuleAvailability =
        cycleConfigUpdate.nextModuleAvailability ||
        normalizeCycleModuleAvailability(current.moduleAvailability);
      const nextTransversalConfig =
        cycleConfigUpdate.nextTransversalConfig ||
        normalizeTransversalConfig(current.transversalConfig);

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        await connection.query(
          `UPDATE evaluation_cycles
           SET is_enabled = ?, enabled_relationships_json = ?, transversal_config_json = ?
           WHERE id = ?`,
          [
            nextIsEnabled ? 1 : 0,
            JSON.stringify(nextModuleAvailability),
            JSON.stringify(nextTransversalConfig),
            cycleId
          ]
        );

        await insertAuditLog(connection, {
          category: AUDIT_CATEGORIES.cycle,
          action: "config_changed",
          entityType: "cycle",
          entityId: cycleId,
          entityLabel: rows[0].title,
          actorUser,
          summary: `Configuracao do ciclo atualizada: ${rows[0].title}`,
          detail: buildCycleConfigAuditDetail(nextIsEnabled)
        });

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      const [updatedRows] = await pool.query(
        `SELECT c.id, c.template_id AS templateId, c.title, c.semester_label AS semesterLabel,
                c.status, c.is_enabled AS isEnabled, c.enabled_relationships_json AS enabledRelationshipsJson,
                c.transversal_config_json AS transversalConfigJson,
                c.due_date AS dueDate, c.target_group AS targetGroup,
                c.library_id AS libraryId, c.library_name AS libraryName,
                COALESCE(c.library_name, t.name) AS modelName, c.created_by_user_id AS createdByUserId
         FROM evaluation_cycles c
         JOIN evaluation_templates t ON t.id = c.template_id
         WHERE c.id = ?
         LIMIT 1`,
        [cycleId]
      );

      return updatedRows[0]
        ? { ...presentCycle(updatedRows[0]), supportsConfig: true }
        : { ...presentCycle(rows[0]), supportsConfig: true };
    },
    async getFeedbackRequests(actorUser) {
      const [requestRows] = await pool.query(
        `SELECT r.id, r.cycle_id AS cycleId, r.requester_user_id AS requesterUserId,
                r.reviewee_person_id AS revieweePersonId, r.status, r.context_note AS contextNote,
                r.requested_at AS requestedAt, r.decided_at AS decidedAt,
                r.decided_by_user_id AS decidedByUserId,
                c.title AS cycleTitle, c.semester_label AS semesterLabel, c.status AS cycleStatus,
                requester_person.name AS requesterName, reviewee.name AS revieweeName,
                decided_person.name AS decidedByName
         FROM evaluation_feedback_requests r
         JOIN evaluation_cycles c ON c.id = r.cycle_id
         JOIN users requester_user ON requester_user.id = r.requester_user_id
         JOIN people requester_person ON requester_person.id = requester_user.person_id
         JOIN people reviewee ON reviewee.id = r.reviewee_person_id
         LEFT JOIN users decided_user ON decided_user.id = r.decided_by_user_id
         LEFT JOIN people decided_person ON decided_person.id = decided_user.person_id
         ORDER BY r.requested_at DESC`
      );
      const [itemRows] = await pool.query(
        `SELECT i.id, i.request_id AS requestId, i.provider_person_id AS providerPersonId,
                i.assignment_id AS assignmentId, p.name AS providerName
         FROM evaluation_feedback_request_items i
         JOIN people p ON p.id = i.provider_person_id
         ORDER BY p.name`
      );

      const requests = requestRows.map((row) => ({
        ...row,
        providers: itemRows.filter((item) => item.requestId === row.id)
      }));

      if (isOrgWideUser(actorUser)) {
        return requests;
      }

      if (isManagerUser(actorUser)) {
        const people = await fetchPeopleRows(pool);
        return requests.filter((item) => {
          const reviewee = people.find((person) => person.id === item.revieweePersonId);
          return (
            item.requesterUserId === actorUser.id ||
            item.revieweePersonId === actorUser.person.id ||
            reviewee?.managerPersonId === actorUser.person.id
          );
        });
      }

      return requests.filter((item) => item.requesterUserId === actorUser.id);
    },
    async createFeedbackRequest(payload, actorUser) {
      const people = await fetchPeopleRows(pool);
      const users = await fetchUserRows(pool);
      const dbSnapshot = {
        people,
        users,
        cycles: await this.getEvaluationCycles(),
        assignments: await pool
          .query(
            `SELECT id, cycle_id AS cycleId, reviewer_user_id AS reviewerUserId,
                    reviewee_person_id AS revieweePersonId, relationship_type AS relationshipType
             FROM evaluation_assignments`
          )
          .then(([rows]) => rows)
      };
      const providerPersonIds = assertCanCreateFeedbackRequest(dbSnapshot, actorUser, payload);

      const request = prepareFeedbackRequest({
        payload,
        actorUser,
        createId,
        requestedAt: toMysqlDateTime(new Date())
      });

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(
          `INSERT INTO evaluation_feedback_requests
           (id, cycle_id, requester_user_id, reviewee_person_id, status, context_note, requested_at, decided_at, decided_by_user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
          [
            request.id,
            request.cycleId,
            request.requesterUserId,
            request.revieweePersonId,
            request.status,
            request.contextNote,
            request.requestedAt
          ]
        );

        for (const item of buildFeedbackRequestItems({
          providerPersonIds,
          requestId: request.id,
          createId
        })) {
          await connection.query(
            `INSERT INTO evaluation_feedback_request_items
             (id, request_id, provider_person_id, assignment_id)
             VALUES (?, ?, ?, NULL)`,
            [item.id, item.requestId, item.providerPersonId]
          );
        }

        await insertAuditLog(connection, {
          category: AUDIT_CATEGORIES.feedbackRequest,
          action: "created",
          entityType: "feedback_request",
          entityId: request.id,
          entityLabel: actorUser.person?.name || actorUser.email,
          actorUser,
          summary: "Solicitacao de feedback direto registrada",
          detail: buildFeedbackRequestCreateAuditDetail(providerPersonIds, request.cycleId)
        });

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      const requests = await this.getFeedbackRequests(actorUser);
      return requests.find((item) => item.id === request.id);
    },
    async reviewFeedbackRequest(requestId, payload, actorUser) {
      if (!["admin", "hr"].includes(actorUser.roleKey)) {
        throw new Error("Perfil sem permissao para aprovar solicitacoes de feedback.");
      }

      assertValidFeedbackRequestStatus(payload.status);

      const [requestRows] = await pool.query(
        `SELECT r.id, r.cycle_id AS cycleId, r.requester_user_id AS requesterUserId,
                r.reviewee_person_id AS revieweePersonId, r.status, r.context_note AS contextNote,
                c.due_date AS dueDate
         FROM evaluation_feedback_requests r
         JOIN evaluation_cycles c ON c.id = r.cycle_id
         WHERE r.id = ?
         LIMIT 1`,
        [requestId]
      );
      if (!requestRows[0]) {
        throw new Error("Solicitacao de feedback nao encontrada.");
      }
      if (requestRows[0].status !== FEEDBACK_REQUEST_STATUS.pending) {
        throw new Error("A solicitacao ja foi tratada.");
      }

      const [itemRows] = await pool.query(
        `SELECT i.id, i.provider_person_id AS providerPersonId
         FROM evaluation_feedback_request_items i
         WHERE i.request_id = ?`,
        [requestId]
      );

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(
          `UPDATE evaluation_feedback_requests
           SET status = ?, decided_at = ?, decided_by_user_id = ?
           WHERE id = ?`,
          [payload.status, toMysqlDateTime(new Date()), actorUser.id, requestId]
        );

        if (payload.status === FEEDBACK_REQUEST_STATUS.approved) {
          if (supportsCycleConfig) {
            const [cycleConfigRows] = await connection.query(
              `SELECT is_enabled AS isEnabled, enabled_relationships_json AS enabledRelationshipsJson, transversal_config_json AS transversalConfigJson
               FROM evaluation_cycles
               WHERE id = ?
               LIMIT 1`,
              [requestRows[0].cycleId]
            );
            if (!cycleConfigRows[0]) {
              throw new Error("Ciclo de avaliacao nao encontrado.");
            }
            if (!isCycleRelationshipEnabled(cycleConfigRows[0], "peer")) {
              throw new Error("Feedback direto esta desativado neste ciclo.");
            }
          }

          const users = await fetchUserRows(pool);
          for (const item of itemRows) {
            const reviewerUser = users.find(
              (user) => user.personId === item.providerPersonId && user.status === "active"
            );
            if (!reviewerUser) {
              continue;
            }

            const assignmentId = createId("assignment");
            await connection.query(
              `INSERT INTO evaluation_assignments
               (id, cycle_id, reviewer_user_id, reviewee_person_id, relationship_type, project_context,
                collaboration_context, status, due_date)
               VALUES (?, ?, ?, ?, 'peer', ?, ?, 'pending', ?)`,
              [
                assignmentId,
                requestRows[0].cycleId,
                reviewerUser.id,
                requestRows[0].revieweePersonId,
                "Feedback direto solicitado",
                requestRows[0].contextNote,
                requestRows[0].dueDate
              ]
            );
            await connection.query(
              `UPDATE evaluation_feedback_request_items
               SET assignment_id = ?
               WHERE id = ?`,
              [assignmentId, item.id]
            );
          }
        }

        await insertAuditLog(connection, {
          category: AUDIT_CATEGORIES.feedbackRequest,
          action: payload.status === FEEDBACK_REQUEST_STATUS.approved ? "approved" : "rejected",
          entityType: "feedback_request",
          entityId: requestId,
          entityLabel: requestRows[0].revieweePersonId,
          actorUser,
          summary:
            payload.status === FEEDBACK_REQUEST_STATUS.approved
              ? "Solicitacao de feedback aprovada"
              : "Solicitacao de feedback rejeitada",
          detail: buildFeedbackRequestReviewAuditDetail(requestRows[0])
        });

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      const requests = await this.getFeedbackRequests(actorUser);
      return requests.find((item) => item.id === requestId);
    }
  };
}
