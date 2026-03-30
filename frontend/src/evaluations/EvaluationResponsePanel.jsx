import {
  getAssignmentStatusBadgeLabel,
  getEvaluationModuleExperience,
  getEvaluationWorkspaceCopy
} from "../appLabels.js";

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
  formatDate,
  getCycleStatusDescription,
  getRelationshipDescription,
  getRelationshipLabel,
  getVisibilityLabel,
  handleAssignmentSubmit,
  selectedAssignment,
  setAnswerForm,
  setDevelopmentNote,
  setSelectedAssignment,
  setStrengthsNote,
  strengthsNote
}) {
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
        {activeEvaluationWorkspace === "insights" ? <span>{workspaceCopy.description}</span> : null}
      </div>
      <div className="two-columns evaluation-response-layout">
        <div className="stack-list evaluation-assignment-list">
          <div
            className={`list-card evaluation-workspace-spotlight ${moduleExperience.tone}`}
          >
            <p className="muted">{workspaceCopy.description}</p>
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

        <div className="stack-list">
          {activeEvaluationWorkspace === "respond" ? (
            <RespondView
              Select={Select}
              Textarea={Textarea}
              answerForm={answerForm}
              assignmentDetail={assignmentDetail}
              developmentNote={developmentNote}
              getCycleStatusDescription={getCycleStatusDescription}
              getRelationshipDescription={getRelationshipDescription}
              getRelationshipLabel={getRelationshipLabel}
              getVisibilityLabel={getVisibilityLabel}
              handleAssignmentSubmit={handleAssignmentSubmit}
              moduleExperience={moduleExperience}
              workspaceCopy={workspaceCopy}
              selectedAssignment={selectedAssignment}
              setAnswerForm={setAnswerForm}
              setDevelopmentNote={setDevelopmentNote}
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
              <p className="muted">
                Consolidacoes e comparacoes entre ciclos ficam disponiveis apenas para gestor e
                administrador.
              </p>
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
  answerForm,
  assignmentDetail,
  developmentNote,
  getCycleStatusDescription,
  getRelationshipDescription,
  getRelationshipLabel,
  getVisibilityLabel,
  handleAssignmentSubmit,
  moduleExperience,
  workspaceCopy,
  selectedAssignment,
  setAnswerForm,
  setDevelopmentNote,
  setStrengthsNote,
  strengthsNote
}) {
  const questionSections = groupQuestionsBySection(assignmentDetail?.template?.questions || []);

  if (!selectedAssignment || !assignmentDetail) {
    return (
      <div className="list-card">
        <strong>{workspaceCopy.selectionTitle}</strong>
        <p className="muted">{workspaceCopy.selectionDescription}</p>
      </div>
    );
  }

  if (assignmentDetail.assignment.status === "submitted") {
    return (
      <div className="list-card">
        <strong>Avaliacao ja enviada</strong>
        <p className="muted">
          Este assignment ja foi concluido. Escolha outro item pendente para responder.
        </p>
      </div>
    );
  }

  if (assignmentDetail.assignment.cycleStatus !== "Liberado") {
    return (
      <div className="list-card">
        <strong>Interacao bloqueada</strong>
        <p className="muted">
          Este assignment pertence a um ciclo em{" "}
          {assignmentDetail.assignment.cycleStatus.toLowerCase()}.
        </p>
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
        {assignmentDetail.assignment.relationshipType !== "company" ? (
          <span>{assignmentDetail.assignment.revieweeName}</span>
        ) : null}
      </div>
      <div className={`list-card evaluation-response-summary ${moduleExperience.tone}`}>
        <strong>{getRelationshipLabel(assignmentDetail.assignment.relationshipType)}</strong>
        <p className="muted">
          {getRelationshipDescription(assignmentDetail.assignment.relationshipType)}
        </p>
      </div>
      {questionSections.map((section) => (
        <div className="stack-list" key={section.key}>
          <div className="list-card evaluation-section-block">
            <strong>{section.title}</strong>
            {section.description ? <p className="muted">{section.description}</p> : null}
          </div>
          {section.questions.map((question) => (
            <QuestionField
              key={question.id}
              Select={Select}
              Textarea={Textarea}
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
        <Textarea
          label={workspaceCopy.strengthsLabel}
          value={strengthsNote}
          rows={3}
          onChange={setStrengthsNote}
        />
      ) : null}
      {assignmentDetail.template.policy.showDevelopmentNote ? (
        <Textarea
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
  const answerValue = answerForm[question.id] || {};

  return (
    <div className="list-card evaluation-question-panel">
      <div className="evaluation-question-head">
        <strong>{question.dimensionTitle}</strong>
        <span className="evaluation-visibility-pill">{getVisibilityLabel(question.visibility)}</span>
      </div>
      <p className="muted">{question.prompt}</p>
      {question.helperText ? <p className="muted">{question.helperText}</p> : null}
      {question.inputType === "text" ? (
        <Textarea
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
            <Select
              label="Resposta"
              value={String(answerValue.score ?? 3)}
              options={scale.map((item) => String(item.value))}
              renderLabel={(value) =>
                scale.find((item) => String(item.value) === value)?.label || value
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
            <Textarea
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
