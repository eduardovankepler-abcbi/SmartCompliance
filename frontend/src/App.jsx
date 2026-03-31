import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import {
  academicDevelopmentTypes,
  demoAccounts,
  developmentPlanStatusOptions,
  developmentRecordTypes,
  developmentViewLabels,
  emptyApplause,
  emptyArea,
  emptyCycle,
  emptyDevelopment,
  emptyDevelopmentPlan,
  emptyFeedbackRequest,
  emptyIncident,
  emptyLibraryPublish,
  emptyLogin,
  emptyPerson,
  emptyUser,
  evaluationModules,
  feedbackRequestStatusOptions,
  incidentClassificationOptions,
  incidentStatusOptions,
  navigationGroups,
  sections,
  userRoleOptions,
  userStatusOptions
} from "./appConfig.js";
import {
  formatDate,
  getAssignmentStatusLabel,
  getCycleStatusDescription,
  getDevelopmentTrackLabel,
  getEvaluationModule,
  getFeedbackRequestStatusLabel,
  getRelationshipDescription,
  getRelationshipLabel,
  getRoleLabel,
  getVisibilityLabel
} from "./appLabels.js";
import { buildAppHash, parseAppHash } from "./appRoute";
import {
  ApplauseAdminCard,
  AreaAdminCard,
  DevelopmentPlanAdminCard,
  DevelopmentRecordAdminCard,
  IncidentQueueCard,
  PersonStructureCard,
  UserAdminCard
} from "./components/AdminCards";
import {
  BarMetricRow,
  ColumnMetricCard,
  DashboardDonut,
  FunnelSeriesChart,
  MetricCard,
  ResponseDistributionChartCard
} from "./components/DashboardWidgets";
import { Input, Select, Textarea } from "./components/FormControls";
import { EvaluationsSection } from "./evaluations/EvaluationsSection";
import { useEvaluations } from "./evaluations/useEvaluations";
import { AppShell, ThemeGlyph } from "./layout/AppShell";
import {
  getFallbackSectionKey,
  getPreferredSectionKey,
  getSectionStatusLabel,
  getVisibleSections
} from "./navigation";
import {
  ApplauseSection,
  ComplianceSection,
  DashboardSection,
  DevelopmentSection,
  PeopleSection,
  UsersSection
} from "./sections/AppSections";
import { useAppData } from "./useAppData";
import { useSession } from "./useSession";

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window === "undefined") {
      return "Dashboard";
    }
    return parseAppHash(window.location.hash, {
      fallbackSectionKey: "Dashboard",
      canViewEvaluationInsights: false
    }).sectionKey;
  });
  const [activeDevelopmentView, setActiveDevelopmentView] = useState("personal");
  const [dashboardAreaFilter, setDashboardAreaFilter] = useState("all");
  const [dashboardCompositionFilter, setDashboardCompositionFilter] = useState("all");
  const [dashboardTimeGrouping, setDashboardTimeGrouping] = useState("semester");
  const [error, setError] = useState("");
  const [incidentForm, setIncidentForm] = useState(emptyIncident);
  const [areaForm, setAreaForm] = useState(emptyArea);
  const [personForm, setPersonForm] = useState(emptyPerson);
  const [userForm, setUserForm] = useState(emptyUser);
  const [applauseForm, setApplauseForm] = useState(emptyApplause);
  const [developmentForm, setDevelopmentForm] = useState(emptyDevelopment);
  const [developmentPlanForm, setDevelopmentPlanForm] = useState(emptyDevelopmentPlan);

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  const {
    authError,
    authLoading,
    capabilities,
    handleLogin,
    loginForm,
    logoutSession,
    setLoginForm,
    user
  } = useSession(emptyLogin);

  const {
    canManageCycles,
    canManageFeedbackRequests,
    canViewPeople,
    canManagePeopleRegistry,
    canViewUsersAdmin,
    canViewDashboard,
    canViewAuditTrail,
    canViewIncidents,
    canManageIncidentQueue,
    canViewResponses,
    canViewEvaluationInsights,
    canViewEvaluationLibrary,
    canManageApplause,
    canManageDevelopmentScope,
    canFilterDashboardByArea,
    canViewTeamDevelopment,
    canViewOrganizationDevelopment
  } = capabilities;
  const canViewEvaluationOperations =
    canManageCycles || canManageFeedbackRequests || canViewEvaluationLibrary;

  const {
    auditTrail,
    applauseEntries,
    areas,
    assignments,
    competencies,
    cycles,
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
    users
  } = useAppData({
    user,
    canViewAuditTrail,
    canFilterDashboardByArea,
    canViewDashboard,
    canViewResponses,
    canViewUsersAdmin,
    dashboardAreaFilter,
    dashboardTimeGrouping,
    setError
  });

  const {
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
  } = useEvaluations({
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
    initialCycleForm: emptyCycle,
    initialFeedbackRequestForm: emptyFeedbackRequest,
    initialLibraryPublishForm: emptyLibraryPublish
  });

  const visibleSections = useMemo(
    () =>
      getVisibleSections(sections, {
        roleKey: user?.roleKey,
        canViewDashboard,
        canViewPeople,
        canViewUsersAdmin
      }),
    [canViewDashboard, canViewPeople, canViewUsersAdmin, user?.roleKey]
  );

  const preferredSectionKey = useMemo(
    () => getPreferredSectionKey(user?.roleKey, canViewDashboard ? "Dashboard" : "Avaliacoes"),
    [canViewDashboard, user?.roleKey]
  );

  const groupedSections = useMemo(
    () =>
      navigationGroups
        .map((group) => ({
          ...group,
          sections: visibleSections.filter((section) => section.group === group.key)
        }))
        .filter((group) => group.sections.length > 0),
    [visibleSections]
  );

  const fallbackSectionKey = useMemo(
    () => getFallbackSectionKey(visibleSections, preferredSectionKey),
    [preferredSectionKey, visibleSections]
  );

  const shellStatusLabel = useMemo(
    () =>
      getSectionStatusLabel({
        activeSection,
        roleKey: user?.roleKey,
        summaryMode: summary?.mode
      }),
    [activeSection, summary?.mode, user?.roleKey]
  );

  useEffect(() => {
    if (!visibleSections.some((section) => section.key === activeSection)) {
      setActiveSection(fallbackSectionKey);
    }
  }, [activeSection, fallbackSectionKey, visibleSections]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const applyHashRoute = () => {
      const nextRoute = parseAppHash(window.location.hash, {
        fallbackSectionKey,
        canViewEvaluationInsights,
        canViewEvaluationOperations
      });

      if (nextRoute.sectionKey) {
        setActiveSection((current) =>
          nextRoute.sectionKey !== current ? nextRoute.sectionKey : current
        );
      }

      if (nextRoute.sectionKey === "Avaliacoes" && nextRoute.evaluationModuleKey) {
        setActiveEvaluationModule((current) =>
          nextRoute.evaluationModuleKey !== current ? nextRoute.evaluationModuleKey : current
        );
      }

      if (nextRoute.sectionKey === "Avaliacoes" && nextRoute.evaluationWorkspace) {
        setActiveEvaluationWorkspace((current) =>
          nextRoute.evaluationWorkspace !== current ? nextRoute.evaluationWorkspace : current
        );
      }
    };

    window.addEventListener("hashchange", applyHashRoute);
    applyHashRoute();

    return () => window.removeEventListener("hashchange", applyHashRoute);
  }, [canViewEvaluationInsights, canViewEvaluationOperations, fallbackSectionKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const nextHash = buildAppHash({
      sectionKey: activeSection,
      evaluationModuleKey: activeEvaluationModule,
      evaluationWorkspace: activeEvaluationWorkspace,
      canViewEvaluationInsights,
      canViewEvaluationOperations
    });

    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
  }, [
    activeEvaluationModule,
    activeEvaluationWorkspace,
    activeSection,
    canViewEvaluationInsights,
    canViewEvaluationOperations
  ]);

  const peopleOptions = useMemo(
    () => people.map((person) => ({ value: person.id, label: person.name })),
    [people]
  );

  const areaOptions = useMemo(
    () => areas.map((area) => ({ value: area.name, label: area.name })),
    [areas]
  );

  const managerOptions = useMemo(
    () => [{ value: "", label: "Sem gestor definido" }, ...peopleOptions],
    [peopleOptions]
  );

  const incidentAreaOptions = useMemo(
    () => areas.map((area) => ({ value: area.name, label: area.name })),
    [areas]
  );

  const incidentResponsibleOptions = useMemo(
    () => [
      { value: "", label: "Nao definido", area: "", isAreaManager: false },
      ...people.map((person) => ({
        value: person.id,
        label: `${person.name} · ${person.area}`,
        area: person.area,
        isAreaManager: person.areaManagerPersonId === person.id
      }))
    ],
    [people]
  );

  const availableUserPeopleOptions = useMemo(() => {
    const linkedPersonIds = new Set(users.map((item) => item.personId));
    return peopleOptions.filter((person) => !linkedPersonIds.has(person.value));
  }, [peopleOptions, users]);

  const developmentPeopleOptions = useMemo(() => {
    if (canManageDevelopmentScope) {
      return peopleOptions;
    }
    return peopleOptions.filter((person) => person.value === user?.person?.id);
  }, [canManageDevelopmentScope, peopleOptions, user]);

  const applausePeopleOptions = useMemo(
    () => peopleOptions.filter((person) => person.value !== user?.person?.id),
    [peopleOptions, user]
  );

  const teamDevelopmentPeopleOptions = useMemo(
    () =>
      developmentPeopleOptions.filter(
        (person) =>
          people.find((item) => item.id === person.value)?.managerPersonId === user?.person?.id
      ),
    [developmentPeopleOptions, people, user]
  );

  const developmentViewOptions = useMemo(() => {
    const views = [{ key: "personal", ...developmentViewLabels.personal }];
    if (canViewTeamDevelopment) {
      views.push({ key: "team", ...developmentViewLabels.team });
    }
    if (canViewOrganizationDevelopment) {
      views.push({ key: "organization", ...developmentViewLabels.organization });
    }
    return views;
  }, [canViewOrganizationDevelopment, canViewTeamDevelopment]);

  const filteredDevelopmentRecords = useMemo(() => {
    if (!user) {
      return [];
    }

    if (activeDevelopmentView === "organization") {
      return developmentRecords;
    }

    if (activeDevelopmentView === "team") {
      const visibleIds = new Set(teamDevelopmentPeopleOptions.map((person) => person.value));
      return developmentRecords.filter((record) => visibleIds.has(record.personId));
    }

    return developmentRecords.filter((record) => record.personId === user.person.id);
  }, [
    activeDevelopmentView,
    developmentRecords,
    teamDevelopmentPeopleOptions,
    user
  ]);

  const filteredDevelopmentPlans = useMemo(() => {
    if (!user) {
      return [];
    }

    if (activeDevelopmentView === "organization") {
      return developmentPlans;
    }

    if (activeDevelopmentView === "team") {
      const visibleIds = new Set(teamDevelopmentPeopleOptions.map((person) => person.value));
      return developmentPlans.filter((plan) => visibleIds.has(plan.personId));
    }

    return developmentPlans.filter((plan) => plan.personId === user.person.id);
  }, [activeDevelopmentView, developmentPlans, teamDevelopmentPeopleOptions, user]);

  const activeDevelopmentRecords = useMemo(
    () => filteredDevelopmentRecords.filter((record) => (record.status || "active") !== "archived"),
    [filteredDevelopmentRecords]
  );

  const developmentFormPeopleOptions = useMemo(() => {
    if (!user) {
      return [];
    }

    if (activeDevelopmentView === "organization") {
      return developmentPeopleOptions;
    }

    if (activeDevelopmentView === "team") {
      return teamDevelopmentPeopleOptions;
    }

    return developmentPeopleOptions.filter((person) => person.value === user.person.id);
  }, [
    activeDevelopmentView,
    developmentPeopleOptions,
    teamDevelopmentPeopleOptions,
    user
  ]);

  const developmentEditablePeopleOptions = useMemo(() => {
    const visiblePeople = new Map();
    filteredDevelopmentRecords.forEach((record) => {
      if (!visiblePeople.has(record.personId)) {
        visiblePeople.set(record.personId, {
          value: record.personId,
          label: record.personName
        });
      }
    });

    developmentFormPeopleOptions.forEach((person) => {
      if (!visiblePeople.has(person.value)) {
        visiblePeople.set(person.value, person);
      }
    });

    return Array.from(visiblePeople.values());
  }, [developmentFormPeopleOptions, filteredDevelopmentRecords]);

  const developmentPlanPeopleOptions = useMemo(() => {
    if (!user) {
      return [];
    }

    if (activeDevelopmentView === "organization") {
      return developmentPeopleOptions;
    }

    if (activeDevelopmentView === "team") {
      return teamDevelopmentPeopleOptions;
    }

    return developmentPeopleOptions.filter((person) => person.value === user.person.id);
  }, [activeDevelopmentView, developmentPeopleOptions, teamDevelopmentPeopleOptions, user]);

  const developmentEditablePlanPeopleOptions = useMemo(() => {
    const visiblePeople = new Map();
    filteredDevelopmentPlans.forEach((plan) => {
      if (!visiblePeople.has(plan.personId)) {
        visiblePeople.set(plan.personId, {
          value: plan.personId,
          label: plan.personName
        });
      }
    });

    developmentPlanPeopleOptions.forEach((person) => {
      if (!visiblePeople.has(person.value)) {
        visiblePeople.set(person.value, person);
      }
    });

    return Array.from(visiblePeople.values());
  }, [developmentPlanPeopleOptions, filteredDevelopmentPlans]);

  const developmentPlanCycleOptions = useMemo(
    () => [
      { value: "", label: "Sem ciclo vinculado" },
      ...cycles.map((cycle) => ({
        value: cycle.id,
        label: `${cycle.title} · ${cycle.semesterLabel}`
      }))
    ],
    [cycles]
  );

  const developmentPlanCompetencyOptions = useMemo(
    () => [
      { value: "", label: "Competencia livre" },
      ...competencies.map((competency) => ({
        value: competency.id,
        label: competency.name
      }))
    ],
    [competencies]
  );

  const developmentMetrics = useMemo(() => {
    const peopleInScope = new Set(activeDevelopmentRecords.map((record) => record.personId)).size;
    const academicRecords = activeDevelopmentRecords.filter((record) =>
      academicDevelopmentTypes.has(record.recordType)
    ).length;
    const certificationRecords = activeDevelopmentRecords.filter(
      (record) => record.recordType === "Certificacao"
    ).length;
    const continuousLearningRecords = activeDevelopmentRecords.filter(
      (record) =>
        !academicDevelopmentTypes.has(record.recordType) &&
        record.recordType !== "Certificacao"
    ).length;

    return [
      { label: "Registros no recorte", value: activeDevelopmentRecords.length },
      { label: "Formacao academica", value: academicRecords },
      { label: "Certificacoes", value: certificationRecords },
      {
        label: activeDevelopmentView === "personal" ? "Pessoas em foco" : "Pessoas no recorte",
        value: peopleInScope
      },
      { label: "Aprendizagem continua", value: continuousLearningRecords }
    ];
  }, [activeDevelopmentView, activeDevelopmentRecords]);

  const developmentHighlights = useMemo(
    () =>
      Object.values(
        activeDevelopmentRecords.reduce((acc, record) => {
          const entry = acc[record.personId] || {
            personId: record.personId,
            personName: record.personName,
            totalRecords: 0,
            academicRecords: 0,
            latestDate: "",
            latestTitle: ""
          };

          entry.totalRecords += 1;
          if (academicDevelopmentTypes.has(record.recordType)) {
            entry.academicRecords += 1;
          }
          if (!entry.latestDate || new Date(record.completedAt) > new Date(entry.latestDate)) {
            entry.latestDate = record.completedAt;
            entry.latestTitle = record.title;
          }

          acc[record.personId] = entry;
          return acc;
        }, {})
      ).sort((left, right) => right.totalRecords - left.totalRecords),
    [activeDevelopmentRecords]
  );

  const developmentAuditEntries = useMemo(
    () => auditTrail.filter((item) => item.category === "development"),
    [auditTrail]
  );

  const applauseAuditEntries = useMemo(
    () => auditTrail.filter((item) => item.category === "applause"),
    [auditTrail]
  );

  const dashboardCompositionOptions = useMemo(
    () => [
      { value: "all", label: "Todos os elementos do ciclo" },
      ...evaluationModules
        .filter((module) => module.relationshipType)
        .map((module) => ({
          value: module.relationshipType,
          label: module.label
        }))
    ],
    []
  );

  const dashboardTimeGroupingOptions = useMemo(
    () => [
      { value: "semester", label: "Semestre" },
      { value: "quarter", label: "Trimestre" },
      { value: "year", label: "Ano" }
    ],
    []
  );

  const filteredDashboardEvaluationMix = useMemo(() => {
    if (!dashboard?.evaluationMix) {
      return [];
    }

    if (dashboardCompositionFilter === "all") {
      return dashboard.evaluationMix;
    }

    return dashboard.evaluationMix.filter((item) => item.type === dashboardCompositionFilter);
  }, [dashboard, dashboardCompositionFilter]);

  const filteredDashboardResponseDistributions = useMemo(() => {
    if (!dashboard?.responseDistributions) {
      return [];
    }

    if (dashboardCompositionFilter === "all") {
      return dashboard.responseDistributions;
    }

    return dashboard.responseDistributions.filter(
      (group) => group.relationshipType === dashboardCompositionFilter
    );
  }, [dashboard, dashboardCompositionFilter]);

  const selectedDashboardCompositionMeta = useMemo(
    () => (dashboardCompositionFilter === "all" ? null : getEvaluationModule(dashboardCompositionFilter)),
    [dashboardCompositionFilter]
  );

  const dashboardTimeGroupingLabel = useMemo(
    () =>
      dashboardTimeGroupingOptions.find((item) => item.value === dashboardTimeGrouping)?.label ||
      dashboardTimeGrouping,
    [dashboardTimeGrouping, dashboardTimeGroupingOptions]
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!developmentViewOptions.some((view) => view.key === activeDevelopmentView)) {
      setActiveDevelopmentView(developmentViewOptions[0]?.key || "personal");
    }
  }, [activeDevelopmentView, developmentViewOptions]);

  useEffect(() => {
    if (!areaForm.managerPersonId && managerOptions.length) {
      setAreaForm((current) => ({
        ...current,
        managerPersonId: current.managerPersonId || ""
      }));
    }
  }, [areaForm.managerPersonId, managerOptions]);

  useEffect(() => {
    if (!areas.length) {
      return;
    }

    if (!areaOptions.some((option) => option.value === personForm.area)) {
      setPersonForm((current) => ({
        ...current,
        area: areaOptions[0]?.value || ""
      }));
    }
  }, [areaOptions, areas.length, personForm.area]);

  useEffect(() => {
    if (!incidentAreaOptions.length) {
      return;
    }

    if (!incidentAreaOptions.some((option) => option.value === incidentForm.responsibleArea)) {
      const nextArea = incidentAreaOptions[0]?.value || "";
      const nextResponsible =
        incidentResponsibleOptions.find((item) => item.area === nextArea && item.isAreaManager)
          ?.value || "";

      setIncidentForm((current) => ({
        ...current,
        responsibleArea: nextArea,
        assignedPersonId: current.assignedPersonId || nextResponsible
      }));
    }
  }, [
    incidentAreaOptions,
    incidentForm.responsibleArea,
    incidentResponsibleOptions,
    setIncidentForm
  ]);

  useEffect(() => {
    const nextPersonId =
      availableUserPeopleOptions.find((person) => person.value === userForm.personId)?.value ||
      availableUserPeopleOptions[0]?.value ||
      "";

    if (nextPersonId !== userForm.personId) {
      setUserForm((current) => ({
        ...current,
        personId: nextPersonId
      }));
    }
  }, [availableUserPeopleOptions, userForm.personId]);

  useEffect(() => {
    if (!canFilterDashboardByArea && dashboardAreaFilter !== "all") {
      setDashboardAreaFilter("all");
      return;
    }

    if (
      canFilterDashboardByArea &&
      dashboardAreaFilter !== "all" &&
      dashboard?.areaOptions?.length &&
      !dashboard.areaOptions.includes(dashboardAreaFilter)
    ) {
      setDashboardAreaFilter("all");
    }
  }, [canFilterDashboardByArea, dashboard, dashboardAreaFilter]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const nextReceiverId =
      applausePeopleOptions.find((person) => person.value === applauseForm.receiverPersonId)?.value ||
      applausePeopleOptions[0]?.value ||
      "";

    if (nextReceiverId !== applauseForm.receiverPersonId) {
      setApplauseForm((current) => ({
        ...current,
        receiverPersonId: nextReceiverId
      }));
    }
  }, [applauseForm.receiverPersonId, applausePeopleOptions, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const nextPersonId =
      developmentFormPeopleOptions.find((person) => person.value === developmentForm.personId)
        ?.value ||
      developmentFormPeopleOptions[0]?.value ||
      user.person.id;

    if (nextPersonId !== developmentForm.personId) {
      setDevelopmentForm((current) => ({
        ...current,
        personId: nextPersonId
      }));
    }
  }, [developmentForm.personId, developmentFormPeopleOptions, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const nextPersonId =
      developmentPlanPeopleOptions.find((person) => person.value === developmentPlanForm.personId)
        ?.value ||
      developmentPlanPeopleOptions[0]?.value ||
      user.person.id;

    if (nextPersonId !== developmentPlanForm.personId) {
      setDevelopmentPlanForm((current) => ({
        ...current,
        personId: nextPersonId
      }));
    }
  }, [developmentPlanForm.personId, developmentPlanPeopleOptions, user]);

  function handleLogout() {
    logoutSession();
    resetEvaluations();
    resetData();
    setAreaForm(emptyArea);
    setPersonForm(emptyPerson);
    setUserForm(emptyUser);
    setDevelopmentPlanForm(emptyDevelopmentPlan);
  }

  async function handleIncidentSubmit(event) {
    event.preventDefault();
    try {
      setError("");
      await api.createIncident(incidentForm);
      setIncidentForm(emptyIncident);
      await reloadData();
      setActiveSection("Compliance");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handlePersonSubmit(event) {
    event.preventDefault();
    try {
      setError("");
      await api.createPerson({
        ...personForm,
        managerPersonId: personForm.managerPersonId || null
      });
      setPersonForm(emptyPerson);
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAreaSubmit(event) {
    event.preventDefault();
    try {
      setError("");
      await api.createArea({
        ...areaForm,
        managerPersonId: areaForm.managerPersonId || null
      });
      setAreaForm(emptyArea);
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAreaUpdate(areaId, payload) {
    try {
      setError("");
      await api.updateArea(areaId, payload);
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handlePersonUpdate(personId, payload) {
    try {
      setError("");
      await api.updatePerson(personId, payload);
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUserSubmit(event) {
    event.preventDefault();
    try {
      setError("");
      await api.createUser(userForm);
      setUserForm((current) => ({
        ...emptyUser,
        personId: current.personId,
        password: "demo123"
      }));
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUserUpdate(userId, payload) {
    try {
      setError("");
      await api.updateUser(userId, payload);
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleIncidentUpdate(incidentId, payload) {
    try {
      setError("");
      await api.updateIncident(incidentId, payload);
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleApplauseSubmit(event) {
    event.preventDefault();
    try {
      setError("");
      await api.createApplauseEntry(applauseForm);
      setApplauseForm((current) => ({
        ...emptyApplause,
        receiverPersonId: current.receiverPersonId
      }));
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleApplauseUpdate(applauseId, payload) {
    try {
      setError("");
      await api.updateApplauseEntry(applauseId, payload);
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDevelopmentSubmit(event) {
    event.preventDefault();
    try {
      setError("");
      await api.createDevelopmentRecord(developmentForm);
      setDevelopmentForm((current) => ({
        ...emptyDevelopment,
        personId: current.personId
      }));
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDevelopmentUpdate(recordId, payload) {
    try {
      setError("");
      await api.updateDevelopmentRecord(recordId, payload);
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDevelopmentPlanSubmit(event) {
    event.preventDefault();
    try {
      setError("");
      await api.createDevelopmentPlan({
        ...developmentPlanForm,
        cycleId: developmentPlanForm.cycleId || null,
        competencyId: developmentPlanForm.competencyId || null
      });
      setDevelopmentPlanForm((current) => ({
        ...emptyDevelopmentPlan,
        personId: current.personId
      }));
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDevelopmentPlanUpdate(planId, payload) {
    try {
      setError("");
      await api.updateDevelopmentPlan(planId, {
        ...payload,
        cycleId: payload.cycleId || null,
        competencyId: payload.competencyId || null
      });
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCompetencyCreate(payload) {
    try {
      setError("");
      await api.createCompetency(payload);
      await reloadData();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function handleCompetencyUpdate(competencyId, payload) {
    try {
      setError("");
      await api.updateCompetency(competencyId, payload);
      await reloadData();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  if (authLoading) {
    return <div className="center-screen">Validando sessao...</div>;
  }

  if (!user) {
    return (
      <div className="login-shell">
        <div className="login-backdrop" />
        <button
          type="button"
          className="theme-icon-button login-theme-button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
          title={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
        >
          <ThemeGlyph theme={theme} />
        </button>
        <form className="login-card" onSubmit={handleLogin}>
          <p className="eyebrow">Smart Compliance</p>
          <h1>Governanca com presenca executiva</h1>
          <p className="muted hero-copy">
            Um painel unico para etica, reputacao interna, desenvolvimento e feedback continuo.
          </p>
          <Input
            label="Email"
            value={loginForm.email}
            onChange={(value) => setLoginForm({ ...loginForm, email: value })}
          />
          <Input
            label="Senha"
            type="password"
            value={loginForm.password}
            onChange={(value) => setLoginForm({ ...loginForm, password: value })}
          />
          {authError ? <div className="error-banner">{authError}</div> : null}
          <button className="primary-button" type="submit">
            Entrar no ambiente
          </button>
          <div className="stack-list login-accounts">
            <strong>Contas demo</strong>
            {demoAccounts.map((item) => (
              <p className="muted" key={item}>
                {item}
              </p>
            ))}
          </div>
        </form>
      </div>
    );
  }

  return (
    <AppShell
      activeSection={activeSection}
      error={error}
      groupedSections={groupedSections}
      loading={loading}
      onLogout={handleLogout}
      onRefresh={reloadData}
      onSectionChange={setActiveSection}
      onToggleTheme={toggleTheme}
      profileArea={user.person.area}
      profileName={user.person.name}
      profileRoleLabel={getRoleLabel(user.roleKey)}
      statusLabel={shellStatusLabel}
      theme={theme}
    >
        {!loading && activeSection === "Dashboard" ? (
          <DashboardSection
            BarMetricRow={BarMetricRow}
            ColumnMetricCard={ColumnMetricCard}
            DashboardDonut={DashboardDonut}
            FunnelSeriesChart={FunnelSeriesChart}
            MetricCard={MetricCard}
            ResponseDistributionChartCard={ResponseDistributionChartCard}
            Select={Select}
            canFilterDashboardByArea={canFilterDashboardByArea}
            dashboard={dashboard}
            dashboardAreaFilter={dashboardAreaFilter}
            dashboardCompositionFilter={dashboardCompositionFilter}
            dashboardCompositionOptions={dashboardCompositionOptions}
            dashboardTimeGrouping={dashboardTimeGrouping}
            dashboardTimeGroupingLabel={dashboardTimeGroupingLabel}
            dashboardTimeGroupingOptions={dashboardTimeGroupingOptions}
            filteredDashboardEvaluationMix={filteredDashboardEvaluationMix}
            filteredDashboardResponseDistributions={filteredDashboardResponseDistributions}
            getAssignmentStatusLabel={getAssignmentStatusLabel}
            getRelationshipDescription={getRelationshipDescription}
            getRelationshipLabel={getRelationshipLabel}
            selectedDashboardCompositionMeta={selectedDashboardCompositionMeta}
            setDashboardAreaFilter={setDashboardAreaFilter}
            setDashboardCompositionFilter={setDashboardCompositionFilter}
            setDashboardTimeGrouping={setDashboardTimeGrouping}
            summary={summary}
          />
        ) : null}

        {!loading && activeSection === "Compliance" ? (
          <ComplianceSection
            IncidentQueueCard={IncidentQueueCard}
            Input={Input}
            Select={Select}
            Textarea={Textarea}
            auditEntries={auditTrail.filter((item) => item.category === "incident")}
            canManageIncidentQueue={canManageIncidentQueue}
            canViewIncidents={canViewIncidents}
            formatDate={formatDate}
            handleIncidentSubmit={handleIncidentSubmit}
            handleIncidentUpdate={handleIncidentUpdate}
            incidentAreaOptions={incidentAreaOptions}
            incidentClassificationOptions={incidentClassificationOptions}
            incidentStatusOptions={incidentStatusOptions}
            incidentForm={incidentForm}
            incidents={incidents}
            incidentResponsibleOptions={incidentResponsibleOptions}
            roleKey={user.roleKey}
            setIncidentForm={setIncidentForm}
          />
        ) : null}

        {!loading && activeSection === "Avaliacoes" ? (
          <EvaluationsSection
            Input={Input}
            Select={Select}
            Textarea={Textarea}
            activeCycleModuleSummary={activeCycleModuleSummary}
            activeEvaluationCycleId={activeEvaluationCycleId}
            evaluationCycleStructure={evaluationCycleStructure}
            activeEvaluationModule={activeEvaluationModule}
            activeEvaluationModuleMeta={activeEvaluationModuleMeta}
            activeEvaluationWorkspace={activeEvaluationWorkspace}
            auditEntries={auditTrail.filter(
              (item) =>
                item.category === "cycle" || item.category === "feedback_request"
            )}
            answerForm={answerForm}
            assignmentDetail={assignmentDetail}
            canManageCycles={canManageCycles}
            canManageFeedbackRequests={canManageFeedbackRequests}
            canViewEvaluationInsights={canViewEvaluationInsights}
            canViewEvaluationLibrary={canViewEvaluationLibrary}
            canViewEvaluationOperations={canViewEvaluationOperations}
            canViewResponses={canViewResponses}
            comparisonCycleModuleSummary={comparisonCycleModuleSummary}
            cycleComparisonHighlights={cycleComparisonHighlights}
            comparisonCycleOptions={comparisonCycleOptions}
            comparisonEvaluationCycleId={comparisonEvaluationCycleId}
            competencies={competencies}
            customLibraryDraft={customLibraryDraft}
            customLibraryPublishForm={customLibraryPublishForm}
            cycleForm={cycleForm}
            cycles={cycles}
            developmentNote={developmentNote}
            evaluationCycleHistory={evaluationCycleHistory}
            evaluationCycleOptions={evaluationCycleOptions}
            evaluationLibrary={evaluationLibrary}
            evaluationModuleOptions={evaluationModuleOptions}
            feedbackProviderOptions={feedbackProviderOptions}
            feedbackRequestCycleOptions={feedbackRequestCycleOptions}
            feedbackRequestForm={feedbackRequestForm}
            filteredAggregateResponses={filteredAggregateResponses}
            filteredAssignments={filteredAssignments}
            filteredFeedbackRequests={filteredFeedbackRequests}
            filteredIndividualResponses={filteredIndividualResponses}
            formatDate={formatDate}
            getCycleStatusDescription={getCycleStatusDescription}
            getFeedbackRequestStatusLabel={getFeedbackRequestStatusLabel}
            getRelationshipDescription={getRelationshipDescription}
            getRelationshipLabel={getRelationshipLabel}
            getVisibilityLabel={getVisibilityLabel}
            handleAssignmentSubmit={handleAssignmentSubmit}
            handleCompetencyCreate={handleCompetencyCreate}
            handleCompetencyUpdate={handleCompetencyUpdate}
            handleCustomLibraryImport={handleCustomLibraryImport}
            handleCustomLibraryTemplateDownload={api.downloadCustomLibraryTemplate}
            handleCustomLibraryPublish={handleCustomLibraryPublish}
            handleCycleStatusChange={handleCycleStatusChange}
            handleCycleSubmit={handleCycleSubmit}
            handleFeedbackProviderToggle={handleFeedbackProviderToggle}
            handleFeedbackRequestReview={handleFeedbackRequestReview}
            handleFeedbackRequestSubmit={handleFeedbackRequestSubmit}
            roleKey={user.roleKey}
            selectedAssignment={selectedAssignment}
            setActiveEvaluationCycleId={setActiveEvaluationCycleId}
            setActiveEvaluationModule={setActiveEvaluationModule}
            setActiveEvaluationWorkspace={setActiveEvaluationWorkspace}
            setAnswerForm={setAnswerForm}
            setComparisonEvaluationCycleId={setComparisonEvaluationCycleId}
            setCustomLibraryPublishForm={setCustomLibraryPublishForm}
            setCycleForm={setCycleForm}
            setDevelopmentNote={setDevelopmentNote}
            setFeedbackRequestForm={setFeedbackRequestForm}
            setSelectedAssignment={setSelectedAssignment}
            setShowEvaluationLibrary={setShowEvaluationLibrary}
            setStrengthsNote={setStrengthsNote}
            showEvaluationLibrary={showEvaluationLibrary}
            strengthsNote={strengthsNote}
          />
        ) : null}

        {!loading && activeSection === "Desenvolvimento" ? (
          <DevelopmentSection
            auditEntries={developmentAuditEntries}
            canViewAuditTrail={canViewAuditTrail}
            DevelopmentPlanAdminCard={DevelopmentPlanAdminCard}
            DevelopmentRecordAdminCard={DevelopmentRecordAdminCard}
            Input={Input}
            MetricCard={MetricCard}
            Select={Select}
            Textarea={Textarea}
            activeDevelopmentView={activeDevelopmentView}
            developmentForm={developmentForm}
            developmentPlanForm={developmentPlanForm}
            developmentPlanCycleOptions={developmentPlanCycleOptions}
            developmentPlanCompetencyOptions={developmentPlanCompetencyOptions}
            developmentPlanPeopleOptions={developmentPlanPeopleOptions}
            developmentPlanStatusOptions={developmentPlanStatusOptions}
            developmentFormPeopleOptions={developmentFormPeopleOptions}
            developmentHighlights={developmentHighlights}
            developmentMetrics={developmentMetrics}
            developmentPlans={filteredDevelopmentPlans}
            developmentRecordTypes={developmentRecordTypes}
            developmentEditablePlanPeopleOptions={developmentEditablePlanPeopleOptions}
            developmentEditablePeopleOptions={developmentEditablePeopleOptions}
            developmentViewLabels={developmentViewLabels}
            developmentViewOptions={developmentViewOptions}
            filteredDevelopmentRecords={filteredDevelopmentRecords}
            formatDate={formatDate}
            getDevelopmentTrackLabel={getDevelopmentTrackLabel}
            handleDevelopmentPlanSubmit={handleDevelopmentPlanSubmit}
            handleDevelopmentPlanUpdate={handleDevelopmentPlanUpdate}
            handleDevelopmentSubmit={handleDevelopmentSubmit}
            handleDevelopmentUpdate={handleDevelopmentUpdate}
            roleKey={user.roleKey}
            setActiveDevelopmentView={setActiveDevelopmentView}
            setDevelopmentForm={setDevelopmentForm}
            setDevelopmentPlanForm={setDevelopmentPlanForm}
          />
        ) : null}

        {!loading && activeSection === "Aplause" ? (
          <ApplauseSection
            ApplauseAdminCard={ApplauseAdminCard}
            Input={Input}
            Select={Select}
            Textarea={Textarea}
            auditEntries={applauseAuditEntries}
            applauseEntries={applauseEntries}
            applauseForm={applauseForm}
            applausePeopleOptions={applausePeopleOptions}
            canManageApplause={canManageApplause}
            canViewAuditTrail={canViewAuditTrail}
            formatDate={formatDate}
            handleApplauseSubmit={handleApplauseSubmit}
            handleApplauseUpdate={handleApplauseUpdate}
            roleKey={user.roleKey}
            setApplauseForm={setApplauseForm}
          />
        ) : null}

        {!loading && activeSection === "Pessoas" ? (
          <PeopleSection
            AreaAdminCard={AreaAdminCard}
            Input={Input}
            PersonStructureCard={PersonStructureCard}
            Select={Select}
            canManagePeopleRegistry={canManagePeopleRegistry}
            areaForm={areaForm}
            areaOptions={areaOptions}
            areas={areas}
            handleAreaSubmit={handleAreaSubmit}
            handleAreaUpdate={handleAreaUpdate}
            handlePersonSubmit={handlePersonSubmit}
            handlePersonUpdate={handlePersonUpdate}
            managerOptions={managerOptions}
            people={people}
            personForm={personForm}
            setAreaForm={setAreaForm}
            setPersonForm={setPersonForm}
          />
        ) : null}

        {!loading && activeSection === "Usuarios" ? (
          <UsersSection
            Input={Input}
            Select={Select}
            UserAdminCard={UserAdminCard}
            auditEntries={auditTrail.filter((item) => item.category === "user")}
            availableUserPeopleOptions={availableUserPeopleOptions}
            formatDate={formatDate}
            handleUserSubmit={handleUserSubmit}
            handleUserUpdate={handleUserUpdate}
            setUserForm={setUserForm}
            userForm={userForm}
            userRoleOptions={userRoleOptions}
            userStatusOptions={userStatusOptions}
            users={users}
          />
        ) : null}
    </AppShell>
  );
}


