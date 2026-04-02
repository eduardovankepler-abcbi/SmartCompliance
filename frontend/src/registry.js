function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeKey(value) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function getPersonConsistencyMessages(
  payload,
  { areas = [], currentPersonId = null, people = [] } = {}
) {
  const blocking = [];
  const warnings = [];
  const normalizedName = normalizeKey(payload.name);
  const normalizedArea = normalizeKey(payload.area);
  const normalizedRoleTitle = normalizeKey(payload.roleTitle);
  const isAreaLeader =
    String(payload.isAreaManager || "")
      .trim()
      .toLowerCase() === "yes";

  if (!normalizeText(payload.workUnit)) {
    blocking.push("Informe a unidade de trabalho.");
  }

  if (currentPersonId && normalizeText(payload.managerPersonId) === normalizeText(currentPersonId)) {
    blocking.push("Uma pessoa nao pode ser gestora direta de si mesma.");
  }

  const duplicatePerson = people.find((person) => {
    if (currentPersonId && person.id === currentPersonId) {
      return false;
    }

    return (
      normalizeKey(person.name) === normalizedName &&
      normalizeKey(person.area) === normalizedArea &&
      normalizeKey(person.roleTitle) === normalizedRoleTitle
    );
  });

  if (duplicatePerson) {
    blocking.push("Ja existe uma pessoa com mesmo nome, area e cargo.");
  }

  const selectedArea = areas.find((area) => normalizeKey(area.name) === normalizedArea);
  if (
    isAreaLeader &&
    selectedArea?.managerPersonId &&
    normalizeText(selectedArea.managerPersonId) !== normalizeText(currentPersonId)
  ) {
    warnings.push(`Salvar vai substituir ${selectedArea.managerName || "a lideranca atual"} como lider da area.`);
  }

  if (!normalizeText(payload.managerPersonId) && !isAreaLeader) {
    warnings.push("A pessoa sera cadastrada sem gestor direto definido.");
  }

  if (normalizeText(payload.workMode).toLowerCase() === "remote") {
    warnings.push("Quem trabalha 100% home office nao participa do feedback indireto.");
  }

  return { blocking, warnings };
}

export function getUserConsistencyMessages(payload, { selectedPerson = null, suggestedRole = "" } = {}) {
  const warnings = [];

  if (!selectedPerson) {
    return { warnings };
  }

  if (normalizeText(payload.roleKey) && suggestedRole && payload.roleKey !== suggestedRole) {
    warnings.push(
      `O perfil escolhido difere do sugerido para ${selectedPerson.name}. Revise antes de salvar.`
    );
  }

  if (normalizeText(payload.status) === "inactive") {
    warnings.push("Este acesso nascera inativo e a pessoa nao conseguira entrar ate nova liberacao.");
  }

  return { warnings };
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
  if (!normalizeText(payload.workUnit)) {
    return "Informe a unidade de trabalho.";
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
