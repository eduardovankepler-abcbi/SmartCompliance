export function getCapabilities(userOrRoleKey) {
  const roleKey =
    typeof userOrRoleKey === "string" ? userOrRoleKey : userOrRoleKey?.roleKey;

  return {
    canManageCycles: roleKey === "admin" || roleKey === "hr",
    canManageFeedbackRequests: roleKey === "admin" || roleKey === "hr",
    canViewPeople: roleKey === "admin" || roleKey === "hr" || roleKey === "manager",
    canManagePeopleRegistry: roleKey === "admin" || roleKey === "hr",
    canViewUsersAdmin: roleKey === "admin" || roleKey === "hr",
    canViewDashboard: Boolean(roleKey && roleKey !== "employee"),
    canViewAuditTrail:
      roleKey === "admin" || roleKey === "hr" || roleKey === "manager" || roleKey === "compliance",
    canViewIncidents: roleKey === "admin" || roleKey === "hr" || roleKey === "compliance",
    canManageIncidentQueue:
      roleKey === "admin" || roleKey === "hr" || roleKey === "compliance",
    canViewResponses: roleKey === "admin" || roleKey === "manager",
    canViewPerformance360: roleKey === "admin" || roleKey === "manager" || roleKey === "employee",
    canReceiveManagerFeedback: roleKey === "employee",
    canViewEvaluationInsights: roleKey === "admin" || roleKey === "manager",
    canViewEvaluationLibrary: roleKey === "admin" || roleKey === "hr",
    canManageApplause: roleKey === "admin" || roleKey === "hr" || roleKey === "manager",
    canManageDevelopmentScope:
      roleKey === "admin" || roleKey === "hr" || roleKey === "manager",
    canFilterDashboardByArea: roleKey === "admin" || roleKey === "hr",
    canViewTeamDevelopment: roleKey === "manager",
    canViewOrganizationDevelopment: roleKey === "admin" || roleKey === "hr"
  };
}
