import assert from "node:assert/strict";
import { createTestContext } from "./testContext.mjs";
import { prepareEvaluationSubmission } from "../src/data/storeEvaluationsDomain.js";

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

    const libraryBeforeSameAreaEdit = await store.getEvaluationLibrary();
    const sameAreaGroupBeforeEdit = libraryBeforeSameAreaEdit.questionGroups.find(
      (group) => group.relationshipType === "peer-same-area"
    );
    const crossFunctionalGroupBeforeEdit = libraryBeforeSameAreaEdit.questionGroups.find(
      (group) => group.relationshipType === "cross-functional"
    );
    assert.ok(sameAreaGroupBeforeEdit, "Biblioteca manual deve expor Colega do mesmo setor");
    assert.ok(crossFunctionalGroupBeforeEdit, "Biblioteca manual deve expor Colega de outro setor");
    const crossFunctionalSnapshot = {
      count: crossFunctionalGroupBeforeEdit.questions.length,
      ids: crossFunctionalGroupBeforeEdit.questions.map((question) => question.id).join("|")
    };
    const sameAreaManualQuestion = await store.createEvaluationLibraryQuestion(
      {
        relationshipType: "peer-same-area",
        dimensionKey: "same-area-isolation",
        dimensionTitle: "Isolamento por modalidade",
        prompt: "Pergunta temporaria para validar isolamento do mesmo setor.",
        sortOrder: sameAreaGroupBeforeEdit.questions.length + 1,
        inputType: "multi-select",
        options: [
          { value: "alto", label: "Muito acima do esperado" },
          { value: "baixo", label: "Muito abaixo do esperado" }
        ],
        visibility: "shared"
      },
      hr
    );
    const createdSameAreaQuestion = sameAreaManualQuestion.questionGroups
      .find((group) => group.relationshipType === "peer-same-area")
      ?.questions.find((question) => question.dimensionKey === "same-area-isolation");
    assert.ok(createdSameAreaQuestion, "Pergunta manual deve ser criada apenas no mesmo setor");
    const crossFunctionalAfterCreate = sameAreaManualQuestion.questionGroups.find(
      (group) => group.relationshipType === "cross-functional"
    );
    assert.equal(
      crossFunctionalAfterCreate.questions.length,
      crossFunctionalSnapshot.count,
      "Criar pergunta de mesmo setor nao deve alterar quantidade de outro setor"
    );
    assert.equal(
      crossFunctionalAfterCreate.questions.map((question) => question.id).join("|"),
      crossFunctionalSnapshot.ids,
      "Criar pergunta de mesmo setor nao deve alterar perguntas de outro setor"
    );
    const sameAreaManualQuestionUpdate = await store.updateEvaluationLibraryQuestion(
      createdSameAreaQuestion.id,
      {
        relationshipType: "peer-same-area",
        dimensionKey: "same-area-isolation",
        dimensionTitle: "Isolamento por modalidade revisado",
        prompt: "Pergunta temporaria revisada para validar isolamento do mesmo setor.",
        sortOrder: createdSameAreaQuestion.sortOrder,
        inputType: "multi-select",
        options: [
          { value: "alto", label: "Muito acima do esperado" },
          { value: "baixo", label: "Muito abaixo do esperado" }
        ],
        visibility: "shared"
      },
      hr
    );
    const crossFunctionalAfterUpdate = sameAreaManualQuestionUpdate.questionGroups.find(
      (group) => group.relationshipType === "cross-functional"
    );
    assert.equal(
      crossFunctionalAfterUpdate.questions.map((question) => question.id).join("|"),
      crossFunctionalSnapshot.ids,
      "Editar pergunta de mesmo setor nao deve alterar perguntas de outro setor"
    );
    const sameAreaManualQuestionDelete = await store.deleteEvaluationLibraryQuestion(
      createdSameAreaQuestion.id,
      hr
    );
    const crossFunctionalAfterDelete = sameAreaManualQuestionDelete.questionGroups.find(
      (group) => group.relationshipType === "cross-functional"
    );
    assert.equal(
      crossFunctionalAfterDelete.questions.map((question) => question.id).join("|"),
      crossFunctionalSnapshot.ids,
      "Remover pergunta de mesmo setor nao deve alterar perguntas de outro setor"
    );

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

    const readyQuestionnaire = await store.addEvaluationQuestionnaireQuestion(
      createdQuestionnaire.id,
      questionPayload(1),
      hr
    );
    assert.equal(
      readyQuestionnaire.questionCount,
      1,
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
      1,
      "Assignment deve carregar o questionario individual publicado com quantidade flexivel"
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
        complianceGraceDueDate: "2026-10-20",
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
    const selfMaximumScoreSubmission = prepareEvaluationSubmission({
      assignment: {
        id: "assignment_self_maximum",
        cycleId: createdCycle.id,
        relationshipType: "self",
        revieweePersonId: managerRevieweeEmployee.personId
      },
      templateDefinition: selfTemplateFallback,
      payload: {
        reviewerUserId: managerRevieweeEmployee.id,
        answers: selfTemplateFallback.questions.map((question) => ({
          questionId: question.id,
          score: 5
        }))
      },
      createId: (prefix) => `${prefix}_self_maximum`,
      getAnsweredScaleScores: () => [],
      average: () => 0
    });
    assert.equal(
      selfMaximumScoreSubmission.overallScore,
      1.5,
      "Autoavaliacao com respostas maximas deve somar 1,5"
    );
    const selfFifteenQuestionMaximumScoreSubmission = prepareEvaluationSubmission({
      assignment: {
        id: "assignment_self_fifteen_maximum",
        cycleId: createdCycle.id,
        relationshipType: "self",
        revieweePersonId: manager.personId,
        scoringContext: "leader-self"
      },
      templateDefinition: {
        ...selfTemplateFallback,
        questions: selfTemplateFallback.questions.slice(0, 15)
      },
      payload: {
        reviewerUserId: manager.id,
        answers: selfTemplateFallback.questions.slice(0, 15).map((question) => ({
          questionId: question.id,
          score: 5
        }))
      },
      createId: (prefix) => `${prefix}_self_fifteen_maximum`,
      getAnsweredScaleScores: () => [],
      average: () => 0
    });
    assert.equal(
      selfFifteenQuestionMaximumScoreSubmission.overallScore,
      1.5,
      "Autoavaliacao do lider com 15 perguntas maximas deve ficar limitada a 1,5"
    );
    const selfFifteenQuestionMiddleScoreSubmission = prepareEvaluationSubmission({
      assignment: {
        id: "assignment_self_fifteen_middle",
        cycleId: createdCycle.id,
        relationshipType: "self",
        revieweePersonId: manager.personId,
        scoringContext: "leader-self"
      },
      templateDefinition: {
        ...selfTemplateFallback,
        questions: selfTemplateFallback.questions.slice(0, 15)
      },
      payload: {
        reviewerUserId: manager.id,
        answers: selfTemplateFallback.questions.slice(0, 15).map((question) => ({
          questionId: question.id,
          score: 3
        }))
      },
      createId: (prefix) => `${prefix}_self_fifteen_middle`,
      getAnsweredScaleScores: () => [],
      average: () => 0
    });
    assert.equal(
      selfFifteenQuestionMiddleScoreSubmission.overallScore,
      0.75,
      "Autoavaliacao do lider deve manter proporcionalidade dos conceitos ao mudar quantidade de perguntas"
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
      21,
      "Template gerencial deve expor 20 perguntas fechadas e 1 aberta"
    );
    assert.equal(
      managerTemplateFallback.questions.filter((question) => question.inputType !== "text").length,
      20,
      "Template gerencial deve manter 20 perguntas pontuaveis"
    );
    assert.equal(
      managerTemplateFallback.policy.scale[0].label,
      "Muito abaixo do esperado",
      "Template gerencial deve usar escala de desempenho"
    );
    const managerMaximumScoreSubmission = prepareEvaluationSubmission({
      assignment: {
        id: "assignment_manager_maximum",
        cycleId: createdCycle.id,
        relationshipType: "manager",
        revieweePersonId: managerRevieweeEmployee.personId
      },
      templateDefinition: managerTemplateFallback,
      payload: {
        reviewerUserId: manager.id,
        answers: managerTemplateFallback.questions
          .filter((question) => question.inputType !== "text")
          .map((question) => ({
            questionId: question.id,
            score: 5
          }))
      },
      createId: (prefix) => `${prefix}_manager_maximum`,
      getAnsweredScaleScores: () => [],
      average: () => 0
    });
    assert.equal(
      managerMaximumScoreSubmission.overallScore,
      7,
      "Feedback do lider sobre o colaborador deve respeitar teto de 7"
    );
    assert.equal(
      managerMaximumScoreSubmission.scoredQuestionCount,
      20,
      "Feedback do lider deve expor a quantidade de perguntas pontuaveis usada no calculo"
    );
    const managerTwentyQuestionMiddleScoreSubmission = prepareEvaluationSubmission({
      assignment: {
        id: "assignment_manager_twenty_middle",
        cycleId: createdCycle.id,
        relationshipType: "manager",
        revieweePersonId: managerRevieweeEmployee.personId
      },
      templateDefinition: managerTemplateFallback,
      payload: {
        reviewerUserId: manager.id,
        answers: managerTemplateFallback.questions
          .filter((question) => question.inputType !== "text")
          .map((question) => ({
            questionId: question.id,
            score: 3
          }))
      },
      createId: (prefix) => `${prefix}_manager_twenty_middle`,
      getAnsweredScaleScores: () => [],
      average: () => 0
    });
    assert.equal(
      managerTwentyQuestionMiddleScoreSubmission.overallScore,
      3.5,
      "Feedback do lider deve pontuar Dentro do esperado como metade do teto"
    );
    const managerTenQuestionMaximumScoreSubmission = prepareEvaluationSubmission({
      assignment: {
        id: "assignment_manager_ten_maximum",
        cycleId: createdCycle.id,
        relationshipType: "manager",
        revieweePersonId: managerRevieweeEmployee.personId
      },
      templateDefinition: {
        ...managerTemplateFallback,
        questions: managerTemplateFallback.questions
          .filter((question) => question.inputType !== "text")
          .slice(0, 10)
      },
      payload: {
        reviewerUserId: manager.id,
        answers: managerTemplateFallback.questions
          .filter((question) => question.inputType !== "text")
          .slice(0, 10)
          .map((question) => ({
            questionId: question.id,
            score: 5
          }))
      },
      createId: (prefix) => `${prefix}_manager_ten_maximum`,
      getAnsweredScaleScores: () => [],
      average: () => 0
    });
    assert.equal(
      managerTenQuestionMaximumScoreSubmission.overallScore,
      7,
      "Feedback do lider deve manter teto 7 ao mudar quantidade de perguntas"
    );
    assert.equal(
      managerTenQuestionMaximumScoreSubmission.scoredQuestionCount,
      10,
      "Feedback do lider deve recalcular a metrica de perguntas pontuaveis em questionario flexivel"
    );
    const leaderTemplateFallback = await store.getEvaluationTemplateForCycleRelationship(
      createdCycle.id,
      "leader"
    );
    const leaderMaximumScoreSubmission = prepareEvaluationSubmission({
      assignment: {
        id: "assignment_leader_maximum",
        cycleId: createdCycle.id,
        relationshipType: "leader",
        revieweePersonId: manager.personId
      },
      templateDefinition: leaderTemplateFallback,
      payload: {
        reviewerUserId: managerRevieweeEmployee.id,
        answers: leaderTemplateFallback.questions
          .filter((question) => question.inputType !== "text")
          .map((question) => ({
            questionId: question.id,
            score: 5
          }))
      },
      createId: (prefix) => `${prefix}_leader_maximum`,
      getAnsweredScaleScores: () => [],
      average: () => 0
    });
    assert.equal(
      leaderMaximumScoreSubmission.overallScore,
      2.5,
      "Avaliacao do colaborador sobre o lider deve respeitar teto de 2,5"
    );
    const leaderFifteenQuestionMaximumScoreSubmission = prepareEvaluationSubmission({
      assignment: {
        id: "assignment_leader_fifteen_maximum",
        cycleId: createdCycle.id,
        relationshipType: "leader",
        revieweePersonId: manager.personId
      },
      templateDefinition: {
        ...leaderTemplateFallback,
        questions: leaderTemplateFallback.questions
          .filter((question) => question.inputType !== "text")
          .slice(0, 15)
      },
      payload: {
        reviewerUserId: managerRevieweeEmployee.id,
        answers: leaderTemplateFallback.questions
          .filter((question) => question.inputType !== "text")
          .slice(0, 15)
          .map((question) => ({
            questionId: question.id,
            score: 5
          }))
      },
      createId: (prefix) => `${prefix}_leader_fifteen_maximum`,
      getAnsweredScaleScores: () => [],
      average: () => 0
    });
    assert.equal(
      leaderFifteenQuestionMaximumScoreSubmission.overallScore,
      2.5,
      "Avaliacao do lider com 15 perguntas maximas deve ficar limitada a 2,5"
    );
    const leaderFifteenQuestionMiddleScoreSubmission = prepareEvaluationSubmission({
      assignment: {
        id: "assignment_leader_fifteen_middle",
        cycleId: createdCycle.id,
        relationshipType: "leader",
        revieweePersonId: manager.personId
      },
      templateDefinition: {
        ...leaderTemplateFallback,
        questions: leaderTemplateFallback.questions
          .filter((question) => question.inputType !== "text")
          .slice(0, 15)
      },
      payload: {
        reviewerUserId: managerRevieweeEmployee.id,
        answers: leaderTemplateFallback.questions
          .filter((question) => question.inputType !== "text")
          .slice(0, 15)
          .map((question) => ({
            questionId: question.id,
            score: 3
          }))
      },
      createId: (prefix) => `${prefix}_leader_fifteen_middle`,
      getAnsweredScaleScores: () => [],
      average: () => 0
    });
    assert.equal(
      leaderFifteenQuestionMiddleScoreSubmission.overallScore,
      1.25,
      "Avaliacao do lider deve manter proporcionalidade dos conceitos ao mudar quantidade de perguntas"
    );
    const sameAreaPeerTemplateFallback = await store.getEvaluationTemplateForCycleRelationship(
      createdCycle.id,
      "peer-same-area"
    );
    assert.equal(
      sameAreaPeerTemplateFallback.questions.length,
      7,
      "Avaliacao por colaborador do mesmo setor deve ter exatamente 7 perguntas"
    );
    assert.deepEqual(
      sameAreaPeerTemplateFallback.questions.map((question) => question.inputType),
      Array(7).fill("scale"),
      "Avaliacao por colaborador do mesmo setor deve usar escala conforme documentacao"
    );

    const managedQuestionnaire = await store.createEvaluationQuestionnaire(
      {
        cycleId: createdCycle.id,
        revieweePersonId: managerRevieweeEmployee.personId,
        relationshipType: "leader-self",
        title: "Autoavaliacao do lider tecnico",
        description: "Questionario individual de lideranca com conteudo sensivel para subordinado direto."
      },
      hr
    );

    await buildQuestionnaireQuestions(managedQuestionnaire.id, 16, hr);
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
        assignment.relationshipType === "leader-self" && assignment.cycleId === createdCycle.id
    );
    assert.ok(
      managedSelfAssignment,
      "Subordinado lider precisa receber assignment leader-self no ciclo criado"
    );
    assert.equal(
      managedSelfAssignment.questionnaireId,
      managedQuestionnaire.id,
      "Questionario publicado deve vincular o assignment leader-self do subordinado"
    );

    const managedTemplate = await store.getEvaluationTemplateForAssignment(
      managedSelfAssignment.id,
      managerRevieweeEmployee.id
    );
    await store.updateEvaluationCycleStatus(createdCycle.id, "Liberado", admin);

    const managedLeaderAssignment = managedAssignments.find(
      (assignment) =>
        assignment.relationshipType === "leader" && assignment.cycleId === createdCycle.id
    );
    assert.ok(
      managedLeaderAssignment,
      "Subordinado do gestor precisa receber assignment para avaliar o lider"
    );
    const managedLeaderTemplate = await store.getEvaluationTemplateForAssignment(
      managedLeaderAssignment.id,
      managerRevieweeEmployee.id
    );
    const leaderAnonymousSubmission = await store.submitEvaluationAssignment({
      assignmentId: managedLeaderAssignment.id,
      reviewerUserId: managerRevieweeEmployee.id,
      answers: managedLeaderTemplate.questions.map((question) => ({
        questionId: question.id,
        score: question.inputType === "scale" ? 5 : null,
        evidenceNote: "",
        textValue: question.inputType === "text" ? "Observacao sobre a lideranca." : "",
        selectedOptions: []
      })),
      strengthsNote: "",
      developmentNote: ""
    });
    assert.equal(
      leaderAnonymousSubmission.revieweePersonId,
      managedLeaderAssignment.revieweePersonId,
      "Avaliacao do colaborador sobre o lider deve pontuar o lider avaliado"
    );
    assert.equal(
      leaderAnonymousSubmission.overallScore,
      2.5,
      "Submissao anonima de lider deve usar a pontuacao propria com teto de 2,5"
    );

    const sameAreaPeerAssignments = await store.getEvaluationAssignmentsForUser(manager.id);
    const sameAreaPeerAssignment = sameAreaPeerAssignments.find(
      (assignment) =>
        assignment.relationshipType === "peer-same-area" &&
        assignment.cycleId === createdCycle.id
    );
    assert.ok(
      sameAreaPeerAssignment,
      "Gestor deve receber avaliacao de colaborador do mesmo setor quando houver par elegivel"
    );
    assert.notEqual(
      sameAreaPeerAssignment.revieweePersonId,
      manager.personId,
      "Avaliacao do mesmo setor deve pontuar o colaborador avaliado, nao o avaliador"
    );
    const sameAreaPeerAssignmentTemplate = await store.getEvaluationTemplateForAssignment(
      sameAreaPeerAssignment.id,
      manager.id
    );
    const sameAreaPeerSubmission = await store.submitEvaluationAssignment({
      assignmentId: sameAreaPeerAssignment.id,
      reviewerUserId: manager.id,
      answers: sameAreaPeerAssignmentTemplate.questions.map((question) => ({
        questionId: question.id,
        score: 5,
        evidenceNote: "",
        textValue: "",
        selectedOptions: []
      })),
      strengthsNote: "Muito acima do esperado no mesmo setor.",
      developmentNote: ""
    });
    assert.equal(
      sameAreaPeerSubmission.revieweePersonId,
      sameAreaPeerAssignment.revieweePersonId,
      "Submissao do mesmo setor deve ficar vinculada ao colaborador avaliado"
    );
    assert.equal(
      sameAreaPeerSubmission.overallScore,
      1.5001,
      "Sete respostas E devem somar 1,5001 por arredondamento"
    );
    assert.equal(
      sameAreaPeerSubmission.weightedScore,
      1.5,
      "Pontuacao exibida nao deve multiplicar novamente o teto de 1,5"
    );
    const sameAreaPeerMinimumScore = prepareEvaluationSubmission({
      assignment: {
        id: "assignment_minimum_same_area",
        cycleId: createdCycle.id,
        relationshipType: "peer-same-area",
        revieweePersonId: managerRevieweeEmployee.personId
      },
      templateDefinition: {
        key: "peer-same-area",
        questions: sameAreaPeerAssignmentTemplate.questions
      },
      payload: {
        reviewerUserId: manager.id,
        answers: sameAreaPeerAssignmentTemplate.questions.map((question) => ({
          questionId: question.id,
          score: 1
        }))
      },
      createId: (prefix) => `${prefix}_minimum`,
      getAnsweredScaleScores: () => [],
      average: () => 0
    });
    assert.equal(
      sameAreaPeerMinimumScore.overallScore,
      0,
      "Sete respostas muito abaixo do esperado devem somar zero no mesmo setor"
    );

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
    assert.equal(
      individualizedSubmission.overallScore,
      1.125,
      "Autoavaliacao deve usar a pontuacao propria em vez da media 1-5"
    );

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
    const performanceBeforeCrossFunctionalSubmission = await fetchJson(
      "/api/evaluations/performance-360",
      getAuthHeader(admin.id)
    );
    assert.equal(
      performanceBeforeCrossFunctionalSubmission.response.status,
      200,
      "Admin deve acessar a performance antes do feedback transversal"
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
    assert.equal(
      legacyCrossFunctionalSubmission.weightedScore,
      0,
      "Colega de outro setor nao deve entrar na pontuacao final"
    );
    const performanceAfterCrossFunctionalSubmission = await fetchJson(
      "/api/evaluations/performance-360",
      getAuthHeader(admin.id)
    );
    assert.equal(
      performanceAfterCrossFunctionalSubmission.response.status,
      200,
      "Admin deve acessar a performance depois do feedback transversal"
    );
    assert.deepEqual(
      performanceAfterCrossFunctionalSubmission.payload,
      performanceBeforeCrossFunctionalSubmission.payload,
      "Feedback transversal nao deve alterar a performance 360"
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
    assert.equal(
      rawManagerSubmission.revieweePersonId,
      rawManagerAssignment.revieweePersonId,
      "Feedback do lider deve pontuar o colaborador avaliado"
    );
    assert.equal(
      rawManagerSubmission.overallScore,
      7,
      "Submissao do feedback do lider deve aplicar teto de 7"
    );
    assert.equal(
      rawManagerSubmission.weightedScore,
      7,
      "Feedback do lider nao deve multiplicar novamente o teto de 7"
    );

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
      "Colega de Outro Setor",
      "Colega de outro setor deve usar template proprio"
    );
    assert.equal(
      crossFunctionalTemplateFallback.questions.length,
      5,
      "Colega de outro setor deve expor as 5 perguntas de visibilidade"
    );
    assert.equal(
      crossFunctionalTemplateFallback.policy.scale[0].label,
      "Nao",
      "Colega de outro setor deve usar a escala Nao/Pouco/Parcialmente/Sim/Completamente"
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
        complianceGraceDueDate: "2027-01-05",
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
