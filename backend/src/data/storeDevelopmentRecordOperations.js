export function createMemoryDevelopmentRecordStore({
  db,
  createId,
  isOrgWideUser,
  isManagerUser,
  getTeamPeople,
  assertCanManageDevelopmentSubject,
  pushAuditLog,
  AUDIT_CATEGORIES,
  buildDevelopmentRecordAuditDetail,
  assertValidDevelopmentRecordStatus
}) {
  return {
    async getDevelopmentRecords(actorUser) {
      const actorPersonId = actorUser.person?.id || actorUser.personId;
      const records = db.developmentRecords.map((item) => {
        const person = db.people.find((person) => person.id === item.personId);
        return {
          ...item,
          status: item.status || "active",
          archivedAt: item.archivedAt || null,
          personName: person?.name || ""
        };
      });

      if (isOrgWideUser(actorUser)) {
        return records;
      }

      if (isManagerUser(actorUser)) {
        const visiblePersonIds = new Set([
          actorPersonId,
          ...getTeamPeople(db.people, actorPersonId).map((item) => item.id)
        ]);
        return records.filter((item) => visiblePersonIds.has(item.personId));
      }

      return records.filter((item) => item.personId === actorPersonId);
    },
    async createDevelopmentRecord(payload, actorUser) {
      assertCanManageDevelopmentSubject(actorUser, db.people, payload.personId, {
        isOrgWideUser,
        isManagerUser,
        getTeamPeople
      });

      const record = {
        id: createId("development"),
        ...payload,
        status: "active",
        archivedAt: null
      };
      db.developmentRecords.unshift(record);
      const person = db.people.find((item) => item.id === record.personId);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.development,
        action: "created",
        entityType: "development_record",
        entityId: record.id,
        entityLabel: record.title,
        actorUser,
        summary: `Registro de desenvolvimento criado para ${person?.name || "pessoa"}`,
        detail: buildDevelopmentRecordAuditDetail(record)
      });
      return record;
    },
    async updateDevelopmentRecord(recordId, payload, actorUser) {
      const record = db.developmentRecords.find((item) => item.id === recordId);
      if (!record) {
        throw new Error("Registro de desenvolvimento nao encontrado.");
      }

      assertCanManageDevelopmentSubject(actorUser, db.people, payload.personId, {
        isOrgWideUser,
        isManagerUser,
        getTeamPeople
      });
      assertValidDevelopmentRecordStatus(payload.status);

      record.personId = payload.personId;
      record.recordType = payload.recordType;
      record.title = payload.title;
      record.providerName = payload.providerName;
      record.completedAt = payload.completedAt;
      record.skillSignal = payload.skillSignal;
      record.notes = payload.notes;
      record.status = payload.status;
      record.archivedAt = payload.status === "archived" ? new Date().toISOString() : null;

      const person = db.people.find((item) => item.id === record.personId);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.development,
        action: payload.status === "archived" ? "archived" : "updated",
        entityType: "development_record",
        entityId: record.id,
        entityLabel: record.title,
        actorUser,
        summary:
          payload.status === "archived"
            ? `Registro de desenvolvimento arquivado para ${person?.name || "pessoa"}`
            : `Registro de desenvolvimento atualizado para ${person?.name || "pessoa"}`,
        detail: buildDevelopmentRecordAuditDetail(record)
      });

      return {
        ...record,
        personName: person?.name || ""
      };
    }
  };
}

export function createMysqlDevelopmentRecordStore({
  pool,
  createId,
  isFullAccessUser,
  isManagerUser,
  fetchPeopleRows,
  getTeamPeople,
  assertCanManageDevelopmentSubject,
  isOrgWideUser,
  insertAuditLog,
  AUDIT_CATEGORIES,
  buildDevelopmentRecordAuditDetail,
  assertValidDevelopmentRecordStatus,
  toMysqlDateTime
}) {
  return {
    async getDevelopmentRecords(actorUser) {
      const actorPersonId = actorUser.person?.id || actorUser.personId;
      const [rows] = await pool.query(
        `SELECT d.id, d.person_id AS personId, p.name AS personName, d.record_type AS recordType,
                d.title, d.provider_name AS providerName, d.completed_at AS completedAt,
                d.skill_signal AS skillSignal, d.notes, d.status, d.archived_at AS archivedAt
         FROM development_records d
         JOIN people p ON p.id = d.person_id
         ORDER BY d.completed_at DESC`
      );

      if (isFullAccessUser(actorUser)) {
        return rows;
      }

      if (isManagerUser(actorUser)) {
        const people = await fetchPeopleRows(pool);
        const visiblePersonIds = new Set([
          actorPersonId,
          ...getTeamPeople(people, actorPersonId).map((item) => item.id)
        ]);
        return rows.filter((item) => visiblePersonIds.has(item.personId));
      }

      return rows.filter((item) => item.personId === actorPersonId);
    },
    async createDevelopmentRecord(payload, actorUser) {
      const people = await fetchPeopleRows(pool);
      assertCanManageDevelopmentSubject(actorUser, people, payload.personId, {
        isOrgWideUser,
        isManagerUser,
        getTeamPeople
      });

      const record = {
        id: createId("development"),
        ...payload,
        status: "active",
        archivedAt: null
      };
      await pool.query(
        `INSERT INTO development_records
         (id, person_id, record_type, title, provider_name, completed_at, skill_signal, notes, status, archived_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.personId,
          record.recordType,
          record.title,
          record.providerName,
          record.completedAt,
          record.skillSignal,
          record.notes,
          record.status,
          record.archivedAt
        ]
      );
      const person = people.find((item) => item.id === record.personId);
      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.development,
        action: "created",
        entityType: "development_record",
        entityId: record.id,
        entityLabel: record.title,
        actorUser,
        summary: `Registro de desenvolvimento criado para ${person?.name || "pessoa"}`,
        detail: buildDevelopmentRecordAuditDetail(record)
      });
      return record;
    },
    async updateDevelopmentRecord(recordId, payload, actorUser) {
      const people = await fetchPeopleRows(pool);
      const [[existingRecord]] = await pool.query(
        `SELECT id, person_id AS personId
         FROM development_records
         WHERE id = ?`,
        [recordId]
      );

      if (!existingRecord) {
        throw new Error("Registro de desenvolvimento nao encontrado.");
      }

      assertCanManageDevelopmentSubject(
        actorUser,
        people,
        payload.personId || existingRecord.personId,
        {
          isOrgWideUser,
          isManagerUser,
          getTeamPeople
        }
      );
      assertValidDevelopmentRecordStatus(payload.status);

      const archivedAt =
        payload.status === "archived" ? toMysqlDateTime(new Date()) : null;
      await pool.query(
        `UPDATE development_records
         SET person_id = ?, record_type = ?, title = ?, provider_name = ?, completed_at = ?,
             skill_signal = ?, notes = ?, status = ?, archived_at = ?
         WHERE id = ?`,
        [
          payload.personId,
          payload.recordType,
          payload.title,
          payload.providerName,
          payload.completedAt,
          payload.skillSignal,
          payload.notes,
          payload.status,
          archivedAt,
          recordId
        ]
      );

      const person = people.find((item) => item.id === payload.personId);
      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.development,
        action: payload.status === "archived" ? "archived" : "updated",
        entityType: "development_record",
        entityId: recordId,
        entityLabel: payload.title,
        actorUser,
        summary:
          payload.status === "archived"
            ? `Registro de desenvolvimento arquivado para ${person?.name || "pessoa"}`
            : `Registro de desenvolvimento atualizado para ${person?.name || "pessoa"}`,
        detail: buildDevelopmentRecordAuditDetail(payload)
      });

      return {
        id: recordId,
        ...payload,
        archivedAt,
        personName: person?.name || ""
      };
    }
  };
}
