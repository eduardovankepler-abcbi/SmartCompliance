import assert from "node:assert/strict";
import { createTestContext } from "./testContext.mjs";

export async function runAuthAccessRegression() {
  const context = await createTestContext();

  try {
    const { fetchJson, getAuthHeader, sendJson, store } = context;
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
    assert.equal(hrResponses.response.status, 403, "RH nao deve acessar respostas estrategicas");

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
