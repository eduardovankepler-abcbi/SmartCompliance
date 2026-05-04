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

      applause.receiverPersonId = payload.receiverPersonId;
      applause.category = payload.category;
      applause.impact = payload.impact;
      applause.contextNote = payload.contextNote;
      applause.status = payload.status;

      const sender = db.people.find((person) => person.id === applause.senderPersonId);
      const receiver = db.people.find((person) => person.id === applause.receiverPersonId);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.applause,
        action: payload.status === "Arquivado" ? "archived" : "updated",
        entityType: "applause_entry",
        entityId: applause.id,
        entityLabel: applause.category,
        actorUser,
        summary:
          payload.status === "Arquivado"
            ? `Aplause arquivado para ${receiver?.name || "colaborador"}`
            : `Aplause atualizado para ${receiver?.name || "colaborador"}`,
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
          applause.createdAt,
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
        action: payload.status === "Arquivado" ? "archived" : "updated",
        entityType: "applause_entry",
        entityId: applauseId,
        entityLabel: payload.category,
        actorUser,
        summary:
          payload.status === "Arquivado"
            ? `Aplause arquivado para ${receiver?.name || "colaborador"}`
            : `Aplause atualizado para ${receiver?.name || "colaborador"}`,
        detail: buildApplauseAuditDetail({
          category: payload.category,
          senderName: sender?.name,
          receiverName: receiver?.name
        })
      });

      return {
        ...applause,
        ...payload,
        id: applauseId,
        senderPersonId: applause.senderPersonId,
        createdAt: applause.createdAt,
        senderName: sender?.name || "",
        receiverName: receiver?.name || ""
      };
    }
  };
}
