function buildDashboardTeamOptions(people, selectedArea = null) {
  const areaPeople = selectedArea
    ? people.filter((person) => person.area === selectedArea)
    : people;
  const managersById = new Map(people.map((person) => [person.id, person]));
  const teams = new Map();

  for (const person of areaPeople) {
    if (!person.managerPersonId) continue;
    const manager = managersById.get(person.managerPersonId);
    if (!manager) continue;
    const entry = teams.get(manager.id) || {
      managerPersonId: manager.id,
      label: `Equipe de ${manager.name}`,
      area: manager.area || person.area || "Sem area",
      peopleCount: 1
    };
    entry.peopleCount += 1;
    teams.set(manager.id, entry);
  }

  return [...teams.values()].sort((left, right) => left.label.localeCompare(right.label, "pt-BR"));
}

export function createMemoryDashboardStore({
  db,
  anonymousResponseState,
  enrichSubmission,
  isOrgWideUser,
  isManagerUser,
  isAdminUser,
  getTeamPeople,
  buildDashboardPayload
}) {
  return {
    async getDashboardOverview(actorUser, options = {}) {
      const allResponses = [
        ...db.submissions.map((item) => enrichSubmission(db, item)),
        ...anonymousResponseState.responses
      ];
      const availableAreas = [...new Set(db.people.map((person) => person.area))].sort();
      const timeGrouping = options.timeGrouping || "semester";

      if (isOrgWideUser(actorUser)) {
        const areaScopedPeople = options.area
          ? db.people.filter((person) => person.area === options.area)
          : db.people;
        const scopedPeople = options.teamManagerId
          ? areaScopedPeople.filter(
              (person) =>
                person.id === options.teamManagerId || person.managerPersonId === options.teamManagerId
            )
          : areaScopedPeople;
        const scopedPersonIds = new Set(scopedPeople.map((person) => person.id));
        const scopedAssignments = db.assignments.filter((item) =>
          scopedPersonIds.has(item.revieweePersonId)
        );
        const scopedCycleIds = new Set(scopedAssignments.map((item) => item.cycleId));
        const selectedTeam = buildDashboardTeamOptions(db.people, options.area).find(
          (team) => team.managerPersonId === options.teamManagerId
        );
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
          notice: selectedTeam
            ? `Leitura consolidada filtrada para ${selectedTeam.label}.`
            : options.area
            ? `Leitura consolidada filtrada para a area ${options.area}.`
            : "Leitura consolidada para RH, compliance e lideranca.",
          scopeLabel: selectedTeam
            ? selectedTeam.label
            : options.area
              ? `Area: ${options.area}`
              : "Consolidado organizacional",
          cycles: scopedCycles,
          people: scopedPeople,
          assignments: scopedAssignments,
          applauseEntries: scopedApplause,
          developmentRecords: scopedDevelopment,
          developmentPlans: (db.developmentPlans || []).filter((item) =>
            scopedPersonIds.has(item.personId)
          ),
          developmentProgressEvents: (db.developmentPlanProgressEvents || []).filter((item) =>
            scopedPersonIds.has(item.personId)
          ),
          competencies: db.competencies || [],
          incidents: db.incidents || [],
          learningEvents: db.learningIntegrationEvents || [],
          responses: scopedResponses,
          availableAreas,
          selectedArea: options.area,
          teamOptions: buildDashboardTeamOptions(db.people, options.area),
          selectedTeamManagerId: options.teamManagerId,
          timeGrouping,
          performanceActorUser: isAdminUser(actorUser) ? actorUser : null,
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
        const teamIncidents = (db.incidents || []).filter((item) =>
          visiblePersonIds.has(item.assignedPersonId)
        );
        const teamAssignments = db.assignments.filter((item) =>
          visiblePersonIds.has(item.revieweePersonId)
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
          developmentPlans: (db.developmentPlans || []).filter((item) =>
            visiblePersonIds.has(item.personId)
          ),
          developmentProgressEvents: (db.developmentPlanProgressEvents || []).filter((item) =>
            visiblePersonIds.has(item.personId)
          ),
          competencies: db.competencies || [],
          incidents: teamIncidents,
          learningEvents: [],
          responses: teamResponses,
          timeGrouping,
          performanceActorUser: actorUser,
          evaluationHighlights: [
            "Voce acompanha somente sua equipe direta.",
            "Respostas confidenciais continuam agregadas quando aplicavel.",
            "O dashboard gerencial reforca entregas, cobertura e desenvolvimento do time."
          ]
        });
      }

      const myAssignments = db.assignments.filter((item) => item.reviewerUserId === actorUser.id);
      const myCycleIds = new Set(myAssignments.map((item) => item.cycleId));
      const personalResponses = allResponses.filter(
        (response) => response.reviewerUserId === actorUser.id
      );
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
        developmentPlans: (db.developmentPlans || []).filter(
          (item) => item.personId === actorUser.person.id
        ),
        developmentProgressEvents: (db.developmentPlanProgressEvents || []).filter(
          (item) => item.personId === actorUser.person.id
        ),
        competencies: db.competencies || [],
        incidents: [],
        learningEvents: [],
        responses: personalResponses,
        timeGrouping,
        performanceActorUser: null,
        evaluationHighlights: [
          "Seu dashboard mostra apenas dados pessoais e agregados permitidos.",
          "Respostas confidenciais de lideranca e empresa entram somente em leitura agregada.",
          "A trilha de desenvolvimento e o ciclo aparecem no mesmo contexto operacional."
        ]
      });
    }
  };
}

export function createMysqlDashboardStore({
  pool,
  customLibraryState,
  anonymousResponseState,
  supportsFeedbackAcknowledgement,
  supportsIndividualQuestionnaires,
  supportsLearningIntegrations,
  supportsProgressHistory,
  fetchPeopleRows,
  fetchCompetencyRows,
  fetchMysqlResponses,
  isFullAccessUser,
  isManagerUser,
  isAdminUser,
  buildDashboardPayload
}) {
  return {
    async getDashboardOverview(actorUser, options = {}) {
      const timeGrouping = options.timeGrouping || "semester";
      const [
        people,
        cycles,
        responses,
        assignmentRows,
        applauseRows,
        developmentRows,
        developmentPlanRows,
        incidentRows,
        learningRows,
        developmentProgressRows,
        competencies
      ] =
        await Promise.all([
          fetchPeopleRows(pool),
          pool
            .query(
              `SELECT id, title, semester_label AS semesterLabel, status, due_date AS dueDate
               FROM evaluation_cycles`
            )
            .then(([rows]) => rows),
          fetchMysqlResponses(pool, customLibraryState.published, {
            supportsFeedbackAcknowledgement,
            supportsIndividualQuestionnaires
          }).then((items) => [...items, ...anonymousResponseState.responses]),
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
            .then(([rows]) => rows),
          pool
            .query(
              `SELECT plan.id, plan.person_id AS personId, plan.cycle_id AS cycleId,
                      plan.competency_id AS competencyId, competency.name AS competencyName,
                      plan.due_date AS dueDate, plan.status,
                      plan.progress_status AS progressStatus,
                      plan.created_at AS createdAt, plan.archived_at AS archivedAt,
                      plan.progress_updated_at AS progressUpdatedAt
               FROM development_plans plan
               LEFT JOIN competencies competency ON competency.id = plan.competency_id`
            )
            .then(([rows]) => rows),
          pool
            .query(
              `SELECT status, assigned_person_id AS assignedPersonId, assigned_to AS assignedTo,
                      due_at AS dueAt
               FROM incident_reports`
            )
            .then(([rows]) => rows),
          supportsLearningIntegrations
            ? pool
                .query(
                  `SELECT processing_status AS processingStatus
                   FROM learning_integration_events`
                )
                .then(([rows]) => rows)
            : Promise.resolve([]),
          supportsProgressHistory
            ? pool
                .query(
                  `SELECT plan_id AS planId, person_id AS personId,
                          previous_status AS previousStatus, progress_status AS progressStatus,
                          occurred_at AS occurredAt
                   FROM development_plan_progress_events
                   ORDER BY occurred_at ASC`
                )
                .then(([rows]) => rows)
            : Promise.resolve([]),
          fetchCompetencyRows(pool)
        ]);

      const availableAreas = [...new Set(people.map((person) => person.area))].sort();

      if (isFullAccessUser(actorUser)) {
        const areaScopedPeople = options.area
          ? people.filter((person) => person.area === options.area)
          : people;
        const scopedPeople = options.teamManagerId
          ? areaScopedPeople.filter(
              (person) =>
                person.id === options.teamManagerId || person.managerPersonId === options.teamManagerId
            )
          : areaScopedPeople;
        const scopedPersonIds = new Set(scopedPeople.map((person) => person.id));
        const scopedAssignments = assignmentRows.filter((item) =>
          scopedPersonIds.has(item.revieweePersonId)
        );
        const scopedCycleIds = new Set(scopedAssignments.map((item) => item.cycleId));
        const selectedTeam = buildDashboardTeamOptions(people, options.area).find(
          (team) => team.managerPersonId === options.teamManagerId
        );

        return buildDashboardPayload({
          mode: "executive",
          notice: selectedTeam
            ? `Leitura consolidada filtrada para ${selectedTeam.label}.`
            : options.area
            ? `Leitura consolidada filtrada para a area ${options.area}.`
            : "Leitura consolidada para RH, compliance e lideranca.",
          scopeLabel: selectedTeam
            ? selectedTeam.label
            : options.area
              ? `Area: ${options.area}`
              : "Consolidado organizacional",
          cycles: cycles.filter((cycle) => scopedCycleIds.has(cycle.id)),
          people: scopedPeople,
          assignments: scopedAssignments,
          applauseEntries: applauseRows.filter((item) =>
            scopedPersonIds.has(item.receiverPersonId)
          ),
          developmentRecords: developmentRows.filter((item) =>
            scopedPersonIds.has(item.personId)
          ),
          developmentPlans: developmentPlanRows.filter((item) =>
            scopedPersonIds.has(item.personId)
          ),
          developmentProgressEvents: developmentProgressRows.filter((item) =>
            scopedPersonIds.has(item.personId)
          ),
          competencies,
          incidents: incidentRows,
          learningEvents: learningRows,
          responses: responses.filter((item) => scopedPersonIds.has(item.revieweePersonId)),
          availableAreas,
          selectedArea: options.area,
          teamOptions: buildDashboardTeamOptions(people, options.area),
          selectedTeamManagerId: options.teamManagerId,
          timeGrouping,
          performanceActorUser: isAdminUser(actorUser) ? actorUser : null,
          evaluationHighlights: [
            "Leitura consolidada pronta para ritos executivos e comites.",
            "Filtro por area ajuda a comparar recortes sem expor detalhes indevidos.",
            "KPIs, donuts e mix de avaliacoes se ajustam ao escopo aplicado."
          ]
        });
      }

      if (isManagerUser(actorUser)) {
        const scopedPeople = people.filter(
          (person) =>
            person.id === actorUser.person.id || person.managerPersonId === actorUser.person.id
        );
        const visiblePersonIds = new Set(scopedPeople.map((item) => item.id));
        const scopedIncidents = incidentRows.filter((item) =>
          visiblePersonIds.has(item.assignedPersonId)
        );
        const scopedAssignments = assignmentRows.filter((item) =>
          visiblePersonIds.has(item.revieweePersonId)
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
          developmentPlans: developmentPlanRows.filter((item) =>
            visiblePersonIds.has(item.personId)
          ),
          developmentProgressEvents: developmentProgressRows.filter((item) =>
            visiblePersonIds.has(item.personId)
          ),
          competencies,
          incidents: scopedIncidents,
          learningEvents: [],
          responses: responses.filter((item) => visiblePersonIds.has(item.revieweePersonId)),
          timeGrouping,
          performanceActorUser: actorUser,
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
        developmentPlans: developmentPlanRows.filter((item) => item.personId === actorUser.person.id),
        developmentProgressEvents: developmentProgressRows.filter(
          (item) => item.personId === actorUser.person.id
        ),
        competencies,
        incidents: [],
        learningEvents: [],
        responses: responses.filter((item) => item.reviewerUserId === actorUser.id),
        timeGrouping,
        performanceActorUser: null,
        evaluationHighlights: [
          "Seu dashboard mostra apenas dados pessoais e agregados permitidos.",
          "Respostas confidenciais de lideranca e empresa entram somente em leitura agregada.",
          "A trilha de desenvolvimento e o ciclo aparecem no mesmo contexto operacional."
        ]
      });
    }
  };
}
