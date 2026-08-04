import {
  assertValidIncidentClassification,
  assertValidIncidentStatus,
  normalizeAreaName
} from "./storeValidation.js";

export function buildIncidentProtocol({ id, createdAt = new Date().toISOString() }) {
  const date = new Date(createdAt);
  const yyyymmdd = Number.isNaN(date.getTime())
    ? "00000000"
    : date.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = String(id || "")
    .replace(/[^a-z0-9]/gi, "")
    .slice(-6)
    .toUpperCase()
    .padStart(6, "0");
  return `SC-${yyyymmdd}-${suffix}`;
}

export function calculateIncidentDueAt(createdAt = new Date().toISOString(), days = 7) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

export function resolveIncidentAssignment({ areas, people, payload }) {
  const area = areas.find(
    (item) => normalizeAreaName(item.name) === normalizeAreaName(payload.responsibleArea)
  );

  const assignedPerson =
    people.find((person) => person.id === payload.assignedPersonId) ||
    people.find((person) => person.id === area?.managerPersonId) ||
    null;

  return {
    area,
    assignedPerson,
    assignedPersonId: assignedPerson?.id || null,
    assignedTo: assignedPerson?.name || area?.managerName || "Nao definido",
    responsibleArea: area?.name || payload.responsibleArea
  };
}

export function assertIncidentCreatePayload({ areas, people, payload, assertValidIncidentArea, assertValidIncidentAssignee }) {
  assertValidIncidentClassification(payload.classification);
  assertValidIncidentArea(areas, payload.responsibleArea);
  assertValidIncidentAssignee(people, payload.assignedPersonId);
}

export function assertIncidentUpdatePayload({
  areas,
  people,
  payload,
  assertValidIncidentArea,
  assertValidIncidentAssignee
}) {
  assertValidIncidentClassification(payload.classification);
  assertValidIncidentStatus(payload.status);
  if (payload.status === "Concluido" && !String(payload.closureNote || "").trim()) {
    throw new Error("Informe o motivo de conclusao do caso.");
  }
  assertValidIncidentArea(areas, payload.responsibleArea);
  assertValidIncidentAssignee(people, payload.assignedPersonId);
}

export function buildIncidentAuditDetail({
  classification,
  responsibleArea,
  assignedTo,
  status = null,
  protocol = null,
  closureNote = null
}) {
  const prefix = protocol ? `${protocol} · ` : "";
  if (status) {
    return `${prefix}${status} · ${classification} · Area: ${responsibleArea} · Responsavel: ${assignedTo}${closureNote ? ` · Fechamento: ${closureNote}` : ""}`;
  }

  return `${prefix}${classification} · Area: ${responsibleArea} · Responsavel inicial: ${assignedTo}`;
}
