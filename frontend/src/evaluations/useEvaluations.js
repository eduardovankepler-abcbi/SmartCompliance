import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { parseAppHash } from "../appRoute";
import { evaluationModules } from "../appConfig.js";
import { validateEvaluationAnswerForm } from "./validation.js";

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
  const [showEvaluationLibrary, setShowEvaluationLibrary] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentDetail, setAssignmentDetail] = useState(null);
  const [answerForm, setAnswerForm] = useState({});
  const [strengthsNote, setStrengthsNote] = useState("");
  const [developmentNote, setDevelopmentNote] = useState("");
  const [cycleForm, setCycleForm] = useState(initialCycleForm);
  const [feedbackRequestForm, setFeedbackRequestForm] = useState(initialFeedbackRequestForm);
  const [customLibraryDraft, setCustomLibraryDraft] = useState(null);
  const [customLibraryPublishForm, setCustomLibraryPublishForm] = useState(
    initialLibraryPublishForm
  );
  const individualResponses = responsesBundle?.individualResponses || [];
  const cycleAggregateResponses = responsesBundle?.cycleAggregateResponses || [];

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

  const visibleEvaluationModules = useMemo(
    () =>
      canViewEvaluationInsights
        ? evaluationModules
        : evaluationModules.filter((module) => module.relationshipType),
    [canViewEvaluationInsights]
  );

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
    setShowEvaluationLibrary(false);
    setSelectedAssignment(null);
    setAssignmentDetail(null);
    setAnswerForm({});
    setStrengthsNote("");
    setDevelopmentNote("");
    setCycleForm(initialCycleForm);
    setFeedbackRequestForm(initialFeedbackRequestForm);
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
      await api.updateEvaluationCycleStatus(cycleId, status);
      setSelectedAssignment(null);
      setAssignmentDetail(null);
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
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
    evaluationModuleOptions,
    feedbackProviderOptions,
    feedbackRequestCycleOptions,
    feedbackRequestForm,
    filteredAggregateResponses,
    filteredAssignments,
    filteredFeedbackRequests,
    filteredIndividualResponses,
    handleAssignmentSubmit,
    handleCustomLibraryImport,
    handleCustomLibraryTemplateDownload,
    handleCustomLibraryPublish,
    handleCycleStatusChange,
    handleCycleSubmit,
    handleFeedbackProviderToggle,
    handleFeedbackRequestReview,
    handleFeedbackRequestSubmit,
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
    setFeedbackRequestForm,
    setSelectedAssignment,
    setShowEvaluationLibrary,
    setStrengthsNote,
    showEvaluationLibrary,
    strengthsNote
  };
}
