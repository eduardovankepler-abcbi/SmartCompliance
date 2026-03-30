const sectionSlugMap = {
  Dashboard: "dashboard",
  Compliance: "compliance",
  Avaliacoes: "avaliacoes",
  Desenvolvimento: "desenvolvimento",
  Aplause: "aplause",
  Pessoas: "pessoas",
  Usuarios: "usuarios"
};

const evaluationModuleSlugMap = {
  overview: "visao-geral",
  company: "empresa",
  leader: "lider",
  manager: "feedback-lider",
  peer: "feedback-direto",
  "cross-functional": "feedback-indireto",
  self: "autoavaliacao"
};

const sectionKeyBySlug = Object.fromEntries(
  Object.entries(sectionSlugMap).map(([key, slug]) => [slug, key])
);

const evaluationModuleKeyBySlug = Object.fromEntries(
  Object.entries(evaluationModuleSlugMap).map(([key, slug]) => [slug, key])
);

function normalizeHash(hash) {
  return String(hash || "")
    .replace(/^#/, "")
    .split("?")[0]
    .split("/")
    .filter(Boolean);
}

export function parseAppHash(
  hash,
  { fallbackSectionKey, canViewEvaluationInsights, canViewEvaluationOperations = false }
) {
  const parts = normalizeHash(hash);
  const sectionKey = sectionKeyBySlug[parts[0]] || fallbackSectionKey;

  if (sectionKey !== "Avaliacoes") {
    return {
      sectionKey,
      evaluationModuleKey: null,
      evaluationWorkspace: null
    };
  }

  const evaluationModuleKey = evaluationModuleKeyBySlug[parts[1]] || "company";
  const requestedWorkspace =
    parts[2] === "leituras"
      ? "insights"
      : parts[2] === "operacao"
        ? "operations"
        : "respond";
  const evaluationWorkspace =
    requestedWorkspace === "insights" && canViewEvaluationInsights
      ? "insights"
      : requestedWorkspace === "operations" && canViewEvaluationOperations
        ? "operations"
        : "respond";

  return {
    sectionKey,
    evaluationModuleKey,
    evaluationWorkspace
  };
}

export function buildAppHash({
  sectionKey,
  evaluationModuleKey,
  evaluationWorkspace,
  canViewEvaluationInsights,
  canViewEvaluationOperations = false
}) {
  const sectionSlug = sectionSlugMap[sectionKey] || sectionSlugMap.Avaliacoes;

  if (sectionKey !== "Avaliacoes") {
    return `#/${sectionSlug}`;
  }

  const moduleSlug = evaluationModuleSlugMap[evaluationModuleKey] || evaluationModuleSlugMap.company;
  const workspaceSlug =
    evaluationWorkspace === "insights" && canViewEvaluationInsights
      ? "leituras"
      : evaluationWorkspace === "operations" && canViewEvaluationOperations
        ? "operacao"
        : "responder";

  return `#/${sectionSlug}/${moduleSlug}/${workspaceSlug}`;
}
