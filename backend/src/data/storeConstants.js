export const ORG_WIDE_ROLES = ["admin", "hr", "compliance"];
export const INCIDENT_ACCESS_ROLES = ["admin", "hr", "compliance"];
export const MAX_APPLAUSE_PER_MONTH = 3;
export const MAX_RECIPROCAL_APPLAUSE = 2;
export const MIN_ANONYMOUS_AGGREGATE_RESPONSES = 3;

export const INCIDENT_STATUS = [
  "Em triagem",
  "Em apuracao",
  "Aguardando retorno",
  "Concluido"
];

export const INCIDENT_CLASSIFICATION = [
  "Conduta e Relacionamento",
  "Integridade e Etica",
  "Assedio e Respeito",
  "Fraude e Desvio",
  "Processos e Controles",
  "Nao classificado"
];

export const CYCLE_STATUS = {
  planning: "Planejamento",
  released: "Liberado",
  closed: "Encerrado",
  processed: "Processado"
};

export const DEFAULT_CYCLE_MODULE_AVAILABILITY = Object.freeze({
  self: true,
  company: true,
  leader: true,
  manager: true,
  peer: true,
  "cross-functional": true,
  "client-internal": true,
  "client-external": true
});

export const DEFAULT_TRANSVERSAL_CONFIG = Object.freeze({
  defaultReviewersPerPerson: 1,
  unitOverrides: {}
});

export const USER_ROLE_OPTIONS = ["admin", "hr", "manager", "employee", "compliance"];
export const USER_STATUS_OPTIONS = ["active", "inactive"];
export const EMPLOYMENT_TYPE_OPTIONS = ["internal", "consultant"];
export const COMPETENCY_STATUS_OPTIONS = ["active", "inactive"];
export const DEVELOPMENT_RECORD_STATUS_OPTIONS = ["active", "archived"];
export const DEVELOPMENT_PLAN_STATUS_OPTIONS = ["active", "completed", "archived"];
export const DEVELOPMENT_PLAN_PROGRESS_STATUS_OPTIONS = [
  "not_started",
  "in_progress",
  "blocked",
  "done"
];
export const APPLAUSE_STATUS_OPTIONS = ["Validado", "Em revisao", "Arquivado"];

export const FEEDBACK_REQUEST_STATUS = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected"
};

export const FEEDBACK_ACKNOWLEDGEMENT_STATUS = {
  agreed: "agreed",
  disagreed: "disagreed"
};

export const AUDIT_CATEGORIES = {
  user: "user",
  competency: "competency",
  incident: "incident",
  cycle: "cycle",
  feedbackRequest: "feedback_request",
  applause: "applause",
  development: "development"
};

export const DEFAULT_EVALUATION_LIBRARY_ID = "library_standard_02_2026";
export const DEFAULT_EVALUATION_LIBRARY_NAME = "Biblioteca padrao 02/2026";
export const DEFAULT_EVALUATION_LIBRARY_DESCRIPTION =
  "Biblioteca oficial do ciclo, com os modelos base do produto.";

export const DEFAULT_WORK_UNIT = "Unidade principal";
export const DEFAULT_WORK_MODE = "hybrid";
export const WORK_MODE_OPTIONS = ["onsite", "hybrid", "remote"];
