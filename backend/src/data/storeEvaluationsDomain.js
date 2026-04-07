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

export function prepareEvaluationSubmission({
  assignment,
  payload,
  createId,
  getAnsweredScaleScores,
  average
}) {
  const scaleScores = getAnsweredScaleScores(payload.answers);
  const overallScore = scaleScores.length ? Number(average(scaleScores).toFixed(2)) : null;

  return {
    id: createId("submission"),
    assignmentId: assignment.id,
    cycleId: assignment.cycleId,
    reviewerUserId: payload.reviewerUserId,
    revieweePersonId: assignment.revieweePersonId,
    overallScore,
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
      questionId: answer.questionId,
      score: Number.isFinite(Number(answer.score)) ? Number(answer.score) : null,
      evidenceNote: answer.evidenceNote || "",
      textValue: answer.textValue || "",
      selectedOptions: Array.isArray(answer.selectedOptions) ? answer.selectedOptions : [],
      answerType: question?.inputType || "scale"
    };
  });
}
