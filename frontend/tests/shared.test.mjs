import assert from "node:assert/strict";
import { getCapabilities } from "../src/access.js";
import { evaluationModules } from "../src/appConfig.js";
import {
  buildSuggestedUserEmail,
  getPersonConsistencyMessages,
  getUserConsistencyMessages,
  validatePersonPayload,
  validateUserPayload
} from "../src/registry.js";
import { validateEvaluationAnswerForm } from "../src/evaluations/validation.js";
import {
  formatDate,
  getAssignmentStatusLabel,
  getCycleStatusDescription,
  getDevelopmentTrackLabel,
  getEvaluationModule,
  getEvaluationModuleExperience,
  getEvaluationWorkspaceCopy,
  getFeedbackRequestStatusLabel,
  getRelationshipDescription,
  getRelationshipLabel,
  getRoleLabel,
  getVisibilityLabel
} from "../src/appLabels.js";

assert.equal(evaluationModules.length, 9, "Configuracao de modulos de avaliacao deve permanecer completa");
assert.equal(
  getEvaluationModule("peer")?.key,
  "peer",
  "Modulo de feedback direto deve ser recuperado pela relationshipType"
);
assert.equal(
  getRelationshipLabel("leader"),
  "Avaliacao do Lider",
  "Rotulo do relacionamento deve seguir a taxonomia do modulo"
);
assert.equal(
  getRelationshipDescription("manager"),
  "Feedback formal do gestor sobre entrega, colaboracao e evolucao.",
  "Descricao do relacionamento deve ser compartilhada pelo app"
);
assert.equal(
  getRelationshipLabel("client-internal"),
  "Cliente Interno",
  "Novo grupo de cliente interno deve estar disponivel na taxonomia"
);
assert.equal(
  getRelationshipLabel("client-external"),
  "Cliente Externo",
  "Novo grupo de cliente externo deve estar disponivel na taxonomia"
);
assert.equal(getVisibilityLabel("confidential"), "Confidencial");
assert.equal(getVisibilityLabel("private"), "Privada");
assert.equal(getVisibilityLabel("shared"), "Compartilhada");
assert.equal(
  getCycleStatusDescription("Liberado"),
  "Ciclo aberto para resposta dos assignments distribuidos."
);
assert.equal(getDevelopmentTrackLabel("MBA"), "Formacao academica");
assert.equal(getDevelopmentTrackLabel("Certificacao"), "Credencial tecnica");
assert.equal(getDevelopmentTrackLabel("Projeto"), "Experiencia aplicada");
assert.equal(getRoleLabel("compliance"), "Compliance");
assert.equal(getAssignmentStatusLabel("pending"), "Pendentes");
assert.equal(getFeedbackRequestStatusLabel("approved"), "Aprovada");
assert.equal(
  getEvaluationWorkspaceCopy("peer", "respond").submitLabel,
  "Enviar feedback direto"
);
assert.equal(
  getEvaluationWorkspaceCopy("leader", "respond").responseTitle,
  "Responder avaliacao do lider"
);
assert.equal(
  getEvaluationWorkspaceCopy("company", "respond").developmentLabel,
  "O que a empresa pode evoluir"
);
assert.equal(
  getEvaluationWorkspaceCopy("client-external", "respond").submitLabel,
  "Enviar leitura do cliente externo"
);
assert.equal(getEvaluationModuleExperience("peer", "respond").tone, "peer");
assert.equal(
  getEvaluationModuleExperience("leader", "respond").spotlightItems[0].label,
  "Foco"
);
assert.equal(formatDate("2026-03-25T12:00:00Z"), "25/03/2026");
assert.equal(formatDate("nao-e-data"), "nao-e-data");
assert.equal(formatDate(""), "-");
assert.equal(
  buildSuggestedUserEmail("Maria Clara Souza"),
  "maria.clara.souza@empresa.local",
  "Cadastro de usuario deve sugerir email a partir do nome"
);
assert.equal(
  validatePersonPayload({
    name: "Maria",
    roleTitle: "Analista",
    area: "Tecnologia",
    workUnit: "Sao Paulo",
    employmentType: "internal"
  }),
  "",
  "Cadastro de pessoa nao deve depender de score manual"
);
assert.equal(
  validatePersonPayload({
    name: "Maria",
    roleTitle: "Analista",
    area: "Tecnologia",
    employmentType: "internal",
    workUnit: ""
  }),
  "Informe a unidade de trabalho.",
  "Cadastro de pessoa deve exigir unidade de trabalho explicita"
);
assert.deepEqual(
  getPersonConsistencyMessages(
    {
      name: "Maria",
      roleTitle: "Analista",
      area: "Tecnologia",
      workUnit: "Sao Paulo",
      workMode: "remote",
      managerPersonId: "",
      employmentType: "internal",
      isAreaManager: "no"
    },
    {
      people: [],
      areas: []
    }
  ).warnings,
  [
    "A pessoa sera cadastrada sem gestor direto definido.",
    "Quem trabalha 100% home office nao participa do feedback indireto."
  ],
  "Fluxo de pessoa deve alertar sobre gestor ausente e impacto do home office"
);
assert.deepEqual(
  getUserConsistencyMessages(
    {
      roleKey: "employee",
      status: "inactive"
    },
    {
      selectedPerson: { name: "Maria" },
      suggestedRole: "manager"
    }
  ).warnings,
  [
    "O perfil escolhido difere do sugerido para Maria. Revise antes de salvar.",
    "Este acesso nascera inativo e a pessoa nao conseguira entrar ate nova liberacao."
  ],
  "Fluxo de usuario deve alertar sobre perfil divergente e acesso inativo"
);
assert.equal(
  validateUserPayload(
    {
      personId: "person_1",
      email: "invalido",
      password: "123456",
      roleKey: "employee",
      status: "active"
    },
    { requirePassword: true }
  ),
  "Informe um email valido.",
  "Cadastro de usuario deve bloquear email invalido"
);

const employeeCapabilities = getCapabilities({ roleKey: "employee" });
assert.equal(employeeCapabilities.canViewDashboard, false);
assert.equal(employeeCapabilities.canViewAuditTrail, false);
assert.equal(employeeCapabilities.canViewEvaluationInsights, false);
assert.equal(employeeCapabilities.canViewPeople, false);
assert.equal(employeeCapabilities.canReceiveManagerFeedback, true);

const managerCapabilities = getCapabilities("manager");
assert.equal(managerCapabilities.canViewDashboard, true);
assert.equal(managerCapabilities.canViewAuditTrail, true);
assert.equal(managerCapabilities.canViewEvaluationInsights, true);
assert.equal(managerCapabilities.canViewTeamDevelopment, true);
assert.equal(managerCapabilities.canViewUsersAdmin, false);

const hrCapabilities = getCapabilities({ roleKey: "hr" });
assert.equal(hrCapabilities.canManageCycles, true);
assert.equal(hrCapabilities.canViewAuditTrail, true);
assert.equal(hrCapabilities.canViewEvaluationLibrary, true);
assert.equal(hrCapabilities.canViewOrganizationDevelopment, true);

assert.deepEqual(
  validateEvaluationAnswerForm({
    template: {
      questions: [
        {
          id: "q1",
          isRequired: true,
          inputType: "text",
          dimensionTitle: "Pergunta aberta",
          prompt: "Explique."
        }
      ]
    },
    answerForm: { q1: { textValue: "" } }
  }).ok,
  false,
  "Validacao deve bloquear texto obrigatorio vazio"
);
assert.deepEqual(
  validateEvaluationAnswerForm({
    template: {
      questions: [
        {
          id: "q1",
          isRequired: true,
          inputType: "scale",
          dimensionTitle: "Nota",
          prompt: "Avalie.",
          collectEvidenceOnExtreme: true
        }
      ]
    },
    answerForm: { q1: { score: 5, evidenceNote: "" } }
  }).ok,
  false,
  "Validacao deve exigir evidencia em notas extremas quando configurado"
);

console.log("Frontend shared helper tests passed.");
