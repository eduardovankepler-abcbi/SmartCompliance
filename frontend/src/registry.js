function normalizeText(value) {
  return String(value || "").trim();
}

export function buildSuggestedUserEmail(personName) {
  const normalized = normalizeText(personName)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .replace(/\.{2,}/g, ".");

  return normalized ? `${normalized}@empresa.local` : "";
}

export function validatePersonPayload(payload) {
  const satisfaction = Number(payload.satisfactionScore);

  if (!normalizeText(payload.name)) {
    return "Informe o nome da pessoa.";
  }
  if (!normalizeText(payload.roleTitle)) {
    return "Informe o cargo da pessoa.";
  }
  if (!normalizeText(payload.area)) {
    return "Selecione a area da pessoa.";
  }
  if (!normalizeText(payload.employmentType)) {
    return "Selecione o vinculo da pessoa.";
  }
  if (
    payload.satisfactionScore !== "" &&
    (!Number.isFinite(satisfaction) || satisfaction < 1 || satisfaction > 5)
  ) {
    return "A satisfacao deve ficar entre 1 e 5.";
  }

  return "";
}

export function validateUserPayload(payload, { requirePassword = true } = {}) {
  const email = normalizeText(payload.email);

  if (!normalizeText(payload.personId)) {
    return "Selecione a pessoa vinculada ao usuario.";
  }
  if (!email) {
    return "Informe o email de acesso.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Informe um email valido.";
  }
  if (!normalizeText(payload.roleKey)) {
    return "Selecione o perfil de acesso.";
  }
  if (!normalizeText(payload.status)) {
    return "Selecione o status do usuario.";
  }
  if (requirePassword && normalizeText(payload.password).length < 6) {
    return "A senha inicial deve ter pelo menos 6 caracteres.";
  }
  if (!requirePassword && normalizeText(payload.password) && normalizeText(payload.password).length < 6) {
    return "A nova senha deve ter pelo menos 6 caracteres.";
  }

  return "";
}
