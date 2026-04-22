import { useState } from "react";
import { api } from "./api.js";
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

  const evaluationAuditEntries = auditTrail.filter(
    (item) => item.category === "cycle" || item.category === "feedback_request"
  );
  const userAuditEntries = auditTrail.filter((item) => item.category === "user");

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
      profileArea={user?.person?.area || "-"}
      profileName={user?.person?.name || "Usuario"}
      profileRoleLabel={getRoleLabel(user.roleKey)}
      statusLabel={shellStatusLabel}
      theme={theme}
    >
      <AppSceneRenderer
        activeCycleModuleSummary={activeCycleModuleSummary}
        activeDevelopmentView={activeDevelopmentView}
        activeEvaluationCycleId={activeEvaluationCycleId}
        activeEvaluationModule={activeEvaluationModule}
        activeEvaluationModuleMeta={activeEvaluationModuleMeta}
        activeEvaluationWorkspace={activeEvaluationWorkspace}
        activeSection={activeSection}
        accessJourneySummary={accessJourneySummary}
        answerForm={answerForm}
        applauseAuditEntries={applauseAuditEntries}
        applauseEntries={applauseEntries}
        applauseForm={applauseForm}
        applausePeopleOptions={applausePeopleOptions}
        areaForm={areaForm}
        areaOptions={areaOptions}
        areas={areas}
        assignmentDetail={assignmentDetail}
        availableUserPeopleOptions={availableUserPeopleOptions}
        BarMetricRow={BarMetricRow}
        canFilterDashboardByArea={canFilterDashboardByArea}
        canManageApplause={canManageApplause}
        canManageCycles={canManageCycles}
        canManageFeedbackRequests={canManageFeedbackRequests}
        canManageIncidentQueue={canManageIncidentQueue}
        canManagePeopleRegistry={canManagePeopleRegistry}
        canViewAuditTrail={canViewAuditTrail}
        canViewEvaluationInsights={canViewEvaluationInsights}
        canViewEvaluationLibrary={canViewEvaluationLibrary}
        canViewEvaluationOperations={canViewEvaluationOperations}
        canViewIncidents={canViewIncidents}
        canViewResponses={canViewResponses}
        ColumnMetricCard={ColumnMetricCard}
        comparisonCycleModuleSummary={comparisonCycleModuleSummary}
        comparisonCycleOptions={comparisonCycleOptions}
        comparisonEvaluationCycleId={comparisonEvaluationCycleId}
        competencies={competencies}
        customLibraryDraft={customLibraryDraft}
        customLibraryPublishForm={customLibraryPublishForm}
        cycleComparisonHighlights={cycleComparisonHighlights}
        cycleForm={cycleForm}
        cycles={cycles}
        dashboard={dashboard}
        dashboardAreaFilter={dashboardAreaFilter}
        dashboardCompositionFilter={dashboardCompositionFilter}
        dashboardCompositionOptions={dashboardCompositionOptions}
        dashboardTimeGrouping={dashboardTimeGrouping}
        dashboardTimeGroupingLabel={dashboardTimeGroupingLabel}
        dashboardTimeGroupingOptions={dashboardTimeGroupingOptions}
        DashboardDonut={DashboardDonut}
        HeatmapMatrixCard={HeatmapMatrixCard}
        onSectionChange={setActiveSection}
        profileName={user?.person?.name || "Usuario"}
        developmentAuditEntries={developmentAuditEntries}
        developmentForm={developmentForm}
        developmentEditablePeopleOptions={developmentEditablePeopleOptions}
        developmentEditablePlanPeopleOptions={developmentEditablePlanPeopleOptions}
        developmentFormPeopleOptions={developmentFormPeopleOptions}
        developmentHighlights={developmentHighlights}
        developmentMetrics={developmentMetrics}
        developmentPerformanceSummary={developmentPerformanceSummary}
        developmentNote={developmentNote}
        developmentPlanCompetencyOptions={developmentPlanCompetencyOptions}
        developmentPlanCycleOptions={developmentPlanCycleOptions}
        developmentPlanForm={developmentPlanForm}
        developmentPlanPeopleOptions={developmentPlanPeopleOptions}
        developmentPlanProgressStatusOptions={developmentPlanProgressStatusOptions}
        developmentPlanStatusOptions={developmentPlanStatusOptions}
        developmentRecordTypes={developmentRecordTypes}
        developmentViewLabels={developmentViewLabels}
        developmentViewOptions={developmentViewOptions}
        learningIntegrationPeopleOptions={learningIntegrationPeopleOptions}
        learningIntegrationReviewItems={learningIntegrationReviewItems}
        learningIntegrationSummary={learningIntegrationSummary}
        performance360Reviews={performance360Reviews}
        DevelopmentPlanAdminCard={DevelopmentPlanAdminCard}
        DevelopmentRecordAdminCard={DevelopmentRecordAdminCard}
        evaluationAuditEntries={evaluationAuditEntries}
        evaluationCycleHistory={evaluationCycleHistory}
        evaluationCycleOptions={evaluationCycleOptions}
        evaluationCycleStructure={evaluationCycleStructure}
        evaluationLibrary={evaluationLibrary}
        evaluationModuleOptions={evaluationModuleOptions}
        evaluationOperationNotice={evaluationOperationNotice}
        evaluationOperationWorkModeFilter={evaluationOperationWorkModeFilter}
        evaluationOperationWorkModeOptions={evaluationOperationWorkModeOptions}
        evaluationOperationWorkUnitFilter={evaluationOperationWorkUnitFilter}
        evaluationOperationWorkUnitOptions={evaluationOperationWorkUnitOptions}
        feedbackProviderOptions={feedbackProviderOptions}
        feedbackRequestCycleOptions={feedbackRequestCycleOptions}
        feedbackRequestForm={feedbackRequestForm}
        filteredAggregateResponses={filteredAggregateResponses}
        filteredAssignments={filteredAssignments}
        filteredDashboardEvaluationMix={filteredDashboardEvaluationMix}
        filteredDashboardEvaluationResultsSummary={filteredDashboardEvaluationResultsSummary}
        filteredDashboardResponseDistributions={filteredDashboardResponseDistributions}
        filteredDevelopmentPlans={filteredDevelopmentPlans}
        filteredDevelopmentRecords={filteredDevelopmentRecords}
        filteredEvaluationCycleStructure={filteredEvaluationCycleStructure}
        filteredFeedbackRequests={filteredFeedbackRequests}
        filteredIndividualResponses={filteredIndividualResponses}
        filteredReceivedManagerFeedback={filteredReceivedManagerFeedback}
        formatDate={formatDate}
        FunnelSeriesChart={FunnelSeriesChart}
        getAssignmentStatusLabel={getAssignmentStatusLabel}
        getCycleStatusDescription={getCycleStatusDescription}
        getDevelopmentTrackLabel={getDevelopmentTrackLabel}
        getFeedbackRequestStatusLabel={getFeedbackRequestStatusLabel}
        getRelationshipDescription={getRelationshipDescription}
        getRelationshipLabel={getRelationshipLabel}
        getVisibilityLabel={getVisibilityLabel}
        handleApplauseSubmit={handleApplauseSubmit}
        handleApplauseUpdate={handleApplauseUpdate}
        handleAreaSubmit={handleAreaSubmit}
        handleAreaUpdate={handleAreaUpdate}
        handleAssignmentSubmit={handleAssignmentSubmit}
        handleCompetencyCreate={handleCompetencyCreate}
        handleCompetencyUpdate={handleCompetencyUpdate}
        handleCustomLibraryImport={handleCustomLibraryImport}
        handleCustomLibraryUpdate={handleCustomLibraryUpdate}
        handleCustomLibraryPublish={handleCustomLibraryPublish}
        handleCustomLibraryTemplateDownload={api.downloadCustomLibraryTemplate}
        handleForceCrossFunctionalPairing={handleForceCrossFunctionalPairing}
        handleBlockCrossFunctionalPairing={handleBlockCrossFunctionalPairing}
        handleCycleEnabledToggle={handleCycleEnabledToggle}
        handleCycleModuleToggle={handleCycleModuleToggle}
        handleCycleStatusChange={handleCycleStatusChange}
        handleCycleSubmit={handleCycleSubmit}
        handleDevelopmentPlanSubmit={handleDevelopmentPlanSubmit}
        handleDevelopmentPlanProgressUpdate={handleDevelopmentPlanProgressUpdate}
        handleDevelopmentPlanUpdate={handleDevelopmentPlanUpdate}
        handleDevelopmentSubmit={handleDevelopmentSubmit}
        handleDevelopmentUpdate={handleDevelopmentUpdate}
        handleLearningIntegrationApply={handleLearningIntegrationApply}
        handleFeedbackProviderToggle={handleFeedbackProviderToggle}
        handleFeedbackRequestReview={handleFeedbackRequestReview}
        handleFeedbackRequestSubmit={handleFeedbackRequestSubmit}
        handleIncidentSubmit={handleIncidentSubmit}
        handleIncidentUpdate={handleIncidentUpdate}
        handleNotifyDelinquents={handleNotifyDelinquents}
        handlePersonSubmit={handlePersonSubmit}
        handlePersonSubmitAndCreateUser={() =>
          handlePersonSubmit(undefined, { createUserAfter: true })
        }
        handlePersonUpdate={handlePersonUpdate}
        handleReceivedManagerFeedbackSubmit={handleReceivedManagerFeedbackSubmit}
        handleUserPersonSelect={handleUserPersonSelect}
        handleUserSubmit={handleUserSubmit}
        handleUserUpdate={handleUserUpdate}
        incidents={incidents}
        incidentAreaOptions={incidentAreaOptions}
        incidentAuditEntries={incidentAuditEntries}
        incidentClassificationOptions={incidentClassificationOptions}
        incidentForm={incidentForm}
        incidentResponsibleOptions={incidentResponsibleOptions}
        incidentStatusOptions={incidentStatusOptions}
        IncidentQueueCard={IncidentQueueCard}
        Input={Input}
        loading={loading}
        managerOptions={managerOptions}
        MetricCard={MetricCard}
        pendingAccessPeople={pendingAccessPeople}
        people={people}
        personAccessStateById={personAccessStateById}
        personForm={personForm}
        PersonStructureCard={PersonStructureCard}
        prepareUserProvisioning={prepareUserProvisioning}
        receivedManagerFeedbackDrafts={receivedManagerFeedbackDrafts}
        ResponseDistributionChartCard={ResponseDistributionChartCard}
        TrendAreaChartCard={TrendAreaChartCard}
        roleKey={user.roleKey}
        selectedAssignment={selectedAssignment}
        selectedDashboardCompositionMeta={selectedDashboardCompositionMeta}
        selectedUserPerson={selectedUserPerson}
        setActiveDevelopmentView={setActiveDevelopmentView}
        setActiveEvaluationCycleId={setActiveEvaluationCycleId}
        setActiveEvaluationModule={setActiveEvaluationModule}
        setActiveEvaluationWorkspace={setActiveEvaluationWorkspace}
        setAnswerForm={setAnswerForm}
        setApplauseForm={setApplauseForm}
        setAreaForm={setAreaForm}
        setComparisonEvaluationCycleId={setComparisonEvaluationCycleId}
        setCustomLibraryPublishForm={setCustomLibraryPublishForm}
        setCycleForm={setCycleForm}
        setDashboardAreaFilter={setDashboardAreaFilter}
        setDashboardCompositionFilter={setDashboardCompositionFilter}
        setDashboardTimeGrouping={setDashboardTimeGrouping}
        setDevelopmentForm={setDevelopmentForm}
        setLearningIntegrationDraft={setLearningIntegrationDraft}
        setDevelopmentNote={setDevelopmentNote}
        setDevelopmentPlanForm={setDevelopmentPlanForm}
        setEvaluationOperationWorkModeFilter={setEvaluationOperationWorkModeFilter}
        setEvaluationOperationWorkUnitFilter={setEvaluationOperationWorkUnitFilter}
        setFeedbackRequestForm={setFeedbackRequestForm}
        setIncidentForm={setIncidentForm}
        setPersonForm={setPersonForm}
        setReceivedManagerFeedbackDraft={setReceivedManagerFeedbackDraft}
        setTransversalOverrideForm={setTransversalOverrideForm}
        setSelectedAssignment={setSelectedAssignment}
        setShowEvaluationLibrary={setShowEvaluationLibrary}
        setStrengthsNote={setStrengthsNote}
        setUserForm={setUserForm}
        showEvaluationLibrary={showEvaluationLibrary}
        strengthsNote={strengthsNote}
        summary={summary}
        suggestedUserEmail={suggestedUserEmail}
        suggestedUserRole={suggestedUserRole}
        suggestedUserRoleReason={suggestedUserRoleReason}
        Textarea={Textarea}
        transversalOverrideForm={transversalOverrideForm}
        transversalConfigForm={transversalConfigForm}
        setTransversalConfigForm={setTransversalConfigForm}
        handleTransversalConfigSubmit={handleTransversalConfigSubmit}
        handleTransversalUnitOverrideRemove={handleTransversalUnitOverrideRemove}
        UserAdminCard={UserAdminCard}
        userAuditEntries={userAuditEntries}
        userForm={userForm}
        userRoleOptions={userRoleOptions}
        userStatusOptions={userStatusOptions}
        users={users}
      />
    </AppShell>
  );
}


