import { useEffect, useState } from "react";
import { Input, Select } from "./FormControls";

export function IncidentQueueCard({
  canManage,
  formatDate,
  incident,
  incidentClassificationOptions,
  incidentStatusOptions,
  onSave
}) {
  const [draft, setDraft] = useState({
    classification: incident.classification,
    status: incident.status,
    assignedTo: incident.assignedTo
  });

  useEffect(() => {
    setDraft({
      classification: incident.classification,
      status: incident.status,
      assignedTo: incident.assignedTo
    });
  }, [incident.assignedTo, incident.classification, incident.status]);

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
          <Input
            label="Responsavel"
            value={draft.assignedTo}
            onChange={(value) => setDraft((current) => ({ ...current, assignedTo: value }))}
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
