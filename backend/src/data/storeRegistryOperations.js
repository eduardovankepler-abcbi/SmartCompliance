function normalizeScopeText(value) {
  return String(value || "").trim().toLowerCase();
}

function isManagerScopedActor(actorUser) {
  return actorUser?.roleKey === "manager" && Boolean(actorUser?.person?.id);
}

function canManageRegistryPeople(actorUser, canManagePeople) {
  return canManagePeople(actorUser) || isManagerScopedActor(actorUser);
}

function canManageRegistryUsers(actorUser, canManageUsers) {
  return canManageUsers(actorUser) || isManagerScopedActor(actorUser);
}

function isAreaManagerPayload(value) {
  return String(value || "").trim().toLowerCase() === "yes";
}

function isDirectReportOfActor(person, actorUser) {
  return (
    isManagerScopedActor(actorUser) &&
    String(person?.managerPersonId || "") === String(actorUser.person.id)
  );
}

function assertManagerPersonScope(payload, actorUser) {
  if (!isManagerScopedActor(actorUser)) {
    return;
  }

  if (normalizeScopeText(payload.area) !== normalizeScopeText(actorUser.person.area)) {
    throw new Error("Gestor so pode cadastrar pessoas na propria area.");
  }

  if (String(payload.managerPersonId || "") !== String(actorUser.person.id)) {
    throw new Error("Gestor so pode cadastrar pessoas subordinadas diretamente a ele.");
  }

  if (isAreaManagerPayload(payload.isAreaManager)) {
    throw new Error("Gestor nao pode alterar a lideranca formal da area.");
  }
}

function assertManagerExistingPersonScope(person, actorUser) {
  if (!isManagerScopedActor(actorUser)) {
    return;
  }

  if (!isDirectReportOfActor(person, actorUser)) {
    throw new Error("Gestor so pode alterar pessoas subordinadas diretamente a ele.");
  }
}

function assertManagerUserScope(person, userData, actorUser) {
  if (!isManagerScopedActor(actorUser)) {
    return;
  }

  if (!isDirectReportOfActor(person, actorUser)) {
    throw new Error("Gestor so pode criar ou alterar usuarios subordinados diretamente a ele.");
  }

  if (userData.roleKey !== "employee") {
    throw new Error("Gestor so pode conceder perfil de colaborador aos subordinados.");
  }
}

export function createMemoryRegistryStore({
  db,
  createId,
  canManagePeople,
  canManageUsers,
  assertValidAreaManagerReference,
  prepareAreaMutation,
  enrichArea,
  pushAuditLog,
  AUDIT_CATEGORIES,
  buildAreaAuditDetail,
  preparePersonMutation,
  assertNoDuplicatePersonProfile,
  assertNoManagerCycle,
  assertValidAreaReference,
  assertValidManagerReference,
  assignAreaLeadershipSnapshot,
  buildPersonAuditDetail,
  enrichPerson,
  filterPeopleForUser,
  assertUserPersonExists,
  assertPersonHasNoLinkedUser,
  prepareUserWrite,
  hashPassword,
  buildUserAuditDetail,
  toAdminUserRow
}) {
  return {
    async createArea(payload, actorUser) {
      if (!canManagePeople(actorUser)) {
        throw new Error("Perfil sem permissao para cadastrar areas.");
      }

      const areaMutation = prepareAreaMutation({
        areas: db.areas,
        payload,
        people: db.people,
        assertValidAreaManagerReference
      });

      const area = {
        id: createId("area"),
        name: areaMutation.normalizedName,
        managerPersonId: areaMutation.managerPersonId || null
      };
      db.areas.unshift(area);
      const managerName =
        db.people.find((person) => person.id === area.managerPersonId)?.name || "";
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.registry,
        action: "created",
        entityType: "area",
        entityId: area.id,
        entityLabel: area.name,
        actorUser,
        summary: `Area criada: ${area.name}`,
        detail: buildAreaAuditDetail({
          name: area.name,
          managerName
        })
      });
      return enrichArea(db.people, area);
    },

    async updateArea(areaId, payload, actorUser) {
      if (!canManagePeople(actorUser)) {
        throw new Error("Perfil sem permissao para atualizar areas.");
      }

      const area = db.areas.find((item) => item.id === areaId);
      if (!area) {
        throw new Error("Area nao encontrada.");
      }

      const areaMutation = prepareAreaMutation({
        areaId,
        areas: db.areas,
        payload,
        people: db.people,
        assertValidAreaManagerReference
      });

      const previousName = area.name;
      area.name = areaMutation.normalizedName;
      if (areaMutation.managerPersonId !== undefined) {
        area.managerPersonId = areaMutation.managerPersonId;
      }

      if (previousName !== area.name) {
        db.people.forEach((person) => {
          if (person.area === previousName) {
            person.area = area.name;
          }
        });
      }

      const managerName =
        db.people.find((person) => person.id === area.managerPersonId)?.name || "";
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.registry,
        action: "updated",
        entityType: "area",
        entityId: area.id,
        entityLabel: area.name,
        actorUser,
        summary: `Area atualizada: ${area.name}`,
        detail: buildAreaAuditDetail({
          name: area.name,
          managerName
        })
      });

      return enrichArea(db.people, area);
    },

    async getPeople(actorUser) {
      return filterPeopleForUser(db.people, actorUser, db.areas);
    },

    async createPerson(payload, actorUser) {
      if (!canManageRegistryPeople(actorUser, canManagePeople)) {
        throw new Error("Perfil sem permissao para cadastrar pessoas.");
      }
      assertManagerPersonScope(payload, actorUser);

      const { personPayload, shouldLeadArea } = preparePersonMutation({
        areas: db.areas,
        payload,
        people: db.people,
        assertNoDuplicatePersonProfile,
        assertNoManagerCycle,
        assertValidAreaReference,
        assertValidManagerReference
      });

      const person = {
        id: createId("person"),
        ...personPayload,
        satisfactionScore: null
      };
      db.people.unshift(person);
      db.areas = assignAreaLeadershipSnapshot(
        db.areas,
        person.id,
        person.area,
        shouldLeadArea
      );
      const managerName =
        db.people.find((item) => item.id === person.managerPersonId)?.name || "";
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.registry,
        action: "created",
        entityType: "person",
        entityId: person.id,
        entityLabel: person.name,
        actorUser,
        summary: `Pessoa criada: ${person.name}`,
        detail: buildPersonAuditDetail({
          roleTitle: person.roleTitle,
          area: person.area,
          workUnit: person.workUnit,
          workMode: person.workMode,
          managerName,
          employmentType: person.employmentType,
          isAreaManager: shouldLeadArea
        })
      });
      return enrichPerson(db.people, person, db.areas.map((area) => enrichArea(db.people, area)));
    },

    async updatePerson(personId, payload, actorUser) {
      if (!canManageRegistryPeople(actorUser, canManagePeople)) {
        throw new Error("Perfil sem permissao para atualizar pessoas.");
      }

      const person = db.people.find((item) => item.id === personId);
      if (!person) {
        throw new Error("Pessoa nao encontrada.");
      }
      assertManagerExistingPersonScope(person, actorUser);
      assertManagerPersonScope(payload, actorUser);

      const { personPayload, shouldLeadArea } = preparePersonMutation({
        areaId: personId,
        areas: db.areas,
        payload: {
          ...payload
        },
        people: db.people,
        assertNoDuplicatePersonProfile,
        assertNoManagerCycle,
        assertValidAreaReference,
        assertValidManagerReference
      });

      Object.assign(person, personPayload);
      db.areas = assignAreaLeadershipSnapshot(
        db.areas,
        person.id,
        person.area,
        shouldLeadArea
      );
      const managerName =
        db.people.find((item) => item.id === person.managerPersonId)?.name || "";
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.registry,
        action: "updated",
        entityType: "person",
        entityId: person.id,
        entityLabel: person.name,
        actorUser,
        summary: `Pessoa atualizada: ${person.name}`,
        detail: buildPersonAuditDetail({
          roleTitle: person.roleTitle,
          area: person.area,
          workUnit: person.workUnit,
          workMode: person.workMode,
          managerName,
          employmentType: person.employmentType,
          isAreaManager: shouldLeadArea
        })
      });

      return enrichPerson(db.people, person, db.areas.map((area) => enrichArea(db.people, area)));
    },

    async getUsers(actorUser) {
      if (!canManageRegistryUsers(actorUser, canManageUsers)) {
        return [];
      }

      const rows = db.users.map((user) => toAdminUserRow(db, user));
      if (!isManagerScopedActor(actorUser)) {
        return rows;
      }

      return rows.filter((user) =>
        db.people.some(
          (person) => person.id === user.personId && isDirectReportOfActor(person, actorUser)
        )
      );
    },

    async createUser(payload, actorUser) {
      if (!canManageRegistryUsers(actorUser, canManageUsers)) {
        throw new Error("Perfil sem permissao para cadastrar usuarios.");
      }

      const person = db.people.find((item) => item.id === payload.personId);
      assertUserPersonExists(person);
      assertPersonHasNoLinkedUser(db.users.some((item) => item.personId === payload.personId));

      const userData = prepareUserWrite(db.users, payload, { requirePassword: true });
      assertManagerUserScope(person, userData, actorUser);

      const user = {
        id: createId("user"),
        personId: payload.personId,
        email: userData.email,
        passwordHash: hashPassword(userData.password),
        roleKey: userData.roleKey,
        status: userData.status
      };
      db.users.unshift(user);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.user,
        action: "created",
        entityType: "user",
        entityId: user.id,
        entityLabel: person.name,
        actorUser,
        summary: `Usuario criado para ${person.name}`,
        detail: buildUserAuditDetail(userData)
      });
      return toAdminUserRow(db, user);
    },

    async updateUser(userId, payload, actorUser) {
      if (!canManageRegistryUsers(actorUser, canManageUsers)) {
        throw new Error("Perfil sem permissao para atualizar usuarios.");
      }

      const user = db.users.find((item) => item.id === userId);
      if (!user) {
        throw new Error("Usuario nao encontrado.");
      }

      const userData = prepareUserWrite(db.users, payload, { userId });
      const person = db.people.find((item) => item.id === user.personId);
      assertManagerUserScope(person, userData, actorUser);

      user.email = userData.email;
      user.roleKey = userData.roleKey;
      user.status = userData.status;
      if (userData.password) {
        user.passwordHash = hashPassword(userData.password);
      }

      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.user,
        action: "updated",
        entityType: "user",
        entityId: user.id,
        entityLabel: person?.name || user.email,
        actorUser,
        summary: `Acesso atualizado para ${person?.name || user.email}`,
        detail: buildUserAuditDetail(userData)
      });

      return toAdminUserRow(db, user);
    }
  };
}

export function createMysqlRegistryStore({
  pool,
  createId,
  canManagePeople,
  canManageUsers,
  fetchAreaRows,
  fetchPeopleRows,
  prepareAreaMutation,
  assertValidAreaManagerReference,
  insertAuditLog,
  AUDIT_CATEGORIES,
  buildAreaAuditDetail,
  enrichArea,
  filterPeopleForUser,
  preparePersonMutation,
  assertNoDuplicatePersonProfile,
  assertNoManagerCycle,
  assertValidAreaReference,
  assertValidManagerReference,
  buildPersonAuditDetail,
  assignAreaLeadershipSnapshot,
  enrichPerson,
  prepareUserWrite,
  assertUserPersonExists,
  assertPersonHasNoLinkedUser,
  hashPassword,
  buildUserAuditDetail
}) {
  return {
    async createArea(payload, actorUser) {
      if (!canManagePeople(actorUser)) {
        throw new Error("Perfil sem permissao para cadastrar areas.");
      }

      const [areas, people] = await Promise.all([fetchAreaRows(pool), fetchPeopleRows(pool)]);
      const areaMutation = prepareAreaMutation({
        areas,
        payload,
        people,
        assertValidAreaManagerReference
      });

      const area = {
        id: createId("area"),
        name: areaMutation.normalizedName,
        managerPersonId: areaMutation.managerPersonId || null
      };

      await pool.query(
        `INSERT INTO areas (id, name, manager_person_id)
         VALUES (?, ?, ?)`,
        [area.id, area.name, area.managerPersonId]
      );

      const managerName =
        people.find((person) => person.id === area.managerPersonId)?.name || "";
      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.registry,
        action: "created",
        entityType: "area",
        entityId: area.id,
        entityLabel: area.name,
        actorUser,
        summary: `Area criada: ${area.name}`,
        detail: buildAreaAuditDetail({
          name: area.name,
          managerName
        })
      });

      return enrichArea(people, area);
    },

    async updateArea(areaId, payload, actorUser) {
      if (!canManagePeople(actorUser)) {
        throw new Error("Perfil sem permissao para atualizar areas.");
      }

      const [areas, people] = await Promise.all([fetchAreaRows(pool), fetchPeopleRows(pool)]);
      const area = areas.find((item) => item.id === areaId);
      if (!area) {
        throw new Error("Area nao encontrada.");
      }

      const areaMutation = prepareAreaMutation({
        areaId,
        areas,
        payload,
        people,
        assertValidAreaManagerReference
      });
      const nextManagerPersonId =
        areaMutation.managerPersonId === undefined
          ? area.managerPersonId
          : areaMutation.managerPersonId;

      await pool.query(
        `UPDATE areas
         SET name = ?, manager_person_id = ?
         WHERE id = ?`,
        [areaMutation.normalizedName, nextManagerPersonId, areaId]
      );

      if (area.name !== areaMutation.normalizedName) {
        await pool.query(`UPDATE people SET area = ? WHERE area = ?`, [
          areaMutation.normalizedName,
          area.name
        ]);
      }

      const managerName =
        people.find((person) => person.id === nextManagerPersonId)?.name || "";
      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.registry,
        action: "updated",
        entityType: "area",
        entityId: areaId,
        entityLabel: areaMutation.normalizedName,
        actorUser,
        summary: `Area atualizada: ${areaMutation.normalizedName}`,
        detail: buildAreaAuditDetail({
          name: areaMutation.normalizedName,
          managerName
        })
      });

      return enrichArea(
        people.map((person) => ({
          ...person,
          area: person.area === area.name ? areaMutation.normalizedName : person.area
        })),
        {
          ...area,
          name: areaMutation.normalizedName,
          managerPersonId: nextManagerPersonId
        }
      );
    },

    async getPeople(actorUser) {
      const [people, areas] = await Promise.all([fetchPeopleRows(pool), fetchAreaRows(pool)]);
      return filterPeopleForUser(people, actorUser, areas);
    },

    async createPerson(payload, actorUser) {
      if (!canManageRegistryPeople(actorUser, canManagePeople)) {
        throw new Error("Perfil sem permissao para cadastrar pessoas.");
      }
      assertManagerPersonScope(payload, actorUser);

      const [people, areas] = await Promise.all([fetchPeopleRows(pool), fetchAreaRows(pool)]);
      const { personPayload, shouldLeadArea } = preparePersonMutation({
        areas,
        payload,
        people,
        assertNoDuplicatePersonProfile,
        assertNoManagerCycle,
        assertValidAreaReference,
        assertValidManagerReference
      });

      const person = {
        id: createId("person"),
        ...personPayload,
        satisfactionScore: null
      };

      try {
        await pool.query(
          `INSERT INTO people
           (id, name, role_title, area, work_unit, work_mode, manager_person_id, employment_type, satisfaction_score)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            person.id,
            person.name,
            person.roleTitle,
            person.area,
            person.workUnit,
            person.workMode,
            person.managerPersonId,
            person.employmentType,
            person.satisfactionScore
          ]
        );
      } catch (error) {
        if (error?.code !== "ER_BAD_FIELD_ERROR" && error?.errno !== 1054) {
          throw error;
        }

        await pool.query(
          `INSERT INTO people
           (id, name, role_title, area, manager_person_id, employment_type, satisfaction_score)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            person.id,
            person.name,
            person.roleTitle,
            person.area,
            person.managerPersonId,
            person.employmentType,
            person.satisfactionScore
          ]
        );
      }

      await pool.query(`UPDATE areas SET manager_person_id = NULL WHERE manager_person_id = ?`, [
        person.id
      ]);
      if (shouldLeadArea) {
        await pool.query(
          `UPDATE areas
           SET manager_person_id = ?
           WHERE LOWER(name) = LOWER(?)
           LIMIT 1`,
          [person.id, person.area]
        );
      }

      const managerName =
        people.find((item) => item.id === person.managerPersonId)?.name || "";
      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.registry,
        action: "created",
        entityType: "person",
        entityId: person.id,
        entityLabel: person.name,
        actorUser,
        summary: `Pessoa criada: ${person.name}`,
        detail: buildPersonAuditDetail({
          roleTitle: person.roleTitle,
          area: person.area,
          workUnit: person.workUnit,
          workMode: person.workMode,
          managerName,
          employmentType: person.employmentType,
          isAreaManager: shouldLeadArea
        })
      });

      const nextAreas = assignAreaLeadershipSnapshot(areas, person.id, person.area, shouldLeadArea);
      return enrichPerson(people, person, nextAreas);
    },

    async updatePerson(personId, payload, actorUser) {
      if (!canManageRegistryPeople(actorUser, canManagePeople)) {
        throw new Error("Perfil sem permissao para atualizar pessoas.");
      }

      const [people, areas] = await Promise.all([fetchPeopleRows(pool), fetchAreaRows(pool)]);
      const person = people.find((item) => item.id === personId);
      if (!person) {
        throw new Error("Pessoa nao encontrada.");
      }
      assertManagerExistingPersonScope(person, actorUser);
      assertManagerPersonScope(payload, actorUser);

      const { personPayload, shouldLeadArea } = preparePersonMutation({
        areaId: personId,
        areas,
        payload: {
          ...payload
        },
        people,
        assertNoDuplicatePersonProfile,
        assertNoManagerCycle,
        assertValidAreaReference,
        assertValidManagerReference
      });

      try {
        await pool.query(
          `UPDATE people
           SET name = ?, role_title = ?, area = ?, work_unit = ?, work_mode = ?, manager_person_id = ?, employment_type = ?, satisfaction_score = ?
           WHERE id = ?`,
          [
            personPayload.name,
            personPayload.roleTitle,
            personPayload.area,
            personPayload.workUnit,
            personPayload.workMode,
            personPayload.managerPersonId,
            personPayload.employmentType,
            person.satisfactionScore,
            personId
          ]
        );
      } catch (error) {
        if (error?.code !== "ER_BAD_FIELD_ERROR" && error?.errno !== 1054) {
          throw error;
        }

        await pool.query(
          `UPDATE people
           SET name = ?, role_title = ?, area = ?, manager_person_id = ?, employment_type = ?, satisfaction_score = ?
           WHERE id = ?`,
          [
            personPayload.name,
            personPayload.roleTitle,
            personPayload.area,
            personPayload.managerPersonId,
            personPayload.employmentType,
            person.satisfactionScore,
            personId
          ]
        );
      }

      await pool.query(`UPDATE areas SET manager_person_id = NULL WHERE manager_person_id = ?`, [personId]);
      if (shouldLeadArea) {
        await pool.query(
          `UPDATE areas
           SET manager_person_id = ?
           WHERE LOWER(name) = LOWER(?)
           LIMIT 1`,
          [personId, personPayload.area]
        );
      }

      const managerName =
        people.find((item) => item.id === personPayload.managerPersonId)?.name || "";
      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.registry,
        action: "updated",
        entityType: "person",
        entityId: personId,
        entityLabel: personPayload.name,
        actorUser,
        summary: `Pessoa atualizada: ${personPayload.name}`,
        detail: buildPersonAuditDetail({
          roleTitle: personPayload.roleTitle,
          area: personPayload.area,
          workUnit: personPayload.workUnit,
          workMode: personPayload.workMode,
          managerName,
          employmentType: personPayload.employmentType,
          isAreaManager: shouldLeadArea
        })
      });

      const nextAreas = assignAreaLeadershipSnapshot(
        areas,
        personId,
        personPayload.area,
        shouldLeadArea
      );
      return enrichPerson(
        people.map((item) =>
          item.id === personId
            ? {
                ...item,
                ...personPayload
              }
            : item
        ),
        {
          ...person,
          ...personPayload
        },
        nextAreas
      );
    },

    async getUsers(actorUser) {
      if (!canManageRegistryUsers(actorUser, canManageUsers)) {
        return [];
      }

      const [rows] = await pool.query(
        `SELECT u.id, u.person_id AS personId, p.name AS personName, p.area AS personArea,
                p.role_title AS personRoleTitle, p.work_unit AS personWorkUnit,
                p.work_mode AS personWorkMode, manager.name AS managerName, areaManager.name AS areaManagerName,
                p.manager_person_id AS managerPersonId, u.email, u.role_key AS roleKey, u.status
         FROM users u
         JOIN people p ON p.id = u.person_id
         LEFT JOIN people manager ON manager.id = p.manager_person_id
         LEFT JOIN areas a ON a.name = p.area
         LEFT JOIN people areaManager ON areaManager.id = a.manager_person_id
         ORDER BY p.name`
      );
      if (!isManagerScopedActor(actorUser)) {
        return rows;
      }

      return rows.filter((user) => isDirectReportOfActor(user, actorUser));
    },

    async createUser(payload, actorUser) {
      if (!canManageRegistryUsers(actorUser, canManageUsers)) {
        throw new Error("Perfil sem permissao para cadastrar usuarios.");
      }

      const userData = prepareUserWrite([], payload, { requirePassword: true });

      const [personRows] = await pool.query(
        `SELECT p.id, p.name, p.area, p.role_title AS roleTitle, p.work_unit AS workUnit,
                p.work_mode AS workMode, manager.name AS managerName, areaManager.name AS areaManagerName
                , p.manager_person_id AS managerPersonId
         FROM people p
         LEFT JOIN people manager ON manager.id = p.manager_person_id
         LEFT JOIN areas a ON a.name = p.area
         LEFT JOIN people areaManager ON areaManager.id = a.manager_person_id
         WHERE p.id = ?
         LIMIT 1`,
        [payload.personId]
      );
      assertUserPersonExists(personRows[0]);
      assertManagerUserScope(personRows[0], userData, actorUser);

      const [personUserRows] = await pool.query(
        `SELECT id
         FROM users
         WHERE person_id = ?
         LIMIT 1`,
        [payload.personId]
      );
      assertPersonHasNoLinkedUser(Boolean(personUserRows[0]));

      const [emailRows] = await pool.query(
        `SELECT id, email
         FROM users
         WHERE email = ? OR id = ?
         LIMIT 2`,
        [userData.email, "__no_user__"]
      );
      prepareUserWrite(emailRows, userData, { requirePassword: true });

      const user = {
        id: createId("user"),
        personId: payload.personId,
        email: userData.email,
        roleKey: userData.roleKey,
        status: userData.status
      };

      await pool.query(
        `INSERT INTO users
         (id, person_id, email, password_hash, role_key, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user.id, user.personId, user.email, hashPassword(userData.password), user.roleKey, user.status]
      );

      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.user,
        action: "created",
        entityType: "user",
        entityId: user.id,
        entityLabel: personRows[0].name,
        actorUser,
        summary: `Usuario criado para ${personRows[0].name}`,
        detail: buildUserAuditDetail(userData)
      });

      return {
        ...user,
        personName: personRows[0].name,
        personArea: personRows[0].area,
        personRoleTitle: personRows[0].roleTitle || "",
        personWorkUnit: personRows[0].workUnit || "",
        personWorkMode: personRows[0].workMode || "",
        managerName: personRows[0].managerName || "",
        areaManagerName: personRows[0].areaManagerName || ""
      };
    },

    async updateUser(userId, payload, actorUser) {
      if (!canManageRegistryUsers(actorUser, canManageUsers)) {
        throw new Error("Perfil sem permissao para atualizar usuarios.");
      }

      const userData = prepareUserWrite([], payload, { userId });

      const [rows] = await pool.query(
        `SELECT u.id, u.person_id AS personId, p.name AS personName, p.area AS personArea,
                p.role_title AS personRoleTitle, p.work_unit AS personWorkUnit,
                p.work_mode AS personWorkMode, manager.name AS managerName, areaManager.name AS areaManagerName,
                p.manager_person_id AS managerPersonId, u.email
         FROM users u
         JOIN people p ON p.id = u.person_id
         LEFT JOIN people manager ON manager.id = p.manager_person_id
         LEFT JOIN areas a ON a.name = p.area
         LEFT JOIN people areaManager ON areaManager.id = a.manager_person_id
         WHERE u.id = ?
         LIMIT 1`,
        [userId]
      );
      if (!rows[0]) {
        throw new Error("Usuario nao encontrado.");
      }
      assertManagerUserScope(rows[0], userData, actorUser);

      const [emailRows] = await pool.query(
        `SELECT id, email
         FROM users
         WHERE email = ? OR id = ?
         LIMIT 2`,
        [userData.email, userId]
      );
      prepareUserWrite(emailRows, userData, { userId });

      if (userData.password) {
        await pool.query(
          `UPDATE users
           SET email = ?, role_key = ?, status = ?, password_hash = ?
           WHERE id = ?`,
          [userData.email, userData.roleKey, userData.status, hashPassword(userData.password), userId]
        );
      } else {
        await pool.query(
          `UPDATE users
           SET email = ?, role_key = ?, status = ?
           WHERE id = ?`,
          [userData.email, userData.roleKey, userData.status, userId]
        );
      }

      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.user,
        action: "updated",
        entityType: "user",
        entityId: userId,
        entityLabel: rows[0].personName,
        actorUser,
        summary: `Acesso atualizado para ${rows[0].personName}`,
        detail: buildUserAuditDetail(userData)
      });

      return {
        id: userId,
        personId: rows[0].personId,
        personName: rows[0].personName,
        personArea: rows[0].personArea,
        personRoleTitle: rows[0].personRoleTitle || "",
        personWorkUnit: rows[0].personWorkUnit || "",
        personWorkMode: rows[0].personWorkMode || "",
        managerName: rows[0].managerName || "",
        areaManagerName: rows[0].areaManagerName || "",
        email: userData.email,
        roleKey: userData.roleKey,
        status: userData.status
      };
    }
  };
}
