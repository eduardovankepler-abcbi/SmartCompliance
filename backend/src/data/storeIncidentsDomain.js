import {
  assertValidIncidentClassification,
  assertValidIncidentStatus,
  normalizeAreaName
} from "./storeValidation.js";

export const INCIDENT_EVIDENCE_MAX_BYTES = 1024 * 1024 * 2;

const INCIDENT_EVIDENCE_ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain"
]);

function isPdf(buffer) {
  return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
}

function isJpeg(buffer) {
  return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

function isPng(buffer) {
  return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

function isSafePlainText(buffer) {
  if (buffer.includes(0)) {
    return false;
  }

  const text = buffer.toString("utf8");
  return Buffer.from(text, "utf8").equals(buffer);
}

function hasExpectedEvidenceContent(mimeType, buffer) {
  if (mimeType === "application/pdf") return isPdf(buffer);
  if (mimeType === "image/jpeg") return isJpeg(buffer);
  if (mimeType === "image/png") return isPng(buffer);
  if (mimeType === "text/plain") return isSafePlainText(buffer);
  return false;
}

export function normalizeIncidentEvidenceFile(file) {
  if (!file?.buffer?.length) {
    throw new Error("Arquivo de evidencia obrigatorio.");
  }

  if (file.size > INCIDENT_EVIDENCE_MAX_BYTES) {
    throw new Error("Evidencia deve ter no maximo 2 MB.");
  }

  if (!INCIDENT_EVIDENCE_ALLOWED_TYPES.has(file.mimetype)) {
    throw new Error("Tipo de evidencia nao permitido.");
  }

  if (!hasExpectedEvidenceContent(file.mimetype, file.buffer)) {
    throw new Error("Conteudo da evidencia nao corresponde ao tipo informado.");
  }

  const fileName = String(file.originalname || "evidencia")
    .replace(/[\\/:*?"<>|]/g, "-")
    .trim()
    .slice(0, 180);

  return {
    fileName: fileName || "evidencia",
    mimeType: file.mimetype,
    sizeBytes: file.size,
    content: file.buffer
  };
}

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
  assertValidIncidentArea(areas, payload.responsibleArea);
  assertValidIncidentAssignee(people, payload.assignedPersonId);
}

export function assertIncidentStatusTransition(currentStatus, nextStatus) {
  const allowedTransitions = {
    "Em triagem": ["Em triagem", "Em apuracao"],
    "Em apuracao": ["Em apuracao", "Aguardando retorno", "Concluido"],
    "Aguardando retorno": ["Aguardando retorno", "Em apuracao", "Concluido"],
    Concluido: []
  };

  if (!(allowedTransitions[currentStatus] || []).includes(nextStatus)) {
    throw new Error("Transicao de status do caso nao permitida.");
  }
}

export function assertIncidentCanClose({ payload, assignedPersonId, hasEvidence }) {
  if (!String(payload.closureNote || "").trim()) {
    throw new Error("Informe o motivo de conclusao do caso.");
  }
  if (payload.findingStatus === "pending") {
    throw new Error("Defina a procedencia do caso antes de concluir.");
  }
  if (!assignedPersonId) {
    throw new Error("Defina um responsavel antes de concluir o caso.");
  }
  if (!hasEvidence) {
    throw new Error("Anexe ao menos uma evidencia antes de concluir o caso.");
  }
}

export function buildIncidentAuditDetail({
  classification,
  responsibleArea,
  assignedTo,
  status = null,
  previousStatus = null,
  protocol = null,
  closureNote = null
}) {
  const prefix = protocol ? `${protocol} · ` : "";
  if (status) {
    const transition = previousStatus && previousStatus !== status ? `${previousStatus} → ${status} · ` : "";
    return `${prefix}${transition}${classification} · Area: ${responsibleArea} · Responsavel: ${assignedTo}${closureNote ? ` · Fechamento: ${closureNote}` : ""}`;
  }

  return `${prefix}${classification} · Area: ${responsibleArea} · Responsavel inicial: ${assignedTo}`;
}
