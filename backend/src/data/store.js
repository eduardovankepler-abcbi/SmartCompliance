import crypto from "crypto";
import fs from "fs/promises";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";
import { evaluationLibrary, questionTemplate, seed } from "./mockData.js";

const ORG_WIDE_ROLES = ["admin", "hr", "compliance"];
const INCIDENT_ACCESS_ROLES = ["admin", "hr", "compliance"];
const MAX_APPLAUSE_PER_MONTH = 3;
const MAX_RECIPROCAL_APPLAUSE = 2;
const MIN_ANONYMOUS_AGGREGATE_RESPONSES = 3;
const INCIDENT_STATUS = [
  "Em triagem",
  "Em apuracao",
  "Aguardando retorno",
  "Concluido"
];
const INCIDENT_CLASSIFICATION = [
  "Conduta e Relacionamento",
  "Integridade e Etica",
  "Assedio e Respeito",
  "Fraude e Desvio",
  "Processos e Controles",
  "Nao classificado"
];
const CYCLE_STATUS = {
  planning: "Planejamento",
  released: "Liberado",
  closed: "Encerrado"
};
const USER_ROLE_OPTIONS = ["admin", "hr", "manager", "employee", "compliance"];
const USER_STATUS_OPTIONS = ["active", "inactive"];
const FEEDBACK_REQUEST_STATUS = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected"
};
const AUDIT_CATEGORIES = {
  user: "user",
  incident: "incident",
  cycle: "cycle",
  feedbackRequest: "feedback_request"
};
const CUSTOM_LIBRARY_STORAGE_FILE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "custom-libraries.json"
);
const ANONYMOUS_RESPONSE_STORAGE_FILE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "anonymous-responses.json"
);

const createId = (prefix) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const cloneSeed = () => JSON.parse(JSON.stringify(seed));

const hashPassword = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

function safeCompare(left, right) {
  const leftBuffer = Buffer.from(left || "", "utf8");
  const rightBuffer = Buffer.from(right || "", "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function verifyPasswordHash(storedHash, password) {
  if (!storedHash) {
    return false;
  }

  if (storedHash.startsWith("pbkdf2$")) {
    const [, iterationsRaw, salt, expectedHash] = storedHash.split("$");
    const iterations = Number(iterationsRaw);
    if (!iterations || !salt || !expectedHash) {
      return false;
    }

    const derivedHash = crypto
      .pbkdf2Sync(password, salt, iterations, 64, "sha512")
      .toString("hex");

    return safeCompare(derivedHash, expectedHash);
  }

  return safeCompare(hashPassword(password), storedHash);
}

function average(values) {
  return values.reduce((sum, value) => sum + Number(value), 0) / Math.max(values.length, 1);
}

function isOrgWideUser(user) {
  return ORG_WIDE_ROLES.includes(user?.roleKey || "");
}

function isFullAccessUser(user) {
  return isOrgWideUser(user);
}

function isManagerUser(user) {
  return user?.roleKey === "manager";
}

function isHrUser(user) {
  return user?.roleKey === "hr";
}

function isAdminUser(user) {
  return user?.roleKey === "admin";
}

function canManagePeople(user) {
  return ["admin", "hr"].includes(user?.roleKey || "");
}

function canManageUsers(user) {
  return ["admin", "hr"].includes(user?.roleKey || "");
}

function canAccessIncidents(user) {
  return INCIDENT_ACCESS_ROLES.includes(user?.roleKey || "");
}

function isComplianceUser(user) {
  return user?.roleKey === "compliance";
}

function canManageIncidentQueue(user) {
  return ["admin", "hr", "compliance"].includes(user?.roleKey || "");
}

function getAuditCategoriesForUser(user) {
  switch (user?.roleKey) {
    case "admin":
    case "hr":
      return [
        AUDIT_CATEGORIES.user,
        AUDIT_CATEGORIES.incident,
        AUDIT_CATEGORIES.cycle,
        AUDIT_CATEGORIES.feedbackRequest
      ];
    case "compliance":
      return [AUDIT_CATEGORIES.incident];
    case "manager":
      return [AUDIT_CATEGORIES.cycle, AUDIT_CATEGORIES.feedbackRequest];
    default:
      return [];
  }
}

function isAnonymousRelationship(relationshipType) {
  return ["leader", "company"].includes(relationshipType);
}

function isReleasedCycle(status) {
  return status === CYCLE_STATUS.released;
}

function assertValidCycleStatus(status) {
  if (!Object.values(CYCLE_STATUS).includes(status)) {
    throw new Error("Status de ciclo invalido.");
  }
}

function assertCycleStatusTransition(currentStatus, nextStatus) {
  assertValidCycleStatus(nextStatus);

  if (currentStatus === nextStatus) {
    return;
  }

  const allowedTransitions = {
    [CYCLE_STATUS.planning]: [CYCLE_STATUS.released, CYCLE_STATUS.closed],
    [CYCLE_STATUS.released]: [CYCLE_STATUS.closed],
    [CYCLE_STATUS.closed]: []
  };

  if (!(allowedTransitions[currentStatus] || []).includes(nextStatus)) {
    throw new Error("Transicao de status do ciclo nao permitida.");
  }
}

function assertValidIncidentClassification(classification) {
  if (!INCIDENT_CLASSIFICATION.includes(classification)) {
    throw new Error("Classificacao do caso invalida.");
  }
}

function assertValidIncidentStatus(status) {
  if (!INCIDENT_STATUS.includes(status)) {
    throw new Error("Status do caso invalido.");
  }
}

function assertValidUserRole(roleKey) {
  if (!USER_ROLE_OPTIONS.includes(roleKey)) {
    throw new Error("Nivel de acesso invalido.");
  }
}

function assertValidUserStatus(status) {
  if (!USER_STATUS_OPTIONS.includes(status)) {
    throw new Error("Status de usuario invalido.");
  }
}

function assertValidFeedbackRequestStatus(status) {
  if (!Object.values(FEEDBACK_REQUEST_STATUS).includes(status)) {
    throw new Error("Status da solicitacao de feedback invalido.");
  }
}

function enrichPerson(people, person) {
  const manager = people.find((item) => item.id === person.managerPersonId);
  return {
    ...person,
    managerPersonId: person.managerPersonId || null,
    managerName: manager?.name || ""
  };
}

function getTeamPeople(people, managerPersonId) {
  return people.filter((person) => person.managerPersonId === managerPersonId);
}

function toPublicUser(db, user) {
  const person = db.people.find((item) => item.id === user.personId);
  const publicPerson = person ? enrichPerson(db.people, person) : null;
  return {
    id: user.id,
    email: user.email,
    roleKey: user.roleKey,
    status: user.status,
    person: publicPerson
      ? {
          id: publicPerson.id,
          name: publicPerson.name,
          roleTitle: publicPerson.roleTitle,
          area: publicPerson.area,
          managerPersonId: publicPerson.managerPersonId,
          managerName: publicPerson.managerName,
          employmentType: publicPerson.employmentType
        }
      : null
  };
}

function toAdminUserRow(db, user) {
  const person = db.people.find((item) => item.id === user.personId);
  const publicPerson = person ? enrichPerson(db.people, person) : null;

  return {
    id: user.id,
    personId: user.personId,
    personName: publicPerson?.name || "",
    personArea: publicPerson?.area || "",
    email: user.email,
    roleKey: user.roleKey,
    status: user.status
  };
}

function filterPeopleForUser(people, user) {
  const enrichedPeople = people.map((person) => enrichPerson(people, person));

  if (isOrgWideUser(user)) {
    return enrichedPeople;
  }

  if (isManagerUser(user)) {
    return enrichedPeople.filter(
      (person) => person.id === user.person.id || person.managerPersonId === user.person.id
    );
  }

  return enrichedPeople.map((person) => ({
    id: person.id,
    name: person.name,
    roleTitle: person.roleTitle,
    area: person.area,
    managerPersonId: person.managerPersonId,
    managerName: person.managerName
  }));
}

function assertValidManagerReference(people, managerPersonId, personId = null) {
  if (!managerPersonId) {
    return;
  }

  const managerExists = people.some((person) => person.id === managerPersonId);
  if (!managerExists) {
    throw new Error("Gestor informado nao foi encontrado.");
  }

  if (personId && managerPersonId === personId) {
    throw new Error("Uma pessoa nao pode ser gestora de si mesma.");
  }
}

function buildSummary(db, user) {
  if (isOrgWideUser(user)) {
    return {
      mode: "executive",
      peopleCount: db.people.length,
      openIncidents: db.incidents.filter((item) => item.status !== "Concluido").length,
      activeEvaluationCycles: db.cycles.filter((item) => isReleasedCycle(item.status)).length,
      applauseCount: db.applauseEntries.length,
      developmentRecords: db.developmentRecords.length,
      pendingAssignments: db.assignments.filter((item) => item.status === "pending").length
    };
  }

  if (isManagerUser(user)) {
    const teamPeople = getTeamPeople(db.people, user.person.id);
    const visiblePersonIds = new Set([user.person.id, ...teamPeople.map((item) => item.id)]);
    return {
      mode: "team",
      peopleCount: visiblePersonIds.size,
      openIncidents: 0,
      activeEvaluationCycles: db.cycles.filter((item) => isReleasedCycle(item.status)).length,
      applauseCount: db.applauseEntries.filter(
        (item) =>
          visiblePersonIds.has(item.receiverPersonId) || visiblePersonIds.has(item.senderPersonId)
      ).length,
      developmentRecords: db.developmentRecords.filter((item) =>
        visiblePersonIds.has(item.personId)
      ).length,
      pendingAssignments: db.assignments.filter(
        (item) =>
          item.status === "pending" &&
          (item.reviewerUserId === user.id || visiblePersonIds.has(item.revieweePersonId))
      ).length
    };
  }

  return {
    mode: "personal",
    peopleCount: 1,
    openIncidents: 0,
    activeEvaluationCycles: db.cycles.filter((item) => isReleasedCycle(item.status)).length,
    applauseCount: db.applauseEntries.filter(
      (item) => item.receiverPersonId === user.person.id
    ).length,
    developmentRecords: db.developmentRecords.filter(
      (item) => item.personId === user.person.id
    ).length,
    pendingAssignments: db.assignments.filter(
      (item) => item.reviewerUserId === user.id && item.status === "pending"
    ).length
  };
}

function buildDashboard(db, user, anonymousResponses = []) {
  const allResponses = [
    ...db.submissions.map((item) => enrichSubmission(db, item)),
    ...anonymousResponses
  ];

  if (isOrgWideUser(user)) {
    const avgSatisfaction = average(db.people.map((person) => person.satisfactionScore));
    const completedAssignments = db.assignments.filter((item) => item.status === "submitted").length;
    const adherence = db.assignments.length
      ? Math.round((completedAssignments / db.assignments.length) * 100)
      : 0;

    return {
      mode: "executive",
      notice: "Leitura consolidada para RH, compliance e lideranca.",
      cards: [
        {
          label: "Satisfacao media",
          value: avgSatisfaction.toFixed(1),
          trend: "Painel institucional consolidado"
        },
        {
          label: "Adesao ao ciclo",
          value: `${adherence}%`,
          trend: "Assignments concluidos sobre o total"
        },
        {
          label: "Aplause validado",
          value: String(db.applauseEntries.length),
          trend: "Somente reconhecimentos aceitos"
        },
        {
          label: "Registros de desenvolvimento",
          value: String(db.developmentRecords.length),
          trend: "Historico pronto para comites"
        }
      ],
      satisfactionByArea: Object.values(
        db.people.reduce((acc, person) => {
          const entry = acc[person.area] || { area: person.area, scores: [] };
          entry.scores.push(Number(person.satisfactionScore));
          acc[person.area] = entry;
          return acc;
        }, {})
      ).map((entry) => ({
        area: entry.area,
        score: average(entry.scores).toFixed(1)
      })),
      evaluationHighlights: [
        "Perguntas-base padronizadas com customizacao limitada do gestor.",
        "Escala de 1 a 5 totalmente rotulada para reduzir ambiguidade.",
        "Comentarios obrigatorios em notas extremas para fortalecer evidencias."
      ],
      responseDistributions: buildQuestionDistributions(allResponses),
      evaluationMix: Object.entries(
        db.assignments.reduce((acc, assignment) => {
          acc[assignment.relationshipType] = (acc[assignment.relationshipType] || 0) + 1;
          return acc;
        }, {})
      ).map(([type, total]) => ({
        type,
        total
      }))
    };
  }

  if (isManagerUser(user)) {
    const teamPeople = getTeamPeople(db.people, user.person.id);
    const visiblePersonIds = new Set([user.person.id, ...teamPeople.map((item) => item.id)]);
    const teamAssignments = db.assignments.filter(
      (item) =>
        item.reviewerUserId === user.id || visiblePersonIds.has(item.revieweePersonId)
    );
    const teamResponses = allResponses.filter((response) =>
      visiblePersonIds.has(response.revieweePersonId)
    );
    const completedAssignments = teamAssignments.filter((item) => item.status === "submitted").length;
    const adherence = teamAssignments.length
      ? Math.round((completedAssignments / teamAssignments.length) * 100)
      : 0;

    return {
      mode: "team",
      notice: "Leitura da sua equipe direta, sem exposicao de outras areas.",
      cards: [
        {
          label: "Pessoas na equipe",
          value: String(visiblePersonIds.size),
          trend: "Gestor e reportes diretos"
        },
        {
          label: "Adesao ao ciclo",
          value: `${adherence}%`,
          trend: "Assignments da equipe concluidos"
        },
        {
          label: "Aplause na equipe",
          value: String(
            db.applauseEntries.filter((item) => visiblePersonIds.has(item.receiverPersonId)).length
          ),
          trend: "Reconhecimentos recebidos pelos reportes"
        },
        {
          label: "Registros de desenvolvimento",
          value: String(
            db.developmentRecords.filter((item) => visiblePersonIds.has(item.personId)).length
          ),
          trend: "Historico de desenvolvimento da equipe"
        }
      ],
      satisfactionByArea: [],
      evaluationHighlights: [
        "Voce acompanha somente sua equipe direta.",
        "Respostas confidenciais continuam agregadas quando aplicavel.",
        "O dashboard gerencial nao expande para outras areas."
      ],
      responseDistributions: buildQuestionDistributions(teamResponses),
      evaluationMix: Object.entries(
        teamAssignments.reduce((acc, assignment) => {
          acc[assignment.relationshipType] = (acc[assignment.relationshipType] || 0) + 1;
          return acc;
        }, {})
      ).map(([type, total]) => ({
        type,
        total
      }))
    };
  }

  const myAssignments = db.assignments.filter((item) => item.reviewerUserId === user.id);
  const completedAssignments = myAssignments.filter((item) => item.status === "submitted").length;
  const receivedApplause = db.applauseEntries.filter(
    (item) => item.receiverPersonId === user.person.id
  ).length;
  const myDevelopmentRecords = db.developmentRecords.filter(
    (item) => item.personId === user.person.id
  ).length;

  return {
    mode: "personal",
    notice: "Voce esta vendo apenas seu recorte individual.",
    cards: [
      {
        label: "Avaliacoes pendentes",
        value: String(myAssignments.filter((item) => item.status === "pending").length),
        trend: "Acompanhe seus prazos do ciclo"
      },
      {
        label: "Avaliacoes concluidas",
        value: String(completedAssignments),
        trend: "Respostas ja registradas por voce"
      },
      {
        label: "Aplause recebidos",
        value: String(receivedApplause),
        trend: "Reconhecimentos validados no periodo"
      },
      {
        label: "Evolucao registrada",
        value: String(myDevelopmentRecords),
        trend: "Cursos e marcos no seu historico"
      }
    ],
    satisfactionByArea: [],
    evaluationHighlights: [
      "Seu dashboard mostra apenas dados pessoais e agregados permitidos.",
      "Respostas confidenciais de lideranca e empresa entram somente em leitura agregada.",
      "O score anual pode existir, mas nao fica aberto no detalhe operacional."
    ],
    responseDistributions: buildQuestionDistributions(
      allResponses.filter((response) => response.reviewerUserId === user.id)
    ),
    evaluationMix: Object.entries(
      myAssignments.reduce((acc, assignment) => {
        acc[assignment.relationshipType] = (acc[assignment.relationshipType] || 0) + 1;
        return acc;
      }, {})
    ).map(([type, total]) => ({
      type,
      total
    }))
  };
}

function buildTemplate(definition) {
  const dimensions = [];
  const sections = [];
  for (const question of definition.questions) {
    if (question.sectionKey && !sections.find((item) => item.key === question.sectionKey)) {
      sections.push({
        key: question.sectionKey,
        title: question.sectionTitle || question.sectionKey,
        description: question.sectionDescription || ""
      });
    }
    let entry = dimensions.find((item) => item.key === question.dimensionKey);
    if (!entry) {
      entry = {
        key: question.dimensionKey,
        title: question.dimensionTitle,
        questions: []
      };
      dimensions.push(entry);
    }
    entry.questions.push(question.prompt);
  }

  return {
    id: definition.id,
    key: definition.key,
    modelName: definition.modelName,
    description: definition.description,
    policy: definition.policy,
    sections,
    dimensions,
    questions: definition.questions
  };
}

function buildEvaluationLibraryPayload(customLibraries = []) {
  return {
    scale: evaluationLibrary.scale,
    weights: evaluationLibrary.weights,
    templates: Object.values(evaluationLibrary.templates).map((template) =>
      buildTemplate(template)
    ),
    customLibraries
  };
}

function resolveTemplateKey(relationshipType) {
  if (relationshipType === "self") {
    return "self";
  }
  if (relationshipType === "leader") {
    return "leader";
  }
  if (relationshipType === "company") {
    return "company";
  }
  return "collaboration";
}

function getTemplateForRelationship(relationshipType) {
  return evaluationLibrary.templates[resolveTemplateKey(relationshipType)];
}

function findQuestionDefinition(questionId) {
  return Object.values(evaluationLibrary.templates)
    .flatMap((template) => template.questions)
    .find((question) => question.id === questionId);
}

function presentAssignment(row) {
  return {
    ...row,
    templateKey: resolveTemplateKey(row.relationshipType),
    templateId:
      getTemplateForRelationship(row.relationshipType)?.id || row.templateId || questionTemplate.id,
    weight: evaluationLibrary.weights[row.relationshipType] || 0,
    cycleStatus: row.cycleStatus || "",
    revieweeName: row.relationshipType === "company" ? "Empresa" : row.revieweeName,
    revieweeArea: row.relationshipType === "company" ? "Institucional" : row.revieweeArea
  };
}

function enrichAssignment(db, assignment) {
  const cycle = db.cycles.find((item) => item.id === assignment.cycleId);
  const reviewer = db.users.find((item) => item.id === assignment.reviewerUserId);
  const reviewee = db.people.find((item) => item.id === assignment.revieweePersonId);
  const revieweeManager = reviewee
    ? db.people.find((item) => item.id === reviewee.managerPersonId)
    : null;
  const reviewerPerson = reviewer
    ? db.people.find((item) => item.id === reviewer.personId)
    : null;
  const submission = db.submissions.find((item) => item.assignmentId === assignment.id);

  return {
    ...assignment,
    cycleTitle: cycle?.title || "",
    semesterLabel: cycle?.semesterLabel || "",
    cycleStatus: cycle?.status || "",
    templateId:
      getTemplateForRelationship(assignment.relationshipType)?.id ||
      cycle?.templateId ||
      questionTemplate.id,
    templateKey: resolveTemplateKey(assignment.relationshipType),
    weight: evaluationLibrary.weights[assignment.relationshipType] || 0,
    reviewerName: reviewerPerson?.name || "",
    revieweeName: assignment.relationshipType === "company" ? "Empresa" : reviewee?.name || "",
    revieweeArea:
      assignment.relationshipType === "company" ? "Institucional" : reviewee?.area || "",
    revieweeManagerPersonId:
      assignment.relationshipType === "company" ? null : reviewee?.managerPersonId || null,
    revieweeManagerName:
      assignment.relationshipType === "company" ? "" : revieweeManager?.name || "",
    overallScore: submission?.overallScore || null,
    submittedAt: submission?.submittedAt || null
  };
}

function enrichSubmission(db, submission) {
  const reviewer = db.users.find((item) => item.id === submission.reviewerUserId);
  const reviewee = db.people.find((item) => item.id === submission.revieweePersonId);
  const assignment = db.assignments.find((item) => item.id === submission.assignmentId);
  const reviewerPerson = reviewer
    ? db.people.find((item) => item.id === reviewer.personId)
    : null;
  const answers = db.answers
    .filter((item) => item.submissionId === submission.id)
    .map((answer) => {
      const question = findQuestionDefinition(answer.questionId);
      return {
        ...answer,
        questionPrompt: question?.prompt || "",
        dimensionTitle: question?.dimensionTitle || ""
      };
    });

  return {
    ...submission,
    relationshipType: assignment?.relationshipType || "peer",
    weight: evaluationLibrary.weights[assignment?.relationshipType || "peer"] || 0,
    weightedScore: Number(
      (
        Number(submission.overallScore) *
        (evaluationLibrary.weights[assignment?.relationshipType || "peer"] || 0)
      ).toFixed(2)
    ),
    reviewerName: reviewerPerson?.name || "",
    revieweeName:
      assignment?.relationshipType === "company" ? "Empresa" : reviewee?.name || "",
    revieweeArea:
      assignment?.relationshipType === "company" ? "Institucional" : reviewee?.area || "",
    revieweeManagerPersonId:
      assignment?.relationshipType === "company" ? null : reviewee?.managerPersonId || null,
    revieweeManagerName:
      assignment?.relationshipType === "company"
        ? "Institucional"
        : db.people.find((item) => item.id === reviewee?.managerPersonId)?.name || "",
    answers
  };
}

function getAnsweredScaleScores(answers) {
  return answers
    .map((item) => Number(item.score))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function validateEvaluationAnswers(answers, templateDefinition) {
  if (!Array.isArray(answers) || !answers.length) {
    throw new Error("Avaliacao precisa conter respostas.");
  }

  for (const question of templateDefinition.questions.filter((item) => item.isRequired)) {
    const answer = answers.find((item) => item.questionId === question.id);
    if (!answer) {
      throw new Error("Existem perguntas obrigatorias sem resposta.");
    }

    if (question.inputType === "text") {
      if (!String(answer.textValue || "").trim()) {
        throw new Error("Perguntas de texto obrigatorias precisam ser respondidas.");
      }
      continue;
    }

    if (question.inputType === "multi-select") {
      const selectedOptions = Array.isArray(answer.selectedOptions)
        ? answer.selectedOptions.filter(Boolean)
        : [];
      if (!selectedOptions.length) {
        throw new Error("Perguntas de multipla escolha exigem ao menos uma opcao.");
      }
      const validOptions = new Set((question.options || []).map((item) => item.value));
      if (selectedOptions.some((item) => !validOptions.has(item))) {
        throw new Error("Existe uma opcao invalida em pergunta de multipla escolha.");
      }
      continue;
    }

    const score = Number(answer.score);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      throw new Error("Todas as respostas de escala devem ter score entre 1 e 5.");
    }
    if (
      question.collectEvidenceOnExtreme &&
      (score === 1 || score === 5) &&
      !String(answer.evidenceNote || "").trim()
    ) {
      throw new Error("Notas extremas exigem comentario de evidencia.");
    }
  }
}

function getManagerPerson(people, person) {
  return people.find((candidate) => candidate.id === person.managerPersonId) || null;
}

function getUserByPersonId(users, personId) {
  return users.find((candidate) => candidate.personId === personId) || null;
}

function pushAssignment(assignments, nextAssignment) {
  const exists = assignments.some(
    (item) =>
      item.cycleId === nextAssignment.cycleId &&
      item.reviewerUserId === nextAssignment.reviewerUserId &&
      item.revieweePersonId === nextAssignment.revieweePersonId &&
      item.relationshipType === nextAssignment.relationshipType
  );

  if (!exists) {
    assignments.push(nextAssignment);
  }
}

function generateAssignments({ users, people, cycleId, dueDate }) {
  const eligibleActors = users
    .filter((user) => user.status === "active")
    .map((user) => ({
      ...user,
      person: people.find((person) => person.id === user.personId)
    }))
    .filter(
      (user) =>
        user.person && !["admin", "hr", "compliance"].includes(user.roleKey)
    );

  const assignments = [];

  for (const actor of eligibleActors) {
    const sameAreaCandidates = eligibleActors.filter(
      (candidate) =>
        candidate.id !== actor.id && candidate.person.area === actor.person.area
    );
    const anyPeerCandidates = eligibleActors.filter((candidate) => candidate.id !== actor.id);
    const crossFunctionalCandidates = eligibleActors.filter(
      (candidate) => candidate.id !== actor.id && candidate.person.area !== actor.person.area
    );
    const managerPerson = getManagerPerson(people, actor.person);
    const managerUser = managerPerson ? getUserByPersonId(users, managerPerson.id) : null;
    const peerCandidate = sameAreaCandidates[0] || anyPeerCandidates[0] || null;
    const crossFunctionalCandidate = crossFunctionalCandidates[0] || null;

    pushAssignment(assignments, {
      id: createId("assignment"),
      cycleId,
      reviewerUserId: actor.id,
      revieweePersonId: actor.person.id,
      relationshipType: "self",
      projectContext: "Reflexao individual",
      collaborationContext: "Autoavaliacao semestral do colaborador.",
      status: "pending",
      dueDate
    });

    pushAssignment(assignments, {
      id: createId("assignment"),
      cycleId,
      reviewerUserId: actor.id,
      revieweePersonId: actor.person.id,
      relationshipType: "company",
      projectContext: "Experiencia institucional",
      collaborationContext: "Avaliacao da empresa e da experiencia geral do colaborador.",
      status: "pending",
      dueDate
    });

    if (managerPerson && managerPerson.id !== actor.person.id) {
      pushAssignment(assignments, {
        id: createId("assignment"),
        cycleId,
        reviewerUserId: actor.id,
        revieweePersonId: managerPerson.id,
        relationshipType: "leader",
        projectContext: "Avaliacao da lideranca imediata",
        collaborationContext: "Leitura da lideranca no semestre.",
        status: "pending",
        dueDate
      });
    }

    if (managerUser && managerUser.id !== actor.id) {
      pushAssignment(assignments, {
        id: createId("assignment"),
        cycleId,
        reviewerUserId: managerUser.id,
        revieweePersonId: actor.person.id,
        relationshipType: "manager",
        projectContext: "Rotina da area",
        collaborationContext: "Avaliacao gerencial semestral.",
        status: "pending",
        dueDate
      });
    }

    if (crossFunctionalCandidate) {
      pushAssignment(assignments, {
        id: createId("assignment"),
        cycleId,
        reviewerUserId: actor.id,
        revieweePersonId: crossFunctionalCandidate.person.id,
        relationshipType: "cross-functional",
        projectContext: "Interacao entre areas",
        collaborationContext:
          "Feedback cruzado gerado automaticamente para colaboracao intertimes.",
        status: "pending",
        dueDate
      });
    }
  }

  return assignments;
}

function buildAggregateResponses(responses) {
  const aggregateTypes = ["leader", "company"];

  return aggregateTypes
    .map((relationshipType) => {
      const typeResponses = responses.filter((item) => item.relationshipType === relationshipType);
      if (typeResponses.length < MIN_ANONYMOUS_AGGREGATE_RESPONSES) {
        return null;
      }

      const answers = typeResponses
        .flatMap((item) => item.answers)
        .filter((answer) => Number.isFinite(Number(answer.score)));
      const questionAverages = Object.values(
        answers.reduce((acc, answer) => {
          const entry = acc[answer.questionId] || {
            questionId: answer.questionId,
            questionPrompt: answer.questionPrompt,
            dimensionTitle: answer.dimensionTitle,
            total: 0,
            scores: []
          };
          entry.total += 1;
          entry.scores.push(Number(answer.score));
          acc[answer.questionId] = entry;
          return acc;
        }, {})
      ).map((entry) => ({
        questionId: entry.questionId,
        questionPrompt: entry.questionPrompt,
        dimensionTitle: entry.dimensionTitle,
        totalResponses: entry.total,
        averageScore: Number(average(entry.scores).toFixed(2))
      }));

      return {
        relationshipType,
        totalResponses: typeResponses.length,
        averageScore: Number(
          average(typeResponses.map((item) => Number(item.overallScore))).toFixed(2)
        ),
        questionAverages
      };
    })
    .filter(Boolean);
}

function buildAggregateResponsesByCycle(responses) {
  return Object.entries(
    responses.reduce((acc, response) => {
      const cycleResponses = acc[response.cycleId] || [];
      cycleResponses.push(response);
      acc[response.cycleId] = cycleResponses;
      return acc;
    }, {})
  ).flatMap(([cycleId, cycleResponses]) =>
    buildAggregateResponses(cycleResponses).map((entry) => ({
      ...entry,
      cycleId
    }))
  );
}

function buildQuestionDistributions(responses) {
  return Object.entries(
    responses.reduce((acc, response) => {
      const relationshipEntry = acc[response.relationshipType] || {
        relationshipType: response.relationshipType,
        totalResponses: 0,
        questions: {}
      };
      relationshipEntry.totalResponses += 1;

      for (const answer of response.answers) {
        if (!Number.isFinite(Number(answer.score))) {
          continue;
        }
        const questionEntry = relationshipEntry.questions[answer.questionId] || {
          questionId: answer.questionId,
          questionPrompt: answer.questionPrompt,
          dimensionTitle: answer.dimensionTitle,
          totalAnswers: 0,
          distribution: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
          }
        };

        const scoreKey = String(Number(answer.score));
        questionEntry.totalAnswers += 1;
        questionEntry.distribution[scoreKey] =
          (questionEntry.distribution[scoreKey] || 0) + 1;
        relationshipEntry.questions[answer.questionId] = questionEntry;
      }

      acc[response.relationshipType] = relationshipEntry;
      return acc;
    }, {})
  ).map(([, relationshipEntry]) => ({
    relationshipType: relationshipEntry.relationshipType,
    totalResponses: relationshipEntry.totalResponses,
    questions: Object.values(relationshipEntry.questions).map((question) => ({
      questionId: question.questionId,
      questionPrompt: question.questionPrompt,
      dimensionTitle: question.dimensionTitle,
      totalAnswers: question.totalAnswers,
      options: Object.entries(question.distribution).map(([value, total]) => ({
        value: Number(value),
        label:
          findQuestionDefinition(question.questionId)?.scaleProfile === "satisfaction"
            ? evaluationLibrary.scale.find((item) => item.value === Number(value))?.label
            : getTemplateForRelationship(relationshipEntry.relationshipType)?.policy?.scale?.find(
                (item) => item.value === Number(value)
              )?.label || value,
        total,
        percentage: question.totalAnswers
          ? Number(((total / question.totalAnswers) * 100).toFixed(1))
          : 0
      }))
    }))
  })).filter(
    (group) =>
      !isAnonymousRelationship(group.relationshipType) ||
      group.totalResponses >= MIN_ANONYMOUS_AGGREGATE_RESPONSES
  );
}

function calculatePercentage(value, total) {
  if (!total) {
    return 0;
  }

  return Math.round((Number(value) / Number(total)) * 100);
}

function buildSatisfactionByAreaSeries(people) {
  return Object.values(
    people.reduce((acc, person) => {
      const entry = acc[person.area] || {
        area: person.area,
        scores: [],
        peopleCount: 0
      };
      entry.scores.push(Number(person.satisfactionScore));
      entry.peopleCount += 1;
      acc[person.area] = entry;
      return acc;
    }, {})
  )
    .map((entry) => {
      const scoreValue = Number(average(entry.scores).toFixed(1));
      return {
        area: entry.area,
        peopleCount: entry.peopleCount,
        score: scoreValue.toFixed(1),
        scoreValue,
        percentage: calculatePercentage(scoreValue, 5)
      };
    })
    .sort((left, right) => right.scoreValue - left.scoreValue);
}

function buildEvaluationMixSeries(assignments) {
  return Object.entries(
    assignments.reduce((acc, assignment) => {
      acc[assignment.relationshipType] = (acc[assignment.relationshipType] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([type, total]) => ({
      type,
      total,
      percentage: calculatePercentage(total, assignments.length)
    }))
    .sort((left, right) => right.total - left.total);
}

function buildAssignmentStatusSeries(assignments) {
  const labelMap = {
    pending: "Pendentes",
    submitted: "Concluidas"
  };

  return Object.entries(
    assignments.reduce((acc, assignment) => {
      acc[assignment.status] = (acc[assignment.status] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([status, total]) => ({
      status,
      label: labelMap[status] || status,
      total,
      percentage: calculatePercentage(total, assignments.length)
    }))
    .sort((left, right) => right.total - left.total);
}

function buildDevelopmentByTypeSeries(records) {
  return Object.entries(
    records.reduce((acc, record) => {
      acc[record.recordType] = (acc[record.recordType] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([type, total]) => ({
      type,
      total,
      percentage: calculatePercentage(total, records.length)
    }))
    .sort((left, right) => right.total - left.total);
}

function getCyclePeriodMeta(cycle, timeGrouping = "semester") {
  const cycleDate = cycle?.dueDate ? new Date(cycle.dueDate) : null;
  const year = cycleDate && !Number.isNaN(cycleDate.getTime()) ? cycleDate.getUTCFullYear() : 0;
  const month = cycleDate && !Number.isNaN(cycleDate.getTime()) ? cycleDate.getUTCMonth() : 0;
  const quarter = Math.floor(month / 3) + 1;
  const semester = month < 6 ? 1 : 2;

  if (timeGrouping === "year") {
    return {
      key: String(year || cycle?.semesterLabel || cycle?.title || "Sem data"),
      label: String(year || cycle?.semesterLabel || cycle?.title || "Sem data"),
      sortValue: year || 0
    };
  }

  if (timeGrouping === "quarter") {
    return {
      key: `${year || "Sem data"}-T${quarter}`,
      label: year ? `${year} T${quarter}` : cycle?.semesterLabel || cycle?.title || "Sem data",
      sortValue: (year || 0) * 10 + quarter
    };
  }

  return {
    key: `${year || "Sem data"}.${semester}`,
    label: year ? `${year}.${semester}` : cycle?.semesterLabel || cycle?.title || "Sem data",
    sortValue: (year || 0) * 10 + semester
  };
}

function buildCycleTimelineSeries({ cycles, assignments, responses, timeGrouping = "semester" }) {
  const cyclesById = new Map(cycles.map((cycle) => [cycle.id, cycle]));

  const grouped = {};

  for (const cycle of cycles) {
    const meta = getCyclePeriodMeta(cycle, timeGrouping);
    grouped[meta.key] = grouped[meta.key] || {
      periodKey: meta.key,
      label: meta.label,
      sortValue: meta.sortValue,
      cycleCount: 0,
      totalAssignments: 0,
      submittedAssignments: 0,
      pendingAssignments: 0,
      totalResponses: 0
    };
    grouped[meta.key].cycleCount += 1;
  }

  for (const assignment of assignments) {
    const cycle = cyclesById.get(assignment.cycleId);
    if (!cycle) {
      continue;
    }
    const meta = getCyclePeriodMeta(cycle, timeGrouping);
    grouped[meta.key] = grouped[meta.key] || {
      periodKey: meta.key,
      label: meta.label,
      sortValue: meta.sortValue,
      cycleCount: 0,
      totalAssignments: 0,
      submittedAssignments: 0,
      pendingAssignments: 0,
      totalResponses: 0
    };
    grouped[meta.key].totalAssignments += 1;
    if (assignment.status === "submitted") {
      grouped[meta.key].submittedAssignments += 1;
    } else {
      grouped[meta.key].pendingAssignments += 1;
    }
  }

  for (const response of responses) {
    const cycle = cyclesById.get(response.cycleId);
    if (!cycle) {
      continue;
    }
    const meta = getCyclePeriodMeta(cycle, timeGrouping);
    grouped[meta.key] = grouped[meta.key] || {
      periodKey: meta.key,
      label: meta.label,
      sortValue: meta.sortValue,
      cycleCount: 0,
      totalAssignments: 0,
      submittedAssignments: 0,
      pendingAssignments: 0,
      totalResponses: 0
    };
    grouped[meta.key].totalResponses += 1;
  }

  const rows = Object.values(grouped)
    .map((entry) => ({
      ...entry,
      adherencePercentage: calculatePercentage(
        entry.submittedAssignments,
        entry.totalAssignments
      )
    }))
    .filter((entry) => entry.cycleCount || entry.totalAssignments || entry.totalResponses)
    .sort((left, right) => left.sortValue - right.sortValue);

  const maxAssignments = Math.max(...rows.map((item) => item.totalAssignments), 1);

  return rows.map((entry) => ({
    ...entry,
    volumePercentage: calculatePercentage(entry.totalAssignments, maxAssignments)
  }));
}

function buildDashboardPayload({
  mode,
  notice,
  scopeLabel,
  cycles,
  people,
  assignments,
  applauseEntries,
  developmentRecords,
  responses,
  evaluationHighlights,
  availableAreas = [],
  selectedArea = null,
  timeGrouping = "semester"
}) {
  const submittedAssignments = assignments.filter((item) => item.status === "submitted").length;
  const pendingAssignments = assignments.filter((item) => item.status === "pending").length;
  const peopleCount = people.length;
  const avgSatisfaction = peopleCount
    ? Number(average(people.map((person) => person.satisfactionScore)).toFixed(1))
    : 0;
  const peopleWithDevelopment = new Set(developmentRecords.map((item) => item.personId)).size;
  const peopleWithApplause = new Set(applauseEntries.map((item) => item.receiverPersonId)).size;

  return {
    mode,
    notice,
    scopeLabel,
    selectedArea,
    areaOptions: availableAreas,
    scopeSummary: {
      peopleCount,
      pendingAssignments,
      submittedAssignments,
      totalAssignments: assignments.length,
      developmentRecords: developmentRecords.length,
      applauseEntries: applauseEntries.length
    },
    cards: [
      {
        label: "Satisfacao media",
        value: avgSatisfaction ? avgSatisfaction.toFixed(1) : "-",
        trend: scopeLabel
      },
      {
        label: "Pessoas no recorte",
        value: String(peopleCount),
        trend: "Escopo aplicado ao dashboard"
      },
      {
        label: "Adesao ao ciclo",
        value: `${calculatePercentage(submittedAssignments, assignments.length)}%`,
        trend: `${submittedAssignments} concluidas de ${assignments.length || 0}`
      },
      {
        label: "Aplause validados",
        value: String(applauseEntries.length),
        trend: "Reconhecimentos considerados no recorte"
      },
      {
        label: "Registros de desenvolvimento",
        value: String(developmentRecords.length),
        trend: "Historico profissional considerado"
      }
    ],
    donutMetrics: [
      {
        key: "adherence",
        label: "Adesao ao ciclo",
        percentage: calculatePercentage(submittedAssignments, assignments.length),
        value: submittedAssignments,
        total: assignments.length,
        detail: "Assignments concluidos"
      },
      {
        key: "development",
        label: "Cobertura de desenvolvimento",
        percentage: calculatePercentage(peopleWithDevelopment, peopleCount),
        value: peopleWithDevelopment,
        total: peopleCount,
        detail: "Pessoas com historico registrado"
      },
      {
        key: "applause",
        label: "Pessoas reconhecidas",
        percentage: calculatePercentage(peopleWithApplause, peopleCount),
        value: peopleWithApplause,
        total: peopleCount,
        detail: "Pessoas com Aplause no recorte"
      }
    ],
    satisfactionByArea: buildSatisfactionByAreaSeries(people),
    evaluationHighlights,
    responseDistributions: buildQuestionDistributions(responses),
    evaluationMix: buildEvaluationMixSeries(assignments),
    assignmentStatus: buildAssignmentStatusSeries(assignments),
    developmentByType: buildDevelopmentByTypeSeries(developmentRecords),
    cycleTimeline: buildCycleTimelineSeries({
      cycles,
      assignments,
      responses,
      timeGrouping
    }),
    timeGrouping
  };
}

function filterIndividualResponses(responses, actorUser) {
  const visibleTypes = isOrgWideUser(actorUser)
    ? ["peer", "manager", "cross-functional", "self"]
    : ["peer", "manager", "cross-functional"];

  return responses.filter((response) => {
    if (!visibleTypes.includes(response.relationshipType)) {
      return false;
    }

    if (isOrgWideUser(actorUser)) {
      return true;
    }

    if (isManagerUser(actorUser)) {
      return (
        response.revieweeManagerPersonId === actorUser.person.id ||
        response.reviewerUserId === actorUser.id
      );
    }

    return response.reviewerUserId === actorUser.id;
  });
}

function buildResponsesBundle(responses, actorUser) {
  const aggregateSource = isOrgWideUser(actorUser)
    ? responses
    : isManagerUser(actorUser)
      ? responses.filter((response) => response.revieweeManagerPersonId === actorUser.person.id)
      : [];

  return {
    individualResponses: filterIndividualResponses(responses, actorUser),
    aggregateResponses: buildAggregateResponses(aggregateSource),
    cycleAggregateResponses: buildAggregateResponsesByCycle(aggregateSource)
  };
}

function createAnonymousSubmissionPayload(assignment, payload) {
  const templateDefinition = getTemplateForRelationship(assignment.relationshipType);
  const scaleScores = getAnsweredScaleScores(payload.answers);

  return {
    id: createId("anonymous_submission"),
    assignmentId: assignment.id,
    cycleId: assignment.cycleId,
    revieweePersonId: assignment.revieweePersonId,
    relationshipType: assignment.relationshipType,
    overallScore: scaleScores.length ? Number(average(scaleScores).toFixed(2)) : null,
    strengthsNote: payload.strengthsNote || "",
    developmentNote: payload.developmentNote || "",
    submittedAt: new Date().toISOString(),
    answers: payload.answers.map((answer) => {
      const question = templateDefinition.questions.find(
        (item) => item.id === answer.questionId
      );

      return {
        id: createId("anonymous_answer"),
        questionId: answer.questionId,
        score: Number.isFinite(Number(answer.score)) ? Number(answer.score) : null,
        evidenceNote: answer.evidenceNote || "",
        textValue: answer.textValue || "",
        selectedOptions: Array.isArray(answer.selectedOptions) ? answer.selectedOptions : [],
        answerType: question?.inputType || "scale",
        questionPrompt: question?.prompt || "",
        dimensionTitle: question?.dimensionTitle || ""
      };
    })
  };
}

function getFeedbackRequestItems(db, requestId) {
  return db.feedbackRequestItems.filter((item) => item.requestId === requestId);
}

function presentFeedbackRequest(db, request) {
  const cycle = db.cycles.find((item) => item.id === request.cycleId);
  const requester = db.users.find((item) => item.id === request.requesterUserId);
  const requesterPerson = requester
    ? db.people.find((item) => item.id === requester.personId)
    : null;
  const reviewee = db.people.find((item) => item.id === request.revieweePersonId);
  const decidedByUser = request.decidedByUserId
    ? db.users.find((item) => item.id === request.decidedByUserId)
    : null;
  const decidedByPerson = decidedByUser
    ? db.people.find((item) => item.id === decidedByUser.personId)
    : null;

  return {
    ...request,
    cycleTitle: cycle?.title || "",
    semesterLabel: cycle?.semesterLabel || "",
    cycleStatus: cycle?.status || "",
    requesterName: requesterPerson?.name || "",
    revieweeName: reviewee?.name || "",
    decidedByName: decidedByPerson?.name || "",
    providers: getFeedbackRequestItems(db, request.id).map((item) => ({
      ...item,
      providerName: db.people.find((person) => person.id === item.providerPersonId)?.name || ""
    }))
  };
}

function createAuditPayload({
  action,
  actorUser,
  category,
  detail,
  entityId,
  entityLabel,
  entityType,
  summary,
  createdAt = new Date().toISOString()
}) {
  return {
    id: createId("audit"),
    category,
    action,
    entityType,
    entityId,
    entityLabel,
    actorUserId: actorUser?.id || null,
    actorName: actorUser?.person?.name || actorUser?.email || "Sistema",
    actorRoleKey: actorUser?.roleKey || "system",
    summary,
    detail,
    createdAt
  };
}

function pushAuditLog(auditLogs, payload) {
  auditLogs.unshift(createAuditPayload(payload));
}

function filterAuditLogsForUser(auditLogs, actorUser, options = {}) {
  const allowedCategories = getAuditCategoriesForUser(actorUser);
  if (!allowedCategories.length) {
    return [];
  }

  const { category = null, limit = 40 } = options;
  return auditLogs
    .filter(
      (item) =>
        allowedCategories.includes(item.category) && (!category || item.category === category)
    )
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, limit);
}

async function insertAuditLog(target, payload) {
  const entry = createAuditPayload(payload);
  await target.query(
    `INSERT INTO audit_logs
     (id, category, action_key, entity_type, entity_id, entity_label, actor_user_id,
      actor_name, actor_role_key, summary_text, detail_text, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id,
      entry.category,
      entry.action,
      entry.entityType,
      entry.entityId,
      entry.entityLabel,
      entry.actorUserId,
      entry.actorName,
      entry.actorRoleKey,
      entry.summary,
      entry.detail,
      entry.createdAt
    ]
  );
}

async function fetchAuditLogs(pool, actorUser, options = {}) {
  const allowedCategories = getAuditCategoriesForUser(actorUser);
  if (!allowedCategories.length) {
    return [];
  }

  const { category = null, limit = 40 } = options;
  const filters = [];
  const params = [];

  const categoryPlaceholders = allowedCategories.map(() => "?").join(", ");
  filters.push(`category IN (${categoryPlaceholders})`);
  params.push(...allowedCategories);

  if (category) {
    filters.push("category = ?");
    params.push(category);
  }

  params.push(Number(limit) || 40);

  const [rows] = await pool.query(
    `SELECT id, category, action_key AS action, entity_type AS entityType, entity_id AS entityId,
            entity_label AS entityLabel, actor_user_id AS actorUserId, actor_name AS actorName,
            actor_role_key AS actorRoleKey, summary_text AS summary, detail_text AS detail,
            created_at AS createdAt
     FROM audit_logs
     WHERE ${filters.join(" AND ")}
     ORDER BY created_at DESC
     LIMIT ?`,
    params
  );

  return rows;
}

function filterFeedbackRequestsForUser(db, actorUser) {
  const requests = db.feedbackRequests.map((item) => presentFeedbackRequest(db, item));

  if (isOrgWideUser(actorUser)) {
    return requests;
  }

  if (isManagerUser(actorUser)) {
    return requests.filter((item) => {
      const reviewee = db.people.find((person) => person.id === item.revieweePersonId);
      return (
        item.requesterUserId === actorUser.id ||
        item.revieweePersonId === actorUser.person.id ||
        reviewee?.managerPersonId === actorUser.person.id
      );
    });
  }

  return requests.filter((item) => item.requesterUserId === actorUser.id);
}

function assertCanCreateFeedbackRequest(db, actorUser, payload) {
  if (!payload.cycleId || !Array.isArray(payload.providerPersonIds)) {
    throw new Error("Dados obrigatorios da solicitacao de feedback nao informados.");
  }

  if (!payload.contextNote?.trim() || payload.contextNote.trim().length < 20) {
    throw new Error("Descreva o contexto da colaboracao com pelo menos 20 caracteres.");
  }

  const uniqueProviderIds = [...new Set(payload.providerPersonIds.filter(Boolean))];
  if (!uniqueProviderIds.length || uniqueProviderIds.length > 3) {
    throw new Error("Selecione de 1 a 3 fornecedores de feedback.");
  }

  if (uniqueProviderIds.includes(actorUser.person.id)) {
    throw new Error("Nao e permitido solicitar feedback direto para si mesmo.");
  }

  const cycle = db.cycles.find((item) => item.id === payload.cycleId);
  if (!cycle) {
    throw new Error("Ciclo de avaliacao nao encontrado.");
  }

  if (cycle.status === CYCLE_STATUS.closed) {
    throw new Error("Nao e possivel solicitar feedback em ciclo encerrado.");
  }

  for (const providerPersonId of uniqueProviderIds) {
    const providerUser = db.users.find(
      (item) => item.personId === providerPersonId && item.status === "active"
    );
    if (!providerUser) {
      throw new Error("Todos os fornecedores precisam ter usuario ativo.");
    }

    const duplicateAssignment = db.assignments.some(
      (item) =>
        item.cycleId === payload.cycleId &&
        item.relationshipType === "peer" &&
        item.revieweePersonId === actorUser.person.id &&
        item.reviewerUserId === providerUser.id
    );
    if (duplicateAssignment) {
      throw new Error("Ja existe feedback direto para uma das pessoas selecionadas neste ciclo.");
    }
  }

  return uniqueProviderIds;
}

function assertCanCreateDevelopmentRecord(actorUser, people, personId) {
  if (isOrgWideUser(actorUser)) {
    return;
  }

  if (
    isManagerUser(actorUser) &&
    (actorUser.person.id === personId ||
      people.some(
        (person) => person.id === personId && person.managerPersonId === actorUser.person.id
      ))
  ) {
    return;
  }

  if (actorUser.person.id !== personId) {
    throw new Error("Voce so pode registrar desenvolvimento no proprio perfil ou na sua equipe.");
  }
}

function isSameMonth(firstDate, secondDate) {
  const first = new Date(firstDate);
  const second = new Date(secondDate);
  return (
    first.getUTCFullYear() === second.getUTCFullYear() &&
    first.getUTCMonth() === second.getUTCMonth()
  );
}

function assertCanCreateApplause(existingEntries, payload) {
  if (payload.senderPersonId === payload.receiverPersonId) {
    throw new Error("Nao e permitido enviar Aplause para si mesmo.");
  }

  if (!payload.contextNote?.trim() || payload.contextNote.trim().length < 20) {
    throw new Error("O contexto do Aplause precisa ter pelo menos 20 caracteres.");
  }

  const now = new Date().toISOString();
  const sentThisMonth = existingEntries.filter(
    (entry) =>
      entry.senderPersonId === payload.senderPersonId && isSameMonth(entry.createdAt, now)
  );

  if (sentThisMonth.length >= MAX_APPLAUSE_PER_MONTH) {
    throw new Error("Limite mensal de Aplause por pessoa atingido.");
  }

  const reciprocalEntries = existingEntries.filter(
    (entry) =>
      entry.senderPersonId === payload.receiverPersonId &&
      entry.receiverPersonId === payload.senderPersonId
  );

  if (reciprocalEntries.length >= MAX_RECIPROCAL_APPLAUSE) {
    throw new Error("Padrao reciproco excessivo detectado para este Aplause.");
  }
}

async function loadCustomLibraryState() {
  try {
    const content = await fs.readFile(CUSTOM_LIBRARY_STORAGE_FILE, "utf8");
    const parsed = JSON.parse(content);
    return {
      drafts: Array.isArray(parsed.drafts) ? parsed.drafts : [],
      published: Array.isArray(parsed.published) ? parsed.published : []
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return { drafts: [], published: [] };
    }
    throw error;
  }
}

async function saveCustomLibraryState(state) {
  await fs.writeFile(
    CUSTOM_LIBRARY_STORAGE_FILE,
    JSON.stringify(
      {
        drafts: state.drafts,
        published: state.published
      },
      null,
      2
    ),
    "utf8"
  );
}

async function loadAnonymousResponseState() {
  try {
    const content = await fs.readFile(ANONYMOUS_RESPONSE_STORAGE_FILE, "utf8");
    const parsed = JSON.parse(content);
    return {
      responses: Array.isArray(parsed.responses) ? parsed.responses : []
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return { responses: [] };
    }
    throw error;
  }
}

async function saveAnonymousResponseState(state) {
  await fs.writeFile(
    ANONYMOUS_RESPONSE_STORAGE_FILE,
    JSON.stringify(
      {
        responses: state.responses
      },
      null,
      2
    ),
    "utf8"
  );
}

function mapMysqlPersonRow(row) {
  return {
    id: row.id,
    name: row.name,
    roleTitle: row.roleTitle,
    area: row.area,
    managerPersonId: row.managerPersonId || null,
    managerName: row.managerName,
    employmentType: row.employmentType,
    satisfactionScore: row.satisfactionScore
  };
}

async function fetchPeopleRows(pool) {
  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.role_title AS roleTitle, p.area,
            p.manager_person_id AS managerPersonId, manager.name AS managerName,
            p.employment_type AS employmentType, p.satisfaction_score AS satisfactionScore
     FROM people p
     LEFT JOIN people manager ON manager.id = p.manager_person_id
     ORDER BY p.name`
  );
  return rows.map(mapMysqlPersonRow);
}

async function fetchUserRows(pool) {
  const [rows] = await pool.query(
    `SELECT id, person_id AS personId, email, password_hash AS passwordHash, role_key AS roleKey, status
     FROM users`
  );
  return rows;
}

async function fetchMysqlResponses(pool) {
  const [submissions] = await pool.query(
    `SELECT s.id, s.assignment_id AS assignmentId, s.cycle_id AS cycleId,
            s.reviewer_user_id AS reviewerUserId, s.reviewee_person_id AS revieweePersonId,
            s.overall_score AS overallScore, s.strengths_note AS strengthsNote,
            s.development_note AS developmentNote, s.submitted_at AS submittedAt,
            reviewer_person.name AS reviewerName, reviewee.name AS revieweeName,
            reviewee.area AS revieweeArea, reviewee.manager_person_id AS revieweeManagerPersonId,
            reviewee_manager.name AS revieweeManagerName,
            a.relationship_type AS relationshipType
     FROM evaluation_submissions s
     JOIN evaluation_assignments a ON a.id = s.assignment_id
     JOIN users reviewer_user ON reviewer_user.id = s.reviewer_user_id
     JOIN people reviewer_person ON reviewer_person.id = reviewer_user.person_id
     JOIN people reviewee ON reviewee.id = s.reviewee_person_id
     LEFT JOIN people reviewee_manager ON reviewee_manager.id = reviewee.manager_person_id
     ORDER BY s.submitted_at DESC`
  );

  const [answers] = await pool.query(
    `SELECT a.id, a.submission_id AS submissionId, a.question_id AS questionId, a.answer_type AS answerType, a.score,
            a.evidence_note AS evidenceNote, a.answer_text AS textValue, a.answer_options_json AS answerOptionsJson, q.prompt_text AS questionPrompt,
            q.dimension_title AS dimensionTitle
     FROM evaluation_answers a
     JOIN evaluation_questions q ON q.id = a.question_id
     ORDER BY q.sort_order ASC`
  );

  return submissions.map((submission) => ({
    ...submission,
    revieweeName: submission.relationshipType === "company" ? "Empresa" : submission.revieweeName,
    revieweeArea:
      submission.relationshipType === "company" ? "Institucional" : submission.revieweeArea,
    revieweeManagerPersonId:
      submission.relationshipType === "company" ? null : submission.revieweeManagerPersonId,
    revieweeManagerName:
      submission.relationshipType === "company"
        ? "Institucional"
        : submission.revieweeManagerName,
    weight: evaluationLibrary.weights[submission.relationshipType] || 0,
    weightedScore: Number(
      (
        Number(submission.overallScore) *
        (evaluationLibrary.weights[submission.relationshipType] || 0)
      ).toFixed(2)
    ),
    answers: answers
      .filter((answer) => answer.submissionId === submission.id)
      .map((answer) => ({
        ...answer,
        selectedOptions: answer.answerOptionsJson ? JSON.parse(answer.answerOptionsJson) : []
      }))
  }));
}

function buildMemoryStore(customLibraryState, anonymousResponseState) {
  const db = {
    auditLogs: [],
    ...cloneSeed()
  };
  if (!Array.isArray(db.auditLogs)) {
    db.auditLogs = [];
  }

  return {
    async findUserByEmail(email) {
      return db.users.find((item) => item.email.toLowerCase() === email.toLowerCase()) || null;
    },
    async getUserById(userId) {
      const user = db.users.find((item) => item.id === userId);
      return user ? toPublicUser(db, user) : null;
    },
    async authenticateUser(email, password) {
      const user = await this.findUserByEmail(email);
      if (!user || user.status !== "active" || !verifyPasswordHash(user.passwordHash, password)) {
        return null;
      }
      return toPublicUser(db, user);
    },
    async getPeople(actorUser) {
      return filterPeopleForUser(db.people, actorUser);
    },
    async createPerson(payload, actorUser) {
      if (!canManagePeople(actorUser)) {
        throw new Error("Perfil sem permissao para cadastrar pessoas.");
      }

      assertValidManagerReference(db.people, payload.managerPersonId);

      const person = {
        id: createId("person"),
        name: payload.name,
        roleTitle: payload.roleTitle,
        area: payload.area,
        managerPersonId: payload.managerPersonId || null,
        employmentType: payload.employmentType,
        satisfactionScore: Number(payload.satisfactionScore || 0)
      };
      db.people.unshift(person);
      return enrichPerson(db.people, person);
    },
    async getUsers(actorUser) {
      if (!canManageUsers(actorUser)) {
        return [];
      }

      return db.users.map((user) => toAdminUserRow(db, user));
    },
    async getAuditTrail(actorUser, options = {}) {
      return filterAuditLogsForUser(db.auditLogs, actorUser, options);
    },
    async createUser(payload, actorUser) {
      if (!canManageUsers(actorUser)) {
        throw new Error("Perfil sem permissao para cadastrar usuarios.");
      }

      assertValidUserRole(payload.roleKey);
      assertValidUserStatus(payload.status);

      const person = db.people.find((item) => item.id === payload.personId);
      if (!person) {
        throw new Error("Pessoa vinculada nao encontrada.");
      }

      if (db.users.some((item) => item.personId === payload.personId)) {
        throw new Error("Ja existe um usuario vinculado a esta pessoa.");
      }

      if (db.users.some((item) => item.email.toLowerCase() === payload.email.toLowerCase())) {
        throw new Error("Ja existe um usuario com este email.");
      }

      const user = {
        id: createId("user"),
        personId: payload.personId,
        email: payload.email,
        passwordHash: hashPassword(payload.password),
        roleKey: payload.roleKey,
        status: payload.status
      };
      db.users.unshift(user);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.user,
        action: "created",
        entityType: "user",
        entityId: user.id,
        entityLabel: person.name,
        actorUser,
        summary: `Usuario criado para ${person.name}`,
        detail: `${payload.roleKey} · ${payload.status} · ${payload.email}`
      });
      return toAdminUserRow(db, user);
    },
    async updateUser(userId, payload, actorUser) {
      if (!canManageUsers(actorUser)) {
        throw new Error("Perfil sem permissao para atualizar usuarios.");
      }

      assertValidUserRole(payload.roleKey);
      assertValidUserStatus(payload.status);

      const user = db.users.find((item) => item.id === userId);
      if (!user) {
        throw new Error("Usuario nao encontrado.");
      }

      user.roleKey = payload.roleKey;
      user.status = payload.status;
      if (payload.password?.trim()) {
        user.passwordHash = hashPassword(payload.password);
      }

      const person = db.people.find((item) => item.id === user.personId);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.user,
        action: "updated",
        entityType: "user",
        entityId: user.id,
        entityLabel: person?.name || user.email,
        actorUser,
        summary: `Acesso atualizado para ${person?.name || user.email}`,
        detail: `${payload.roleKey} · ${payload.status}${payload.password?.trim() ? " · senha redefinida" : ""}`
      });

      return toAdminUserRow(db, user);
    },
    async getSummary(actorUser) {
      return buildSummary(db, actorUser);
    },
    async getIncidents(actorUser) {
      if (!canAccessIncidents(actorUser)) {
        return [];
      }
      return db.incidents;
    },
    async createIncident(payload, actorUser) {
      assertValidIncidentClassification(payload.classification);

      const incident = {
        id: createId("incident"),
        status: "Em triagem",
        createdAt: new Date().toISOString(),
        ...payload
      };
      db.incidents.unshift(incident);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.incident,
        action: "created",
        entityType: "incident",
        entityId: incident.id,
        entityLabel: incident.title,
        actorUser,
        summary: `Relato registrado: ${incident.title}`,
        detail: `${incident.classification} · Responsavel inicial: ${incident.assignedTo}`
      });
      return incident;
    },
    async updateIncident(incidentId, payload, actorUser) {
      if (!canManageIncidentQueue(actorUser)) {
        throw new Error("Perfil sem permissao para atualizar o caso.");
      }

      const incident = db.incidents.find((item) => item.id === incidentId);
      if (!incident) {
        throw new Error("Caso de compliance nao encontrado.");
      }

      assertValidIncidentClassification(payload.classification);
      assertValidIncidentStatus(payload.status);

      incident.classification = payload.classification;
      incident.status = payload.status;
      incident.assignedTo = payload.assignedTo;

      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.incident,
        action: "updated",
        entityType: "incident",
        entityId: incident.id,
        entityLabel: incident.title,
        actorUser,
        summary: `Caso atualizado: ${incident.title}`,
        detail: `${incident.status} · ${incident.classification} · Responsavel: ${incident.assignedTo}`
      });

      return incident;
    },
    async getEvaluationTemplate() {
      return buildTemplate(evaluationLibrary.templates.collaboration);
    },
    async getEvaluationLibrary() {
      return buildEvaluationLibraryPayload(customLibraryState.published);
    },
    async importCustomLibraryDraft(payload) {
      const draft = {
        id: createId("library_draft"),
        fileName: payload.fileName,
        createdAt: new Date().toISOString(),
        createdByUserId: payload.createdByUserId,
        errors: payload.errors,
        templates: payload.templates,
        summary: payload.summary
      };
      customLibraryState.drafts.unshift(draft);
      await saveCustomLibraryState(customLibraryState);
      return draft;
    },
    async publishCustomLibraryDraft(payload) {
      const draft = customLibraryState.drafts.find((item) => item.id === payload.draftId);
      if (!draft) {
        throw new Error("Rascunho da biblioteca nao encontrado.");
      }
      if (draft.errors.length) {
        throw new Error("Nao e possivel publicar uma biblioteca com erros.");
      }

      const published = {
        id: createId("library"),
        name: payload.name,
        description: payload.description || "",
        sourceFileName: draft.fileName,
        createdAt: new Date().toISOString(),
        createdByUserId: payload.createdByUserId,
        templateCount: draft.templates.length,
        questionCount: draft.summary.questions,
        templates: draft.templates
      };
      customLibraryState.published.unshift(published);
      customLibraryState.drafts = customLibraryState.drafts.filter(
        (item) => item.id !== payload.draftId
      );
      await saveCustomLibraryState(customLibraryState);
      return published;
    },
    async getEvaluationTemplateForRelationship(relationshipType) {
      return buildTemplate(getTemplateForRelationship(relationshipType));
    },
    async getEvaluationCycles() {
      return db.cycles;
    },
    async createEvaluationCycle(payload, actorUser) {
      const cycle = {
        id: createId("cycle"),
        ...payload,
        status: CYCLE_STATUS.planning
      };
      db.cycles.unshift(cycle);

      const generatedAssignments = generateAssignments({
        users: db.users,
        people: db.people,
        cycleId: cycle.id,
        dueDate: cycle.dueDate
      });
      db.assignments.unshift(...generatedAssignments);
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.cycle,
        action: "created",
        entityType: "cycle",
        entityId: cycle.id,
        entityLabel: cycle.title,
        actorUser,
        summary: `Ciclo criado: ${cycle.title}`,
        detail: `${cycle.semesterLabel} · ${generatedAssignments.length} assignments distribuidos`
      });

      return {
        ...cycle,
        generatedAssignmentsCount: generatedAssignments.length
      };
    },
    async updateEvaluationCycleStatus(cycleId, nextStatus, actorUser) {
      const cycle = db.cycles.find((item) => item.id === cycleId);
      if (!cycle) {
        throw new Error("Ciclo de avaliacao nao encontrado.");
      }

      const previousStatus = cycle.status;
      assertCycleStatusTransition(cycle.status, nextStatus);
      cycle.status = nextStatus;
      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.cycle,
        action: "status_changed",
        entityType: "cycle",
        entityId: cycle.id,
        entityLabel: cycle.title,
        actorUser,
        summary: `Status do ciclo atualizado: ${cycle.title}`,
        detail: `${previousStatus} -> ${nextStatus}`
      });
      return cycle;
    },
    async getEvaluationAssignmentsForUser(userId) {
      return db.assignments
        .filter((item) => item.reviewerUserId === userId)
        .map((item) => enrichAssignment(db, item));
    },
    async getEvaluationAssignmentById(assignmentId, userId) {
      const assignment = db.assignments.find(
        (item) => item.id === assignmentId && item.reviewerUserId === userId
      );
      if (!assignment) {
        return null;
      }
      return enrichAssignment(db, assignment);
    },
    async getEvaluationResponses(actorUser) {
      const responses = [
        ...db.submissions.map((item) => enrichSubmission(db, item)),
        ...anonymousResponseState.responses
      ];
      return buildResponsesBundle(responses, actorUser);
    },
    async getFeedbackRequests(actorUser) {
      return filterFeedbackRequestsForUser(db, actorUser);
    },
    async createFeedbackRequest(payload, actorUser) {
      const providerPersonIds = assertCanCreateFeedbackRequest(db, actorUser, payload);

      const request = {
        id: createId("feedback_request"),
        cycleId: payload.cycleId,
        requesterUserId: actorUser.id,
        revieweePersonId: actorUser.person.id,
        status: FEEDBACK_REQUEST_STATUS.pending,
        contextNote: payload.contextNote.trim(),
        requestedAt: new Date().toISOString(),
        decidedAt: null,
        decidedByUserId: null
      };
      db.feedbackRequests.unshift(request);

      const items = providerPersonIds.map((providerPersonId) => ({
        id: createId("feedback_request_item"),
        requestId: request.id,
        providerPersonId,
        assignmentId: null
      }));
      db.feedbackRequestItems.unshift(...items);

      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.feedbackRequest,
        action: "created",
        entityType: "feedback_request",
        entityId: request.id,
        entityLabel: actorUser.person?.name || actorUser.email,
        actorUser,
        summary: `Solicitacao de feedback direto registrada`,
        detail: `${providerPersonIds.length} fornecedores sugeridos · Ciclo ${request.cycleId}`
      });

      return presentFeedbackRequest(db, request);
    },
    async reviewFeedbackRequest(requestId, payload, actorUser) {
      if (!["admin", "hr"].includes(actorUser.roleKey)) {
        throw new Error("Perfil sem permissao para aprovar solicitacoes de feedback.");
      }

      assertValidFeedbackRequestStatus(payload.status);
      const request = db.feedbackRequests.find((item) => item.id === requestId);
      if (!request) {
        throw new Error("Solicitacao de feedback nao encontrada.");
      }
      if (request.status !== FEEDBACK_REQUEST_STATUS.pending) {
        throw new Error("A solicitacao ja foi tratada.");
      }

      request.status = payload.status;
      request.decidedAt = new Date().toISOString();
      request.decidedByUserId = actorUser.id;

      if (payload.status === FEEDBACK_REQUEST_STATUS.approved) {
        const cycle = db.cycles.find((item) => item.id === request.cycleId);
        const items = getFeedbackRequestItems(db, request.id);

        for (const item of items) {
          const reviewerUser = db.users.find(
            (user) => user.personId === item.providerPersonId && user.status === "active"
          );
          if (!reviewerUser) {
            continue;
          }

          const assignment = {
            id: createId("assignment"),
            cycleId: request.cycleId,
            reviewerUserId: reviewerUser.id,
            revieweePersonId: request.revieweePersonId,
            relationshipType: "peer",
            projectContext: "Feedback direto solicitado",
            collaborationContext: request.contextNote,
            status: "pending",
            dueDate: cycle?.dueDate || ""
          };
          pushAssignment(db.assignments, assignment);
          const createdAssignment = db.assignments.find(
            (entry) =>
              entry.cycleId === assignment.cycleId &&
              entry.reviewerUserId === assignment.reviewerUserId &&
              entry.revieweePersonId === assignment.revieweePersonId &&
              entry.relationshipType === assignment.relationshipType
          );
          item.assignmentId = createdAssignment?.id || null;
        }
      }

      pushAuditLog(db.auditLogs, {
        category: AUDIT_CATEGORIES.feedbackRequest,
        action: payload.status === FEEDBACK_REQUEST_STATUS.approved ? "approved" : "rejected",
        entityType: "feedback_request",
        entityId: request.id,
        entityLabel:
          db.people.find((item) => item.id === request.revieweePersonId)?.name || request.id,
        actorUser,
        summary:
          payload.status === FEEDBACK_REQUEST_STATUS.approved
            ? "Solicitacao de feedback aprovada"
            : "Solicitacao de feedback rejeitada",
        detail: `Ciclo ${request.cycleId} · Contexto: ${request.contextNote}`
      });

      return presentFeedbackRequest(db, request);
    },
    async submitEvaluationAssignment(payload) {
      const assignment = db.assignments.find((item) => item.id === payload.assignmentId);
      if (!assignment) {
        throw new Error("Assignment de avaliacao nao encontrado.");
      }
      if (assignment.reviewerUserId !== payload.reviewerUserId) {
        throw new Error("Usuario nao autorizado a responder esta avaliacao.");
      }
      if (assignment.status === "submitted") {
        throw new Error("Esta avaliacao ja foi enviada.");
      }

      const cycle = db.cycles.find((item) => item.id === assignment.cycleId);
      if (!cycle) {
        throw new Error("Ciclo de avaliacao nao encontrado.");
      }
      if (!isReleasedCycle(cycle.status)) {
        throw new Error("As avaliacoes deste ciclo ainda nao foram liberadas pelo RH.");
      }

      const templateDefinition = getTemplateForRelationship(assignment.relationshipType);
      validateEvaluationAnswers(payload.answers, templateDefinition);

      if (isAnonymousRelationship(assignment.relationshipType)) {
        const anonymousSubmission = createAnonymousSubmissionPayload(assignment, payload);
        anonymousResponseState.responses.unshift(anonymousSubmission);
        await saveAnonymousResponseState(anonymousResponseState);
        assignment.status = "submitted";
        return anonymousSubmission;
      }

      const scaleScores = getAnsweredScaleScores(payload.answers);
      const overallScore = scaleScores.length ? Number(average(scaleScores).toFixed(2)) : null;
      const submission = {
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

      const answerRows = payload.answers.map((answer) => {
        const question = templateDefinition.questions.find(
          (item) => item.id === answer.questionId
        );

        return {
          id: createId("answer"),
          submissionId: submission.id,
          questionId: answer.questionId,
          score: Number.isFinite(Number(answer.score)) ? Number(answer.score) : null,
          evidenceNote: answer.evidenceNote || "",
          textValue: answer.textValue || "",
          selectedOptions: Array.isArray(answer.selectedOptions) ? answer.selectedOptions : [],
          answerType: question?.inputType || "scale"
        };
      });

      db.submissions.unshift(submission);
      db.answers.unshift(...answerRows);
      assignment.status = "submitted";

      return enrichSubmission(db, submission);
    },
    async getApplauseEntries(actorUser) {
      const entries = db.applauseEntries.map((item) => {
        const sender = db.people.find((person) => person.id === item.senderPersonId);
        const receiver = db.people.find((person) => person.id === item.receiverPersonId);
        return {
          ...item,
          senderName: sender?.name || "",
          receiverName: receiver?.name || ""
        };
      });

      if (isOrgWideUser(actorUser)) {
        return entries;
      }

      if (isManagerUser(actorUser)) {
        const visiblePersonIds = new Set([
          actorUser.person.id,
          ...getTeamPeople(db.people, actorUser.person.id).map((item) => item.id)
        ]);
        return entries.filter(
          (item) =>
            visiblePersonIds.has(item.senderPersonId) ||
            visiblePersonIds.has(item.receiverPersonId)
        );
      }

      return entries.filter(
        (item) =>
          item.senderPersonId === actorUser.person.id ||
          item.receiverPersonId === actorUser.person.id
      );
    },
    async createApplauseEntry(payload) {
      assertCanCreateApplause(db.applauseEntries, payload);

      const applause = {
        id: createId("applause"),
        createdAt: new Date().toISOString(),
        status: "Validado",
        ...payload
      };
      db.applauseEntries.unshift(applause);
      return applause;
    },
    async getDevelopmentRecords(actorUser) {
      const records = db.developmentRecords.map((item) => {
        const person = db.people.find((person) => person.id === item.personId);
        return {
          ...item,
          personName: person?.name || ""
        };
      });

      if (isOrgWideUser(actorUser)) {
        return records;
      }

      if (isManagerUser(actorUser)) {
        const visiblePersonIds = new Set([
          actorUser.person.id,
          ...getTeamPeople(db.people, actorUser.person.id).map((item) => item.id)
        ]);
        return records.filter((item) => visiblePersonIds.has(item.personId));
      }

      return records.filter((item) => item.personId === actorUser.person.id);
    },
    async createDevelopmentRecord(payload, actorUser) {
      assertCanCreateDevelopmentRecord(actorUser, db.people, payload.personId);

      const record = {
        id: createId("development"),
        ...payload
      };
      db.developmentRecords.unshift(record);
      return record;
    },
    async getDashboardOverview(actorUser, options = {}) {
      const allResponses = [
        ...db.submissions.map((item) => enrichSubmission(db, item)),
        ...anonymousResponseState.responses
      ];
      const availableAreas = [...new Set(db.people.map((person) => person.area))].sort();
      const timeGrouping = options.timeGrouping || "semester";

      if (isOrgWideUser(actorUser)) {
        const scopedPeople = options.area
          ? db.people.filter((person) => person.area === options.area)
          : db.people;
        const scopedPersonIds = new Set(scopedPeople.map((person) => person.id));
        const scopedAssignments = db.assignments.filter((item) =>
          scopedPersonIds.has(item.revieweePersonId)
        );
        const scopedCycleIds = new Set(scopedAssignments.map((item) => item.cycleId));
        const scopedApplause = db.applauseEntries.filter((item) =>
          scopedPersonIds.has(item.receiverPersonId)
        );
        const scopedDevelopment = db.developmentRecords.filter((item) =>
          scopedPersonIds.has(item.personId)
        );
        const scopedResponses = allResponses.filter((item) =>
          scopedPersonIds.has(item.revieweePersonId)
        );
        const scopedCycles = db.cycles.filter((cycle) => scopedCycleIds.has(cycle.id));

        return buildDashboardPayload({
          mode: "executive",
          notice: options.area
            ? `Leitura consolidada filtrada para a area ${options.area}.`
            : "Leitura consolidada para RH, compliance e lideranca.",
          scopeLabel: options.area ? `Area: ${options.area}` : "Consolidado organizacional",
          cycles: scopedCycles,
          people: scopedPeople,
          assignments: scopedAssignments,
          applauseEntries: scopedApplause,
          developmentRecords: scopedDevelopment,
          responses: scopedResponses,
          availableAreas,
          selectedArea: options.area,
          timeGrouping,
          evaluationHighlights: [
            "Leitura consolidada pronta para ritos executivos e comites.",
            "Filtro por area ajuda a comparar recortes sem expor detalhes indevidos.",
            "KPIs, donuts e mix de avaliacoes se ajustam ao escopo aplicado."
          ]
        });
      }

      if (isManagerUser(actorUser)) {
        const teamPeople = getTeamPeople(db.people, actorUser.person.id);
        const scopedPeople = [actorUser.person, ...teamPeople];
        const visiblePersonIds = new Set(scopedPeople.map((item) => item.id));
        const teamAssignments = db.assignments.filter(
          (item) =>
            item.reviewerUserId === actorUser.id || visiblePersonIds.has(item.revieweePersonId)
        );
        const teamCycleIds = new Set(teamAssignments.map((item) => item.cycleId));
        const teamResponses = allResponses.filter((response) =>
          visiblePersonIds.has(response.revieweePersonId)
        );
        const teamApplause = db.applauseEntries.filter((item) =>
          visiblePersonIds.has(item.receiverPersonId)
        );
        const teamDevelopment = db.developmentRecords.filter((item) =>
          visiblePersonIds.has(item.personId)
        );
        const teamCycles = db.cycles.filter((cycle) => teamCycleIds.has(cycle.id));

        return buildDashboardPayload({
          mode: "team",
          notice: "Leitura da sua equipe direta, sem exposicao de outras areas.",
          scopeLabel: "Equipe direta",
          cycles: teamCycles,
          people: scopedPeople,
          assignments: teamAssignments,
          applauseEntries: teamApplause,
          developmentRecords: teamDevelopment,
          responses: teamResponses,
          timeGrouping,
          evaluationHighlights: [
            "Voce acompanha somente sua equipe direta.",
            "Respostas confidenciais continuam agregadas quando aplicavel.",
            "O dashboard gerencial reforca entregas, cobertura e desenvolvimento do time."
          ]
        });
      }

      const myAssignments = db.assignments.filter((item) => item.reviewerUserId === actorUser.id);
      const myCycleIds = new Set(myAssignments.map((item) => item.cycleId));
      const personalResponses = allResponses.filter((response) => response.reviewerUserId === actorUser.id);
      const personalApplause = db.applauseEntries.filter(
        (item) => item.receiverPersonId === actorUser.person.id
      );
      const myDevelopmentRecords = db.developmentRecords.filter(
        (item) => item.personId === actorUser.person.id
      );
      const myCycles = db.cycles.filter((cycle) => myCycleIds.has(cycle.id));

      return buildDashboardPayload({
        mode: "personal",
        notice: "Voce esta vendo apenas seu recorte individual.",
        scopeLabel: "Visao pessoal",
        cycles: myCycles,
        people: [db.people.find((item) => item.id === actorUser.person.id)].filter(Boolean),
        assignments: myAssignments,
        applauseEntries: personalApplause,
        developmentRecords: myDevelopmentRecords,
        responses: personalResponses,
        timeGrouping,
        evaluationHighlights: [
          "Seu dashboard mostra apenas dados pessoais e agregados permitidos.",
          "Respostas confidenciais de lideranca e empresa entram somente em leitura agregada.",
          "A trilha de desenvolvimento e o ciclo aparecem no mesmo contexto operacional."
        ]
      });
    }
  };
}

function buildMysqlStore(pool, customLibraryState, anonymousResponseState) {
  return {
    async findUserByEmail(email) {
      const [rows] = await pool.query(
        `SELECT u.id, u.person_id AS personId, u.email, u.password_hash AS passwordHash,
                u.role_key AS roleKey, u.status
         FROM users u
         WHERE u.email = ?
         LIMIT 1`,
        [email]
      );
      return rows[0] || null;
    },
    async getUserById(userId) {
      const [rows] = await pool.query(
        `SELECT u.id, u.email, u.role_key AS roleKey, u.status,
                p.id AS personId, p.name, p.role_title AS roleTitle, p.area,
                p.manager_person_id AS managerPersonId, manager.name AS managerName,
                p.employment_type AS employmentType
         FROM users u
         JOIN people p ON p.id = u.person_id
         LEFT JOIN people manager ON manager.id = p.manager_person_id
         WHERE u.id = ?
         LIMIT 1`,
        [userId]
      );

      if (!rows[0]) {
        return null;
      }

      return {
        id: rows[0].id,
        email: rows[0].email,
        roleKey: rows[0].roleKey,
        status: rows[0].status,
        person: {
          id: rows[0].personId,
          name: rows[0].name,
          roleTitle: rows[0].roleTitle,
          area: rows[0].area,
          managerPersonId: rows[0].managerPersonId || null,
          managerName: rows[0].managerName,
          employmentType: rows[0].employmentType
        }
      };
    },
    async authenticateUser(email, password) {
      const user = await this.findUserByEmail(email);
      if (!user || user.status !== "active" || !verifyPasswordHash(user.passwordHash, password)) {
        return null;
      }
      return this.getUserById(user.id);
    },
    async getPeople(actorUser) {
      const people = await fetchPeopleRows(pool);
      return filterPeopleForUser(people, actorUser);
    },
    async createPerson(payload, actorUser) {
      if (!canManagePeople(actorUser)) {
        throw new Error("Perfil sem permissao para cadastrar pessoas.");
      }

      const people = await fetchPeopleRows(pool);
      assertValidManagerReference(people, payload.managerPersonId);

      const person = {
        id: createId("person"),
        name: payload.name,
        roleTitle: payload.roleTitle,
        area: payload.area,
        managerPersonId: payload.managerPersonId || null,
        employmentType: payload.employmentType,
        satisfactionScore: Number(payload.satisfactionScore || 0)
      };

      await pool.query(
        `INSERT INTO people
         (id, name, role_title, area, manager_person_id, employment_type, satisfaction_score)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          person.id,
          person.name,
          person.roleTitle,
          person.area,
          person.managerPersonId,
          person.employmentType,
          person.satisfactionScore
        ]
      );

      return {
        ...person,
        managerName: people.find((item) => item.id === person.managerPersonId)?.name || ""
      };
    },
    async getUsers(actorUser) {
      if (!canManageUsers(actorUser)) {
        return [];
      }

      const [rows] = await pool.query(
        `SELECT u.id, u.person_id AS personId, p.name AS personName, p.area AS personArea,
                u.email, u.role_key AS roleKey, u.status
         FROM users u
         JOIN people p ON p.id = u.person_id
         ORDER BY p.name`
      );
      return rows;
    },
    async getAuditTrail(actorUser, options = {}) {
      return fetchAuditLogs(pool, actorUser, options);
    },
    async createUser(payload, actorUser) {
      if (!canManageUsers(actorUser)) {
        throw new Error("Perfil sem permissao para cadastrar usuarios.");
      }

      assertValidUserRole(payload.roleKey);
      assertValidUserStatus(payload.status);

      const [personRows] = await pool.query(
        `SELECT id, name, area
         FROM people
         WHERE id = ?
         LIMIT 1`,
        [payload.personId]
      );
      if (!personRows[0]) {
        throw new Error("Pessoa vinculada nao encontrada.");
      }

      const [personUserRows] = await pool.query(
        `SELECT id
         FROM users
         WHERE person_id = ?
         LIMIT 1`,
        [payload.personId]
      );
      if (personUserRows[0]) {
        throw new Error("Ja existe um usuario vinculado a esta pessoa.");
      }

      const [emailRows] = await pool.query(
        `SELECT id
         FROM users
         WHERE email = ?
         LIMIT 1`,
        [payload.email]
      );
      if (emailRows[0]) {
        throw new Error("Ja existe um usuario com este email.");
      }

      const user = {
        id: createId("user"),
        personId: payload.personId,
        email: payload.email,
        roleKey: payload.roleKey,
        status: payload.status
      };

      await pool.query(
        `INSERT INTO users
         (id, person_id, email, password_hash, role_key, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user.id, user.personId, user.email, hashPassword(payload.password), user.roleKey, user.status]
      );

      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.user,
        action: "created",
        entityType: "user",
        entityId: user.id,
        entityLabel: personRows[0].name,
        actorUser,
        summary: `Usuario criado para ${personRows[0].name}`,
        detail: `${payload.roleKey} · ${payload.status} · ${payload.email}`
      });

      return {
        ...user,
        personName: personRows[0].name,
        personArea: personRows[0].area
      };
    },
    async updateUser(userId, payload, actorUser) {
      if (!canManageUsers(actorUser)) {
        throw new Error("Perfil sem permissao para atualizar usuarios.");
      }

      assertValidUserRole(payload.roleKey);
      assertValidUserStatus(payload.status);

      const [rows] = await pool.query(
        `SELECT u.id, u.person_id AS personId, p.name AS personName, p.area AS personArea,
                u.email
         FROM users u
         JOIN people p ON p.id = u.person_id
         WHERE u.id = ?
         LIMIT 1`,
        [userId]
      );
      if (!rows[0]) {
        throw new Error("Usuario nao encontrado.");
      }

      if (payload.password?.trim()) {
        await pool.query(
          `UPDATE users
           SET role_key = ?, status = ?, password_hash = ?
           WHERE id = ?`,
          [payload.roleKey, payload.status, hashPassword(payload.password), userId]
        );
      } else {
        await pool.query(
          `UPDATE users
           SET role_key = ?, status = ?
           WHERE id = ?`,
          [payload.roleKey, payload.status, userId]
        );
      }

      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.user,
        action: "updated",
        entityType: "user",
        entityId: userId,
        entityLabel: rows[0].personName,
        actorUser,
        summary: `Acesso atualizado para ${rows[0].personName}`,
        detail: `${payload.roleKey} · ${payload.status}${payload.password?.trim() ? " · senha redefinida" : ""}`
      });

      return {
        id: userId,
        personId: rows[0].personId,
        personName: rows[0].personName,
        personArea: rows[0].personArea,
        email: rows[0].email,
        roleKey: payload.roleKey,
        status: payload.status
      };
    },
    async getSummary(actorUser) {
      if (isFullAccessUser(actorUser)) {
        const [people] = await pool.query("SELECT COUNT(*) AS total FROM people");
        const [incidents] = await pool.query(
          "SELECT COUNT(*) AS total FROM incident_reports WHERE status <> 'Concluido'"
        );
        const [cycles] = await pool.query(
          "SELECT COUNT(*) AS total FROM evaluation_cycles WHERE status = ?",
          [CYCLE_STATUS.released]
        );
        const [applause] = await pool.query("SELECT COUNT(*) AS total FROM applause_entries");
        const [development] = await pool.query(
          "SELECT COUNT(*) AS total FROM development_records"
        );
        const [assignments] = await pool.query(
          "SELECT COUNT(*) AS total FROM evaluation_assignments WHERE status = 'pending'"
        );

        return {
          mode: "executive",
          peopleCount: people[0].total,
          openIncidents: incidents[0].total,
          activeEvaluationCycles: cycles[0].total,
          applauseCount: applause[0].total,
          developmentRecords: development[0].total,
          pendingAssignments: assignments[0].total
        };
      }

      if (isManagerUser(actorUser)) {
        const people = await fetchPeopleRows(pool);
        const visiblePersonIds = new Set([
          actorUser.person.id,
          ...getTeamPeople(people, actorUser.person.id).map((item) => item.id)
        ]);
        const [cycles] = await pool.query(
          "SELECT COUNT(*) AS total FROM evaluation_cycles WHERE status = ?",
          [CYCLE_STATUS.released]
        );
        const [assignments] = await pool.query(
          `SELECT reviewer_user_id AS reviewerUserId, reviewee_person_id AS revieweePersonId, status
           FROM evaluation_assignments`
        );
        const [applause] = await pool.query(
          `SELECT sender_person_id AS senderPersonId, receiver_person_id AS receiverPersonId
           FROM applause_entries`
        );
        const [development] = await pool.query(
          `SELECT person_id AS personId FROM development_records`
        );

        return {
          mode: "team",
          peopleCount: visiblePersonIds.size,
          openIncidents: 0,
          activeEvaluationCycles: cycles[0].total,
          applauseCount: applause.filter(
            (item) =>
              visiblePersonIds.has(item.senderPersonId) ||
              visiblePersonIds.has(item.receiverPersonId)
          ).length,
          developmentRecords: development.filter((item) => visiblePersonIds.has(item.personId))
            .length,
          pendingAssignments: assignments.filter(
            (item) =>
              item.status === "pending" &&
              (item.reviewerUserId === actorUser.id ||
                visiblePersonIds.has(item.revieweePersonId))
          ).length
        };
      }

      const [cycles] = await pool.query(
        "SELECT COUNT(*) AS total FROM evaluation_cycles WHERE status = ?",
        [CYCLE_STATUS.released]
      );
      const [assignments] = await pool.query(
        `SELECT COUNT(*) AS total
         FROM evaluation_assignments
         WHERE reviewer_user_id = ? AND status = 'pending'`,
        [actorUser.id]
      );
      const [applause] = await pool.query(
        `SELECT COUNT(*) AS total FROM applause_entries WHERE receiver_person_id = ?`,
        [actorUser.person.id]
      );
      const [development] = await pool.query(
        `SELECT COUNT(*) AS total FROM development_records WHERE person_id = ?`,
        [actorUser.person.id]
      );

      return {
        mode: "personal",
        peopleCount: 1,
        openIncidents: 0,
        activeEvaluationCycles: cycles[0].total,
        applauseCount: applause[0].total,
        developmentRecords: development[0].total,
        pendingAssignments: assignments[0].total
      };
    },
    async getIncidents(actorUser) {
      if (!canAccessIncidents(actorUser)) {
        return [];
      }

      const [rows] = await pool.query(
        `SELECT id, title, category, classification, status, anonymity, reporter_label AS reporterLabel,
                assigned_to AS assignedTo, created_at AS createdAt, description
         FROM incident_reports
         ORDER BY created_at DESC`
      );
      return rows;
    },
    async createIncident(payload, actorUser) {
      assertValidIncidentClassification(payload.classification);

      const incident = {
        id: createId("incident"),
        status: "Em triagem",
        createdAt: new Date().toISOString(),
        ...payload
      };

      await pool.query(
        `INSERT INTO incident_reports
         (id, title, category, classification, status, anonymity, reporter_label, assigned_to, created_at, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          incident.id,
          incident.title,
          incident.category,
          incident.classification,
          incident.status,
          incident.anonymity,
          incident.reporterLabel,
          incident.assignedTo,
          incident.createdAt,
          incident.description
        ]
      );

      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.incident,
        action: "created",
        entityType: "incident",
        entityId: incident.id,
        entityLabel: incident.title,
        actorUser,
        summary: `Relato registrado: ${incident.title}`,
        detail: `${incident.classification} · Responsavel inicial: ${incident.assignedTo}`
      });

      return incident;
    },
    async updateIncident(incidentId, payload, actorUser) {
      if (!canManageIncidentQueue(actorUser)) {
        throw new Error("Perfil sem permissao para atualizar o caso.");
      }

      assertValidIncidentClassification(payload.classification);
      assertValidIncidentStatus(payload.status);

      const [rows] = await pool.query(
        `SELECT id
         FROM incident_reports
         WHERE id = ?
         LIMIT 1`,
        [incidentId]
      );

      if (!rows[0]) {
        throw new Error("Caso de compliance nao encontrado.");
      }

      await pool.query(
        `UPDATE incident_reports
         SET classification = ?, status = ?, assigned_to = ?
         WHERE id = ?`,
        [payload.classification, payload.status, payload.assignedTo, incidentId]
      );

      const [updatedRows] = await pool.query(
        `SELECT id, title, category, classification, status, anonymity, reporter_label AS reporterLabel,
                assigned_to AS assignedTo, created_at AS createdAt, description
         FROM incident_reports
         WHERE id = ?
         LIMIT 1`,
        [incidentId]
      );

      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.incident,
        action: "updated",
        entityType: "incident",
        entityId: incidentId,
        entityLabel: updatedRows[0].title,
        actorUser,
        summary: `Caso atualizado: ${updatedRows[0].title}`,
        detail: `${updatedRows[0].status} · ${updatedRows[0].classification} · Responsavel: ${updatedRows[0].assignedTo}`
      });

      return updatedRows[0];
    },
    async getEvaluationTemplate() {
      return buildTemplate(evaluationLibrary.templates.collaboration);
    },
    async getEvaluationLibrary() {
      return buildEvaluationLibraryPayload(customLibraryState.published);
    },
    async importCustomLibraryDraft(payload) {
      const draft = {
        id: createId("library_draft"),
        fileName: payload.fileName,
        createdAt: new Date().toISOString(),
        createdByUserId: payload.createdByUserId,
        errors: payload.errors,
        templates: payload.templates,
        summary: payload.summary
      };
      customLibraryState.drafts.unshift(draft);
      await saveCustomLibraryState(customLibraryState);
      return draft;
    },
    async publishCustomLibraryDraft(payload) {
      const draft = customLibraryState.drafts.find((item) => item.id === payload.draftId);
      if (!draft) {
        throw new Error("Rascunho da biblioteca nao encontrado.");
      }
      if (draft.errors.length) {
        throw new Error("Nao e possivel publicar uma biblioteca com erros.");
      }

      const published = {
        id: createId("library"),
        name: payload.name,
        description: payload.description || "",
        sourceFileName: draft.fileName,
        createdAt: new Date().toISOString(),
        createdByUserId: payload.createdByUserId,
        templateCount: draft.templates.length,
        questionCount: draft.summary.questions,
        templates: draft.templates
      };
      customLibraryState.published.unshift(published);
      customLibraryState.drafts = customLibraryState.drafts.filter(
        (item) => item.id !== payload.draftId
      );
      await saveCustomLibraryState(customLibraryState);
      return published;
    },
    async getEvaluationTemplateForRelationship(relationshipType) {
      return buildTemplate(getTemplateForRelationship(relationshipType));
    },
    async getEvaluationCycles() {
      const [rows] = await pool.query(
        `SELECT c.id, c.template_id AS templateId, c.title, c.semester_label AS semesterLabel,
                c.status, c.due_date AS dueDate, c.target_group AS targetGroup,
                t.name AS modelName, c.created_by_user_id AS createdByUserId
         FROM evaluation_cycles c
         JOIN evaluation_templates t ON t.id = c.template_id
         ORDER BY c.due_date DESC`
      );
      return rows;
    },
    async createEvaluationCycle(payload, actorUser) {
      const cycle = {
        id: createId("cycle"),
        ...payload,
        status: CYCLE_STATUS.planning
      };
      const users = await fetchUserRows(pool);
      const people = await fetchPeopleRows(pool);
      const generatedAssignments = generateAssignments({
        users,
        people,
        cycleId: cycle.id,
        dueDate: cycle.dueDate
      });

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        await connection.query(
          `INSERT INTO evaluation_cycles
           (id, template_id, title, semester_label, status, due_date, target_group, created_by_user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            cycle.id,
            cycle.templateId,
            cycle.title,
            cycle.semesterLabel,
            cycle.status,
            cycle.dueDate,
            cycle.targetGroup,
            cycle.createdByUserId
          ]
        );

        for (const assignment of generatedAssignments) {
          await connection.query(
            `INSERT INTO evaluation_assignments
             (id, cycle_id, reviewer_user_id, reviewee_person_id, relationship_type, project_context,
              collaboration_context, status, due_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              assignment.id,
              assignment.cycleId,
              assignment.reviewerUserId,
              assignment.revieweePersonId,
              assignment.relationshipType,
              assignment.projectContext,
              assignment.collaborationContext,
              assignment.status,
              assignment.dueDate
            ]
          );
        }

        await insertAuditLog(connection, {
          category: AUDIT_CATEGORIES.cycle,
          action: "created",
          entityType: "cycle",
          entityId: cycle.id,
          entityLabel: cycle.title,
          actorUser,
          summary: `Ciclo criado: ${cycle.title}`,
          detail: `${cycle.semesterLabel} · ${generatedAssignments.length} assignments distribuidos`
        });

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      return {
        ...cycle,
        generatedAssignmentsCount: generatedAssignments.length
      };
    },
    async updateEvaluationCycleStatus(cycleId, nextStatus, actorUser) {
      const [rows] = await pool.query(
        `SELECT id, status
         FROM evaluation_cycles
         WHERE id = ?
         LIMIT 1`,
        [cycleId]
      );

      if (!rows[0]) {
        throw new Error("Ciclo de avaliacao nao encontrado.");
      }

      const previousStatus = rows[0].status;
      assertCycleStatusTransition(rows[0].status, nextStatus);

      await pool.query(
        `UPDATE evaluation_cycles
         SET status = ?
         WHERE id = ?`,
        [nextStatus, cycleId]
      );

      const [updatedRows] = await pool.query(
        `SELECT c.id, c.template_id AS templateId, c.title, c.semester_label AS semesterLabel,
                c.status, c.due_date AS dueDate, c.target_group AS targetGroup,
                t.name AS modelName, c.created_by_user_id AS createdByUserId
         FROM evaluation_cycles c
         JOIN evaluation_templates t ON t.id = c.template_id
         WHERE c.id = ?
         LIMIT 1`,
        [cycleId]
      );

      await insertAuditLog(pool, {
        category: AUDIT_CATEGORIES.cycle,
        action: "status_changed",
        entityType: "cycle",
        entityId: cycleId,
        entityLabel: updatedRows[0].title,
        actorUser,
        summary: `Status do ciclo atualizado: ${updatedRows[0].title}`,
        detail: `${previousStatus} -> ${nextStatus}`
      });

      return updatedRows[0];
    },
    async getEvaluationAssignmentsForUser(userId) {
      const [rows] = await pool.query(
        `SELECT a.id, a.cycle_id AS cycleId, a.reviewer_user_id AS reviewerUserId,
                a.reviewee_person_id AS revieweePersonId, a.relationship_type AS relationshipType,
                a.project_context AS projectContext, a.collaboration_context AS collaborationContext,
                a.status, a.due_date AS dueDate, c.title AS cycleTitle, c.semester_label AS semesterLabel,
                c.template_id AS templateId, c.status AS cycleStatus,
                p.name AS revieweeName, p.area AS revieweeArea,
                reviewer_person.name AS reviewerName, s.overall_score AS overallScore,
                s.submitted_at AS submittedAt
         FROM evaluation_assignments a
         JOIN evaluation_cycles c ON c.id = a.cycle_id
         JOIN people p ON p.id = a.reviewee_person_id
         JOIN users reviewer_user ON reviewer_user.id = a.reviewer_user_id
         JOIN people reviewer_person ON reviewer_person.id = reviewer_user.person_id
         LEFT JOIN evaluation_submissions s ON s.assignment_id = a.id
         WHERE a.reviewer_user_id = ?
         ORDER BY a.due_date ASC`,
        [userId]
      );
      return rows.map(presentAssignment);
    },
    async getEvaluationAssignmentById(assignmentId, userId) {
      const [rows] = await pool.query(
        `SELECT a.id, a.cycle_id AS cycleId, a.reviewer_user_id AS reviewerUserId,
                a.reviewee_person_id AS revieweePersonId, a.relationship_type AS relationshipType,
                a.project_context AS projectContext, a.collaboration_context AS collaborationContext,
                a.status, a.due_date AS dueDate, c.title AS cycleTitle, c.semester_label AS semesterLabel,
                c.template_id AS templateId, c.status AS cycleStatus,
                p.name AS revieweeName, p.area AS revieweeArea
         FROM evaluation_assignments a
         JOIN evaluation_cycles c ON c.id = a.cycle_id
         JOIN people p ON p.id = a.reviewee_person_id
         WHERE a.id = ? AND a.reviewer_user_id = ?
         LIMIT 1`,
        [assignmentId, userId]
      );
      return rows[0] ? presentAssignment(rows[0]) : null;
    },
    async getEvaluationResponses(actorUser) {
      const responses = [
        ...(await fetchMysqlResponses(pool)),
        ...anonymousResponseState.responses
      ];
      return buildResponsesBundle(responses, actorUser);
    },
    async getFeedbackRequests(actorUser) {
      const [requestRows] = await pool.query(
        `SELECT r.id, r.cycle_id AS cycleId, r.requester_user_id AS requesterUserId,
                r.reviewee_person_id AS revieweePersonId, r.status, r.context_note AS contextNote,
                r.requested_at AS requestedAt, r.decided_at AS decidedAt,
                r.decided_by_user_id AS decidedByUserId,
                c.title AS cycleTitle, c.semester_label AS semesterLabel, c.status AS cycleStatus,
                requester_person.name AS requesterName, reviewee.name AS revieweeName,
                decided_person.name AS decidedByName
         FROM evaluation_feedback_requests r
         JOIN evaluation_cycles c ON c.id = r.cycle_id
         JOIN users requester_user ON requester_user.id = r.requester_user_id
         JOIN people requester_person ON requester_person.id = requester_user.person_id
         JOIN people reviewee ON reviewee.id = r.reviewee_person_id
         LEFT JOIN users decided_user ON decided_user.id = r.decided_by_user_id
         LEFT JOIN people decided_person ON decided_person.id = decided_user.person_id
         ORDER BY r.requested_at DESC`
      );
      const [itemRows] = await pool.query(
        `SELECT i.id, i.request_id AS requestId, i.provider_person_id AS providerPersonId,
                i.assignment_id AS assignmentId, p.name AS providerName
         FROM evaluation_feedback_request_items i
         JOIN people p ON p.id = i.provider_person_id
         ORDER BY p.name`
      );

      const requests = requestRows.map((row) => ({
        ...row,
        providers: itemRows.filter((item) => item.requestId === row.id)
      }));

      if (isOrgWideUser(actorUser)) {
        return requests;
      }

      if (isManagerUser(actorUser)) {
        const people = await fetchPeopleRows(pool);
        return requests.filter((item) => {
          const reviewee = people.find((person) => person.id === item.revieweePersonId);
          return (
            item.requesterUserId === actorUser.id ||
            item.revieweePersonId === actorUser.person.id ||
            reviewee?.managerPersonId === actorUser.person.id
          );
        });
      }

      return requests.filter((item) => item.requesterUserId === actorUser.id);
    },
    async createFeedbackRequest(payload, actorUser) {
      const people = await fetchPeopleRows(pool);
      const users = await fetchUserRows(pool);
      const dbSnapshot = {
        people,
        users,
        cycles: await this.getEvaluationCycles(),
        assignments: await pool
          .query(
            `SELECT id, cycle_id AS cycleId, reviewer_user_id AS reviewerUserId,
                    reviewee_person_id AS revieweePersonId, relationship_type AS relationshipType
             FROM evaluation_assignments`
          )
          .then(([rows]) => rows)
      };
      const providerPersonIds = assertCanCreateFeedbackRequest(dbSnapshot, actorUser, payload);

      const request = {
        id: createId("feedback_request"),
        cycleId: payload.cycleId,
        requesterUserId: actorUser.id,
        revieweePersonId: actorUser.person.id,
        status: FEEDBACK_REQUEST_STATUS.pending,
        contextNote: payload.contextNote.trim(),
        requestedAt: new Date().toISOString()
      };

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(
          `INSERT INTO evaluation_feedback_requests
           (id, cycle_id, requester_user_id, reviewee_person_id, status, context_note, requested_at, decided_at, decided_by_user_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
          [
            request.id,
            request.cycleId,
            request.requesterUserId,
            request.revieweePersonId,
            request.status,
            request.contextNote,
            request.requestedAt
          ]
        );

        for (const providerPersonId of providerPersonIds) {
          await connection.query(
            `INSERT INTO evaluation_feedback_request_items
             (id, request_id, provider_person_id, assignment_id)
             VALUES (?, ?, ?, NULL)`,
            [createId("feedback_request_item"), request.id, providerPersonId]
          );
        }

        await insertAuditLog(connection, {
          category: AUDIT_CATEGORIES.feedbackRequest,
          action: "created",
          entityType: "feedback_request",
          entityId: request.id,
          entityLabel: actorUser.person?.name || actorUser.email,
          actorUser,
          summary: "Solicitacao de feedback direto registrada",
          detail: `${providerPersonIds.length} fornecedores sugeridos · Ciclo ${request.cycleId}`
        });

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      const requests = await this.getFeedbackRequests(actorUser);
      return requests.find((item) => item.id === request.id);
    },
    async reviewFeedbackRequest(requestId, payload, actorUser) {
      if (!["admin", "hr"].includes(actorUser.roleKey)) {
        throw new Error("Perfil sem permissao para aprovar solicitacoes de feedback.");
      }

      assertValidFeedbackRequestStatus(payload.status);

      const [requestRows] = await pool.query(
        `SELECT r.id, r.cycle_id AS cycleId, r.requester_user_id AS requesterUserId,
                r.reviewee_person_id AS revieweePersonId, r.status, r.context_note AS contextNote,
                c.due_date AS dueDate
         FROM evaluation_feedback_requests r
         JOIN evaluation_cycles c ON c.id = r.cycle_id
         WHERE r.id = ?
         LIMIT 1`,
        [requestId]
      );
      if (!requestRows[0]) {
        throw new Error("Solicitacao de feedback nao encontrada.");
      }
      if (requestRows[0].status !== FEEDBACK_REQUEST_STATUS.pending) {
        throw new Error("A solicitacao ja foi tratada.");
      }

      const [itemRows] = await pool.query(
        `SELECT i.id, i.provider_person_id AS providerPersonId
         FROM evaluation_feedback_request_items i
         WHERE i.request_id = ?`,
        [requestId]
      );

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        await connection.query(
          `UPDATE evaluation_feedback_requests
           SET status = ?, decided_at = ?, decided_by_user_id = ?
           WHERE id = ?`,
          [payload.status, new Date().toISOString(), actorUser.id, requestId]
        );

        if (payload.status === FEEDBACK_REQUEST_STATUS.approved) {
          const users = await fetchUserRows(pool);
          for (const item of itemRows) {
            const reviewerUser = users.find(
              (user) => user.personId === item.providerPersonId && user.status === "active"
            );
            if (!reviewerUser) {
              continue;
            }

            const assignmentId = createId("assignment");
            await connection.query(
              `INSERT INTO evaluation_assignments
               (id, cycle_id, reviewer_user_id, reviewee_person_id, relationship_type, project_context,
                collaboration_context, status, due_date)
               VALUES (?, ?, ?, ?, 'peer', ?, ?, 'pending', ?)`,
              [
                assignmentId,
                requestRows[0].cycleId,
                reviewerUser.id,
                requestRows[0].revieweePersonId,
                "Feedback direto solicitado",
                requestRows[0].contextNote,
                requestRows[0].dueDate
              ]
            );
            await connection.query(
              `UPDATE evaluation_feedback_request_items
               SET assignment_id = ?
               WHERE id = ?`,
              [assignmentId, item.id]
            );
          }
        }

        await insertAuditLog(connection, {
          category: AUDIT_CATEGORIES.feedbackRequest,
          action: payload.status === FEEDBACK_REQUEST_STATUS.approved ? "approved" : "rejected",
          entityType: "feedback_request",
          entityId: requestId,
          entityLabel: requestRows[0].revieweePersonId,
          actorUser,
          summary:
            payload.status === FEEDBACK_REQUEST_STATUS.approved
              ? "Solicitacao de feedback aprovada"
              : "Solicitacao de feedback rejeitada",
          detail: `Ciclo ${requestRows[0].cycleId} · Contexto: ${requestRows[0].contextNote}`
        });

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      const requests = await this.getFeedbackRequests(actorUser);
      return requests.find((item) => item.id === requestId);
    },
    async submitEvaluationAssignment(payload) {
      const assignment = await this.getEvaluationAssignmentById(
        payload.assignmentId,
        payload.reviewerUserId
      );
      if (!assignment) {
        throw new Error("Assignment de avaliacao nao encontrado.");
      }
      if (assignment.status === "submitted") {
        throw new Error("Esta avaliacao ja foi enviada.");
      }
      if (!isReleasedCycle(assignment.cycleStatus)) {
        throw new Error("As avaliacoes deste ciclo ainda nao foram liberadas pelo RH.");
      }

      const templateDefinition = getTemplateForRelationship(assignment.relationshipType);
      validateEvaluationAnswers(payload.answers, templateDefinition);

      if (isAnonymousRelationship(assignment.relationshipType)) {
        const anonymousSubmission = createAnonymousSubmissionPayload(assignment, payload);
        anonymousResponseState.responses.unshift(anonymousSubmission);
        await saveAnonymousResponseState(anonymousResponseState);
        await pool.query(
          `UPDATE evaluation_assignments SET status = 'submitted' WHERE id = ?`,
          [assignment.id]
        );
        return anonymousSubmission;
      }

      const submissionId = createId("submission");
      const scaleScores = getAnsweredScaleScores(payload.answers);
      const overallScore = scaleScores.length ? Number(average(scaleScores).toFixed(2)) : null;
      const submittedAt = new Date().toISOString();

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        await connection.query(
          `INSERT INTO evaluation_submissions
           (id, assignment_id, cycle_id, reviewer_user_id, reviewee_person_id, overall_score,
            strengths_note, development_note, submitted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            submissionId,
            assignment.id,
            assignment.cycleId,
            payload.reviewerUserId,
            assignment.revieweePersonId,
            overallScore,
            payload.strengthsNote || "",
            payload.developmentNote || "",
            submittedAt
          ]
        );

        for (const answer of payload.answers) {
          const question = templateDefinition.questions.find(
            (item) => item.id === answer.questionId
          );
          await connection.query(
            `INSERT INTO evaluation_answers
             (id, submission_id, question_id, answer_type, score, evidence_note, answer_text, answer_options_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              createId("answer"),
              submissionId,
              answer.questionId,
              question?.inputType || "scale",
              Number.isFinite(Number(answer.score)) ? Number(answer.score) : null,
              answer.evidenceNote || "",
              answer.textValue || "",
              JSON.stringify(Array.isArray(answer.selectedOptions) ? answer.selectedOptions : [])
            ]
          );
        }

        await connection.query(
          `UPDATE evaluation_assignments SET status = 'submitted' WHERE id = ?`,
          [assignment.id]
        );

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      const responses = await fetchMysqlResponses(pool);
      return responses.find((item) => item.id === submissionId);
    },
    async getApplauseEntries(actorUser) {
      const [rows] = await pool.query(
        `SELECT a.id, a.sender_person_id AS senderPersonId, a.receiver_person_id AS receiverPersonId,
                a.category, a.impact, a.context_note AS contextNote, a.created_at AS createdAt,
                a.status, sender.name AS senderName, receiver.name AS receiverName
         FROM applause_entries a
         JOIN people sender ON sender.id = a.sender_person_id
         JOIN people receiver ON receiver.id = a.receiver_person_id
         ORDER BY a.created_at DESC`
      );

      if (isFullAccessUser(actorUser)) {
        return rows;
      }

      if (isManagerUser(actorUser)) {
        const people = await fetchPeopleRows(pool);
        const visiblePersonIds = new Set([
          actorUser.person.id,
          ...getTeamPeople(people, actorUser.person.id).map((item) => item.id)
        ]);
        return rows.filter(
          (item) =>
            visiblePersonIds.has(item.senderPersonId) ||
            visiblePersonIds.has(item.receiverPersonId)
        );
      }

      return rows.filter(
        (item) =>
          item.senderPersonId === actorUser.person.id ||
          item.receiverPersonId === actorUser.person.id
      );
    },
    async createApplauseEntry(payload) {
      const [rows] = await pool.query(
        `SELECT sender_person_id AS senderPersonId, receiver_person_id AS receiverPersonId, created_at AS createdAt
         FROM applause_entries`
      );
      assertCanCreateApplause(rows, payload);

      const applause = {
        id: createId("applause"),
        createdAt: new Date().toISOString(),
        status: "Validado",
        ...payload
      };
      await pool.query(
        `INSERT INTO applause_entries
         (id, sender_person_id, receiver_person_id, category, impact, context_note, created_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          applause.id,
          applause.senderPersonId,
          applause.receiverPersonId,
          applause.category,
          applause.impact,
          applause.contextNote,
          applause.createdAt,
          applause.status
        ]
      );
      return applause;
    },
    async getDevelopmentRecords(actorUser) {
      const [rows] = await pool.query(
        `SELECT d.id, d.person_id AS personId, p.name AS personName, d.record_type AS recordType,
                d.title, d.provider_name AS providerName, d.completed_at AS completedAt,
                d.skill_signal AS skillSignal, d.notes
         FROM development_records d
         JOIN people p ON p.id = d.person_id
         ORDER BY d.completed_at DESC`
      );

      if (isFullAccessUser(actorUser)) {
        return rows;
      }

      if (isManagerUser(actorUser)) {
        const people = await fetchPeopleRows(pool);
        const visiblePersonIds = new Set([
          actorUser.person.id,
          ...getTeamPeople(people, actorUser.person.id).map((item) => item.id)
        ]);
        return rows.filter((item) => visiblePersonIds.has(item.personId));
      }

      return rows.filter((item) => item.personId === actorUser.person.id);
    },
    async createDevelopmentRecord(payload, actorUser) {
      const people = await fetchPeopleRows(pool);
      assertCanCreateDevelopmentRecord(actorUser, people, payload.personId);

      const record = { id: createId("development"), ...payload };
      await pool.query(
        `INSERT INTO development_records
         (id, person_id, record_type, title, provider_name, completed_at, skill_signal, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.personId,
          record.recordType,
          record.title,
          record.providerName,
          record.completedAt,
          record.skillSignal,
          record.notes
        ]
      );
      return record;
    },
    async getDashboardOverview(actorUser, options = {}) {
      const timeGrouping = options.timeGrouping || "semester";
      const [people, cycles, responses, assignmentRows, applauseRows, developmentRows] = await Promise.all([
        fetchPeopleRows(pool),
        pool
          .query(
            `SELECT id, title, semester_label AS semesterLabel, due_date AS dueDate
             FROM evaluation_cycles`
          )
          .then(([rows]) => rows),
        fetchMysqlResponses(pool).then((items) => [...items, ...anonymousResponseState.responses]),
        pool
          .query(
            `SELECT cycle_id AS cycleId, relationship_type AS relationshipType,
                    reviewer_user_id AS reviewerUserId,
                    reviewee_person_id AS revieweePersonId, status
             FROM evaluation_assignments`
          )
          .then(([rows]) => rows),
        pool
          .query(
            `SELECT sender_person_id AS senderPersonId, receiver_person_id AS receiverPersonId
             FROM applause_entries`
          )
          .then(([rows]) => rows),
        pool
          .query(
            `SELECT d.person_id AS personId, d.record_type AS recordType
             FROM development_records d`
          )
          .then(([rows]) => rows)
      ]);

      const availableAreas = [...new Set(people.map((person) => person.area))].sort();

      if (isFullAccessUser(actorUser)) {
        const scopedPeople = options.area
          ? people.filter((person) => person.area === options.area)
          : people;
        const scopedPersonIds = new Set(scopedPeople.map((person) => person.id));
        const scopedAssignments = assignmentRows.filter((item) =>
          scopedPersonIds.has(item.revieweePersonId)
        );
        const scopedCycleIds = new Set(scopedAssignments.map((item) => item.cycleId));

        return buildDashboardPayload({
          mode: "executive",
          notice: options.area
            ? `Leitura consolidada filtrada para a area ${options.area}.`
            : "Leitura consolidada para RH, compliance e lideranca.",
          scopeLabel: options.area ? `Area: ${options.area}` : "Consolidado organizacional",
          cycles: cycles.filter((cycle) => scopedCycleIds.has(cycle.id)),
          people: scopedPeople,
          assignments: scopedAssignments,
          applauseEntries: applauseRows.filter((item) =>
            scopedPersonIds.has(item.receiverPersonId)
          ),
          developmentRecords: developmentRows.filter((item) =>
            scopedPersonIds.has(item.personId)
          ),
          responses: responses.filter((item) => scopedPersonIds.has(item.revieweePersonId)),
          availableAreas,
          selectedArea: options.area,
          timeGrouping,
          evaluationHighlights: [
            "Leitura consolidada pronta para ritos executivos e comites.",
            "Filtro por area ajuda a comparar recortes sem expor detalhes indevidos.",
            "KPIs, donuts e mix de avaliacoes se ajustam ao escopo aplicado."
          ]
        });
      }

      if (isManagerUser(actorUser)) {
        const scopedPeople = people.filter(
          (person) => person.id === actorUser.person.id || person.managerPersonId === actorUser.person.id
        );
        const visiblePersonIds = new Set(scopedPeople.map((item) => item.id));
        const scopedAssignments = assignmentRows.filter(
          (item) =>
            item.reviewerUserId === actorUser.id || visiblePersonIds.has(item.revieweePersonId)
        );
        const scopedCycleIds = new Set(scopedAssignments.map((item) => item.cycleId));

        return buildDashboardPayload({
          mode: "team",
          notice: "Leitura da sua equipe direta, sem exposicao de outras areas.",
          scopeLabel: "Equipe direta",
          cycles: cycles.filter((cycle) => scopedCycleIds.has(cycle.id)),
          people: scopedPeople,
          assignments: scopedAssignments,
          applauseEntries: applauseRows.filter((item) =>
            visiblePersonIds.has(item.receiverPersonId)
          ),
          developmentRecords: developmentRows.filter((item) =>
            visiblePersonIds.has(item.personId)
          ),
          responses: responses.filter((item) => visiblePersonIds.has(item.revieweePersonId)),
          timeGrouping,
          evaluationHighlights: [
            "Voce acompanha somente sua equipe direta.",
            "Respostas confidenciais continuam agregadas quando aplicavel.",
            "O dashboard gerencial reforca entregas, cobertura e desenvolvimento do time."
          ]
        });
      }

      const myAssignments = assignmentRows.filter((item) => item.reviewerUserId === actorUser.id);
      const myCycleIds = new Set(myAssignments.map((item) => item.cycleId));

      return buildDashboardPayload({
        mode: "personal",
        notice: "Voce esta vendo apenas seu recorte individual.",
        scopeLabel: "Visao pessoal",
        cycles: cycles.filter((cycle) => myCycleIds.has(cycle.id)),
        people: people.filter((person) => person.id === actorUser.person.id),
        assignments: myAssignments,
        applauseEntries: applauseRows.filter((item) => item.receiverPersonId === actorUser.person.id),
        developmentRecords: developmentRows.filter((item) => item.personId === actorUser.person.id),
        responses: responses.filter((item) => item.reviewerUserId === actorUser.id),
        timeGrouping,
        evaluationHighlights: [
          "Seu dashboard mostra apenas dados pessoais e agregados permitidos.",
          "Respostas confidenciais de lideranca e empresa entram somente em leitura agregada.",
          "A trilha de desenvolvimento e o ciclo aparecem no mesmo contexto operacional."
        ]
      });
    }
  };
}

export async function createStore() {
  const customLibraryState = await loadCustomLibraryState();
  const anonymousResponseState = await loadAnonymousResponseState();

  if (env.storageMode !== "mysql") {
    return buildMemoryStore(customLibraryState, anonymousResponseState);
  }

  const pool = mysql.createPool({
    host: env.mysql.host,
    port: env.mysql.port,
    user: env.mysql.user,
    password: env.mysql.password,
    database: env.mysql.database,
    waitForConnections: true,
    connectionLimit: 10
  });

  return buildMysqlStore(pool, customLibraryState, anonymousResponseState);
}
