import { useEffect, useState } from "react";
import { workModeOptions } from "../appConfig.js";
import { getRoleLabel } from "../appLabels.js";
import { Input, Select, Textarea } from "./FormControls";

function getEmploymentTypeLabel(value) {
  if (value === "consultant") {
    return "Consultor";
  }
  if (value === "internal") {
    return "Interno";
  }
  return value || "-";
}

function getDevelopmentPlanStatusLabel(value) {
  if (value === "completed") {
    return "Concluido";
  }
  if (value === "archived") {
    return "Arquivado";
  }
  return "Ativo";
}

function getDevelopmentProgressStatusLabel(value) {
  if (value === "in_progress") {
    return "Em andamento";
  }
  if (value === "blocked") {
    return "Com impedimento";
  }
  if (value === "done") {
    return "Concluido";
  }
  return "Ainda nao iniciado";
}

export function IncidentQueueCard({
  areaOptions,
  canManage,
  formatDate,
  incident,
  incidentClassificationOptions,
  responsibleOptions,
  incidentStatusOptions,
  onSave
}) {
  const [draft, setDraft] = useState({
    classification: incident.classification,
    status: incident.status,
    responsibleArea: incident.responsibleArea || "",
    assignedPersonId: incident.assignedPersonId || ""
  });

  useEffect(() => {
    setDraft({
      classification: incident.classification,
      status: incident.status,
      responsibleArea: incident.responsibleArea || "",
      assignedPersonId: incident.assignedPersonId || ""
    });
  }, [
    incident.assignedPersonId,
    incident.classification,
    incident.responsibleArea,
    incident.status
  ]);

  const filteredResponsibleOptions = responsibleOptions.filter((option) => {
    if (!draft.responsibleArea || option.value === "") {
      return true;
    }
    return option.area === draft.responsibleArea;
  });

  useEffect(() => {
    if (
      draft.assignedPersonId &&
      !filteredResponsibleOptions.some((option) => option.value === draft.assignedPersonId)
    ) {
      setDraft((current) => ({
        ...current,
        assignedPersonId: ""
      }));
    }
  }, [draft.assignedPersonId, filteredResponsibleOptions]);

  return (
    <article className="list-card compact-list-card">
      <div className="row">
        <strong>{incident.title}</strong>
        <span className="badge">{incident.status}</span>
      </div>
      <p>{incident.category}</p>
      <p className="muted">Classificacao: {incident.classification}</p>
      <p className="muted">
        {incident.anonymity === "anonymous" ? "Anonimo" : incident.reporterLabel}
      </p>
      <p className="muted">Area responsavel: {incident.responsibleArea || "Nao definida"}</p>
      <p className="muted">Responsavel: {incident.assignedTo}</p>
      <p className="muted">Abertura: {formatDate(incident.createdAt)}</p>
      <p className="muted">{incident.description}</p>
      {canManage ? (
        <div className="incident-actions compact-actions">
          <Select
            label="Status"
            value={draft.status}
            options={incidentStatusOptions}
            onChange={(value) => setDraft((current) => ({ ...current, status: value }))}
          />
          <Select
            label="Classificacao"
            value={draft.classification}
            options={incidentClassificationOptions}
            onChange={(value) =>
              setDraft((current) => ({ ...current, classification: value }))
            }
          />
          <Select
            label="Area responsavel"
            value={draft.responsibleArea}
            options={areaOptions.map((item) => item.value)}
            renderLabel={(value) =>
              areaOptions.find((item) => item.value === value)?.label || value
            }
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                responsibleArea: value
              }))
            }
          />
          <Select
            label="Responsavel designado"
            value={draft.assignedPersonId}
            options={filteredResponsibleOptions.map((item) => item.value)}
            renderLabel={(value) =>
              filteredResponsibleOptions.find((item) => item.value === value)?.label || value
            }
            onChange={(value) =>
              setDraft((current) => ({ ...current, assignedPersonId: value }))
            }
          />
          <button
            type="button"
            className="primary-button"
            onClick={() => onSave(incident.id, draft)}
          >
            Salvar tratamento
          </button>
        </div>
      ) : null}
    </article>
  );
}

export function UserAdminCard({ onSave, user, userRoleOptions, userStatusOptions }) {
  const [draft, setDraft] = useState({
    email: user.email,
    roleKey: user.roleKey,
    status: user.status,
    password: ""
  });

  useEffect(() => {
    setDraft({
      email: user.email,
      roleKey: user.roleKey,
      status: user.status,
      password: ""
    });
  }, [user.email, user.roleKey, user.status]);

  return (
    <article className="list-card compact-list-card">
      <div className="row">
        <strong>{user.personName}</strong>
        <span className="badge">{user.status}</span>
      </div>
      <p>{user.email}</p>
      <p className="muted">
        {user.personArea} | Perfil atual: {getRoleLabel(user.roleKey)}
      </p>
      <p className="muted">
        {user.personRoleTitle || "Cargo nao informado"} | Gestor direto: {user.managerName || "Nao definido"}
      </p>
      <p className="muted">Lider da area: {user.areaManagerName || "Nao definido"}</p>
      <p className="muted">
        Unidade: {user.personWorkUnit || "-"} | Modalidade:{" "}
        {user.personWorkMode === "onsite"
          ? "Presencial"
          : user.personWorkMode === "remote"
            ? "100% Home Office"
            : "Hibrido"}
      </p>
      <div className="incident-actions compact-actions">
        <Input
          label="Email"
          type="email"
          value={draft.email}
          onChange={(value) => setDraft((current) => ({ ...current, email: value }))}
        />
        <Select
          label="Perfil de acesso"
          value={draft.roleKey}
          options={userRoleOptions}
          renderLabel={(value) => getRoleLabel(value)}
          onChange={(value) => setDraft((current) => ({ ...current, roleKey: value }))}
        />
        <Select
          label="Status"
          value={draft.status}
          options={userStatusOptions}
          onChange={(value) => setDraft((current) => ({ ...current, status: value }))}
        />
        <Input
          label="Nova senha"
          type="password"
          helper="Opcional. Preencha apenas para redefinir a senha."
          value={draft.password}
          onChange={(value) => setDraft((current) => ({ ...current, password: value }))}
        />
        <button
          type="button"
          className="primary-button"
          onClick={() => onSave(user.id, draft)}
        >
          Atualizar acesso
        </button>
      </div>
    </article>
  );
}

export function AreaAdminCard({ area, onSave }) {
  const [draft, setDraft] = useState({
    name: area.name
  });

  useEffect(() => {
    setDraft({
      name: area.name
    });
  }, [area.name]);

  return (
    <article className="list-card compact-list-card">
      <div className="row">
        <strong>{area.name}</strong>
        <span className="badge">{area.peopleCount} pessoas</span>
      </div>
      <p className="muted">Lider atual da area: {area.managerName || "Nao definido"}</p>
      <div className="incident-actions compact-actions structure-actions">
        <Input
          label="Nome da area"
          value={draft.name}
          onChange={(value) => setDraft((current) => ({ ...current, name: value }))}
        />
        <button type="button" className="primary-button" onClick={() => onSave(area.id, draft)}>
          Salvar area
        </button>
      </div>
    </article>
  );
}

function getAccessJourneyLabel(accessState, linkedUser) {
  if (accessState?.key === "active") {
    return `Acesso ativo · ${getRoleLabel(linkedUser?.roleKey)}`;
  }
  if (accessState?.key === "inactive") {
    return `Acesso inativo · ${getRoleLabel(linkedUser?.roleKey)}`;
  }
  return "Acesso pendente";
}

export function PersonStructureCard({
  accessState,
  areaOptions,
  managerOptions,
  onPrepareUserProvisioning,
  onSave,
  person
}) {
  const [draft, setDraft] = useState({
    name: person.name,
    roleTitle: person.roleTitle,
    area: person.area,
    workUnit: person.workUnit || "",
    workMode: person.workMode || "hybrid",
    managerPersonId: person.managerPersonId || "",
    isAreaManager: person.areaManagerPersonId === person.id ? "yes" : "no",
    employmentType: person.employmentType || "internal"
  });

  useEffect(() => {
    setDraft({
      name: person.name,
      roleTitle: person.roleTitle,
      area: person.area,
      workUnit: person.workUnit || "",
      workMode: person.workMode || "hybrid",
      managerPersonId: person.managerPersonId || "",
      isAreaManager: person.areaManagerPersonId === person.id ? "yes" : "no",
      employmentType: person.employmentType || "internal"
    });
  }, [
    person.area,
    person.areaManagerPersonId,
    person.employmentType,
    person.managerPersonId,
    person.name,
    person.roleTitle,
    person.workMode,
    person.workUnit
  ]);

  return (
    <article className="list-card compact-list-card">
      <div className="row">
        <strong>{person.name}</strong>
        <span className="badge">
          {person.areaManagerPersonId === person.id
            ? "Lider da area"
            : getEmploymentTypeLabel(person.employmentType)}
        </span>
      </div>
      <p className="muted">
        {person.roleTitle} | {person.area}
      </p>
      <p className="muted">
        Gestor direto: {person.managerName || "Nao definido"} | Lider atual da area:{" "}
        {person.areaManagerName || "Nao definido"}
      </p>
      <p className="muted">
        Unidade: {person.workUnit || "-"} | Modalidade:{" "}
        {person.workMode === "onsite"
          ? "Presencial"
          : person.workMode === "remote"
            ? "100% Home Office"
            : "Hibrido"}
      </p>
      <p className="muted">{getAccessJourneyLabel(accessState, accessState?.user)}</p>
      <p className="muted">
        Satisfacao atual:{" "}
        {Number.isFinite(Number(person.satisfactionScore))
          ? Number(person.satisfactionScore).toFixed(1)
          : "Aguardando pesquisa"}
      </p>
      <div className="incident-actions compact-actions structure-actions">
        <Input
          label="Nome"
          value={draft.name}
          onChange={(value) => setDraft((current) => ({ ...current, name: value }))}
        />
        <Input
          label="Cargo"
          value={draft.roleTitle}
          onChange={(value) => setDraft((current) => ({ ...current, roleTitle: value }))}
        />
        <Select
          label="Area"
          value={draft.area}
          options={areaOptions.map((item) => item.value)}
          renderLabel={(value) => areaOptions.find((item) => item.value === value)?.label || value}
          onChange={(value) => setDraft((current) => ({ ...current, area: value }))}
        />
        <Select
          label="Gestor direto"
          value={draft.managerPersonId}
          options={managerOptions.map((item) => item.value)}
          renderLabel={(value) =>
            managerOptions.find((item) => item.value === value)?.label || value
          }
          helper="Pessoa que acompanha as entregas e responde pela gestao direta deste colaborador."
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              managerPersonId: value
            }))
          }
        />
        <Select
          label="Lider da area"
          value={draft.isAreaManager}
          options={["no", "yes"]}
          renderLabel={(value) => (value === "yes" ? "Sim" : "Nao")}
          helper="Marque Sim apenas quando esta pessoa for a lider atual da area."
          onChange={(value) => setDraft((current) => ({ ...current, isAreaManager: value }))}
        />
        <Input
          label="Unidade de trabalho"
          value={draft.workUnit}
          onChange={(value) => setDraft((current) => ({ ...current, workUnit: value }))}
        />
        <Select
          label="Modalidade"
          value={draft.workMode}
          options={workModeOptions}
          renderLabel={(value) =>
            value === "onsite"
              ? "Presencial"
              : value === "remote"
                ? "100% Home Office"
                : "Hibrido"
          }
          onChange={(value) => setDraft((current) => ({ ...current, workMode: value }))}
        />
        <Select
          label="Vinculo"
          value={draft.employmentType}
          options={["internal", "consultant"]}
          renderLabel={(value) => (value === "internal" ? "Interno" : "Consultor")}
          onChange={(value) => setDraft((current) => ({ ...current, employmentType: value }))}
        />
        <button type="button" className="primary-button" onClick={() => onSave(person.id, draft)}>
          Salvar vinculos
        </button>
        {accessState?.key === "pending" ? (
          <button
            type="button"
            className="refresh"
            onClick={() => onPrepareUserProvisioning?.(person.id)}
          >
            Criar acesso
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function DevelopmentRecordAdminCard({
  developmentRecordTypes,
  getDevelopmentTrackLabel,
  onSave,
  personOptions,
  record
}) {
  const [draft, setDraft] = useState({
    personId: record.personId,
    recordType: record.recordType,
    title: record.title,
    providerName: record.providerName,
    completedAt: record.completedAt,
    skillSignal: record.skillSignal,
    notes: record.notes || "",
    status: record.status || "active"
  });

  useEffect(() => {
    setDraft({
      personId: record.personId,
      recordType: record.recordType,
      title: record.title,
      providerName: record.providerName,
      completedAt: record.completedAt,
      skillSignal: record.skillSignal,
      notes: record.notes || "",
      status: record.status || "active"
    });
  }, [
    record.completedAt,
    record.notes,
    record.personId,
    record.providerName,
    record.recordType,
    record.skillSignal,
    record.status,
    record.title
  ]);

  const statusLabel = draft.status === "archived" ? "Arquivado" : "Ativo";

  return (
    <article className="list-card compact-list-card">
      <div className="row">
        <strong>{record.title}</strong>
        <span className="badge">{statusLabel}</span>
      </div>
      <p>{record.personName}</p>
      <p className="muted">
        {getDevelopmentTrackLabel(record.recordType)} | {record.providerName}
      </p>
      <p className="muted">Competencia / eixo: {record.skillSignal}</p>
      <p className="muted">Conclusao: {record.completedAt}</p>
      <div className="incident-actions compact-actions structure-actions">
        <Select
          label="Pessoa"
          value={draft.personId}
          options={personOptions.map((item) => item.value)}
          renderLabel={(value) => personOptions.find((item) => item.value === value)?.label || value}
          onChange={(value) => setDraft((current) => ({ ...current, personId: value }))}
        />
        <Select
          label="Tipo"
          value={draft.recordType}
          options={developmentRecordTypes}
          renderLabel={getDevelopmentTrackLabel}
          onChange={(value) => setDraft((current) => ({ ...current, recordType: value }))}
        />
        <Input
          label="Titulo"
          value={draft.title}
          onChange={(value) => setDraft((current) => ({ ...current, title: value }))}
        />
        <Input
          label="Instituicao / provedor"
          value={draft.providerName}
          onChange={(value) => setDraft((current) => ({ ...current, providerName: value }))}
        />
        <Input
          label="Conclusao"
          type="date"
          value={draft.completedAt}
          onChange={(value) => setDraft((current) => ({ ...current, completedAt: value }))}
        />
        <Input
          label="Competencia / eixo"
          value={draft.skillSignal}
          onChange={(value) => setDraft((current) => ({ ...current, skillSignal: value }))}
        />
        <Input
          label="Notas"
          value={draft.notes}
          onChange={(value) => setDraft((current) => ({ ...current, notes: value }))}
        />
        <Select
          label="Status"
          value={draft.status}
          options={["active", "archived"]}
          renderLabel={(value) => (value === "archived" ? "Arquivado" : "Ativo")}
          onChange={(value) => setDraft((current) => ({ ...current, status: value }))}
        />
        <button type="button" className="primary-button" onClick={() => onSave(record.id, draft)}>
          Salvar registro
        </button>
      </div>
    </article>
  );
}

export function DevelopmentPlanAdminCard({
  canEdit = true,
  canReportProgress = false,
  competencyOptions,
  cycleOptions,
  onSave,
  onProgressSave,
  personOptions,
  plan,
  progressStatusOptions = [],
  statusOptions
}) {
  const [draft, setDraft] = useState({
    personId: plan.personId,
    cycleId: plan.cycleId || "",
    competencyId: plan.competencyId || "",
    focusTitle: plan.focusTitle,
    actionText: plan.actionText,
    dueDate: plan.dueDate,
    expectedEvidence: plan.expectedEvidence,
    status: plan.status || "active"
  });
  const [progressDraft, setProgressDraft] = useState({
    progressStatus: plan.progressStatus || "not_started",
    progressNote: plan.progressNote || ""
  });

  useEffect(() => {
    setDraft({
      personId: plan.personId,
      cycleId: plan.cycleId || "",
      competencyId: plan.competencyId || "",
      focusTitle: plan.focusTitle,
      actionText: plan.actionText,
      dueDate: plan.dueDate,
      expectedEvidence: plan.expectedEvidence,
      status: plan.status || "active"
    });
    setProgressDraft({
      progressStatus: plan.progressStatus || "not_started",
      progressNote: plan.progressNote || ""
    });
  }, [
    plan.actionText,
    plan.competencyId,
    plan.cycleId,
    plan.dueDate,
    plan.expectedEvidence,
    plan.focusTitle,
    plan.personId,
    plan.progressNote,
    plan.progressStatus,
    plan.status
  ]);

  const progressOptions = progressStatusOptions.length
    ? progressStatusOptions
    : ["not_started", "in_progress", "blocked", "done"];

  return (
    <article className="list-card compact-list-card">
      <div className="row">
        <strong>{plan.focusTitle}</strong>
        <span className="badge">{getDevelopmentPlanStatusLabel(draft.status)}</span>
      </div>
      <p>{plan.personName}</p>
      <p className="muted">
        {plan.competencyName || "Competencia livre"}
        {plan.cycleTitle ? ` | ${plan.cycleTitle}` : ""}
      </p>
      <p className="muted">Prazo: {plan.dueDate}</p>
      {canEdit ? (
        <div className="incident-actions compact-actions structure-actions">
          <Select
            label="Pessoa"
            value={draft.personId}
            options={personOptions.map((item) => item.value)}
            renderLabel={(value) =>
              personOptions.find((item) => item.value === value)?.label || value
            }
            onChange={(value) => setDraft((current) => ({ ...current, personId: value }))}
          />
          <Select
            label="Ciclo"
            value={draft.cycleId}
            options={cycleOptions.map((item) => item.value)}
            renderLabel={(value) => cycleOptions.find((item) => item.value === value)?.label || value}
            onChange={(value) => setDraft((current) => ({ ...current, cycleId: value }))}
          />
          <Select
            label="Competencia"
            value={draft.competencyId}
            options={competencyOptions.map((item) => item.value)}
            renderLabel={(value) =>
              competencyOptions.find((item) => item.value === value)?.label || value
            }
            onChange={(value) => setDraft((current) => ({ ...current, competencyId: value }))}
          />
          <Input
            label="Foco"
            value={draft.focusTitle}
            onChange={(value) => setDraft((current) => ({ ...current, focusTitle: value }))}
          />
          <Textarea
            label="Acao"
            rows={3}
            value={draft.actionText}
            onChange={(value) => setDraft((current) => ({ ...current, actionText: value }))}
          />
          <Input
            label="Prazo"
            type="date"
            value={draft.dueDate}
            onChange={(value) => setDraft((current) => ({ ...current, dueDate: value }))}
          />
          <Textarea
            label="Evidencia esperada"
            rows={3}
            value={draft.expectedEvidence}
            onChange={(value) =>
              setDraft((current) => ({ ...current, expectedEvidence: value }))
            }
          />
          <Select
            label="Status"
            value={draft.status}
            options={statusOptions}
            renderLabel={getDevelopmentPlanStatusLabel}
            onChange={(value) => setDraft((current) => ({ ...current, status: value }))}
          />
          <button type="button" className="primary-button" onClick={() => onSave(plan.id, draft)}>
            Salvar PDI
          </button>
        </div>
      ) : (
        <div className="development-plan-readonly-grid">
          <div>
            <span>Acao definida</span>
            <strong>{plan.actionText}</strong>
          </div>
          <div>
            <span>Evidencia esperada</span>
            <strong>{plan.expectedEvidence}</strong>
          </div>
        </div>
      )}
      <div className="development-plan-progress-box">
        <div className="row">
          <strong>Andamento</strong>
          <span className="badge">{getDevelopmentProgressStatusLabel(progressDraft.progressStatus)}</span>
        </div>
        {canReportProgress ? (
          <div className="incident-actions compact-actions structure-actions">
            <Select
              label="Status do andamento"
              value={progressDraft.progressStatus}
              options={progressOptions}
              renderLabel={getDevelopmentProgressStatusLabel}
              onChange={(value) =>
                setProgressDraft((current) => ({ ...current, progressStatus: value }))
              }
            />
            <Textarea
              label="Reporte do colaborador"
              rows={3}
              value={progressDraft.progressNote}
              onChange={(value) =>
                setProgressDraft((current) => ({ ...current, progressNote: value }))
              }
            />
            <button
              type="button"
              className="secondary-button"
              onClick={() => onProgressSave(plan.id, progressDraft)}
            >
              Reportar andamento
            </button>
          </div>
        ) : (
          <p className="muted">
            {plan.progressNote || "Ainda sem reporte de andamento pelo colaborador."}
          </p>
        )}
        {plan.progressUpdatedAt ? (
          <p className="muted">Atualizado em {String(plan.progressUpdatedAt).slice(0, 10)}</p>
        ) : null}
      </div>
    </article>
  );
}

export function ApplauseAdminCard({ onSave, personOptions, record }) {
  const [draft, setDraft] = useState({
    receiverPersonId: record.receiverPersonId,
    category: record.category,
    impact: record.impact,
    contextNote: record.contextNote,
    status: record.status || "Validado"
  });

  useEffect(() => {
    setDraft({
      receiverPersonId: record.receiverPersonId,
      category: record.category,
      impact: record.impact,
      contextNote: record.contextNote,
      status: record.status || "Validado"
    });
  }, [record.category, record.contextNote, record.impact, record.receiverPersonId, record.status]);

  return (
    <article className="list-card compact-list-card">
      <div className="row">
        <strong>
          {record.senderName} {"->"} {record.receiverName}
        </strong>
        <span className="badge">{draft.status}</span>
      </div>
      <p>{record.category}</p>
      <p className="muted">Impacto atual: {record.impact}</p>
      <p className="muted">{record.contextNote}</p>
      <div className="incident-actions compact-actions structure-actions">
        <Select
          label="Quem recebe"
          value={draft.receiverPersonId}
          options={personOptions.map((item) => item.value)}
          renderLabel={(value) => personOptions.find((item) => item.value === value)?.label || value}
          onChange={(value) => setDraft((current) => ({ ...current, receiverPersonId: value }))}
        />
        <Select
          label="Categoria"
          value={draft.category}
          options={[
            "Colaboracao",
            "Apoio em momento critico",
            "Resolucao de problema",
            "Postura exemplar",
            "Compartilhamento de conhecimento"
          ]}
          onChange={(value) => setDraft((current) => ({ ...current, category: value }))}
        />
        <Input
          label="Impacto"
          value={draft.impact}
          onChange={(value) => setDraft((current) => ({ ...current, impact: value }))}
        />
        <Input
          label="Contexto"
          value={draft.contextNote}
          onChange={(value) => setDraft((current) => ({ ...current, contextNote: value }))}
        />
        <Select
          label="Status"
          value={draft.status}
          options={["Validado", "Em revisao", "Arquivado"]}
          onChange={(value) => setDraft((current) => ({ ...current, status: value }))}
        />
        <button type="button" className="primary-button" onClick={() => onSave(record.id, draft)}>
          Salvar Aplause
        </button>
      </div>
    </article>
  );
}
