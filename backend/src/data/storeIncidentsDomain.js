import {
  assertValidIncidentClassification,
  assertValidIncidentStatus,
  normalizeAreaName
} from "./storeValidation.js";

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
  assertValidIncidentArea(areas, payload.responsibleArea);
  assertValidIncidentAssignee(people, payload.assignedPersonId);
}

export function buildIncidentAuditDetail({ classification, responsibleArea, assignedTo, status = null }) {
  if (status) {
    return `${status} · ${classification} · Area: ${responsibleArea} · Responsavel: ${assignedTo}`;
  }

  return `${classification} · Area: ${responsibleArea} · Responsavel inicial: ${assignedTo}`;
}
