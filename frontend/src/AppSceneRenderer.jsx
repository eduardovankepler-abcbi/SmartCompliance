import { EvaluationsSection } from "./evaluations/EvaluationsSection";
import { DashboardSection } from "./sections/DashboardSection.jsx";
import { PeopleSection, UsersSection } from "./sections/RegistrySections.jsx";
import {
  ApplauseSection,
  ComplianceSection,
  DevelopmentSection
} from "./sections/OperationsSections.jsx";

const EmptyComponent = () => null;

export function AppSceneRenderer(props) {
  const {
    activeSection,
    loading
  } = props;
  const SafeDashboardSection = DashboardSection || EmptyComponent;
  const SafeComplianceSection = ComplianceSection || EmptyComponent;
  const SafeEvaluationsSection = EvaluationsSection || EmptyComponent;
  const SafeDevelopmentSection = DevelopmentSection || EmptyComponent;
  const SafeApplauseSection = ApplauseSection || EmptyComponent;
  const SafePeopleSection = PeopleSection || EmptyComponent;
  const SafeUsersSection = UsersSection || EmptyComponent;

  if (loading) {
    return null;
  }

  switch (activeSection) {
    case "Dashboard":
      return (
        <SafeDashboardSection
          BarMetricRow={props.BarMetricRow}
          ColumnMetricCard={props.ColumnMetricCard}
          DashboardDonut={props.DashboardDonut}
          FunnelSeriesChart={props.FunnelSeriesChart}
          MetricCard={props.MetricCard}
          ResponseDistributionChartCard={props.ResponseDistributionChartCard}
          Select={props.Select}
          canFilterDashboardByArea={props.canFilterDashboardByArea}
          dashboard={props.dashboard}
          dashboardAreaFilter={props.dashboardAreaFilter}
          dashboardCompositionFilter={props.dashboardCompositionFilter}
          dashboardCompositionOptions={props.dashboardCompositionOptions}
          dashboardTimeGrouping={props.dashboardTimeGrouping}
          dashboardTimeGroupingLabel={props.dashboardTimeGroupingLabel}
          dashboardTimeGroupingOptions={props.dashboardTimeGroupingOptions}
          filteredDashboardEvaluationMix={props.filteredDashboardEvaluationMix}
          filteredDashboardResponseDistributions={props.filteredDashboardResponseDistributions}
          getAssignmentStatusLabel={props.getAssignmentStatusLabel}
          getRelationshipDescription={props.getRelationshipDescription}
          getRelationshipLabel={props.getRelationshipLabel}
          selectedDashboardCompositionMeta={props.selectedDashboardCompositionMeta}
          setDashboardAreaFilter={props.setDashboardAreaFilter}
          setDashboardCompositionFilter={props.setDashboardCompositionFilter}
          setDashboardTimeGrouping={props.setDashboardTimeGrouping}
          summary={props.summary}
        />
      );
    case "Compliance":
      return (
        <SafeComplianceSection
          IncidentQueueCard={props.IncidentQueueCard}
          Input={props.Input}
          Select={props.Select}
          Textarea={props.Textarea}
          auditEntries={props.incidentAuditEntries}
          canManageIncidentQueue={props.canManageIncidentQueue}
          canViewIncidents={props.canViewIncidents}
          formatDate={props.formatDate}
          handleIncidentSubmit={props.handleIncidentSubmit}
          handleIncidentUpdate={props.handleIncidentUpdate}
          incidentAreaOptions={props.incidentAreaOptions}
          incidentClassificationOptions={props.incidentClassificationOptions}
          incidentStatusOptions={props.incidentStatusOptions}
          incidentForm={props.incidentForm}
          incidents={props.incidents}
          incidentResponsibleOptions={props.incidentResponsibleOptions}
          roleKey={props.roleKey}
          setIncidentForm={props.setIncidentForm}
        />
      );
    case "Avaliacoes":
      return (
        <SafeEvaluationsSection
          Input={props.Input}
          Select={props.Select}
          Textarea={props.Textarea}
          activeCycleModuleSummary={props.activeCycleModuleSummary}
          activeEvaluationCycleId={props.activeEvaluationCycleId}
          evaluationCycleStructure={props.evaluationCycleStructure}
          activeEvaluationModule={props.activeEvaluationModule}
          activeEvaluationModuleMeta={props.activeEvaluationModuleMeta}
          activeEvaluationWorkspace={props.activeEvaluationWorkspace}
          auditEntries={props.evaluationAuditEntries}
          answerForm={props.answerForm}
          assignmentDetail={props.assignmentDetail}
          canManageCycles={props.canManageCycles}
          canManageFeedbackRequests={props.canManageFeedbackRequests}
          canViewEvaluationInsights={props.canViewEvaluationInsights}
          canViewEvaluationLibrary={props.canViewEvaluationLibrary}
          canViewEvaluationOperations={props.canViewEvaluationOperations}
          canViewResponses={props.canViewResponses}
          comparisonCycleModuleSummary={props.comparisonCycleModuleSummary}
          cycleComparisonHighlights={props.cycleComparisonHighlights}
          comparisonCycleOptions={props.comparisonCycleOptions}
          comparisonEvaluationCycleId={props.comparisonEvaluationCycleId}
          competencies={props.competencies}
          customLibraryDraft={props.customLibraryDraft}
          customLibraryPublishForm={props.customLibraryPublishForm}
          cycleForm={props.cycleForm}
          cycles={props.cycles}
          developmentNote={props.developmentNote}
          evaluationCycleHistory={props.evaluationCycleHistory}
          evaluationCycleOptions={props.evaluationCycleOptions}
          evaluationOperationNotice={props.evaluationOperationNotice}
          evaluationOperationWorkModeFilter={props.evaluationOperationWorkModeFilter}
          evaluationOperationWorkModeOptions={props.evaluationOperationWorkModeOptions}
          evaluationOperationWorkUnitFilter={props.evaluationOperationWorkUnitFilter}
          evaluationOperationWorkUnitOptions={props.evaluationOperationWorkUnitOptions}
          evaluationLibrary={props.evaluationLibrary}
          evaluationModuleOptions={props.evaluationModuleOptions}
          feedbackProviderOptions={props.feedbackProviderOptions}
          feedbackRequestCycleOptions={props.feedbackRequestCycleOptions}
          feedbackRequestForm={props.feedbackRequestForm}
          filteredAggregateResponses={props.filteredAggregateResponses}
          filteredAssignments={props.filteredAssignments}
          filteredEvaluationCycleStructure={props.filteredEvaluationCycleStructure}
          filteredFeedbackRequests={props.filteredFeedbackRequests}
          filteredIndividualResponses={props.filteredIndividualResponses}
          filteredReceivedManagerFeedback={props.filteredReceivedManagerFeedback}
          formatDate={props.formatDate}
          getCycleStatusDescription={props.getCycleStatusDescription}
          getFeedbackRequestStatusLabel={props.getFeedbackRequestStatusLabel}
          getRelationshipDescription={props.getRelationshipDescription}
          getRelationshipLabel={props.getRelationshipLabel}
          getVisibilityLabel={props.getVisibilityLabel}
          handleAssignmentSubmit={props.handleAssignmentSubmit}
          handleCompetencyCreate={props.handleCompetencyCreate}
          handleCompetencyUpdate={props.handleCompetencyUpdate}
          handleCustomLibraryImport={props.handleCustomLibraryImport}
          handleCustomLibraryUpdate={props.handleCustomLibraryUpdate}
          handleCustomLibraryTemplateDownload={props.handleCustomLibraryTemplateDownload}
          handleCustomLibraryPublish={props.handleCustomLibraryPublish}
          handleForceCrossFunctionalPairing={props.handleForceCrossFunctionalPairing}
          handleBlockCrossFunctionalPairing={props.handleBlockCrossFunctionalPairing}
          handleCycleStatusChange={props.handleCycleStatusChange}
          handleCycleEnabledToggle={props.handleCycleEnabledToggle}
          handleCycleModuleToggle={props.handleCycleModuleToggle}
          handleCycleSubmit={props.handleCycleSubmit}
          handleFeedbackProviderToggle={props.handleFeedbackProviderToggle}
          handleFeedbackRequestReview={props.handleFeedbackRequestReview}
          handleFeedbackRequestSubmit={props.handleFeedbackRequestSubmit}
          handleNotifyDelinquents={props.handleNotifyDelinquents}
          handleReceivedManagerFeedbackSubmit={props.handleReceivedManagerFeedbackSubmit}
          receivedManagerFeedbackDrafts={props.receivedManagerFeedbackDrafts}
          roleKey={props.roleKey}
          selectedAssignment={props.selectedAssignment}
          setActiveEvaluationCycleId={props.setActiveEvaluationCycleId}
          setActiveEvaluationModule={props.setActiveEvaluationModule}
          setActiveEvaluationWorkspace={props.setActiveEvaluationWorkspace}
          setAnswerForm={props.setAnswerForm}
          setComparisonEvaluationCycleId={props.setComparisonEvaluationCycleId}
          setCustomLibraryPublishForm={props.setCustomLibraryPublishForm}
          setCycleForm={props.setCycleForm}
          setDevelopmentNote={props.setDevelopmentNote}
          setEvaluationOperationWorkModeFilter={props.setEvaluationOperationWorkModeFilter}
          setEvaluationOperationWorkUnitFilter={props.setEvaluationOperationWorkUnitFilter}
          setFeedbackRequestForm={props.setFeedbackRequestForm}
          setReceivedManagerFeedbackDraft={props.setReceivedManagerFeedbackDraft}
          setTransversalOverrideForm={props.setTransversalOverrideForm}
          setSelectedAssignment={props.setSelectedAssignment}
          setShowEvaluationLibrary={props.setShowEvaluationLibrary}
          setStrengthsNote={props.setStrengthsNote}
          showEvaluationLibrary={props.showEvaluationLibrary}
          strengthsNote={props.strengthsNote}
          transversalOverrideForm={props.transversalOverrideForm}
          transversalConfigForm={props.transversalConfigForm}
          setTransversalConfigForm={props.setTransversalConfigForm}
          handleTransversalConfigSubmit={props.handleTransversalConfigSubmit}
          handleTransversalUnitOverrideRemove={props.handleTransversalUnitOverrideRemove}
        />
      );
    case "Desenvolvimento":
      return (
        <SafeDevelopmentSection
          auditEntries={props.developmentAuditEntries}
          canViewAuditTrail={props.canViewAuditTrail}
          DevelopmentPlanAdminCard={props.DevelopmentPlanAdminCard}
          DevelopmentRecordAdminCard={props.DevelopmentRecordAdminCard}
          Input={props.Input}
          MetricCard={props.MetricCard}
          Select={props.Select}
          Textarea={props.Textarea}
          activeDevelopmentView={props.activeDevelopmentView}
          developmentForm={props.developmentForm}
          developmentPlanForm={props.developmentPlanForm}
          developmentPlanCycleOptions={props.developmentPlanCycleOptions}
          developmentPlanCompetencyOptions={props.developmentPlanCompetencyOptions}
          developmentPlanPeopleOptions={props.developmentPlanPeopleOptions}
          developmentPlanStatusOptions={props.developmentPlanStatusOptions}
          developmentFormPeopleOptions={props.developmentFormPeopleOptions}
          developmentHighlights={props.developmentHighlights}
          developmentMetrics={props.developmentMetrics}
          developmentPlans={props.filteredDevelopmentPlans}
          developmentRecordTypes={props.developmentRecordTypes}
          developmentEditablePlanPeopleOptions={props.developmentEditablePlanPeopleOptions}
          developmentEditablePeopleOptions={props.developmentEditablePeopleOptions}
          developmentViewLabels={props.developmentViewLabels}
          developmentViewOptions={props.developmentViewOptions}
          filteredDevelopmentRecords={props.filteredDevelopmentRecords}
          formatDate={props.formatDate}
          getDevelopmentTrackLabel={props.getDevelopmentTrackLabel}
          handleDevelopmentPlanSubmit={props.handleDevelopmentPlanSubmit}
          handleDevelopmentPlanUpdate={props.handleDevelopmentPlanUpdate}
          handleDevelopmentSubmit={props.handleDevelopmentSubmit}
          handleDevelopmentUpdate={props.handleDevelopmentUpdate}
          roleKey={props.roleKey}
          setActiveDevelopmentView={props.setActiveDevelopmentView}
          setDevelopmentForm={props.setDevelopmentForm}
          setDevelopmentPlanForm={props.setDevelopmentPlanForm}
        />
      );
    case "Aplause":
      return (
        <SafeApplauseSection
          ApplauseAdminCard={props.ApplauseAdminCard}
          Input={props.Input}
          Select={props.Select}
          Textarea={props.Textarea}
          auditEntries={props.applauseAuditEntries}
          applauseEntries={props.applauseEntries}
          applauseForm={props.applauseForm}
          applausePeopleOptions={props.applausePeopleOptions}
          canManageApplause={props.canManageApplause}
          canViewAuditTrail={props.canViewAuditTrail}
          formatDate={props.formatDate}
          handleApplauseSubmit={props.handleApplauseSubmit}
          handleApplauseUpdate={props.handleApplauseUpdate}
          roleKey={props.roleKey}
          setApplauseForm={props.setApplauseForm}
        />
      );
    case "Pessoas":
      return (
        <SafePeopleSection
          AreaAdminCard={props.AreaAdminCard}
          Input={props.Input}
          PersonStructureCard={props.PersonStructureCard}
          Select={props.Select}
          canManagePeopleRegistry={props.canManagePeopleRegistry}
          areaForm={props.areaForm}
          areaOptions={props.areaOptions}
          areas={props.areas}
          handleAreaSubmit={props.handleAreaSubmit}
          handleAreaUpdate={props.handleAreaUpdate}
          handlePersonSubmit={props.handlePersonSubmit}
          handlePersonSubmitAndCreateUser={props.handlePersonSubmitAndCreateUser}
          handlePersonUpdate={props.handlePersonUpdate}
          managerOptions={props.managerOptions}
          people={props.people}
          personAccessStateById={props.personAccessStateById}
          personForm={props.personForm}
          onPrepareUserProvisioning={props.prepareUserProvisioning}
          setAreaForm={props.setAreaForm}
          setPersonForm={props.setPersonForm}
        />
      );
    case "Usuarios":
      return (
        <SafeUsersSection
          Input={props.Input}
          Select={props.Select}
          UserAdminCard={props.UserAdminCard}
          auditEntries={props.userAuditEntries}
          availableUserPeopleOptions={props.availableUserPeopleOptions}
          formatDate={props.formatDate}
          handleUserSubmit={props.handleUserSubmit}
          handleUserUpdate={props.handleUserUpdate}
          handleUserPersonSelect={props.handleUserPersonSelect}
          accessJourneySummary={props.accessJourneySummary}
          pendingAccessPeople={props.pendingAccessPeople}
          onPrepareUserProvisioning={props.prepareUserProvisioning}
          selectedUserPerson={props.selectedUserPerson}
          setUserForm={props.setUserForm}
          suggestedUserEmail={props.suggestedUserEmail}
          suggestedUserRole={props.suggestedUserRole}
          suggestedUserRoleReason={props.suggestedUserRoleReason}
          userForm={props.userForm}
          userRoleOptions={props.userRoleOptions}
          userStatusOptions={props.userStatusOptions}
          users={props.users}
        />
      );
    default:
      return null;
  }
}
