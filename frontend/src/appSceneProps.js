export function buildAuditEntryGroups(auditTrail) {
  return {
    evaluationAuditEntries: auditTrail.filter(
      (item) => item.category === "cycle" || item.category === "feedback_request"
    ),
    registryAuditEntries: auditTrail.filter((item) => item.category === "registry"),
    userAuditEntries: auditTrail.filter((item) => item.category === "user")
  };
}

export function buildDashboardSceneProps({
  widgets,
  filters,
  insights,
  labels,
  dashboard,
  summary,
  onSectionChange,
  profileName
}) {
  return {
    ...widgets,
    ...filters,
    ...insights,
    ...labels,
    dashboard,
    onSectionChange,
    profileName,
    summary
  };
}

export function buildComplianceSceneProps({
  components,
  auditEntries,
  canManageIncidentQueue,
  canViewIncidents,
  formatDate,
  handlers,
  options,
  incidentForm,
  incidents,
  roleKey
}) {
  return {
    ...components,
    auditEntries,
    canManageIncidentQueue,
    canViewIncidents,
    formatDate,
    ...handlers,
    ...options,
    incidentForm,
    incidents,
    roleKey
  };
}

export function buildEvaluationsSceneProps({
  components,
  auditEntries,
  capabilities,
  data,
  handlers,
  labels,
  roleKey,
  setters
}) {
  return {
    ...components,
    auditEntries,
    ...capabilities,
    ...data,
    ...handlers,
    ...labels,
    roleKey,
    ...setters
  };
}

export function buildDevelopmentSceneProps({
  components,
  auditEntries,
  canViewAuditTrail,
  data,
  handlers,
  labels,
  roleKey,
  setters
}) {
  return {
    ...components,
    auditEntries,
    canViewAuditTrail,
    ...data,
    ...handlers,
    ...labels,
    roleKey,
    ...setters
  };
}

export function buildApplauseSceneProps({
  components,
  applauseEntries,
  applauseForm,
  applausePeopleOptions,
  auditEntries,
  canManageApplause,
  canViewAuditTrail,
  formatDate,
  handlers,
  roleKey,
  setters
}) {
  return {
    ...components,
    applauseEntries,
    applauseForm,
    applausePeopleOptions,
    auditEntries,
    canManageApplause,
    canViewAuditTrail,
    formatDate,
    ...handlers,
    roleKey,
    ...setters
  };
}

export function buildPeopleSceneProps({
  components,
  areaForm,
  areaOptions,
  areas,
  auditEntries,
  canManagePeopleRegistry,
  formatDate,
  handlers,
  managerOptions,
  people,
  personAccessStateById,
  personForm,
  setters
}) {
  return {
    ...components,
    areaForm,
    areaOptions,
    areas,
    auditEntries,
    canManagePeopleRegistry,
    formatDate,
    ...handlers,
    managerOptions,
    people,
    personAccessStateById,
    personForm,
    ...setters
  };
}

export function buildUsersSceneProps({
  components,
  accessJourneySummary,
  auditEntries,
  availableUserPeopleOptions,
  formatDate,
  handlers,
  pendingAccessPeople,
  selectedUserPerson,
  setters,
  suggestedUserEmail,
  suggestedUserRole,
  suggestedUserRoleReason,
  userForm,
  userRoleOptions,
  userStatusOptions,
  users
}) {
  return {
    ...components,
    accessJourneySummary,
    auditEntries,
    availableUserPeopleOptions,
    formatDate,
    ...handlers,
    pendingAccessPeople,
    selectedUserPerson,
    ...setters,
    suggestedUserEmail,
    suggestedUserRole,
    suggestedUserRoleReason,
    userForm,
    userRoleOptions,
    userStatusOptions,
    users
  };
}

export function buildAppSceneProps(context) {
  const {
    auditTrail,
    user,
    widgets,
    controls,
    adminCards,
    dashboardState,
    evaluationsState,
    developmentState,
    operationsState,
    registryState,
    sharedData,
    sharedHandlers,
    labels,
    options,
    apiHandlers,
    capabilities
  } = context;
  const { evaluationAuditEntries, registryAuditEntries, userAuditEntries } =
    buildAuditEntryGroups(auditTrail);

  return {
    dashboardSceneProps: buildDashboardSceneProps({
      widgets: {
        ...widgets,
        Select: controls.Select
      },
      filters: {
        dashboardAnalyticalTheme: dashboardState.dashboardAnalyticalTheme,
        canFilterDashboardByArea: capabilities.canFilterDashboardByArea,
        dashboardAreaFilter: dashboardState.dashboardAreaFilter,
        dashboardCompositionFilter: dashboardState.dashboardCompositionFilter,
        dashboardTimeGrouping: dashboardState.dashboardTimeGrouping,
        dashboardViewMode: dashboardState.dashboardViewMode,
        developmentView: dashboardState.developmentView,
        dimensionFilters: dashboardState.dimensionFilters,
        satisfactionQuestionAreaFilter: dashboardState.satisfactionQuestionAreaFilter,
        satisfactionView: dashboardState.satisfactionView,
        setDashboardAnalyticalTheme: dashboardState.setDashboardAnalyticalTheme,
        setDashboardAreaFilter: dashboardState.setDashboardAreaFilter,
        setDashboardCompositionFilter: dashboardState.setDashboardCompositionFilter,
        setDashboardTimeGrouping: dashboardState.setDashboardTimeGrouping,
        setDashboardViewMode: dashboardState.setDashboardViewMode,
        setDevelopmentView: dashboardState.setDevelopmentView,
        setDimensionFilters: dashboardState.setDimensionFilters,
        setSatisfactionQuestionAreaFilter: dashboardState.setSatisfactionQuestionAreaFilter,
        setSatisfactionView: dashboardState.setSatisfactionView
      },
      insights: {
        dashboardCompositionOptions: dashboardState.dashboardCompositionOptions,
        dashboardTimeGroupingLabel: dashboardState.dashboardTimeGroupingLabel,
        dashboardTimeGroupingOptions: dashboardState.dashboardTimeGroupingOptions,
        filteredDashboardEvaluationMix: dashboardState.filteredDashboardEvaluationMix,
        filteredDashboardEvaluationResultsSummary:
          dashboardState.filteredDashboardEvaluationResultsSummary,
        filteredDashboardResponseDistributions:
          dashboardState.filteredDashboardResponseDistributions,
        selectedDashboardCompositionMeta: dashboardState.selectedDashboardCompositionMeta
      },
      labels: {
        getAssignmentStatusLabel: labels.getAssignmentStatusLabel,
        getRelationshipDescription: labels.getRelationshipDescription,
        getRelationshipLabel: labels.getRelationshipLabel
      },
      dashboard: sharedData.dashboard,
      summary: sharedData.summary,
      onSectionChange: sharedHandlers.setActiveSection,
      profileName: user?.person?.name || "Usuario"
    }),
    complianceSceneProps: buildComplianceSceneProps({
      components: {
        IncidentQueueCard: adminCards.IncidentQueueCard,
        ...controls
      },
      auditEntries: operationsState.incidentAuditEntries,
      canManageIncidentQueue: capabilities.canManageIncidentQueue,
      canViewIncidents: capabilities.canViewIncidents,
      formatDate: labels.formatDate,
      handlers: {
        handleIncidentSubmit: operationsState.handleIncidentSubmit,
        handleIncidentUpdate: operationsState.handleIncidentUpdate,
        setIncidentForm: operationsState.setIncidentForm
      },
      options: {
        incidentAreaOptions: operationsState.incidentAreaOptions,
        incidentClassificationOptions: options.incidentClassificationOptions,
        incidentResponsibleOptions: operationsState.incidentResponsibleOptions,
        incidentStatusOptions: options.incidentStatusOptions
      },
      incidentForm: operationsState.incidentForm,
      incidents: sharedData.incidents,
      roleKey: user?.roleKey
    }),
    evaluationsSceneProps: buildEvaluationsSceneProps({
      components: controls,
      auditEntries: evaluationAuditEntries,
      capabilities: {
        canManageCycles: capabilities.canManageCycles,
        canManageFeedbackRequests: capabilities.canManageFeedbackRequests,
        canViewEvaluationInsights: capabilities.canViewEvaluationInsights,
        canViewEvaluationLibrary: capabilities.canViewEvaluationLibrary,
        canViewEvaluationOperations: capabilities.canViewEvaluationOperations,
        canViewResponses: capabilities.canViewResponses
      },
      data: {
        activeCycleModuleSummary: evaluationsState.activeCycleModuleSummary,
        activeEvaluationCycleId: evaluationsState.activeEvaluationCycleId,
        activeEvaluationModule: evaluationsState.activeEvaluationModule,
        activeEvaluationModuleMeta: evaluationsState.activeEvaluationModuleMeta,
        activeEvaluationWorkspace: evaluationsState.activeEvaluationWorkspace,
        answerForm: evaluationsState.answerForm,
        assignmentDetail: evaluationsState.assignmentDetail,
        comparisonCycleModuleSummary: evaluationsState.comparisonCycleModuleSummary,
        comparisonCycleOptions: evaluationsState.comparisonCycleOptions,
        comparisonEvaluationCycleId: evaluationsState.comparisonEvaluationCycleId,
        competencies: sharedData.competencies,
        customLibraryDraft: evaluationsState.customLibraryDraft,
        customLibraryPublishForm: evaluationsState.customLibraryPublishForm,
        cycleComparisonHighlights: evaluationsState.cycleComparisonHighlights,
        cycleForm: evaluationsState.cycleForm,
        cycles: sharedData.cycles,
        developmentNote: evaluationsState.developmentNote,
        editingEvaluationQuestionId: evaluationsState.editingEvaluationQuestionId,
        evaluationCycleHistory: evaluationsState.evaluationCycleHistory,
        evaluationCycleOptions: evaluationsState.evaluationCycleOptions,
        evaluationCycleStructure: evaluationsState.evaluationCycleStructure,
        evaluationLibrary: sharedData.evaluationLibrary,
        evaluationModuleOptions: evaluationsState.evaluationModuleOptions,
        evaluationOperationNotice: evaluationsState.evaluationOperationNotice,
        evaluationOperationWorkModeFilter: evaluationsState.evaluationOperationWorkModeFilter,
        evaluationOperationWorkModeOptions: evaluationsState.evaluationOperationWorkModeOptions,
        evaluationOperationWorkUnitFilter: evaluationsState.evaluationOperationWorkUnitFilter,
        evaluationOperationWorkUnitOptions: evaluationsState.evaluationOperationWorkUnitOptions,
        evaluationQuestionDraft: evaluationsState.evaluationQuestionDraft,
        evaluationQuestionnaireFilters: evaluationsState.evaluationQuestionnaireFilters,
        evaluationQuestionnaireCreateForm: evaluationsState.evaluationQuestionnaireCreateForm,
        evaluationQuestionnaireDraft: evaluationsState.evaluationQuestionnaireDraft,
        evaluationQuestionnaireRelationshipOptions:
          evaluationsState.evaluationQuestionnaireRelationshipOptions,
        evaluationQuestionnaireRequiredCounts:
          evaluationsState.evaluationQuestionnaireRequiredCounts,
        evaluationQuestionnaireStatusOptions:
          evaluationsState.evaluationQuestionnaireStatusOptions,
        evaluationQuestionnaires: evaluationsState.evaluationQuestionnaires,
        feedbackProviderOptions: evaluationsState.feedbackProviderOptions,
        feedbackRequestCycleOptions: evaluationsState.feedbackRequestCycleOptions,
        feedbackRequestForm: evaluationsState.feedbackRequestForm,
        filteredAggregateResponses: evaluationsState.filteredAggregateResponses,
        filteredAssignments: evaluationsState.filteredAssignments,
        filteredEvaluationCycleStructure: evaluationsState.filteredEvaluationCycleStructure,
        filteredFeedbackRequests: evaluationsState.filteredFeedbackRequests,
        filteredIndividualResponses: evaluationsState.filteredIndividualResponses,
        filteredReceivedManagerFeedback: evaluationsState.filteredReceivedManagerFeedback,
        people: sharedData.people,
        performance360Reviews: sharedData.performance360Reviews,
        receivedManagerFeedbackDrafts: evaluationsState.receivedManagerFeedbackDrafts,
        revieweeQuestionnaireOptions: evaluationsState.revieweeQuestionnaireOptions,
        selectedEvaluationQuestionnaire: evaluationsState.selectedEvaluationQuestionnaire,
        selectedEvaluationQuestionnaireId:
          evaluationsState.selectedEvaluationQuestionnaireId,
        selectedAssignment: evaluationsState.selectedAssignment,
        showEvaluationQuestionnaires: evaluationsState.showEvaluationQuestionnaires,
        showEvaluationLibrary: evaluationsState.showEvaluationLibrary,
        strengthsNote: evaluationsState.strengthsNote,
        transversalConfigForm: evaluationsState.transversalConfigForm,
        transversalOverrideForm: evaluationsState.transversalOverrideForm
      },
      handlers: {
        handleEvaluationQuestionDelete:
          evaluationsState.handleEvaluationQuestionDelete,
        handleCloneQuestionnaireFromExisting:
          evaluationsState.handleCloneQuestionnaireFromExisting,
        handleEvaluationQuestionReorder:
          evaluationsState.handleEvaluationQuestionReorder,
        handleEvaluationQuestionSave: evaluationsState.handleEvaluationQuestionSave,
        handleLoadQuestionnaireFromLibrary:
          evaluationsState.handleLoadQuestionnaireFromLibrary,
        handleEvaluationQuestionnaireArchive:
          evaluationsState.handleEvaluationQuestionnaireArchive,
        handleEvaluationQuestionnaireCreate:
          evaluationsState.handleEvaluationQuestionnaireCreate,
        handleEvaluationQuestionnairePublish:
          evaluationsState.handleEvaluationQuestionnairePublish,
        handleEvaluationQuestionnaireUpdate:
          evaluationsState.handleEvaluationQuestionnaireUpdate,
        handleAssignmentSubmit: evaluationsState.handleAssignmentSubmit,
        handleBlockCrossFunctionalPairing: evaluationsState.handleBlockCrossFunctionalPairing,
        handleCompetencyCreate: sharedHandlers.handleCompetencyCreate,
        handleCompetencyUpdate: sharedHandlers.handleCompetencyUpdate,
        handleCustomLibraryImport: evaluationsState.handleCustomLibraryImport,
        handleCustomLibraryPublish: evaluationsState.handleCustomLibraryPublish,
        handleCustomLibraryTemplateDownload: apiHandlers.downloadCustomLibraryTemplate,
        handleCustomLibraryUpdate: evaluationsState.handleCustomLibraryUpdate,
        handleCycleEnabledToggle: evaluationsState.handleCycleEnabledToggle,
        handleCycleModuleToggle: evaluationsState.handleCycleModuleToggle,
        handleCycleStatusChange: evaluationsState.handleCycleStatusChange,
        handleCycleSubmit: evaluationsState.handleCycleSubmit,
        handleFeedbackProviderToggle: evaluationsState.handleFeedbackProviderToggle,
        handleFeedbackRequestReview: evaluationsState.handleFeedbackRequestReview,
        handleFeedbackRequestSubmit: evaluationsState.handleFeedbackRequestSubmit,
        handleForceCrossFunctionalPairing: evaluationsState.handleForceCrossFunctionalPairing,
        handleNotifyDelinquents: evaluationsState.handleNotifyDelinquents,
        handleReceivedManagerFeedbackSubmit:
          evaluationsState.handleReceivedManagerFeedbackSubmit,
        handleTransversalConfigSubmit: evaluationsState.handleTransversalConfigSubmit,
        handleTransversalUnitOverrideRemove:
          evaluationsState.handleTransversalUnitOverrideRemove
      },
      labels: {
        formatDate: labels.formatDate,
        getCycleStatusDescription: labels.getCycleStatusDescription,
        getFeedbackRequestStatusLabel: labels.getFeedbackRequestStatusLabel,
        getRelationshipDescription: labels.getRelationshipDescription,
        getRelationshipLabel: labels.getRelationshipLabel,
        getVisibilityLabel: labels.getVisibilityLabel
      },
      roleKey: user?.roleKey,
      setters: {
        setActiveEvaluationCycleId: evaluationsState.setActiveEvaluationCycleId,
        setActiveEvaluationModule: evaluationsState.setActiveEvaluationModule,
        setActiveEvaluationWorkspace: evaluationsState.setActiveEvaluationWorkspace,
        setAnswerForm: evaluationsState.setAnswerForm,
        setComparisonEvaluationCycleId: evaluationsState.setComparisonEvaluationCycleId,
        setCustomLibraryPublishForm: evaluationsState.setCustomLibraryPublishForm,
        setCycleForm: evaluationsState.setCycleForm,
        setDevelopmentNote: evaluationsState.setDevelopmentNote,
        setEvaluationQuestionDraft: evaluationsState.setEvaluationQuestionDraft,
        setEvaluationQuestionnaireFilters:
          evaluationsState.setEvaluationQuestionnaireFilters,
        setEvaluationQuestionnaireCreateForm:
          evaluationsState.setEvaluationQuestionnaireCreateForm,
        setEvaluationQuestionnaireDraft:
          evaluationsState.setEvaluationQuestionnaireDraft,
        setEvaluationQuestionnairePolicyValue:
          evaluationsState.setEvaluationQuestionnairePolicyValue,
        setEvaluationOperationWorkModeFilter:
          evaluationsState.setEvaluationOperationWorkModeFilter,
        setEvaluationOperationWorkUnitFilter:
          evaluationsState.setEvaluationOperationWorkUnitFilter,
        setFeedbackRequestForm: evaluationsState.setFeedbackRequestForm,
        setReceivedManagerFeedbackDraft:
          evaluationsState.setReceivedManagerFeedbackDraft,
        setSelectedEvaluationQuestionnaireId:
          evaluationsState.setSelectedEvaluationQuestionnaireId,
        setSelectedAssignment: evaluationsState.setSelectedAssignment,
        setShowEvaluationLibrary: evaluationsState.setShowEvaluationLibrary,
        setShowEvaluationQuestionnaires:
          evaluationsState.setShowEvaluationQuestionnaires,
        startEvaluationQuestionEdit: evaluationsState.startEvaluationQuestionEdit,
        setStrengthsNote: evaluationsState.setStrengthsNote,
        setTransversalConfigForm: evaluationsState.setTransversalConfigForm,
        setTransversalOverrideForm: evaluationsState.setTransversalOverrideForm
      }
    }),
    developmentSceneProps: buildDevelopmentSceneProps({
      components: {
        DevelopmentPlanAdminCard: adminCards.DevelopmentPlanAdminCard,
        DevelopmentRecordAdminCard: adminCards.DevelopmentRecordAdminCard,
        Input: controls.Input,
        MetricCard: widgets.MetricCard,
        Select: controls.Select,
        Textarea: controls.Textarea
      },
      auditEntries: developmentState.developmentAuditEntries,
      canViewAuditTrail: capabilities.canViewAuditTrail,
      data: {
        activeDevelopmentView: developmentState.activeDevelopmentView,
        developmentEditablePeopleOptions: developmentState.developmentEditablePeopleOptions,
        developmentEditablePlanPeopleOptions:
          developmentState.developmentEditablePlanPeopleOptions,
        developmentForm: developmentState.developmentForm,
        developmentFormPeopleOptions: developmentState.developmentFormPeopleOptions,
        developmentHighlights: developmentState.developmentHighlights,
        developmentMetrics: developmentState.developmentMetrics,
        developmentPerformanceSummary: developmentState.developmentPerformanceSummary,
        developmentPlans: developmentState.filteredDevelopmentPlans,
        developmentPlanCompetencyOptions:
          developmentState.developmentPlanCompetencyOptions,
        developmentPlanCycleOptions: developmentState.developmentPlanCycleOptions,
        developmentPlanForm: developmentState.developmentPlanForm,
        developmentPlanPeopleOptions: developmentState.developmentPlanPeopleOptions,
        developmentPlanProgressStatusOptions:
          developmentState.developmentPlanProgressStatusOptions,
        developmentViewOptions: developmentState.developmentViewOptions,
        filteredDevelopmentPlans: developmentState.filteredDevelopmentPlans,
        filteredDevelopmentRecords: developmentState.filteredDevelopmentRecords,
        learningIntegrationPeopleOptions:
          developmentState.learningIntegrationPeopleOptions,
        learningIntegrationReviewItems:
          developmentState.learningIntegrationReviewItems,
        learningIntegrationSummary: developmentState.learningIntegrationSummary
      },
      handlers: {
        handleDevelopmentPlanProgressUpdate:
          developmentState.handleDevelopmentPlanProgressUpdate,
        handleDevelopmentPlanSubmit: developmentState.handleDevelopmentPlanSubmit,
        handleDevelopmentPlanUpdate: developmentState.handleDevelopmentPlanUpdate,
        handleDevelopmentSubmit: developmentState.handleDevelopmentSubmit,
        handleDevelopmentUpdate: developmentState.handleDevelopmentUpdate,
        handleLearningIntegrationApply:
          developmentState.handleLearningIntegrationApply
      },
      labels: {
        developmentPlanStatusOptions: options.developmentPlanStatusOptions,
        developmentRecordTypes: options.developmentRecordTypes,
        developmentViewLabels: options.developmentViewLabels,
        formatDate: labels.formatDate,
        getDevelopmentTrackLabel: labels.getDevelopmentTrackLabel
      },
      roleKey: user?.roleKey,
      setters: {
        setActiveDevelopmentView: developmentState.setActiveDevelopmentView,
        setDevelopmentForm: developmentState.setDevelopmentForm,
        setDevelopmentPlanForm: developmentState.setDevelopmentPlanForm,
        setLearningIntegrationDraft: developmentState.setLearningIntegrationDraft
      }
    }),
    applauseSceneProps: buildApplauseSceneProps({
      components: {
        ApplauseAdminCard: adminCards.ApplauseAdminCard,
        ...controls
      },
      applauseEntries: sharedData.applauseEntries,
      applauseForm: operationsState.applauseForm,
      applausePeopleOptions: operationsState.applausePeopleOptions,
      auditEntries: operationsState.applauseAuditEntries,
      canManageApplause: capabilities.canManageApplause,
      canViewAuditTrail: capabilities.canViewAuditTrail,
      formatDate: labels.formatDate,
      handlers: {
        handleApplauseSubmit: operationsState.handleApplauseSubmit,
        handleApplauseUpdate: operationsState.handleApplauseUpdate
      },
      roleKey: user?.roleKey,
      setters: {
        setApplauseForm: operationsState.setApplauseForm
      }
    }),
    peopleSceneProps: buildPeopleSceneProps({
      components: {
        AreaAdminCard: adminCards.AreaAdminCard,
        Input: controls.Input,
        PersonStructureCard: adminCards.PersonStructureCard,
        Select: controls.Select
      },
      areaForm: registryState.areaForm,
      areaOptions: registryState.areaOptions,
      areas: sharedData.areas,
      auditEntries: registryAuditEntries,
      canManagePeopleRegistry: capabilities.canManagePeopleRegistry,
      formatDate: labels.formatDate,
      handlers: {
        handleAreaSubmit: registryState.handleAreaSubmit,
        handleAreaUpdate: registryState.handleAreaUpdate,
        handlePersonSubmit: registryState.handlePersonSubmit,
        handlePersonSubmitAndCreateUser: () =>
          registryState.handlePersonSubmit(undefined, { createUserAfter: true }),
        handlePersonUpdate: registryState.handlePersonUpdate,
        onPrepareUserProvisioning: registryState.prepareUserProvisioning
      },
      managerOptions: registryState.managerOptions,
      people: sharedData.people,
      personAccessStateById: registryState.personAccessStateById,
      personForm: registryState.personForm,
      setters: {
        setAreaForm: registryState.setAreaForm,
        setPersonForm: registryState.setPersonForm
      }
    }),
    usersSceneProps: buildUsersSceneProps({
      components: {
        Input: controls.Input,
        Select: controls.Select,
        UserAdminCard: adminCards.UserAdminCard
      },
      accessJourneySummary: registryState.accessJourneySummary,
      auditEntries: userAuditEntries,
      availableUserPeopleOptions: registryState.availableUserPeopleOptions,
      formatDate: labels.formatDate,
      handlers: {
        handleUserPersonSelect: registryState.handleUserPersonSelect,
        handleUserSubmit: registryState.handleUserSubmit,
        handleUserUpdate: registryState.handleUserUpdate,
        onPrepareUserProvisioning: registryState.prepareUserProvisioning
      },
      pendingAccessPeople: registryState.pendingAccessPeople,
      selectedUserPerson: registryState.selectedUserPerson,
      setters: {
        setUserForm: registryState.setUserForm
      },
      suggestedUserEmail: registryState.suggestedUserEmail,
      suggestedUserRole: registryState.suggestedUserRole,
      suggestedUserRoleReason: registryState.suggestedUserRoleReason,
      userForm: registryState.userForm,
      userRoleOptions: options.userRoleOptions,
      userStatusOptions: options.userStatusOptions,
      users: sharedData.users
    })
  };
}
