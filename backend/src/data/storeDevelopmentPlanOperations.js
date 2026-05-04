export function createMemoryDevelopmentPlanStore({
  db,
  createId,
  isOrgWideUser,
  isManagerUser,
  getTeamPeople,
  enrichDevelopmentPlan,
  assertCanCreateDevelopmentPlan,
  pushAuditLog,
  AUDIT_CATEGORIES,
  buildDevelopmentPlanAuditDetail,
  assertValidDevelopmentPlanStatus,
  assertCanReportDevelopmentPlanProgress,
  normalizeDevelopmentPlanProgressPayload
}) {
  return {
    async getDevelopmentPlans(actorUser) {
      const actorPersonId = actorUser.person?.id || actorUser.personId;
      const plans = db.developmentPlans.map((item) =>
        enrichDevelopmentPlan(item, db.people, db.cycles, db.competencies)
      );

      if (isOrgWideUser(actorUser)) {
        return plans;
      }

      if (isManagerUser(actorUser)) {
        const visiblePersonIds = new Set([
          actorPersonId,
          ...getTeamPeople(db.people, actorPersonId).map((item) => item.id)
        ]);
        return plans.filter((item) => visiblePersonIds.has(item.personId));
      }

      return plans.filter((item) => item.personId === actorPersonId);
    },
    async createDevelopmentPlan(payload, actorUser) {
      assertCanCreateDevelopmentPlan(actorUser, db.people, payload.personId);
      if (payload.cycleId && !db.cycles.some((item) => item.id === payload.cycleId)) {
        throw new Error("Ciclo do PDI nao encontrado.");
      }
      if (
        payload.competencyId &&
        !db.competencies.some((item) => item.id === payload.competencyId)
      ) {
        throw new Error("Competencia do PDI nao encontrada.");
      }

      const plan = {
        id: createId("development_plan"),
        personId: payload.personId,
        cycleId: payload.cycleId || null,
        competencyId: payload.competencyId || null,
        focusTitle: payload.focusTitle,
        actionText: payload.actionText,
        dueDate: payload.dueDate,
        expectedEvidence: payload.expectedEvidence,
        status: "active",
        createdByUserId: actorUser.id,
        createdAt: new Date().toISOString(),
        archivedAt: null,
        progressStatus: "not_started",
        progressNote: "",
        progressUpdatedAt: null
      };
      db.developmentPlans.unshift(plan);
      const person = db.people.find((item) => item.id === plan.personId);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.development,
        action: "plan_created",
        entityType: "development_plan",
        entityId: plan.id,
        entityLabel: plan.focusTitle,
        actorUser,
        summary: `PDI criado para ${person?.name || "pessoa"}`,
        detail: buildDevelopmentPlanAuditDetail(plan)
      });
      return enrichDevelopmentPlan(plan, db.people, db.cycles, db.competencies);
    },
    async updateDevelopmentPlan(planId, payload, actorUser) {
      const plan = db.developmentPlans.find((item) => item.id === planId);
      if (!plan) {
        throw new Error("PDI nao encontrado.");
      }

      assertCanCreateDevelopmentPlan(actorUser, db.people, payload.personId);
      assertValidDevelopmentPlanStatus(payload.status);
      if (payload.cycleId && !db.cycles.some((item) => item.id === payload.cycleId)) {
        throw new Error("Ciclo do PDI nao encontrado.");
      }
      if (
        payload.competencyId &&
        !db.competencies.some((item) => item.id === payload.competencyId)
      ) {
        throw new Error("Competencia do PDI nao encontrada.");
      }

      plan.personId = payload.personId;
      plan.cycleId = payload.cycleId || null;
      plan.competencyId = payload.competencyId || null;
      plan.focusTitle = payload.focusTitle;
      plan.actionText = payload.actionText;
      plan.dueDate = payload.dueDate;
      plan.expectedEvidence = payload.expectedEvidence;
      plan.status = payload.status;
      plan.archivedAt = payload.status === "archived" ? new Date().toISOString() : null;
      plan.progressStatus = plan.progressStatus || "not_started";
      plan.progressNote = plan.progressNote || "";
      plan.progressUpdatedAt = plan.progressUpdatedAt || null;

      const person = db.people.find((item) => item.id === plan.personId);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.development,
        action: payload.status === "archived" ? "plan_archived" : "plan_updated",
        entityType: "development_plan",
        entityId: plan.id,
        entityLabel: plan.focusTitle,
        actorUser,
        summary:
          payload.status === "archived"
            ? `PDI arquivado para ${person?.name || "pessoa"}`
            : `PDI atualizado para ${person?.name || "pessoa"}`,
        detail: buildDevelopmentPlanAuditDetail(plan)
      });

      return enrichDevelopmentPlan(plan, db.people, db.cycles, db.competencies);
    },
    async updateDevelopmentPlanProgress(planId, payload, actorUser) {
      const plan = db.developmentPlans.find((item) => item.id === planId);
      if (!plan) {
        throw new Error("PDI nao encontrado.");
      }

      assertCanReportDevelopmentPlanProgress(actorUser, db.people, plan);
      const progress = normalizeDevelopmentPlanProgressPayload(payload);
      plan.progressStatus = progress.progressStatus;
      plan.progressNote = progress.progressNote;
      plan.progressUpdatedAt = new Date().toISOString();

      const person = db.people.find((item) => item.id === plan.personId);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.development,
        action: "plan_progress_reported",
        entityType: "development_plan",
        entityId: plan.id,
        entityLabel: plan.focusTitle,
        actorUser,
        summary: `Andamento do PDI reportado para ${person?.name || "pessoa"}`,
        detail: `${plan.progressStatus} · ${plan.progressNote || "Sem nota"}`
      });

      return enrichDevelopmentPlan(plan, db.people, db.cycles, db.competencies);
    }
  };
}

export function createMysqlDevelopmentPlanStore({
  pool,
  createId,
  isOrgWideUser,
  isManagerUser,
  fetchDevelopmentPlanRows,
  fetchPeopleRows,
  fetchCompetencyRows,
  getTeamPeople,
  enrichDevelopmentPlan,
  assertCanCreateDevelopmentPlan,
  insertAuditLog,
  AUDIT_CATEGORIES,
  buildDevelopmentPlanAuditDetail,
  assertValidDevelopmentPlanStatus,
  assertCanReportDevelopmentPlanProgress,
  normalizeDevelopmentPlanProgressPayload
}) {
  return {
    async getDevelopmentPlans(actorUser) {
      const actorPersonId = actorUser.person?.id || actorUser.personId;
      const [plans, people, cycles, competencies] = await Promise.all([
        fetchDevelopmentPlanRows(pool),
        fetchPeopleRows(pool),
        pool
          .query(
            `SELECT id, title, semester_label AS semesterLabel, due_date AS dueDate
             FROM evaluation_cycles`
          )
          .then(([rows]) => rows),
        fetchCompetencyRows(pool)
      ]);

      const enrichedPlans = plans.map((item) =>
        enrichDevelopmentPlan(item, people, cycles, competencies)
      );

      if (isOrgWideUser(actorUser)) {
        return enrichedPlans;
      }

      if (isManagerUser(actorUser)) {
        const visiblePersonIds = new Set([
          actorPersonId,
          ...getTeamPeople(people, actorPersonId).map((item) => item.id)
        ]);
        return enrichedPlans.filter((item) => visiblePersonIds.has(item.personId));
      }

      return enrichedPlans.filter((item) => item.personId === actorPersonId);
    },
    async createDevelopmentPlan(payload, actorUser) {
      const [people, competencies] = await Promise.all([
        fetchPeopleRows(pool),
        fetchCompetencyRows(pool)
      ]);
      assertCanCreateDevelopmentPlan(actorUser, people, payload.personId);

      if (payload.cycleId) {
        const [[cycle]] = await pool.query(
          `SELECT id FROM evaluation_cycles WHERE id = ? LIMIT 1`,
          [payload.cycleId]
        );
        if (!cycle) {
          throw new Error("Ciclo do PDI nao encontrado.");
        }
      }

      if (payload.competencyId && !competencies.some((item) => item.id === payload.competencyId)) {
        throw new Error("Competencia do PDI nao encontrada.");
      }

      const plan = {
        id: createId("development_plan"),
        personId: payload.personId,
        cycleId: payload.cycleId || null,
        competencyId: payload.competencyId || null,
        focusTitle: payload.focusTitle,
        actionText: payload.actionText,
        dueDate: payload.dueDate,
        expectedEvidence: payload.expectedEvidence,
        status: "active",
        createdByUserId: actorUser.id,
        createdAt: new Date().toISOString(),
        archivedAt: null,
        progressStatus: "not_started",
        progressNote: "",
        progressUpdatedAt: null
      };

      await pool.query(
        `INSERT INTO development_plans
         (id, person_id, cycle_id, competency_id, focus_title, action_text, due_date,
          expected_evidence, status, created_by_user_id, created_at, archived_at,
          progress_status, progress_note, progress_updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          plan.id,
          plan.personId,
          plan.cycleId,
          plan.competencyId,
          plan.focusTitle,
          plan.actionText,
          plan.dueDate,
          plan.expectedEvidence,
          plan.status,
          plan.createdByUserId,
          plan.createdAt,
          plan.archivedAt,
          plan.progressStatus,
          plan.progressNote,
          plan.progressUpdatedAt
        ]
      );

      const person = people.find((item) => item.id === plan.personId);
      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.development,
        action: "plan_created",
        entityType: "development_plan",
        entityId: plan.id,
        entityLabel: plan.focusTitle,
        actorUser,
        summary: `PDI criado para ${person?.name || "pessoa"}`,
        detail: buildDevelopmentPlanAuditDetail(plan)
      });

      const [cycles] = await pool.query(
        `SELECT id, title, semester_label AS semesterLabel, due_date AS dueDate
         FROM evaluation_cycles`
      );
      return enrichDevelopmentPlan(plan, people, cycles, competencies);
    },
    async updateDevelopmentPlan(planId, payload, actorUser) {
      const [people, competencies] = await Promise.all([
        fetchPeopleRows(pool),
        fetchCompetencyRows(pool)
      ]);
      const [[existingPlan]] = await pool.query(
        `SELECT id, person_id AS personId, created_by_user_id AS createdByUserId,
                created_at AS createdAt, progress_status AS progressStatus,
                progress_note AS progressNote, progress_updated_at AS progressUpdatedAt
         FROM development_plans
         WHERE id = ?`,
        [planId]
      );

      if (!existingPlan) {
        throw new Error("PDI nao encontrado.");
      }

      assertCanCreateDevelopmentPlan(actorUser, people, payload.personId || existingPlan.personId);
      assertValidDevelopmentPlanStatus(payload.status);

      if (payload.cycleId) {
        const [[cycle]] = await pool.query(
          `SELECT id FROM evaluation_cycles WHERE id = ? LIMIT 1`,
          [payload.cycleId]
        );
        if (!cycle) {
          throw new Error("Ciclo do PDI nao encontrado.");
        }
      }

      if (payload.competencyId && !competencies.some((item) => item.id === payload.competencyId)) {
        throw new Error("Competencia do PDI nao encontrada.");
      }

      const archivedAt = payload.status === "archived" ? new Date().toISOString() : null;
      await pool.query(
        `UPDATE development_plans
         SET person_id = ?, cycle_id = ?, competency_id = ?, focus_title = ?, action_text = ?,
             due_date = ?, expected_evidence = ?, status = ?, archived_at = ?
         WHERE id = ?`,
        [
          payload.personId,
          payload.cycleId || null,
          payload.competencyId || null,
          payload.focusTitle,
          payload.actionText,
          payload.dueDate,
          payload.expectedEvidence,
          payload.status,
          archivedAt,
          planId
        ]
      );

      const person = people.find((item) => item.id === payload.personId);
      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.development,
        action: payload.status === "archived" ? "plan_archived" : "plan_updated",
        entityType: "development_plan",
        entityId: planId,
        entityLabel: payload.focusTitle,
        actorUser,
        summary:
          payload.status === "archived"
            ? `PDI arquivado para ${person?.name || "pessoa"}`
            : `PDI atualizado para ${person?.name || "pessoa"}`,
        detail: buildDevelopmentPlanAuditDetail(payload)
      });

      const [cycles] = await pool.query(
        `SELECT id, title, semester_label AS semesterLabel, due_date AS dueDate
         FROM evaluation_cycles`
      );
      return enrichDevelopmentPlan(
        {
          id: planId,
          ...payload,
          cycleId: payload.cycleId || null,
          competencyId: payload.competencyId || null,
          createdByUserId: existingPlan.createdByUserId,
          createdAt: existingPlan.createdAt,
          archivedAt,
          progressStatus: existingPlan.progressStatus || "not_started",
          progressNote: existingPlan.progressNote || "",
          progressUpdatedAt: existingPlan.progressUpdatedAt || null
        },
        people,
        cycles,
        competencies
      );
    },
    async updateDevelopmentPlanProgress(planId, payload, actorUser) {
      const [people, cycles, competencies] = await Promise.all([
        fetchPeopleRows(pool),
        pool
          .query(
            `SELECT id, title, semester_label AS semesterLabel, due_date AS dueDate
             FROM evaluation_cycles`
          )
          .then(([rows]) => rows),
        fetchCompetencyRows(pool)
      ]);
      const [[plan]] = await pool.query(
        `SELECT id, person_id AS personId, cycle_id AS cycleId, competency_id AS competencyId,
                focus_title AS focusTitle, action_text AS actionText, due_date AS dueDate,
                expected_evidence AS expectedEvidence, status,
                created_by_user_id AS createdByUserId, created_at AS createdAt,
                archived_at AS archivedAt
         FROM development_plans
         WHERE id = ?`,
        [planId]
      );

      if (!plan) {
        throw new Error("PDI nao encontrado.");
      }

      assertCanReportDevelopmentPlanProgress(actorUser, people, plan);
      const progress = normalizeDevelopmentPlanProgressPayload(payload);
      const progressUpdatedAt = new Date().toISOString();

      await pool.query(
        `UPDATE development_plans
         SET progress_status = ?, progress_note = ?, progress_updated_at = ?
         WHERE id = ?`,
        [progress.progressStatus, progress.progressNote, progressUpdatedAt, planId]
      );

      const person = people.find((item) => item.id === plan.personId);
      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.development,
        action: "plan_progress_reported",
        entityType: "development_plan",
        entityId: plan.id,
        entityLabel: plan.focusTitle,
        actorUser,
        summary: `Andamento do PDI reportado para ${person?.name || "pessoa"}`,
        detail: `${progress.progressStatus} · ${progress.progressNote || "Sem nota"}`
      });

      return enrichDevelopmentPlan(
        {
          ...plan,
          progressStatus: progress.progressStatus,
          progressNote: progress.progressNote,
          progressUpdatedAt
        },
        people,
        cycles,
        competencies
      );
    }
  };
}
