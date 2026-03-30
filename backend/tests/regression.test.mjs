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
