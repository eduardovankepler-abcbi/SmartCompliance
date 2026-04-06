import {
  AUDIT_CATEGORIES,
  CYCLE_STATUS,
  INCIDENT_ACCESS_ROLES,
  ORG_WIDE_ROLES
} from "./storeConstants.js";

export function isOrgWideUser(user) {
  return ORG_WIDE_ROLES.includes(user?.roleKey || "");
}

export function isFullAccessUser(user) {
  return isOrgWideUser(user);
}

export function isManagerUser(user) {
  return user?.roleKey === "manager";
}

export function isHrUser(user) {
  return user?.roleKey === "hr";
}

export function isAdminUser(user) {
  return user?.roleKey === "admin";
}

export function canManagePeople(user) {
  return ["admin", "hr"].includes(user?.roleKey || "");
}

export function canManageCompetencies(user) {
  return ["admin", "hr"].includes(user?.roleKey || "");
}

export function canManageUsers(user) {
  return ["admin", "hr"].includes(user?.roleKey || "");
}

export function canAccessIncidents(user) {
  return INCIDENT_ACCESS_ROLES.includes(user?.roleKey || "");
}

export function isComplianceUser(user) {
  return user?.roleKey === "compliance";
}

export function canManageIncidentQueue(user) {
  return ["admin", "hr", "compliance"].includes(user?.roleKey || "");
}

export function getAuditCategoriesForUser(user) {
  switch (user?.roleKey) {
    case "admin":
    case "hr":
      return [
        AUDIT_CATEGORIES.user,
        AUDIT_CATEGORIES.competency,
        AUDIT_CATEGORIES.incident,
        AUDIT_CATEGORIES.cycle,
        AUDIT_CATEGORIES.feedbackRequest,
        AUDIT_CATEGORIES.applause,
        AUDIT_CATEGORIES.development
      ];
    case "compliance":
      return [AUDIT_CATEGORIES.incident];
    case "manager":
      return [
        AUDIT_CATEGORIES.cycle,
        AUDIT_CATEGORIES.feedbackRequest,
        AUDIT_CATEGORIES.applause,
        AUDIT_CATEGORIES.development
      ];
    default:
      return [];
  }
}

export function isAnonymousRelationship(relationshipType) {
  return ["leader", "company", "client-internal", "client-external"].includes(
    relationshipType
  );
}

export function isReleasedCycle(status) {
  return status === CYCLE_STATUS.released;
}
