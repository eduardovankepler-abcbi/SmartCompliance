import { useEffect, useState } from "react";
import { Input, Select } from "./FormControls";

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
    roleKey: user.roleKey,
    status: user.status,
    password: ""
  });

  useEffect(() => {
    setDraft({
      roleKey: user.roleKey,
      status: user.status,
      password: ""
    });
  }, [user.roleKey, user.status]);

  return (
    <article className="list-card compact-list-card">
      <div className="row">
        <strong>{user.personName}</strong>
        <span className="badge">{user.status}</span>
      </div>
      <p>{user.email}</p>
      <p className="muted">
        {user.personArea} | Perfil atual: {user.roleKey}
      </p>
      <div className="incident-actions compact-actions">
        <Select
          label="Nivel de acesso"
          value={draft.roleKey}
          options={userRoleOptions}
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

export function AreaAdminCard({ area, managerOptions, onSave }) {
  const [draft, setDraft] = useState({
    name: area.name,
    managerPersonId: area.managerPersonId || ""
  });

  useEffect(() => {
    setDraft({
      name: area.name,
      managerPersonId: area.managerPersonId || ""
    });
  }, [area.managerPersonId, area.name]);

  return (
    <article className="list-card compact-list-card">
      <div className="row">
        <strong>{area.name}</strong>
        <span className="badge">{area.peopleCount} pessoas</span>
      </div>
      <p className="muted">Gestor responsavel: {area.managerName || "Nao definido"}</p>
      <div className="incident-actions compact-actions structure-actions">
        <Input
          label="Nome da area"
          value={draft.name}
          onChange={(value) => setDraft((current) => ({ ...current, name: value }))}
        />
        <Select
          label="Gestor responsavel"
          value={draft.managerPersonId}
          options={managerOptions.map((item) => item.value)}
          renderLabel={(value) =>
            managerOptions.find((item) => item.value === value)?.label || value
          }
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              managerPersonId: value
            }))
          }
        />
        <button type="button" className="primary-button" onClick={() => onSave(area.id, draft)}>
          Salvar area
        </button>
      </div>
    </article>
  );
}

export function PersonStructureCard({ areaOptions, managerOptions, onSave, person }) {
  const [draft, setDraft] = useState({
    name: person.name,
    roleTitle: person.roleTitle,
    area: person.area,
    managerPersonId: person.managerPersonId || "",
    employmentType: person.employmentType || "internal"
  });

  useEffect(() => {
    setDraft({
      name: person.name,
      roleTitle: person.roleTitle,
      area: person.area,
      managerPersonId: person.managerPersonId || "",
      employmentType: person.employmentType || "internal"
    });
  }, [
    person.area,
    person.employmentType,
    person.managerPersonId,
    person.name,
    person.roleTitle
  ]);

  return (
    <article className="list-card compact-list-card">
      <div className="row">
        <strong>{person.name}</strong>
        <span className="badge">{person.employmentType || "internal"}</span>
      </div>
      <p className="muted">
        {person.roleTitle} | {person.area}
      </p>
      <p className="muted">
        Gestor atual: {person.managerName || "Nao definido"} | Responsavel da area:{" "}
        {person.areaManagerName || "Nao definido"}
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
          label="Gestor"
          value={draft.managerPersonId}
          options={managerOptions.map((item) => item.value)}
          renderLabel={(value) =>
            managerOptions.find((item) => item.value === value)?.label || value
          }
          onChange={(value) =>
            setDraft((current) => ({
              ...current,
              managerPersonId: value
            }))
          }
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
