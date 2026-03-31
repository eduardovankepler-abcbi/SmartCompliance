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
  canViewResponses,
  canViewUsersAdmin,
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
  const [feedbackRequests, setFeedbackRequests] = useState([]);
  const [responsesBundle, setResponsesBundle] = useState(emptyResponsesBundle);
  const [applauseEntries, setApplauseEntries] = useState([]);
  const [developmentRecords, setDevelopmentRecords] = useState([]);
  const [developmentPlans, setDevelopmentPlans] = useState([]);
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
    setFeedbackRequests([]);
    setResponsesBundle(emptyResponsesBundle);
    setApplauseEntries([]);
    setDevelopmentRecords([]);
    setDevelopmentPlans([]);
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
        api.getFeedbackRequests(),
        api.getApplauseEntries(),
        api.getDevelopmentRecords(),
        api.getDevelopmentPlans()
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
        nextFeedbackRequests,
        nextApplause,
        nextDevelopment,
        nextDevelopmentPlans
      ] = result;
      let resultIndex = 15;
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
      setFeedbackRequests(nextFeedbackRequests);
      setApplauseEntries(nextApplause);
      setDevelopmentRecords(nextDevelopment);
      setDevelopmentPlans(nextDevelopmentPlans);
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
    canViewResponses,
    canViewUsersAdmin,
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
    people,
    reloadData,
    resetData,
    responsesBundle,
    summary,
    template,
    users
  };
}
