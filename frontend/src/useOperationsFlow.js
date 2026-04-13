import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { emptyApplause, emptyIncident } from "./appConfig.js";

function buildApplausePayload(form) {
  const occasionPrefix = form.occasion ? `[Contexto: ${form.occasion}] ` : "";
  const normalizedContext = (form.contextNote || "").trim();
  const contextNote = normalizedContext.startsWith("[Ocasiao:") || normalizedContext.startsWith("[Contexto:")
    ? normalizedContext
    : `${occasionPrefix}${normalizedContext}`.trim();

  return {
    receiverPersonId: form.receiverPersonId,
    category: form.category,
    impact: form.impact,
    contextNote
  };
}

export function useOperationsFlow({
  areas,
  auditTrail,
  people,
  reloadData,
  setActiveSection,
  setError,
  user
}) {
  const [incidentForm, setIncidentForm] = useState(emptyIncident);
  const [applauseForm, setApplauseForm] = useState(emptyApplause);

  const incidentAreaOptions = useMemo(
    () => areas.map((area) => ({ value: area.name, label: area.name })),
    [areas]
  );

  const incidentResponsibleOptions = useMemo(
    () => [
      { value: "", label: "Nao definido", area: "", isAreaManager: false },
      ...people.map((person) => ({
        value: person.id,
        label: `${person.name} · ${person.area}`,
        area: person.area,
        isAreaManager: person.areaManagerPersonId === person.id
      }))
    ],
    [people]
  );

  const applausePeopleOptions = useMemo(() => {
    const peopleOptions = people.map((person) => ({ value: person.id, label: person.name }));
    return peopleOptions.filter((person) => person.value !== user?.person?.id);
  }, [people, user]);

  const incidentAuditEntries = useMemo(
    () => auditTrail.filter((item) => item.category === "incident"),
    [auditTrail]
  );

  const applauseAuditEntries = useMemo(
    () => auditTrail.filter((item) => item.category === "applause"),
    [auditTrail]
  );

  useEffect(() => {
    if (!incidentAreaOptions.length) {
      return;
    }

    if (!incidentAreaOptions.some((option) => option.value === incidentForm.responsibleArea)) {
      const nextArea = incidentAreaOptions[0]?.value || "";
      const nextResponsible =
        incidentResponsibleOptions.find((item) => item.area === nextArea && item.isAreaManager)
          ?.value || "";

      setIncidentForm((current) => ({
        ...current,
        responsibleArea: nextArea,
        assignedPersonId: current.assignedPersonId || nextResponsible
      }));
    }
  }, [
    incidentAreaOptions,
    incidentForm.responsibleArea,
    incidentResponsibleOptions
  ]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const nextReceiverId =
      applausePeopleOptions.find((person) => person.value === applauseForm.receiverPersonId)
        ?.value ||
      applausePeopleOptions[0]?.value ||
      "";

    if (nextReceiverId !== applauseForm.receiverPersonId) {
      setApplauseForm((current) => ({
        ...current,
        receiverPersonId: nextReceiverId
      }));
    }
  }, [applauseForm.receiverPersonId, applausePeopleOptions, user]);

  async function handleIncidentSubmit(event) {
    event.preventDefault();

    try {
      setError("");
      await api.createIncident(incidentForm);
      setIncidentForm(emptyIncident);
      await reloadData();
      setActiveSection("Compliance");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleIncidentUpdate(incidentId, payload) {
    try {
      setError("");
      await api.updateIncident(incidentId, payload);
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleApplauseSubmit(event) {
    event.preventDefault();

    try {
      setError("");
      await api.createApplauseEntry(buildApplausePayload(applauseForm));
      setApplauseForm((current) => ({
        ...emptyApplause,
        receiverPersonId: current.receiverPersonId
      }));
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleApplauseUpdate(applauseId, payload) {
    try {
      setError("");
      await api.updateApplauseEntry(applauseId, payload);
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function resetOperationsFlow() {
    setIncidentForm(emptyIncident);
    setApplauseForm(emptyApplause);
  }

  return {
    applauseAuditEntries,
    applauseForm,
    applausePeopleOptions,
    handleApplauseSubmit,
    handleApplauseUpdate,
    handleIncidentSubmit,
    handleIncidentUpdate,
    incidentAuditEntries,
    incidentAreaOptions,
    incidentForm,
    incidentResponsibleOptions,
    resetOperationsFlow,
    setApplauseForm,
    setIncidentForm
  };
}
