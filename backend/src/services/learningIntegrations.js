const EVENT_STATUSES = new Set(["completed", "in_progress", "planned"]);

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeStatus(value) {
  const status = normalizeText(value).toLowerCase();
  return EVENT_STATUSES.has(status) ? status : "planned";
}

function normalizeDate(value) {
  const text = normalizeText(value);
  if (!text) {
    return "";
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? text : date.toISOString().slice(0, 10);
}

function resolveSuggestedAction(status) {
  if (status === "completed") {
    return "development_record_candidate";
  }
  return "development_plan_candidate";
}

export function normalizeLearningIntegrationPayload(payload) {
  const sourceSystem = normalizeText(payload?.sourceSystem);
  const events = Array.isArray(payload?.events) ? payload.events : [];

  if (!sourceSystem) {
    throw new Error("Sistema de origem da integracao nao informado.");
  }

  if (!events.length) {
    throw new Error("Nenhum curso ou treinamento informado para integracao.");
  }

  return {
    sourceSystem,
    events: events.map((event, index) => {
      const title = normalizeText(event.title || event.courseTitle || event.trainingTitle);
      const personEmail = normalizeText(event.personEmail || event.email).toLowerCase();
      const status = normalizeStatus(event.status);
      const occurredAt = normalizeDate(event.completedAt || event.finishedAt || event.startedAt);

      if (!title) {
        throw new Error(`Titulo do curso/treinamento nao informado no item ${index + 1}.`);
      }

      if (!personEmail) {
        throw new Error(`Email da pessoa nao informado no item ${index + 1}.`);
      }

      return {
        sourceSystem,
        externalId: normalizeText(event.externalId || event.id || `${sourceSystem}-${index + 1}`),
        personEmail,
        personDocument: normalizeText(event.personDocument || event.employeeId || ""),
        eventType: normalizeText(event.eventType || event.type || "training"),
        title,
        providerName: normalizeText(event.providerName || event.provider || sourceSystem),
        status,
        occurredAt,
        workloadHours: Number(event.workloadHours || event.hours || 0),
        competencyKey: normalizeText(event.competencyKey || event.skillKey || ""),
        rawPayload: event,
        suggestedAction: resolveSuggestedAction(status)
      };
    })
  };
}
