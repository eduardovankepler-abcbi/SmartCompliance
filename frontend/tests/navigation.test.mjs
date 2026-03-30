import assert from "node:assert/strict";
import { buildAppHash, parseAppHash } from "../src/appRoute.js";
import {
  getFallbackSectionKey,
  getPreferredSectionKey,
  getSectionStatusLabel,
  getVisibleSections
} from "../src/navigation.js";

const sections = [
  { key: "Dashboard" },
  { key: "Compliance" },
  { key: "Avaliacoes" },
  { key: "Desenvolvimento" },
  { key: "Aplause" },
  { key: "Pessoas" },
  { key: "Usuarios" }
];

const employeeSections = getVisibleSections(sections, {
  roleKey: "employee",
  canViewDashboard: false,
  canViewPeople: false,
  canViewUsersAdmin: false
});

assert.deepEqual(
  employeeSections.map((section) => section.key),
  ["Compliance", "Avaliacoes", "Desenvolvimento", "Aplause"],
  "Colaborador deve ver apenas os fluxos essenciais do seu dia a dia"
);
assert.equal(
  getFallbackSectionKey(employeeSections, "Dashboard"),
  "Avaliacoes",
  "Fallback de colaborador deve priorizar Avaliacoes"
);
assert.equal(
  getPreferredSectionKey("employee"),
  "Avaliacoes",
  "Colaborador deve iniciar pela jornada de avaliacao"
);

const adminSections = getVisibleSections(sections, {
  roleKey: "admin",
  canViewDashboard: true,
  canViewPeople: true,
  canViewUsersAdmin: true
});

assert.equal(
  getFallbackSectionKey(adminSections, "Dashboard"),
  "Dashboard",
  "Admin deve manter Dashboard como fallback principal"
);

const managerSections = getVisibleSections(sections, {
  roleKey: "manager",
  canViewDashboard: true,
  canViewPeople: true,
  canViewUsersAdmin: false
});

assert.deepEqual(
  managerSections.map((section) => section.key),
  ["Dashboard", "Avaliacoes", "Desenvolvimento", "Aplause", "Pessoas"],
  "Gestor deve ver apenas os modulos relevantes para gestao de equipe"
);

const complianceSections = getVisibleSections(sections, {
  roleKey: "compliance",
  canViewDashboard: true,
  canViewPeople: false,
  canViewUsersAdmin: false
});

assert.deepEqual(
  complianceSections.map((section) => section.key),
  ["Dashboard", "Compliance", "Avaliacoes"],
  "Compliance deve ter foco em canal, tratamento e leitura do ciclo"
);
assert.equal(
  getPreferredSectionKey("compliance"),
  "Compliance",
  "Perfil de compliance deve iniciar pela operacao da fila"
);
assert.equal(
  getSectionStatusLabel({
    activeSection: "Compliance",
    roleKey: "compliance",
    summaryMode: "executive"
  }),
  "Operacao de compliance",
  "Contexto do topo deve refletir a jornada do perfil"
);
assert.equal(
  getSectionStatusLabel({
    activeSection: "Usuarios",
    roleKey: "admin",
    summaryMode: "executive"
  }),
  "Administracao do ambiente",
  "Area administrativa deve explicitar seu contexto operacional"
);

assert.deepEqual(
  parseAppHash("#/avaliacoes/empresa/responder", {
    fallbackSectionKey: "Dashboard",
    canViewEvaluationInsights: false
  }),
  {
    sectionKey: "Avaliacoes",
    evaluationModuleKey: "company",
    evaluationWorkspace: "respond"
  },
  "Hash de avaliacao deve abrir o submodulo correto"
);

assert.deepEqual(
  parseAppHash("#/avaliacoes/lider/leituras", {
    fallbackSectionKey: "Dashboard",
    canViewEvaluationInsights: false
  }),
  {
    sectionKey: "Avaliacoes",
    evaluationModuleKey: "leader",
    evaluationWorkspace: "respond"
  },
  "Perfil sem leitura estrategica deve cair em responder"
);

assert.deepEqual(
  parseAppHash("#/avaliacoes/feedback-direto/operacao", {
    fallbackSectionKey: "Dashboard",
    canViewEvaluationInsights: false,
    canViewEvaluationOperations: true
  }),
  {
    sectionKey: "Avaliacoes",
    evaluationModuleKey: "peer",
    evaluationWorkspace: "operations"
  },
  "Operacao deve abrir apenas para perfis com acesso operacional"
);

assert.equal(
  buildAppHash({
    sectionKey: "Avaliacoes",
    evaluationModuleKey: "peer",
    evaluationWorkspace: "insights",
    canViewEvaluationInsights: true
  }),
  "#/avaliacoes/feedback-direto/leituras",
  "Rota de Avaliacoes deve serializar modulo e workspace"
);

assert.equal(
  buildAppHash({
    sectionKey: "Avaliacoes",
    evaluationModuleKey: "manager",
    evaluationWorkspace: "operations",
    canViewEvaluationInsights: false,
    canViewEvaluationOperations: true
  }),
  "#/avaliacoes/feedback-lider/operacao",
  "Workspace operacional deve ter rota propria"
);

console.log("Frontend navigation tests passed.");
