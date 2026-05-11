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

    const createdQuestionnaire = await store.createEvaluationQuestionnaire(
      {
        cycleId: "c1",
        revieweePersonId: employee.personId,
        relationshipType: "self",
        title: "Autoavaliacao individual do colaborador 1",
        description: "Draft individual para regressao."
      },
      hr
    );
    assert.equal(
      createdQuestionnaire.status,
      "draft",
      "Questionario individual deve nascer como draft"
    );

    const questionPayload = (sortOrder) => ({
      sortOrder,
      sectionKey: "autoconhecimento",
      sectionTitle: "Autoconhecimento",
      dimensionKey: `self-q-${sortOrder}`,
      dimensionTitle: `Pergunta ${sortOrder}`,
      promptText: `Pergunta individual ${sortOrder}`,
      helperText: "",
      inputType: "scale",
      scaleProfile: "performance",
      visibility: "restricted",
      isRequired: true,
      collectEvidenceOnExtreme: false,
      isSensitive: sortOrder === 1,
      options: []
    });
    const buildQuestionnaireQuestions = async (questionnaireId, totalQuestions, actorUser) => {
      for (let index = 1; index <= totalQuestions; index += 1) {
        await store.addEvaluationQuestionnaireQuestion(
          questionnaireId,
          questionPayload(index),
          actorUser
        );
      }
    };

    await buildQuestionnaireQuestions(createdQuestionnaire.id, 19, hr);

    await assert.rejects(
      () => store.publishEvaluationQuestionnaire(createdQuestionnaire.id, hr),
      /exatamente 20 perguntas/i,
      "Questionario self deve exigir exatamente 20 perguntas para publicar"
    );

    const readyQuestionnaire = await store.addEvaluationQuestionnaireQuestion(
      createdQuestionnaire.id,
      questionPayload(20),
      hr
    );
    assert.equal(
      readyQuestionnaire.questionCount,
      20,
      "Questionario deve contabilizar perguntas adicionadas"
    );

    const publishedQuestionnaire = await store.publishEvaluationQuestionnaire(
      createdQuestionnaire.id,
      hr
    );
    assert.equal(
      publishedQuestionnaire.status,
      "published",
      "Questionario individual valido deve publicar"
    );
    assert.ok(
      publishedQuestionnaire.publishedAt,
      "Questionario publicado deve registrar publishedAt"
    );

    await assert.rejects(
      () =>
        store.addEvaluationQuestionnaireQuestion(
          createdQuestionnaire.id,
          questionPayload(21),
          hr
        ),
      /somente questionarios em draft/i,
      "Questionario publicado nao deve aceitar edicao adicional"
    );

    const questionnaireListResponse = await fetchJson(
      "/api/evaluations/questionnaires",
      getAuthHeader(hr.id)
    );
    assert.equal(
      questionnaireListResponse.response.status,
      200,
      "RH deve conseguir listar questionarios individuais"
    );
    assert.ok(
      questionnaireListResponse.payload.some((item) => item.id === createdQuestionnaire.id),
      "Questionario criado deve aparecer na listagem da API"
    );

    const employeeAssignmentsAfterQuestionnaire = await store.getEvaluationAssignmentsForUser(employee.id);
    const selfAssignmentWithQuestionnaire = employeeAssignmentsAfterQuestionnaire.find(
      (assignment) => assignment.relationshipType === "self" && assignment.cycleId === "c1"
    );
    assert.equal(
      selfAssignmentWithQuestionnaire.questionnaireId,
      createdQuestionnaire.id,
      "Publicacao deve vincular questionario ao assignment correspondente"
    );

    const individualizedTemplate = await store.getEvaluationTemplateForAssignment(
      selfAssignmentWithQuestionnaire.id,
      employee.id
    );
    assert.equal(
      individualizedTemplate.questions.length,
      20,
      "Assignment deve carregar o questionario individual publicado"
    );
    assert.equal(
      individualizedTemplate.id,
      createdQuestionnaire.id,
      "Template retornado para o assignment deve refletir o questionario individual"
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

    const managedQuestionnaire = await store.createEvaluationQuestionnaire(
      {
        cycleId: createdCycle.id,
        revieweePersonId: managerRevieweeEmployee.personId,
        relationshipType: "self",
        title: "Autoavaliacao individual do colaborador 2",
        description: "Questionario individual com conteudo sensivel para subordinado direto."
      },
      hr
    );

    await buildQuestionnaireQuestions(managedQuestionnaire.id, 20, hr);
    await store.updateEvaluationQuestionnaire(
      managedQuestionnaire.id,
      {
        accessPolicy: {
          canViewReviewee: false,
          canViewReviewer: true,
          canViewManager: true,
          canViewHr: true,
          canViewAdmin: true,
          canViewRawAnswers: false,
          canViewPromptTextAfterSubmission: false
        }
      },
      hr
    );

    await store.publishEvaluationQuestionnaire(managedQuestionnaire.id, hr);

    const managedAssignments = await store.getEvaluationAssignmentsForUser(managerRevieweeEmployee.id);
    const managedSelfAssignment = managedAssignments.find(
      (assignment) =>
        assignment.relationshipType === "self" && assignment.cycleId === createdCycle.id
    );
    assert.ok(
      managedSelfAssignment,
      "Subordinado do gestor precisa receber assignment self no ciclo criado"
    );
    assert.equal(
      managedSelfAssignment.questionnaireId,
      managedQuestionnaire.id,
      "Questionario publicado deve vincular o assignment self do subordinado"
    );

    const managedTemplate = await store.getEvaluationTemplateForAssignment(
      managedSelfAssignment.id,
      managerRevieweeEmployee.id
    );
    await store.updateEvaluationCycleStatus(createdCycle.id, "Liberado", admin);
    const individualizedSubmission = await store.submitEvaluationAssignment({
      assignmentId: managedSelfAssignment.id,
      reviewerUserId: managerRevieweeEmployee.id,
      answers: managedTemplate.questions.map((question, index) => ({
        questionId: question.id,
        score: question.inputType === "scale" ? 4 : null,
        evidenceNote: index === 0 ? "Conteudo sensivel de regressao." : "",
        textValue: "",
        selectedOptions: []
      })),
      strengthsNote: "Ponto forte individual.",
      developmentNote: "Ponto de desenvolvimento individual."
    });

    const hrResponsesBundle = await store.getEvaluationResponses(hr);
    const hrSelfResponse = hrResponsesBundle.individualResponses.find(
      (response) => response.id === individualizedSubmission.id
    );
    assert.ok(hrSelfResponse, "RH deve visualizar a resposta individualizada publicada");
    assert.equal(
      hrSelfResponse.answers[0].masked,
      true,
      "RH deve receber a pergunta sensivel mascarada quando a politica nao libera resposta bruta"
    );
    assert.equal(
      hrSelfResponse.answers[0].score,
      null,
      "Resposta sensivel deve ficar oculta por padrao"
    );
    assert.equal(
      hrSelfResponse.answers[0].questionPrompt,
      "Pergunta sensivel protegida.",
      "Prompt sensivel deve ser mascarado quando a politica nao libera leitura bruta"
    );

    const managerResponsesBundle = await store.getEvaluationResponses(manager);
    const managerSelfResponse = managerResponsesBundle.individualResponses.find(
      (response) => response.id === individualizedSubmission.id
    );
    assert.ok(
      managerSelfResponse,
      "Gestor direto deve visualizar a autoavaliacao do subordinado no bundle individual"
    );
    assert.equal(
      managerSelfResponse.answers[0].masked,
      true,
      "Gestor direto tambem deve respeitar a politica de mascaramento padrao"
    );

    const hrAuditTrailWithoutRawAccess = await store.getAuditTrail(hr, {
      category: "cycle",
      limit: 50
    });
    assert.equal(
      hrAuditTrailWithoutRawAccess.some((entry) => entry.action === "sensitive-viewed"),
      false,
      "Nao deve haver auditoria de leitura sensivel quando o bundle retorna tudo mascarado"
    );

    const legacyCrossFunctionalAssignments = await store.getEvaluationAssignmentsForUser(
      managerRevieweeEmployee.id
    );
    const legacyCrossFunctionalAssignment = legacyCrossFunctionalAssignments.find(
      (assignment) =>
        assignment.relationshipType === "cross-functional" && assignment.cycleId === "c1"
    );
    assert.ok(
      legacyCrossFunctionalAssignment,
      "Cenario demo precisa manter assignment transversal legado"
    );
    const legacyCrossFunctionalTemplate = await store.getEvaluationTemplateForAssignment(
      legacyCrossFunctionalAssignment.id,
      managerRevieweeEmployee.id
    );
    const legacyCrossFunctionalSubmission = await store.submitEvaluationAssignment({
      assignmentId: legacyCrossFunctionalAssignment.id,
      reviewerUserId: managerRevieweeEmployee.id,
      answers: legacyCrossFunctionalTemplate.questions.map((question) => ({
        questionId: question.id,
        score: question.inputType === "scale" ? 4 : null,
        evidenceNote: "",
        textValue: question.inputType === "text" ? "Resposta transversal legada." : "",
        selectedOptions: []
      })),
      strengthsNote: "Leitura transversal legada.",
      developmentNote: "Sem recomendacoes adicionais."
    });
    assert.ok(
      legacyCrossFunctionalSubmission.answers.every((answer) => answer.isSensitive),
      "Perguntas legadas com visibility confidential devem continuar marcadas como sensiveis"
    );

    const rawManagerQuestionnaire = await store.createEvaluationQuestionnaire(
      {
        cycleId: createdCycle.id,
        revieweePersonId: managerRevieweeEmployee.personId,
        relationshipType: "manager",
        title: "Feedback do lider com leitura bruta controlada",
        description: "Questionario gerencial para validar politica de respostas sensiveis."
      },
      hr
    );
    await buildQuestionnaireQuestions(rawManagerQuestionnaire.id, 15, hr);
    await store.updateEvaluationQuestionnaire(
      rawManagerQuestionnaire.id,
      {
        accessPolicy: {
          canViewReviewee: false,
          canViewReviewer: true,
          canViewManager: true,
          canViewHr: true,
          canViewAdmin: true,
          canViewRawAnswers: true,
          canViewPromptTextAfterSubmission: true
        }
      },
      hr
    );
    await store.publishEvaluationQuestionnaire(rawManagerQuestionnaire.id, hr);

    const managerAssignmentsWithRawQuestionnaire = await store.getEvaluationAssignmentsForUser(manager.id);
    const rawManagerAssignment = managerAssignmentsWithRawQuestionnaire.find(
      (assignment) =>
        assignment.cycleId === createdCycle.id && assignment.relationshipType === "manager"
    );
    assert.ok(rawManagerAssignment, "Gestor precisa receber assignment manager individualizado");

    const rawManagerTemplate = await store.getEvaluationTemplateForAssignment(
      rawManagerAssignment.id,
      manager.id
    );
    const rawManagerSubmission = await store.submitEvaluationAssignment({
      assignmentId: rawManagerAssignment.id,
      reviewerUserId: manager.id,
      answers: rawManagerTemplate.questions.map((question) => ({
        questionId: question.id,
        score: question.inputType === "scale" ? 5 : null,
        evidenceNote: question.sortOrder === 1 ? "Conteudo bruto autorizado." : "",
        textValue: "",
        selectedOptions: []
      })),
      strengthsNote: "Forca gerencial.",
      developmentNote: "Acompanhamento gerencial."
    });

    const hrResponsesBundleWithRawAccess = await store.getEvaluationResponses(hr);
    const hrRawManagerResponse = hrResponsesBundleWithRawAccess.individualResponses.find(
      (response) => response.id === rawManagerSubmission.id
    );
    assert.ok(hrRawManagerResponse, "RH deve visualizar a resposta com politica bruta habilitada");
    assert.equal(
      hrRawManagerResponse.answers[0].masked,
      undefined,
      "RH deve enxergar a resposta sensivel quando a politica libera conteudo bruto"
    );
    assert.equal(
      hrRawManagerResponse.answers[0].score,
      5,
      "Resposta sensivel deve permanecer visivel quando a politica autoriza"
    );

    const managerResponsesBundleWithRawAccess = await store.getEvaluationResponses(manager);
    const managerRawManagerResponse = managerResponsesBundleWithRawAccess.individualResponses.find(
      (response) => response.id === rawManagerSubmission.id
    );
    assert.ok(
      managerRawManagerResponse,
      "Gestor direto deve visualizar a resposta publicada com leitura bruta habilitada"
    );
    assert.equal(
      managerRawManagerResponse.answers[0].masked,
      undefined,
      "Gestor direto deve ver conteudo bruto somente quando a politica autoriza"
    );

    const employeeResponsesRoute = await fetchJson(
      "/api/evaluations/responses",
      getAuthHeader(managerRevieweeEmployee.id)
    );
    assert.equal(
      employeeResponsesRoute.response.status,
      403,
      "Colaborador nao deve acessar a rota estrategica de respostas"
    );

    const hrAuditTrail = await store.getAuditTrail(hr, {
      category: "cycle",
      limit: 50
    });
    assert.ok(
      hrAuditTrail.some((entry) => entry.action === "sensitive-viewed"),
      "Leitura de respostas sensiveis deve registrar auditoria"
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

    const managerAssignments = await store.getEvaluationAssignmentsForUser(manager.id);
    const managerFeedbackAssignment = managerAssignments.find(
      (assignment) => assignment.relationshipType === "manager" && assignment.status !== "submitted"
    );
    assert.ok(managerFeedbackAssignment, "Gestor precisa ter um assignment de feedback do lider");

    const managerSubmission = rawManagerSubmission;

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
