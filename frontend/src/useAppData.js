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
  canViewDashboard,
  canReceiveManagerFeedback,
  canViewResponses,
  canViewPerformance360,
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
      const requests = [
        api.getSummary(),
        canViewAuditTrail ? api.getAuditTrail() : Promise.resolve([]),
        dashboardRequest,
        api.getEvaluationTemplate(),
        api.getEvaluationLibrary(),
        api.getCompetencies(),
        api.getAreas(),
        api.getPeople(),
        api.getIncidents(),
        api.getEvaluationCycles(),
        api.getEvaluationAssignments(),
        canReceiveManagerFeedback ? api.getReceivedManagerFeedback() : Promise.resolve([]),
        api.getFeedbackRequests(),
        canViewPerformance360 ? api.getPerformance360Reviews() : Promise.resolve([]),
        api.getApplauseEntries(),
        api.getDevelopmentRecords(),
        api.getDevelopmentPlans(),
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
    canFilterDashboardByArea,
    canViewDashboard,
    canReceiveManagerFeedback,
    canViewResponses,
    canViewPerformance360,
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
