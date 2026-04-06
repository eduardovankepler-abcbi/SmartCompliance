import { getEvaluationWorkspaceCopy } from "../appLabels.js";

function NativeSelectField({ label, value = "", options = [], onChange, renderLabel }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {renderLabel ? renderLabel(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}

function NativeTextareaField({ label, value = "", rows = 4, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function FeedbackRequestPanel({
  Select,
  Textarea,
  activeEvaluationModuleMeta,
  activeEvaluationWorkspace,
  canManageFeedbackRequests,
  feedbackProviderOptions,
  feedbackRequestCycleOptions,
  feedbackRequestForm,
  filteredFeedbackRequests,
  formatDate,
  getFeedbackRequestStatusLabel,
  handleFeedbackProviderToggle,
  handleFeedbackRequestReview,
  handleFeedbackRequestSubmit,
  setFeedbackRequestForm
}) {
  const SafeSelect = Select || NativeSelectField;
  const SafeTextarea = Textarea || NativeTextareaField;

  if (
    activeEvaluationWorkspace !== "respond" ||
    activeEvaluationModuleMeta?.relationshipType !== "peer"
  ) {
    return null;
  }

  const workspaceCopy = getEvaluationWorkspaceCopy(activeEvaluationModuleMeta?.key, "respond");

  return (
    <div className="card card-span">
      <div className="card-header">
        <h3>{workspaceCopy.heading} · fornecedores</h3>
        <span>Selecione ate 3 pessoas com quem voce colaborou diretamente</span>
      </div>
      <div className="two-columns">
        <form className="stack-list" onSubmit={handleFeedbackRequestSubmit}>
          <div className="list-card evaluation-workspace-spotlight">
            <strong>Selecionar fornecedores</strong>
            <p className="muted">{workspaceCopy.description}</p>
          </div>
          <SafeSelect
            label="Ciclo"
            value={feedbackRequestForm.cycleId}
            options={(feedbackRequestCycleOptions || []).map((cycle) => cycle.id)}
            renderLabel={(value) =>
              (feedbackRequestCycleOptions || []).find((cycle) => cycle.id === value)?.title || value
            }
            onChange={(value) =>
              setFeedbackRequestForm({ ...feedbackRequestForm, cycleId: value })
            }
          />
          <div className="list-card">
            <strong>Fornecedores selecionados</strong>
            <p className="muted">
              {feedbackRequestForm.providerPersonIds.length} de 3 pessoas escolhidas.
            </p>
          </div>
          <div className="selection-grid">
            {(feedbackProviderOptions || []).map((person) => {
              const selected = feedbackRequestForm.providerPersonIds.includes(person.value);
              return (
                <button
                  key={person.value}
                  type="button"
                  className={
                    selected
                      ? "list-card button-reset selection-card active"
                      : "list-card button-reset selection-card"
                  }
                  onClick={() => handleFeedbackProviderToggle(person.value)}
                >
                  <strong>{person.label}</strong>
                  <p className="muted">
                    {selected ? "Selecionado para a solicitacao" : "Clique para incluir"}
                  </p>
                </button>
              );
            })}
          </div>
          <SafeTextarea
            label="Contexto da colaboracao"
            value={feedbackRequestForm.contextNote}
            onChange={(value) =>
              setFeedbackRequestForm({ ...feedbackRequestForm, contextNote: value })
            }
          />
          <button className="primary-button" type="submit">
            Solicitar feedback direto
          </button>
        </form>

        <div className="stack-list">
          <div className="list-card">
            <strong>Fila de solicitacoes</strong>
            <p className="muted">
              RH/Admin aprovam a solicitacao e o sistema gera os assignments de feedback direto.
            </p>
          </div>
          {(filteredFeedbackRequests || []).length ? (
            (filteredFeedbackRequests || []).map((request) => (
              <article className="list-card" key={request.id}>
                <div className="row">
                  <strong>{request.revieweeName}</strong>
                  <span className="badge">{getFeedbackRequestStatusLabel(request.status)}</span>
                </div>
                <p>{request.cycleTitle}</p>
                <p className="muted">
                  Fornecedores: {request.providers.map((item) => item.providerName).join(", ")}
                </p>
                <p className="muted">{request.contextNote}</p>
                <p className="muted">Solicitado em {formatDate(request.requestedAt)}</p>
                {request.decidedByName ? (
                  <p className="muted">
                    Tratado por {request.decidedByName} em {formatDate(request.decidedAt)}
                  </p>
                ) : null}
                {canManageFeedbackRequests && request.status === "pending" ? (
                  <div className="action-row">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => handleFeedbackRequestReview(request.id, "approved")}
                    >
                      Aprovar
                    </button>
                    <button
                      type="button"
                      className="refresh"
                      onClick={() => handleFeedbackRequestReview(request.id, "rejected")}
                    >
                      Recusar
                    </button>
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <div className="list-card">
              <strong>Nenhuma solicitacao registrada</strong>
              <p className="muted">
                As solicitacoes de feedback direto aparecerao aqui conforme o ciclo for sendo
                preparado.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
