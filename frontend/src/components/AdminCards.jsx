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
