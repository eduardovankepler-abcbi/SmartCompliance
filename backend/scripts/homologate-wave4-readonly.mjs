import { createApp } from "../src/app.js";
import { createStore } from "../src/data/store.js";

const DEFAULT_BASE_URL = "https://smartcompliance.onrender.com";
const DEFAULT_PASSWORD = process.env.HOMOLOGATION_PASSWORD || "demo123";
const USERS = {
  admin: process.env.HOMOLOGATION_ADMIN_EMAIL || "admin@demo.local",
  manager: process.env.HOMOLOGATION_MANAGER_EMAIL || "gestor@demo.local",
  employee: process.env.HOMOLOGATION_EMPLOYEE_EMAIL || "colaborador1@demo.local",
  compliance: process.env.HOMOLOGATION_COMPLIANCE_EMAIL || "compliance@demo.local"
};

function assertOk(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function parseResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (_error) {
    return text;
  }
}

async function request(baseUrl, path, { method = "GET", headers = {}, body, expectedStatus = 200 } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await parseResponse(response);
  assertOk(
    response.status === expectedStatus,
    `${method} ${path} deveria retornar ${expectedStatus}, retornou ${response.status}: ${JSON.stringify(payload)}`
  );
  return payload;
}

async function createLocalContext() {
  const store = await createStore();
  const app = createApp(store);
  const server = app.listen(0);
  const address = server.address();
  const baseUrl =
    typeof address === "object" && address?.port
      ? `http://127.0.0.1:${address.port}`
      : "";

  return {
    baseUrl,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      })
  };
}

async function createRemoteContext() {
  return {
    baseUrl: (process.env.HOMOLOGATION_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, ""),
    close: async () => {}
  };
}

async function login(baseUrl, email) {
  const payload = await request(baseUrl, "/api/auth/login", {
    method: "POST",
    body: { email, password: DEFAULT_PASSWORD }
  });
  assertOk(payload?.token, `Login sem token para ${email}`);
  return {
    user: payload.user,
    headers: { Authorization: `Bearer ${payload.token}` }
  };
}

function assertDashboardPayload(payload, label) {
  assertOk(payload?.scopeSummary, `${label}: scopeSummary ausente`);
  assertOk(Array.isArray(payload.cards), `${label}: cards ausente`);
  assertOk(payload.riskSummary, `${label}: riskSummary ausente`);
  assertOk(Array.isArray(payload.operationalAlerts), `${label}: operationalAlerts ausente`);
}

async function main() {
  const mode = process.env.HOMOLOGATION_LOCAL === "true" ? "local" : "remote";
  const context = mode === "local" ? await createLocalContext() : await createRemoteContext();
  const startedAt = new Date().toISOString();

  try {
    const health = await request(context.baseUrl, "/health");
    assertOk(health.status === "ok" && health.ready === true, "Healthcheck deve estar ok e ready=true");

    const admin = await login(context.baseUrl, USERS.admin);
    const manager = await login(context.baseUrl, USERS.manager);
    const employee = await login(context.baseUrl, USERS.employee);
    const compliance = await login(context.baseUrl, USERS.compliance);

    await request(context.baseUrl, "/api/auth/me", { headers: admin.headers });

    const adminDashboard = await request(context.baseUrl, "/api/dashboards/overview?timeGrouping=semester", {
      headers: admin.headers
    });
    assertDashboardPayload(adminDashboard, "admin dashboard");

    const managerDashboard = await request(context.baseUrl, "/api/dashboards/overview?timeGrouping=semester", {
      headers: manager.headers
    });
    assertDashboardPayload(managerDashboard, "manager dashboard");

    await request(context.baseUrl, "/api/dashboards/overview", {
      headers: employee.headers,
      expectedStatus: 403
    });

    const adminAudit = await request(context.baseUrl, "/api/audit-trail?limit=20", {
      headers: admin.headers
    });
    assertOk(Array.isArray(adminAudit), "Auditoria admin deve retornar lista");

    const complianceAudit = await request(context.baseUrl, "/api/audit-trail?limit=20", {
      headers: compliance.headers
    });
    assertOk(
      Array.isArray(complianceAudit) && complianceAudit.every((entry) => entry.category === "incident"),
      "Compliance deve visualizar apenas auditoria de incidentes"
    );

    await request(context.baseUrl, "/api/audit-trail", {
      headers: employee.headers,
      expectedStatus: 403
    });

    const finishedAt = new Date().toISOString();
    console.log(
      JSON.stringify(
        {
          status: "passed",
          mode,
          baseUrl: context.baseUrl,
          startedAt,
          finishedAt,
          health: {
            status: health.status,
            ready: health.ready,
            storageMode: health.storageMode,
            database: health.database || null
          },
          checks: {
            adminDashboardCards: adminDashboard.cards.length,
            adminOperationalAlerts: adminDashboard.operationalAlerts.length,
            managerDashboardCards: managerDashboard.cards.length,
            adminAuditEvents: adminAudit.length,
            complianceAuditEvents: complianceAudit.length,
            employeeDashboardForbidden: true,
            employeeAuditForbidden: true
          }
        },
        null,
        2
      )
    );
  } finally {
    await context.close();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
  console.error(error.message);
  process.exit(1);
  });
