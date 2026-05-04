import assert from "node:assert/strict";
import { createTestContext } from "./testContext.mjs";

export async function runEvaluationsRegression() {
  const context = await createTestContext();

  try {
    const { fetchJson, getAuthHeader, sendJson, store } = context;
    const admin = await store.findUserByEmail("admin@demo.local");
    const manager = await store.findUserByEmail("gestor@demo.local");
    const hr = await store.findUserByEmail("rh@demo.local");
    const employee = await store.findUserByEmail("colaborador1@demo.local");
    const managerRevieweeEmployee = await store.findUserByEmail("colaborador2@demo.local");

    assert.ok(
      admin && manager && hr && employee && managerRevieweeEmployee,
      "Usuarios demo obrigatorios para avaliacoes"
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
        assignment.cycleId === cycleForManagerResponse.id &&
        assignment.relationshipType === "manager"
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
      "/api/evaluations/performance-360",
      getAuthHeader(hr.id)
    );
    assert.equal(
      hrPerformance.response.status,
      403,
      "RH nao deve acessar a nota individual de performance 360"
    );

    const employeeReceivedFeedback = await fetchJson(
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

    const transversalConfigPatchResponse = await sendJson(
      `/api/evaluations/cycles/${toggleCycle.id}/config`,
      {
        method: "PATCH",
        headers: getAuthHeader(hr.id),
        body: {
          transversalConfig: {
            defaultReviewersPerPerson: 2,
            unitOverrides: {
              "Sao Paulo": 2
            }
          }
        }
      }
    );
    assert.equal(
      transversalConfigPatchResponse.response.status,
      200,
      "API deve aceitar atualizacao de configuracao transversal do ciclo"
    );
    assert.equal(
      transversalConfigPatchResponse.payload.transversalConfig.defaultReviewersPerPerson,
      2,
      "API deve devolver a configuracao transversal persistida"
    );

    const toggleCycleStructureResponse = await fetchJson(
      `/api/evaluations/cycles/${toggleCycle.id}/participants`,
      getAuthHeader(hr.id)
    );
    assert.equal(
      toggleCycleStructureResponse.payload.transversal.config.defaultReviewersPerPerson,
      2,
      "Estrutura operacional deve refletir a configuracao transversal salva via rota"
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

    for (const reviewer of [
      employee,
      await store.findUserByEmail("colaborador2@demo.local"),
      await store.findUserByEmail("consultor1@demo.local")
    ]) {
      const reviewerAssignments = await store.getEvaluationAssignmentsForUser(reviewer.id);
      const companyAssignment = reviewerAssignments.find(
        (assignment) => assignment.cycleId === createdCycle.id && assignment.relationshipType === "company"
      );

      assert.ok(
        companyAssignment,
        "Cada avaliador de teste precisa receber assignment institucional"
      );

      await store.submitEvaluationAssignment({
        assignmentId: companyAssignment.id,
        reviewerUserId: reviewer.id,
        answers: processedCompanyTemplate.questions.map((question) => ({
          questionId: question.id,
          score: question.inputType === "scale" ? 4 : null,
          evidenceNote: "",
          textValue: question.inputType === "text" ? "Resposta automatizada de regressao." : "",
          selectedOptions:
            question.inputType === "multi-select"
              ? [question.options?.[0]?.value].filter(Boolean)
              : []
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
  } finally {
    await context.close();
  }
}
