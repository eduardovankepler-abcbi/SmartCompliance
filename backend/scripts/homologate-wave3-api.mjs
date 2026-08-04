const PRODUCTION_HOSTS = new Set(["smartcompliance.onrender.com"]);

function assertOk(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function answerFor(question) {
  if (question.inputType === "text") {
    return {
      questionId: question.id,
      score: null,
      evidenceNote: "",
      textValue: "Resposta textual de homologacao API.",
      selectedOptions: []
    };
  }

  if (question.inputType === "multi-select") {
    return {
      questionId: question.id,
      score: null,
      evidenceNote: "",
      textValue: "",
      selectedOptions: [question.options?.[0]?.value || "A"]
    };
  }

  return {
    questionId: question.id,
    score: 4,
    evidenceNote: question.collectEvidenceOnExtreme
      ? "Evidencia de homologacao para nota extrema."
      : "",
    textValue: "",
    selectedOptions: []
  };
}

async function parseResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (_error) {
    return text;
  }
}

async function send(baseUrl, path, { method = "GET", headers = {}, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await parseResponse(response);
  if (!response.ok) {
    throw new Error(`${method} ${path} retornou ${response.status}: ${JSON.stringify(payload)}`);
  }
  return payload;
}

async function sendExpectStatus(baseUrl, path, expectedStatus, { method = "GET", headers = {}, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });
  await parseResponse(response);
  assertOk(
    response.status === expectedStatus,
    `${method} ${path} deveria retornar ${expectedStatus}, retornou ${response.status}`
  );
  return response.status;
}

async function createLocalContext() {
  process.env.STORAGE_MODE = "memory";
  process.env.AUTH_SECRET ||= "smart-compliance-homologation-secret";
  const { createTestContext } = await import("../tests/testContext.mjs");
  const context = await createTestContext();
  return {
    baseUrl: context.baseUrl,
    close: context.close,
    headers: {
      admin: context.getAuthHeader((await context.store.findUserByEmail("admin@demo.local")).id),
      manager: context.getAuthHeader((await context.store.findUserByEmail("gestor@demo.local")).id),
      employee: context.getAuthHeader((await context.store.findUserByEmail("colaborador2@demo.local")).id),
      outsider: context.getAuthHeader((await context.store.findUserByEmail("colaborador1@demo.local")).id)
    },
    users: {
      manager: await context.store.findUserByEmail("gestor@demo.local"),
      employee: await context.store.findUserByEmail("colaborador2@demo.local")
    }
  };
}

async function createRemoteContext(baseUrl) {
  const parsedUrl = new URL(baseUrl);
  if (PRODUCTION_HOSTS.has(parsedUrl.host) && process.env.ALLOW_PRODUCTION_MUTATION !== "true") {
    throw new Error(
      "Homologacao mutavel em producao bloqueada. Use staging/isolado ou defina ALLOW_PRODUCTION_MUTATION=true conscientemente."
    );
  }
  if (process.env.HOMOLOGATION_ALLOW_MUTATION !== "true") {
    throw new Error("Defina HOMOLOGATION_ALLOW_MUTATION=true para rodar contra API remota.");
  }

  const login = async (email) => {
    const response = await send(baseUrl, "/api/auth/login", {
      method: "POST",
      body: { email, password: process.env.HOMOLOGATION_PASSWORD || "demo123" }
    });
    return { Authorization: `Bearer ${response.token}` };
  };

  return {
    baseUrl,
    close: async () => {},
    headers: {
      admin: await login(process.env.HOMOLOGATION_ADMIN_EMAIL || "admin@demo.local"),
      manager: await login(process.env.HOMOLOGATION_MANAGER_EMAIL || "gestor@demo.local"),
      employee: await login(process.env.HOMOLOGATION_EMPLOYEE_EMAIL || "colaborador2@demo.local"),
      outsider: await login(process.env.HOMOLOGATION_OUTSIDER_EMAIL || "colaborador1@demo.local")
    },
    users: {
      manager: null,
      employee: null
    }
  };
}

async function main() {
  const remoteBaseUrl = process.env.HOMOLOGATION_API_BASE_URL;
  const context = remoteBaseUrl
    ? await createRemoteContext(remoteBaseUrl.replace(/\/$/, ""))
    : await createLocalContext();

  try {
    const { baseUrl, headers } = context;
    const stamp = Date.now();
    const health = await send(baseUrl, "/health");
    assertOk(health.status === "ok" && health.ready === true, "Healthcheck deve estar ok");

    const people = await send(baseUrl, "/api/people", { headers: headers.admin });
    const employeePersonId = context.users.employee?.personId || people.find((person) => person.name)?.id;
    assertOk(employeePersonId, "Pessoa do colaborador de homologacao obrigatoria");

    const competencies = await send(baseUrl, "/api/competencies", { headers: headers.admin });
    const competencyId = competencies[0]?.id || null;

    const cycle = await send(baseUrl, "/api/evaluations/cycles", {
      method: "POST",
      headers: headers.admin,
      body: {
        title: `HOMOLOGACAO API ONDA 3 ${stamp}`,
        semesterLabel: `2026.API.${String(stamp).slice(-5)}`,
        dueDate: "2026-12-15",
        targetGroup: "Homologacao API"
      }
    });
    const released = await send(baseUrl, `/api/evaluations/cycles/${cycle.id}/status`, {
      method: "PATCH",
      headers: headers.admin,
      body: { status: "Liberado" }
    });
    assertOk(released.status === "Liberado", "Ciclo deve ser liberado");

    const assignments = await send(baseUrl, "/api/evaluations/assignments", {
      headers: headers.employee
    });
    const assignment =
      assignments.find((item) => item.cycleId === cycle.id && item.status === "pending") ||
      assignments.find((item) => item.status === "pending");
    assertOk(assignment, "Assignment pendente obrigatorio para homologacao");

    const detail = await send(baseUrl, `/api/evaluations/assignments/${assignment.id}`, {
      headers: headers.employee
    });
    assertOk(detail.template.questions.length > 0, "Assignment deve carregar perguntas");

    const incompleteSubmitStatus = await sendExpectStatus(
      baseUrl,
      "/api/evaluations/submit",
      400,
      {
        method: "POST",
        headers: headers.employee,
        body: { assignmentId: assignment.id, answers: [], strengthsNote: "", developmentNote: "" }
      }
    );

    const submission = await send(baseUrl, "/api/evaluations/submit", {
      method: "POST",
      headers: headers.employee,
      body: {
        assignmentId: assignment.id,
        answers: detail.template.questions.map(answerFor),
        strengthsNote: "Ponto forte validado na homologacao API.",
        developmentNote: "Ponto de desenvolvimento validado na homologacao API."
      }
    });
    const duplicateSubmitStatus = await sendExpectStatus(baseUrl, "/api/evaluations/submit", 400, {
      method: "POST",
      headers: headers.employee,
      body: {
        assignmentId: assignment.id,
        answers: detail.template.questions.map(answerFor),
        strengthsNote: "Duplicado",
        developmentNote: "Duplicado"
      }
    });

    const responses = await send(baseUrl, "/api/evaluations/responses", {
      headers: headers.manager
    });
    const employeeQuestionnairesStatus = await sendExpectStatus(
      baseUrl,
      "/api/evaluations/questionnaires",
      403,
      { headers: headers.employee }
    );

    const plan = await send(baseUrl, "/api/development/plans", {
      method: "POST",
      headers: headers.manager,
      body: {
        personId: employeePersonId,
        cycleId: cycle.id,
        competencyId,
        focusTitle: `HOMOLOGACAO API PDI ${stamp}`,
        actionText: "Executar checkpoints quinzenais de desenvolvimento.",
        dueDate: "2026-12-20",
        expectedEvidence: "Registro dos checkpoints e feedback do gestor."
      }
    });
    const progress = await send(baseUrl, `/api/development/plans/${plan.id}/progress`, {
      method: "PATCH",
      headers: headers.employee,
      body: {
        progressStatus: "in_progress",
        progressNote: "Homologacao API marcou andamento."
      }
    });
    const archivedPlan = await send(baseUrl, `/api/development/plans/${plan.id}`, {
      method: "PATCH",
      headers: headers.manager,
      body: {
        personId: employeePersonId,
        cycleId: cycle.id,
        competencyId,
        focusTitle: plan.focusTitle,
        actionText: plan.actionText,
        dueDate: plan.dueDate,
        expectedEvidence: plan.expectedEvidence,
        status: "archived"
      }
    });

    const record = await send(baseUrl, "/api/development/records", {
      method: "POST",
      headers: headers.employee,
      body: {
        personId: employeePersonId,
        recordType: "Curso",
        title: `HOMOLOGACAO API REGISTRO ${stamp}`,
        providerName: "Homologacao API",
        completedAt: "2026-08-04",
        skillSignal: "Disciplina operacional",
        notes: "Registro criado pela homologacao API."
      }
    });
    const archivedRecord = await send(baseUrl, `/api/development/records/${record.id}`, {
      method: "PATCH",
      headers: headers.employee,
      body: {
        personId: employeePersonId,
        recordType: record.recordType,
        title: record.title,
        providerName: record.providerName,
        completedAt: record.completedAt,
        skillSignal: record.skillSignal,
        notes: record.notes,
        status: "archived"
      }
    });
    const outsiderPlans = await send(baseUrl, "/api/development/plans", {
      headers: headers.outsider
    });
    const employeeLearningEventsStatus = await sendExpectStatus(
      baseUrl,
      "/api/development/integrations/learning-events",
      403,
      { headers: headers.employee }
    );

    console.log(
      JSON.stringify(
        {
          status: "ok",
          mode: remoteBaseUrl ? "remote" : "local-memory",
          baseUrl,
          storageMode: health.storageMode || "memory",
          cycleId: cycle.id,
          assignmentId: assignment.id,
          submissionId: submission.id,
          responsesBundleVisible: Array.isArray(responses.individualResponses),
          incompleteSubmitStatus,
          duplicateSubmitStatus,
          employeeQuestionnairesStatus,
          planId: plan.id,
          planProgressOk: progress.progressStatus === "in_progress",
          planArchived: archivedPlan.status === "archived",
          recordId: record.id,
          recordArchived: archivedRecord.status === "archived",
          outsiderDoesNotSeePlan: !outsiderPlans.some((item) => item.id === plan.id),
          employeeLearningEventsStatus
        },
        null,
        2
      )
    );
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
