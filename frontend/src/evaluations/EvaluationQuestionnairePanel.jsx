import { useEffect, useMemo, useRef, useState } from "react";
import { getRelationshipDescription, getRelationshipLabel } from "../appLabels.js";

function NativeInputField({ label, value = "", onChange, type = "text" }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

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

function getQuestionnaireStatusLabel(status) {
  if (status === "draft") {
    return "Rascunho";
  }
  if (status === "published") {
    return "Publicado";
  }
  if (status === "archived") {
    return "Arquivado";
  }
  return status || "-";
}

function getQuestionnaireVisibilityLabel(value) {
  if (value === "restricted") {
    return "Restrita";
  }
  if (value === "confidential") {
    return "Confidencial";
  }
  if (value === "private") {
    return "Privada";
  }
  if (value === "shared") {
    return "Compartilhada";
  }
  return value || "-";
}

export function EvaluationQuestionnairePanel({
  Input,
  Select,
  Textarea,
  cancelEvaluationQuestionEdit,
  canViewEvaluationLibrary,
  cycles,
  editingEvaluationQuestionId,
  evaluationQuestionDraft,
  evaluationQuestionnaireFilters = {
    revieweePersonId: "all",
    status: "all"
  },
  evaluationQuestionnaireCreateForm,
  evaluationQuestionnaireDraft,
  evaluationQuestionnaireRelationshipOptions,
  evaluationQuestionnaireRequiredCounts,
  evaluationQuestionnaires,
  formatDate,
  handleEvaluationQuestionDelete,
  handleCloneQuestionnaireFromExisting,
  handleEvaluationQuestionReorder,
  handleEvaluationQuestionSave,
  handleLoadQuestionnaireFromLibrary,
  handleEvaluationQuestionnaireArchive,
  handleEvaluationQuestionnaireCreate,
  handleEvaluationQuestionnairePublish,
  handleEvaluationQuestionnaireUpdate,
  people,
  revieweeQuestionnaireOptions,
  selectedEvaluationQuestionnaire,
  selectedEvaluationQuestionnaireId,
  setEvaluationQuestionDraft,
  setEvaluationQuestionnaireFilters,
  setEvaluationQuestionnaireCreateForm,
  setEvaluationQuestionnaireDraft,
  setEvaluationQuestionnairePolicyValue,
  setSelectedEvaluationQuestionnaireId,
  showEvaluationQuestionnaires,
  startEvaluationQuestionEdit
}) {
  const SafeInput = Input || NativeInputField;
  const SafeSelect = Select || NativeSelectField;
  const SafeTextarea = Textarea || NativeTextareaField;
  const [cloneSourceQuestionnaireId, setCloneSourceQuestionnaireId] = useState("");
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
  const questionFormRef = useRef(null);
  const cloneCandidates = useMemo(
    () =>
      (evaluationQuestionnaires || []).filter(
        (questionnaire) =>
          questionnaire.id !== selectedEvaluationQuestionnaire?.id &&
          questionnaire.relationshipType === selectedEvaluationQuestionnaire?.relationshipType &&
          questionnaire.questions?.length
      ),
    [evaluationQuestionnaires, selectedEvaluationQuestionnaire]
  );

  useEffect(() => {
    setIsQuestionFormOpen(false);
  }, [selectedEvaluationQuestionnaireId]);

  useEffect(() => {
    if (editingEvaluationQuestionId) {
      setIsQuestionFormOpen(true);
    }
  }, [editingEvaluationQuestionId]);

  useEffect(() => {
    if (isQuestionFormOpen) {
      questionFormRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
  }, [editingEvaluationQuestionId, isQuestionFormOpen]);

  if (!canViewEvaluationLibrary || !showEvaluationQuestionnaires) {
    return null;
  }

  const cycleOptions = (cycles || []).map((cycle) => ({
    value: cycle.id,
    label: `${cycle.title} · ${cycle.semesterLabel}`
  }));
  const selectedReviewee =
    people?.find((person) => person.id === selectedEvaluationQuestionnaire?.revieweePersonId) || null;
  const selectedCycle =
    cycles?.find((cycle) => cycle.id === selectedEvaluationQuestionnaire?.cycleId) || null;
  const requiredCount =
    evaluationQuestionnaireRequiredCounts?.[
      selectedEvaluationQuestionnaire?.relationshipType || "self"
    ] || 0;
  const currentQuestions = selectedEvaluationQuestionnaire?.questions || [];
  const isDraft = selectedEvaluationQuestionnaire?.status === "draft";

  return (
    <div className="card card-span">
      <div className="card-header">
        <div>
          <h3>Questionarios individuais</h3>
          <span>Direcione perguntas personalizadas por colaborador</span>
        </div>
        <span>{evaluationQuestionnaires?.length || 0} configurado(s)</span>
      </div>

      <div className="stack-list">
        <form className="list-card" onSubmit={handleEvaluationQuestionnaireCreate}>
          <div className="row">
            <div>
              <strong>Novo rascunho individual</strong>
              <p className="muted">
                Crie questionarios para lider, autoavaliacao e colega do mesmo setor.
              </p>
            </div>
            <button className="primary-button" type="submit">
              Criar rascunho
            </button>
          </div>
          <div className="dashboard-filter-grid">
            <SafeSelect
              label="Ciclo"
              value={evaluationQuestionnaireCreateForm.cycleId}
              options={cycleOptions.map((item) => item.value)}
              renderLabel={(value) =>
                cycleOptions.find((item) => item.value === value)?.label || value
              }
              onChange={(value) =>
                setEvaluationQuestionnaireCreateForm((current) => ({
                  ...current,
                  cycleId: value
                }))
              }
            />
            <SafeSelect
              label="Tipo"
              value={evaluationQuestionnaireCreateForm.relationshipType}
              options={evaluationQuestionnaireRelationshipOptions}
              renderLabel={(value) => getRelationshipLabel(value)}
              onChange={(value) =>
                setEvaluationQuestionnaireCreateForm((current) => ({
                  ...current,
                  relationshipType: value
                }))
              }
            />
            <SafeSelect
              label="Colaborador"
              value={evaluationQuestionnaireCreateForm.revieweePersonId}
              options={revieweeQuestionnaireOptions.map((item) => item.value)}
              renderLabel={(value) =>
                revieweeQuestionnaireOptions.find((item) => item.value === value)?.label || value
              }
              onChange={(value) =>
                setEvaluationQuestionnaireCreateForm((current) => ({
                  ...current,
                  revieweePersonId: value
                }))
              }
            />
          </div>
          <SafeInput
            label="Titulo"
            value={evaluationQuestionnaireCreateForm.title}
            onChange={(value) =>
              setEvaluationQuestionnaireCreateForm((current) => ({
                ...current,
                title: value
              }))
            }
          />
          <SafeTextarea
            label="Descricao"
            rows={3}
            value={evaluationQuestionnaireCreateForm.description}
            onChange={(value) =>
              setEvaluationQuestionnaireCreateForm((current) => ({
                ...current,
                description: value
              }))
            }
          />
        </form>

        <div className="list-card">
          <div className="card-header">
            <div>
              <strong>Filtros operacionais</strong>
              <p className="muted">Refine a lista por colaborador e status do questionario.</p>
            </div>
            <span>{evaluationQuestionnaires?.length || 0} visivel(is)</span>
          </div>
          <div className="dashboard-filter-grid">
            <SafeSelect
              label="Colaborador"
              value={evaluationQuestionnaireFilters.revieweePersonId}
              options={["all", ...revieweeQuestionnaireOptions.map((item) => item.value)]}
              renderLabel={(value) =>
                value === "all"
                  ? "Todos os colaboradores"
                  : revieweeQuestionnaireOptions.find((item) => item.value === value)?.label ||
                    value
              }
              onChange={(value) =>
                setEvaluationQuestionnaireFilters((current) => ({
                  ...current,
                  revieweePersonId: value
                }))
              }
            />
            <SafeSelect
              label="Status"
              value={evaluationQuestionnaireFilters.status}
              options={["all", "draft", "published", "archived"]}
              renderLabel={(value) =>
                value === "all" ? "Todos os status" : getQuestionnaireStatusLabel(value)
              }
              onChange={(value) =>
                setEvaluationQuestionnaireFilters((current) => ({
                  ...current,
                  status: value
                }))
              }
            />
          </div>
        </div>

        <div className="two-columns evaluation-response-layout">
          <div className="stack-list evaluation-assignment-list">
            {evaluationQuestionnaires?.length ? (
              evaluationQuestionnaires.map((questionnaire) => {
                const reviewee = people?.find((person) => person.id === questionnaire.revieweePersonId);
                const cycle = cycles?.find((item) => item.id === questionnaire.cycleId);
                return (
                  <button
                    key={questionnaire.id}
                    type="button"
                    className={
                      questionnaire.id === selectedEvaluationQuestionnaireId
                        ? "list-card button-reset evaluation-assignment-card active"
                        : "list-card button-reset evaluation-assignment-card"
                    }
                    onClick={() => setSelectedEvaluationQuestionnaireId(questionnaire.id)}
                  >
                    <div className="row">
                      <strong>{questionnaire.title}</strong>
                      <span className="badge">{getQuestionnaireStatusLabel(questionnaire.status)}</span>
                    </div>
                    <p>{reviewee?.name || "Colaborador nao encontrado"}</p>
                    <div className="evaluation-assignment-meta">
                      <span className="evaluation-assignment-meta-item">
                        {getRelationshipLabel(questionnaire.relationshipType)}
                      </span>
                      <span className="evaluation-assignment-meta-item">
                        {questionnaire.questionCount} /{" "}
                        {evaluationQuestionnaireRequiredCounts?.[questionnaire.relationshipType] || 0}
                      </span>
                    </div>
                    <p className="muted">{cycle?.title || questionnaire.cycleId}</p>
                  </button>
                );
              })
            ) : (
              <div className="list-card">
                <strong>Nenhum questionario individual ainda</strong>
                <p className="muted">
                  Crie o primeiro rascunho para comecar a direcionar perguntas por colaborador.
                </p>
              </div>
            )}
          </div>

          <div className="stack-list">
            {!selectedEvaluationQuestionnaire ? (
              <div className="list-card">
                <strong>Selecione um rascunho</strong>
                <p className="muted">
                  Abra um questionario da lista para editar a politica de acesso e as perguntas.
                </p>
              </div>
            ) : (
              <>
                <form className="list-card" onSubmit={handleEvaluationQuestionnaireUpdate}>
                  <div className="card-header">
                    <div>
                      <strong>{selectedEvaluationQuestionnaire.title}</strong>
                      <p className="muted">
                        {selectedReviewee?.name || selectedEvaluationQuestionnaire.revieweePersonId} ·{" "}
                        {getRelationshipLabel(selectedEvaluationQuestionnaire.relationshipType)}
                      </p>
                    </div>
                    <span className="badge">
                      {getQuestionnaireStatusLabel(selectedEvaluationQuestionnaire.status)}
                    </span>
                  </div>
                  <div className="metrics-grid">
                    <div className="mini-card">
                      <p className="mini-label">Ciclo</p>
                      <strong>{selectedCycle?.title || selectedEvaluationQuestionnaire.cycleId}</strong>
                    </div>
                    <div className="mini-card">
                      <p className="mini-label">Cobertura</p>
                      <strong>
                        {selectedEvaluationQuestionnaire.questionCount} / {requiredCount}
                      </strong>
                    </div>
                    <div className="mini-card">
                      <p className="mini-label">Privacidade</p>
                      <strong>
                        {getQuestionnaireVisibilityLabel(
                          selectedEvaluationQuestionnaire.visibilityLevel
                        )}
                      </strong>
                    </div>
                    <div className="mini-card">
                      <p className="mini-label">Publicacao</p>
                      <strong>{formatDate(selectedEvaluationQuestionnaire.publishedAt)}</strong>
                    </div>
                  </div>
                  <SafeInput
                    label="Titulo"
                    value={evaluationQuestionnaireDraft.title}
                    onChange={(value) =>
                      setEvaluationQuestionnaireDraft((current) => ({
                        ...current,
                        title: value
                      }))
                    }
                  />
                  <SafeTextarea
                    label="Descricao"
                    rows={3}
                    value={evaluationQuestionnaireDraft.description}
                    onChange={(value) =>
                      setEvaluationQuestionnaireDraft((current) => ({
                        ...current,
                        description: value
                      }))
                    }
                  />
                  <SafeSelect
                    label="Visibilidade"
                    value={evaluationQuestionnaireDraft.visibilityLevel}
                    options={["restricted", "confidential", "private", "shared"]}
                    renderLabel={(value) => getQuestionnaireVisibilityLabel(value)}
                    onChange={(value) =>
                      setEvaluationQuestionnaireDraft((current) => ({
                        ...current,
                        visibilityLevel: value
                      }))
                    }
                  />
                  <div className="checkbox-stack">
                    <label className="checkbox-option">
                      <input
                        checked={Boolean(evaluationQuestionnaireDraft.accessPolicy?.canViewManager)}
                        type="checkbox"
                        onChange={(event) =>
                          setEvaluationQuestionnairePolicyValue(
                            "canViewManager",
                            event.target.checked
                          )
                        }
                      />
                      <span>Gestor direto pode ver respostas sensiveis</span>
                    </label>
                    <label className="checkbox-option">
                      <input
                        checked={Boolean(evaluationQuestionnaireDraft.accessPolicy?.canViewHr)}
                        type="checkbox"
                        onChange={(event) =>
                          setEvaluationQuestionnairePolicyValue("canViewHr", event.target.checked)
                        }
                      />
                      <span>RH pode ver respostas sensiveis</span>
                    </label>
                    <label className="checkbox-option">
                      <input
                        checked={Boolean(evaluationQuestionnaireDraft.accessPolicy?.canViewAdmin)}
                        type="checkbox"
                        onChange={(event) =>
                          setEvaluationQuestionnairePolicyValue(
                            "canViewAdmin",
                            event.target.checked
                          )
                        }
                      />
                      <span>Admin pode ver respostas sensiveis</span>
                    </label>
                    <label className="checkbox-option">
                      <input
                        checked={Boolean(
                          evaluationQuestionnaireDraft.accessPolicy?.canViewRawAnswers
                        )}
                        type="checkbox"
                        onChange={(event) =>
                          setEvaluationQuestionnairePolicyValue(
                            "canViewRawAnswers",
                            event.target.checked
                          )
                        }
                      />
                      <span>Permitir respostas completas sem mascaramento</span>
                    </label>
                    <label className="checkbox-option">
                      <input
                        checked={Boolean(
                          evaluationQuestionnaireDraft.accessPolicy
                            ?.canViewPromptTextAfterSubmission
                        )}
                        type="checkbox"
                        onChange={(event) =>
                          setEvaluationQuestionnairePolicyValue(
                            "canViewPromptTextAfterSubmission",
                            event.target.checked
                          )
                        }
                      />
                      <span>Exibir enunciado da pergunta apos a submissao</span>
                    </label>
                  </div>
                  <div className="row">
                    <button className="primary-button" disabled={!isDraft} type="submit">
                      Salvar metadados
                    </button>
                    <button
                      type="button"
                      className="refresh"
                      disabled={!isDraft || currentQuestions.length !== requiredCount}
                      onClick={() =>
                        handleEvaluationQuestionnairePublish(selectedEvaluationQuestionnaire.id)
                      }
                    >
                      Publicar questionario
                    </button>
                    <button
                      type="button"
                      className="refresh"
                      disabled={selectedEvaluationQuestionnaire.status === "archived"}
                      onClick={() =>
                        handleEvaluationQuestionnaireArchive(selectedEvaluationQuestionnaire.id)
                      }
                    >
                      Arquivar
                    </button>
                  </div>
                  <p className="muted">
                    {getRelationshipDescription(selectedEvaluationQuestionnaire.relationshipType)}
                  </p>
                  {!isDraft ? (
                    <p className="muted">
                      Este questionario foi congelado apos envio/publicacao e agora serve como
                      snapshot auditavel do colaborador.
                    </p>
                  ) : null}
                </form>

                <div className="list-card">
                  <div className="card-header">
                    <div>
                      <strong>{isDraft ? "Perguntas personalizadas" : "Perguntas publicadas"}</strong>
                      <p className="muted">
                        {currentQuestions.length} de {requiredCount} pergunta(s) necessarias para{" "}
                        {getRelationshipLabel(selectedEvaluationQuestionnaire.relationshipType).toLowerCase()}
                      </p>
                    </div>
                    <div className="row">
                      <span className="badge">{selectedEvaluationQuestionnaire.versionNumber}a versao</span>
                      <button
                        className="primary-button"
                        disabled={!isDraft}
                        type="button"
                        onClick={() => {
                          cancelEvaluationQuestionEdit?.();
                          setIsQuestionFormOpen(true);
                        }}
                      >
                        Nova pergunta
                      </button>
                    </div>
                  </div>
                  {isDraft ? (
                    <div className="list-card compact-list-card">
                      <div className="row">
                        <div>
                          <strong>Preencher a partir de base existente</strong>
                          <p className="muted">
                            Use a biblioteca do ciclo ou duplique um questionario do mesmo tipo
                            para acelerar o setup.
                          </p>
                        </div>
                      </div>
                      <div className="dashboard-filter-grid">
                        <button
                          type="button"
                          className="refresh"
                          onClick={() =>
                            handleLoadQuestionnaireFromLibrary(selectedEvaluationQuestionnaire.id)
                          }
                        >
                          Carregar da biblioteca base
                        </button>
                        <SafeSelect
                          label="Duplicar de outro questionario"
                          value={cloneSourceQuestionnaireId}
                          options={["", ...cloneCandidates.map((item) => item.id)]}
                          renderLabel={(value) =>
                            !value
                              ? "Selecione um questionario"
                              : cloneCandidates.find((item) => item.id === value)?.title || value
                          }
                          onChange={setCloneSourceQuestionnaireId}
                        />
                        <button
                          type="button"
                          className="refresh"
                          disabled={!cloneSourceQuestionnaireId}
                          onClick={() =>
                            handleCloneQuestionnaireFromExisting(
                              selectedEvaluationQuestionnaire.id,
                              cloneSourceQuestionnaireId
                            )
                          }
                        >
                          Duplicar perguntas
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                {isQuestionFormOpen ? (
                <form
                  className="list-card"
                  ref={questionFormRef}
                  onSubmit={handleEvaluationQuestionSave}
                >
                  <div className="card-header">
                    <div>
                      <strong>
                        {editingEvaluationQuestionId ? "Editar pergunta" : "Nova pergunta"}
                      </strong>
                      <p className="muted">
                        {getRelationshipLabel(selectedEvaluationQuestionnaire.relationshipType)}
                      </p>
                    </div>
                    <button className="primary-button" disabled={!isDraft} type="submit">
                      {editingEvaluationQuestionId ? "Salvar pergunta" : "Adicionar pergunta"}
                    </button>
                  </div>
                  <div className="dashboard-filter-grid">
                    <SafeInput
                      label="Ordem"
                      type="number"
                      value={evaluationQuestionDraft.sortOrder}
                      onChange={(value) =>
                        setEvaluationQuestionDraft((current) => ({
                          ...current,
                          sortOrder: value
                        }))
                      }
                    />
                    <SafeInput
                      label="Chave da dimensao"
                      value={evaluationQuestionDraft.dimensionKey}
                      onChange={(value) =>
                        setEvaluationQuestionDraft((current) => ({
                          ...current,
                          dimensionKey: value
                        }))
                      }
                    />
                    <SafeInput
                      label="Titulo da dimensao"
                      value={evaluationQuestionDraft.dimensionTitle}
                      onChange={(value) =>
                        setEvaluationQuestionDraft((current) => ({
                          ...current,
                          dimensionTitle: value
                        }))
                      }
                    />
                  </div>
                  <SafeTextarea
                    label="Pergunta"
                    rows={3}
                    value={evaluationQuestionDraft.promptText}
                    onChange={(value) =>
                      setEvaluationQuestionDraft((current) => ({
                        ...current,
                        promptText: value
                      }))
                    }
                  />
                  <div className="dashboard-filter-grid">
                    <SafeInput
                      label="Secao"
                      value={evaluationQuestionDraft.sectionTitle}
                      onChange={(value) =>
                        setEvaluationQuestionDraft((current) => ({
                          ...current,
                          sectionTitle: value
                        }))
                      }
                    />
                    <SafeSelect
                      label="Tipo de resposta"
                      value={evaluationQuestionDraft.inputType}
                      options={["scale", "text", "multi-select"]}
                      renderLabel={(value) =>
                        value === "scale"
                          ? "Escala"
                          : value === "text"
                            ? "Texto"
                            : "Multipla escolha"
                      }
                      onChange={(value) =>
                        setEvaluationQuestionDraft((current) => ({
                          ...current,
                          inputType: value
                        }))
                      }
                    />
                    <SafeSelect
                      label="Escala"
                      value={evaluationQuestionDraft.scaleProfile}
                      options={["performance", "agreement", "satisfaction"]}
                      onChange={(value) =>
                        setEvaluationQuestionDraft((current) => ({
                          ...current,
                          scaleProfile: value
                        }))
                      }
                    />
                  </div>
                  <SafeTextarea
                    label="Texto de apoio"
                    rows={2}
                    value={evaluationQuestionDraft.helperText}
                    onChange={(value) =>
                      setEvaluationQuestionDraft((current) => ({
                        ...current,
                        helperText: value
                      }))
                    }
                  />
                  {evaluationQuestionDraft.inputType === "multi-select" ? (
                    <SafeTextarea
                      label="Opcoes separadas por |"
                      rows={2}
                      value={evaluationQuestionDraft.optionsText}
                      onChange={(value) =>
                        setEvaluationQuestionDraft((current) => ({
                          ...current,
                          optionsText: value
                        }))
                      }
                    />
                  ) : null}
                  <div className="checkbox-stack">
                    <label className="checkbox-option">
                      <input
                        checked={Boolean(evaluationQuestionDraft.isRequired)}
                        type="checkbox"
                        onChange={(event) =>
                          setEvaluationQuestionDraft((current) => ({
                            ...current,
                            isRequired: event.target.checked
                          }))
                        }
                      />
                      <span>Pergunta obrigatoria</span>
                    </label>
                    <label className="checkbox-option">
                      <input
                        checked={Boolean(evaluationQuestionDraft.collectEvidenceOnExtreme)}
                        type="checkbox"
                        onChange={(event) =>
                          setEvaluationQuestionDraft((current) => ({
                            ...current,
                            collectEvidenceOnExtreme: event.target.checked
                          }))
                        }
                      />
                      <span>Exigir evidencia em extremos</span>
                    </label>
                    <label className="checkbox-option">
                      <input
                        checked={Boolean(evaluationQuestionDraft.isSensitive)}
                        type="checkbox"
                        onChange={(event) =>
                          setEvaluationQuestionDraft((current) => ({
                            ...current,
                            isSensitive: event.target.checked
                          }))
                        }
                      />
                      <span>Marcar pergunta como sensivel</span>
                    </label>
                  </div>
                  <div className="row">
                    <button
                      className="refresh"
                      type="button"
                      onClick={() => {
                        cancelEvaluationQuestionEdit?.();
                        setIsQuestionFormOpen(false);
                      }}
                    >
                      Fechar formulario
                    </button>
                  </div>
                  <p className="muted">
                    Valido no frontend: dimensao, titulo, pergunta, ordem positiva e opcoes para
                    multipla escolha.
                  </p>
                </form>
                ) : null}

                <div className="stack-list">
                  {currentQuestions.map((question, index) => (
                    <div className="list-card compact-list-card" key={question.id}>
                      <div className="row">
                        <div>
                          <strong>
                            {question.sortOrder}. {question.dimensionTitle}
                          </strong>
                          <p className="muted">{question.promptText}</p>
                        </div>
                        <span className="badge">
                          {question.isSensitive ? "Sensivel" : question.inputType}
                        </span>
                      </div>
                      <div className="evaluation-assignment-meta">
                        <span className="evaluation-assignment-meta-item">
                          {question.sectionTitle || "Sem secao"}
                        </span>
                        <span className="evaluation-assignment-meta-item">
                          {question.visibility || "restricted"}
                        </span>
                        <span className="evaluation-assignment-meta-item">
                          {question.isRequired ? "Obrigatoria" : "Opcional"}
                        </span>
                      </div>
                      <div className="row">
                        <button
                          type="button"
                          className="refresh"
                          disabled={!isDraft}
                          onClick={() => {
                            setIsQuestionFormOpen(true);
                            startEvaluationQuestionEdit(question);
                          }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="refresh"
                          disabled={!isDraft || index === 0}
                          onClick={() => handleEvaluationQuestionReorder(question.id, "up")}
                        >
                          Subir
                        </button>
                        <button
                          type="button"
                          className="refresh"
                          disabled={!isDraft || index === currentQuestions.length - 1}
                          onClick={() => handleEvaluationQuestionReorder(question.id, "down")}
                        >
                          Descer
                        </button>
                        <button
                          type="button"
                          className="refresh"
                          disabled={!isDraft}
                          onClick={() => handleEvaluationQuestionDelete(question.id)}
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
