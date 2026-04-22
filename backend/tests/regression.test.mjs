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

async function sendJson(baseUrl, path, { method = "POST", headers = {}, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
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
  const managerRevieweeEmployee = await store.findUserByEmail("colaborador2@demo.local");

  assert.ok(
    admin && manager && hr && compliance && employee && managerRevieweeEmployee,
    "Usuarios demo obrigatorios"
  );

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
  assert.ok(
    Array.isArray(adminDashboard.payload.satisfactionQuestionAnalytics),
    "Dashboard deve retornar leitura de satisfacao por pergunta"
  );
  assert.ok(
    adminDashboard.payload.satisfactionQuestionAnalytics.every(
      (question) => Array.isArray(question.periods) && Array.isArray(question.areas)
    ),
    "Leitura de satisfacao deve permitir comparacao temporal e filtro por area"
  );
  assert.ok(
    adminDashboard.payload.performanceHealth === null ||
      Array.isArray(adminDashboard.payload.performanceHealth.areaSeries),
    "Dashboard deve retornar desempenho 360 macro por area quando houver dados"
  );
  assert.ok(
    adminDashboard.payload.performanceHealth === null ||
      Array.isArray(adminDashboard.payload.performanceHealth.recommendations),
    "Dashboard deve retornar recomendacoes profilaticas agregadas quando houver dados"
  );

  const complianceDashboard = await fetchJson(
    baseUrl,
    "/api/dashboards/overview",
    getAuthHeader(compliance.id)
  );
  assert.equal(
    complianceDashboard.response.status,
    403,
    "Compliance nao deve acessar o dashboard executivo"
  );

  const complianceCycles = await fetchJson(
    baseUrl,
    "/api/evaluations/cycles",
    getAuthHeader(compliance.id)
  );
  assert.equal(
    complianceCycles.response.status,
    403,
    "Compliance nao deve acessar o workspace de avaliacoes"
  );

  const complianceApplause = await fetchJson(
    baseUrl,
    "/api/applause",
    getAuthHeader(compliance.id)
  );
  assert.equal(
    complianceApplause.response.status,
    403,
    "Compliance nao deve acessar o workspace de Aplause"
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

  const selfTemplateFallback = await store.getEvaluationTemplateForCycleRelationship(
    createdCycle.id,
    "self"
  );
  assert.ok(
    Array.isArray(selfTemplateFallback.questions) && selfTemplateFallback.questions.length > 0,
    "Ciclo com biblioteca customizada deve manter fallback da autoavaliacao padrao"
  );

  const managerTemplateFallback = await store.getEvaluationTemplateForCycleRelationship(
    createdCycle.id,
    "manager"
  );
  assert.equal(
    managerTemplateFallback.modelName,
    "Feedback do lider sobre o colaborador",
    "Feedback do lider deve usar template gerencial proprio"
  );
  assert.equal(
    managerTemplateFallback.questions.length,
    20,
    "Template gerencial deve expor o conjunto completo de perguntas padrao"
  );
  assert.equal(
    managerTemplateFallback.policy.scale[0].label,
    "Muito abaixo do esperado",
    "Template gerencial deve usar escala de desempenho"
  );

  const crossFunctionalTemplateFallback = await store.getEvaluationTemplateForCycleRelationship(
    createdCycle.id,
    "cross-functional"
  );
  assert.equal(
    crossFunctionalTemplateFallback.modelName,
    "Feedback transversal organizacional",
    "Feedback transversal deve usar template proprio"
  );
  assert.equal(
    crossFunctionalTemplateFallback.questions.length,
    14,
    "Template transversal deve expor o conjunto enxuto de perguntas"
  );
  assert.equal(
    crossFunctionalTemplateFallback.policy.scale[0].label,
    "Muito insatisfeito",
    "Template transversal deve usar escala de percepcao organizacional"
  );

  const releasedCycles = await store.getEvaluationCycles();
  const cycleForManagerResponse = releasedCycles[0];
  assert.ok(cycleForManagerResponse, "Precisa existir pelo menos um ciclo para teste de envio");
  if (cycleForManagerResponse.status !== "Liberado") {
    await store.updateEvaluationCycleStatus(cycleForManagerResponse.id, "Liberado", admin);
  }

  const managerAssignments = await store.getEvaluationAssignmentsForUser(manager.id);
  const managerFeedbackAssignment = managerAssignments.find(
    (assignment) =>
      assignment.cycleId === cycleForManagerResponse.id && assignment.relationshipType === "manager"
  );
  assert.ok(managerFeedbackAssignment, "Gestor precisa ter um assignment de feedback do lider");

  const managerFeedbackDetail = await store.getEvaluationAssignmentById(
    managerFeedbackAssignment.id,
    manager.id
  );
  assert.ok(managerFeedbackDetail, "Detalhe do assignment do gestor precisa carregar template");

  const managerTemplate = await store.getEvaluationTemplateForCycleRelationship(
    managerFeedbackDetail.cycleId,
    "manager"
  );

  const managerAnswers = managerTemplate.questions.map((question) => {
    if (question.inputType === "text") {
      return {
        questionId: question.id,
        score: null,
        evidenceNote: "",
        textValue: "ok",
        selectedOptions: []
      };
    }

    if (question.inputType === "multi-select") {
      const option = (question.options || [])[0]?.value || "";
      return {
        questionId: question.id,
        score: null,
        evidenceNote: "",
        textValue: "",
        selectedOptions: option ? [option] : []
      };
    }

    return {
      questionId: question.id,
      score: 3,
      evidenceNote: "",
      textValue: "",
      selectedOptions: []
    };
  });

  const managerSubmission = await store.submitEvaluationAssignment({
    assignmentId: managerFeedbackAssignment.id,
    reviewerUserId: manager.id,
    answers: managerAnswers,
    strengthsNote: "ok",
    developmentNote: "ok"
  });
  assert.ok(managerSubmission.id, "Envio de feedback do lider deve gerar submission");

  const employeePerformance = await fetchJson(
    baseUrl,
    "/api/evaluations/performance-360",
    getAuthHeader(managerRevieweeEmployee.id)
  );
  assert.equal(
    employeePerformance.response.status,
    200,
    "Colaborador deve acessar a propria avaliacao 360"
  );
  assert.ok(
    employeePerformance.payload.every((item) => item.personId === managerRevieweeEmployee.personId),
    "Colaborador deve visualizar somente a propria performance"
  );

  const managerPerformance = await fetchJson(
    baseUrl,
    "/api/evaluations/performance-360",
    getAuthHeader(manager.id)
  );
  assert.equal(
    managerPerformance.response.status,
    200,
    "Gestor deve acessar performance da propria equipe"
  );
  assert.ok(
    managerPerformance.payload.some((item) => item.personId === managerRevieweeEmployee.personId),
    "Gestor deve visualizar a performance do reporte direto"
  );

  const hrPerformance = await fetchJson(
    baseUrl,
    "/api/evaluations/performance-360",
    getAuthHeader(hr.id)
  );
  assert.equal(
    hrPerformance.response.status,
    403,
    "RH nao deve acessar a nota individual de performance 360"
  );

  const employeeReceivedFeedback = await fetchJson(
    baseUrl,
    "/api/evaluations/received-feedback",
    getAuthHeader(managerRevieweeEmployee.id)
  );
  assert.equal(
    employeeReceivedFeedback.response.status,
    200,
    "Colaborador deve acessar o feedback recebido do lider"
  );
  assert.ok(
    employeeReceivedFeedback.payload.some((item) => item.id === managerSubmission.id),
    "Feedback do lider enviado deve aparecer para o colaborador"
  );

  const acknowledgementMissingNote = await sendJson(
    baseUrl,
    `/api/evaluations/responses/${managerSubmission.id}/acknowledgement`,
    {
      method: "PATCH",
      headers: getAuthHeader(managerRevieweeEmployee.id),
      body: {
        status: "disagreed",
        note: ""
      }
    }
  );
  assert.equal(
    acknowledgementMissingNote.response.status,
    400,
    "Discordancia sem justificativa deve ser bloqueada"
  );

  const acknowledgementResponse = await sendJson(
    baseUrl,
    `/api/evaluations/responses/${managerSubmission.id}/acknowledgement`,
    {
      method: "PATCH",
      headers: getAuthHeader(managerRevieweeEmployee.id),
      body: {
        status: "disagreed",
        note: "Quero discutir alguns pontos do feedback em mais detalhe."
      }
    }
  );
  assert.equal(
    acknowledgementResponse.response.status,
    200,
    "Colaborador deve conseguir registrar discordancia justificada"
  );
  assert.equal(
    acknowledgementResponse.payload.revieweeAcknowledgementStatus,
    "disagreed",
    "API deve persistir o status de discordancia"
  );
  assert.ok(
    acknowledgementResponse.payload.revieweeAcknowledgedAt,
    "Registro de retorno do colaborador deve armazenar data"
  );

  const toggleCycle = await store.createEvaluationCycle(
    {
      title: "Ciclo toggle",
      semesterLabel: "2026.99",
      dueDate: "2026-12-31",
      targetGroup: "Todos os colaboradores",
      createdByUserId: admin.id
    },
    admin
  );
  await store.updateEvaluationCycleStatus(toggleCycle.id, "Liberado", admin);

  const employeeAssignmentsForToggle = await store.getEvaluationAssignmentsForUser(employee.id);
  const selfAssignmentForToggle = employeeAssignmentsForToggle.find(
    (assignment) => assignment.cycleId === toggleCycle.id && assignment.relationshipType === "self"
  );
  assert.ok(selfAssignmentForToggle, "Novo ciclo precisa gerar assignment de autoavaliacao");

  await store.updateEvaluationCycleConfig(
    toggleCycle.id,
    { moduleAvailability: { self: false } },
    admin
  );

  const employeeAssignmentsAfterToggle = await store.getEvaluationAssignmentsForUser(employee.id);
  assert.equal(
    employeeAssignmentsAfterToggle.some((assignment) => assignment.id === selfAssignmentForToggle.id),
    false,
    "Assignment desativado nao pode aparecer para o colaborador"
  );

  const selfDetailAfterToggle = await store.getEvaluationAssignmentById(
    selfAssignmentForToggle.id,
    employee.id
  );
  assert.equal(
    selfDetailAfterToggle,
    null,
    "Assignment desativado nao deve carregar detalhe"
  );

  const createdCycleStructure = await store.getEvaluationCycleParticipants(createdCycle.id);
  assert.ok(
    createdCycleStructure.participants.length > 0,
    "Novo ciclo deve materializar participantes formais"
  );
  assert.ok(
    createdCycleStructure.participants.some((participant) => participant.totalRaters > 0),
    "Participantes do ciclo devem trazer avaliadores relacionados"
  );
  assert.ok(
    createdCycleStructure.relationshipSummary.some(
      (entry) => entry.relationshipType === "client-internal"
    ),
    "Novo ciclo deve materializar grupo de cliente interno"
  );
  assert.ok(
    createdCycleStructure.relationshipSummary.some(
      (entry) => entry.relationshipType === "client-external"
    ),
    "Novo ciclo deve materializar grupo de cliente externo"
  );

  const cycleParticipantsResponse = await fetchJson(
    baseUrl,
    `/api/evaluations/cycles/${createdCycle.id}/participants`,
    getAuthHeader(hr.id)
  );
  assert.equal(
    cycleParticipantsResponse.response.status,
    200,
    "RH deve acessar a estrutura de participantes do ciclo"
  );
  assert.equal(
    cycleParticipantsResponse.payload.cycle.id,
    createdCycle.id,
    "API de participantes deve retornar o ciclo solicitado"
  );

  await store.updateEvaluationCycleStatus(createdCycle.id, "Liberado", admin);
  const processedCompanyTemplate = await store.getEvaluationTemplateForCycleRelationship(
    createdCycle.id,
    "company"
  );

  for (const reviewer of [employee, await store.findUserByEmail("colaborador2@demo.local"), await store.findUserByEmail("consultor1@demo.local")]) {
    const reviewerAssignments = await store.getEvaluationAssignmentsForUser(reviewer.id);
    const companyAssignment = reviewerAssignments.find(
      (assignment) => assignment.cycleId === createdCycle.id && assignment.relationshipType === "company"
    );

    assert.ok(companyAssignment, "Cada avaliador de teste precisa receber assignment institucional");

    await store.submitEvaluationAssignment({
      assignmentId: companyAssignment.id,
      reviewerUserId: reviewer.id,
      answers: processedCompanyTemplate.questions.map((question) => ({
        questionId: question.id,
        score: question.inputType === "scale" ? 4 : null,
        evidenceNote: "",
        textValue: question.inputType === "text" ? "Resposta automatizada de regressao." : "",
        selectedOptions:
          question.inputType === "multi-select" ? [question.options?.[0]?.value].filter(Boolean) : []
      })),
      strengthsNote: "",
      developmentNote: ""
    });
  }

  const employeeAfterCompanySurvey = (await store.getPeople(admin)).find(
    (person) => person.id === employee.personId
  );
  assert.equal(
    employeeAfterCompanySurvey?.satisfactionScore,
    4,
    "Score de satisfacao deve refletir a pesquisa institucional respondida"
  );

  await store.updateEvaluationCycleStatus(createdCycle.id, "Encerrado", admin);
  await store.updateEvaluationCycleStatus(createdCycle.id, "Processado", admin);

  const processedCycles = await store.getEvaluationCycles();
  const processedCycle = processedCycles.find((cycle) => cycle.id === createdCycle.id);
  assert.equal(processedCycle.status, "Processado", "Ciclo deve aceitar status processado");
  assert.ok(
    processedCycle.reportSnapshotCount > 0,
    "Ciclo processado deve registrar snapshots de relatorio"
  );

  const processedResponses = await store.getEvaluationResponses(admin);
  assert.ok(
    processedResponses.reportSnapshots.some((snapshot) => snapshot.cycleId === createdCycle.id),
    "Bundle de respostas deve expor snapshots do ciclo processado"
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

  await assert.rejects(
    () =>
      store.createDevelopmentPlan(
        {
          personId: employee.personId,
          cycleId: createdCycle.id,
          competencyId: "cmp_communication",
          focusTitle: "Evoluir comunicacao com stakeholders",
          actionText: "Conduzir checkpoints quinzenais com pauta e resumo de riscos.",
          dueDate: "2026-08-15",
          expectedEvidence: "Atas publicadas e feedback do gestor sobre clareza."
        },
        employee
      ),
    /gestor, RH ou admin/,
    "Colaborador nao deve estruturar o proprio PDI"
  );

  const createdDevelopmentPlan = await store.createDevelopmentPlan(
    {
      personId: managerRevieweeEmployee.personId,
      cycleId: createdCycle.id,
      competencyId: "cmp_communication",
      focusTitle: "Evoluir comunicacao com stakeholders",
      actionText: "Conduzir checkpoints quinzenais com pauta e resumo de riscos.",
      dueDate: "2026-08-15",
      expectedEvidence: "Atas publicadas e feedback do gestor sobre clareza."
    },
    manager
  );

  const completedDevelopmentPlan = await store.updateDevelopmentPlan(
    createdDevelopmentPlan.id,
    {
      personId: managerRevieweeEmployee.personId,
      cycleId: createdCycle.id,
      competencyId: "cmp_communication",
      focusTitle: "Evoluir comunicacao com stakeholders",
      actionText: "Conduzir checkpoints quinzenais com pauta e resumo de riscos.",
      dueDate: "2026-08-15",
      expectedEvidence: "Atas publicadas e feedback do gestor sobre clareza.",
      status: "completed"
    },
    manager
  );

  assert.equal(
    completedDevelopmentPlan.status,
    "completed",
    "Gestor deve poder concluir o PDI do reporte"
  );

  const progressDevelopmentPlan = await store.updateDevelopmentPlanProgress(
    createdDevelopmentPlan.id,
    {
      progressStatus: "in_progress",
      progressNote: "Primeiro checkpoint realizado e evidencias em coleta."
    },
    managerRevieweeEmployee
  );

  assert.equal(
    progressDevelopmentPlan.progressStatus,
    "in_progress",
    "Colaborador deve reportar andamento do proprio PDI"
  );
  assert.ok(
    progressDevelopmentPlan.progressUpdatedAt,
    "Reporte de andamento deve registrar data de atualizacao"
  );

  const progressApiResponse = await sendJson(
    baseUrl,
    `/api/development/plans/${createdDevelopmentPlan.id}/progress`,
    {
      method: "PATCH",
      headers: getAuthHeader(managerRevieweeEmployee.id),
      body: {
        progressStatus: "blocked",
        progressNote: "Aguardando agenda com stakeholders para validar o proximo passo."
      }
    }
  );
  assert.equal(
    progressApiResponse.response.status,
    200,
    "API deve permitir reporte de andamento pelo colaborador"
  );
  assert.equal(
    progressApiResponse.payload.progressStatus,
    "blocked",
    "API deve retornar o andamento atualizado do PDI"
  );

  const employeeDevelopmentPlans = await store.getDevelopmentPlans(managerRevieweeEmployee);
  assert.ok(
    employeeDevelopmentPlans.some((plan) => plan.id === createdDevelopmentPlan.id),
    "Colaborador deve visualizar o proprio PDI"
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

  const createdArea = await store.createArea(
    {
      name: "Area Lideranca Teste",
      managerPersonId: null
    },
    admin
  );

  const createdPerson = await store.createPerson(
    {
      name: "  Pessoa Homologacao  ",
      roleTitle: "  Analista de Testes  ",
      area: createdArea.name,
      workUnit: "Sao Paulo",
      workMode: "hybrid",
      managerPersonId: manager.personId,
      employmentType: "internal",
      isAreaManager: true
    },
    admin
  );

  assert.equal(
    createdPerson.satisfactionScore,
    null,
    "Cadastro de pessoa nao deve aceitar score manual; o valor nasce sem pesquisa"
  );
  assert.equal(createdPerson.name, "Pessoa Homologacao", "Cadastro deve normalizar o nome");
  assert.equal(
    createdPerson.roleTitle,
    "Analista de Testes",
    "Cadastro deve normalizar o cargo"
  );
  assert.equal(createdPerson.workUnit, "Sao Paulo", "Pessoa deve manter unidade de trabalho");
  assert.equal(createdPerson.workMode, "hybrid", "Pessoa deve manter modalidade de trabalho");
  assert.equal(
    createdPerson.areaManagerPersonId,
    createdPerson.id,
    "Cadastro de pessoa deve permitir marcar lider da area no mesmo fluxo"
  );

  const areaAfterLeaderAssignment = (await store.getAreas(admin)).find(
    (area) => area.name === createdArea.name
  );
  assert.equal(
    areaAfterLeaderAssignment?.managerPersonId,
    createdPerson.id,
    "Area deve passar a apontar para a pessoa criada como lider"
  );

  const renamedArea = await store.updateArea(
    createdArea.id,
    {
      name: "Area Lideranca Teste Renomeada"
    },
    admin
  );
  assert.equal(
    renamedArea.managerPersonId,
    createdPerson.id,
    "Renomear a area nao deve remover a lideranca ja definida"
  );

  const updatedPersonWithoutLeadership = await store.updatePerson(
    createdPerson.id,
    {
      name: createdPerson.name,
      roleTitle: createdPerson.roleTitle,
      area: renamedArea.name,
      workUnit: createdPerson.workUnit,
      workMode: createdPerson.workMode,
      managerPersonId: createdPerson.managerPersonId,
      employmentType: createdPerson.employmentType,
      isAreaManager: false
    },
    admin
  );
  assert.equal(
    updatedPersonWithoutLeadership.areaManagerPersonId,
    null,
    "Edicao da pessoa deve permitir remover a lideranca da area"
  );

  await assert.rejects(
    () =>
      store.createPerson(
        {
          name: createdPerson.name,
          roleTitle: createdPerson.roleTitle,
          area: renamedArea.name,
          workUnit: createdPerson.workUnit,
          workMode: createdPerson.workMode,
          managerPersonId: manager.personId,
          employmentType: createdPerson.employmentType
        },
        admin
      ),
    /mesmo nome, area e cargo/i,
    "Cadastro deve bloquear duplicidade exata de nome, area e cargo"
  );

  const cycleArea = await store.createArea(
    {
      name: "Area Ciclo Hierarquia",
      managerPersonId: null
    },
    admin
  );

  const cycleLeader = await store.createPerson(
    {
      name: "Pessoa Ciclo Lider",
      roleTitle: "Coordenador",
      area: cycleArea.name,
      workUnit: "Curitiba",
      workMode: "hybrid",
      managerPersonId: manager.personId,
      employmentType: "internal"
    },
    admin
  );

  const cycleAnalyst = await store.createPerson(
    {
      name: "Pessoa Ciclo Analista",
      roleTitle: "Analista",
      area: cycleArea.name,
      workUnit: "Curitiba",
      workMode: "hybrid",
      managerPersonId: cycleLeader.id,
      employmentType: "internal"
    },
    admin
  );

  await assert.rejects(
    () =>
      store.updatePerson(
        cycleLeader.id,
        {
          name: cycleLeader.name,
          roleTitle: cycleLeader.roleTitle,
          area: cycleLeader.area,
          workUnit: cycleLeader.workUnit,
          workMode: cycleLeader.workMode,
          managerPersonId: cycleAnalyst.id,
          employmentType: cycleLeader.employmentType,
          isAreaManager: false
        },
        admin
      ),
    /ciclo de gestao invalido/i,
    "Edicao deve bloquear ciclos na hierarquia de gestao"
  );

  const remotePerson = await store.createPerson(
    {
      name: "Pessoa Remota Teste",
      roleTitle: "Consultor Remoto",
      area: "Consultoria",
      workUnit: "Sao Paulo",
      workMode: "remote",
      managerPersonId: manager.personId,
      employmentType: "consultant"
    },
    admin
  );
  const remoteUser = await store.createUser(
    {
      personId: remotePerson.id,
      email: "  REMOTO.TESTE@DEMO.LOCAL  ",
      password: "demo123",
      roleKey: "employee",
      status: "active"
    },
    admin
  );
  assert.equal(
    remoteUser.email,
    "remoto.teste@demo.local",
    "Cadastro de usuario deve normalizar email"
  );
  const updatedRemoteUser = await store.updateUser(
    remoteUser.id,
    {
      email: "remoto.lider@demo.local",
      roleKey: "manager",
      status: "active",
      password: "nova123"
    },
    admin
  );
  assert.equal(updatedRemoteUser.email, "remoto.lider@demo.local");
  assert.equal(updatedRemoteUser.roleKey, "manager");
  assert.equal(updatedRemoteUser.status, "active");

  const rioPerson = await store.createPerson(
    {
      name: "Pessoa Unidade Rio",
      roleTitle: "Analista Rio",
      area: "Consultoria",
      workUnit: "Rio de Janeiro",
      workMode: "onsite",
      managerPersonId: manager.personId,
      employmentType: "internal"
    },
    admin
  );
  await store.createUser(
    {
      personId: rioPerson.id,
      email: "rio.teste@demo.local",
      password: "demo123",
      roleKey: "employee",
      status: "active"
    },
    admin
  );
  const managedCrossAreaPerson = await store.createPerson(
    {
      name: "Pessoa sob gestao cruzada",
      roleTitle: "Analista de Consultoria",
      area: "Consultoria",
      workUnit: "Sao Paulo",
      workMode: "onsite",
      managerPersonId: employee.personId,
      employmentType: "internal"
    },
    admin
  );
  const managedCrossAreaUser = await store.createUser(
    {
      personId: managedCrossAreaPerson.id,
      email: "gestao.cruzada@demo.local",
      password: "demo123",
      roleKey: "employee",
      status: "active"
    },
    admin
  );

  const workContextCycle = await store.createEvaluationCycle(
    {
      title: "Ciclo por unidade",
      semesterLabel: "2026.3",
      dueDate: "2026-11-30",
      targetGroup: "Todos os colaboradores",
      createdByUserId: admin.id
    },
    admin
  );
  const workContextStructure = await store.getEvaluationCycleParticipants(workContextCycle.id);
  const remoteParticipant = workContextStructure.participants.find(
    (participant) => participant.personId === remotePerson.id
  );
  assert.ok(remoteParticipant, "Pessoa remota deve participar do ciclo");
  assert.equal(
    remoteParticipant.personWorkUnit,
    "Sao Paulo",
    "Estrutura do ciclo deve expor a unidade do participante"
  );
  assert.equal(
    remoteParticipant.personWorkMode,
    "remote",
    "Estrutura do ciclo deve expor a modalidade do participante"
  );
  assert.equal(
    remoteParticipant.raters.some((rater) => rater.relationshipType === "cross-functional"),
    false,
    "Pessoa 100% remota nao deve ser avaliada no Feedback transversal"
  );
  assert.equal(
    workContextStructure.participants.some((participant) =>
      participant.raters.some(
        (rater) =>
          rater.relationshipType === "cross-functional" && rater.raterUserId === remoteUser.id
      )
    ),
    false,
    "Pessoa 100% remota nao deve avaliar no Feedback transversal"
  );

  const rioParticipant = workContextStructure.participants.find(
    (participant) => participant.personId === rioPerson.id
  );
  assert.ok(rioParticipant, "Pessoa de outra unidade deve participar do ciclo");
  assert.equal(
    rioParticipant.raters.some((rater) => rater.relationshipType === "cross-functional"),
    false,
    "Pessoa sem colegas da mesma unidade nao deve receber Feedback transversal"
  );
  assert.ok(
    workContextStructure.transversal.eligible.some(
      (person) => person.personId === employee.personId
    ),
    "Operacao do ciclo deve listar elegiveis do Feedback transversal"
  );
  assert.ok(
    workContextStructure.transversal.ineligible.some(
      (person) => person.personId === remotePerson.id
    ),
    "Operacao do ciclo deve listar pessoas sem pareamento elegivel"
  );
  assert.equal(
    workContextStructure.participants
      .find((participant) => participant.personId === employee.personId)
      ?.raters.some(
        (rater) =>
          rater.relationshipType === "cross-functional" && rater.raterUserId === managedCrossAreaUser.id
      ),
    false,
    "Feedback transversal nao deve parear gestor direto e liderado"
  );

  await store.createArea({ name: "Produto" }, admin);
  await store.createArea({ name: "Suporte" }, admin);

  const productPerson = await store.createPerson(
    {
      name: "Pessoa Produto Sao Paulo",
      roleTitle: "Analista de Produto",
      area: "Produto",
      workUnit: "Sao Paulo",
      workMode: "onsite",
      managerPersonId: manager.personId,
      employmentType: "internal"
    },
    admin
  );
  await store.createUser(
    {
      personId: productPerson.id,
      email: "produto.sp@demo.local",
      password: "demo123",
      roleKey: "employee",
      status: "active"
    },
    admin
  );

  const supportPerson = await store.createPerson(
    {
      name: "Pessoa Suporte Sao Paulo",
      roleTitle: "Analista de Suporte",
      area: "Suporte",
      workUnit: "Sao Paulo",
      workMode: "onsite",
      managerPersonId: manager.personId,
      employmentType: "internal"
    },
    admin
  );
  await store.createUser(
    {
      personId: supportPerson.id,
      email: "suporte.sp@demo.local",
      password: "demo123",
      roleKey: "employee",
      status: "active"
    },
    admin
  );

  const transversalConfigCycle = await store.createEvaluationCycle(
    {
      title: "Ciclo transversal parametrizado",
      semesterLabel: "2026.4",
      dueDate: "2026-12-15",
      targetGroup: "Todos os colaboradores",
      createdByUserId: admin.id
    },
    admin
  );
  await store.updateEvaluationCycleConfig(
    transversalConfigCycle.id,
    {
      transversalConfig: {
        defaultReviewersPerPerson: 2,
        unitOverrides: {
          "Sao Paulo": 2
        }
      }
    },
    admin
  );
  const transversalConfigStructure = await store.getEvaluationCycleParticipants(
    transversalConfigCycle.id
  );
  assert.equal(
    transversalConfigStructure.transversal.config.defaultReviewersPerPerson,
    2,
    "Configuracao transversal deve ficar persistida no ciclo"
  );
  assert.ok(
    (transversalConfigStructure.transversal.pairings || []).some(
      (pairing) =>
        pairing.reviewerUserId === employee.id &&
        pairing.revieweePersonId !== employee.personId
    ),
    "Pareamento transversal deve continuar gerando assignments apos configuracao"
  );
  assert.ok(
    (transversalConfigStructure.transversal.indicators?.coverageRate || 0) > 0,
    "Operacao do ciclo deve expor indicador historico/cobertura do Feedback transversal"
  );

  const employeeActor = await store.getUserById(employee.id);
  await assert.rejects(
    () =>
      store.createFeedbackRequest(
        {
          cycleId: workContextCycle.id,
          providerPersonIds: [rioPerson.id],
          contextNote:
            "Colaboramos em uma frente compartilhada e quero validar a restricao de unidade."
        },
        employeeActor
      ),
    /mesma unidade/i,
    "Feedback direto deve respeitar a mesma unidade de trabalho"
  );

  const overdueCycle = await store.createEvaluationCycle(
    {
      title: "Ciclo inadimplencia",
      semesterLabel: "2026.0",
      dueDate: "2026-03-01",
      targetGroup: "Todos os colaboradores",
      createdByUserId: admin.id
    },
    admin
  );
  await store.updateEvaluationCycleStatus(overdueCycle.id, "Liberado", admin);

  const overdueStructure = await store.getEvaluationCycleParticipants(overdueCycle.id);
  assert.ok(
    overdueStructure.compliance.delinquentAssignments > 0,
    "Ciclo vencido deve expor assignments inadimplentes"
  );
  assert.ok(
    overdueStructure.compliance.delinquencyRate > 0,
    "Ciclo vencido deve calcular taxa de inadimplencia"
  );
  assert.ok(
    overdueStructure.delinquents.length > 0,
    "Estrutura operacional deve listar inadimplentes"
  );

  const notifyDelinquentsResponse = await sendJson(
    baseUrl,
    `/api/evaluations/cycles/${overdueCycle.id}/notify-delinquents`,
    {
      method: "POST",
      headers: getAuthHeader(hr.id)
    }
  );
  assert.equal(
    notifyDelinquentsResponse.response.status,
    200,
    "RH deve conseguir notificar inadimplentes do ciclo"
  );
  assert.ok(
    notifyDelinquentsResponse.payload.notifiedAssignments > 0,
    "Notificacao deve atingir assignments vencidos"
  );
  assert.ok(
    notifyDelinquentsResponse.payload.delinquentAssignments.every(
      (assignment) => Number(assignment.reminderCount) >= 1
    ),
    "Assignments notificados devem registrar contagem de lembretes"
  );

  const createdCompetency = await store.createCompetency(
    {
      name: "Pensamento sistemico",
      key: "systemic-thinking",
      description: "Capacidade de conectar causas, efeitos e dependencias do processo.",
      status: "active"
    },
    admin
  );

  const updatedCompetency = await store.updateCompetency(
    createdCompetency.id,
    {
      name: "Pensamento sistemico e analitico",
      key: "systemic-thinking",
      description: "Leitura estruturada de cenarios, riscos e interdependencias.",
      status: "active"
    },
    admin
  );

  const competencies = await store.getCompetencies(admin);
  assert.equal(
    updatedCompetency.name,
    "Pensamento sistemico e analitico",
    "Competencia deve permitir manutencao de nome e descricao"
  );
  assert.ok(
    competencies.some((item) => item.id === createdCompetency.id),
    "Cadastro de competencias deve ficar disponivel para governanca do 360"
  );

  const learningIntegrationResponse = await sendJson(
    baseUrl,
    "/api/development/integrations/learning-events",
    {
      headers: getAuthHeader(hr.id),
      body: {
        sourceSystem: "LMS Corporativo",
        events: [
          {
            externalId: "course-001",
            personEmail: "colaborador1@demo.local",
            title: "Gestao de riscos aplicada",
            providerName: "Academia Corporativa",
            status: "completed",
            completedAt: "2026-04-12",
            workloadHours: 8,
            competencyKey: "risk-management"
          }
        ]
      }
    }
  );
  assert.equal(
    learningIntegrationResponse.response.status,
    202,
    "RH deve conseguir receber eventos de cursos e treinamentos"
  );
  assert.equal(
    learningIntegrationResponse.payload.accepted,
    1,
    "Integracao deve enfileirar o evento recebido"
  );
  assert.equal(
    learningIntegrationResponse.payload.events[0].processingStatus,
    "ready_for_review",
    "Evento com email conhecido deve ficar pronto para revisao"
  );

  const appliedLearningIntegrationResponse = await sendJson(
    baseUrl,
    `/api/development/integrations/learning-events/${learningIntegrationResponse.payload.events[0].id}/apply`,
    {
      headers: getAuthHeader(hr.id),
      body: {
        reviewNote: "Aplicacao validada pela regressao"
      }
    }
  );
  assert.equal(
    appliedLearningIntegrationResponse.response.status,
    200,
    "RH deve conseguir aplicar curso concluido no Desenvolvimento"
  );
  assert.equal(
    appliedLearningIntegrationResponse.payload.event.processingStatus,
    "applied",
    "Evento aplicado deve registrar status de processamento"
  );
  assert.equal(
    appliedLearningIntegrationResponse.payload.event.appliedEntityType,
    "development_record",
    "Curso concluido deve virar registro de desenvolvimento"
  );

  const developmentRecordsAfterIntegration = await fetchJson(
    baseUrl,
    "/api/development/records",
    getAuthHeader(hr.id)
  );
  assert.ok(
    developmentRecordsAfterIntegration.payload.some(
      (record) => record.title === "Gestao de riscos aplicada"
    ),
    "Curso aplicado deve aparecer nos registros de desenvolvimento"
  );

  const employeeLearningIntegrationResponse = await sendJson(
    baseUrl,
    "/api/development/integrations/learning-events",
    {
      headers: getAuthHeader(employee.id),
      body: {
        sourceSystem: "LMS Corporativo",
        events: [
          {
            externalId: "course-002",
            personEmail: "colaborador1@demo.local",
            title: "Curso sem permissao",
            status: "completed"
          }
        ]
      }
    }
  );
  assert.equal(
    employeeLearningIntegrationResponse.response.status,
    403,
    "Colaborador nao deve alimentar integracoes de aprendizagem"
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
