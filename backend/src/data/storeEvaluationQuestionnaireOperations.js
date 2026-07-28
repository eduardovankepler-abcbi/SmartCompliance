import { toMysqlDateTime } from "./mysqlDateTime.js";

const QUESTIONNAIRE_STATUS = Object.freeze({
  draft: "draft",
  published: "published",
  archived: "archived"
});

const SUPPORTED_QUESTIONNAIRE_TYPES = new Set([
  "self",
  "manager",
  "leader",
  "peer-same-area",
  "cross-functional"
]);

function canManageEvaluationQuestionnaires(actorUser, { isAdminUser, isHrUser }) {
  return isAdminUser(actorUser) || isHrUser(actorUser);
}

function assertCanManageEvaluationQuestionnaires(actorUser, guards) {
  if (!canManageEvaluationQuestionnaires(actorUser, guards)) {
    throw new Error("Perfil sem permissao para gerenciar questionarios individuais.");
  }
}

function assertValidQuestionnaireRelationshipType(relationshipType) {
  if (!SUPPORTED_QUESTIONNAIRE_TYPES.has(relationshipType)) {
    throw new Error("Tipo de questionario individual invalido.");
  }
}

function assertValidQuestionnaireStatus(status) {
  if (!Object.values(QUESTIONNAIRE_STATUS).includes(status)) {
    throw new Error("Status de questionario invalido.");
  }
}

function normalizeQuestionnaireInput(payload = {}) {
  const cycleId = String(payload.cycleId || "").trim();
  const revieweePersonId = String(payload.revieweePersonId || "").trim();
  const relationshipType = String(payload.relationshipType || "").trim();
  const title = String(payload.title || "").trim();
  const description = String(payload.description || "").trim();
  const sourceLibraryId = String(payload.sourceLibraryId || "").trim() || null;
  const visibilityLevel = String(payload.visibilityLevel || "").trim() || "restricted";

  if (!cycleId) {
    throw new Error("cycleId obrigatorio.");
  }
  if (!revieweePersonId) {
    throw new Error("revieweePersonId obrigatorio.");
  }
  if (!relationshipType) {
    throw new Error("relationshipType obrigatorio.");
  }
  assertValidQuestionnaireRelationshipType(relationshipType);
  if (!title) {
    throw new Error("title obrigatorio.");
  }

  return {
    cycleId,
    revieweePersonId,
    relationshipType,
    sourceLibraryId,
    title,
    description,
    visibilityLevel
  };
}

function normalizeQuestionnaireQuestionInput(payload = {}) {
  const dimensionKey = String(payload.dimensionKey || "").trim();
  const dimensionTitle = String(payload.dimensionTitle || "").trim();
  const promptText = String(payload.promptText || payload.prompt || "").trim();
  const helperText = String(payload.helperText || "").trim();
  const sectionKey = String(payload.sectionKey || "").trim() || null;
  const sectionTitle = String(payload.sectionTitle || "").trim() || null;
  const sectionDescription = String(payload.sectionDescription || "").trim() || null;
  const inputType = String(payload.inputType || "").trim() || "scale";
  const scaleProfile = String(payload.scaleProfile || "").trim() || null;
  const visibility = String(payload.visibility || "").trim() || "restricted";
  const sortOrder = Number(payload.sortOrder);
  const isRequired = payload.isRequired !== false;
  const collectEvidenceOnExtreme = Boolean(payload.collectEvidenceOnExtreme);
  const isSensitive = Boolean(payload.isSensitive);
  const options = Array.isArray(payload.options) ? payload.options : [];

  if (!dimensionKey) {
    throw new Error("dimensionKey obrigatorio.");
  }
  if (!dimensionTitle) {
    throw new Error("dimensionTitle obrigatorio.");
  }
  if (!promptText) {
    throw new Error("promptText obrigatorio.");
  }
  if (!Number.isInteger(sortOrder) || sortOrder < 1) {
    throw new Error("sortOrder deve ser um inteiro maior que zero.");
  }
  if (!["scale", "text", "multi-select"].includes(inputType)) {
    throw new Error("inputType invalido.");
  }

  return {
    sectionKey,
    sectionTitle,
    sectionDescription,
    dimensionKey,
    dimensionTitle,
    promptText,
    helperText,
    inputType,
    scaleProfile,
    visibility,
    sortOrder,
    isRequired,
    collectEvidenceOnExtreme,
    isSensitive,
    options
  };
}

function normalizeQuestionnairePolicyInput(payload = {}) {
  return {
    canViewReviewee: Boolean(payload.canViewReviewee),
    canViewReviewer: payload.canViewReviewer !== false,
    canViewManager: Boolean(payload.canViewManager),
    canViewHr: payload.canViewHr !== false,
    canViewAdmin: payload.canViewAdmin !== false,
    canViewRawAnswers: Boolean(payload.canViewRawAnswers),
    canViewPromptTextAfterSubmission: Boolean(payload.canViewPromptTextAfterSubmission)
  };
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildDefaultQuestionnairePolicy() {
  return {
    canViewReviewee: false,
    canViewReviewer: true,
    canViewManager: true,
    canViewHr: true,
    canViewAdmin: true,
    canViewRawAnswers: false,
    canViewPromptTextAfterSubmission: false
  };
}

function buildQuestionnaireAuditSummary(actionLabel, questionnaire) {
  return `${actionLabel}: ${questionnaire.title}`;
}

function buildQuestionnaireAuditDetail(questionnaire) {
  return `${questionnaire.relationshipType} · ${questionnaire.status} · ${questionnaire.questionCount} pergunta(s)`;
}

function presentQuestionnaireQuestion(question) {
  return {
    id: question.id,
    questionnaireId: question.questionnaireId,
    sortOrder: Number(question.sortOrder || 0),
    sectionKey: question.sectionKey || "",
    sectionTitle: question.sectionTitle || "",
    sectionDescription: question.sectionDescription || "",
    dimensionKey: question.dimensionKey,
    dimensionTitle: question.dimensionTitle,
    promptText: question.promptText,
    prompt: question.promptText,
    helperText: question.helperText || "",
    inputType: question.inputType || "scale",
    scaleProfile: question.scaleProfile || "",
    visibility: question.visibility || "restricted",
    isRequired: question.isRequired !== false,
    collectEvidenceOnExtreme: Boolean(question.collectEvidenceOnExtreme),
    isSensitive: Boolean(question.isSensitive),
    options: Array.isArray(question.options) ? cloneValue(question.options) : []
  };
}

function presentQuestionnaire(questionnaire, questions = [], accessPolicy = null) {
  return {
    id: questionnaire.id,
    cycleId: questionnaire.cycleId,
    revieweePersonId: questionnaire.revieweePersonId,
    relationshipType: questionnaire.relationshipType,
    sourceLibraryId: questionnaire.sourceLibraryId || null,
    title: questionnaire.title,
    description: questionnaire.description || "",
    status: questionnaire.status,
    questionCount: Number(questionnaire.questionCount || questions.length || 0),
    visibilityLevel: questionnaire.visibilityLevel || "restricted",
    versionNumber: Number(questionnaire.versionNumber || 1),
    publishedAt: questionnaire.publishedAt || null,
    createdByUserId: questionnaire.createdByUserId,
    updatedByUserId: questionnaire.updatedByUserId || null,
    createdAt: questionnaire.createdAt,
    updatedAt: questionnaire.updatedAt,
    questions: [...questions]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((question) => presentQuestionnaireQuestion(question)),
    accessPolicy: accessPolicy ? cloneValue(accessPolicy) : buildDefaultQuestionnairePolicy()
  };
}

function assertQuestionnaireEditable(questionnaire) {
  assertValidQuestionnaireStatus(questionnaire.status);
  if (questionnaire.status !== QUESTIONNAIRE_STATUS.draft) {
    throw new Error("Somente questionarios em draft podem ser alterados.");
  }
}

function validateQuestionnairePublication(questionnaire, questions) {
  assertQuestionnaireEditable(questionnaire);
  if (!SUPPORTED_QUESTIONNAIRE_TYPES.has(questionnaire.relationshipType)) {
    throw new Error("Tipo de questionario sem configuracao de publicacao.");
  }
  if (questions.length < 1) {
    throw new Error("Questionario precisa ter pelo menos uma pergunta para publicar.");
  }

  const seenSortOrders = new Set();
  for (const question of questions) {
    if (!String(question.promptText || "").trim()) {
      throw new Error("Nao e possivel publicar pergunta sem enunciado.");
    }
    if (seenSortOrders.has(question.sortOrder)) {
      throw new Error("Nao e possivel publicar questionario com sortOrder duplicado.");
    }
    seenSortOrders.add(question.sortOrder);
  }
}

function filterQuestionnaires(questionnaires, filters = {}) {
  return questionnaires.filter((questionnaire) => {
    if (filters.cycleId && questionnaire.cycleId !== filters.cycleId) {
      return false;
    }
    if (filters.revieweePersonId && questionnaire.revieweePersonId !== filters.revieweePersonId) {
      return false;
    }
    if (filters.relationshipType && questionnaire.relationshipType !== filters.relationshipType) {
      return false;
    }
    if (filters.status && questionnaire.status !== filters.status) {
      return false;
    }
    return true;
  });
}

export function createMemoryEvaluationQuestionnaireStore({
  db,
  createId,
  isAdminUser,
  isHrUser,
  pushAuditLog,
  AUDIT_CATEGORIES
}) {
  const guards = { isAdminUser, isHrUser };

  function getQuestionnaireQuestions(questionnaireId) {
    return db.questionnaireQuestions.filter((item) => item.questionnaireId === questionnaireId);
  }

  function getQuestionnaireAccessPolicy(questionnaireId) {
    return (
      db.questionnaireAccessPolicies.find((item) => item.questionnaireId === questionnaireId) ||
      buildDefaultQuestionnairePolicy()
    );
  }

  return {
    async getEvaluationQuestionnaires(filters = {}, actorUser) {
      assertCanManageEvaluationQuestionnaires(actorUser, guards);
      return filterQuestionnaires(db.questionnaires, filters).map((questionnaire) =>
        presentQuestionnaire(
          questionnaire,
          getQuestionnaireQuestions(questionnaire.id),
          getQuestionnaireAccessPolicy(questionnaire.id)
        )
      );
    },

    async getEvaluationQuestionnaireById(questionnaireId, actorUser) {
      assertCanManageEvaluationQuestionnaires(actorUser, guards);
      const questionnaire = db.questionnaires.find((item) => item.id === questionnaireId);
      if (!questionnaire) {
        throw new Error("Questionario individual nao encontrado.");
      }
      return presentQuestionnaire(
        questionnaire,
        getQuestionnaireQuestions(questionnaire.id),
        getQuestionnaireAccessPolicy(questionnaire.id)
      );
    },

    async createEvaluationQuestionnaire(payload, actorUser) {
      assertCanManageEvaluationQuestionnaires(actorUser, guards);
      const input = normalizeQuestionnaireInput(payload);
      const timestamp = toMysqlDateTime(new Date());
      const questionnaire = {
        id: createId("questionnaire"),
        cycleId: input.cycleId,
        revieweePersonId: input.revieweePersonId,
        relationshipType: input.relationshipType,
        sourceLibraryId: input.sourceLibraryId,
        title: input.title,
        description: input.description,
        status: QUESTIONNAIRE_STATUS.draft,
        questionCount: 0,
        visibilityLevel: input.visibilityLevel,
        versionNumber: 1,
        publishedAt: null,
        createdByUserId: actorUser.id,
        updatedByUserId: actorUser.id,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      const accessPolicy = {
        id: createId("questionnaire_policy"),
        questionnaireId: questionnaire.id,
        ...buildDefaultQuestionnairePolicy(),
        createdAt: timestamp,
        updatedAt: timestamp
      };
      db.questionnaires.unshift(questionnaire);
      db.questionnaireAccessPolicies.unshift(accessPolicy);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.cycle,
        action: "questionnaire_created",
        entityType: "evaluation_questionnaire",
        entityId: questionnaire.id,
        entityLabel: questionnaire.title,
        actorUser,
        summary: buildQuestionnaireAuditSummary("Questionario criado", questionnaire),
        detail: buildQuestionnaireAuditDetail(questionnaire)
      });
      return presentQuestionnaire(questionnaire, [], accessPolicy);
    },

    async updateEvaluationQuestionnaire(questionnaireId, payload, actorUser) {
      assertCanManageEvaluationQuestionnaires(actorUser, guards);
      const questionnaire = db.questionnaires.find((item) => item.id === questionnaireId);
      if (!questionnaire) {
        throw new Error("Questionario individual nao encontrado.");
      }
      assertQuestionnaireEditable(questionnaire);
      const input = normalizeQuestionnaireInput({
        cycleId: questionnaire.cycleId,
        revieweePersonId: questionnaire.revieweePersonId,
        relationshipType: questionnaire.relationshipType,
        ...payload,
        title: payload.title ?? questionnaire.title
      });
      questionnaire.sourceLibraryId = input.sourceLibraryId;
      questionnaire.title = input.title;
      questionnaire.description = input.description;
      questionnaire.visibilityLevel = input.visibilityLevel;
      questionnaire.updatedByUserId = actorUser.id;
      questionnaire.updatedAt = new Date().toISOString();

      const currentPolicy = db.questionnaireAccessPolicies.find(
        (item) => item.questionnaireId === questionnaireId
      );
      if (payload.accessPolicy && currentPolicy) {
        Object.assign(currentPolicy, normalizeQuestionnairePolicyInput(payload.accessPolicy), {
          updatedAt: questionnaire.updatedAt
        });
      }

      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.cycle,
        action: "questionnaire_updated",
        entityType: "evaluation_questionnaire",
        entityId: questionnaire.id,
        entityLabel: questionnaire.title,
        actorUser,
        summary: buildQuestionnaireAuditSummary("Questionario atualizado", questionnaire),
        detail: buildQuestionnaireAuditDetail(questionnaire)
      });
      return presentQuestionnaire(
        questionnaire,
        getQuestionnaireQuestions(questionnaire.id),
        getQuestionnaireAccessPolicy(questionnaire.id)
      );
    },

    async archiveEvaluationQuestionnaire(questionnaireId, actorUser) {
      assertCanManageEvaluationQuestionnaires(actorUser, guards);
      const questionnaire = db.questionnaires.find((item) => item.id === questionnaireId);
      if (!questionnaire) {
        throw new Error("Questionario individual nao encontrado.");
      }
      questionnaire.status = QUESTIONNAIRE_STATUS.archived;
      questionnaire.updatedByUserId = actorUser.id;
      questionnaire.updatedAt = new Date().toISOString();
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.cycle,
        action: "questionnaire_archived",
        entityType: "evaluation_questionnaire",
        entityId: questionnaire.id,
        entityLabel: questionnaire.title,
        actorUser,
        summary: buildQuestionnaireAuditSummary("Questionario arquivado", questionnaire),
        detail: buildQuestionnaireAuditDetail(questionnaire)
      });
      return presentQuestionnaire(
        questionnaire,
        getQuestionnaireQuestions(questionnaire.id),
        getQuestionnaireAccessPolicy(questionnaire.id)
      );
    },

    async addEvaluationQuestionnaireQuestion(questionnaireId, payload, actorUser) {
      assertCanManageEvaluationQuestionnaires(actorUser, guards);
      const questionnaire = db.questionnaires.find((item) => item.id === questionnaireId);
      if (!questionnaire) {
        throw new Error("Questionario individual nao encontrado.");
      }
      assertQuestionnaireEditable(questionnaire);
      const input = normalizeQuestionnaireQuestionInput(payload);
      const questions = getQuestionnaireQuestions(questionnaireId);
      if (questions.some((item) => Number(item.sortOrder) === input.sortOrder)) {
        throw new Error("Ja existe uma pergunta com esse sortOrder.");
      }
      const timestamp = new Date().toISOString();
      const question = {
        id: createId("questionnaire_question"),
        questionnaireId,
        ...input,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      db.questionnaireQuestions.unshift(question);
      questionnaire.questionCount = getQuestionnaireQuestions(questionnaireId).length;
      questionnaire.updatedByUserId = actorUser.id;
      questionnaire.updatedAt = timestamp;
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.cycle,
        action: "questionnaire_question_created",
        entityType: "evaluation_questionnaire",
        entityId: questionnaire.id,
        entityLabel: questionnaire.title,
        actorUser,
        summary: `Pergunta adicionada ao questionario: ${questionnaire.title}`,
        detail: `${question.dimensionTitle} · ordem ${question.sortOrder}`
      });
      return presentQuestionnaire(
        questionnaire,
        getQuestionnaireQuestions(questionnaire.id),
        getQuestionnaireAccessPolicy(questionnaire.id)
      );
    },

    async updateEvaluationQuestionnaireQuestion(questionId, payload, actorUser) {
      assertCanManageEvaluationQuestionnaires(actorUser, guards);
      const question = db.questionnaireQuestions.find((item) => item.id === questionId);
      if (!question) {
        throw new Error("Pergunta do questionario nao encontrada.");
      }
      const questionnaire = db.questionnaires.find((item) => item.id === question.questionnaireId);
      if (!questionnaire) {
        throw new Error("Questionario individual nao encontrado.");
      }
      assertQuestionnaireEditable(questionnaire);
      const input = normalizeQuestionnaireQuestionInput({
        ...question,
        ...payload
      });
      const siblingQuestions = getQuestionnaireQuestions(question.questionnaireId).filter(
        (item) => item.id !== questionId
      );
      if (siblingQuestions.some((item) => Number(item.sortOrder) === input.sortOrder)) {
        throw new Error("Ja existe uma pergunta com esse sortOrder.");
      }
      Object.assign(question, input, { updatedAt: new Date().toISOString() });
      questionnaire.updatedByUserId = actorUser.id;
      questionnaire.updatedAt = question.updatedAt;
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.cycle,
        action: "questionnaire_question_updated",
        entityType: "evaluation_questionnaire",
        entityId: questionnaire.id,
        entityLabel: questionnaire.title,
        actorUser,
        summary: `Pergunta atualizada no questionario: ${questionnaire.title}`,
        detail: `${question.dimensionTitle} · ordem ${question.sortOrder}`
      });
      return presentQuestionnaire(
        questionnaire,
        getQuestionnaireQuestions(questionnaire.id),
        getQuestionnaireAccessPolicy(questionnaire.id)
      );
    },

    async deleteEvaluationQuestionnaireQuestion(questionId, actorUser) {
      assertCanManageEvaluationQuestionnaires(actorUser, guards);
      const question = db.questionnaireQuestions.find((item) => item.id === questionId);
      if (!question) {
        throw new Error("Pergunta do questionario nao encontrada.");
      }
      const questionnaire = db.questionnaires.find((item) => item.id === question.questionnaireId);
      if (!questionnaire) {
        throw new Error("Questionario individual nao encontrado.");
      }
      assertQuestionnaireEditable(questionnaire);
      db.questionnaireQuestions = db.questionnaireQuestions.filter((item) => item.id !== questionId);
      questionnaire.questionCount = getQuestionnaireQuestions(question.questionnaireId).length;
      questionnaire.updatedByUserId = actorUser.id;
      questionnaire.updatedAt = new Date().toISOString();
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.cycle,
        action: "questionnaire_question_deleted",
        entityType: "evaluation_questionnaire",
        entityId: questionnaire.id,
        entityLabel: questionnaire.title,
        actorUser,
        summary: `Pergunta removida do questionario: ${questionnaire.title}`,
        detail: `${question.dimensionTitle} · ordem ${question.sortOrder}`
      });
      return presentQuestionnaire(
        questionnaire,
        getQuestionnaireQuestions(questionnaire.id),
        getQuestionnaireAccessPolicy(questionnaire.id)
      );
    },

    async reorderEvaluationQuestionnaireQuestions(questionnaireId, payload, actorUser) {
      assertCanManageEvaluationQuestionnaires(actorUser, guards);
      const questionnaire = db.questionnaires.find((item) => item.id === questionnaireId);
      if (!questionnaire) {
        throw new Error("Questionario individual nao encontrado.");
      }
      assertQuestionnaireEditable(questionnaire);
      const items = Array.isArray(payload?.items) ? payload.items : [];
      if (!items.length) {
        throw new Error("items obrigatorio.");
      }
      const questions = getQuestionnaireQuestions(questionnaireId);
      const questionById = new Map(questions.map((item) => [item.id, item]));
      const seenSortOrders = new Set();
      items.forEach((item) => {
        const question = questionById.get(item.questionId);
        const nextSortOrder = Number(item.sortOrder);
        if (!question) {
          throw new Error("Pergunta informada nao pertence ao questionario.");
        }
        if (!Number.isInteger(nextSortOrder) || nextSortOrder < 1) {
          throw new Error("sortOrder deve ser inteiro maior que zero.");
        }
        if (seenSortOrders.has(nextSortOrder)) {
          throw new Error("Nao e possivel reordenar com sortOrder duplicado.");
        }
        seenSortOrders.add(nextSortOrder);
        question.sortOrder = nextSortOrder;
        question.updatedAt = new Date().toISOString();
      });
      questionnaire.updatedByUserId = actorUser.id;
      questionnaire.updatedAt = new Date().toISOString();
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.cycle,
        action: "questionnaire_questions_reordered",
        entityType: "evaluation_questionnaire",
        entityId: questionnaire.id,
        entityLabel: questionnaire.title,
        actorUser,
        summary: `Perguntas reordenadas no questionario: ${questionnaire.title}`,
        detail: `${items.length} pergunta(s) reordenadas`
      });
      return presentQuestionnaire(
        questionnaire,
        getQuestionnaireQuestions(questionnaire.id),
        getQuestionnaireAccessPolicy(questionnaire.id)
      );
    },

    async publishEvaluationQuestionnaire(questionnaireId, actorUser) {
      assertCanManageEvaluationQuestionnaires(actorUser, guards);
      const questionnaire = db.questionnaires.find((item) => item.id === questionnaireId);
      if (!questionnaire) {
        throw new Error("Questionario individual nao encontrado.");
      }
      const questions = getQuestionnaireQuestions(questionnaireId);
      validateQuestionnairePublication(questionnaire, questions);
      questionnaire.status = QUESTIONNAIRE_STATUS.published;
      questionnaire.questionCount = questions.length;
      questionnaire.publishedAt = new Date().toISOString();
      questionnaire.updatedByUserId = actorUser.id;
      questionnaire.updatedAt = questionnaire.publishedAt;
      db.assignments.forEach((assignment) => {
        if (
          assignment.cycleId === questionnaire.cycleId &&
          assignment.revieweePersonId === questionnaire.revieweePersonId &&
          assignment.relationshipType === questionnaire.relationshipType
        ) {
          assignment.questionnaireId = questionnaire.id;
        }
      });
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.cycle,
        action: "questionnaire_published",
        entityType: "evaluation_questionnaire",
        entityId: questionnaire.id,
        entityLabel: questionnaire.title,
        actorUser,
        summary: buildQuestionnaireAuditSummary("Questionario publicado", questionnaire),
        detail: buildQuestionnaireAuditDetail(questionnaire)
      });
      return presentQuestionnaire(
        questionnaire,
        questions,
        getQuestionnaireAccessPolicy(questionnaire.id)
      );
    }
  };
}

export function createMysqlEvaluationQuestionnaireStore({
  pool,
  createId,
  isAdminUser,
  isHrUser,
  insertAuditLog,
  AUDIT_CATEGORIES
}) {
  const guards = { isAdminUser, isHrUser };

  async function fetchQuestionnaireRows(target, filters = {}) {
    const clauses = [];
    const params = [];
    if (filters.id) {
      clauses.push("q.id = ?");
      params.push(filters.id);
    }
    if (filters.cycleId) {
      clauses.push("q.cycle_id = ?");
      params.push(filters.cycleId);
    }
    if (filters.revieweePersonId) {
      clauses.push("q.reviewee_person_id = ?");
      params.push(filters.revieweePersonId);
    }
    if (filters.relationshipType) {
      clauses.push("q.relationship_type = ?");
      params.push(filters.relationshipType);
    }
    if (filters.status) {
      clauses.push("q.status = ?");
      params.push(filters.status);
    }

    const [rows] = await target.query(
      `SELECT q.id, q.cycle_id AS cycleId, q.reviewee_person_id AS revieweePersonId,
              q.relationship_type AS relationshipType, q.source_library_id AS sourceLibraryId,
              q.title, q.description, q.status, q.question_count AS questionCount,
              q.visibility_level AS visibilityLevel, q.version_number AS versionNumber,
              q.published_at AS publishedAt, q.created_by_user_id AS createdByUserId,
              q.updated_by_user_id AS updatedByUserId, q.created_at AS createdAt, q.updated_at AS updatedAt
       FROM evaluation_questionnaires q
       ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}
       ORDER BY q.created_at DESC`,
      params
    );
    return rows;
  }

  async function fetchQuestionRows(target, questionnaireIds) {
    if (!questionnaireIds.length) {
      return [];
    }
    const placeholders = questionnaireIds.map(() => "?").join(", ");
    const [rows] = await target.query(
      `SELECT q.id, q.questionnaire_id AS questionnaireId, q.sort_order AS sortOrder,
              q.section_key AS sectionKey, q.section_title AS sectionTitle,
              q.section_description AS sectionDescription, q.dimension_key AS dimensionKey,
              q.dimension_title AS dimensionTitle, q.prompt_text AS promptText,
              q.helper_text AS helperText, q.input_type AS inputType, q.scale_profile AS scaleProfile,
              q.visibility, q.is_required AS isRequired,
              q.collect_evidence_on_extreme AS collectEvidenceOnExtreme,
              q.is_sensitive AS isSensitive, q.options_json AS optionsJson,
              q.created_at AS createdAt, q.updated_at AS updatedAt
       FROM evaluation_questionnaire_questions q
       WHERE q.questionnaire_id IN (${placeholders})
       ORDER BY q.questionnaire_id, q.sort_order`,
      questionnaireIds
    );
    return rows.map((row) => ({
      ...row,
      options: row.optionsJson
        ? typeof row.optionsJson === "string"
          ? JSON.parse(row.optionsJson)
          : row.optionsJson
        : []
    }));
  }

  async function fetchPolicyRows(target, questionnaireIds) {
    if (!questionnaireIds.length) {
      return [];
    }
    const placeholders = questionnaireIds.map(() => "?").join(", ");
    const [rows] = await target.query(
      `SELECT p.id, p.questionnaire_id AS questionnaireId,
              p.can_view_reviewee AS canViewReviewee,
              p.can_view_reviewer AS canViewReviewer,
              p.can_view_manager AS canViewManager,
              p.can_view_hr AS canViewHr,
              p.can_view_admin AS canViewAdmin,
              p.can_view_raw_answers AS canViewRawAnswers,
              p.can_view_prompt_text_after_submission AS canViewPromptTextAfterSubmission,
              p.created_at AS createdAt, p.updated_at AS updatedAt
       FROM evaluation_questionnaire_access_policies p
       WHERE p.questionnaire_id IN (${placeholders})`,
      questionnaireIds
    );
    return rows;
  }

  async function loadQuestionnaireBundle(target, filters = {}) {
    const questionnaireRows = await fetchQuestionnaireRows(target, filters);
    const questionnaireIds = questionnaireRows.map((item) => item.id);
    const [questionRows, policyRows] = await Promise.all([
      fetchQuestionRows(target, questionnaireIds),
      fetchPolicyRows(target, questionnaireIds)
    ]);
    const questionsByQuestionnaireId = questionRows.reduce((acc, item) => {
      acc[item.questionnaireId] = acc[item.questionnaireId] || [];
      acc[item.questionnaireId].push(item);
      return acc;
    }, {});
    const policyByQuestionnaireId = new Map(policyRows.map((item) => [item.questionnaireId, item]));
    return questionnaireRows.map((questionnaire) =>
      presentQuestionnaire(
        questionnaire,
        questionsByQuestionnaireId[questionnaire.id] || [],
        policyByQuestionnaireId.get(questionnaire.id) || buildDefaultQuestionnairePolicy()
      )
    );
  }

  return {
    async getEvaluationQuestionnaires(filters = {}, actorUser) {
      assertCanManageEvaluationQuestionnaires(actorUser, guards);
      return loadQuestionnaireBundle(pool, filters);
    },

    async getEvaluationQuestionnaireById(questionnaireId, actorUser) {
      assertCanManageEvaluationQuestionnaires(actorUser, guards);
      const [questionnaire] = await loadQuestionnaireBundle(pool, { id: questionnaireId });
      if (!questionnaire) {
        throw new Error("Questionario individual nao encontrado.");
      }
      return questionnaire;
    },

    async createEvaluationQuestionnaire(payload, actorUser) {
      assertCanManageEvaluationQuestionnaires(actorUser, guards);
      const input = normalizeQuestionnaireInput(payload);
      const timestamp = new Date().toISOString();
      const questionnaireId = createId("questionnaire");
      const policyId = createId("questionnaire_policy");
      const defaultPolicy = buildDefaultQuestionnairePolicy();

      await pool.query(
        `INSERT INTO evaluation_questionnaires
         (id, cycle_id, reviewee_person_id, relationship_type, source_library_id, title, description,
          status, question_count, visibility_level, version_number, published_at, created_by_user_id,
          updated_by_user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          questionnaireId,
          input.cycleId,
          input.revieweePersonId,
          input.relationshipType,
          input.sourceLibraryId,
          input.title,
          input.description,
          QUESTIONNAIRE_STATUS.draft,
          0,
          input.visibilityLevel,
          1,
          null,
          actorUser.id,
          actorUser.id,
          timestamp,
          timestamp
        ]
      );

      await pool.query(
        `INSERT INTO evaluation_questionnaire_access_policies
         (id, questionnaire_id, can_view_reviewee, can_view_reviewer, can_view_manager,
          can_view_hr, can_view_admin, can_view_raw_answers,
          can_view_prompt_text_after_submission, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          policyId,
          questionnaireId,
          defaultPolicy.canViewReviewee,
          defaultPolicy.canViewReviewer,
          defaultPolicy.canViewManager,
          defaultPolicy.canViewHr,
          defaultPolicy.canViewAdmin,
          defaultPolicy.canViewRawAnswers,
          defaultPolicy.canViewPromptTextAfterSubmission,
          timestamp,
          timestamp
        ]
      );

      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.cycle,
        action: "questionnaire_created",
        entityType: "evaluation_questionnaire",
        entityId: questionnaireId,
        entityLabel: input.title,
        actorUser,
        summary: buildQuestionnaireAuditSummary("Questionario criado", {
          title: input.title
        }),
        detail: `${input.relationshipType} · draft · 0 pergunta(s)`
      });

      return this.getEvaluationQuestionnaireById(questionnaireId, actorUser);
    },

    async updateEvaluationQuestionnaire(questionnaireId, payload, actorUser) {
      assertCanManageEvaluationQuestionnaires(actorUser, guards);
      const current = await this.getEvaluationQuestionnaireById(questionnaireId, actorUser);
      assertQuestionnaireEditable(current);
      const input = normalizeQuestionnaireInput({
        cycleId: current.cycleId,
        revieweePersonId: current.revieweePersonId,
        relationshipType: current.relationshipType,
        ...current,
        ...payload
      });
      const policy = payload.accessPolicy
        ? normalizeQuestionnairePolicyInput(payload.accessPolicy)
        : current.accessPolicy;
      const updatedAt = toMysqlDateTime(new Date());

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(
          `UPDATE evaluation_questionnaires
           SET source_library_id = ?, title = ?, description = ?, visibility_level = ?,
               updated_by_user_id = ?, updated_at = ?
           WHERE id = ?`,
          [
            input.sourceLibraryId,
            input.title,
            input.description,
            input.visibilityLevel,
            actorUser.id,
            updatedAt,
            questionnaireId
          ]
        );
        await connection.query(
          `UPDATE evaluation_questionnaire_access_policies
           SET can_view_reviewee = ?, can_view_reviewer = ?, can_view_manager = ?,
               can_view_hr = ?, can_view_admin = ?, can_view_raw_answers = ?,
               can_view_prompt_text_after_submission = ?, updated_at = ?
           WHERE questionnaire_id = ?`,
          [
            policy.canViewReviewee,
            policy.canViewReviewer,
            policy.canViewManager,
            policy.canViewHr,
            policy.canViewAdmin,
            policy.canViewRawAnswers,
            policy.canViewPromptTextAfterSubmission,
            updatedAt,
            questionnaireId
          ]
        );
        await insertAuditLog(connection, {
          category: AUDIT_CATEGORIES.cycle,
          action: "questionnaire_updated",
          entityType: "evaluation_questionnaire",
          entityId: questionnaireId,
          entityLabel: input.title,
          actorUser,
          summary: buildQuestionnaireAuditSummary("Questionario atualizado", {
            title: input.title
          }),
          detail: `${current.relationshipType} · ${current.status} · ${current.questionCount} pergunta(s)`
        });
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
      return this.getEvaluationQuestionnaireById(questionnaireId, actorUser);
    },

    async archiveEvaluationQuestionnaire(questionnaireId, actorUser) {
      assertCanManageEvaluationQuestionnaires(actorUser, guards);
      const current = await this.getEvaluationQuestionnaireById(questionnaireId, actorUser);
      const updatedAt = toMysqlDateTime(new Date());
      await pool.query(
        `UPDATE evaluation_questionnaires
         SET status = ?, updated_by_user_id = ?, updated_at = ?
         WHERE id = ?`,
        [QUESTIONNAIRE_STATUS.archived, actorUser.id, updatedAt, questionnaireId]
      );
      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.cycle,
        action: "questionnaire_archived",
        entityType: "evaluation_questionnaire",
        entityId: questionnaireId,
        entityLabel: current.title,
        actorUser,
        summary: buildQuestionnaireAuditSummary("Questionario arquivado", current),
        detail: `${current.relationshipType} · archived · ${current.questionCount} pergunta(s)`
      });
      return this.getEvaluationQuestionnaireById(questionnaireId, actorUser);
    },

    async addEvaluationQuestionnaireQuestion(questionnaireId, payload, actorUser) {
      assertCanManageEvaluationQuestionnaires(actorUser, guards);
      const current = await this.getEvaluationQuestionnaireById(questionnaireId, actorUser);
      assertQuestionnaireEditable(current);
      const input = normalizeQuestionnaireQuestionInput(payload);
      if (current.questions.some((item) => Number(item.sortOrder) === input.sortOrder)) {
        throw new Error("Ja existe uma pergunta com esse sortOrder.");
      }
      const timestamp = toMysqlDateTime(new Date());
      const questionId = createId("questionnaire_question");
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(
          `INSERT INTO evaluation_questionnaire_questions
           (id, questionnaire_id, sort_order, section_key, section_title, section_description,
            dimension_key, dimension_title, prompt_text, helper_text, input_type, scale_profile,
            visibility, is_required, collect_evidence_on_extreme, is_sensitive, options_json,
            created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            questionId,
            questionnaireId,
            input.sortOrder,
            input.sectionKey,
            input.sectionTitle,
            input.sectionDescription,
            input.dimensionKey,
            input.dimensionTitle,
            input.promptText,
            input.helperText,
            input.inputType,
            input.scaleProfile,
            input.visibility,
            input.isRequired,
            input.collectEvidenceOnExtreme,
            input.isSensitive,
            JSON.stringify(input.options),
            timestamp,
            timestamp
          ]
        );
        await connection.query(
          `UPDATE evaluation_questionnaires
           SET question_count = question_count + 1, updated_by_user_id = ?, updated_at = ?
           WHERE id = ?`,
          [actorUser.id, timestamp, questionnaireId]
        );
        await insertAuditLog(connection, {
          category: AUDIT_CATEGORIES.cycle,
          action: "questionnaire_question_created",
          entityType: "evaluation_questionnaire",
          entityId: questionnaireId,
          entityLabel: current.title,
          actorUser,
          summary: `Pergunta adicionada ao questionario: ${current.title}`,
          detail: `${input.dimensionTitle} · ordem ${input.sortOrder}`
        });
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
      return this.getEvaluationQuestionnaireById(questionnaireId, actorUser);
    },

    async updateEvaluationQuestionnaireQuestion(questionId, payload, actorUser) {
      assertCanManageEvaluationQuestionnaires(actorUser, guards);
      const [rows] = await pool.query(
        `SELECT questionnaire_id AS questionnaireId
         FROM evaluation_questionnaire_questions
         WHERE id = ?
         LIMIT 1`,
        [questionId]
      );
      if (!rows[0]) {
        throw new Error("Pergunta do questionario nao encontrada.");
      }
      const current = await this.getEvaluationQuestionnaireById(rows[0].questionnaireId, actorUser);
      assertQuestionnaireEditable(current);
      const existingQuestion = current.questions.find((item) => item.id === questionId);
      const input = normalizeQuestionnaireQuestionInput({
        ...existingQuestion,
        ...payload
      });
      if (
        current.questions.some(
          (item) => item.id !== questionId && Number(item.sortOrder) === input.sortOrder
        )
      ) {
        throw new Error("Ja existe uma pergunta com esse sortOrder.");
      }
      const updatedAt = toMysqlDateTime(new Date());
      await pool.query(
        `UPDATE evaluation_questionnaire_questions
         SET sort_order = ?, section_key = ?, section_title = ?, section_description = ?,
             dimension_key = ?, dimension_title = ?, prompt_text = ?, helper_text = ?,
             input_type = ?, scale_profile = ?, visibility = ?, is_required = ?,
             collect_evidence_on_extreme = ?, is_sensitive = ?, options_json = ?, updated_at = ?
         WHERE id = ?`,
        [
          input.sortOrder,
          input.sectionKey,
          input.sectionTitle,
          input.sectionDescription,
          input.dimensionKey,
          input.dimensionTitle,
          input.promptText,
          input.helperText,
          input.inputType,
          input.scaleProfile,
          input.visibility,
          input.isRequired,
          input.collectEvidenceOnExtreme,
          input.isSensitive,
          JSON.stringify(input.options),
          updatedAt,
          questionId
        ]
      );
      await pool.query(
        `UPDATE evaluation_questionnaires
         SET updated_by_user_id = ?, updated_at = ?
         WHERE id = ?`,
        [actorUser.id, updatedAt, rows[0].questionnaireId]
      );
      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.cycle,
        action: "questionnaire_question_updated",
        entityType: "evaluation_questionnaire",
        entityId: rows[0].questionnaireId,
        entityLabel: current.title,
        actorUser,
        summary: `Pergunta atualizada no questionario: ${current.title}`,
        detail: `${input.dimensionTitle} · ordem ${input.sortOrder}`
      });
      return this.getEvaluationQuestionnaireById(rows[0].questionnaireId, actorUser);
    },

    async deleteEvaluationQuestionnaireQuestion(questionId, actorUser) {
      assertCanManageEvaluationQuestionnaires(actorUser, guards);
      const [rows] = await pool.query(
        `SELECT id, questionnaire_id AS questionnaireId, dimension_title AS dimensionTitle, sort_order AS sortOrder
         FROM evaluation_questionnaire_questions
         WHERE id = ?
         LIMIT 1`,
        [questionId]
      );
      if (!rows[0]) {
        throw new Error("Pergunta do questionario nao encontrada.");
      }
      const current = await this.getEvaluationQuestionnaireById(rows[0].questionnaireId, actorUser);
      assertQuestionnaireEditable(current);
      const updatedAt = toMysqlDateTime(new Date());
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(`DELETE FROM evaluation_questionnaire_questions WHERE id = ?`, [
          questionId
        ]);
        await connection.query(
          `UPDATE evaluation_questionnaires
           SET question_count = GREATEST(question_count - 1, 0), updated_by_user_id = ?, updated_at = ?
           WHERE id = ?`,
          [actorUser.id, updatedAt, rows[0].questionnaireId]
        );
        await insertAuditLog(connection, {
          category: AUDIT_CATEGORIES.cycle,
          action: "questionnaire_question_deleted",
          entityType: "evaluation_questionnaire",
          entityId: rows[0].questionnaireId,
          entityLabel: current.title,
          actorUser,
          summary: `Pergunta removida do questionario: ${current.title}`,
          detail: `${rows[0].dimensionTitle} · ordem ${rows[0].sortOrder}`
        });
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
      return this.getEvaluationQuestionnaireById(rows[0].questionnaireId, actorUser);
    },

    async reorderEvaluationQuestionnaireQuestions(questionnaireId, payload, actorUser) {
      assertCanManageEvaluationQuestionnaires(actorUser, guards);
      const current = await this.getEvaluationQuestionnaireById(questionnaireId, actorUser);
      assertQuestionnaireEditable(current);
      const items = Array.isArray(payload?.items) ? payload.items : [];
      if (!items.length) {
        throw new Error("items obrigatorio.");
      }
      const questionById = new Map(current.questions.map((item) => [item.id, item]));
      const seenSortOrders = new Set();
      items.forEach((item) => {
        const question = questionById.get(item.questionId);
        const sortOrder = Number(item.sortOrder);
        if (!question) {
          throw new Error("Pergunta informada nao pertence ao questionario.");
        }
        if (!Number.isInteger(sortOrder) || sortOrder < 1) {
          throw new Error("sortOrder deve ser inteiro maior que zero.");
        }
        if (seenSortOrders.has(sortOrder)) {
          throw new Error("Nao e possivel reordenar com sortOrder duplicado.");
        }
        seenSortOrders.add(sortOrder);
      });

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        for (const item of items) {
          await connection.query(
            `UPDATE evaluation_questionnaire_questions
             SET sort_order = ?, updated_at = ?
             WHERE id = ? AND questionnaire_id = ?`,
            [Number(item.sortOrder), toMysqlDateTime(new Date()), item.questionId, questionnaireId]
          );
        }
        await connection.query(
          `UPDATE evaluation_questionnaires
           SET updated_by_user_id = ?, updated_at = ?
           WHERE id = ?`,
          [actorUser.id, toMysqlDateTime(new Date()), questionnaireId]
        );
        await insertAuditLog(connection, {
          category: AUDIT_CATEGORIES.cycle,
          action: "questionnaire_questions_reordered",
          entityType: "evaluation_questionnaire",
          entityId: questionnaireId,
          entityLabel: current.title,
          actorUser,
          summary: `Perguntas reordenadas no questionario: ${current.title}`,
          detail: `${items.length} pergunta(s) reordenadas`
        });
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
      return this.getEvaluationQuestionnaireById(questionnaireId, actorUser);
    },

    async publishEvaluationQuestionnaire(questionnaireId, actorUser) {
      assertCanManageEvaluationQuestionnaires(actorUser, guards);
      const current = await this.getEvaluationQuestionnaireById(questionnaireId, actorUser);
      validateQuestionnairePublication(current, current.questions);
      const publishedAt = toMysqlDateTime(new Date());
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(
          `UPDATE evaluation_questionnaires
           SET status = ?, question_count = ?, published_at = ?, updated_by_user_id = ?, updated_at = ?
           WHERE id = ?`,
          [
            QUESTIONNAIRE_STATUS.published,
            current.questions.length,
            publishedAt,
            actorUser.id,
            publishedAt,
            questionnaireId
          ]
        );
        await connection.query(
          `UPDATE evaluation_assignments
           SET questionnaire_id = ?
           WHERE cycle_id = ? AND reviewee_person_id = ? AND relationship_type = ?`,
          [questionnaireId, current.cycleId, current.revieweePersonId, current.relationshipType]
        );
        await insertAuditLog(connection, {
          category: AUDIT_CATEGORIES.cycle,
          action: "questionnaire_published",
          entityType: "evaluation_questionnaire",
          entityId: questionnaireId,
          entityLabel: current.title,
          actorUser,
          summary: buildQuestionnaireAuditSummary("Questionario publicado", current),
          detail: `${current.relationshipType} · published · ${current.questions.length} pergunta(s)`
        });
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
      return this.getEvaluationQuestionnaireById(questionnaireId, actorUser);
    }
  };
}
