import {
  assertValidUserRole,
  assertValidUserStatus,
  normalizeUserEmail,
  normalizeUserPassword
} from "./storeValidation.js";

export function prepareUserWrite(existingUsers, payload, options = {}) {
  const userId = options.userId || null;
  const requirePassword = options.requirePassword === true;

  assertValidUserRole(payload.roleKey);
  assertValidUserStatus(payload.status);

  const email = normalizeUserEmail(payload.email);
  const password = normalizeUserPassword(payload.password, { required: requirePassword });

  if (
    existingUsers.some(
      (item) => item.id !== userId && String(item.email || "").toLowerCase() === email
    )
  ) {
    throw new Error("Ja existe um usuario com este email.");
  }

  return {
    email,
    password,
    roleKey: payload.roleKey,
    status: payload.status
  };
}

export function assertUserPersonExists(person) {
  if (!person) {
    throw new Error("Pessoa vinculada nao encontrada.");
  }
}

export function assertPersonHasNoLinkedUser(hasLinkedUser) {
  if (hasLinkedUser) {
    throw new Error("Ja existe um usuario vinculado a esta pessoa.");
  }
}

export function buildUserAuditDetail({ email, password, roleKey, status }) {
  return `${roleKey} · ${status} · ${email}${password ? " · senha redefinida" : ""}`;
}
