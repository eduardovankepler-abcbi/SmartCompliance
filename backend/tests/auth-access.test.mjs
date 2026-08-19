import assert from "node:assert/strict";
import { createTestContext } from "./testContext.mjs";

export async function runAuthAccessRegression() {
  const context = await createTestContext();

  try {
    const { fetchJson, getAuthHeader, sendJson, store } = context;
    const health = await fetchJson("/health");
    assert.equal(health.response.status, 200, "Healthcheck publico deve responder 200");
    assert.equal(health.payload.status, "ok", "Healthcheck deve indicar status ok");
    assert.equal(health.payload.ready, true, "Healthcheck deve indicar prontidao operacional");
    assert.ok(health.payload.checkedAt, "Healthcheck deve informar horario da verificacao");
    assert.ok(
      health.response.headers.get("x-request-id"),
      "Healthcheck deve devolver X-Request-Id para rastreio operacional"
    );

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
    const managerPerson = (await store.getPeople(admin)).find(
      (person) => person.id === manager.personId
    );
    assert.ok(managerPerson, "Pessoa do gestor demo obrigatoria");

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const invalidLogin = await sendJson("/api/auth/login", {
        body: {
          email: "admin@demo.local",
          password: "senha-invalida"
        }
      });
      assert.equal(
        invalidLogin.response.status,
        401,
        "Tentativas invalidas antes do bloqueio devem retornar 401"
      );
    }

    const lockedLogin = await sendJson("/api/auth/login", {
      body: {
        email: "admin@demo.local",
        password: "senha-invalida"
      }
    });
    assert.equal(
      lockedLogin.response.status,
      429,
      "Rate limit de login deve bloquear excesso de tentativas seguidas"
    );
    assert.ok(
      Number(lockedLogin.response.headers.get("retry-after")) >= 1,
      "Bloqueio de login deve informar tempo minimo de espera"
    );

    const validManagerLogin = await sendJson("/api/auth/login", {
      body: {
        email: "gestor@demo.local",
        password: "demo123"
      }
    });
    assert.equal(
      validManagerLogin.response.status,
      200,
      "Rate limit nao deve contaminar logins validos de outro usuario"
    );
    assert.ok(validManagerLogin.payload.token, "Login valido deve emitir token");

    const hrResponses = await fetchJson(
      "/api/evaluations/responses",
      getAuthHeader(hr.id)
    );
    assert.equal(hrResponses.response.status, 200, "RH deve acessar respostas estrategicas");
    assert.ok(
      Array.isArray(hrResponses.payload.individualResponses),
      "Bundle de respostas deve ser retornado para RH"
    );

    const complianceResponses = await fetchJson(
      "/api/evaluations/responses",
      getAuthHeader(compliance.id)
    );
    assert.equal(
      complianceResponses.response.status,
      403,
      "Compliance nao deve acessar respostas estrategicas"
    );

    const managerResponses = await fetchJson(
      "/api/evaluations/responses",
      getAuthHeader(manager.id)
    );
    assert.equal(managerResponses.response.status, 200, "Gestor deve acessar respostas do time");

    const adminBlockedQuestionCreate = await sendJson("/api/evaluations/library/questions", {
      headers: getAuthHeader(admin.id),
      body: {
        relationshipType: "self",
        dimensionKey: "admin-blocked",
        dimensionTitle: "Bloqueio administrativo",
        prompt: "Admin nao deve alterar esta pergunta.",
        sortOrder: 99,
        inputType: "scale",
        scaleProfile: "performance",
        visibility: "shared"
      }
    });
    assert.equal(
      adminBlockedQuestionCreate.response.status,
      403,
      "Somente RH deve alterar perguntas da avaliacao"
    );

    const hrCreatedQuestion = await sendJson("/api/evaluations/library/questions", {
      headers: getAuthHeader(hr.id),
      body: {
        relationshipType: "self",
        dimensionKey: "manual-regression",
        dimensionTitle: "Pergunta manual",
        prompt: "Pergunta criada pelo RH para regressao.",
        sortOrder: 99,
        inputType: "multi-select",
        options: [
          { value: "sim", label: "Sim" },
          { value: "nao", label: "Nao" }
        ],
        visibility: "shared"
      }
    });
    assert.equal(
      hrCreatedQuestion.response.status,
      201,
      "RH deve criar pergunta manual de avaliacao"
    );
    const createdQuestion = hrCreatedQuestion.payload.questionGroups
      .find((group) => group.key === "self")
      ?.questions.find((question) => question.dimensionKey === "manual-regression");
    assert.ok(createdQuestion, "Pergunta manual criada deve voltar na biblioteca");

    const hrUpdatedQuestion = await sendJson(
      `/api/evaluations/library/questions/${createdQuestion.id}`,
      {
        method: "PATCH",
        headers: getAuthHeader(hr.id),
        body: {
          relationshipType: "self",
          dimensionKey: "manual-regression",
          dimensionTitle: "Pergunta manual revisada",
          prompt: "Pergunta revisada pelo RH para regressao.",
          sortOrder: 99,
          inputType: "multi-select",
          options: [
            { value: "alto", label: "Alto" },
            { value: "baixo", label: "Baixo" }
          ],
          visibility: "confidential",
          isSensitive: true
        }
      }
    );
    assert.equal(
      hrUpdatedQuestion.response.status,
      200,
      "RH deve editar pergunta manual de avaliacao"
    );

    const hrDeletedQuestion = await sendJson(
      `/api/evaluations/library/questions/${createdQuestion.id}`,
      {
        method: "DELETE",
        headers: getAuthHeader(hr.id)
      }
    );
    assert.equal(
      hrDeletedQuestion.response.status,
      200,
      "RH deve remover pergunta manual de avaliacao"
    );

    const managerDashboardBaseline = await fetchJson(
      "/api/dashboards/overview",
      getAuthHeader(manager.id)
    );
    assert.equal(
      managerDashboardBaseline.response.status,
      200,
      "Gestor deve acessar o dashboard gerencial"
    );
    assert.equal(
      managerDashboardBaseline.payload.riskSummary.openIncidents,
      0,
      "Dashboard gerencial nao deve expor incidentes corporativos"
    );

    await store.forceCrossFunctionalPairing(
      "c1",
      {
        reviewerUserId: manager.id,
        revieweePersonId: employee.personId,
        reason: "Regressao do escopo gerencial no dashboard"
      },
      admin
    );

    const managerDashboardAfterExternalPairing = await fetchJson(
      "/api/dashboards/overview",
      getAuthHeader(manager.id)
    );
    assert.equal(
      managerDashboardAfterExternalPairing.response.status,
      200,
      "Dashboard gerencial deve seguir acessivel apos pareamento transversal externo"
    );
    assert.equal(
      managerDashboardAfterExternalPairing.payload.scopeSummary.totalAssignments,
      managerDashboardBaseline.payload.scopeSummary.totalAssignments,
      "Dashboard gerencial nao deve inflar assignments com avaliados fora da equipe"
    );
    assert.equal(
      managerDashboardAfterExternalPairing.payload.scopeSummary.pendingAssignments,
      managerDashboardBaseline.payload.scopeSummary.pendingAssignments,
      "Dashboard gerencial nao deve inflar pendencias com avaliados fora da equipe"
    );

    const managerCreatedPerson = await sendJson("/api/people", {
      headers: getAuthHeader(manager.id),
      body: {
        name: "Subordinado Criado Pelo Gestor",
        roleTitle: "Analista do Time",
        area: managerPerson.area,
        workUnit: "Sao Paulo",
        workMode: "hybrid",
        managerPersonId: manager.personId,
        isAreaManager: "no",
        employmentType: "internal"
      }
    });
    assert.equal(
      managerCreatedPerson.response.status,
      201,
      "Gestor deve cadastrar pessoa subordinada direta na propria area"
    );

    const managerCreatedUser = await sendJson("/api/users", {
      headers: getAuthHeader(manager.id),
      body: {
        personId: managerCreatedPerson.payload.id,
        email: "subordinado.gestor@empresa.local",
        password: "demo123",
        roleKey: "employee",
        status: "active"
      }
    });
    assert.equal(
      managerCreatedUser.response.status,
      201,
      "Gestor deve criar usuario colaborador para subordinado direto"
    );

    const managerUsers = await fetchJson("/api/users", getAuthHeader(manager.id));
    assert.equal(managerUsers.response.status, 200, "Gestor deve listar usuarios do proprio time");
    assert.ok(
      managerUsers.payload.some((user) => user.email === "subordinado.gestor@empresa.local"),
      "Lista de usuarios do gestor deve incluir acesso criado para subordinado"
    );

    const employeePeopleRegistry = await fetchJson("/api/people", getAuthHeader(employee.id));
    assert.equal(
      employeePeopleRegistry.response.status,
      403,
      "Colaborador nao deve listar cadastro de pessoas"
    );

    const compliancePeopleRegistry = await fetchJson("/api/people", getAuthHeader(compliance.id));
    assert.equal(
      compliancePeopleRegistry.response.status,
      200,
      "Compliance deve listar diretorio reduzido de pessoas para tratar casos"
    );
    assert.ok(
      compliancePeopleRegistry.payload.every((person) => !("satisfactionScore" in person)),
      "Diretorio de compliance nao deve expor campos administrativos de pessoas"
    );

    const temporaryPasswordLogin = await sendJson("/api/auth/login", {
      body: {
        email: "subordinado.gestor@empresa.local",
        password: "demo123"
      }
    });
    assert.equal(
      temporaryPasswordLogin.response.status,
      200,
      "Usuario criado com senha provisoria deve conseguir autenticar"
    );
    assert.equal(
      temporaryPasswordLogin.payload.user.mustChangePassword,
      true,
      "Usuario criado por gestor deve ser sinalizado para trocar senha"
    );

    const changedOwnPassword = await sendJson("/api/auth/change-password", {
      headers: {
        Authorization: `Bearer ${temporaryPasswordLogin.payload.token}`
      },
      body: {
        currentPassword: "demo123",
        nextPassword: "novaSenha123"
      }
    });
    assert.equal(
      changedOwnPassword.response.status,
      200,
      "Usuario autenticado deve conseguir trocar a propria senha"
    );
    assert.equal(
      changedOwnPassword.payload.mustChangePassword,
      false,
      "Troca de senha propria deve remover obrigatoriedade de troca"
    );

    const oldTemporaryPasswordLogin = await sendJson("/api/auth/login", {
      body: {
        email: "subordinado.gestor@empresa.local",
        password: "demo123"
      }
    });
    assert.equal(
      oldTemporaryPasswordLogin.response.status,
      401,
      "Senha provisoria antiga nao deve seguir valida apos troca"
    );

    const managerBlockedPerson = await sendJson("/api/people", {
      headers: getAuthHeader(manager.id),
      body: {
        name: "Pessoa Fora Do Escopo",
        roleTitle: "Analista Externo",
        area: "Compliance",
        workUnit: "Sao Paulo",
        workMode: "hybrid",
        managerPersonId: manager.personId,
        isAreaManager: "no",
        employmentType: "internal"
      }
    });
    assert.equal(
      managerBlockedPerson.response.status,
      400,
      "Gestor nao deve cadastrar pessoa fora da propria area"
    );

    const managerBlockedRolePerson = await sendJson("/api/people", {
      headers: getAuthHeader(manager.id),
      body: {
        name: "Subordinado Para Perfil Elevado",
        roleTitle: "Analista do Time",
        area: managerPerson.area,
        workUnit: "Sao Paulo",
        workMode: "hybrid",
        managerPersonId: manager.personId,
        isAreaManager: "no",
        employmentType: "internal"
      }
    });
    assert.equal(managerBlockedRolePerson.response.status, 201);
    const managerBlockedUserRole = await sendJson("/api/users", {
      headers: getAuthHeader(manager.id),
      body: {
        personId: managerBlockedRolePerson.payload.id,
        email: "perfil.elevado.gestor@empresa.local",
        password: "demo123",
        roleKey: "admin",
        status: "active"
      }
    });
    assert.equal(
      managerBlockedUserRole.response.status,
      400,
      "Gestor nao deve conceder perfil administrativo a subordinado"
    );

    const employeeDashboard = await fetchJson(
      "/api/dashboards/overview",
      getAuthHeader(employee.id)
    );
    assert.equal(
      employeeDashboard.response.status,
      403,
      "Colaborador nao deve acessar o dashboard"
    );

    const adminDashboard = await fetchJson(
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
      adminDashboard.payload.riskSummary.openIncidents >= 0,
      "Dashboard executivo deve retornar resumo de risco"
    );
    assert.ok(
      Array.isArray(adminDashboard.payload.operationalAlerts),
      "Dashboard executivo deve retornar alertas operacionais"
    );
    assert.ok(
      adminDashboard.payload.pdiAnalytics?.summary,
      "Dashboard deve retornar resumo analitico de PDI"
    );
    assert.ok(
      Array.isArray(adminDashboard.payload.pdiAnalytics.evolution),
      "Dashboard deve retornar evolucao historica de PDI"
    );
    assert.ok(
      adminDashboard.payload.pdiAnalytics.evolution.every(
        (period) =>
          Number.isFinite(period.coveragePercentage) &&
          Number.isFinite(period.executionPercentage) &&
          Number.isFinite(period.completionPercentage) &&
          Number.isFinite(period.onTimePercentage) &&
          Number.isFinite(period.stale)
      ),
      "Cada periodo deve expor todos os indicadores historicos de PDI"
    );
    assert.ok(
      ["coverageDelta", "executionDelta", "completionDelta", "onTimeDelta", "blockedDelta", "overdueDelta", "staleDelta"].every(
        (key) => Number.isFinite(adminDashboard.payload.pdiAnalytics.comparison[key])
      ),
      "Dashboard deve comparar todos os indicadores com o periodo anterior"
    );
    assert.ok(
      adminDashboard.payload.pdiAnalytics.methodology.historyAccuracy.includes("19/08/2026"),
      "Dashboard deve informar o limite de exatidao do historico"
    );
    assert.ok(
      Array.isArray(adminDashboard.payload.pdiAnalytics.competencyActionCoverage) &&
        Array.isArray(adminDashboard.payload.pdiAnalytics.competencyAlerts),
      "Dashboard deve relacionar competencias, PDIs e aprendizagem"
    );
    assert.ok(
      Array.isArray(adminDashboard.payload.pdiAnalytics.competencyPriorities) &&
        Array.isArray(adminDashboard.payload.pdiAnalytics.developmentRiskMatrix) &&
        adminDashboard.payload.pdiAnalytics.developmentRiskMatrix.length === 3,
      "Dashboard deve retornar ranking de gaps e matriz de risco"
    );
    assert.ok(
      adminDashboard.payload.pdiAnalytics.competencyPriorities.every(
        (item) =>
          item.priorityScore >= 0 &&
          item.priorityScore <= 100 &&
          ["high", "medium", "low"].includes(item.riskLevel)
      ),
      "Prioridades devem respeitar score e classificacao governados"
    );
    assert.equal(
      adminDashboard.payload.pdiAnalytics.methodology.competencyScale,
      "Media de 1 a 5",
      "Dashboard deve explicar a escala da evolucao por competencia"
    );
    assert.ok(
      adminDashboard.payload.pdiAnalytics.competencyEvolution.every(
        (item) =>
          item.peopleCount >= adminDashboard.payload.pdiAnalytics.minimumAggregateSize &&
          item.currentScore >= 1 &&
          item.currentScore <= 5
      ),
      "Competencias devem usar notas homologadas e respeitar a amostra minima"
    );
    assert.ok(
      Array.isArray(adminDashboard.payload.pdiAnalytics.statusDistribution) &&
        adminDashboard.payload.pdiAnalytics.statusDistribution.reduce(
          (total, item) => total + item.total,
          0
        ) === adminDashboard.payload.pdiAnalytics.summary.activePlans,
      "Distribuicao de PDI deve fechar com o total de planos ativos"
    );
    assert.ok(
      adminDashboard.payload.cards.some((card) => card.label === "Incidentes abertos"),
      "Dashboard executivo deve destacar incidentes abertos"
    );
    assert.ok(
      Array.isArray(adminDashboard.payload.teamOptions),
      "Dashboard executivo deve retornar somente equipes disponiveis para filtro"
    );
    const firstDashboardTeam = adminDashboard.payload.teamOptions[0];
    if (firstDashboardTeam) {
      const teamDashboard = await fetchJson(
        `/api/dashboards/overview?teamManagerId=${encodeURIComponent(firstDashboardTeam.managerPersonId)}`,
        getAuthHeader(admin.id)
      );
      assert.equal(teamDashboard.response.status, 200, "Admin deve filtrar uma equipe autorizada");
      assert.equal(
        teamDashboard.payload.selectedTeamManagerId,
        firstDashboardTeam.managerPersonId,
        "Dashboard deve confirmar o filtro de equipe aplicado"
      );
      assert.ok(
        teamDashboard.payload.scopeSummary.peopleCount <= adminDashboard.payload.scopeSummary.peopleCount,
        "Filtro de equipe nao deve ampliar a populacao autorizada"
      );
    }

    const managerDashboardCurrentScope = await fetchJson(
      "/api/dashboards/overview",
      getAuthHeader(manager.id)
    );
    const managerDashboardWithInjectedTeam = await fetchJson(
      `/api/dashboards/overview?teamManagerId=${encodeURIComponent(admin.personId)}`,
      getAuthHeader(manager.id)
    );
    assert.equal(managerDashboardWithInjectedTeam.response.status, 200);
    assert.equal(
      managerDashboardWithInjectedTeam.payload.scopeSummary.peopleCount,
      managerDashboardCurrentScope.payload.scopeSummary.peopleCount,
      "Gestor deve permanecer restrito a equipe direta ao manipular o filtro"
    );
    const anonymousDashboardSummaries = adminDashboard.payload.evaluationResultsSummary.filter(
      (item) =>
        ["leader", "company", "client-internal", "client-external"].includes(
          item.relationshipType
        )
    );
    assert.ok(
      anonymousDashboardSummaries.every((item) => item.adherencePercentage <= 100),
      "Dashboard nao deve inflar adesao de modalidades anonimas com respostas fora do escopo"
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

    const analyticsDataset = await fetchJson(
      "/api/analytics/powerbi/evaluation-results",
      getAuthHeader(admin.id)
    );
    assert.equal(
      analyticsDataset.response.status,
      200,
      "Admin deve acessar dataset analitico para Power BI"
    );
    assert.equal(
      analyticsDataset.payload.privacy.containsRawComments,
      false,
      "Dataset Power BI nao deve declarar comentarios brutos"
    );
    assert.equal(
      analyticsDataset.payload.privacy.containsIndividualAnswers,
      false,
      "Dataset Power BI nao deve declarar respostas individuais"
    );
    assert.ok(
      Array.isArray(analyticsDataset.payload.facts.evaluationResults),
      "Dataset Power BI deve expor fatos agregados de resultados"
    );
    assert.ok(
      Array.isArray(analyticsDataset.payload.facts.questionResults),
      "Dataset Power BI deve expor fatos agregados por pergunta"
    );
    assert.ok(
      Array.isArray(analyticsDataset.payload.security.rlsViewers),
      "Dataset Power BI deve expor tabela de permissao RLS"
    );
    assert.ok(
      analyticsDataset.payload.security.rlsViewers.some(
        (item) => item.viewerEmail === manager.email && item.scope === "team"
      ),
      "RLS deve mapear gestores para pessoas permitidas da equipe"
    );
    const serializedAnalytics = JSON.stringify(analyticsDataset.payload);
    assert.equal(
      /evidenceNote|strengthsNote|developmentNote|textValue|selectedOptions|reviewerName|revieweeName|personName|managerName|managerEmail/.test(
        serializedAnalytics
      ),
      false,
      "Dataset Power BI nao deve vazar campos de resposta individual ou nomes pessoais na camada agregada"
    );

    const managerAnalytics = await fetchJson(
      "/api/analytics/powerbi/evaluation-results",
      getAuthHeader(manager.id)
    );
    assert.equal(
      managerAnalytics.response.status,
      403,
      "Gestor nao deve acessar o dataset completo de Power BI diretamente"
    );

    const analyticsRls = await fetchJson(
      "/api/analytics/powerbi/rls-viewers",
      getAuthHeader(hr.id)
    );
    assert.equal(analyticsRls.response.status, 200, "RH deve acessar tabela RLS do Power BI");
    assert.ok(
      analyticsRls.payload.rlsViewers.some((item) => item.viewerEmail === hr.email),
      "RLS deve incluir RH com escopo organizacional"
    );

    const complianceDashboard = await fetchJson(
      "/api/dashboards/overview",
      getAuthHeader(compliance.id)
    );
    assert.equal(
      complianceDashboard.response.status,
      403,
      "Compliance nao deve acessar o dashboard executivo"
    );

    const complianceCycles = await fetchJson(
      "/api/evaluations/cycles",
      getAuthHeader(compliance.id)
    );
    assert.equal(
      complianceCycles.response.status,
      403,
      "Compliance nao deve acessar o workspace de avaliacoes"
    );

    const complianceApplause = await fetchJson(
      "/api/applause",
      getAuthHeader(compliance.id)
    );
    assert.equal(
      complianceApplause.response.status,
      403,
      "Compliance nao deve acessar o workspace de Aplause"
    );

    const employeeIncidentQueue = await fetchJson("/api/incidents", getAuthHeader(employee.id));
    assert.equal(
      employeeIncidentQueue.response.status,
      403,
      "Colaborador nao deve listar a fila de tratamento de incidentes"
    );

    const auditFrom = new Date(Date.now() - 60_000).toISOString();
    const employeeCreatedIncident = await sendJson("/api/incidents", {
      headers: getAuthHeader(employee.id),
      body: {
        title: "Relato de colaborador",
        category: "Conduta",
        classification: "Nao classificado",
        anonymity: "identified",
        reporterLabel: "Colaborador identificado",
        responsibleArea: "Compliance",
        description: "Relato registrado apenas para validar permissao de criacao."
      }
    });
    assert.equal(
      employeeCreatedIncident.response.status,
      201,
      "Colaborador autenticado deve conseguir registrar relato de compliance"
    );

    const employeeAudit = await fetchJson(
      "/api/audit-trail",
      getAuthHeader(employee.id)
    );
    assert.equal(
      employeeAudit.response.status,
      403,
      "Colaborador nao deve acessar trilha operacional"
    );

    const complianceAudit = await fetchJson(
      "/api/audit-trail",
      getAuthHeader(compliance.id)
    );
    assert.equal(complianceAudit.response.status, 200, "Compliance deve acessar trilha operacional");
    assert.ok(
      complianceAudit.payload.every((entry) => entry.category === "incident"),
      "Compliance deve visualizar apenas auditoria de incidentes"
    );

    const filteredIncidentAudit = await fetchJson(
      `/api/audit-trail?category=incident&action=created&actorUserId=${employee.id}&from=${encodeURIComponent(
        auditFrom
      )}&to=${encodeURIComponent(new Date(Date.now() + 60_000).toISOString())}`,
      getAuthHeader(compliance.id)
    );
    assert.equal(
      filteredIncidentAudit.response.status,
      200,
      "Compliance deve filtrar auditoria por acao, ator e periodo"
    );
    assert.ok(
      filteredIncidentAudit.payload.some((entry) => entry.actorUserId === employee.id && entry.action === "created"),
      "Auditoria filtrada deve retornar o incidente criado pelo colaborador"
    );

    const adminAudit = await fetchJson(
      "/api/audit-trail?category=cycle",
      getAuthHeader(admin.id)
    );
    assert.equal(adminAudit.response.status, 200, "Admin deve acessar auditoria por categoria");
    assert.ok(
      adminAudit.payload.some((entry) => entry.category === "cycle"),
      "Auditoria deve retornar eventos de ciclo"
    );
  } finally {
    await context.close();
  }
}
