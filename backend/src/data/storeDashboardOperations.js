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

function parseDashboardDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDashboardDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dashboardPercentage(value, total) {
  if (!total) return 0;
  return Math.round((Number(value || 0) / Number(total || 0)) * 100);
}

function getComplianceBand(percentage) {
  if (percentage >= 95) return { key: "excellent", label: "Excelente", tone: "positive" };
  if (percentage >= 80) return { key: "good", label: "Bom", tone: "positive" };
  if (percentage >= 50) return { key: "medium", label: "Medio", tone: "warning" };
  if (percentage >= 30) return { key: "low", label: "Baixo", tone: "warning" };
  return { key: "critical", label: "Critico", tone: "critical" };
}

function attachApprovedDevelopmentPlanExtensions(developmentPlans = [], extensions = []) {
  const approvedExtensionsByPlanId = new Map();
  for (const extension of extensions) {
    if (extension.status !== "approved" || !extension.requestedDueDate) continue;
    const current = approvedExtensionsByPlanId.get(extension.planId);
    if (!current || String(extension.decidedAt || extension.requestedAt).localeCompare(String(current.decidedAt || current.requestedAt)) > 0) {
      approvedExtensionsByPlanId.set(extension.planId, extension);
    }
  }

  return developmentPlans.map((plan) => ({
    ...plan,
    approvedExtensionDueDate: approvedExtensionsByPlanId.get(plan.id)?.requestedDueDate || null
  }));
}

function buildCompliancePeriodKey(dateValue, timeGrouping = "semester") {
  const date = parseDashboardDate(dateValue) || new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  if (timeGrouping === "year") return { key: String(year), label: String(year) };
  if (timeGrouping === "quarter") {
    const quarter = Math.floor(month / 3) + 1;
    return { key: `${year}-Q${quarter}`, label: `${quarter}T ${year}` };
  }
  if (timeGrouping === "cycle") return { key: `${year}-${month + 1}`, label: `${String(month + 1).padStart(2, "0")}/${year}` };
  return {
    key: `${year}-S${month < 6 ? 1 : 2}`,
    label: `${month < 6 ? 1 : 2}S ${year}`
  };
}

function buildComplianceDashboardPayload({
  mode,
  notice,
  scopeLabel,
  people,
  assignments = [],
  cycles = [],
  developmentPlans = [],
  incidents = [],
  availableAreas = [],
  selectedArea = null,
  teamOptions = [],
  selectedTeamManagerId = null,
  timeGrouping = "semester"
}) {
  const today = startOfDashboardDay();
  const peopleById = new Map((people || []).map((person) => [person.id, person]));
  const cycleById = new Map((cycles || []).map((cycle) => [cycle.id, cycle]));
  const issueMap = new Map();
  const addIssue = (personId, issue) => {
    if (!personId || !peopleById.has(personId)) return;
    const person = peopleById.get(personId);
    const current = issueMap.get(personId) || [];
    current.push({
      ...issue,
      personId,
      personName: person.name || "",
      currentArea: person.area || "Sem area",
      originArea: issue.originArea || person.area || "Sem area"
    });
    issueMap.set(personId, current);
  };

  for (const assignment of assignments) {
    const cycle = cycleById.get(assignment.cycleId) || {};
    const graceDate = assignment.complianceGraceDueDate || cycle.complianceGraceDueDate;
    const due = parseDashboardDate(graceDate);
    if (!due || assignment.status !== "pending") continue;
    due.setHours(0, 0, 0, 0);
    if (due.getTime() >= today.getTime()) continue;
    addIssue(assignment.reviewerPersonId, {
      type: "evaluation_response",
      label: "Resposta de avaliacao em atraso",
      sourceId: assignment.id || `${assignment.cycleId}:${assignment.reviewerUserId}`,
      originArea: assignment.reviewerArea,
      occurredAt: graceDate,
      daysOpen: Math.max(1, Math.floor((today.getTime() - due.getTime()) / 86400000))
    });
  }

  for (const plan of developmentPlans) {
    if (!plan.isComplianceRequired || plan.status === "archived" || plan.progressStatus === "done") continue;
    const approvedExtension = parseDashboardDate(plan.approvedExtensionDueDate);
    const due = parseDashboardDate(approvedExtension || plan.dueDate);
    if (!due) continue;
    due.setHours(0, 0, 0, 0);
    if (due.getTime() >= today.getTime()) continue;
    addIssue(plan.personId, {
      type: "mandatory_pdi",
      label: "PDI obrigatorio em atraso",
      sourceId: plan.id,
      originArea: plan.originArea,
      occurredAt: approvedExtension || plan.dueDate,
      daysOpen: Math.max(1, Math.floor((today.getTime() - due.getTime()) / 86400000))
    });
  }

  for (const incident of incidents) {
    if (incident.findingStatus !== "substantiated" || !incident.subjectPersonId || incident.closedAt) continue;
    addIssue(incident.subjectPersonId, {
      type: "conduct",
      label: "Conduta inadequada procedente",
      sourceId: incident.id,
      originArea: incident.originArea || incident.responsibleArea,
      occurredAt: incident.findingDecidedAt || incident.createdAt,
      daysOpen: Math.max(0, Math.floor((today.getTime() - (parseDashboardDate(incident.findingDecidedAt || incident.createdAt) || today).getTime()) / 86400000))
    });
  }

  const eligiblePeople = (people || []).filter((person) => {
    if (!person?.id) return false;
    return assignments.some((assignment) => assignment.reviewerPersonId === person.id)
      || developmentPlans.some((plan) => plan.personId === person.id && plan.isComplianceRequired)
      || incidents.some((incident) => incident.subjectPersonId === person.id);
  });
  const eligibleIds = new Set(eligiblePeople.map((person) => person.id));
  const nonCompliantIds = new Set([...issueMap.keys()].filter((personId) => eligibleIds.has(personId)));
  const compliantPeopleCount = eligiblePeople.length - nonCompliantIds.size;
  const compliancePercentage = dashboardPercentage(compliantPeopleCount, eligiblePeople.length);
  const band = getComplianceBand(compliancePercentage);
  const issues = [...issueMap.values()].flat().filter((issue) => eligibleIds.has(issue.personId));
  const byCurrentAreaMap = new Map();
  const byOriginAreaMap = new Map();

  for (const person of eligiblePeople) {
    const area = person.area || "Sem area";
    const entry = byCurrentAreaMap.get(area) || { area, eligiblePeople: 0, compliantPeople: 0, nonCompliantPeople: 0, compliancePercentage: 0, band: getComplianceBand(0) };
    entry.eligiblePeople += 1;
    if (nonCompliantIds.has(person.id)) entry.nonCompliantPeople += 1;
    else entry.compliantPeople += 1;
    byCurrentAreaMap.set(area, entry);
  }
  for (const entry of byCurrentAreaMap.values()) {
    entry.compliancePercentage = dashboardPercentage(entry.compliantPeople, entry.eligiblePeople);
    entry.band = getComplianceBand(entry.compliancePercentage);
  }
  for (const issue of issues) {
    const area = issue.originArea || "Sem area";
    const entry = byOriginAreaMap.get(area) || { area, conduct: 0, evaluationResponse: 0, mandatoryPdi: 0, totalIssues: 0 };
    if (issue.type === "conduct") entry.conduct += 1;
    if (issue.type === "evaluation_response") entry.evaluationResponse += 1;
    if (issue.type === "mandatory_pdi") entry.mandatoryPdi += 1;
    entry.totalIssues += 1;
    byOriginAreaMap.set(area, entry);
  }

  const reasonCounts = [
    { key: "conduct", label: "Condutas procedentes", total: issues.filter((issue) => issue.type === "conduct").length },
    { key: "evaluation_response", label: "Avaliacoes em atraso", total: issues.filter((issue) => issue.type === "evaluation_response").length },
    { key: "mandatory_pdi", label: "PDIs obrigatorios atrasados", total: issues.filter((issue) => issue.type === "mandatory_pdi").length }
  ];
  const agingBuckets = [
    { key: "0_7", label: "0-7 dias", total: issues.filter((issue) => issue.daysOpen <= 7).length },
    { key: "8_30", label: "8-30 dias", total: issues.filter((issue) => issue.daysOpen > 7 && issue.daysOpen <= 30).length },
    { key: "31_60", label: "31-60 dias", total: issues.filter((issue) => issue.daysOpen > 30 && issue.daysOpen <= 60).length },
    { key: "60_plus", label: "60+ dias", total: issues.filter((issue) => issue.daysOpen > 60).length }
  ];
  const trendMap = new Map();
  for (const issue of issues) {
    const period = buildCompliancePeriodKey(issue.occurredAt, timeGrouping);
    const entry = trendMap.get(period.key) || { periodKey: period.key, label: period.label, totalIssues: 0 };
    entry.totalIssues += 1;
    trendMap.set(period.key, entry);
  }

  return {
    mode,
    notice,
    scopeLabel,
    selectedArea,
    selectedTeamManagerId,
    areaOptions: availableAreas,
    teamOptions,
    targetPercentage: 95,
    bands: [
      { key: "critical", label: "Critico", min: 0, max: 29 },
      { key: "low", label: "Baixo", min: 30, max: 49 },
      { key: "medium", label: "Medio", min: 50, max: 79 },
      { key: "good", label: "Bom", min: 80, max: 94 },
      { key: "excellent", label: "Excelente", min: 95, max: 100 }
    ],
    summary: {
      eligiblePeople: eligiblePeople.length,
      compliantPeople: compliantPeopleCount,
      nonCompliantPeople: nonCompliantIds.size,
      compliancePercentage,
      statusBand: band,
      totalIssues: issues.length
    },
    reasonCounts,
    agingBuckets,
    byCurrentArea: [...byCurrentAreaMap.values()].sort((left, right) => left.area.localeCompare(right.area, "pt-BR")),
    byOriginArea: [...byOriginAreaMap.values()].sort((left, right) => right.totalIssues - left.totalIssues),
    trend: [...trendMap.values()].sort((left, right) => left.periodKey.localeCompare(right.periodKey)),
    dataQuality: {
      evaluationGraceConfigured: assignments.some((assignment) => assignment.complianceGraceDueDate || cycleById.get(assignment.cycleId)?.complianceGraceDueDate),
      substantiatedIncidentSubjects: incidents.filter((incident) => incident.findingStatus === "substantiated" && incident.subjectPersonId).length,
      mandatoryPdiRecords: developmentPlans.filter((plan) => plan.isComplianceRequired).length,
      note: "Indicadores usam apenas controles elegiveis e dados estruturados disponiveis."
    }
  };
}

function buildApplauseDashboardPayload({
  mode,
  notice,
  scopeLabel,
  people,
  applauseEntries = [],
  availableAreas = [],
  selectedArea = null,
  teamOptions = [],
  selectedTeamManagerId = null,
  timeGrouping = "semester",
  category = null
}) {
  const scopedPeople = people || [];
  const scopedPersonIds = new Set(scopedPeople.map((person) => person.id));
  const peopleById = new Map(scopedPeople.map((person) => [person.id, person]));
  const approvedEntries = applauseEntries.filter(
    (entry) =>
      entry.status === "Validado" &&
      (scopedPersonIds.has(entry.senderPersonId) || scopedPersonIds.has(entry.receiverPersonId)) &&
      (!category || entry.category === category)
  );
  const allConsideredEntries = applauseEntries.filter(
    (entry) =>
      (scopedPersonIds.has(entry.senderPersonId) || scopedPersonIds.has(entry.receiverPersonId)) &&
      (!category || entry.category === category)
  );
  const senderIds = new Set(approvedEntries.filter((entry) => scopedPersonIds.has(entry.senderPersonId)).map((entry) => entry.senderPersonId));
  const receiverIds = new Set(approvedEntries.filter((entry) => scopedPersonIds.has(entry.receiverPersonId)).map((entry) => entry.receiverPersonId));
  const peopleCount = scopedPeople.length;
  const entriesByCategory = new Map();
  const trendMap = new Map();
  const sentByAreaMap = new Map();
  const receivedByAreaMap = new Map();
  const sentTotalsByPerson = new Map();
  const pairMap = new Map();
  let lastApplauseAt = null;

  const areaEntry = (map, area) => {
    const normalizedArea = area || "Sem area";
    const entry = map.get(normalizedArea) || {
      area: normalizedArea,
      totalSent: 0,
      totalReceived: 0,
      activeSenders: 0,
      activeReceivers: 0,
      senderParticipationPercentage: 0,
      receiverCoveragePercentage: 0,
      peopleCount: scopedPeople.filter((person) => (person.area || "Sem area") === normalizedArea).length
    };
    map.set(normalizedArea, entry);
    return entry;
  };

  const sendersByArea = new Map();
  const receiversByArea = new Map();

  for (const entry of approvedEntries) {
    const sender = peopleById.get(entry.senderPersonId);
    const receiver = peopleById.get(entry.receiverPersonId);
    const senderArea = sender?.area || "Sem area";
    const receiverArea = receiver?.area || "Sem area";
    if (scopedPersonIds.has(entry.senderPersonId)) {
      const sentAreaEntry = areaEntry(sentByAreaMap, senderArea);
      sentAreaEntry.totalSent += 1;
      const areaSenders = sendersByArea.get(senderArea) || new Set();
      areaSenders.add(entry.senderPersonId);
      sendersByArea.set(senderArea, areaSenders);
      sentTotalsByPerson.set(entry.senderPersonId, (sentTotalsByPerson.get(entry.senderPersonId) || 0) + 1);
    }
    if (scopedPersonIds.has(entry.receiverPersonId)) {
      const receivedAreaEntry = areaEntry(receivedByAreaMap, receiverArea);
      receivedAreaEntry.totalReceived += 1;
      const areaReceivers = receiversByArea.get(receiverArea) || new Set();
      areaReceivers.add(entry.receiverPersonId);
      receiversByArea.set(receiverArea, areaReceivers);
    }

    entriesByCategory.set(entry.category, (entriesByCategory.get(entry.category) || 0) + 1);
    const period = buildCompliancePeriodKey(entry.createdAt, timeGrouping);
    const trend = trendMap.get(period.key) || {
      periodKey: period.key,
      label: period.label,
      totalApplauses: 0,
      activeSenders: new Set(),
      activeReceivers: new Set()
    };
    trend.totalApplauses += 1;
    trend.activeSenders.add(entry.senderPersonId);
    trend.activeReceivers.add(entry.receiverPersonId);
    trendMap.set(period.key, trend);

    if (!lastApplauseAt || String(entry.createdAt).localeCompare(String(lastApplauseAt)) > 0) {
      lastApplauseAt = entry.createdAt;
    }

    if (!scopedPersonIds.has(entry.senderPersonId) || !scopedPersonIds.has(entry.receiverPersonId)) {
      continue;
    }
    const pairKey = [entry.senderPersonId, entry.receiverPersonId].sort().join("::");
    const pair = pairMap.get(pairKey) || {
      personAId: entry.senderPersonId,
      personBId: entry.receiverPersonId,
      aToB: 0,
      bToA: 0,
      lastApplauseAt: entry.createdAt
    };
    if (entry.senderPersonId === pair.personAId) pair.aToB += 1;
    else pair.bToA += 1;
    if (String(entry.createdAt).localeCompare(String(pair.lastApplauseAt || "")) > 0) {
      pair.lastApplauseAt = entry.createdAt;
    }
    pairMap.set(pairKey, pair);
  }

  for (const [area, entry] of sentByAreaMap.entries()) {
    entry.activeSenders = sendersByArea.get(area)?.size || 0;
    entry.senderParticipationPercentage = dashboardPercentage(entry.activeSenders, entry.peopleCount);
  }
  for (const [area, entry] of receivedByAreaMap.entries()) {
    entry.activeReceivers = receiversByArea.get(area)?.size || 0;
    entry.receiverCoveragePercentage = dashboardPercentage(entry.activeReceivers, entry.peopleCount);
  }

  const areaNames = [...new Set(scopedPeople.map((person) => person.area || "Sem area"))].sort((left, right) => left.localeCompare(right, "pt-BR"));
  const areaBalance = areaNames.map((area) => {
    const sent = sentByAreaMap.get(area)?.totalSent || 0;
    const received = receivedByAreaMap.get(area)?.totalReceived || 0;
    const peopleInArea = scopedPeople.filter((person) => (person.area || "Sem area") === area);
    return {
      area,
      sent,
      received,
      netBalance: received - sent,
      coveragePercentage: dashboardPercentage(receiversByArea.get(area)?.size || 0, peopleInArea.length)
    };
  });

  const unusualReciprocity = [...pairMap.values()]
    .map((pair) => {
      const personA = peopleById.get(pair.personAId);
      const personB = peopleById.get(pair.personBId);
      const concentration = Math.max(
        dashboardPercentage(pair.aToB, sentTotalsByPerson.get(pair.personAId) || 0),
        dashboardPercentage(pair.bToA, sentTotalsByPerson.get(pair.personBId) || 0)
      );
      return {
        personAId: pair.personAId,
        personAName: personA?.name || "",
        personAArea: personA?.area || "Sem area",
        personBId: pair.personBId,
        personBName: personB?.name || "",
        personBArea: personB?.area || "Sem area",
        aToB: pair.aToB,
        bToA: pair.bToA,
        total: pair.aToB + pair.bToA,
        concentrationPercentage: concentration,
        lastApplauseAt: pair.lastApplauseAt
      };
    })
    .filter((pair) => pair.aToB >= 2 && pair.bToA >= 2 && pair.total >= 4 && pair.concentrationPercentage >= 60)
    .sort((left, right) => right.total - left.total || right.concentrationPercentage - left.concentrationPercentage)
    .slice(0, 10);

  const categoryCounts = [...entriesByCategory.entries()]
    .map(([itemCategory, total]) => ({ category: itemCategory || "Sem categoria", total }))
    .sort((left, right) => right.total - left.total);
  const dominantCategory = categoryCounts[0] && approvedEntries.length
    ? dashboardPercentage(categoryCounts[0].total, approvedEntries.length) >= 60
      ? categoryCounts[0].category
      : null
    : null;
  const topReceiverCount = Math.max(
    0,
    ...[...receiverIds].map((personId) => approvedEntries.filter((entry) => entry.receiverPersonId === personId).length)
  );

  return {
    mode,
    notice,
    scopeLabel,
    selectedArea,
    selectedTeamManagerId,
    areaOptions: availableAreas,
    teamOptions,
    filters: { timeGrouping, category },
    summary: {
      approvedApplauses: approvedEntries.length,
      activeSenders: senderIds.size,
      activeReceivers: receiverIds.size,
      senderParticipationPercentage: dashboardPercentage(senderIds.size, peopleCount),
      receiverCoveragePercentage: dashboardPercentage(receiverIds.size, peopleCount),
      averageSentPerEligiblePerson: peopleCount ? Number((approvedEntries.length / peopleCount).toFixed(1)) : 0,
      suspiciousReciprocityPairs: unusualReciprocity.length
    },
    sentByArea: [...sentByAreaMap.values()].sort((left, right) => right.totalSent - left.totalSent),
    receivedByArea: [...receivedByAreaMap.values()].sort((left, right) => right.totalReceived - left.totalReceived),
    areaBalance,
    categoryCounts,
    trend: [...trendMap.values()]
      .map((item) => ({
        periodKey: item.periodKey,
        label: item.label,
        totalApplauses: item.totalApplauses,
        activeSenders: item.activeSenders.size,
        activeReceivers: item.activeReceivers.size
      }))
      .sort((left, right) => left.periodKey.localeCompare(right.periodKey)),
    unusualReciprocity,
    alerts: {
      silentReceivingAreas: areaNames.filter((area) => !(receivedByAreaMap.get(area)?.totalReceived)),
      silentSendingAreas: areaNames.filter((area) => !(sentByAreaMap.get(area)?.totalSent)),
      concentratedRecognition: approvedEntries.length >= 5 && dashboardPercentage(topReceiverCount, approvedEntries.length) >= 40,
      dominantCategory
    },
    dataQuality: {
      approvedRecordsConsidered: approvedEntries.length,
      ignoredRecords: allConsideredEntries.length - approvedEntries.length,
      eligiblePeople: peopleCount,
      note: "Indicadores consideram apenas Aplause validado; padroes incomuns sao sinais para revisao humana, nao conclusoes automaticas."
    }
  };
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
          learningEvents: (db.learningIntegrationEvents || []).filter(
            (item) => !item.personId || scopedPersonIds.has(item.personId)
          ),
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
    },

    async getComplianceDashboard(actorUser, options = {}) {
      const availableAreas = [...new Set(db.people.map((person) => person.area))].sort();
      const cyclesById = new Map((db.cycles || []).map((cycle) => [cycle.id, cycle]));
      const developmentPlans = attachApprovedDevelopmentPlanExtensions(
        db.developmentPlans || [],
        db.developmentPlanExtensions || []
      );
      const assignments = (db.assignments || []).map((assignment) => ({
        ...assignment,
        reviewerPersonId: db.users.find((user) => user.id === assignment.reviewerUserId)?.personId || null,
        reviewerArea: db.people.find((person) => person.id === db.users.find((user) => user.id === assignment.reviewerUserId)?.personId)?.area || "",
        complianceGraceDueDate: cyclesById.get(assignment.cycleId)?.complianceGraceDueDate || null
      }));

      if (isOrgWideUser(actorUser)) {
        const areaScopedPeople = options.area
          ? db.people.filter((person) => person.area === options.area)
          : db.people;
        const scopedPeople = options.teamManagerId
          ? areaScopedPeople.filter((person) => person.id === options.teamManagerId || person.managerPersonId === options.teamManagerId)
          : areaScopedPeople;
        const scopedPersonIds = new Set(scopedPeople.map((person) => person.id));
        const selectedTeam = buildDashboardTeamOptions(db.people, options.area).find((team) => team.managerPersonId === options.teamManagerId);
        return buildComplianceDashboardPayload({
          mode: "executive",
          notice: "Leitura de compliance por area com controles elegiveis.",
          scopeLabel: selectedTeam ? selectedTeam.label : options.area ? `Area: ${options.area}` : "Consolidado organizacional",
          people: scopedPeople,
          cycles: db.cycles || [],
          assignments: assignments.filter((item) => scopedPersonIds.has(item.reviewerPersonId)),
          developmentPlans: developmentPlans.filter((item) => scopedPersonIds.has(item.personId)),
          incidents: (db.incidents || []).filter((item) => !item.subjectPersonId || scopedPersonIds.has(item.subjectPersonId)),
          availableAreas,
          selectedArea: options.area,
          teamOptions: buildDashboardTeamOptions(db.people, options.area),
          selectedTeamManagerId: options.teamManagerId,
          timeGrouping: options.timeGrouping || "semester"
        });
      }

      if (isManagerUser(actorUser)) {
        const teamPeople = getTeamPeople(db.people, actorUser.person.id);
        const scopedPeople = [actorUser.person, ...teamPeople];
        const scopedPersonIds = new Set(scopedPeople.map((person) => person.id));
        return buildComplianceDashboardPayload({
          mode: "team",
          notice: "Leitura da sua equipe direta, sem detalhes sensiveis dos casos.",
          scopeLabel: "Equipe direta",
          people: scopedPeople,
          cycles: db.cycles || [],
          assignments: assignments.filter((item) => scopedPersonIds.has(item.reviewerPersonId)),
          developmentPlans: developmentPlans.filter((item) => scopedPersonIds.has(item.personId)),
          incidents: (db.incidents || []).filter((item) => scopedPersonIds.has(item.subjectPersonId)),
          timeGrouping: options.timeGrouping || "semester"
        });
      }

      return buildComplianceDashboardPayload({
        mode: "personal",
        notice: "Visao individual dos seus controles elegiveis.",
        scopeLabel: "Visao pessoal",
        people: [actorUser.person].filter(Boolean),
        cycles: db.cycles || [],
        assignments: assignments.filter((item) => item.reviewerPersonId === actorUser.person.id),
        developmentPlans: developmentPlans.filter((item) => item.personId === actorUser.person.id),
        incidents: (db.incidents || []).filter((item) => item.subjectPersonId === actorUser.person.id),
        timeGrouping: options.timeGrouping || "semester"
      });
    },

    async getApplauseDashboard(actorUser, options = {}) {
      const availableAreas = [...new Set(db.people.map((person) => person.area))].sort();
      const entries = db.applauseEntries || [];

      if (isOrgWideUser(actorUser)) {
        const areaScopedPeople = options.area
          ? db.people.filter((person) => person.area === options.area)
          : db.people;
        const scopedPeople = options.teamManagerId
          ? areaScopedPeople.filter((person) => person.id === options.teamManagerId || person.managerPersonId === options.teamManagerId)
          : areaScopedPeople;
        const scopedPersonIds = new Set(scopedPeople.map((person) => person.id));
        const selectedTeam = buildDashboardTeamOptions(db.people, options.area).find((team) => team.managerPersonId === options.teamManagerId);
        return buildApplauseDashboardPayload({
          mode: "executive",
          notice: "Leitura de reconhecimentos enviados e recebidos pelas equipes.",
          scopeLabel: selectedTeam ? selectedTeam.label : options.area ? `Area: ${options.area}` : "Consolidado organizacional",
          people: scopedPeople,
          applauseEntries: entries.filter((item) => scopedPersonIds.has(item.senderPersonId) || scopedPersonIds.has(item.receiverPersonId)),
          availableAreas,
          selectedArea: options.area,
          teamOptions: buildDashboardTeamOptions(db.people, options.area),
          selectedTeamManagerId: options.teamManagerId,
          timeGrouping: options.timeGrouping || "semester",
          category: options.category || null
        });
      }

      if (isManagerUser(actorUser)) {
        const teamPeople = getTeamPeople(db.people, actorUser.person.id);
        const scopedPeople = [actorUser.person, ...teamPeople];
        const scopedPersonIds = new Set(scopedPeople.map((person) => person.id));
        return buildApplauseDashboardPayload({
          mode: "team",
          notice: "Leitura dos Aplause enviados e recebidos pela sua equipe.",
          scopeLabel: "Equipe direta",
          people: scopedPeople,
          applauseEntries: entries.filter((item) => scopedPersonIds.has(item.senderPersonId) || scopedPersonIds.has(item.receiverPersonId)),
          timeGrouping: options.timeGrouping || "semester",
          category: options.category || null
        });
      }

      return buildApplauseDashboardPayload({
        mode: "personal",
        notice: "Visao individual de reconhecimento.",
        scopeLabel: "Visao pessoal",
        people: [actorUser.person].filter(Boolean),
        applauseEntries: entries.filter((item) => item.senderPersonId === actorUser.person.id || item.receiverPersonId === actorUser.person.id),
        timeGrouping: options.timeGrouping || "semester",
        category: options.category || null
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
              `SELECT id, title, semester_label AS semesterLabel, status, due_date AS dueDate,
                      compliance_grace_due_date AS complianceGraceDueDate
               FROM evaluation_cycles`
            )
            .then(([rows]) => rows),
          fetchMysqlResponses(pool, customLibraryState.published, {
            supportsFeedbackAcknowledgement,
            supportsIndividualQuestionnaires
          }).then((items) => [...items, ...anonymousResponseState.responses]),
          pool
            .query(
              `SELECT assignment.id, assignment.cycle_id AS cycleId, assignment.relationship_type AS relationshipType,
                      reviewer_user_id AS reviewerUserId,
                      reviewer_person.id AS reviewerPersonId, reviewer_person.area AS reviewerArea,
                      reviewee_person_id AS revieweePersonId, assignment.status
               FROM evaluation_assignments assignment
               LEFT JOIN users reviewer_user ON reviewer_user.id = assignment.reviewer_user_id
               LEFT JOIN people reviewer_person ON reviewer_person.id = reviewer_user.person_id`
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
              `SELECT d.person_id AS personId, d.record_type AS recordType,
                      d.skill_signal AS skillSignal, d.completed_at AS completedAt, d.status
               FROM development_records d`
            )
            .then(([rows]) => rows),
          pool
            .query(
              `SELECT plan.id, plan.person_id AS personId, plan.cycle_id AS cycleId,
                      plan.competency_id AS competencyId, competency.name AS competencyName,
                      plan.due_date AS dueDate, plan.status,
                      plan.progress_status AS progressStatus,
                      plan.is_compliance_required AS isComplianceRequired,
                      approved_extension.requested_due_date AS approvedExtensionDueDate,
                      plan.created_at AS createdAt, plan.archived_at AS archivedAt,
                      plan.progress_updated_at AS progressUpdatedAt
               FROM development_plans plan
               LEFT JOIN competencies competency ON competency.id = plan.competency_id
               LEFT JOIN development_plan_extensions approved_extension
                 ON approved_extension.plan_id = plan.id
                AND approved_extension.status = 'approved'`
            )
            .then(([rows]) => rows),
          pool
            .query(
              `SELECT id, status, assigned_person_id AS assignedPersonId, assigned_to AS assignedTo,
                      due_at AS dueAt, closed_at AS closedAt, created_at AS createdAt,
                      responsible_area AS responsibleArea, subject_person_id AS subjectPersonId,
                      finding_status AS findingStatus, finding_decided_at AS findingDecidedAt
               FROM incident_reports`
            )
            .then(([rows]) => rows),
          supportsLearningIntegrations
            ? pool
                .query(
                  `SELECT person_id AS personId, competency_key AS competencyKey,
                          suggested_action AS suggestedAction,
                          processing_status AS processingStatus, occurred_at AS occurredAt
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
          learningEvents: learningRows.filter(
            (item) => !item.personId || scopedPersonIds.has(item.personId)
          ),
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
    },

    async getComplianceDashboard(actorUser, options = {}) {
      const timeGrouping = options.timeGrouping || "semester";
      const [
        people,
        cycles,
        assignmentRows,
        developmentPlanRows,
        incidentRows
      ] = await Promise.all([
        fetchPeopleRows(pool),
        pool
          .query(
            `SELECT id, title, semester_label AS semesterLabel, status, due_date AS dueDate,
                    compliance_grace_due_date AS complianceGraceDueDate
             FROM evaluation_cycles`
          )
          .then(([rows]) => rows),
        pool
          .query(
            `SELECT assignment.id, assignment.cycle_id AS cycleId, assignment.relationship_type AS relationshipType,
                    assignment.reviewer_user_id AS reviewerUserId,
                    reviewer_person.id AS reviewerPersonId, reviewer_person.area AS reviewerArea,
                    assignment.reviewee_person_id AS revieweePersonId, assignment.status
             FROM evaluation_assignments assignment
             LEFT JOIN users reviewer_user ON reviewer_user.id = assignment.reviewer_user_id
             LEFT JOIN people reviewer_person ON reviewer_person.id = reviewer_user.person_id`
          )
          .then(([rows]) => rows),
        pool
          .query(
            `SELECT plan.id, plan.person_id AS personId, person.area AS originArea,
                    plan.due_date AS dueDate, plan.status,
                    plan.progress_status AS progressStatus,
                    plan.is_compliance_required AS isComplianceRequired,
                    approved_extension.requested_due_date AS approvedExtensionDueDate
             FROM development_plans plan
             LEFT JOIN people person ON person.id = plan.person_id
             LEFT JOIN development_plan_extensions approved_extension
               ON approved_extension.plan_id = plan.id
              AND approved_extension.status = 'approved'`
          )
          .then(([rows]) => rows),
        pool
          .query(
            `SELECT id, status, responsible_area AS responsibleArea, closed_at AS closedAt,
                    created_at AS createdAt, subject_person_id AS subjectPersonId,
                    finding_status AS findingStatus, finding_decided_at AS findingDecidedAt
             FROM incident_reports`
          )
          .then(([rows]) => rows)
      ]);
      const availableAreas = [...new Set(people.map((person) => person.area))].sort();

      if (isFullAccessUser(actorUser)) {
        const areaScopedPeople = options.area ? people.filter((person) => person.area === options.area) : people;
        const scopedPeople = options.teamManagerId
          ? areaScopedPeople.filter((person) => person.id === options.teamManagerId || person.managerPersonId === options.teamManagerId)
          : areaScopedPeople;
        const scopedPersonIds = new Set(scopedPeople.map((person) => person.id));
        const selectedTeam = buildDashboardTeamOptions(people, options.area).find((team) => team.managerPersonId === options.teamManagerId);
        return buildComplianceDashboardPayload({
          mode: "executive",
          notice: "Leitura de compliance por area com controles elegiveis.",
          scopeLabel: selectedTeam ? selectedTeam.label : options.area ? `Area: ${options.area}` : "Consolidado organizacional",
          people: scopedPeople,
          cycles,
          assignments: assignmentRows.filter((item) => scopedPersonIds.has(item.reviewerPersonId)),
          developmentPlans: developmentPlanRows.filter((item) => scopedPersonIds.has(item.personId)),
          incidents: incidentRows.filter((item) => !item.subjectPersonId || scopedPersonIds.has(item.subjectPersonId)),
          availableAreas,
          selectedArea: options.area,
          teamOptions: buildDashboardTeamOptions(people, options.area),
          selectedTeamManagerId: options.teamManagerId,
          timeGrouping
        });
      }

      if (isManagerUser(actorUser)) {
        const scopedPeople = people.filter((person) => person.id === actorUser.person.id || person.managerPersonId === actorUser.person.id);
        const scopedPersonIds = new Set(scopedPeople.map((person) => person.id));
        return buildComplianceDashboardPayload({
          mode: "team",
          notice: "Leitura da sua equipe direta, sem detalhes sensiveis dos casos.",
          scopeLabel: "Equipe direta",
          people: scopedPeople,
          cycles,
          assignments: assignmentRows.filter((item) => scopedPersonIds.has(item.reviewerPersonId)),
          developmentPlans: developmentPlanRows.filter((item) => scopedPersonIds.has(item.personId)),
          incidents: incidentRows.filter((item) => scopedPersonIds.has(item.subjectPersonId)),
          timeGrouping
        });
      }

      return buildComplianceDashboardPayload({
        mode: "personal",
        notice: "Visao individual dos seus controles elegiveis.",
        scopeLabel: "Visao pessoal",
        people: people.filter((person) => person.id === actorUser.person.id),
        cycles,
        assignments: assignmentRows.filter((item) => item.reviewerPersonId === actorUser.person.id),
        developmentPlans: developmentPlanRows.filter((item) => item.personId === actorUser.person.id),
        incidents: incidentRows.filter((item) => item.subjectPersonId === actorUser.person.id),
        timeGrouping
      });
    },

    async getApplauseDashboard(actorUser, options = {}) {
      const timeGrouping = options.timeGrouping || "semester";
      const [people, applauseRows] = await Promise.all([
        fetchPeopleRows(pool),
        pool
          .query(
            `SELECT a.id, a.sender_person_id AS senderPersonId,
                    a.receiver_person_id AS receiverPersonId, a.category,
                    a.created_at AS createdAt, a.status
             FROM applause_entries a`
          )
          .then(([rows]) => rows)
      ]);
      const availableAreas = [...new Set(people.map((person) => person.area))].sort();

      if (isFullAccessUser(actorUser)) {
        const areaScopedPeople = options.area ? people.filter((person) => person.area === options.area) : people;
        const scopedPeople = options.teamManagerId
          ? areaScopedPeople.filter((person) => person.id === options.teamManagerId || person.managerPersonId === options.teamManagerId)
          : areaScopedPeople;
        const scopedPersonIds = new Set(scopedPeople.map((person) => person.id));
        const selectedTeam = buildDashboardTeamOptions(people, options.area).find((team) => team.managerPersonId === options.teamManagerId);
        return buildApplauseDashboardPayload({
          mode: "executive",
          notice: "Leitura de reconhecimentos enviados e recebidos pelas equipes.",
          scopeLabel: selectedTeam ? selectedTeam.label : options.area ? `Area: ${options.area}` : "Consolidado organizacional",
          people: scopedPeople,
          applauseEntries: applauseRows.filter((item) => scopedPersonIds.has(item.senderPersonId) || scopedPersonIds.has(item.receiverPersonId)),
          availableAreas,
          selectedArea: options.area,
          teamOptions: buildDashboardTeamOptions(people, options.area),
          selectedTeamManagerId: options.teamManagerId,
          timeGrouping,
          category: options.category || null
        });
      }

      if (isManagerUser(actorUser)) {
        const scopedPeople = people.filter((person) => person.id === actorUser.person.id || person.managerPersonId === actorUser.person.id);
        const scopedPersonIds = new Set(scopedPeople.map((person) => person.id));
        return buildApplauseDashboardPayload({
          mode: "team",
          notice: "Leitura dos Aplause enviados e recebidos pela sua equipe.",
          scopeLabel: "Equipe direta",
          people: scopedPeople,
          applauseEntries: applauseRows.filter((item) => scopedPersonIds.has(item.senderPersonId) || scopedPersonIds.has(item.receiverPersonId)),
          timeGrouping,
          category: options.category || null
        });
      }

      return buildApplauseDashboardPayload({
        mode: "personal",
        notice: "Visao individual de reconhecimento.",
        scopeLabel: "Visao pessoal",
        people: people.filter((person) => person.id === actorUser.person.id),
        applauseEntries: applauseRows.filter((item) => item.senderPersonId === actorUser.person.id || item.receiverPersonId === actorUser.person.id),
        timeGrouping,
        category: options.category || null
      });
    }
  };
}
