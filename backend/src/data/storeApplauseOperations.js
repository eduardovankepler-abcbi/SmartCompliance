import { toMysqlDateTime } from "./mysqlDateTime.js";

function isApplauseAdministrator(actorUser) {
  return ["admin", "hr"].includes(actorUser?.roleKey);
}

function assertApplauseLifecycleTransition(currentStatus, nextStatus, actorUser, statusReason) {
  const changed = currentStatus !== nextStatus;
  const reason = typeof statusReason === "string" ? statusReason.trim() : "";

  if (currentStatus === "Arquivado") {
    if (!changed) {
      throw new Error("Aplause arquivado nao pode ser alterado sem restauracao administrativa.");
    }
    if (nextStatus !== "Validado" || !isApplauseAdministrator(actorUser)) {
      throw new Error("Aplause arquivado so pode ser restaurado para Validado por administrador ou RH.");
    }
    if (!reason) {
      throw new Error("Informe a justificativa para restaurar o Aplause.");
    }
    return;
  }

  if (currentStatus === "Em revisao" && !isApplauseAdministrator(actorUser)) {
    throw new Error("Aplause em revisao so pode ser tratado por administrador ou RH.");
  }

  if (nextStatus === "Em revisao" && !isApplauseAdministrator(actorUser)) {
    throw new Error("Somente administrador ou RH pode encaminhar Aplause para revisao.");
  }

  if (changed && nextStatus === "Arquivado" && !reason) {
    throw new Error("Informe a justificativa para arquivar o Aplause.");
  }
}

function buildAuditDetail(buildApplauseAuditDetail, applause, sender, receiver, statusReason) {
  const baseDetail = buildApplauseAuditDetail({
    category: applause.category,
    senderName: sender?.name,
    receiverName: receiver?.name
  });
  const reason = typeof statusReason === "string" ? statusReason.trim() : "";
  return reason ? `${baseDetail} · Justificativa: ${reason}` : baseDetail;
}

export function createMemoryApplauseStore({
  db,
  createId,
  isOrgWideUser,
  isManagerUser,
  getTeamPeople,
  assertCanCreateApplause,
  pushAuditLog,
  AUDIT_CATEGORIES,
  buildApplauseAuditDetail,
  assertCanManageApplauseEntry,
  assertValidApplauseStatus
}) {
  return {
    async getApplauseRecipients(actorUser) {
      return db.people
        .filter((person) => person.id !== actorUser.person.id)
        .map((person) => ({
          id: person.id,
          name: person.name,
          roleTitle: person.roleTitle || "",
          area: person.area || "",
          workUnit: person.workUnit || null,
          workMode: person.workMode || null,
          managerPersonId: person.managerPersonId || null,
          managerName: person.managerName || null,
          areaManagerPersonId: person.areaManagerPersonId || null,
          areaManagerName: person.areaManagerName || null,
          employmentType: person.employmentType || "internal"
        }));
    },
    async getApplauseEntries(actorUser) {
      const entries = db.applauseEntries.map((item) => {
        const sender = db.people.find((person) => person.id === item.senderPersonId);
        const receiver = db.people.find((person) => person.id === item.receiverPersonId);
        return {
          ...item,
          senderName: sender?.name || "",
          receiverName: receiver?.name || ""
        };
      });

      if (isOrgWideUser(actorUser)) {
        return entries;
      }

      if (isManagerUser(actorUser)) {
        const visiblePersonIds = new Set([
          actorUser.person.id,
          ...getTeamPeople(db.people, actorUser.person.id).map((item) => item.id)
        ]);
        return entries.filter(
          (item) =>
            visiblePersonIds.has(item.senderPersonId) ||
            visiblePersonIds.has(item.receiverPersonId)
        );
      }

      return entries.filter(
        (item) =>
          item.senderPersonId === actorUser.person.id ||
          item.receiverPersonId === actorUser.person.id
      );
    },
    async createApplauseEntry(payload) {
      assertCanCreateApplause(db.applauseEntries, payload);

      const applause = {
        id: createId("applause"),
        createdAt: new Date().toISOString(),
        status: "Validado",
        ...payload
      };
      db.applauseEntries.unshift(applause);
      const sender = db.people.find((person) => person.id === applause.senderPersonId);
      const receiver = db.people.find((person) => person.id === applause.receiverPersonId);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.applause,
        action: "created",
        entityType: "applause_entry",
        entityId: applause.id,
        entityLabel: applause.category,
        actorUser: db.users.find((user) => user.personId === applause.senderPersonId) || null,
        summary: `Aplause registrado para ${receiver?.name || "colaborador"}`,
        detail: buildApplauseAuditDetail({
          category: applause.category,
          senderName: sender?.name,
          receiverName: receiver?.name
        })
      });
      return {
        ...applause,
        senderName: sender?.name || "",
        receiverName: receiver?.name || ""
      };
    },
    async updateApplauseEntry(applauseId, payload, actorUser) {
      const applause = db.applauseEntries.find((item) => item.id === applauseId);
      if (!applause) {
        throw new Error("Registro de Aplause nao encontrado.");
      }

      assertCanManageApplauseEntry(actorUser, db.people, applause, {
        isOrgWideUser,
        getTeamPeople
      });
      assertValidApplauseStatus(payload.status);
      const previousStatus = applause.status;
      assertApplauseLifecycleTransition(previousStatus, payload.status, actorUser, payload.statusReason);

      applause.receiverPersonId = payload.receiverPersonId;
      applause.category = payload.category;
      applause.impact = payload.impact;
      applause.contextNote = payload.contextNote;
      applause.status = payload.status;

      const sender = db.people.find((person) => person.id === applause.senderPersonId);
      const receiver = db.people.find((person) => person.id === applause.receiverPersonId);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.applause,
        action: payload.status === "Arquivado" ? "archived" : previousStatus === "Arquivado" ? "restored" : "updated",
        entityType: "applause_entry",
        entityId: applause.id,
        entityLabel: applause.category,
        actorUser,
        summary:
          payload.status === "Arquivado"
            ? `Aplause arquivado para ${receiver?.name || "colaborador"}`
            : previousStatus === "Arquivado"
              ? `Aplause restaurado para ${receiver?.name || "colaborador"}`
            : `Aplause atualizado para ${receiver?.name || "colaborador"}`,
        detail: buildAuditDetail(buildApplauseAuditDetail, applause, sender, receiver, payload.statusReason)
      });

      return {
        ...applause,
        senderName: sender?.name || "",
        receiverName: receiver?.name || ""
      };
    }
  };
}

export function createMysqlApplauseStore({
  pool,
  createId,
  isFullAccessUser,
  isManagerUser,
  fetchPeopleRows,
  getTeamPeople,
  assertCanCreateApplause,
  insertAuditLog,
  AUDIT_CATEGORIES,
  buildApplauseAuditDetail,
  assertCanManageApplauseEntry,
  isOrgWideUser,
  assertValidApplauseStatus
}) {
  return {
    async getApplauseRecipients(actorUser) {
      const people = await fetchPeopleRows(pool);
      return people
        .filter((person) => person.id !== actorUser.person.id)
        .map((person) => ({
          id: person.id,
          name: person.name,
          roleTitle: person.roleTitle || "",
          area: person.area || "",
          workUnit: person.workUnit || null,
          workMode: person.workMode || null,
          managerPersonId: person.managerPersonId || null,
          managerName: person.managerName || null,
          areaManagerPersonId: person.areaManagerPersonId || null,
          areaManagerName: person.areaManagerName || null,
          employmentType: person.employmentType || "internal"
        }));
    },
    async getApplauseEntries(actorUser) {
      const [rows] = await pool.query(
        `SELECT a.id, a.sender_person_id AS senderPersonId, a.receiver_person_id AS receiverPersonId,
                a.category, a.impact, a.context_note AS contextNote, a.created_at AS createdAt,
                a.status, sender.name AS senderName, receiver.name AS receiverName
         FROM applause_entries a
         JOIN people sender ON sender.id = a.sender_person_id
         JOIN people receiver ON receiver.id = a.receiver_person_id
         ORDER BY a.created_at DESC`
      );

      if (isFullAccessUser(actorUser)) {
        return rows;
      }

      if (isManagerUser(actorUser)) {
        const people = await fetchPeopleRows(pool);
        const visiblePersonIds = new Set([
          actorUser.person.id,
          ...getTeamPeople(people, actorUser.person.id).map((item) => item.id)
        ]);
        return rows.filter(
          (item) =>
            visiblePersonIds.has(item.senderPersonId) ||
            visiblePersonIds.has(item.receiverPersonId)
        );
      }

      return rows.filter(
        (item) =>
          item.senderPersonId === actorUser.person.id ||
          item.receiverPersonId === actorUser.person.id
      );
    },
    async createApplauseEntry(payload) {
      const [rows] = await pool.query(
        `SELECT sender_person_id AS senderPersonId, receiver_person_id AS receiverPersonId, created_at AS createdAt
         FROM applause_entries`
      );
      assertCanCreateApplause(rows, payload);

      const applause = {
        id: createId("applause"),
        createdAt: new Date().toISOString(),
        status: "Validado",
        ...payload
      };
      await pool.query(
        `INSERT INTO applause_entries
         (id, sender_person_id, receiver_person_id, category, impact, context_note, created_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          applause.id,
          applause.senderPersonId,
          applause.receiverPersonId,
          applause.category,
          applause.impact,
          applause.contextNote,
          toMysqlDateTime(applause.createdAt),
          applause.status
        ]
      );
      const [people] = await pool.query(`SELECT id, name FROM people WHERE id IN (?, ?)`, [
        applause.senderPersonId,
        applause.receiverPersonId
      ]);
      const sender = people.find((person) => person.id === applause.senderPersonId);
      const receiver = people.find((person) => person.id === applause.receiverPersonId);
      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.applause,
        action: "created",
        entityType: "applause_entry",
        entityId: applause.id,
        entityLabel: applause.category,
        actorUser: {
          id: null,
          email: null,
          roleKey: "employee",
          person: sender ? { id: sender.id, name: sender.name } : null
        },
        summary: `Aplause registrado para ${receiver?.name || "colaborador"}`,
        detail: buildApplauseAuditDetail({
          category: applause.category,
          senderName: sender?.name,
          receiverName: receiver?.name
        })
      });
      return {
        ...applause,
        senderName: sender?.name || "",
        receiverName: receiver?.name || ""
      };
    },
    async updateApplauseEntry(applauseId, payload, actorUser) {
      const [people, rows] = await Promise.all([
        fetchPeopleRows(pool),
        pool
          .query(
            `SELECT id, sender_person_id AS senderPersonId, receiver_person_id AS receiverPersonId,
                    category, impact, context_note AS contextNote, created_at AS createdAt, status
             FROM applause_entries
             WHERE id = ?
             LIMIT 1`,
            [applauseId]
          )
          .then(([result]) => result)
      ]);

      const applause = rows[0];
      if (!applause) {
        throw new Error("Registro de Aplause nao encontrado.");
      }

      assertCanManageApplauseEntry(actorUser, people, applause, {
        isOrgWideUser,
        getTeamPeople
      });
      assertValidApplauseStatus(payload.status);
      assertApplauseLifecycleTransition(applause.status, payload.status, actorUser, payload.statusReason);

      await pool.query(
        `UPDATE applause_entries
         SET receiver_person_id = ?, category = ?, impact = ?, context_note = ?, status = ?
         WHERE id = ?`,
        [
          payload.receiverPersonId,
          payload.category,
          payload.impact,
          payload.contextNote,
          payload.status,
          applauseId
        ]
      );

      const sender = people.find((person) => person.id === applause.senderPersonId);
      const receiver = people.find((person) => person.id === payload.receiverPersonId);
      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.applause,
        action: payload.status === "Arquivado" ? "archived" : applause.status === "Arquivado" ? "restored" : "updated",
        entityType: "applause_entry",
        entityId: applauseId,
        entityLabel: payload.category,
        actorUser,
        summary:
          payload.status === "Arquivado"
            ? `Aplause arquivado para ${receiver?.name || "colaborador"}`
            : applause.status === "Arquivado"
              ? `Aplause restaurado para ${receiver?.name || "colaborador"}`
            : `Aplause atualizado para ${receiver?.name || "colaborador"}`,
        detail: buildAuditDetail(
          buildApplauseAuditDetail,
          { ...applause, category: payload.category },
          sender,
          receiver,
          payload.statusReason
        )
      });

      return {
        ...applause,
        receiverPersonId: payload.receiverPersonId,
        category: payload.category,
        impact: payload.impact,
        contextNote: payload.contextNote,
        status: payload.status,
        id: applauseId,
        senderPersonId: applause.senderPersonId,
        createdAt: applause.createdAt,
        senderName: sender?.name || "",
        receiverName: receiver?.name || ""
      };
    }
  };
}
