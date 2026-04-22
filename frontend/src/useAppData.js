import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

const emptyResponsesBundle = {
  individualResponses: [],
  aggregateResponses: [],
  cycleAggregateResponses: []
};

export function useAppData({
  user,
  canViewAuditTrail,
  canFilterDashboardByArea,
  canViewComplianceWorkspace,
  canViewDashboard,
  canViewEvaluationWorkspace,
  canViewDevelopmentWorkspace,
  canViewApplauseWorkspace,
  canViewPeople,
  canViewIncidents,
  canManageIncidentQueue,
  canReceiveManagerFeedback,
  canViewResponses,
  canViewPerformance360,
  canViewEvaluationLibrary,
  canViewCompetenciesCatalog,
  canViewUsersAdmin,
  canViewOrganizationDevelopment,
  dashboardAreaFilter,
  dashboardTimeGrouping,
  setError
}) {
  const [summary, setSummary] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [template, setTemplate] = useState(null);
  const [evaluationLibrary, setEvaluationLibrary] = useState(null);
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
  const [loading, setLoading] = useState(true);

  const resetData = useCallback(() => {
    setSummary(null);
    setAuditTrail([]);
    setDashboard(null);
    setTemplate(null);
    setEvaluationLibrary(null);
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
      const dashboardArea =
        canFilterDashboardByArea && dashboardAreaFilter !== "all"
          ? dashboardAreaFilter
          : null;
      const dashboardRequest = canViewDashboard
        ? api.getDashboardOverview(dashboardArea, dashboardTimeGrouping)
        : Promise.resolve(null);
      const competenciesRequest = canViewCompetenciesCatalog
        ? api.getCompetencies()
        : Promise.resolve([]);
      const areasRequest = canViewComplianceWorkspace ? api.getAreas() : Promise.resolve([]);
      const peopleRequest =
        canViewPeople ||
        canManageIncidentQueue ||
        canViewApplauseWorkspace ||
        canViewDevelopmentWorkspace
          ? api.getPeople()
          : Promise.resolve([]);
      const requests = [
        api.getSummary(),
        canViewAuditTrail ? api.getAuditTrail() : Promise.resolve([]),
        dashboardRequest,
        canViewEvaluationWorkspace ? api.getEvaluationTemplate() : Promise.resolve(null),
        canViewEvaluationLibrary
          ? api.getEvaluationLibrary()
          : Promise.resolve(null),
        competenciesRequest,
        areasRequest,
        peopleRequest,
        canViewIncidents ? api.getIncidents() : Promise.resolve([]),
        canViewEvaluationWorkspace ? api.getEvaluationCycles() : Promise.resolve([]),
        canViewEvaluationWorkspace ? api.getEvaluationAssignments() : Promise.resolve([]),
        canReceiveManagerFeedback ? api.getReceivedManagerFeedback() : Promise.resolve([]),
        canViewEvaluationWorkspace ? api.getFeedbackRequests() : Promise.resolve([]),
        canViewPerformance360 ? api.getPerformance360Reviews() : Promise.resolve([]),
        canViewApplauseWorkspace ? api.getApplauseEntries() : Promise.resolve([]),
        canViewDevelopmentWorkspace ? api.getDevelopmentRecords() : Promise.resolve([]),
        canViewDevelopmentWorkspace ? api.getDevelopmentPlans() : Promise.resolve([]),
        canViewOrganizationDevelopment ? api.getLearningIntegrationEvents() : Promise.resolve([])
      ];

      if (canViewUsersAdmin) {
        requests.push(api.getUsers());
      }

      if (canViewResponses) {
        requests.push(api.getEvaluationResponses());
      }

      const result = await Promise.all(requests);
      const [
        nextSummary,
        nextAuditTrail,
        nextDashboard,
        nextTemplate,
        nextLibrary,
        nextCompetencies,
        nextAreas,
        nextPeople,
        nextIncidents,
        nextCycles,
        nextAssignments,
        nextReceivedManagerFeedback,
        nextFeedbackRequests,
        nextPerformance360Reviews,
        nextApplause,
        nextDevelopment,
        nextDevelopmentPlans,
        nextLearningIntegrationEvents
      ] = result;
      let resultIndex = 18;
      const nextUsers = canViewUsersAdmin ? result[resultIndex++] : [];
      const nextResponses = canViewResponses ? result[resultIndex] : emptyResponsesBundle;

      setSummary(nextSummary);
      setAuditTrail(nextAuditTrail);
      setDashboard(nextDashboard);
      setTemplate(nextTemplate);
      setEvaluationLibrary(nextLibrary);
      setCompetencies(nextCompetencies);
      setAreas(nextAreas);
      setPeople(nextPeople);
      setUsers(nextUsers);
      setIncidents(nextIncidents);
      setCycles(nextCycles);
      setAssignments(nextAssignments);
      setReceivedManagerFeedback(nextReceivedManagerFeedback);
      setFeedbackRequests(nextFeedbackRequests);
      setPerformance360Reviews(nextPerformance360Reviews);
      setApplauseEntries(nextApplause);
      setDevelopmentRecords(nextDevelopment);
      setDevelopmentPlans(nextDevelopmentPlans);
      setLearningIntegrationEvents(nextLearningIntegrationEvents);
      setResponsesBundle(nextResponses);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    canViewAuditTrail,
    canManageIncidentQueue,
    canViewComplianceWorkspace,
    canViewCompetenciesCatalog,
    canFilterDashboardByArea,
    canViewIncidents,
    canViewPeople,
    canViewDashboard,
    canViewEvaluationWorkspace,
    canViewDevelopmentWorkspace,
    canViewApplauseWorkspace,
    canReceiveManagerFeedback,
    canViewResponses,
    canViewPerformance360,
    canViewEvaluationLibrary,
    canViewUsersAdmin,
    canViewOrganizationDevelopment,
    dashboardAreaFilter,
    dashboardTimeGrouping,
    resetData,
    setError,
    user
  ]);

  useEffect(() => {
    if (!user) {
      resetData();
      return;
    }

    reloadData();
  }, [reloadData, resetData, user]);

  return {
    auditTrail,
    applauseEntries,
    areas,
    assignments,
    cycles,
    competencies,
    dashboard,
    developmentPlans,
    developmentRecords,
    evaluationLibrary,
    feedbackRequests,
    incidents,
    loading,
    learningIntegrationEvents,
    people,
    performance360Reviews,
    receivedManagerFeedback,
    reloadData,
    resetData,
    responsesBundle,
    summary,
    template,
    users
  };
}
