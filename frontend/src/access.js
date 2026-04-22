export function getCapabilities(userOrRoleKey) {
  const roleKey =
    typeof userOrRoleKey === "string" ? userOrRoleKey : userOrRoleKey?.roleKey;

  const isAdmin = roleKey === "admin";
  const isHr = roleKey === "hr";
  const isManager = roleKey === "manager";
  const isEmployee = roleKey === "employee";
  const isCompliance = roleKey === "compliance";
  const isAuthenticated = Boolean(roleKey);
  const canViewEvaluationWorkspace = isAdmin || isHr || isManager || isEmployee;
  const canViewDevelopmentWorkspace = isAdmin || isHr || isManager || isEmployee;
  const canViewApplauseWorkspace = isAdmin || isHr || isManager || isEmployee;

  return {
    canManageCycles: isAdmin || isHr,
    canManageFeedbackRequests: isAdmin || isHr,
    canViewDashboard: isAdmin || isHr || isManager,
    canViewComplianceWorkspace: isAuthenticated,
    canViewEvaluationWorkspace,
    canViewDevelopmentWorkspace,
    canViewApplauseWorkspace,
    canViewPeople: isAdmin || isHr || isManager,
    canManagePeopleRegistry: isAdmin || isHr,
    canViewUsersAdmin: isAdmin || isHr,
    canViewAuditTrail: isAdmin || isHr || isManager || isCompliance,
    canViewIncidents: isAdmin || isHr || isCompliance,
    canManageIncidentQueue: isAdmin || isHr || isCompliance,
    canViewResponses: isAdmin || isManager,
    canViewPerformance360: isAdmin || isManager || isEmployee,
    canReceiveManagerFeedback: isEmployee,
    canViewEvaluationInsights: isAdmin || isManager,
    canViewEvaluationLibrary: isAdmin || isHr,
    canViewCompetenciesCatalog: isAdmin || isHr || isManager,
    canManageApplause: isAdmin || isHr || isManager,
    canManageDevelopmentScope: isAdmin || isHr || isManager,
    canFilterDashboardByArea: isAdmin || isHr,
    canViewTeamDevelopment: isManager,
    canViewOrganizationDevelopment: isAdmin || isHr
  };
}
