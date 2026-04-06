import { MAX_APPLAUSE_PER_MONTH, MAX_RECIPROCAL_APPLAUSE } from "./storeConstants.js";

function isSameMonth(firstDate, secondDate) {
  const first = new Date(firstDate);
  const second = new Date(secondDate);
  return (
    first.getUTCFullYear() === second.getUTCFullYear() &&
    first.getUTCMonth() === second.getUTCMonth()
  );
}

export function assertCanManageDevelopmentSubject(
  actorUser,
  people,
  personId,
  { isOrgWideUser, isManagerUser, getTeamPeople }
) {
  const actorPersonId = actorUser.person?.id || actorUser.personId;

  if (isOrgWideUser(actorUser)) {
    return;
  }

  if (
    isManagerUser(actorUser) &&
    (actorPersonId === personId ||
      people.some((person) => person.id === personId && person.managerPersonId === actorPersonId))
  ) {
    return;
  }

  if (actorPersonId !== personId) {
    throw new Error("Voce so pode registrar desenvolvimento no proprio perfil ou na sua equipe.");
  }
}

export function assertCanCreateApplause(existingEntries, payload) {
  if (payload.senderPersonId === payload.receiverPersonId) {
    throw new Error("Nao e permitido enviar Aplause para si mesmo.");
  }

  if (!payload.contextNote?.trim() || payload.contextNote.trim().length < 20) {
    throw new Error("O contexto do Aplause precisa ter pelo menos 20 caracteres.");
  }

  const now = new Date().toISOString();
  const sentThisMonth = existingEntries.filter(
    (entry) =>
      entry.senderPersonId === payload.senderPersonId && isSameMonth(entry.createdAt, now)
  );

  if (sentThisMonth.length >= MAX_APPLAUSE_PER_MONTH) {
    throw new Error("Limite mensal de Aplause por pessoa atingido.");
  }

  const reciprocalEntries = existingEntries.filter(
    (entry) =>
      entry.senderPersonId === payload.receiverPersonId &&
      entry.receiverPersonId === payload.senderPersonId
  );

  if (reciprocalEntries.length >= MAX_RECIPROCAL_APPLAUSE) {
    throw new Error("Padrao reciproco excessivo detectado para este Aplause.");
  }
}

export function assertCanManageApplauseEntry(
  actorUser,
  people,
  entry,
  { isOrgWideUser, getTeamPeople }
) {
  if (!["admin", "hr", "manager"].includes(actorUser?.roleKey || "")) {
    throw new Error("Perfil sem permissao para atualizar Aplause.");
  }

  if (isOrgWideUser(actorUser)) {
    return;
  }

  const actorPersonId = actorUser.person?.id || actorUser.personId;
  const visiblePersonIds = new Set([
    actorPersonId,
    ...getTeamPeople(people, actorPersonId).map((item) => item.id)
  ]);

  if (
    visiblePersonIds.has(entry.senderPersonId) ||
    visiblePersonIds.has(entry.receiverPersonId)
  ) {
    return;
  }

  throw new Error("Voce so pode atualizar Aplause do seu proprio escopo.");
}

export function buildApplauseAuditDetail({ category, senderName, receiverName }) {
  return `${category} · ${senderName || "-"} -> ${receiverName || "-"}`;
}

export function buildDevelopmentRecordAuditDetail({ recordType, providerName, skillSignal }) {
  return `${recordType} · ${providerName} · ${skillSignal}`;
}

export function buildDevelopmentPlanAuditDetail({ focusTitle, dueDate }) {
  return `${focusTitle} · Prazo ${dueDate}`;
}
