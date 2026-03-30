import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { createToken } from "../src/auth/token.js";
import { createStore } from "../src/data/store.js";

function getAuthHeader(userId) {
  return {
    Authorization: `Bearer ${createToken({ userId })}`
  };
}

async function fetchJson(baseUrl, path, headers = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers
  });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

const store = await createStore();
const app = createApp(store);
const server = app.listen(0);

try {
  const address = server.address();
  const baseUrl =
    typeof address === "object" && address?.port
      ? `http://127.0.0.1:${address.port}`
      : "";

  const admin = await store.findUserByEmail("admin@demo.local");
  const manager = await store.findUserByEmail("gestor@demo.local");
  const hr = await store.findUserByEmail("rh@demo.local");
  const compliance = await store.findUserByEmail("compliance@demo.local");
  const employee = await store.findUserByEmail("colaborador1@demo.local");

  assert.ok(admin && manager && hr && compliance && employee, "Usuarios demo obrigatorios");

  const hrResponses = await fetchJson(
    baseUrl,
    "/api/evaluations/responses",
    getAuthHeader(hr.id)
  );
  assert.equal(hrResponses.response.status, 403, "RH nao deve acessar respostas estrategicas");

  const complianceResponses = await fetchJson(
    baseUrl,
    "/api/evaluations/responses",
    getAuthHeader(compliance.id)
  );
  assert.equal(
    complianceResponses.response.status,
    403,
    "Compliance nao deve acessar respostas estrategicas"
  );

  const managerResponses = await fetchJson(
    baseUrl,
    "/api/evaluations/responses",
    getAuthHeader(manager.id)
  );
  assert.equal(managerResponses.response.status, 200, "Gestor deve acessar respostas do time");

  const employeeDashboard = await fetchJson(
    baseUrl,
    "/api/dashboards/overview",
    getAuthHeader(employee.id)
  );
  assert.equal(
    employeeDashboard.response.status,
    403,
    "Colaborador nao deve acessar o dashboard"
  );

  const adminDashboard = await fetchJson(
    baseUrl,
    "/api/dashboards/overview?timeGrouping=year",
    getAuthHeader(admin.id)
  );
  assert.equal(adminDashboard.response.status, 200, "Admin deve acessar o dashboard");
  assert.ok(
    Array.isArray(adminDashboard.payload.cycleTimeline),
    "Dashboard deve retornar consolidado temporal"
  );

  const employeeAudit = await fetchJson(
    baseUrl,
    "/api/audit-trail",
    getAuthHeader(employee.id)
  );
  assert.equal(employeeAudit.response.status, 403, "Colaborador nao deve acessar trilha operacional");

  const complianceAudit = await fetchJson(
    baseUrl,
    "/api/audit-trail",
    getAuthHeader(compliance.id)
  );
  assert.equal(complianceAudit.response.status, 200, "Compliance deve acessar trilha operacional");
  assert.ok(
    complianceAudit.payload.every((entry) => entry.category === "incident"),
    "Compliance deve visualizar apenas auditoria de incidentes"
  );

  const adminAudit = await fetchJson(
    baseUrl,
    "/api/audit-trail?category=cycle",
    getAuthHeader(admin.id)
  );
  assert.equal(adminAudit.response.status, 200, "Admin deve acessar auditoria por categoria");
  assert.ok(
    adminAudit.payload.some((entry) => entry.category === "cycle"),
    "Auditoria deve retornar eventos de ciclo"
  );

  const assignments = await store.getEvaluationAssignmentsForUser(employee.id);
  assert.ok(assignments.length > 0, "Colaborador precisa ter pelo menos um assignment de teste");

  const assignmentDetail = await store.getEvaluationAssignmentById(assignments[0].id, employee.id);
  assert.equal(typeof assignmentDetail.weight, "number", "Assignment detail deve expor weight");
  assert.equal(
    Number.isNaN(assignmentDetail.weight),
    false,
    "weight nao pode resultar em NaN"
  );

  const customLibraryDraft = await store.importCustomLibraryDraft({
    fileName: "biblioteca-customizada.xlsx",
    createdByUserId: admin.id,
    errors: [],
    templates: [
      {
        relationshipType: "company",
        modelName: "Biblioteca de satisfacao customizada",
        description: "Modelo institucional customizado para teste.",
        policy: {
          strategy: "company-upload",
          managerCustomQuestionsLimit: 0,
          confidentiality: "manager-confidential",
          showStrengthsNote: false,
          showDevelopmentNote: false
        },
        questions: [
          {
            id: "custom_company_q1",
            sectionKey: "satisfacao",
            sectionTitle: "Satisfacao customizada",
            sectionDescription: "Perguntas personalizadas do ciclo.",
            dimensionKey: "custom-satisfaction",
            dimensionTitle: "Leitura customizada",
            prompt: "A empresa oferece o suporte que voce precisa para performar bem?",
            helperText: "",
            sortOrder: 1,
            isRequired: true,
            visibility: "shared",
            inputType: "scale",
            scaleProfile: "agreement",
            collectEvidenceOnExtreme: false
          }
        ]
      }
    ],
    summary: {
      templates: 1,
      relationshipTypes: 1,
      questions: 1
    }
  });

  const publishedLibrary = await store.publishCustomLibraryDraft({
    draftId: customLibraryDraft.id,
    name: "Biblioteca customizada de teste",
    description: "Biblioteca criada na regressao.",
    createdByUserId: admin.id
  });

  const createdCycle = await store.createEvaluationCycle(
    {
      libraryId: publishedLibrary.id,
      title: "Ciclo customizado",
      semesterLabel: "2026.2",
      dueDate: "2026-10-15",
      targetGroup: "Todos os colaboradores",
      createdByUserId: admin.id
    },
    admin
  );

  assert.equal(
    createdCycle.libraryId,
    publishedLibrary.id,
    "Novo ciclo deve manter a biblioteca selecionada"
  );

  const cycleTemplate = await store.getEvaluationTemplateForCycleRelationship(
    createdCycle.id,
    "company"
  );
  assert.equal(
    cycleTemplate.modelName,
    "Biblioteca de satisfacao customizada",
    "Ciclo deve carregar o template da biblioteca publicada"
  );

  const createdIncident = await store.createIncident(
    {
      title: "Teste estruturado de compliance",
      category: "Conduta Impropria",
      classification: "Conduta e Relacionamento",
      anonymity: "anonymous",
      reporterLabel: "Anonimo",
      responsibleArea: "Compliance",
      assignedPersonId: compliance.personId,
      description: "Caso de teste para validar area e responsavel."
    },
    admin
  );
  assert.equal(
    createdIncident.responsibleArea,
    "Compliance",
    "Caso deve manter a area responsavel selecionada"
  );
  assert.equal(
    createdIncident.assignedPersonId,
    compliance.personId,
    "Caso deve manter o responsavel designado"
  );

  const createdDevelopmentRecord = await store.createDevelopmentRecord(
    {
      personId: employee.personId,
      recordType: "Curso",
      title: "Programa de Lideranca Situacional",
      providerName: "ABC Academy",
      completedAt: "2026-03-20",
      skillSignal: "Gestao de conflitos",
      notes: "Registro criado para validar manutencao."
    },
    employee
  );

  const archivedDevelopmentRecord = await store.updateDevelopmentRecord(
    createdDevelopmentRecord.id,
    {
      personId: employee.personId,
      recordType: "Curso",
      title: "Programa de Lideranca Situacional",
      providerName: "ABC Academy",
      completedAt: "2026-03-20",
      skillSignal: "Gestao de conflitos",
      notes: "Registro arquivado para teste.",
      status: "archived"
    },
    employee
  );

  assert.equal(
    archivedDevelopmentRecord.status,
    "archived",
    "Registro de desenvolvimento deve permitir arquivamento"
  );
  assert.ok(
    archivedDevelopmentRecord.archivedAt,
    "Registro arquivado deve expor data de arquivamento"
  );

  const createdApplause = await store.createApplauseEntry({
    senderPersonId: employee.personId,
    receiverPersonId: manager.personId,
    category: "Colaboracao",
    impact: "Apoio direto em entrega critica.",
    contextNote: "Reconhecimento criado para validar manutencao administrativa do modulo."
  });

  const updatedApplause = await store.updateApplauseEntry(
    createdApplause.id,
    {
      receiverPersonId: manager.personId,
      category: "Resolucao de problema",
      impact: "Apoio refinado para investigacao de causa raiz.",
      contextNote: "Registro revisado no fluxo administrativo.",
      status: "Arquivado"
    },
    admin
  );

  assert.equal(
    updatedApplause.status,
    "Arquivado",
    "Aplause deve permitir ajuste administrativo de status"
  );
  assert.equal(
    updatedApplause.category,
    "Resolucao de problema",
    "Aplause deve permitir atualizacao de categoria"
  );

  const createdPerson = await store.createPerson(
    {
      name: "Pessoa Homologacao",
      roleTitle: "Analista de Testes",
      area: "Tecnologia",
      managerPersonId: manager.personId,
      employmentType: "internal"
    },
    admin
  );

  assert.equal(
    createdPerson.satisfactionScore,
    4,
    "Cadastro de pessoa sem score manual deve assumir valor padrao"
  );

  console.log("Backend regression tests passed.");
} finally {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}
