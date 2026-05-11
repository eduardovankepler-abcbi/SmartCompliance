import { useCallback, useEffect, useState } from "react";

import { api } from "./api.js";

const emptyResponsesBundle = {
  submissions: [],
  responses: [],
  reviewersById: {},
  peopleById: {},
  cyclesById: {},
  questionnairesById: {},
  questionnaireQuestionsById: {},
};

function optionalRequest(label, request, fallback) {
  return { label, request, fallback };
}

async function resolveOptionalRequest({ label, request, fallback }) {
  try {
    const value = await Promise.resolve(request);
    return { label, value: value ?? fallback, failed: false };
  } catch (error) {
    return {
      label,
      value: fallback,
      failed: true,
      message: error?.message || "Falha ao carregar dados",
    };
  }
}

export function useAppData({
  user,
  canViewDashboard,
  canViewAuditTrail,
  canViewIncidents,
  canViewEvaluationWorkspace,
  canViewApplauseWorkspace,
  canViewDevelopmentWorkspace,
  canViewPerformance360,
  canViewUsersAdmin,
  dashboardAreaFilter = "all",
  dashboardTimeGrouping = "semester",
  setError
}) {
  const [summary, setSummary] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [template, setTemplate] = useState(null);
  const [evaluationLibrary, setEvaluationLibrary] = useState([]);
  const [competencies, setCompetencies] = useState([]);
  const [areas, setAreas] = useState([]);
  const [people, setPeople] = useState([]);
  const [users, setUsers] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [receivedManagerFeedback, setReceivedManagerFeedback] = useState([]);
  const [feedbackRequests, setFeedbackRequests] = useState([]);
  const [responsesBundle, setResponsesBundle] = useState(emptyResponsesBundle);
  const [performance360Reviews, setPerformance360Reviews] = useState([]);
  const [applauseEntries, setApplauseEntries] = useState([]);
  const [developmentRecords, setDevelopmentRecords] = useState([]);
  const [developmentPlans, setDevelopmentPlans] = useState([]);
  const [learningIntegrationEvents, setLearningIntegrationEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const resetData = useCallback(() => {
    setSummary(null);
    setAuditTrail([]);
    setDashboard(null);
    setTemplate(null);
    setEvaluationLibrary([]);
    setCompetencies([]);
    setAreas([]);
    setPeople([]);
    setUsers([]);
    setIncidents([]);
    setCycles([]);
    setAssignments([]);
    setReceivedManagerFeedback([]);
    setFeedbackRequests([]);
    setResponsesBundle(emptyResponsesBundle);
    setPerformance360Reviews([]);
    setApplauseEntries([]);
    setDevelopmentRecords([]);
    setDevelopmentPlans([]);
    setLearningIntegrationEvents([]);
    setLoading(false);
  }, []);

  const reloadData = useCallback(async () => {
    if (!user) {
      resetData();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const nextSummary = await api.getSummary();
      const normalizedDashboardAreaFilter =
        dashboardAreaFilter === "all" ? null : dashboardAreaFilter;

      const optionalRequests = [
        optionalRequest("auditoria", canViewAuditTrail ? api.getAuditTrail() : [], []),
        optionalRequest(
          "dashboard",
          canViewDashboard
            ? api.getDashboardOverview(normalizedDashboardAreaFilter, dashboardTimeGrouping)
            : null,
          null
        ),
        optionalRequest(
          "template de avaliacao",
          canViewEvaluationWorkspace ? api.getEvaluationTemplate() : null,
          null
        ),
        optionalRequest(
          "biblioteca de avaliacao",
          canViewEvaluationWorkspace ? api.getEvaluationLibrary() : [],
          []
        ),
        optionalRequest("competencias", api.getCompetencies(), []),
        optionalRequest("areas", api.getAreas(), []),
        optionalRequest("pessoas", api.getPeople(), []),
        optionalRequest("incidentes", canViewIncidents ? api.getIncidents() : [], []),
        optionalRequest(
          "ciclos de avaliacao",
          canViewEvaluationWorkspace ? api.getEvaluationCycles() : [],
          []
        ),
        optionalRequest(
          "assignments",
          canViewEvaluationWorkspace ? api.getEvaluationAssignments() : [],
          []
        ),
        optionalRequest(
          "feedbacks recebidos",
          canViewEvaluationWorkspace ? api.getReceivedManagerFeedback() : [],
          []
        ),
        optionalRequest(
          "solicitacoes de feedback",
          canViewEvaluationWorkspace ? api.getFeedbackRequests() : [],
          []
        ),
        optionalRequest(
          "leituras 360",
          canViewEvaluationWorkspace ? api.getEvaluationResponses() : emptyResponsesBundle,
          emptyResponsesBundle
        ),
        optionalRequest(
          "performance 360",
          canViewPerformance360 ? api.getPerformance360Reviews() : [],
          []
        ),
        optionalRequest("aplausos", canViewApplauseWorkspace ? api.getApplauseEntries() : [], []),
        optionalRequest(
          "registros de desenvolvimento",
          canViewDevelopmentWorkspace ? api.getDevelopmentRecords() : [],
          []
        ),
        optionalRequest(
          "planos de desenvolvimento",
          canViewDevelopmentWorkspace ? api.getDevelopmentPlans() : [],
          []
        ),
        optionalRequest(
          "integracoes de aprendizagem",
          canViewDevelopmentWorkspace ? api.getLearningIntegrationEvents() : [],
          []
        ),
      ];

      if (canViewUsersAdmin) {
        optionalRequests.push(optionalRequest("usuarios", api.getUsers(), []));
      }

      const optionalResults = await Promise.all(optionalRequests.map(resolveOptionalRequest));
      const failures = optionalResults.filter((entry) => entry.failed);
      const values = optionalResults.map((entry) => entry.value);

      let index = 0;
      const nextAuditTrail = values[index++];
      const nextDashboard = values[index++];
      const nextTemplate = values[index++];
      const nextEvaluationLibrary = values[index++];
      const nextCompetencies = values[index++];
      const nextAreas = values[index++];
      const nextPeople = values[index++];
      const nextIncidents = values[index++];
      const nextCycles = values[index++];
      const nextAssignments = values[index++];
      const nextReceivedManagerFeedback = values[index++];
      const nextFeedbackRequests = values[index++];
      const nextResponsesBundle = values[index++];
      const nextPerformance360Reviews = values[index++];
      const nextApplauseEntries = values[index++];
      const nextDevelopmentRecords = values[index++];
      const nextDevelopmentPlans = values[index++];
      const nextLearningIntegrationEvents = values[index++];
      const nextUsers = canViewUsersAdmin ? values[index++] : [];

      setSummary(nextSummary);
      setAuditTrail(nextAuditTrail);
      setDashboard(nextDashboard);
      setTemplate(nextTemplate);
      setEvaluationLibrary(nextEvaluationLibrary);
      setCompetencies(nextCompetencies);
      setAreas(nextAreas);
      setPeople(nextPeople);
      setUsers(nextUsers);
      setIncidents(nextIncidents);
      setCycles(nextCycles);
      setAssignments(nextAssignments);
      setReceivedManagerFeedback(nextReceivedManagerFeedback);
      setFeedbackRequests(nextFeedbackRequests);
      setResponsesBundle(nextResponsesBundle || emptyResponsesBundle);
      setPerformance360Reviews(
        Array.isArray(nextPerformance360Reviews) ? nextPerformance360Reviews : []
      );
      setApplauseEntries(nextApplauseEntries);
      setDevelopmentRecords(nextDevelopmentRecords);
      setDevelopmentPlans(nextDevelopmentPlans);
      setLearningIntegrationEvents(nextLearningIntegrationEvents);

      if (failures.length > 0) {
        const labels = failures.map((entry) => entry.label).join(", ");
        setError(`Alguns dados nao puderam ser carregados: ${labels}.`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    user,
    resetData,
    setError,
    canViewApplauseWorkspace,
    canViewAuditTrail,
    canViewDashboard,
    canViewDevelopmentWorkspace,
    canViewEvaluationWorkspace,
    canViewIncidents,
    canViewPerformance360,
    canViewUsersAdmin,
    dashboardAreaFilter,
    dashboardTimeGrouping
  ]);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  return {
    summary,
    auditTrail,
    dashboard,
    template,
    evaluationLibrary,
    competencies,
    areas,
    people,
    users,
    incidents,
    cycles,
    assignments,
    receivedManagerFeedback,
    feedbackRequests,
    responsesBundle,
    performance360Reviews,
    applauseEntries,
    developmentRecords,
    developmentPlans,
    learningIntegrationEvents,
    loading,
    reloadData,
    resetData,
  };
}
