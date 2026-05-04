export function createMemoryLearningIntegrationStore({
  db,
  isOrgWideUser,
  buildLearningIntegrationEventRows,
  presentLearningIntegrationEvent,
  pushAuditLog,
  AUDIT_CATEGORIES,
  buildLearningIntegrationApplicationPayload
}) {
  return {
    async getLearningIntegrationEvents(actorUser) {
      if (!isOrgWideUser(actorUser)) {
        throw new Error("Perfil sem permissao para visualizar integracoes de aprendizagem.");
      }

      return db.learningIntegrationEvents.map((event) =>
        presentLearningIntegrationEvent(event, db.people)
      );
    },
    async ingestLearningIntegrationEvents(payload, actorUser) {
      if (!isOrgWideUser(actorUser)) {
        throw new Error("Perfil sem permissao para receber integracoes de aprendizagem.");
      }

      const rows = buildLearningIntegrationEventRows(payload, db.people, db.users, actorUser);
      const existingKeys = new Set(
        db.learningIntegrationEvents.map((item) => `${item.sourceSystem}:${item.externalId}`)
      );
      const accepted = rows.filter(
        (row) => !existingKeys.has(`${row.sourceSystem}:${row.externalId}`)
      );

      db.learningIntegrationEvents.unshift(...accepted);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.development,
        action: "imported",
        entityType: "learning_integration_event",
        entityId: accepted[0]?.id || rows[0]?.id || "learning_integration",
        entityLabel: payload.sourceSystem || "Integracao de aprendizagem",
        actorUser,
        summary: `${accepted.length} eventos de aprendizagem recebidos de ${payload.sourceSystem || "sistema externo"}`,
        detail: `${accepted.filter((item) => item.processingStatus === "ready_for_review").length} prontos para revisao · ${accepted.filter((item) => item.processingStatus === "needs_review").length} exigem conciliacao`
      });

      return {
        sourceSystem: payload.sourceSystem,
        received: rows.length,
        accepted: accepted.length,
        duplicates: rows.length - accepted.length,
        events: accepted.map((event) => presentLearningIntegrationEvent(event, db.people))
      };
    },
    async applyLearningIntegrationEvent(eventId, payload, actorUser) {
      if (!isOrgWideUser(actorUser)) {
        throw new Error("Perfil sem permissao para aplicar integracoes de aprendizagem.");
      }

      const event = db.learningIntegrationEvents.find((item) => item.id === eventId);
      if (!event) {
        throw new Error("Evento de aprendizagem nao encontrado.");
      }

      const application = buildLearningIntegrationApplicationPayload(
        event,
        payload,
        db.competencies
      );
      const appliedEntity =
        application.entityType === "development_record"
          ? await this.createDevelopmentRecord(application.payload, actorUser)
          : await this.createDevelopmentPlan(application.payload, actorUser);

      event.processingStatus = "applied";
      event.appliedEntityType = application.entityType;
      event.appliedEntityId = appliedEntity.id;
      event.appliedAt = new Date().toISOString();
      event.reviewNote = String(payload?.reviewNote || "").trim();

      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.development,
        action: "applied",
        entityType: "learning_integration_event",
        entityId: event.id,
        entityLabel: event.title,
        actorUser,
        summary: `Evento de aprendizagem aplicado em ${application.entityType === "development_record" ? "desenvolvimento" : "PDI"}`,
        detail: `${event.sourceSystem} · ${event.externalId} · ${appliedEntity.id}`
      });

      return {
        event: presentLearningIntegrationEvent(event, db.people),
        appliedEntity
      };
    }
  };
}

export function createMysqlLearningIntegrationStore({
  pool,
  isOrgWideUser,
  supportsLearningIntegrations,
  fetchLearningIntegrationEventRows,
  fetchPeopleRows,
  fetchUserRows,
  fetchCompetencyRows,
  presentLearningIntegrationEvent,
  buildLearningIntegrationEventRows,
  insertAuditLog,
  AUDIT_CATEGORIES,
  buildLearningIntegrationApplicationPayload
}) {
  return {
    async getLearningIntegrationEvents(actorUser) {
      if (!isOrgWideUser(actorUser)) {
        throw new Error("Perfil sem permissao para visualizar integracoes de aprendizagem.");
      }

      if (!supportsLearningIntegrations) {
        return [];
      }

      const [rows, people] = await Promise.all([
        fetchLearningIntegrationEventRows(pool),
        fetchPeopleRows(pool)
      ]);

      return rows.map((event) => presentLearningIntegrationEvent(event, people));
    },
    async ingestLearningIntegrationEvents(payload, actorUser) {
      if (!isOrgWideUser(actorUser)) {
        throw new Error("Perfil sem permissao para receber integracoes de aprendizagem.");
      }

      if (!supportsLearningIntegrations) {
        throw new Error("Fila de integracao de aprendizagem indisponivel no banco atual.");
      }

      const [people, users] = await Promise.all([fetchPeopleRows(pool), fetchUserRows(pool)]);
      const rows = buildLearningIntegrationEventRows(payload, people, users, actorUser);
      const accepted = [];

      for (const row of rows) {
        const [result] = await pool.query(
          `INSERT IGNORE INTO learning_integration_events
           (id, source_system, external_id, person_email, person_document, person_id, event_type,
            title, provider_name, status, occurred_at, workload_hours, competency_key, suggested_action,
            processing_status, raw_payload_json, created_at, created_by_user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            row.id,
            row.sourceSystem,
            row.externalId,
            row.personEmail,
            row.personDocument || null,
            row.personId,
            row.eventType,
            row.title,
            row.providerName,
            row.status,
            row.occurredAt || null,
            row.workloadHours,
            row.competencyKey || null,
            row.suggestedAction,
            row.processingStatus,
            JSON.stringify(row.rawPayload || {}),
            row.createdAt,
            row.createdByUserId
          ]
        );

        if (result.affectedRows) {
          accepted.push(row);
        }
      }

      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.development,
        action: "imported",
        entityType: "learning_integration_event",
        entityId: accepted[0]?.id || rows[0]?.id || "learning_integration",
        entityLabel: payload.sourceSystem || "Integracao de aprendizagem",
        actorUser,
        summary: `${accepted.length} eventos de aprendizagem recebidos de ${payload.sourceSystem || "sistema externo"}`,
        detail: `${accepted.filter((item) => item.processingStatus === "ready_for_review").length} prontos para revisao · ${accepted.filter((item) => item.processingStatus === "needs_review").length} exigem conciliacao`
      });

      return {
        sourceSystem: payload.sourceSystem,
        received: rows.length,
        accepted: accepted.length,
        duplicates: rows.length - accepted.length,
        events: accepted.map((event) => presentLearningIntegrationEvent(event, people))
      };
    },
    async applyLearningIntegrationEvent(eventId, payload, actorUser) {
      if (!isOrgWideUser(actorUser)) {
        throw new Error("Perfil sem permissao para aplicar integracoes de aprendizagem.");
      }

      if (!supportsLearningIntegrations) {
        throw new Error("Fila de integracao de aprendizagem indisponivel no banco atual.");
      }

      const [events, people, competencies] = await Promise.all([
        fetchLearningIntegrationEventRows(pool),
        fetchPeopleRows(pool),
        fetchCompetencyRows(pool)
      ]);
      const event = events.find((item) => item.id === eventId);
      if (!event) {
        throw new Error("Evento de aprendizagem nao encontrado.");
      }

      const application = buildLearningIntegrationApplicationPayload(
        event,
        payload,
        competencies
      );
      const appliedEntity =
        application.entityType === "development_record"
          ? await this.createDevelopmentRecord(application.payload, actorUser)
          : await this.createDevelopmentPlan(application.payload, actorUser);
      const appliedAt = new Date().toISOString();
      const reviewNote = String(payload?.reviewNote || "").trim();

      await pool.query(
        `UPDATE learning_integration_events
         SET processing_status = ?, applied_entity_type = ?, applied_entity_id = ?,
             applied_at = ?, review_note = ?
         WHERE id = ?`,
        [
          "applied",
          application.entityType,
          appliedEntity.id,
          appliedAt,
          reviewNote || null,
          eventId
        ]
      );

      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.development,
        action: "applied",
        entityType: "learning_integration_event",
        entityId: event.id,
        entityLabel: event.title,
        actorUser,
        summary: `Evento de aprendizagem aplicado em ${application.entityType === "development_record" ? "desenvolvimento" : "PDI"}`,
        detail: `${event.sourceSystem} · ${event.externalId} · ${appliedEntity.id}`
      });

      return {
        event: presentLearningIntegrationEvent(
          {
            ...event,
            processingStatus: "applied",
            appliedEntityType: application.entityType,
            appliedEntityId: appliedEntity.id,
            appliedAt,
            reviewNote
          },
          people
        ),
        appliedEntity
      };
    }
  };
}
