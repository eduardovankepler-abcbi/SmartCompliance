import {
  normalizeOptionalText,
  assertValidCompetencyStatus,
  normalizeAreaLeadershipFlag,
  normalizeAreaName,
  normalizeCompetencyKey,
  normalizeCompetencyName,
  normalizePersonPayload,
  normalizeWorkMode
} from "./storeValidation.js";
import { DEFAULT_WORK_UNIT } from "./storeConstants.js";
import {
  isAdminUser,
  isHrUser,
  isManagerUser,
  isOrgWideUser
} from "./storeAccess.js";

export function prepareCompetencyMutation(existingCompetencies, payload, options = {}) {
  const competencyId = options.competencyId || null;
  const normalizedName = normalizeCompetencyName(payload.name);
  const normalizedKey = normalizeCompetencyKey(payload.key || payload.name);

  if (!normalizedName) {
    throw new Error("Nome da competencia nao informado.");
  }

  if (!normalizedKey) {
    throw new Error("Chave da competencia invalida.");
  }

  assertValidCompetencyStatus(payload.status || "active");

  const hasDuplicate = existingCompetencies.some(
    (item) =>
      item.id !== competencyId &&
      (normalizeCompetencyName(item.name).toLowerCase() === normalizedName.toLowerCase() ||
        normalizeCompetencyKey(item.key) === normalizedKey)
  );

  if (hasDuplicate) {
    throw new Error("Ja existe uma competencia com este nome ou chave.");
  }

  return {
    description: String(payload.description || "").trim(),
    key: normalizedKey,
    name: normalizedName,
    status: payload.status || "active"
  };
}

export function prepareAreaMutation({
  areaId = null,
  areas,
  payload,
  people,
  assertValidAreaManagerReference
}) {
  const normalizedName = payload.name?.trim();

  if (!normalizedName) {
    throw new Error("Nome da area nao informado.");
  }

  const hasDuplicate = areas.some(
    (item) =>
      item.id !== areaId && normalizeAreaName(item.name) === normalizeAreaName(normalizedName)
  );

  if (hasDuplicate) {
    throw new Error("Ja existe uma area com este nome.");
  }

  if (payload.managerPersonId !== undefined) {
    assertValidAreaManagerReference(people, payload.managerPersonId);
  }

  return {
    managerPersonId:
      payload.managerPersonId === undefined ? undefined : payload.managerPersonId || null,
    normalizedName
  };
}

export function preparePersonMutation({
  areaId = null,
  areas,
  payload,
  people,
  assertNoDuplicatePersonProfile,
  assertNoManagerCycle,
  assertValidAreaReference,
  assertValidManagerReference
}) {
  const personPayload = normalizePersonPayload(payload);
  const shouldLeadArea = normalizeAreaLeadershipFlag(payload.isAreaManager);

  assertValidManagerReference(people, personPayload.managerPersonId, areaId);
  if (areaId) {
    assertNoManagerCycle(people, personPayload.managerPersonId, areaId);
  }
  assertNoDuplicatePersonProfile(people, personPayload, areaId);
  assertValidAreaReference(areas, personPayload.area);

  return {
    personPayload,
    shouldLeadArea
  };
}

export function buildAreaAuditDetail({ name, managerName }) {
  return `${name} · Responsavel ${managerName || "Nao definido"}`;
}

export function buildPersonAuditDetail({
  roleTitle,
  area,
  workUnit,
  workMode,
  managerName,
  employmentType,
  isAreaManager
}) {
  const workModeLabel =
    workMode === "onsite"
      ? "Presencial"
      : workMode === "remote"
        ? "Remoto"
        : "Hibrido";
  const employmentTypeLabel = employmentType === "consultant" ? "Consultor" : "Interno";

  return [
    roleTitle || "Sem cargo",
    area || "Sem area",
    workUnit || "Sem unidade",
    workModeLabel,
    employmentTypeLabel,
    `Gestor ${managerName || "Nao definido"}`,
    isAreaManager ? "Lider da area" : "Sem lideranca de area"
  ].join(" · ");
}

export function enrichArea(people, area) {
  const manager = people.find((item) => item.id === area.managerPersonId);
  const members = people.filter((person) => person.area === area.name);
  return {
    ...area,
    managerPersonId: area.managerPersonId || null,
    managerName: manager?.name || "",
    peopleCount: members.length
  };
}

export function filterAreasForUser(areas, people, user) {
  const enrichedAreas = areas.map((area) => enrichArea(people, area));

  if (isOrgWideUser(user) || isHrUser(user) || isAdminUser(user)) {
    return enrichedAreas;
  }

  if (isManagerUser(user)) {
    return enrichedAreas.filter(
      (area) => area.managerPersonId === user.person.id || area.name === user.person.area
    );
  }

  return enrichedAreas.filter((area) => area.name === user?.person?.area);
}

export function enrichPerson(people, person, areas = []) {
  const manager = people.find((item) => item.id === person.managerPersonId);
  const area = areas.find((item) => item.name === person.area);
  return {
    ...person,
    workUnit: String(person.workUnit || DEFAULT_WORK_UNIT),
    workMode: normalizeWorkMode(person.workMode),
    managerPersonId: person.managerPersonId || null,
    managerName: manager?.name || "",
    areaManagerPersonId: area?.managerPersonId || null,
    areaManagerName: area?.managerName || ""
  };
}

export function getTeamPeople(people, managerPersonId) {
  return people.filter((person) => person.managerPersonId === managerPersonId);
}

export function filterPeopleForUser(people, user, areas = []) {
  const enrichedAreas = areas.map((area) => enrichArea(people, area));
  const enrichedPeople = people.map((person) => enrichPerson(people, person, enrichedAreas));

  if (isAdminUser(user) || isHrUser(user)) {
    return enrichedPeople;
  }

  if (isManagerUser(user)) {
    return enrichedPeople.filter(
      (person) => person.id === user.person.id || person.managerPersonId === user.person.id
    );
  }

  return enrichedPeople.map((person) => ({
    id: person.id,
    name: person.name,
    roleTitle: person.roleTitle,
    area: person.area,
    workUnit: person.workUnit,
    workMode: person.workMode,
    managerPersonId: person.managerPersonId,
    managerName: person.managerName
  }));
}

export function assignAreaLeadershipSnapshot(areas, personId, areaName, shouldLeadArea) {
  const nextAreaKey = normalizeAreaName(areaName);

  return areas.map((area) => {
    const isTargetArea = normalizeAreaName(area.name) === nextAreaKey;
    const isManagedByPerson = area.managerPersonId === personId;

    if (isManagedByPerson && (!shouldLeadArea || !isTargetArea)) {
      return {
        ...area,
        managerPersonId: null
      };
    }

    if (shouldLeadArea && isTargetArea) {
      return {
        ...area,
        managerPersonId: personId
      };
    }

    return area;
  });
}

export function assertValidManagerReference(people, managerPersonId, personId = null) {
  if (!managerPersonId) {
    return;
  }

  const managerExists = people.some((person) => person.id === managerPersonId);
  if (!managerExists) {
    throw new Error("Gestor informado nao foi encontrado.");
  }

  if (personId && managerPersonId === personId) {
    throw new Error("Uma pessoa nao pode ser gestora de si mesma.");
  }
}

export function assertNoManagerCycle(people, managerPersonId, personId = null) {
  if (!managerPersonId || !personId) {
    return;
  }

  let currentManagerId = managerPersonId;
  const visited = new Set();

  while (currentManagerId && !visited.has(currentManagerId)) {
    if (currentManagerId === personId) {
      throw new Error("A hierarquia informada cria um ciclo de gestao invalido.");
    }

    visited.add(currentManagerId);
    currentManagerId =
      people.find((person) => person.id === currentManagerId)?.managerPersonId || null;
  }
}

export function assertValidAreaReference(areas, areaName) {
  if (!areaName || !areas.some((area) => normalizeAreaName(area.name) === normalizeAreaName(areaName))) {
    throw new Error("Area informada nao foi encontrada.");
  }
}

export function assertValidAreaManagerReference(people, managerPersonId) {
  if (!managerPersonId) {
    return;
  }

  const managerExists = people.some((person) => person.id === managerPersonId);
  if (!managerExists) {
    throw new Error("Responsavel da area nao foi encontrado.");
  }
}

export function assertNoDuplicatePersonProfile(people, payload, personId = null) {
  const normalizedName = normalizeOptionalText(payload.name).toLowerCase();
  const normalizedArea = normalizeAreaName(payload.area);
  const normalizedRoleTitle = normalizeOptionalText(payload.roleTitle).toLowerCase();

  const duplicate = people.find((person) => {
    if (personId && person.id === personId) {
      return false;
    }

    return (
      normalizeOptionalText(person.name).toLowerCase() === normalizedName &&
      normalizeAreaName(person.area) === normalizedArea &&
      normalizeOptionalText(person.roleTitle).toLowerCase() === normalizedRoleTitle
    );
  });

  if (duplicate) {
    throw new Error("Ja existe uma pessoa com mesmo nome, area e cargo.");
  }
}
