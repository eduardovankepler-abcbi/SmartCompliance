import {
  APPLAUSE_STATUS_OPTIONS,
  COMPETENCY_STATUS_OPTIONS,
  CYCLE_STATUS,
  DEFAULT_WORK_MODE,
  DEFAULT_WORK_UNIT,
  DEVELOPMENT_PLAN_STATUS_OPTIONS,
  DEVELOPMENT_RECORD_STATUS_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  FEEDBACK_REQUEST_STATUS,
  INCIDENT_CLASSIFICATION,
  INCIDENT_STATUS,
  USER_ROLE_OPTIONS,
  USER_STATUS_OPTIONS,
  WORK_MODE_OPTIONS
} from "./storeConstants.js";

export function assertValidCycleStatus(status) {
  if (!Object.values(CYCLE_STATUS).includes(status)) {
    throw new Error("Status de ciclo invalido.");
  }
}

export function assertCycleStatusTransition(currentStatus, nextStatus) {
  assertValidCycleStatus(nextStatus);

  if (currentStatus === nextStatus) {
    return;
  }

  const allowedTransitions = {
    [CYCLE_STATUS.planning]: [CYCLE_STATUS.released, CYCLE_STATUS.closed],
    [CYCLE_STATUS.released]: [CYCLE_STATUS.closed],
    [CYCLE_STATUS.closed]: [CYCLE_STATUS.processed],
    [CYCLE_STATUS.processed]: []
  };

  if (!(allowedTransitions[currentStatus] || []).includes(nextStatus)) {
    throw new Error("Transicao de status do ciclo nao permitida.");
  }
}

export function assertValidIncidentClassification(classification) {
  if (!INCIDENT_CLASSIFICATION.includes(classification)) {
    throw new Error("Classificacao do caso invalida.");
  }
}

export function assertValidIncidentStatus(status) {
  if (!INCIDENT_STATUS.includes(status)) {
    throw new Error("Status do caso invalido.");
  }
}

export function assertValidUserRole(roleKey) {
  if (!USER_ROLE_OPTIONS.includes(roleKey)) {
    throw new Error("Nivel de acesso invalido.");
  }
}

export function assertValidUserStatus(status) {
  if (!USER_STATUS_OPTIONS.includes(status)) {
    throw new Error("Status de usuario invalido.");
  }
}

export function assertValidEmploymentType(employmentType) {
  if (!EMPLOYMENT_TYPE_OPTIONS.includes(employmentType)) {
    throw new Error("Vinculo da pessoa invalido.");
  }
}

export function assertValidDevelopmentRecordStatus(status) {
  if (!DEVELOPMENT_RECORD_STATUS_OPTIONS.includes(status)) {
    throw new Error("Status de desenvolvimento invalido.");
  }
}

export function assertValidDevelopmentPlanStatus(status) {
  if (!DEVELOPMENT_PLAN_STATUS_OPTIONS.includes(status)) {
    throw new Error("Status do PDI invalido.");
  }
}

export function assertValidApplauseStatus(status) {
  if (!APPLAUSE_STATUS_OPTIONS.includes(status)) {
    throw new Error("Status do Aplause invalido.");
  }
}

export function assertValidFeedbackRequestStatus(status) {
  if (!Object.values(FEEDBACK_REQUEST_STATUS).includes(status)) {
    throw new Error("Status da solicitacao de feedback invalido.");
  }
}

export function normalizeAreaName(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function normalizeCompetencyName(value) {
  return String(value || "").trim();
}

export function normalizeCompetencyKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function assertValidCompetencyStatus(status) {
  if (!COMPETENCY_STATUS_OPTIONS.includes(status)) {
    throw new Error("Status da competencia invalido.");
  }
}

export function normalizeWorkMode(value) {
  const normalized = String(value || DEFAULT_WORK_MODE).trim().toLowerCase();
  if (!WORK_MODE_OPTIONS.includes(normalized)) {
    throw new Error("Modalidade de trabalho invalida.");
  }
  return normalized;
}

export function normalizeWorkUnit(value) {
  const normalized = String(value || "").trim();
  return normalized || DEFAULT_WORK_UNIT;
}

export function normalizeWorkContextPayload(payload) {
  return {
    workUnit: normalizeWorkUnit(payload.workUnit),
    workMode: normalizeWorkMode(payload.workMode)
  };
}

export function normalizeRequiredText(value, fieldLabel) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    throw new Error(`${fieldLabel} obrigatorio(a).`);
  }
  return normalized;
}

export function normalizeOptionalText(value) {
  return String(value || "").trim();
}

export function normalizePersonPayload(payload) {
  const workContext = normalizeWorkContextPayload(payload);
  const employmentType = normalizeRequiredText(payload.employmentType, "Vinculo");
  assertValidEmploymentType(employmentType);

  return {
    name: normalizeRequiredText(payload.name, "Nome"),
    roleTitle: normalizeRequiredText(payload.roleTitle, "Cargo"),
    area: normalizeRequiredText(payload.area, "Area"),
    workUnit: workContext.workUnit,
    workMode: workContext.workMode,
    managerPersonId: payload.managerPersonId || null,
    employmentType,
  };
}

export function normalizeAreaLeadershipFlag(value) {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["yes", "true", "1", "sim"].includes(normalized)) {
      return true;
    }
    if (["no", "false", "0", ""].includes(normalized)) {
      return false;
    }
  }

  return Boolean(value);
}

export function normalizeUserEmail(value) {
  const normalized = normalizeOptionalText(value).toLowerCase();
  if (!normalized) {
    throw new Error("Email do usuario obrigatorio.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Email do usuario invalido.");
  }
  return normalized;
}

export function normalizeUserPassword(value, { required = false } = {}) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    if (required) {
      throw new Error("Senha do usuario obrigatoria.");
    }
    return "";
  }
  if (normalized.length < 6) {
    throw new Error("Senha do usuario deve ter pelo menos 6 caracteres.");
  }
  return normalized;
}
