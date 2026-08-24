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
  normalizeDevelopmentPlanProgressPayload,
  normalizeDevelopmentPlanCompliancePayload
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

      const compliance = normalizeDevelopmentPlanCompliancePayload(payload, actorUser, db.people);
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
        progressUpdatedAt: null,
        ...compliance
      };
      db.developmentPlans.unshift(plan);
      db.developmentPlanProgressEvents = db.developmentPlanProgressEvents || [];
      db.developmentPlanProgressEvents.push({
        id: createId("development_plan_progress"),
        planId: plan.id,
        personId: plan.personId,
        previousStatus: null,
        progressStatus: plan.progressStatus,
        progressNote: plan.progressNote,
        occurredAt: plan.createdAt,
        changedByUserId: actorUser.id
      });
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
      const compliance = normalizeDevelopmentPlanCompliancePayload(payload, actorUser, db.people, plan);
      plan.status = payload.status;
      plan.archivedAt = payload.status === "archived" ? new Date().toISOString() : null;
      plan.progressStatus = plan.progressStatus || "not_started";
      plan.progressNote = plan.progressNote || "";
      plan.progressUpdatedAt = plan.progressUpdatedAt || null;
      plan.isComplianceRequired = compliance.isComplianceRequired;
      plan.complianceRequiredAt = compliance.complianceRequiredAt;
      plan.complianceRequiredByUserId = compliance.complianceRequiredByUserId;

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
    async listDevelopmentPlanExtensions(actorUser) {
      db.developmentPlanExtensions ||= [];
      const enrichedPlans = db.developmentPlans.map((plan) =>
        enrichDevelopmentPlan(plan, db.people, db.cycles, db.competencies)
      );
      return db.developmentPlanExtensions
        .map((extension) => {
          const plan = enrichedPlans.find((item) => item.id === extension.planId);
          const person = db.people.find((item) => item.id === plan?.personId);
          return {
            ...extension,
            planTitle: plan?.focusTitle || "",
            personId: plan?.personId || "",
            personName: person?.name || plan?.personName || "",
            currentDueDate: plan?.dueDate || null
          };
        })
        .filter((extension) => extension.planId && extension.personId)
        .filter((extension) =>
          ["admin", "hr"].includes(actorUser?.roleKey || "") ||
          db.people.some(
            (person) =>
              person.id === extension.personId &&
              person.managerPersonId === (actorUser.person?.id || actorUser.personId)
          )
        )
        .sort((left, right) => String(right.requestedAt).localeCompare(String(left.requestedAt)));
    },
    async requestDevelopmentPlanExtension(planId, payload, actorUser) {
      const plan = db.developmentPlans.find((item) => item.id === planId);
      if (!plan) {
        throw new Error("PDI nao encontrado.");
      }
      assertCanReportDevelopmentPlanProgress(actorUser, db.people, plan);
      if (!plan.isComplianceRequired) {
        throw new Error("Extensao formal se aplica apenas a PDI obrigatorio.");
      }
      db.developmentPlanExtensions ||= [];
      const extension = {
        id: createId("development_plan_extension"),
        planId,
        requestedDueDate: payload.requestedDueDate,
        reason: String(payload.reason || "").trim(),
        status: "pending",
        requestedByUserId: actorUser.id,
        requestedAt: new Date().toISOString(),
        decidedByUserId: null,
        decidedAt: null,
        leaderAreaName: actorUser.person?.area || null,
        decisionNote: ""
      };
      db.developmentPlanExtensions.unshift(extension);
      return extension;
    },
    async decideDevelopmentPlanExtension(planId, extensionId, payload, actorUser) {
      const plan = db.developmentPlans.find((item) => item.id === planId);
      if (!plan) {
        throw new Error("PDI nao encontrado.");
      }
      if (!["approved", "rejected", "cancelled"].includes(payload.status)) {
        throw new Error("Status de decisao de extensao invalido.");
      }
      if (!normalizeDevelopmentPlanCompliancePayload({ isComplianceRequired: true, personId: plan.personId }, actorUser, db.people, plan).isComplianceRequired) {
        throw new Error("Perfil sem permissao para decidir extensao.");
      }
      db.developmentPlanExtensions ||= [];
      const extension = db.developmentPlanExtensions.find((item) => item.id === extensionId && item.planId === planId);
      if (!extension) {
        throw new Error("Solicitacao de extensao nao encontrada.");
      }
      extension.status = payload.status;
      extension.decisionNote = String(payload.decisionNote || "").trim();
      extension.decidedByUserId = actorUser.id;
      extension.decidedAt = new Date().toISOString();
      extension.leaderAreaName = actorUser.person?.area || extension.leaderAreaName || null;
      return extension;
    },
    async updateDevelopmentPlanProgress(planId, payload, actorUser) {
      const plan = db.developmentPlans.find((item) => item.id === planId);
      if (!plan) {
        throw new Error("PDI nao encontrado.");
      }

      assertCanReportDevelopmentPlanProgress(actorUser, db.people, plan);
      const progress = normalizeDevelopmentPlanProgressPayload(payload);
      const previousStatus = plan.progressStatus || "not_started";
      const occurredAt = new Date().toISOString();
      plan.progressStatus = progress.progressStatus;
      plan.progressNote = progress.progressNote;
      plan.progressUpdatedAt = occurredAt;
      db.developmentPlanProgressEvents = db.developmentPlanProgressEvents || [];
      db.developmentPlanProgressEvents.push({
        id: createId("development_plan_progress"),
        planId: plan.id,
        personId: plan.personId,
        previousStatus,
        progressStatus: progress.progressStatus,
        progressNote: progress.progressNote,
        occurredAt,
        changedByUserId: actorUser.id
      });

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
  normalizeDevelopmentPlanProgressPayload,
  normalizeDevelopmentPlanCompliancePayload,
  toMysqlDateTime,
  supportsProgressHistory
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

      const compliance = normalizeDevelopmentPlanCompliancePayload(payload, actorUser, people);
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
        progressUpdatedAt: null,
        ...compliance
      };

      await pool.query(
        `INSERT INTO development_plans
         (id, person_id, cycle_id, competency_id, focus_title, action_text, due_date,
          expected_evidence, status, created_by_user_id, created_at, archived_at,
          progress_status, progress_note, progress_updated_at,
          is_compliance_required, compliance_required_at, compliance_required_by_user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          toMysqlDateTime(plan.createdAt),
          plan.archivedAt,
          plan.progressStatus,
          plan.progressNote,
          plan.progressUpdatedAt,
          plan.isComplianceRequired,
          toMysqlDateTime(plan.complianceRequiredAt),
          plan.complianceRequiredByUserId
        ]
      );

      if (supportsProgressHistory) {
        await pool.query(
          `INSERT INTO development_plan_progress_events
           (id, plan_id, person_id, previous_status, progress_status, progress_note,
            occurred_at, changed_by_user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            createId("development_plan_progress"),
            plan.id,
            plan.personId,
            null,
            plan.progressStatus,
            plan.progressNote,
            toMysqlDateTime(plan.createdAt),
            actorUser.id
          ]
        );
      }

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
                progress_note AS progressNote, progress_updated_at AS progressUpdatedAt,
                is_compliance_required AS isComplianceRequired,
                compliance_required_at AS complianceRequiredAt,
                compliance_required_by_user_id AS complianceRequiredByUserId
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

      const archivedAt =
        payload.status === "archived" ? toMysqlDateTime(new Date()) : null;
      const compliance = normalizeDevelopmentPlanCompliancePayload(payload, actorUser, people, existingPlan);
      await pool.query(
        `UPDATE development_plans
         SET person_id = ?, cycle_id = ?, competency_id = ?, focus_title = ?, action_text = ?,
             due_date = ?, expected_evidence = ?, status = ?, archived_at = ?,
             is_compliance_required = ?, compliance_required_at = ?, compliance_required_by_user_id = ?
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
          compliance.isComplianceRequired,
          toMysqlDateTime(compliance.complianceRequiredAt),
          compliance.complianceRequiredByUserId,
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
          progressUpdatedAt: existingPlan.progressUpdatedAt || null,
          ...compliance
        },
        people,
        cycles,
        competencies
      );
    },
    async listDevelopmentPlanExtensions(actorUser) {
      const people = await fetchPeopleRows(pool);
      const [rows] = await pool.query(
        `SELECT extension.id, extension.plan_id AS planId,
                extension.requested_due_date AS requestedDueDate, extension.reason,
                extension.status, extension.requested_by_user_id AS requestedByUserId,
                extension.requested_at AS requestedAt, extension.decided_by_user_id AS decidedByUserId,
                extension.decided_at AS decidedAt, extension.leader_area_name AS leaderAreaName,
                extension.decision_note AS decisionNote,
                plan.focus_title AS planTitle, plan.person_id AS personId,
                plan.due_date AS currentDueDate, person.name AS personName
         FROM development_plan_extensions extension
         JOIN development_plans plan ON plan.id = extension.plan_id
         JOIN people person ON person.id = plan.person_id
         ORDER BY extension.requested_at DESC`
      );
      const actorPersonId = actorUser.person?.id || actorUser.personId;
      return rows.filter((extension) =>
        ["admin", "hr"].includes(actorUser?.roleKey || "") ||
        people.some(
          (person) =>
            person.id === extension.personId &&
            person.managerPersonId === actorPersonId
        )
      );
    },
    async requestDevelopmentPlanExtension(planId, payload, actorUser) {
      const [people] = await Promise.all([fetchPeopleRows(pool)]);
      const [[plan]] = await pool.query(
        `SELECT id, person_id AS personId, is_compliance_required AS isComplianceRequired
         FROM development_plans
         WHERE id = ?`,
        [planId]
      );
      if (!plan) {
        throw new Error("PDI nao encontrado.");
      }
      assertCanReportDevelopmentPlanProgress(actorUser, people, plan);
      if (!plan.isComplianceRequired) {
        throw new Error("Extensao formal se aplica apenas a PDI obrigatorio.");
      }
      const extension = {
        id: createId("development_plan_extension"),
        planId,
        requestedDueDate: payload.requestedDueDate,
        reason: String(payload.reason || "").trim(),
        status: "pending",
        requestedByUserId: actorUser.id,
        requestedAt: new Date().toISOString(),
        decidedByUserId: null,
        decidedAt: null,
        leaderAreaName: actorUser.person?.area || null,
        decisionNote: ""
      };
      await pool.query(
        `INSERT INTO development_plan_extensions
         (id, plan_id, requested_due_date, reason, status, requested_by_user_id, requested_at,
          decided_by_user_id, decided_at, leader_area_name, decision_note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          extension.id,
          extension.planId,
          extension.requestedDueDate,
          extension.reason,
          extension.status,
          extension.requestedByUserId,
          toMysqlDateTime(extension.requestedAt),
          extension.decidedByUserId,
          extension.decidedAt,
          extension.leaderAreaName,
          extension.decisionNote
        ]
      );
      return extension;
    },
    async decideDevelopmentPlanExtension(planId, extensionId, payload, actorUser) {
      if (!["approved", "rejected", "cancelled"].includes(payload.status)) {
        throw new Error("Status de decisao de extensao invalido.");
      }
      const people = await fetchPeopleRows(pool);
      const [[plan]] = await pool.query(
        `SELECT id, person_id AS personId, is_compliance_required AS isComplianceRequired,
                compliance_required_at AS complianceRequiredAt,
                compliance_required_by_user_id AS complianceRequiredByUserId
         FROM development_plans
         WHERE id = ?`,
        [planId]
      );
      if (!plan) {
        throw new Error("PDI nao encontrado.");
      }
      normalizeDevelopmentPlanCompliancePayload({ isComplianceRequired: true, personId: plan.personId }, actorUser, people, plan);
      const [[extension]] = await pool.query(
        `SELECT id FROM development_plan_extensions WHERE id = ? AND plan_id = ?`,
        [extensionId, planId]
      );
      if (!extension) {
        throw new Error("Solicitacao de extensao nao encontrada.");
      }
      const decidedAt = new Date().toISOString();
      await pool.query(
        `UPDATE development_plan_extensions
         SET status = ?, decided_by_user_id = ?, decided_at = ?, leader_area_name = ?, decision_note = ?
         WHERE id = ? AND plan_id = ?`,
        [
          payload.status,
          actorUser.id,
          toMysqlDateTime(decidedAt),
          actorUser.person?.area || null,
          String(payload.decisionNote || "").trim(),
          extensionId,
          planId
        ]
      );
      const [[updated]] = await pool.query(
        `SELECT id, plan_id AS planId, requested_due_date AS requestedDueDate, reason, status,
                requested_by_user_id AS requestedByUserId, requested_at AS requestedAt,
                decided_by_user_id AS decidedByUserId, decided_at AS decidedAt,
                leader_area_name AS leaderAreaName, decision_note AS decisionNote
         FROM development_plan_extensions
         WHERE id = ? AND plan_id = ?`,
        [extensionId, planId]
      );
      return updated;
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
                archived_at AS archivedAt, progress_status AS progressStatus
         FROM development_plans
         WHERE id = ?`,
        [planId]
      );

      if (!plan) {
        throw new Error("PDI nao encontrado.");
      }

      assertCanReportDevelopmentPlanProgress(actorUser, people, plan);
      const progress = normalizeDevelopmentPlanProgressPayload(payload);
      const progressUpdatedAt = toMysqlDateTime(new Date());

      await pool.query(
        `UPDATE development_plans
         SET progress_status = ?, progress_note = ?, progress_updated_at = ?
         WHERE id = ?`,
        [progress.progressStatus, progress.progressNote, progressUpdatedAt, planId]
      );

      if (supportsProgressHistory) {
        await pool.query(
          `INSERT INTO development_plan_progress_events
           (id, plan_id, person_id, previous_status, progress_status, progress_note,
            occurred_at, changed_by_user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            createId("development_plan_progress"),
            plan.id,
            plan.personId,
            plan.progressStatus || "not_started",
            progress.progressStatus,
            progress.progressNote,
            progressUpdatedAt,
            actorUser.id
          ]
        );
      }

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
