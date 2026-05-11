import { MIN_ANONYMOUS_AGGREGATE_RESPONSES } from "./storeConstants.js";

function calculatePercentage(part, total) {
  if (!total) {
    return 0;
  }

  return Math.round((Number(part) / Number(total)) * 100);
}

function average(values) {
  const normalized = values.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  if (!normalized.length) {
    return null;
  }
  return Number((normalized.reduce((total, value) => total + value, 0) / normalized.length).toFixed(2));
}

function isAnonymousRelationship(relationshipType) {
  return ["leader", "company", "client-internal", "client-external"].includes(relationshipType);
}

function getPersonById(people, personId) {
  return people.find((person) => person.id === personId) || null;
}

function buildManagerPath(people, person) {
  const path = [];
  let current = person;
  const visited = new Set();

  while (current?.managerPersonId && !visited.has(current.managerPersonId)) {
    visited.add(current.managerPersonId);
    path.push(current.managerPersonId);
    current = getPersonById(people, current.managerPersonId);
  }

  return path;
}

function buildViewerPermissions({ users, people }) {
  const activeUsers = users.filter((user) => user.status === "active");
  const fullAccessUsers = activeUsers.filter((user) => ["admin", "hr"].includes(user.roleKey));
  const managerUsers = activeUsers.filter((user) => user.roleKey === "manager");
  const permissions = [];

  for (const user of fullAccessUsers) {
    permissions.push({
      viewerEmail: user.email,
      viewerUserId: user.id,
      viewerRole: user.roleKey,
      allowedPersonId: "*",
      scope: "organization"
    });
  }

  for (const user of managerUsers) {
    const managedPeople = people.filter((person) => buildManagerPath(people, person).includes(user.personId));
    permissions.push({
      viewerEmail: user.email,
      viewerUserId: user.id,
      viewerRole: user.roleKey,
      allowedPersonId: user.personId,
      scope: "self"
    });
    for (const person of managedPeople) {
      permissions.push({
        viewerEmail: user.email,
        viewerUserId: user.id,
        viewerRole: user.roleKey,
        allowedPersonId: person.id,
        scope: "team"
      });
    }
  }

  return permissions;
}

function buildDimensionPeople({ users, people }) {
  return people.map((person) => {
    return {
      personId: person.id,
      area: person.area || "Sem area",
      workUnit: person.workUnit || "Unidade principal",
      workMode: person.workMode || "hybrid",
      managerPersonId: person.managerPersonId || null,
      employmentType: person.employmentType || "internal"
    };
  });
}

function buildAnalyticsRows({ cycles, assignments, responses, people, users }) {
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const usersById = new Map(users.map((user) => [user.id, user]));
  const cyclesById = new Map(cycles.map((cycle) => [cycle.id, cycle]));
  const assignmentGroups = new Map();

  for (const assignment of assignments) {
    const reviewee = peopleById.get(assignment.revieweePersonId);
    const reviewer = usersById.get(assignment.reviewerUserId);
    const reviewerPerson = reviewer ? peopleById.get(reviewer.personId) : null;
    const cycle = cyclesById.get(assignment.cycleId);
    const area = assignment.relationshipType === "company"
      ? reviewerPerson?.area || reviewee?.area || "Institucional"
      : reviewee?.area || "Sem area";
    const managerPersonId =
      assignment.relationshipType === "company"
        ? reviewerPerson?.managerPersonId || reviewee?.managerPersonId || null
        : reviewee?.managerPersonId || null;
    const key = [
      assignment.cycleId,
      assignment.relationshipType,
      area,
      managerPersonId || "none"
    ].join("|");
    const group = assignmentGroups.get(key) || {
      cycleId: assignment.cycleId,
      cycleTitle: cycle?.title || "",
      semesterLabel: cycle?.semesterLabel || "",
      dueDate: cycle?.dueDate || "",
      relationshipType: assignment.relationshipType,
      area,
      managerPersonId,
      totalAssignments: 0,
      submittedAssignments: 0,
      pendingAssignments: 0,
      delinquentAssignments: 0
    };

    group.totalAssignments += 1;
    if (assignment.status === "submitted") {
      group.submittedAssignments += 1;
    }
    if (assignment.status === "pending") {
      group.pendingAssignments += 1;
    }
    if (assignment.isDelinquent) {
      group.delinquentAssignments += 1;
    }
    assignmentGroups.set(key, group);
  }

  const responseGroups = new Map();
  for (const response of responses) {
    const reviewee = peopleById.get(response.revieweePersonId);
    const reviewer = usersById.get(response.reviewerUserId);
    const reviewerPerson = reviewer ? peopleById.get(reviewer.personId) : null;
    const cycle = cyclesById.get(response.cycleId);
    const area = response.relationshipType === "company"
      ? response.respondentArea || reviewerPerson?.area || reviewee?.area || "Institucional"
      : response.revieweeArea || reviewee?.area || "Sem area";
    const managerPersonId =
      response.relationshipType === "company"
        ? reviewerPerson?.managerPersonId || reviewee?.managerPersonId || null
        : response.revieweeManagerPersonId || reviewee?.managerPersonId || null;
    const key = [
      response.cycleId,
      response.relationshipType,
      area,
      managerPersonId || "none"
    ].join("|");
    const group = responseGroups.get(key) || {
      cycleId: response.cycleId,
      cycleTitle: cycle?.title || "",
      semesterLabel: cycle?.semesterLabel || "",
      dueDate: cycle?.dueDate || "",
      relationshipType: response.relationshipType,
      area,
      managerPersonId,
      totalResponses: 0,
      scores: []
    };

    group.totalResponses += 1;
    if (Number.isFinite(Number(response.overallScore))) {
      group.scores.push(Number(response.overallScore));
    }
    responseGroups.set(key, group);
  }

  const keys = new Set([...assignmentGroups.keys(), ...responseGroups.keys()]);
  return [...keys]
    .map((key) => {
      const assignmentGroup = assignmentGroups.get(key) || {};
      const responseGroup = responseGroups.get(key) || {};
      const relationshipType = assignmentGroup.relationshipType || responseGroup.relationshipType;
      const totalResponses = responseGroup.totalResponses || 0;
      const suppressAnonymous =
        isAnonymousRelationship(relationshipType) &&
        totalResponses > 0 &&
        totalResponses < MIN_ANONYMOUS_AGGREGATE_RESPONSES;
      const totalAssignments = assignmentGroup.totalAssignments || 0;
      const averageScore = suppressAnonymous ? null : average(responseGroup.scores || []);

      return {
        cycleId: assignmentGroup.cycleId || responseGroup.cycleId || "",
        cycleTitle: assignmentGroup.cycleTitle || responseGroup.cycleTitle || "",
        semesterLabel: assignmentGroup.semesterLabel || responseGroup.semesterLabel || "",
        dueDate: assignmentGroup.dueDate || responseGroup.dueDate || "",
        relationshipType,
        area: assignmentGroup.area || responseGroup.area || "Sem area",
        managerPersonId: assignmentGroup.managerPersonId || responseGroup.managerPersonId || null,
        totalAssignments,
        submittedAssignments: assignmentGroup.submittedAssignments || 0,
        pendingAssignments: assignmentGroup.pendingAssignments || 0,
        delinquentAssignments: assignmentGroup.delinquentAssignments || 0,
        totalResponses: suppressAnonymous ? 0 : totalResponses,
        adherencePercentage: calculatePercentage(
          suppressAnonymous ? 0 : totalResponses,
          totalAssignments || totalResponses
        ),
        averageScore,
        averageScoreLabel: averageScore === null ? "" : averageScore.toFixed(1),
        isSuppressed: suppressAnonymous,
        suppressionReason: suppressAnonymous
          ? `Minimo de ${MIN_ANONYMOUS_AGGREGATE_RESPONSES} respostas para relacoes anonimas.`
          : ""
      };
    })
    .sort((left, right) =>
      `${left.cycleId}:${left.area}:${left.relationshipType}`.localeCompare(
        `${right.cycleId}:${right.area}:${right.relationshipType}`,
        "pt-BR"
      )
    );
}

function buildQuestionRows({ cycles, responses, people, users }) {
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const usersById = new Map(users.map((user) => [user.id, user]));
  const cyclesById = new Map(cycles.map((cycle) => [cycle.id, cycle]));
  const groups = new Map();

  for (const response of responses) {
    const reviewee = peopleById.get(response.revieweePersonId);
    const reviewer = usersById.get(response.reviewerUserId);
    const reviewerPerson = reviewer ? peopleById.get(reviewer.personId) : null;
    const cycle = cyclesById.get(response.cycleId);
    const area = response.relationshipType === "company"
      ? response.respondentArea || reviewerPerson?.area || reviewee?.area || "Institucional"
      : response.revieweeArea || reviewee?.area || "Sem area";
    const managerPersonId =
      response.relationshipType === "company"
        ? reviewerPerson?.managerPersonId || reviewee?.managerPersonId || null
        : response.revieweeManagerPersonId || reviewee?.managerPersonId || null;

    for (const answer of response.answers || []) {
      if (!Number.isFinite(Number(answer.score))) {
        continue;
      }
      const key = [
        response.cycleId,
        response.relationshipType,
        area,
        managerPersonId || "none",
        answer.questionId
      ].join("|");
      const group = groups.get(key) || {
        cycleId: response.cycleId,
        cycleTitle: cycle?.title || "",
        semesterLabel: cycle?.semesterLabel || "",
        relationshipType: response.relationshipType,
        area,
        managerPersonId,
        questionId: answer.questionId,
        dimensionTitle: answer.dimensionTitle || "",
        totalAnswers: 0,
        scores: []
      };
      group.totalAnswers += 1;
      group.scores.push(Number(answer.score));
      groups.set(key, group);
    }
  }

  return [...groups.values()]
    .filter(
      (group) =>
        !isAnonymousRelationship(group.relationshipType) ||
        group.totalAnswers >= MIN_ANONYMOUS_AGGREGATE_RESPONSES
    )
    .map((group) => {
      const averageScore = average(group.scores);
      return {
        cycleId: group.cycleId,
        cycleTitle: group.cycleTitle,
        semesterLabel: group.semesterLabel,
        relationshipType: group.relationshipType,
        area: group.area,
        managerPersonId: group.managerPersonId,
        questionId: group.questionId,
        dimensionTitle: group.dimensionTitle,
        totalAnswers: group.totalAnswers,
        averageScore,
        averageScoreLabel: averageScore === null ? "" : averageScore.toFixed(1)
      };
    });
}

function buildPowerBiDataset({ users, people, cycles, assignments, responses }) {
  return {
    generatedAt: new Date().toISOString(),
    privacy: {
      containsRawComments: false,
      containsIndividualAnswers: false,
      anonymousMinimumResponses: MIN_ANONYMOUS_AGGREGATE_RESPONSES
    },
    dimensions: {
      people: buildDimensionPeople({ users, people }),
      cycles: cycles.map((cycle) => ({
        cycleId: cycle.id,
        cycleTitle: cycle.title,
        semesterLabel: cycle.semesterLabel,
        status: cycle.status,
        dueDate: cycle.dueDate,
        targetGroup: cycle.targetGroup || "",
        libraryId: cycle.libraryId || "",
        libraryName: cycle.libraryName || cycle.modelName || ""
      }))
    },
    facts: {
      evaluationResults: buildAnalyticsRows({ cycles, assignments, responses, people, users }),
      questionResults: buildQuestionRows({ cycles, responses, people, users })
    },
    security: {
      rlsViewers: buildViewerPermissions({ users, people })
    }
  };
}

export function createMemoryAnalyticsStore({
  db,
  anonymousResponseState,
  enrichSubmission,
  isAssignmentDelinquent
}) {
  return {
    async getPowerBiEvaluationDataset() {
      const cycles = db.cycles.map((cycle) => ({ ...cycle }));
      const assignments = db.assignments.map((assignment) => {
        const cycle = cycles.find((item) => item.id === assignment.cycleId);
        return {
          ...assignment,
          isDelinquent: isAssignmentDelinquent(assignment, cycle?.status)
        };
      });
      const responses = [
        ...db.submissions.map((item) => enrichSubmission(db, item)),
        ...anonymousResponseState.responses
      ];

      return buildPowerBiDataset({
        users: db.users,
        people: db.people,
        cycles,
        assignments,
        responses
      });
    }
  };
}

export function createMysqlAnalyticsStore({
  pool,
  customLibraryState,
  anonymousResponseState,
  supportsAssignmentReminder,
  supportsFeedbackAcknowledgement,
  supportsIndividualQuestionnaires,
  fetchPeopleRows,
  fetchUserRows,
  fetchMysqlResponses,
  isAssignmentDelinquent
}) {
  return {
    async getPowerBiEvaluationDataset() {
      const [users, people, cycles, assignments, responses] = await Promise.all([
        fetchUserRows(pool),
        fetchPeopleRows(pool),
        pool
          .query(
            `SELECT id, title, semester_label AS semesterLabel, status, due_date AS dueDate,
                    target_group AS targetGroup, library_id AS libraryId, library_name AS libraryName
             FROM evaluation_cycles`
          )
          .then(([rows]) => rows),
        pool
          .query(
            `SELECT a.id, a.cycle_id AS cycleId, a.reviewer_user_id AS reviewerUserId,
                    a.reviewee_person_id AS revieweePersonId, a.relationship_type AS relationshipType,
                    a.status, a.due_date AS dueDate,
                    ${
                      supportsAssignmentReminder
                        ? "a.reminder_count"
                        : "0"
                    } AS reminderCount,
                    ${
                      supportsAssignmentReminder
                        ? "a.last_reminder_sent_at"
                        : "NULL"
                    } AS lastReminderSentAt,
                    c.status AS cycleStatus
             FROM evaluation_assignments a
             JOIN evaluation_cycles c ON c.id = a.cycle_id`
          )
          .then(([rows]) => rows),
        fetchMysqlResponses(pool, customLibraryState.published, {
          supportsFeedbackAcknowledgement,
          supportsIndividualQuestionnaires
        }).then((items) => [...items, ...anonymousResponseState.responses])
      ]);

      const enrichedAssignments = assignments.map((assignment) => ({
        ...assignment,
        isDelinquent: isAssignmentDelinquent(assignment, assignment.cycleStatus)
      }));

      return buildPowerBiDataset({
        users,
        people,
        cycles,
        assignments: enrichedAssignments,
        responses
      });
    }
  };
}
