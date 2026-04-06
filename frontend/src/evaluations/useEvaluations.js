import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { parseAppHash } from "../appRoute";
import { evaluationModules } from "../appConfig.js";
import { validateEvaluationAnswerForm } from "./validation.js";

const DEFAULT_CYCLE_MODULE_AVAILABILITY = Object.freeze({
  self: true,
  company: true,
  leader: true,
  manager: true,
  peer: true,
  "cross-functional": true,
  "client-internal": true,
  "client-external": true
});
const FEEDBACK_ACKNOWLEDGEMENT_STATUS = Object.freeze({
  agreed: "agreed",
  disagreed: "disagreed"
});

function normalizeCycleModuleAvailability(value) {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_CYCLE_MODULE_AVAILABILITY };
  }

  return {
    ...DEFAULT_CYCLE_MODULE_AVAILABILITY,
    ...Object.fromEntries(Object.entries(value).map(([key, enabled]) => [key, Boolean(enabled)]))
  };
}

function getInitialEvaluationRoute() {
  if (typeof window === "undefined") {
    return {
      evaluationModuleKey: "overview",
      evaluationWorkspace: "respond"
    };
  }

  return parseAppHash(window.location.hash, {
    fallbackSectionKey: "Dashboard",
    canViewEvaluationInsights: false,
    canViewEvaluationOperations: false
  });
}

function buildInitialAnswers(detail) {
  return Object.fromEntries(
    detail.template.questions.map((question) => [
      question.id,
      question.inputType === "multi-select"
        ? {
            selectedOptions: []
          }
        : question.inputType === "text"
          ? {
              textValue: ""
            }
          : {
              score: 3,
              evidenceNote: ""
            }
    ])
  );
}

function averageScore(values) {
  if (!values.length) {
    return null;
  }

  return Number(
    (values.reduce((total, value) => total + Number(value), 0) / values.length).toFixed(2)
  );
}

function calculatePercentage(part, total) {
  if (!total) {
    return 0;
  }

  return Math.round((Number(part) / Number(total)) * 100);
}

function normalizeOperationFilterValue(value) {
  return String(value || "").trim();
}

function matchesOperationFilter(value, filterValue) {
  if (filterValue === "all") {
    return true;
  }

  return normalizeOperationFilterValue(value).toLowerCase() ===
    normalizeOperationFilterValue(filterValue).toLowerCase();
}

function buildFilteredCycleOperationsStructure(structure, filters) {
  if (!structure) {
    return null;
  }

  const participants = Array.isArray(structure.participants) ? structure.participants : [];
  const delinquents = Array.isArray(structure.delinquents) ? structure.delinquents : [];
  const filteredParticipants = participants.filter(
    (participant) =>
      matchesOperationFilter(participant.personWorkUnit, filters.workUnit) &&
      matchesOperationFilter(participant.personWorkMode, filters.workMode)
  );
  const allowedPersonIds = new Set(filteredParticipants.map((participant) => participant.personId));
  const filteredDelinquents = delinquents.filter((assignment) =>
    allowedPersonIds.has(assignment.revieweePersonId)
  );
  const totalAssignments = filteredParticipants.reduce(
    (total, participant) => total + Number(participant.totalRaters || 0),
    0
  );
  const submittedAssignments = filteredParticipants.reduce(
    (total, participant) => total + Number(participant.completedRaters || 0),
    0
  );
  const pendingAssignments = filteredParticipants.reduce(
    (total, participant) => total + Number(participant.pendingRaters || 0),
    0
  );
  const filteredRaters = filteredParticipants.flatMap((participant) => participant.raters || []);
  const relationshipSummary = Object.entries(
    filteredRaters.reduce((summary, rater) => {
      summary[rater.relationshipType] = (summary[rater.relationshipType] || 0) + 1;
      return summary;
    }, {})
  ).map(([relationshipType, total]) => ({ relationshipType, total }));

  return {
    ...structure,
    cycle: {
      ...structure.cycle,
      participantCount: filteredParticipants.length,
      raterCount: filteredRaters.length
    },
    compliance: {
      totalAssignments,
      submittedAssignments,
      pendingAssignments,
      delinquentAssignments: filteredDelinquents.length,
      adherenceRate: calculatePercentage(submittedAssignments, totalAssignments),
      delinquencyRate: calculatePercentage(filteredDelinquents.length, totalAssignments)
    },
    participants: filteredParticipants,
    delinquents: filteredDelinquents,
    relationshipSummary
  };
}

function summarizeEvaluationCycleModule({
  cycleId,
  cycles,
  assignments,
  responsesBundle,
  moduleMeta
}) {
  if (!cycleId) {
    return null;
  }

  const cycle = cycles.find((item) => item.id === cycleId);
  if (!cycle) {
    return null;
  }

  const matchesModule = (item) =>
    !moduleMeta?.relationshipType || item.relationshipType === moduleMeta.relationshipType;

  const scopedAssignments = assignments.filter(
    (assignment) => assignment.cycleId === cycleId && matchesModule(assignment)
  );
  const scopedIndividualResponses = (responsesBundle.individualResponses || []).filter(
    (response) => response.cycleId === cycleId && matchesModule(response)
  );
  const scopedAggregateResponses = (responsesBundle.cycleAggregateResponses || []).filter(
    (response) => response.cycleId === cycleId && matchesModule(response)
  );

  const observedAverage =
    averageScore(scopedAggregateResponses.map((item) => item.averageScore)) ??
    averageScore(scopedIndividualResponses.map((item) => item.overallScore));
  const submittedAssignments = scopedAssignments.filter(
    (assignment) => assignment.status === "submitted"
  ).length;
  const pendingAssignments = scopedAssignments.filter(
    (assignment) => assignment.status === "pending"
  ).length;
  const completionRate = scopedAssignments.length
    ? Math.round((submittedAssignments / scopedAssignments.length) * 100)
    : 0;

  return {
    id: cycle.id,
    title: cycle.title,
    semesterLabel: cycle.semesterLabel,
    status: cycle.status,
    dueDate: cycle.dueDate,
    totalAssignments: scopedAssignments.length,
    pendingAssignments,
    submittedAssignments,
    completionRate,
    visibleResponses: scopedIndividualResponses.length + scopedAggregateResponses.length,
    averageScore: observedAverage
  };
}

function buildCycleComparisonHighlights(activeSummary, comparisonSummary) {
  if (!activeSummary || !comparisonSummary) {
    return [];
  }

  const metricConfig = [
    {
      key: "completionRate",
      label: "Conclusao",
      suffix: "%",
      formatter: (value) => `${value}%`
    },
    {
      key: "submittedAssignments",
      label: "Concluidas",
      suffix: "",
      formatter: (value) => value
    },
    {
      key: "pendingAssignments",
      label: "Pendentes",
      suffix: "",
      formatter: (value) => value
    },
    {
      key: "averageScore",
      label: "Media observada",
      suffix: "",
      formatter: (value) => (value ?? "-")
    }
  ];

  return metricConfig.map((metric) => {
    const activeValue = Number(activeSummary[metric.key] ?? 0);
    const comparisonValue = Number(comparisonSummary[metric.key] ?? 0);
    const delta = Number((activeValue - comparisonValue).toFixed(2));

    return {
      key: metric.key,
      label: metric.label,
      activeValue: metric.formatter(activeSummary[metric.key]),
      comparisonValue: metric.formatter(comparisonSummary[metric.key]),
      delta,
      direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
      deltaLabel:
        delta === 0
          ? "Sem variacao"
          : `${delta > 0 ? "+" : ""}${delta}${metric.suffix}`
    };
  });
}

export function useEvaluations({
  user,
  people,
  cycles,
  assignments,
  receivedManagerFeedback,
  feedbackRequests,
  evaluationLibrary,
  responsesBundle,
  canViewEvaluationInsights,
  canViewEvaluationOperations,
  canViewResponses,
  reloadData,
  setError,
  initialCycleForm,
  initialFeedbackRequestForm,
  initialLibraryPublishForm
}) {
  const initialRoute = getInitialEvaluationRoute();
  const [activeEvaluationModule, setActiveEvaluationModule] = useState(
    initialRoute.evaluationModuleKey || "overview"
  );
  const [activeEvaluationCycleId, setActiveEvaluationCycleId] = useState("");
  const [comparisonEvaluationCycleId, setComparisonEvaluationCycleId] = useState("");
  const [activeEvaluationWorkspace, setActiveEvaluationWorkspace] = useState(
    initialRoute.evaluationWorkspace || "respond"
  );
  const [evaluationCycleStructure, setEvaluationCycleStructure] = useState(null);
  const [evaluationOperationNotice, setEvaluationOperationNotice] = useState("");
  const [evaluationOperationWorkUnitFilter, setEvaluationOperationWorkUnitFilter] = useState("all");
  const [evaluationOperationWorkModeFilter, setEvaluationOperationWorkModeFilter] = useState("all");
  const [showEvaluationLibrary, setShowEvaluationLibrary] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentDetail, setAssignmentDetail] = useState(null);
  const [answerForm, setAnswerForm] = useState({});
  const [strengthsNote, setStrengthsNote] = useState("");
  const [developmentNote, setDevelopmentNote] = useState("");
  const [cycleForm, setCycleForm] = useState(initialCycleForm);
  const [feedbackRequestForm, setFeedbackRequestForm] = useState(initialFeedbackRequestForm);
  const [receivedManagerFeedbackDrafts, setReceivedManagerFeedbackDrafts] = useState({});
  const [customLibraryDraft, setCustomLibraryDraft] = useState(null);
  const [customLibraryPublishForm, setCustomLibraryPublishForm] = useState(
    initialLibraryPublishForm
  );
  const individualResponses = responsesBundle?.individualResponses || [];
  const cycleAggregateResponses = responsesBundle?.cycleAggregateResponses || [];
  const activeCycle = useMemo(
    () => cycles.find((cycle) => cycle.id === activeEvaluationCycleId) || null,
    [activeEvaluationCycleId, cycles]
  );
  const activeCycleModuleAvailability = useMemo(
    () => normalizeCycleModuleAvailability(activeCycle?.moduleAvailability),
    [activeCycle?.moduleAvailability]
  );

  const feedbackRequestCycleOptions = useMemo(
    () => cycles.filter((cycle) => !["Encerrado", "Processado"].includes(cycle.status)),
    [cycles]
  );

  const evaluationCycleOptions = useMemo(() => cycles, [cycles]);
  const cycleLibraryOptions = useMemo(
    () => evaluationLibrary?.cycleLibraries || [],
    [evaluationLibrary]
  );

  const feedbackProviderOptions = useMemo(
    () =>
      people
        .map((person) => ({ value: person.id, label: person.name }))
        .filter((person) => person.value !== user?.person?.id),
    [people, user]
  );

  const visibleEvaluationModules = useMemo(() => {
    const base = canViewEvaluationInsights
      ? evaluationModules
      : evaluationModules.filter((module) => module.relationshipType);

    if (activeEvaluationWorkspace === "operations" && canViewEvaluationOperations) {
      return base;
    }

    if (!activeCycle) {
      return base;
    }

    if (activeCycle.isEnabled === false) {
      return [];
    }

    return base.filter(
      (module) =>
        !module.relationshipType ||
        activeCycleModuleAvailability[module.relationshipType] !== false
    );
  }, [
    activeCycle,
    activeCycleModuleAvailability,
    activeEvaluationWorkspace,
    canViewEvaluationInsights,
    canViewEvaluationOperations
  ]);

  const evaluationModuleOptions = useMemo(
    () =>
      visibleEvaluationModules.map((module) => {
        const matchesCycle = (item) =>
          !activeEvaluationCycleId || item.cycleId === activeEvaluationCycleId;
        const matchesModule = (item) =>
          !module.relationshipType || item.relationshipType === module.relationshipType;
        const assignmentsByModule = assignments.filter(
          (assignment) => matchesCycle(assignment) && matchesModule(assignment)
        );
        const responsesByModule = [
          ...individualResponses.filter(
            (response) => matchesCycle(response) && matchesModule(response)
          ),
          ...cycleAggregateResponses.filter(
            (response) => matchesCycle(response) && matchesModule(response)
          )
        ];

        return {
          ...module,
          totalAssignments: assignmentsByModule.length,
          pendingAssignments: assignmentsByModule.filter(
            (assignment) => assignment.status === "pending"
          ).length,
          visibleResponses: responsesByModule.length
        };
      }),
    [
      activeEvaluationCycleId,
      assignments,
      cycleAggregateResponses,
      individualResponses,
      visibleEvaluationModules
    ]
  );

  const activeEvaluationModuleMeta = useMemo(
    () =>
      evaluationModuleOptions.find((module) => module.key === activeEvaluationModule) ||
      evaluationModuleOptions[0] ||
      evaluationModules[0],
    [activeEvaluationModule, evaluationModuleOptions]
  );

  const comparisonCycleOptions = useMemo(
    () => evaluationCycleOptions.filter((cycle) => cycle.id !== activeEvaluationCycleId),
    [activeEvaluationCycleId, evaluationCycleOptions]
  );

  const filteredAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) =>
          (!activeEvaluationCycleId || assignment.cycleId === activeEvaluationCycleId) &&
          (!activeEvaluationModuleMeta?.relationshipType ||
            assignment.relationshipType === activeEvaluationModuleMeta.relationshipType)
      ),
    [activeEvaluationCycleId, activeEvaluationModuleMeta, assignments]
  );

  const filteredIndividualResponses = useMemo(
    () =>
      individualResponses.filter(
        (response) =>
          (!activeEvaluationCycleId || response.cycleId === activeEvaluationCycleId) &&
          (!activeEvaluationModuleMeta?.relationshipType ||
            response.relationshipType === activeEvaluationModuleMeta.relationshipType)
      ),
    [activeEvaluationCycleId, activeEvaluationModuleMeta, individualResponses]
  );

  const filteredAggregateResponses = useMemo(
    () =>
      cycleAggregateResponses.filter(
        (response) =>
          (!activeEvaluationCycleId || response.cycleId === activeEvaluationCycleId) &&
          (!activeEvaluationModuleMeta?.relationshipType ||
            response.relationshipType === activeEvaluationModuleMeta.relationshipType)
      ),
    [activeEvaluationCycleId, activeEvaluationModuleMeta, cycleAggregateResponses]
  );

  const filteredFeedbackRequests = useMemo(
    () =>
      activeEvaluationModuleMeta?.relationshipType === "peer"
        ? feedbackRequests.filter(
            (request) => !activeEvaluationCycleId || request.cycleId === activeEvaluationCycleId
          )
        : [],
    [activeEvaluationCycleId, activeEvaluationModuleMeta, feedbackRequests]
  );

  const filteredReceivedManagerFeedback = useMemo(
    () =>
      activeEvaluationModuleMeta?.relationshipType === "manager"
        ? receivedManagerFeedback.filter(
            (response) =>
              (!activeEvaluationCycleId || response.cycleId === activeEvaluationCycleId) &&
              response.relationshipType === "manager"
          )
        : [],
    [activeEvaluationCycleId, activeEvaluationModuleMeta, receivedManagerFeedback]
  );

  const activeCycleModuleSummary = useMemo(
    () =>
      summarizeEvaluationCycleModule({
        cycleId: activeEvaluationCycleId,
        cycles,
        assignments,
        responsesBundle,
        moduleMeta: activeEvaluationModuleMeta
      }),
    [activeEvaluationCycleId, activeEvaluationModuleMeta, assignments, cycles, responsesBundle]
  );

  const comparisonCycleModuleSummary = useMemo(
    () =>
      summarizeEvaluationCycleModule({
        cycleId: comparisonEvaluationCycleId,
        cycles,
        assignments,
        responsesBundle,
        moduleMeta: activeEvaluationModuleMeta
      }),
    [
      activeEvaluationModuleMeta,
      assignments,
      comparisonEvaluationCycleId,
      cycles,
      responsesBundle
    ]
  );

  const cycleComparisonHighlights = useMemo(
    () =>
      buildCycleComparisonHighlights(activeCycleModuleSummary, comparisonCycleModuleSummary),
    [activeCycleModuleSummary, comparisonCycleModuleSummary]
  );

  const evaluationCycleHistory = useMemo(
    () =>
      cycles
        .map((cycle) =>
          summarizeEvaluationCycleModule({
            cycleId: cycle.id,
            cycles,
            assignments,
            responsesBundle,
            moduleMeta: activeEvaluationModuleMeta
          })
        )
        .filter(
          (cycleSummary) =>
            cycleSummary && (cycleSummary.totalAssignments || cycleSummary.visibleResponses)
        )
        .sort((left, right) => {
          const rightDate = right?.dueDate ? new Date(right.dueDate).getTime() : 0;
          const leftDate = left?.dueDate ? new Date(left.dueDate).getTime() : 0;
          return rightDate - leftDate;
        }),
    [activeEvaluationModuleMeta, assignments, cycles, responsesBundle]
  );

  const evaluationOperationWorkUnitOptions = useMemo(() => {
    const options = Array.from(
      new Set(
        (evaluationCycleStructure?.participants || [])
          .map((participant) => String(participant.personWorkUnit || "").trim())
          .filter(Boolean)
      )
    ).sort((left, right) => left.localeCompare(right, "pt-BR"));

    return ["all", ...options];
  }, [evaluationCycleStructure]);

  const evaluationOperationWorkModeOptions = useMemo(() => {
    const options = Array.from(
      new Set(
        (evaluationCycleStructure?.participants || [])
          .map((participant) => String(participant.personWorkMode || "").trim())
          .filter(Boolean)
      )
    );

    return ["all", ...options];
  }, [evaluationCycleStructure]);

  const filteredEvaluationCycleStructure = useMemo(
    () =>
      buildFilteredCycleOperationsStructure(evaluationCycleStructure, {
        workUnit: evaluationOperationWorkUnitFilter,
        workMode: evaluationOperationWorkModeFilter
      }),
    [
      evaluationCycleStructure,
      evaluationOperationWorkModeFilter,
      evaluationOperationWorkUnitFilter
    ]
  );

  useEffect(() => {
    async function loadCycleStructure() {
      if (!canViewEvaluationOperations || activeEvaluationWorkspace !== "operations") {
        setEvaluationCycleStructure(null);
        return;
      }

      if (!activeEvaluationCycleId) {
        setEvaluationCycleStructure(null);
        return;
      }

      try {
        const structure = await api.getEvaluationCycleParticipants(activeEvaluationCycleId);
        setEvaluationCycleStructure(structure);
      } catch (err) {
        setEvaluationCycleStructure(null);
        setError(err.message);
      }
    }

    loadCycleStructure();
  }, [
    activeEvaluationCycleId,
    activeEvaluationWorkspace,
    assignments,
    canViewEvaluationOperations,
    setError
  ]);

  useEffect(() => {
    if (!evaluationOperationWorkUnitOptions.includes(evaluationOperationWorkUnitFilter)) {
      setEvaluationOperationWorkUnitFilter("all");
    }
  }, [evaluationOperationWorkUnitFilter, evaluationOperationWorkUnitOptions]);

  useEffect(() => {
    if (!evaluationOperationWorkModeOptions.includes(evaluationOperationWorkModeFilter)) {
      setEvaluationOperationWorkModeFilter("all");
    }
  }, [evaluationOperationWorkModeFilter, evaluationOperationWorkModeOptions]);

  useEffect(() => {
    async function loadAssignment() {
      if (!selectedAssignment) {
        setAssignmentDetail(null);
        setAnswerForm({});
        return;
      }

      try {
        const detail = await api.getEvaluationAssignment(selectedAssignment);
        setAssignmentDetail(detail);
        setAnswerForm(buildInitialAnswers(detail));
        setStrengthsNote("");
        setDevelopmentNote("");
      } catch (err) {
        setError(err.message);
      }
    }

    loadAssignment();
  }, [selectedAssignment, setError]);

  useEffect(() => {
    setReceivedManagerFeedbackDrafts((current) =>
      Object.fromEntries(
        receivedManagerFeedback.map((feedback) => [
          feedback.id,
          {
            status:
              current[feedback.id]?.status ||
              feedback.revieweeAcknowledgementStatus ||
              FEEDBACK_ACKNOWLEDGEMENT_STATUS.agreed,
            note:
              current[feedback.id]?.note !== undefined
                ? current[feedback.id].note
                : feedback.revieweeAcknowledgementNote || ""
          }
        ])
      )
    );
  }, [receivedManagerFeedback]);

  useEffect(() => {
    const nextCycleId =
      feedbackRequestCycleOptions.find((cycle) => cycle.id === feedbackRequestForm.cycleId)?.id ||
      feedbackRequestCycleOptions[0]?.id ||
      "";

    if (nextCycleId !== feedbackRequestForm.cycleId) {
      setFeedbackRequestForm((current) => ({
        ...current,
        cycleId: nextCycleId
      }));
    }
  }, [feedbackRequestCycleOptions, feedbackRequestForm.cycleId]);

  useEffect(() => {
    const nextLibraryId =
      cycleLibraryOptions.find((library) => library.id === cycleForm.libraryId)?.id ||
      cycleLibraryOptions[0]?.id ||
      "";

    if (nextLibraryId !== cycleForm.libraryId) {
      setCycleForm((current) => ({
        ...current,
        libraryId: nextLibraryId
      }));
    }
  }, [cycleForm.libraryId, cycleLibraryOptions]);

  useEffect(() => {
    if (!canViewEvaluationInsights && activeEvaluationWorkspace === "insights") {
      setActiveEvaluationWorkspace("respond");
    }
  }, [activeEvaluationWorkspace, canViewEvaluationInsights]);

  useEffect(() => {
    if (!canViewEvaluationOperations && activeEvaluationWorkspace === "operations") {
      setActiveEvaluationWorkspace("respond");
    }
  }, [activeEvaluationWorkspace, canViewEvaluationOperations]);

  useEffect(() => {
    if (!evaluationModuleOptions.some((module) => module.key === activeEvaluationModule)) {
      setActiveEvaluationModule(evaluationModuleOptions[0]?.key || "company");
    }
  }, [activeEvaluationModule, evaluationModuleOptions]);

  useEffect(() => {
    const nextCycleId =
      evaluationCycleOptions.find((cycle) => cycle.id === activeEvaluationCycleId)?.id ||
      evaluationCycleOptions.find((cycle) => cycle.status === "Liberado")?.id ||
      evaluationCycleOptions[0]?.id ||
      "";

    if (nextCycleId !== activeEvaluationCycleId) {
      setActiveEvaluationCycleId(nextCycleId);
    }
  }, [activeEvaluationCycleId, evaluationCycleOptions]);

  useEffect(() => {
    const nextComparisonCycleId =
      comparisonCycleOptions.find((cycle) => cycle.id === comparisonEvaluationCycleId)?.id ||
      comparisonCycleOptions[0]?.id ||
      "";

    if (nextComparisonCycleId !== comparisonEvaluationCycleId) {
      setComparisonEvaluationCycleId(nextComparisonCycleId);
    }
  }, [comparisonCycleOptions, comparisonEvaluationCycleId]);

  useEffect(() => {
    const currentAssignment = filteredAssignments.find(
      (assignment) => assignment.id === selectedAssignment
    );

    if (currentAssignment) {
      return;
    }

    const nextAssignment =
      filteredAssignments.find((assignment) => assignment.status === "pending") ||
      filteredAssignments[0] ||
      null;

    setSelectedAssignment(nextAssignment?.id || null);
    if (!nextAssignment) {
      setAssignmentDetail(null);
    }
  }, [filteredAssignments, selectedAssignment]);

  function resetEvaluations() {
    const route = getInitialEvaluationRoute();
    setActiveEvaluationModule(route.evaluationModuleKey || "overview");
    setActiveEvaluationCycleId("");
    setComparisonEvaluationCycleId("");
    setActiveEvaluationWorkspace(route.evaluationWorkspace || "respond");
    setEvaluationCycleStructure(null);
    setEvaluationOperationNotice("");
    setEvaluationOperationWorkUnitFilter("all");
    setEvaluationOperationWorkModeFilter("all");
    setShowEvaluationLibrary(false);
    setSelectedAssignment(null);
    setAssignmentDetail(null);
    setAnswerForm({});
    setStrengthsNote("");
    setDevelopmentNote("");
    setCycleForm(initialCycleForm);
    setFeedbackRequestForm(initialFeedbackRequestForm);
    setReceivedManagerFeedbackDrafts({});
    setCustomLibraryDraft(null);
    setCustomLibraryPublishForm(initialLibraryPublishForm);
  }

  async function handleCycleSubmit(event) {
    event.preventDefault();
    try {
      setError("");
      await api.createEvaluationCycle(cycleForm);
      setCycleForm(initialCycleForm);
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleFeedbackProviderToggle(personId) {
    setFeedbackRequestForm((current) => {
      const exists = current.providerPersonIds.includes(personId);
      if (exists) {
        return {
          ...current,
          providerPersonIds: current.providerPersonIds.filter((item) => item !== personId)
        };
      }

      if (current.providerPersonIds.length >= 3) {
        setError("Selecione no maximo 3 fornecedores de feedback direto.");
        return current;
      }

      return {
        ...current,
        providerPersonIds: [...current.providerPersonIds, personId]
      };
    });
  }

  async function handleFeedbackRequestSubmit(event) {
    event.preventDefault();
    try {
      setError("");
      await api.createFeedbackRequest(feedbackRequestForm);
      setFeedbackRequestForm((current) => ({
        ...initialFeedbackRequestForm,
        cycleId: current.cycleId
      }));
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleFeedbackRequestReview(requestId, status) {
    try {
      setError("");
      await api.reviewFeedbackRequest(requestId, status);
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCycleStatusChange(cycleId, status) {
    try {
      setError("");
      setEvaluationOperationNotice("");
      await api.updateEvaluationCycleStatus(cycleId, status);
      setSelectedAssignment(null);
      setAssignmentDetail(null);
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCycleConfigUpdate(cycleId, payload) {
    try {
      setError("");
      setEvaluationOperationNotice("");
      await api.updateEvaluationCycleConfig(cycleId, payload);
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCycleEnabledToggle(cycleId, isEnabled) {
    await handleCycleConfigUpdate(cycleId, { isEnabled });
  }

  async function handleCycleModuleToggle(cycleId, relationshipType, enabled) {
    await handleCycleConfigUpdate(cycleId, {
      moduleAvailability: { [relationshipType]: enabled }
    });
  }

  async function handleAssignmentSubmit(event) {
    event.preventDefault();

    if (!assignmentDetail) {
      return;
    }

    if (assignmentDetail.assignment.cycleStatus !== "Liberado") {
      setError("As avaliacoes deste ciclo ainda nao estao liberadas para envio.");
      return;
    }

    try {
      const validation = validateEvaluationAnswerForm({
        template: assignmentDetail.template,
        answerForm
      });
      if (!validation.ok) {
        setError(validation.message);
        return;
      }

      setError("");
      await api.submitEvaluation({
        assignmentId: assignmentDetail.assignment.id,
        answers: Object.entries(answerForm).map(([questionId, value]) => ({
          questionId,
          score: Number.isFinite(Number(value.score)) ? Number(value.score) : null,
          evidenceNote: value.evidenceNote || "",
          textValue: value.textValue || "",
          selectedOptions: Array.isArray(value.selectedOptions) ? value.selectedOptions : []
        })),
        strengthsNote,
        developmentNote
      });
      setSelectedAssignment(null);
      setAssignmentDetail(null);
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function setReceivedManagerFeedbackDraft(submissionId, patch) {
    setReceivedManagerFeedbackDrafts((current) => ({
      ...current,
      [submissionId]: {
        ...(current[submissionId] || {}),
        ...patch
      }
    }));
  }

  async function handleReceivedManagerFeedbackSubmit(submissionId) {
    const draft = receivedManagerFeedbackDrafts[submissionId];

    if (!draft?.status) {
      setError("Escolha Concordo ou Discordo antes de enviar.");
      return;
    }

    if (
      draft.status === FEEDBACK_ACKNOWLEDGEMENT_STATUS.disagreed &&
      !String(draft.note || "").trim()
    ) {
      setError("Explique o motivo da discordancia antes de enviar.");
      return;
    }

    try {
      setError("");
      await api.acknowledgeReceivedManagerFeedback(submissionId, {
        status: draft.status,
        note: draft.note || ""
      });
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleNotifyDelinquents(cycleId) {
    try {
      setError("");
      const result = await api.notifyEvaluationCycleDelinquents(cycleId);
      setEvaluationOperationNotice(
        result.notifiedAssignments
          ? `${result.notifiedAssignments} inadimplente(s) notificados no ciclo.`
          : "Nenhum inadimplente pendente para notificacao."
      );
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCustomLibraryImport(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setError("");
      const draft = await api.importCustomLibrary(file);
      setCustomLibraryDraft(draft);
      setCustomLibraryPublishForm({
        name: file.name.replace(/\.(xlsx|csv)$/i, ""),
        description: ""
      });
    } catch (err) {
      setError(err.message);
    } finally {
      event.target.value = "";
    }
  }

  async function handleCustomLibraryTemplateDownload() {
    try {
      setError("");
      await api.downloadCustomLibraryTemplate();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCustomLibraryPublish(event) {
    event.preventDefault();
    if (!customLibraryDraft) {
      return;
    }

    try {
      setError("");
      await api.publishCustomLibrary({
        draftId: customLibraryDraft.id,
        name: customLibraryPublishForm.name,
        description: customLibraryPublishForm.description
      });
      setCustomLibraryDraft(null);
      setCustomLibraryPublishForm(initialLibraryPublishForm);
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCustomLibraryUpdate(libraryId, payload) {
    try {
      setError("");
      await api.updateCustomLibrary(libraryId, payload);
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  return {
    activeCycleModuleSummary,
    activeEvaluationCycleId,
    evaluationCycleStructure,
    activeEvaluationModule,
    activeEvaluationModuleMeta,
    activeEvaluationWorkspace,
    answerForm,
    assignmentDetail,
    comparisonCycleModuleSummary,
    cycleComparisonHighlights,
    comparisonCycleOptions,
    comparisonEvaluationCycleId,
    customLibraryDraft,
    customLibraryPublishForm,
    cycleForm,
    developmentNote,
    evaluationCycleHistory,
    evaluationCycleOptions,
    evaluationOperationNotice,
    evaluationOperationWorkModeFilter,
    evaluationOperationWorkModeOptions,
    evaluationOperationWorkUnitFilter,
    evaluationOperationWorkUnitOptions,
    evaluationModuleOptions,
    feedbackProviderOptions,
    feedbackRequestCycleOptions,
    feedbackRequestForm,
    filteredAggregateResponses,
    filteredAssignments,
    filteredEvaluationCycleStructure,
    filteredFeedbackRequests,
    filteredIndividualResponses,
    filteredReceivedManagerFeedback,
    handleAssignmentSubmit,
    handleCustomLibraryImport,
    handleCustomLibraryUpdate,
    handleCustomLibraryTemplateDownload,
    handleCustomLibraryPublish,
    handleCycleStatusChange,
    handleCycleEnabledToggle,
    handleCycleModuleToggle,
    handleCycleSubmit,
    handleFeedbackProviderToggle,
    handleFeedbackRequestReview,
    handleFeedbackRequestSubmit,
    handleNotifyDelinquents,
    handleReceivedManagerFeedbackSubmit,
    receivedManagerFeedbackDrafts,
    resetEvaluations,
    selectedAssignment,
    setActiveEvaluationCycleId,
    setActiveEvaluationModule,
    setActiveEvaluationWorkspace,
    setAnswerForm,
    setComparisonEvaluationCycleId,
    setCustomLibraryPublishForm,
    setCycleForm,
    setDevelopmentNote,
    setEvaluationOperationWorkModeFilter,
    setEvaluationOperationWorkUnitFilter,
    setFeedbackRequestForm,
    setReceivedManagerFeedbackDraft,
    setSelectedAssignment,
    setShowEvaluationLibrary,
    setStrengthsNote,
    showEvaluationLibrary,
    strengthsNote
  };
}
