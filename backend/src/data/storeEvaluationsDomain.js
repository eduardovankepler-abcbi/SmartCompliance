import {
  CYCLE_STATUS,
  DEFAULT_CYCLE_MODULE_AVAILABILITY,
  DEFAULT_TRANSVERSAL_CONFIG,
  DEFAULT_EVALUATION_LIBRARY_ID,
  DEFAULT_EVALUATION_LIBRARY_NAME,
  FEEDBACK_REQUEST_STATUS
} from "./storeConstants.js";

export function prepareEvaluationCycle({
  payload,
  createId,
  questionTemplateId,
  selectedLibrary
}) {
  return {
    id: createId("cycle"),
    ...payload,
    templateId: questionTemplateId,
    libraryId: selectedLibrary?.id || DEFAULT_EVALUATION_LIBRARY_ID,
    libraryName: selectedLibrary?.name || DEFAULT_EVALUATION_LIBRARY_NAME,
    isEnabled: true,
    moduleAvailability: { ...DEFAULT_CYCLE_MODULE_AVAILABILITY },
    transversalConfig: {
      defaultReviewersPerPerson: DEFAULT_TRANSVERSAL_CONFIG.defaultReviewersPerPerson,
      unitOverrides: {}
    },
    status: CYCLE_STATUS.planning
  };
}

export function resolveCycleConfigUpdate(currentModuleAvailability, currentTransversalConfig, payload) {
  const nextIsEnabled =
    payload?.isEnabled === undefined ? undefined : Boolean(payload.isEnabled);
  let nextModuleAvailability = null;
  let nextTransversalConfig = null;

  if (payload?.moduleAvailability !== undefined) {
    if (typeof payload.moduleAvailability !== "object" || payload.moduleAvailability === null) {
      throw new Error("moduleAvailability precisa ser um objeto.");
    }

    const allowedKeys = Object.keys(DEFAULT_CYCLE_MODULE_AVAILABILITY);
    nextModuleAvailability = { ...currentModuleAvailability };
    for (const [relationshipType, enabled] of Object.entries(payload.moduleAvailability)) {
      if (!allowedKeys.includes(relationshipType)) {
        throw new Error("Relacionamento de questionario invalido.");
      }
      nextModuleAvailability[relationshipType] = Boolean(enabled);
    }
  }

  if (payload?.transversalConfig !== undefined) {
    if (typeof payload.transversalConfig !== "object" || payload.transversalConfig === null) {
      throw new Error("transversalConfig precisa ser um objeto.");
    }

    const defaultReviewersPerPerson = Number(
      payload.transversalConfig.defaultReviewersPerPerson ??
        currentTransversalConfig?.defaultReviewersPerPerson ??
        DEFAULT_TRANSVERSAL_CONFIG.defaultReviewersPerPerson
    );
    if (!Number.isInteger(defaultReviewersPerPerson) || defaultReviewersPerPerson < 1 || defaultReviewersPerPerson > 5) {
      throw new Error("defaultReviewersPerPerson deve ser um inteiro entre 1 e 5.");
    }

    const rawOverrides =
      payload.transversalConfig.unitOverrides ??
      currentTransversalConfig?.unitOverrides ??
      DEFAULT_TRANSVERSAL_CONFIG.unitOverrides;
    if (typeof rawOverrides !== "object" || rawOverrides === null || Array.isArray(rawOverrides)) {
      throw new Error("unitOverrides precisa ser um objeto.");
    }

    const normalizedOverrides = Object.fromEntries(
      Object.entries(rawOverrides)
        .map(([unit, value]) => [String(unit || "").trim(), Number(value)])
        .filter(([unit]) => Boolean(unit))
        .map(([unit, value]) => {
          if (!Number.isInteger(value) || value < 1 || value > 5) {
            throw new Error("Cada override de unidade deve ser um inteiro entre 1 e 5.");
          }
          return [unit, value];
        })
    );

    nextTransversalConfig = {
      defaultReviewersPerPerson,
      unitOverrides: normalizedOverrides
    };
  }

  return {
    nextIsEnabled,
    nextModuleAvailability,
    nextTransversalConfig
  };
}

export function buildCycleCreatedAuditDetail({ semesterLabel, assignmentCount }) {
  return `${semesterLabel} · ${assignmentCount} assignments distribuidos`;
}

export function buildCycleReminderAuditDetail(delinquentAssignmentsCount) {
  return `${delinquentAssignmentsCount} assignments vencidos sinalizados manualmente.`;
}

export function buildCycleStatusAuditDetail(previousStatus, nextStatus) {
  return `${previousStatus} -> ${nextStatus}`;
}

export function buildCycleConfigAuditDetail(isEnabled) {
  return `Ativo: ${isEnabled ? "sim" : "nao"} · Questionarios configurados`;
}

export function prepareFeedbackRequest({ payload, actorUser, createId, requestedAt }) {
  return {
    id: createId("feedback_request"),
    cycleId: payload.cycleId,
    requesterUserId: actorUser.id,
    revieweePersonId: actorUser.person.id,
    status: FEEDBACK_REQUEST_STATUS.pending,
    contextNote: payload.contextNote.trim(),
    requestedAt
  };
}

export function buildFeedbackRequestItems({ providerPersonIds, requestId, createId }) {
  return providerPersonIds.map((providerPersonId) => ({
    id: createId("feedback_request_item"),
    requestId,
    providerPersonId,
    assignmentId: null
  }));
}

export function buildFeedbackRequestCreateAuditDetail(providerPersonIds, cycleId) {
  return `${providerPersonIds.length} fornecedores sugeridos · Ciclo ${cycleId}`;
}

export function buildFeedbackRequestReviewAuditDetail({ cycleId, contextNote }) {
  return `Ciclo ${cycleId} · Contexto: ${contextNote}`;
}

export function buildEvaluationResponseBundle({
  submissions,
  anonymousResponses,
  buildSubmission,
  actorUser,
  buildResponsesBundle,
  cycles,
  cycleReports
}) {
  const responses = [...submissions.map((item) => buildSubmission(item)), ...anonymousResponses];
  return buildResponsesBundle(responses, actorUser, {
    cycles,
    cycleReports
  });
}

export function filterReceivedManagerFeedback({
  submissions,
  actorUser,
  buildSubmission
}) {
  return submissions
    .map((item) => buildSubmission(item))
    .filter(
      (submission) =>
        submission.relationshipType === "manager" &&
        submission.revieweePersonId === actorUser?.person?.id
    )
    .sort((left, right) => {
      const rightDate = right?.submittedAt ? new Date(right.submittedAt).getTime() : 0;
      const leftDate = left?.submittedAt ? new Date(left.submittedAt).getTime() : 0;
      return rightDate - leftDate;
    });
}

const PEER_SAME_AREA_OPTION_POINTS = Object.freeze({
  A: 0,
  B: 0.0536,
  C: 0.1071,
  D: 0.1607,
  E: 0.2143
});

const EMPLOYEE_SELF_EVALUATION_CONCEPT_FACTORS = Object.freeze({
  A: 0,
  B: 0.25,
  C: 0.5,
  D: 0.75,
  E: 1
});
const EMPLOYEE_SELF_EVALUATION_MAX_SCORE = 1.5;

const LEADER_EVALUATION_CONCEPT_FACTORS = Object.freeze({
  A: 0,
  B: 0.25,
  C: 0.5,
  D: 0.75,
  E: 1
});
const LEADER_EVALUATION_MAX_SCORE = 2.5;

const LEADER_SELF_EVALUATION_CONCEPT_FACTORS = Object.freeze({
  A: 0,
  B: 0.25,
  C: 0.5,
  D: 0.75,
  E: 1
});
const LEADER_SELF_EVALUATION_MAX_SCORE = 1.5;

const MANAGER_EVALUATION_CONCEPT_FACTORS = Object.freeze({
  A: 0,
  B: 0.25,
  C: 0.5,
  D: 0.75,
  E: 1
});
const MANAGER_EVALUATION_MAX_SCORE = 7;

function normalizePerformanceConcept(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();
  if (["A", "B", "C", "D", "E"].includes(normalized)) {
    return normalized;
  }

  const text = normalized
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (text.includes("MUITO ACIMA")) {
    return "E";
  }
  if (text.includes("ACIMA")) {
    return "D";
  }
  if (text.includes("DENTRO")) {
    return "C";
  }
  if (text.includes("ABAIXO") && !text.includes("MUITO")) {
    return "B";
  }
  if (text.includes("MUITO ABAIXO")) {
    return "A";
  }
  return "";
}

function getEvaluationAnswerConcept(answer, templateDefinition) {
  const selectedOption = Array.isArray(answer.selectedOptions)
    ? answer.selectedOptions[0]
    : null;
  const question = templateDefinition?.questions?.find(
    (item) => item.id === answer.questionId
  );
  const option = question?.options?.find(
    (item) => String(item.value) === String(selectedOption)
  );

  return (
    normalizePerformanceConcept(option?.label) ||
    normalizePerformanceConcept(selectedOption) ||
    (Number.isFinite(Number(answer.score))
      ? normalizePerformanceConcept(["", "A", "B", "C", "D", "E"][Number(answer.score)])
      : "")
  );
}

function calculateConceptScore(answers = [], templateDefinition = null, pointsByConcept = {}) {
  const total = answers.reduce((sum, answer) => {
    const optionKey = getEvaluationAnswerConcept(answer, templateDefinition);
    return sum + (pointsByConcept[optionKey] ?? 0);
  }, 0);
  return Number(total.toFixed(4));
}

function calculateProportionalConceptScore({
  answers = [],
  templateDefinition = null,
  conceptFactors = {},
  maxScore
}) {
  const scoredAnswers = answers.filter((answer) => {
    const question = templateDefinition?.questions?.find(
      (item) => item.id === answer.questionId
    );
    return question?.inputType !== "text";
  });
  if (!scoredAnswers.length || !Number.isFinite(Number(maxScore))) {
    return null;
  }

  const pointsPerQuestion = Number(maxScore) / scoredAnswers.length;
  const total = scoredAnswers.reduce((sum, answer) => {
    const optionKey = getEvaluationAnswerConcept(answer, templateDefinition);
    return sum + pointsPerQuestion * (conceptFactors[optionKey] ?? 0);
  }, 0);

  return Number(Math.min(total, Number(maxScore)).toFixed(4));
}

export function countScoredEvaluationAnswers(answers = [], templateDefinition = null) {
  return answers.filter((answer) => {
    const question = templateDefinition?.questions?.find(
      (item) => item.id === answer.questionId
    );

    return (
      question?.inputType !== "text" &&
      (Number.isFinite(Number(answer.score)) ||
        (Array.isArray(answer.selectedOptions) && answer.selectedOptions.length > 0))
    );
  }).length;
}

export function calculateEvaluationOverallScore({
  relationshipType,
  scoringContext = "",
  templateDefinition,
  answers = [],
  getAnsweredScaleScores,
  average
}) {
  if (relationshipType === "peer-same-area" || templateDefinition?.key === "peer-same-area") {
    return calculateConceptScore(answers, templateDefinition, PEER_SAME_AREA_OPTION_POINTS);
  }

  if (
    relationshipType === "leader-self" ||
    templateDefinition?.key === "leader-self" ||
    (relationshipType === "self" && scoringContext === "leader-self")
  ) {
    return calculateProportionalConceptScore({
      answers,
      templateDefinition,
      conceptFactors: LEADER_SELF_EVALUATION_CONCEPT_FACTORS,
      maxScore: LEADER_SELF_EVALUATION_MAX_SCORE
    });
  }

  if (relationshipType === "self" || templateDefinition?.key === "self") {
    if (scoringContext === "leader-self") {
      return calculateProportionalConceptScore({
        answers,
        templateDefinition,
        conceptFactors: LEADER_SELF_EVALUATION_CONCEPT_FACTORS,
        maxScore: LEADER_SELF_EVALUATION_MAX_SCORE
      });
    }

    return calculateProportionalConceptScore({
      answers,
      templateDefinition,
      conceptFactors: EMPLOYEE_SELF_EVALUATION_CONCEPT_FACTORS,
      maxScore: EMPLOYEE_SELF_EVALUATION_MAX_SCORE
    });
  }

  if (relationshipType === "leader" || templateDefinition?.key === "leader") {
    return calculateProportionalConceptScore({
      answers,
      templateDefinition,
      conceptFactors: LEADER_EVALUATION_CONCEPT_FACTORS,
      maxScore: LEADER_EVALUATION_MAX_SCORE
    });
  }

  if (relationshipType === "manager" || templateDefinition?.key === "manager") {
    return calculateProportionalConceptScore({
      answers,
      templateDefinition,
      conceptFactors: MANAGER_EVALUATION_CONCEPT_FACTORS,
      maxScore: MANAGER_EVALUATION_MAX_SCORE
    });
  }

  const scaleScores = getAnsweredScaleScores(answers);
  return scaleScores.length ? Number(average(scaleScores).toFixed(2)) : null;
}

export function prepareEvaluationSubmission({
  assignment,
  templateDefinition,
  payload,
  createId,
  getAnsweredScaleScores,
  average
}) {
  const overallScore = calculateEvaluationOverallScore({
    relationshipType: assignment.relationshipType,
    scoringContext: assignment.scoringContext || "",
    templateDefinition,
    answers: payload.answers,
    getAnsweredScaleScores,
    average
  });

  return {
    id: createId("submission"),
    assignmentId: assignment.id,
    cycleId: assignment.cycleId,
    reviewerUserId: payload.reviewerUserId,
    revieweePersonId: assignment.revieweePersonId,
    overallScore,
    scoredQuestionCount: countScoredEvaluationAnswers(payload.answers, templateDefinition),
    strengthsNote: payload.strengthsNote || "",
    developmentNote: payload.developmentNote || "",
    submittedAt: new Date().toISOString()
  };
}

export function buildEvaluationAnswerRows({
  answers,
  templateDefinition,
  submissionId,
  createId
}) {
  return answers.map((answer) => {
    const question = templateDefinition.questions.find((item) => item.id === answer.questionId);

    return {
      id: createId("answer"),
      submissionId,
      questionId: question
        ? question.questionnaireQuestionId
          ? question.sourceQuestionId || null
          : answer.questionId
        : answer.questionId || null,
      questionnaireQuestionId: question?.questionnaireQuestionId || null,
      score: Number.isFinite(Number(answer.score)) ? Number(answer.score) : null,
      evidenceNote: answer.evidenceNote || "",
      textValue: String(answer.textValue || "").slice(0, 200),
      selectedOptions: Array.isArray(answer.selectedOptions) ? answer.selectedOptions : [],
      answerType: question?.inputType || "scale"
    };
  });
}
