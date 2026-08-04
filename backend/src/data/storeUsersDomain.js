import {
  assertValidUserRole,
  assertValidUserStatus,
  normalizeUserEmail,
  normalizeUserPassword
} from "./storeValidation.js";

const COMMON_TEMPORARY_PASSWORDS = new Set([
  "demo123",
  "123456",
  "password",
  "senha123",
  "smart123"
]);

export function assertProductionPasswordPolicy(password, { nodeEnv = "development" } = {}) {
  if (nodeEnv !== "production" || !password) {
    return;
  }

  const normalized = String(password).trim();
  const lower = normalized.toLowerCase();
  const hasLetter = /[a-z]/i.test(normalized);
  const hasNumber = /\d/.test(normalized);

  if (normalized.length < 10 || !hasLetter || !hasNumber || COMMON_TEMPORARY_PASSWORDS.has(lower)) {
    throw new Error("Senha deve ter pelo menos 10 caracteres, letras e numeros em producao.");
  }
}

export function prepareUserWrite(existingUsers, payload, options = {}) {
  const userId = options.userId || null;
  const requirePassword = options.requirePassword === true;
  const nodeEnv = options.nodeEnv || "development";

  assertValidUserRole(payload.roleKey);
  assertValidUserStatus(payload.status);

  const email = normalizeUserEmail(payload.email);
  const password = normalizeUserPassword(payload.password, { required: requirePassword });
  assertProductionPasswordPolicy(password, { nodeEnv });

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
