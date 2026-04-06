import {
  getAssignmentStatusBadgeLabel,
  getEvaluationModuleExperience,
  getEvaluationWorkspaceCopy
} from "../appLabels.js";

function NativeSelectField({
  label,
  value = "",
  options = [],
  onChange,
  renderLabel
}) {
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

function NativeTextareaField({
  label,
  value = "",
  rows = 4,
  onChange
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function EvaluationResponsePanel({
  Select,
  Textarea,
  activeCycleModuleSummary,
  activeEvaluationModuleMeta,
  activeEvaluationWorkspace,
  answerForm,
  assignmentDetail,
  canViewEvaluationInsights,
  canViewResponses,
  developmentNote,
  filteredAggregateResponses,
  filteredAssignments,
  filteredIndividualResponses,
  filteredReceivedManagerFeedback,
  formatDate,
  getCycleStatusDescription,
  getRelationshipDescription,
  getRelationshipLabel,
  getVisibilityLabel,
  handleAssignmentSubmit,
  handleReceivedManagerFeedbackSubmit,
  isIndividualJourney,
  receivedManagerFeedbackDrafts,
  selectedAssignment,
  setAnswerForm,
  setDevelopmentNote,
  setReceivedManagerFeedbackDraft,
  setSelectedAssignment,
  setStrengthsNote,
  strengthsNote
}) {
  const SafeSelect = Select || NativeSelectField;
  const SafeTextarea = Textarea || NativeTextareaField;
  const workspaceCopy = getEvaluationWorkspaceCopy(
    activeEvaluationModuleMeta?.key,
    activeEvaluationWorkspace
  );
  const moduleExperience = getEvaluationModuleExperience(
    activeEvaluationModuleMeta?.key,
    activeEvaluationWorkspace
  );

  if (activeEvaluationWorkspace === "operations") {
    return null;
  }

  return (
    <div className="card card-span">
      <div className="card-header">
        <h3>
          {workspaceCopy.heading} {"·"} {activeCycleModuleSummary?.title || "Ciclo ativo"}
        </h3>
        {activeEvaluationWorkspace === "insights" ? <span>Leituras</span> : null}
      </div>
      <div className={isIndividualJourney ? "stack-list" : "two-columns evaluation-response-layout"}>
        {!isIndividualJourney ? (
          <div className="stack-list evaluation-assignment-list">
            <div
              className={`list-card evaluation-workspace-spotlight ${moduleExperience.tone}`}
            >
              {activeEvaluationWorkspace === "insights" && moduleExperience.spotlightItems.length ? (
                <div className="evaluation-context-grid">
                  {moduleExperience.spotlightItems.map((item) => (
                    <div className="evaluation-context-pill" key={item.label}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            {filteredAssignments.length ? (
              filteredAssignments.map((assignment) => (
                <button
                  type="button"
                  className={
                    assignment.id === selectedAssignment
                      ? "list-card button-reset evaluation-assignment-card active"
                      : "list-card button-reset evaluation-assignment-card"
                  }
                  key={assignment.id}
                  onClick={() => setSelectedAssignment(assignment.id)}
                >
                  <div className="row">
                    <strong>
                      {assignment.relationshipType === "company"
                        ? getRelationshipLabel(assignment.relationshipType)
                        : assignment.revieweeName}
                    </strong>
                    <span className="badge">{getAssignmentStatusBadgeLabel(assignment.status)}</span>
                  </div>
                  {assignment.relationshipType !== "company" ? (
                    <p>{getRelationshipLabel(assignment.relationshipType)}</p>
                  ) : null}
                  <div className="evaluation-assignment-meta">
                    <span className="evaluation-assignment-meta-item">
                      Ciclo: {assignment.cycleStatus}
                    </span>
                    <span className="evaluation-assignment-meta-item">
                      Prazo: {formatDate(assignment.dueDate)}
                    </span>
                  </div>
                  <p className="muted">{assignment.collaborationContext}</p>
                </button>
              ))
            ) : (
              <div className="list-card">
                <strong>{workspaceCopy.emptyAssignmentsTitle}</strong>
                <p className="muted">{workspaceCopy.emptyAssignmentsDescription}</p>
              </div>
            )}
          </div>
        ) : null}

        <div className="stack-list">
          {activeEvaluationWorkspace === "respond" ? (
            <RespondView
              Select={SafeSelect}
              Textarea={SafeTextarea}
              activeEvaluationModuleMeta={activeEvaluationModuleMeta}
              answerForm={answerForm}
              assignmentDetail={assignmentDetail}
              developmentNote={developmentNote}
              filteredAssignments={filteredAssignments}
              filteredReceivedManagerFeedback={filteredReceivedManagerFeedback}
              formatDate={formatDate}
              getCycleStatusDescription={getCycleStatusDescription}
              getRelationshipDescription={getRelationshipDescription}
              getRelationshipLabel={getRelationshipLabel}
              getVisibilityLabel={getVisibilityLabel}
              handleAssignmentSubmit={handleAssignmentSubmit}
              handleReceivedManagerFeedbackSubmit={handleReceivedManagerFeedbackSubmit}
              isIndividualJourney={isIndividualJourney}
              moduleExperience={moduleExperience}
              receivedManagerFeedbackDrafts={receivedManagerFeedbackDrafts}
              workspaceCopy={workspaceCopy}
              selectedAssignment={selectedAssignment}
              setAnswerForm={setAnswerForm}
              setDevelopmentNote={setDevelopmentNote}
              setReceivedManagerFeedbackDraft={setReceivedManagerFeedbackDraft}
              setSelectedAssignment={setSelectedAssignment}
              setStrengthsNote={setStrengthsNote}
              strengthsNote={strengthsNote}
            />
          ) : canViewEvaluationInsights && canViewResponses ? (
            <InsightsResponseList
              filteredAggregateResponses={filteredAggregateResponses}
              filteredIndividualResponses={filteredIndividualResponses}
              getRelationshipLabel={getRelationshipLabel}
            />
          ) : (
            <div className="list-card">
              <strong>Leituras restritas</strong>
              <p className="muted">Disponivel apenas para gestor e administrador.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RespondView({
  Select,
  Textarea,
  activeEvaluationModuleMeta,
  answerForm,
  assignmentDetail,
  developmentNote,
  filteredAssignments,
  filteredReceivedManagerFeedback,
  formatDate,
  getCycleStatusDescription,
  getRelationshipDescription,
  getRelationshipLabel,
  getVisibilityLabel,
  handleAssignmentSubmit,
  handleReceivedManagerFeedbackSubmit,
  isIndividualJourney,
  moduleExperience,
  receivedManagerFeedbackDrafts,
  workspaceCopy,
  selectedAssignment,
  setAnswerForm,
  setDevelopmentNote,
  setReceivedManagerFeedbackDraft,
  setSelectedAssignment,
  setStrengthsNote,
  strengthsNote
}) {
  const SafeSelect = Select || NativeSelectField;
  const SafeTextarea = Textarea || NativeTextareaField;
  const questionSections = groupQuestionsBySection(assignmentDetail?.template?.questions || []);

  if (isIndividualJourney && activeEvaluationModuleMeta?.relationshipType === "manager") {
    return (
      <ReceivedManagerFeedbackView
        Textarea={SafeTextarea}
        feedbackItems={filteredReceivedManagerFeedback}
        formatDate={formatDate}
        handleReceivedManagerFeedbackSubmit={handleReceivedManagerFeedbackSubmit}
        receivedManagerFeedbackDrafts={receivedManagerFeedbackDrafts}
        setReceivedManagerFeedbackDraft={setReceivedManagerFeedbackDraft}
      />
    );
  }

  if (!selectedAssignment || !assignmentDetail) {
    return (
      <div className="list-card">
        <strong>{workspaceCopy.selectionTitle}</strong>
        <p className="muted">Selecione um item para continuar.</p>
      </div>
    );
  }

  if (assignmentDetail.assignment.status === "submitted") {
    return (
      <div className="list-card">
        <strong>Avaliacao ja enviada</strong>
        <p className="muted">Escolha outro item pendente.</p>
      </div>
    );
  }

  if (assignmentDetail.assignment.cycleStatus !== "Liberado") {
    return (
      <div className="list-card">
        <strong>Interacao bloqueada</strong>
        <p className="muted">{assignmentDetail.assignment.cycleStatus}</p>
        <p className="muted">
          {getCycleStatusDescription(assignmentDetail.assignment.cycleStatus)}
        </p>
      </div>
    );
  }

  return (
    <form className="card nested-card evaluation-response-form" onSubmit={handleAssignmentSubmit}>
      <div className="card-header">
        <h3>{workspaceCopy.responseTitle}</h3>
        {!isIndividualJourney && assignmentDetail.assignment.relationshipType !== "company" ? (
          <span>{assignmentDetail.assignment.revieweeName}</span>
        ) : null}
      </div>
      {isIndividualJourney && filteredAssignments.length > 1 ? (
        <div className="evaluation-assignment-switcher">
          {filteredAssignments.map((assignment) => (
            <button
              key={assignment.id}
              type="button"
              className={
                assignment.id === selectedAssignment
                  ? "button-reset module-tab active"
                  : "button-reset module-tab"
              }
              onClick={() => setSelectedAssignment(assignment.id)}
            >
              <span className="module-tab-title">
                {assignment.relationshipType === "company"
                  ? getRelationshipLabel(assignment.relationshipType)
                  : assignment.revieweeName}
              </span>
            </button>
          ))}
        </div>
      ) : null}
      {isIndividualJourney ? (
        <div className="list-card evaluation-response-essential">
          <div className="evaluation-assignment-meta">
            <span className="evaluation-assignment-meta-item">
              Prazo: {formatDate(assignmentDetail.assignment.dueDate)}
            </span>
            <span className="evaluation-assignment-meta-item">
              {getCycleStatusDescription(assignmentDetail.assignment.cycleStatus)}
            </span>
          </div>
        </div>
      ) : (
        <div className={`list-card evaluation-response-summary ${moduleExperience.tone}`}>
          <strong>{getRelationshipLabel(assignmentDetail.assignment.relationshipType)}</strong>
          <p className="muted">
            {getRelationshipDescription(assignmentDetail.assignment.relationshipType)}
          </p>
        </div>
      )}
      {questionSections.map((section) => (
        <div className="stack-list" key={section.key}>
          <div className="list-card evaluation-section-block">
            <strong>{section.title}</strong>
            {section.description ? <p className="muted">{section.description}</p> : null}
          </div>
          {section.questions.map((question) => (
            <QuestionField
              key={question.id}
              Select={SafeSelect}
              Textarea={SafeTextarea}
              answerForm={answerForm}
              getVisibilityLabel={getVisibilityLabel}
              question={question}
              scale={assignmentDetail.template.policy.scale}
              setAnswerForm={setAnswerForm}
              workspaceCopy={workspaceCopy}
            />
          ))}
        </div>
      ))}
      {assignmentDetail.template.policy.showStrengthsNote ? (
        <SafeTextarea
          label={workspaceCopy.strengthsLabel}
          value={strengthsNote}
          rows={3}
          onChange={setStrengthsNote}
        />
      ) : null}
      {assignmentDetail.template.policy.showDevelopmentNote ? (
        <SafeTextarea
          label={workspaceCopy.developmentLabel}
          value={developmentNote}
          rows={3}
          onChange={setDevelopmentNote}
        />
      ) : null}
      <button className="primary-button" type="submit">
        {workspaceCopy.submitLabel}
      </button>
    </form>
  );
}

function ReceivedManagerFeedbackView({
  Textarea,
  feedbackItems,
  formatDate,
  handleReceivedManagerFeedbackSubmit,
  receivedManagerFeedbackDrafts,
  setReceivedManagerFeedbackDraft
}) {
  if (!feedbackItems.length) {
    return (
      <div className="list-card">
        <strong>Feedback ainda nao recebido</strong>
        <p className="muted">Aguardando envio do gestor.</p>
      </div>
    );
  }

  return (
    <div className="stack-list feedback-receipt-list">
      <div className="list-card evaluation-response-summary manager">
        <strong>Feedback do lider recebido</strong>
      </div>
      {feedbackItems.map((feedback) => {
        const draft = receivedManagerFeedbackDrafts?.[feedback.id] || {
          status: feedback.revieweeAcknowledgementStatus || "agreed",
          note: feedback.revieweeAcknowledgementNote || ""
        };

        return (
          <article className="list-card feedback-receipt-card" key={feedback.id}>
            <div className="row">
              <div>
                <strong>{feedback.reviewerName || "Seu gestor"}</strong>
                <p className="muted">
                  Recebido em {formatDate(feedback.submittedAt)} · Score geral:{" "}
                  {feedback.overallScore ?? "-"}
                </p>
              </div>
              <span className="badge">
                {getAcknowledgementBadgeLabel(feedback.revieweeAcknowledgementStatus)}
              </span>
            </div>
            {feedback.strengthsNote ? (
              <div className="feedback-receipt-highlight">
                <strong>Pontos fortes</strong>
                <p className="muted">{feedback.strengthsNote}</p>
              </div>
            ) : null}
            {feedback.developmentNote ? (
              <div className="feedback-receipt-highlight">
                <strong>Oportunidades de desenvolvimento</strong>
                <p className="muted">{feedback.developmentNote}</p>
              </div>
            ) : null}
            <div className="feedback-answer-grid">
              {(feedback.answers || []).map((answer) => (
                <div className="feedback-answer-item" key={answer.id}>
                  <strong>{answer.dimensionTitle || answer.questionPrompt || "Pergunta"}</strong>
                  {answer.questionPrompt ? <p className="muted">{answer.questionPrompt}</p> : null}
                  <p>{formatFeedbackAnswer(answer)}</p>
                </div>
              ))}
            </div>
            <div className="feedback-acknowledgement-panel">
              <strong>Voce concorda com esse feedback?</strong>
              <div className="feedback-acknowledgement-actions">
                <button
                  type="button"
                  className={
                    draft.status === "agreed" ? "primary-button" : "refresh"
                  }
                  onClick={() =>
                    setReceivedManagerFeedbackDraft(feedback.id, {
                      status: "agreed",
                      note: ""
                    })
                  }
                >
                  Concordo
                </button>
                <button
                  type="button"
                  className={
                    draft.status === "disagreed" ? "primary-button" : "refresh"
                  }
                  onClick={() =>
                    setReceivedManagerFeedbackDraft(feedback.id, {
                      status: "disagreed"
                    })
                  }
                >
                  Discordo
                </button>
              </div>
              {draft.status === "disagreed" ? (
                <Textarea
                  label="Explique por que voce discorda"
                  value={draft.note || ""}
                  rows={4}
                  onChange={(value) =>
                    setReceivedManagerFeedbackDraft(feedback.id, { note: value })
                  }
                />
              ) : null}
              {feedback.revieweeAcknowledgedAt ? (
                <p className="muted">
                  Ultimo retorno registrado em {formatDate(feedback.revieweeAcknowledgedAt)}.
                </p>
              ) : null}
              <button
                className="primary-button"
                type="button"
                onClick={() => handleReceivedManagerFeedbackSubmit(feedback.id)}
              >
                {feedback.revieweeAcknowledgementStatus ? "Atualizar retorno" : "Enviar retorno"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function groupQuestionsBySection(questions) {
  return questions.reduce((acc, question) => {
    const existing = acc.find((item) => item.key === question.sectionKey);
    if (existing) {
      existing.questions.push(question);
      return acc;
    }

    acc.push({
      key: question.sectionKey || question.dimensionKey || question.id,
      title: question.sectionTitle || question.dimensionTitle,
      description: question.sectionDescription || "",
      questions: [question]
    });
    return acc;
  }, []);
}

function QuestionField({
  Select,
  Textarea,
  answerForm,
  getVisibilityLabel,
  question,
  scale,
  setAnswerForm,
  workspaceCopy
}) {
  const SafeSelect = Select || NativeSelectField;
  const SafeTextarea = Textarea || NativeTextareaField;
  const answerValue = answerForm[question.id] || {};
  const scaleOptions = Array.isArray(scale) && scale.length
    ? scale
    : [1, 2, 3, 4, 5].map((value) => ({ value, label: String(value) }));

  return (
    <div className="list-card evaluation-question-panel">
      <div className="evaluation-question-head">
        <strong>{question.dimensionTitle}</strong>
        <span className="evaluation-visibility-pill">{getVisibilityLabel(question.visibility)}</span>
      </div>
      <p className="muted">{question.prompt}</p>
      {question.helperText ? <p className="muted">{question.helperText}</p> : null}
      {question.inputType === "text" ? (
        <SafeTextarea
          label="Resposta"
          value={answerValue.textValue ?? ""}
          rows={4}
          onChange={(value) =>
            setAnswerForm({
              ...answerForm,
              [question.id]: {
                ...answerValue,
                textValue: value
              }
            })
          }
        />
      ) : question.inputType === "multi-select" ? (
        <label className="field">
          <span>Selecione uma ou mais opcoes</span>
          <div className="checkbox-stack">
            {(question.options || []).map((option) => {
              const isChecked = (answerValue.selectedOptions || []).includes(option.value);
              return (
                <label className="checkbox-option" key={option.value}>
                  <input
                    checked={isChecked}
                    type="checkbox"
                    onChange={() => {
                      const current = new Set(answerValue.selectedOptions || []);
                      if (current.has(option.value)) {
                        current.delete(option.value);
                      } else {
                        current.add(option.value);
                      }
                      setAnswerForm({
                        ...answerForm,
                        [question.id]: {
                          ...answerValue,
                          selectedOptions: Array.from(current)
                        }
                      });
                    }}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
        </label>
      ) : (
        <>
          <div className="evaluation-question-controls">
            <SafeSelect
              label="Resposta"
              value={String(answerValue.score ?? 3)}
              options={scaleOptions.map((item) => String(item.value))}
              renderLabel={(value) =>
                scaleOptions.find((item) => String(item.value) === value)?.label || value
              }
              onChange={(value) =>
                setAnswerForm({
                  ...answerForm,
                  [question.id]: {
                    ...answerValue,
                    score: Number(value)
                  }
                })
              }
            />
          </div>
          {question.collectEvidenceOnExtreme ? (
            <SafeTextarea
              label={workspaceCopy.evidenceLabel}
              value={answerValue.evidenceNote ?? ""}
              rows={3}
              onChange={(value) =>
                setAnswerForm({
                  ...answerForm,
                  [question.id]: {
                    ...answerValue,
                    evidenceNote: value
                  }
                })
              }
            />
          ) : null}
        </>
      )}
    </div>
  );
}

function InsightsResponseList({
  filteredAggregateResponses,
  filteredIndividualResponses,
  getRelationshipLabel
}) {
  return (
    <>
      <div className="list-card">
        <strong>Respostas individuais visiveis</strong>
        <p className="muted">Lideranca e empresa aparecem apenas de forma agregada.</p>
      </div>
      {filteredIndividualResponses.length ? (
        filteredIndividualResponses.map((response) => (
          <article className="list-card" key={response.id}>
            <strong>
              {response.reviewerName} {"->"} {response.revieweeName}
            </strong>
            <p className="muted">{getRelationshipLabel(response.relationshipType)}</p>
            <p className="muted">Score geral: {response.overallScore}</p>
            <p className="muted">
              Peso aplicado: {(response.weight * 100).toFixed(1)}% | Score ponderado:{" "}
              {response.weightedScore}
            </p>
            <p className="muted">{response.strengthsNote}</p>
          </article>
        ))
      ) : (
        <div className="list-card">
          <strong>Sem respostas individuais neste submodulo</strong>
          <p className="muted">
            O recorte atual nao possui respostas individuais visiveis para o seu perfil.
          </p>
        </div>
      )}

      {filteredAggregateResponses.length ? (
        filteredAggregateResponses.map((aggregate) => (
          <article className="list-card" key={aggregate.relationshipType}>
            <strong>{getRelationshipLabel(aggregate.relationshipType)}</strong>
            <p className="muted">Respostas: {aggregate.totalResponses}</p>
            <p className="muted">Media geral: {aggregate.averageScore}</p>
            {aggregate.questionAverages.map((question) => (
              <p className="muted" key={question.questionId}>
                {question.dimensionTitle}: {question.averageScore} ({question.totalResponses} respostas)
              </p>
            ))}
          </article>
        ))
      ) : (
        <div className="list-card">
          <strong>Sem leitura agregada neste submodulo</strong>
          <p className="muted">
            O recorte atual ainda nao atingiu o minimo necessario ou nao usa agregacao.
          </p>
        </div>
      )}
    </>
  );
}

function formatFeedbackAnswer(answer) {
  if (answer.answerType === "text") {
    return answer.textValue || "Sem comentario registrado.";
  }
  if (answer.answerType === "multi-select") {
    return answer.selectedOptions?.length
      ? answer.selectedOptions.join(", ")
      : "Nenhuma opcao selecionada.";
  }
  if (Number.isFinite(Number(answer.score))) {
    return `Nota ${answer.score}${answer.evidenceNote ? ` · ${answer.evidenceNote}` : ""}`;
  }
  return answer.evidenceNote || "Sem resposta registrada.";
}

function getAcknowledgementBadgeLabel(status) {
  if (status === "agreed") {
    return "Concordou";
  }
  if (status === "disagreed") {
    return "Discordou";
  }
  return "Aguardando retorno";
}
