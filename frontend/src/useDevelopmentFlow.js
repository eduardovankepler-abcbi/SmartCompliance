import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import {
  academicDevelopmentTypes,
  developmentViewLabels,
  emptyDevelopment,
  emptyDevelopmentPlan
} from "./appConfig.js";

export function useDevelopmentFlow({
  auditTrail,
  canManageDevelopmentScope,
  canViewOrganizationDevelopment,
  canViewTeamDevelopment,
  competencies,
  cycles,
  developmentPlans,
  developmentRecords,
  learningIntegrationEvents,
  people,
  reloadData,
  setError,
  user
}) {
  const [activeDevelopmentView, setActiveDevelopmentView] = useState("personal");
  const [developmentForm, setDevelopmentForm] = useState(emptyDevelopment);
  const [developmentPlanForm, setDevelopmentPlanForm] = useState(emptyDevelopmentPlan);
  const [learningIntegrationDrafts, setLearningIntegrationDrafts] = useState({});

  const developmentPeopleOptions = useMemo(() => {
    const peopleOptions = people.map((person) => ({ value: person.id, label: person.name }));

    if (canManageDevelopmentScope) {
      return peopleOptions;
    }

    return peopleOptions.filter((person) => person.value === user?.person?.id);
  }, [canManageDevelopmentScope, people, user]);

  const teamDevelopmentPeopleOptions = useMemo(
    () =>
      developmentPeopleOptions.filter(
        (person) =>
          people.find((item) => item.id === person.value)?.managerPersonId === user?.person?.id
      ),
    [developmentPeopleOptions, people, user]
  );

  const developmentViewOptions = useMemo(() => {
    const views = [{ key: "personal", ...developmentViewLabels.personal }];

    if (canViewTeamDevelopment) {
      views.push({ key: "team", ...developmentViewLabels.team });
    }

    if (canViewOrganizationDevelopment) {
      views.push({ key: "organization", ...developmentViewLabels.organization });
    }

    return views;
  }, [canViewOrganizationDevelopment, canViewTeamDevelopment]);

  const filteredDevelopmentRecords = useMemo(() => {
    if (!user) {
      return [];
    }

    if (activeDevelopmentView === "organization") {
      return developmentRecords;
    }

    if (activeDevelopmentView === "team") {
      const visibleIds = new Set(teamDevelopmentPeopleOptions.map((person) => person.value));
      return developmentRecords.filter((record) => visibleIds.has(record.personId));
    }

    return developmentRecords.filter((record) => record.personId === user.person.id);
  }, [activeDevelopmentView, developmentRecords, teamDevelopmentPeopleOptions, user]);

  const filteredDevelopmentPlans = useMemo(() => {
    if (!user) {
      return [];
    }

    if (activeDevelopmentView === "organization") {
      return developmentPlans;
    }

    if (activeDevelopmentView === "team") {
      const visibleIds = new Set(teamDevelopmentPeopleOptions.map((person) => person.value));
      return developmentPlans.filter((plan) => visibleIds.has(plan.personId));
    }

    return developmentPlans.filter((plan) => plan.personId === user.person.id);
  }, [activeDevelopmentView, developmentPlans, teamDevelopmentPeopleOptions, user]);

  const activeDevelopmentRecords = useMemo(
    () => filteredDevelopmentRecords.filter((record) => (record.status || "active") !== "archived"),
    [filteredDevelopmentRecords]
  );

  const developmentFormPeopleOptions = useMemo(() => {
    if (!user) {
      return [];
    }

    if (activeDevelopmentView === "organization") {
      return developmentPeopleOptions;
    }

    if (activeDevelopmentView === "team") {
      return teamDevelopmentPeopleOptions;
    }

    return developmentPeopleOptions.filter((person) => person.value === user.person.id);
  }, [activeDevelopmentView, developmentPeopleOptions, teamDevelopmentPeopleOptions, user]);

  const developmentEditablePeopleOptions = useMemo(() => {
    const visiblePeople = new Map();

    filteredDevelopmentRecords.forEach((record) => {
      if (!visiblePeople.has(record.personId)) {
        visiblePeople.set(record.personId, {
          value: record.personId,
          label: record.personName
        });
      }
    });

    developmentFormPeopleOptions.forEach((person) => {
      if (!visiblePeople.has(person.value)) {
        visiblePeople.set(person.value, person);
      }
    });

    return Array.from(visiblePeople.values());
  }, [developmentFormPeopleOptions, filteredDevelopmentRecords]);

  const developmentPlanPeopleOptions = useMemo(() => {
    if (!user) {
      return [];
    }

    if (activeDevelopmentView === "organization") {
      return developmentPeopleOptions;
    }

    if (activeDevelopmentView === "team") {
      return teamDevelopmentPeopleOptions;
    }

    return developmentPeopleOptions.filter((person) => person.value === user.person.id);
  }, [activeDevelopmentView, developmentPeopleOptions, teamDevelopmentPeopleOptions, user]);

  const developmentEditablePlanPeopleOptions = useMemo(() => {
    const visiblePeople = new Map();

    filteredDevelopmentPlans.forEach((plan) => {
      if (!visiblePeople.has(plan.personId)) {
        visiblePeople.set(plan.personId, {
          value: plan.personId,
          label: plan.personName
        });
      }
    });

    developmentPlanPeopleOptions.forEach((person) => {
      if (!visiblePeople.has(person.value)) {
        visiblePeople.set(person.value, person);
      }
    });

    return Array.from(visiblePeople.values());
  }, [developmentPlanPeopleOptions, filteredDevelopmentPlans]);

  const developmentPlanCycleOptions = useMemo(
    () => [
      { value: "", label: "Sem ciclo vinculado" },
      ...cycles.map((cycle) => ({
        value: cycle.id,
        label: `${cycle.title} · ${cycle.semesterLabel}`
      }))
    ],
    [cycles]
  );

  const developmentPlanCompetencyOptions = useMemo(
    () => [
      { value: "", label: "Competencia livre" },
      ...competencies.map((competency) => ({
        value: competency.id,
        label: competency.name
      }))
    ],
    [competencies]
  );

  const developmentMetrics = useMemo(() => {
    const peopleInScope = new Set(activeDevelopmentRecords.map((record) => record.personId)).size;
    const academicRecords = activeDevelopmentRecords.filter((record) =>
      academicDevelopmentTypes.has(record.recordType)
    ).length;
    const certificationRecords = activeDevelopmentRecords.filter(
      (record) => record.recordType === "Certificacao"
    ).length;
    const continuousLearningRecords = activeDevelopmentRecords.filter(
      (record) =>
        !academicDevelopmentTypes.has(record.recordType) &&
        record.recordType !== "Certificacao"
    ).length;

    return [
      { label: "Registros no recorte", value: activeDevelopmentRecords.length },
      { label: "Formacao academica", value: academicRecords },
      { label: "Certificacoes", value: certificationRecords },
      {
        label: activeDevelopmentView === "personal" ? "Pessoas em foco" : "Pessoas no recorte",
        value: peopleInScope
      },
      { label: "Aprendizagem continua", value: continuousLearningRecords }
    ];
  }, [activeDevelopmentView, activeDevelopmentRecords]);

  const developmentHighlights = useMemo(
    () =>
      Object.values(
        activeDevelopmentRecords.reduce((acc, record) => {
          const entry = acc[record.personId] || {
            personId: record.personId,
            personName: record.personName,
            totalRecords: 0,
            academicRecords: 0,
            latestDate: "",
            latestTitle: ""
          };

          entry.totalRecords += 1;
          if (academicDevelopmentTypes.has(record.recordType)) {
            entry.academicRecords += 1;
          }
          if (!entry.latestDate || new Date(record.completedAt) > new Date(entry.latestDate)) {
            entry.latestDate = record.completedAt;
            entry.latestTitle = record.title;
          }

          acc[record.personId] = entry;
          return acc;
        }, {})
      ).sort((left, right) => right.totalRecords - left.totalRecords),
    [activeDevelopmentRecords]
  );

  const developmentAuditEntries = useMemo(
    () => auditTrail.filter((item) => item.category === "development"),
    [auditTrail]
  );

  const learningIntegrationEventsForReview = useMemo(
    () =>
      (learningIntegrationEvents || []).filter(
        (event) => (event.processingStatus || "") !== "applied"
      ),
    [learningIntegrationEvents]
  );

  const learningIntegrationSummary = useMemo(() => {
    const events = learningIntegrationEvents || [];
    return {
      total: events.length,
      pending: learningIntegrationEventsForReview.length,
      ready: events.filter((event) => event.processingStatus === "ready_for_review").length,
      needsReview: events.filter((event) => event.processingStatus === "needs_review").length,
      applied: events.filter((event) => event.processingStatus === "applied").length
    };
  }, [learningIntegrationEvents, learningIntegrationEventsForReview]);

  const learningIntegrationPeopleOptions = useMemo(
    () => people.map((person) => ({ value: person.id, label: person.name })),
    [people]
  );

  const learningIntegrationReviewItems = useMemo(
    () =>
      learningIntegrationEventsForReview.map((event) => {
        const mappedCompetency =
          competencies.find(
            (competency) =>
              String(competency.key || "").toLowerCase() ===
              String(event.competencyKey || "").toLowerCase()
          )?.id || "";
        const draft = learningIntegrationDrafts[event.id] || {};

        return {
          ...event,
          reviewDraft: {
            personId: draft.personId ?? event.personId ?? "",
            competencyId: draft.competencyId ?? mappedCompetency,
            reviewNote: draft.reviewNote ?? "",
            dueDate: draft.dueDate ?? ""
          }
        };
      }),
    [competencies, learningIntegrationDrafts, learningIntegrationEventsForReview]
  );

  useEffect(() => {
    if (!developmentViewOptions.some((view) => view.key === activeDevelopmentView)) {
      setActiveDevelopmentView(developmentViewOptions[0]?.key || "personal");
    }
  }, [activeDevelopmentView, developmentViewOptions]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const nextPersonId =
      developmentFormPeopleOptions.find((person) => person.value === developmentForm.personId)
        ?.value ||
      developmentFormPeopleOptions[0]?.value ||
      user.person.id;

    if (nextPersonId !== developmentForm.personId) {
      setDevelopmentForm((current) => ({
        ...current,
        personId: nextPersonId
      }));
    }
  }, [developmentForm.personId, developmentFormPeopleOptions, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const nextPersonId =
      developmentPlanPeopleOptions.find((person) => person.value === developmentPlanForm.personId)
        ?.value ||
      developmentPlanPeopleOptions[0]?.value ||
      user.person.id;

    if (nextPersonId !== developmentPlanForm.personId) {
      setDevelopmentPlanForm((current) => ({
        ...current,
        personId: nextPersonId
      }));
    }
  }, [developmentPlanForm.personId, developmentPlanPeopleOptions, user]);

  async function handleDevelopmentSubmit(event) {
    event.preventDefault();

    try {
      setError("");
      await api.createDevelopmentRecord(developmentForm);
      setDevelopmentForm((current) => ({
        ...emptyDevelopment,
        personId: current.personId
      }));
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDevelopmentUpdate(recordId, payload) {
    try {
      setError("");
      await api.updateDevelopmentRecord(recordId, payload);
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDevelopmentPlanSubmit(event) {
    event.preventDefault();

    try {
      setError("");
      await api.createDevelopmentPlan({
        ...developmentPlanForm,
        cycleId: developmentPlanForm.cycleId || null,
        competencyId: developmentPlanForm.competencyId || null
      });
      setDevelopmentPlanForm((current) => ({
        ...emptyDevelopmentPlan,
        personId: current.personId
      }));
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDevelopmentPlanUpdate(planId, payload) {
    try {
      setError("");
      await api.updateDevelopmentPlan(planId, {
        ...payload,
        cycleId: payload.cycleId || null,
        competencyId: payload.competencyId || null
      });
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function setLearningIntegrationDraft(eventId, patch) {
    setLearningIntegrationDrafts((current) => ({
      ...current,
      [eventId]: {
        ...(current[eventId] || {}),
        ...patch
      }
    }));
  }

  async function handleLearningIntegrationApply(eventId) {
    const draft = learningIntegrationDrafts[eventId] || {};
    try {
      setError("");
      await api.applyLearningIntegrationEvent(eventId, {
        personId: draft.personId || undefined,
        competencyId: draft.competencyId || undefined,
        dueDate: draft.dueDate || undefined,
        reviewNote: draft.reviewNote || undefined
      });
      setLearningIntegrationDrafts((current) => {
        const next = { ...current };
        delete next[eventId];
        return next;
      });
      await reloadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function resetDevelopmentFlow() {
    setActiveDevelopmentView("personal");
    setDevelopmentForm(emptyDevelopment);
    setDevelopmentPlanForm(emptyDevelopmentPlan);
  }

  return {
    activeDevelopmentView,
    developmentAuditEntries,
    developmentEditablePeopleOptions,
    developmentEditablePlanPeopleOptions,
    developmentForm,
    developmentFormPeopleOptions,
    developmentHighlights,
    developmentMetrics,
    developmentPlanCompetencyOptions,
    developmentPlanCycleOptions,
    developmentPlanForm,
    developmentPlanPeopleOptions,
    developmentViewOptions,
    filteredDevelopmentPlans,
    filteredDevelopmentRecords,
    handleDevelopmentPlanSubmit,
    handleDevelopmentPlanUpdate,
    handleDevelopmentSubmit,
    handleDevelopmentUpdate,
    handleLearningIntegrationApply,
    learningIntegrationPeopleOptions,
    learningIntegrationReviewItems,
    learningIntegrationSummary,
    resetDevelopmentFlow,
    setActiveDevelopmentView,
    setDevelopmentForm,
    setLearningIntegrationDraft,
    setDevelopmentPlanForm
  };
}
