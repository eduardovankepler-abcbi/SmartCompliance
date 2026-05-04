import { useState } from "react";
import { api } from "./api.js";
import {
  buildAppSceneProps
} from "./appSceneProps.js";
import {
  demoAccounts,
  developmentPlanStatusOptions,
  developmentRecordTypes,
  developmentViewLabels,
  emptyCycle,
  emptyFeedbackRequest,
  emptyLibraryPublish,
  emptyLogin,
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
  getFeedbackRequestStatusLabel,
  getRelationshipDescription,
  getRelationshipLabel,
  getRoleLabel,
  getVisibilityLabel
} from "./appLabels.js";
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
  HeatmapMatrixCard,
  MetricCard,
  ResponseDistributionChartCard,
  TrendAreaChartCard
} from "./components/DashboardWidgets";
import { Input, Select, Textarea } from "./components/FormControls";
import { AppSceneRenderer } from "./AppSceneRenderer";
import { useAppActions } from "./useAppActions";
import { useEvaluations } from "./evaluations/useEvaluations";
import { useDashboardFilters, useDashboardInsights } from "./useDashboardFlow";
import { useAppShellFlow } from "./useAppShellFlow";
import { AppShell, ThemeGlyph } from "./layout/AppShell";
import { LoginScreen } from "./LoginScreen.jsx";
import { useAppData } from "./useAppData";
import { useDevelopmentFlow } from "./useDevelopmentFlow";
import { useOperationsFlow } from "./useOperationsFlow";
import { useRegistryFlow } from "./useRegistryFlow";
import { useSession } from "./useSession";

export default function App() {
  const [error, setError] = useState("");
  const navigateToSection = (...args) => setActiveSection(...args);

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
    canViewComplianceWorkspace,
    canViewEvaluationWorkspace,
    canViewDevelopmentWorkspace,
    canViewApplauseWorkspace,
    canViewPeople,
    canManagePeopleRegistry,
    canViewUsersAdmin,
    canViewDashboard,
    canViewAuditTrail,
    canViewIncidents,
    canManageIncidentQueue,
    canViewResponses,
    canReceiveManagerFeedback,
    canViewEvaluationInsights,
    canViewEvaluationLibrary,
    canViewCompetenciesCatalog,
    canManageApplause,
    canManageDevelopmentScope,
    canFilterDashboardByArea,
    canViewTeamDevelopment,
    canViewOrganizationDevelopment
  } = capabilities;
  const canViewEvaluationOperations =
    canManageCycles || canManageFeedbackRequests || canViewEvaluationLibrary;

  const {
    dashboardAreaFilter,
    dashboardCompositionFilter,
    resetDashboardFlow,
    dashboardTimeGrouping,
    setDashboardAreaFilter,
    setDashboardCompositionFilter,
    setDashboardTimeGrouping
  } = useDashboardFilters();

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
    learningIntegrationEvents,
    loading,
    people,
    performance360Reviews,
    receivedManagerFeedback,
    reloadData,
    resetData,
    responsesBundle,
    summary,
    users
  } = useAppData({
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
    canViewPerformance360: capabilities.canViewPerformance360,
    canViewEvaluationLibrary,
    canViewCompetenciesCatalog,
    canViewUsersAdmin,
    canViewOrganizationDevelopment,
    dashboardAreaFilter,
    dashboardTimeGrouping,
    setError
  });

  const {
    dashboardCompositionOptions,
    dashboardTimeGroupingLabel,
    dashboardTimeGroupingOptions,
    filteredDashboardEvaluationMix,
    filteredDashboardEvaluationResultsSummary,
    filteredDashboardResponseDistributions,
    selectedDashboardCompositionMeta
  } = useDashboardInsights({
    canFilterDashboardByArea,
    dashboard,
    dashboardAreaFilter,
    dashboardCompositionFilter,
    dashboardTimeGrouping,
    setDashboardAreaFilter
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
    handleCustomLibraryPublish,
    handleForceCrossFunctionalPairing,
    handleBlockCrossFunctionalPairing,
    handleTransversalConfigSubmit,
    handleTransversalUnitOverrideRemove,
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
    setTransversalOverrideForm,
    setTransversalConfigForm,
    setSelectedAssignment,
    setShowEvaluationLibrary,
    setStrengthsNote,
    showEvaluationLibrary,
    strengthsNote,
    transversalOverrideForm,
    transversalConfigForm
  } = useEvaluations({
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
    initialCycleForm: emptyCycle,
    initialFeedbackRequestForm: emptyFeedbackRequest,
    initialLibraryPublishForm: emptyLibraryPublish
  });

  const {
    accessJourneySummary,
    areaForm,
    areaOptions,
    availableUserPeopleOptions,
    handleAreaSubmit,
    handleAreaUpdate,
    handlePersonSubmit,
    handlePersonUpdate,
    handleUserPersonSelect,
    handleUserSubmit,
    handleUserUpdate,
    managerOptions,
    pendingAccessPeople,
    personAccessStateById,
    personForm,
    prepareUserProvisioning,
    resetRegistryForms,
    selectedUserPerson,
    setAreaForm,
    setPersonForm,
    setUserForm,
    suggestedUserEmail,
    suggestedUserRole,
    suggestedUserRoleReason,
    userForm
  } = useRegistryFlow({
    areas,
    people,
    reloadData,
    setActiveSection: navigateToSection,
    setError,
    users
  });

  const {
    activeDevelopmentView,
    developmentAuditEntries,
    developmentEditablePeopleOptions,
    developmentEditablePlanPeopleOptions,
    developmentForm,
    developmentFormPeopleOptions,
    developmentHighlights,
    developmentMetrics,
    developmentPerformanceSummary,
    developmentPlanCompetencyOptions,
    developmentPlanCycleOptions,
    developmentPlanForm,
    developmentPlanPeopleOptions,
    developmentPlanProgressStatusOptions,
    developmentViewOptions,
    filteredDevelopmentPlans,
    filteredDevelopmentRecords,
    handleDevelopmentPlanSubmit,
    handleDevelopmentPlanProgressUpdate,
    handleDevelopmentPlanUpdate,
    handleDevelopmentSubmit,
    handleDevelopmentUpdate,
    handleLearningIntegrationApply,
    learningIntegrationPeopleOptions,
    learningIntegrationReviewItems,
    learningIntegrationSummary,
    resetDevelopmentFlow,
    setActiveDevelopmentView,
    setDevelopmentForm,
    setLearningIntegrationDraft,
    setDevelopmentPlanForm
  } = useDevelopmentFlow({
    auditTrail,
    canManageDevelopmentScope,
    canViewOrganizationDevelopment,
    canViewTeamDevelopment,
    competencies,
    cycles,
    developmentPlans,
    developmentRecords,
    learningIntegrationEvents,
    people,
    performance360Reviews,
    reloadData,
    setError,
    user
  });

  const {
    applauseAuditEntries,
    applauseForm,
    applausePeopleOptions,
    handleApplauseSubmit,
    handleApplauseUpdate,
    handleIncidentSubmit,
    handleIncidentUpdate,
    incidentAuditEntries,
    incidentAreaOptions,
    incidentForm,
    incidentResponsibleOptions,
    resetOperationsFlow,
    setApplauseForm,
    setIncidentForm
  } = useOperationsFlow({
    areas,
    auditTrail,
    people,
    reloadData,
    setActiveSection: navigateToSection,
    setError,
    user
  });

  const {
    activeSection,
    groupedSections,
    setActiveSection,
    shellStatusLabel,
    theme,
    toggleTheme
  } = useAppShellFlow({
    activeEvaluationModule,
    activeEvaluationWorkspace,
    canViewApplauseWorkspace,
    canViewComplianceWorkspace,
    canViewDashboard,
    canViewDevelopmentWorkspace,
    canViewEvaluationInsights,
    canViewEvaluationOperations,
    canViewEvaluationWorkspace,
    canViewPeople,
    canViewUsersAdmin,
    navigationGroups,
    roleKey: user?.roleKey,
    sections,
    setActiveEvaluationModule,
    setActiveEvaluationWorkspace,
    summaryMode: summary?.mode
  });
  const { handleCompetencyCreate, handleCompetencyUpdate, handleLogout } = useAppActions({
    logoutSession,
    reloadData,
    resetDashboardFlow,
    resetData,
    resetDevelopmentFlow,
    resetEvaluations,
    resetOperationsFlow,
    resetRegistryForms,
    setError
  });

  const {
    applauseSceneProps,
    complianceSceneProps,
    dashboardSceneProps,
    developmentSceneProps,
    evaluationsSceneProps,
    peopleSceneProps,
    usersSceneProps
  } = buildAppSceneProps({
    auditTrail,
    user,
    widgets: {
      BarMetricRow,
      ColumnMetricCard,
      DashboardDonut,
      FunnelSeriesChart,
      HeatmapMatrixCard,
      MetricCard,
      ResponseDistributionChartCard,
      TrendAreaChartCard
    },
    controls: { Input, Select, Textarea },
    adminCards: {
      ApplauseAdminCard,
      AreaAdminCard,
      DevelopmentPlanAdminCard,
      DevelopmentRecordAdminCard,
      IncidentQueueCard,
      PersonStructureCard,
      UserAdminCard
    },
    dashboardState: {
      dashboardAreaFilter,
      dashboardCompositionFilter,
      dashboardCompositionOptions,
      dashboardTimeGrouping,
      dashboardTimeGroupingLabel,
      dashboardTimeGroupingOptions,
      filteredDashboardEvaluationMix,
      filteredDashboardEvaluationResultsSummary,
      filteredDashboardResponseDistributions,
      selectedDashboardCompositionMeta,
      setDashboardAreaFilter,
      setDashboardCompositionFilter,
      setDashboardTimeGrouping
    },
    evaluationsState: {
      activeCycleModuleSummary,
      activeEvaluationCycleId,
      activeEvaluationModule,
      activeEvaluationModuleMeta,
      activeEvaluationWorkspace,
      answerForm,
      assignmentDetail,
      comparisonCycleModuleSummary,
      comparisonCycleOptions,
      comparisonEvaluationCycleId,
      customLibraryDraft,
      customLibraryPublishForm,
      cycleComparisonHighlights,
      cycleForm,
      developmentNote,
      evaluationCycleHistory,
      evaluationCycleOptions,
      evaluationCycleStructure,
      evaluationModuleOptions,
      evaluationOperationNotice,
      evaluationOperationWorkModeFilter,
      evaluationOperationWorkModeOptions,
      evaluationOperationWorkUnitFilter,
      evaluationOperationWorkUnitOptions,
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
      handleBlockCrossFunctionalPairing,
      handleCustomLibraryImport,
      handleCustomLibraryPublish,
      handleCustomLibraryUpdate,
      handleCycleEnabledToggle,
      handleCycleModuleToggle,
      handleCycleStatusChange,
      handleCycleSubmit,
      handleFeedbackProviderToggle,
      handleFeedbackRequestReview,
      handleFeedbackRequestSubmit,
      handleForceCrossFunctionalPairing,
      handleNotifyDelinquents,
      handleReceivedManagerFeedbackSubmit,
      handleTransversalConfigSubmit,
      handleTransversalUnitOverrideRemove,
      receivedManagerFeedbackDrafts,
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
      setTransversalConfigForm,
      setTransversalOverrideForm,
      showEvaluationLibrary,
      strengthsNote,
      transversalConfigForm,
      transversalOverrideForm
    },
    developmentState: {
      activeDevelopmentView,
      developmentAuditEntries,
      developmentEditablePeopleOptions,
      developmentEditablePlanPeopleOptions,
      developmentForm,
      developmentFormPeopleOptions,
      developmentHighlights,
      developmentMetrics,
      developmentPerformanceSummary,
      developmentPlanCompetencyOptions,
      developmentPlanCycleOptions,
      developmentPlanForm,
      developmentPlanPeopleOptions,
      developmentPlanProgressStatusOptions,
      developmentViewOptions,
      filteredDevelopmentPlans,
      filteredDevelopmentRecords,
      handleDevelopmentPlanProgressUpdate,
      handleDevelopmentPlanSubmit,
      handleDevelopmentPlanUpdate,
      handleDevelopmentSubmit,
      handleDevelopmentUpdate,
      handleLearningIntegrationApply,
      learningIntegrationPeopleOptions,
      learningIntegrationReviewItems,
      learningIntegrationSummary,
      setActiveDevelopmentView,
      setDevelopmentForm,
      setDevelopmentPlanForm,
      setLearningIntegrationDraft
    },
    operationsState: {
      applauseAuditEntries,
      applauseForm,
      applausePeopleOptions,
      handleApplauseSubmit,
      handleApplauseUpdate,
      handleIncidentSubmit,
      handleIncidentUpdate,
      incidentAuditEntries,
      incidentAreaOptions,
      incidentForm,
      incidentResponsibleOptions,
      setApplauseForm,
      setIncidentForm
    },
    registryState: {
      accessJourneySummary,
      areaForm,
      areaOptions,
      availableUserPeopleOptions,
      handleAreaSubmit,
      handleAreaUpdate,
      handlePersonSubmit,
      handlePersonUpdate,
      handleUserPersonSelect,
      handleUserSubmit,
      handleUserUpdate,
      managerOptions,
      pendingAccessPeople,
      personAccessStateById,
      personForm,
      prepareUserProvisioning,
      selectedUserPerson,
      setAreaForm,
      setPersonForm,
      setUserForm,
      suggestedUserEmail,
      suggestedUserRole,
      suggestedUserRoleReason,
      userForm
    },
    sharedData: {
      applauseEntries,
      areas,
      competencies,
      cycles,
      dashboard,
      evaluationLibrary,
      incidents,
      people,
      performance360Reviews,
      summary,
      users
    },
    sharedHandlers: {
      handleCompetencyCreate,
      handleCompetencyUpdate,
      setActiveSection
    },
    labels: {
      formatDate,
      getAssignmentStatusLabel,
      getCycleStatusDescription,
      getDevelopmentTrackLabel,
      getFeedbackRequestStatusLabel,
      getRelationshipDescription,
      getRelationshipLabel,
      getVisibilityLabel
    },
    options: {
      developmentPlanStatusOptions,
      developmentRecordTypes,
      developmentViewLabels,
      incidentClassificationOptions,
      incidentStatusOptions,
      userRoleOptions,
      userStatusOptions
    },
    apiHandlers: {
      downloadCustomLibraryTemplate: api.downloadCustomLibraryTemplate
    },
    capabilities: {
      canFilterDashboardByArea,
      canManageApplause,
      canManageCycles,
      canManageFeedbackRequests,
      canManageIncidentQueue,
      canManagePeopleRegistry,
      canViewAuditTrail,
      canViewEvaluationInsights,
      canViewEvaluationLibrary,
      canViewEvaluationOperations,
      canViewIncidents,
      canViewResponses
    }
  });

  if (authLoading) {
    return <div className="center-screen">Validando sessao...</div>;
  }

  if (!user) {
    return (
      <LoginScreen
        Input={Input}
        ThemeGlyph={ThemeGlyph}
        authError={authError}
        demoAccounts={demoAccounts}
        handleLogin={handleLogin}
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        theme={theme}
        toggleTheme={toggleTheme}
      />
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
      profileArea={user?.person?.area || "-"}
      profileName={user?.person?.name || "Usuario"}
      profileRoleLabel={getRoleLabel(user.roleKey)}
      statusLabel={shellStatusLabel}
      theme={theme}
    >
      <AppSceneRenderer
        activeCycleModuleSummary={activeCycleModuleSummary}
        activeSection={activeSection}
        applauseProps={applauseSceneProps}
        complianceProps={complianceSceneProps}
        dashboardProps={dashboardSceneProps}
        developmentProps={developmentSceneProps}
        evaluationsProps={evaluationsSceneProps}
        loading={loading}
        peopleProps={peopleSceneProps}
        usersProps={usersSceneProps}
      />
    </AppShell>
  );
}


