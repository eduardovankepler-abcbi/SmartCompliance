import {
  assertValidCompetencyStatus,
  normalizeAreaLeadershipFlag,
  normalizeAreaName,
  normalizeCompetencyKey,
  normalizeCompetencyName,
  normalizePersonPayload
} from "./storeValidation.js";

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
