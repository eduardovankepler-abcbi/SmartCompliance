import { useEffect, useMemo, useRef, useState } from "react";
import { getRelationshipLabel } from "../appLabels.js";

const emptyCompetencyForm = {
  name: "",
  key: "",
  description: "",
  status: "active"
};

const emptyQuestionForm = {
  relationshipType: "self",
  sectionKey: "",
  sectionTitle: "",
  sectionDescription: "",
  dimensionKey: "",
  dimensionTitle: "",
  prompt: "",
  helperText: "",
  inputType: "scale",
  scaleProfile: "performance",
  visibility: "shared",
  sortOrder: "1",
  isRequired: true,
  collectEvidenceOnExtreme: false,
  isSensitive: false,
  optionsText: ""
};

const competencyStatusOptions = [
  { value: "active", label: "Ativa" },
  { value: "inactive", label: "Inativa" }
];

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

function buildQuestionDraft(question, relationshipType) {
  if (!question) {
    return { ...emptyQuestionForm, relationshipType };
  }

  return {
    relationshipType,
    sectionKey: question.sectionKey || "",
    sectionTitle: question.sectionTitle || "",
    sectionDescription: question.sectionDescription || "",
    dimensionKey: question.dimensionKey || "",
    dimensionTitle: question.dimensionTitle || "",
    prompt: question.prompt || question.promptText || "",
    helperText: question.helperText || "",
    inputType: question.inputType || "scale",
    scaleProfile: question.scaleProfile || "performance",
    visibility: question.visibility || "shared",
    sortOrder: String(question.sortOrder || 1),
    isRequired: question.isRequired !== false,
    collectEvidenceOnExtreme: Boolean(question.collectEvidenceOnExtreme),
    isSensitive: Boolean(question.isSensitive),
    optionsText: (question.options || []).map((option) => option.label || option.value).join(" | ")
  };
}

function buildQuestionPayload(form) {
  return {
    relationshipType: form.relationshipType,
    sectionKey: form.sectionKey,
    sectionTitle: form.sectionTitle,
    sectionDescription: form.sectionDescription,
    dimensionKey: form.dimensionKey,
    dimensionTitle: form.dimensionTitle,
    prompt: form.prompt,
    helperText: form.helperText,
    inputType: form.inputType,
    scaleProfile: form.inputType === "scale" ? form.scaleProfile : "",
    visibility: form.visibility,
    sortOrder: Number(form.sortOrder || 1),
    isRequired: Boolean(form.isRequired),
    collectEvidenceOnExtreme: Boolean(form.collectEvidenceOnExtreme),
    isSensitive: Boolean(form.isSensitive),
    options:
      form.inputType === "multi-select"
        ? String(form.optionsText || "")
            .split("|")
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item) => ({
              value: item
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, ""),
              label: item
            }))
        : []
  };
}

export function EvaluationLibraryPanel({
  Input,
  Textarea,
  canManageEvaluationQuestions,
  canViewEvaluationLibrary,
  competencies,
  evaluationLibrary,
  handleCompetencyCreate,
  handleCompetencyUpdate,
  handleEvaluationLibraryQuestionCreate,
  handleEvaluationLibraryQuestionDelete,
  handleEvaluationLibraryQuestionUpdate,
  handleEvaluationLibraryQuestionsReorder,
  showEvaluationLibrary
}) {
  const SafeSelect = NativeSelectField;
  const [activeTab, setActiveTab] = useState("questions");
  const [activeRelationshipType, setActiveRelationshipType] = useState("");
  const [editingQuestionId, setEditingQuestionId] = useState("");
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);
  const [competencyForm, setCompetencyForm] = useState(emptyCompetencyForm);
  const [competencyDrafts, setCompetencyDrafts] = useState({});
  const questionFormRef = useRef(null);
  const questionGroups = useMemo(
    () =>
      (evaluationLibrary?.questionGroups || evaluationLibrary?.templates || []).map((group) => ({
        ...group,
        relationshipType: group.relationshipType || group.key
      })),
    [evaluationLibrary]
  );
  const activeGroup =
    questionGroups.find((group) => group.relationshipType === activeRelationshipType) ||
    questionGroups[0] ||
    null;
  const activeQuestions = activeGroup?.questions || [];

  useEffect(() => {
    setCompetencyDrafts(
      Object.fromEntries(
        (competencies || []).map((competency) => [
          competency.id,
          {
            name: competency.name,
            key: competency.key,
            description: competency.description || "",
            status: competency.status || "active"
          }
        ])
      )
    );
  }, [competencies]);

  useEffect(() => {
    if (!questionGroups.length) {
      setActiveRelationshipType("");
      return;
    }
    if (!questionGroups.some((group) => group.relationshipType === activeRelationshipType)) {
      setActiveRelationshipType(questionGroups[0].relationshipType);
    }
  }, [activeRelationshipType, questionGroups]);

  useEffect(() => {
    if (!editingQuestionId) {
      setQuestionForm(buildQuestionDraft(null, activeGroup?.relationshipType || "self"));
      return;
    }
    const question = activeQuestions.find((item) => item.id === editingQuestionId);
    setQuestionForm(buildQuestionDraft(question, activeGroup?.relationshipType || "self"));
  }, [activeGroup?.relationshipType, activeQuestions, editingQuestionId]);

  useEffect(() => {
    if (isQuestionFormOpen) {
      questionFormRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
  }, [editingQuestionId, isQuestionFormOpen]);

  if (!canViewEvaluationLibrary || !showEvaluationLibrary) {
    return null;
  }

  async function onQuestionSubmit(event) {
    event.preventDefault();
    const payload = buildQuestionPayload(questionForm);
    if (editingQuestionId) {
      await handleEvaluationLibraryQuestionUpdate(editingQuestionId, payload);
    } else {
      await handleEvaluationLibraryQuestionCreate(payload);
    }
    setEditingQuestionId("");
    setIsQuestionFormOpen(false);
  }

  async function onQuestionReorder(questionId, direction) {
    const currentIds = activeQuestions.map((question) => question.id);
    const currentIndex = currentIds.indexOf(questionId);
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || swapIndex < 0 || swapIndex >= currentIds.length) {
      return;
    }
    const reorderedIds = [...currentIds];
    const [movedId] = reorderedIds.splice(currentIndex, 1);
    reorderedIds.splice(swapIndex, 0, movedId);
    await handleEvaluationLibraryQuestionsReorder(activeGroup.relationshipType, reorderedIds);
  }

  async function onCompetencySubmit(event) {
    event.preventDefault();
    await handleCompetencyCreate(competencyForm);
    setCompetencyForm(emptyCompetencyForm);
  }

  async function onCompetencySave(competencyId) {
    const draft = competencyDrafts[competencyId];
    if (draft) {
      await handleCompetencyUpdate(competencyId, draft);
    }
  }

  return (
    <div className="card card-span">
      <div className="card-header">
        <div>
          <h3>Perguntas da avaliacao</h3>
          <span>CRUD manual por modalidade</span>
        </div>
        <span>{evaluationLibrary?.manualLibrary?.questionCount || 0} pergunta(s)</span>
      </div>
      <div className="stack-list">
        <div className="module-toolbar">
          <button
            type="button"
            className={activeTab === "questions" ? "button-reset module-tab active" : "button-reset module-tab"}
            onClick={() => setActiveTab("questions")}
          >
            <span className="module-tab-title">Perguntas</span>
            <span className="module-tab-meta">{questionGroups.length} modalidades</span>
          </button>
          <button
            type="button"
            className={activeTab === "competencies" ? "button-reset module-tab active" : "button-reset module-tab"}
            onClick={() => setActiveTab("competencies")}
          >
            <span className="module-tab-title">Competencias</span>
            <span className="module-tab-meta">{competencies?.length || 0} cadastradas</span>
          </button>
        </div>

        {activeTab === "questions" ? (
          <>
            <div className="list-card">
              <div className="card-header">
                <div>
                  <strong>Modalidades de avaliacao</strong>
                  <p className="muted">As perguntas padrao permanecem como base inicial do banco manual.</p>
                </div>
                <span className="badge">{canManageEvaluationQuestions ? "RH editor" : "Somente leitura"}</span>
              </div>
              <div className="module-toolbar">
                {questionGroups.map((group) => (
                  <button
                    key={group.relationshipType}
                    type="button"
                    className={
                      group.relationshipType === activeGroup?.relationshipType
                        ? "button-reset module-tab active"
                        : "button-reset module-tab"
                    }
                    onClick={() => {
                      setEditingQuestionId("");
                      setIsQuestionFormOpen(false);
                      setActiveRelationshipType(group.relationshipType);
                    }}
                  >
                    <span className="module-tab-title">{getRelationshipLabel(group.relationshipType)}</span>
                    <span className="module-tab-meta">{group.questions?.length || 0} pergunta(s)</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="list-card compact-list-card">
              <div className="card-header">
                <div>
                  <strong>{getRelationshipLabel(activeGroup?.relationshipType || "")}</strong>
                  <p className="muted">
                    {activeQuestions.length} pergunta(s) nesta modalidade.
                  </p>
                </div>
                <button
                  className="primary-button"
                  disabled={!canManageEvaluationQuestions}
                  type="button"
                  onClick={() => {
                    setEditingQuestionId("");
                    setIsQuestionFormOpen(true);
                  }}
                >
                  Nova pergunta
                </button>
              </div>
            </div>

            {isQuestionFormOpen ? (
            <form className="list-card" ref={questionFormRef} onSubmit={onQuestionSubmit}>
              <div className="card-header">
                <div>
                  <strong>{editingQuestionId ? "Editar pergunta" : "Nova pergunta"}</strong>
                  <p className="muted">{getRelationshipLabel(activeGroup?.relationshipType || "")}</p>
                </div>
                <button className="primary-button" disabled={!canManageEvaluationQuestions} type="submit">
                  {editingQuestionId ? "Salvar pergunta" : "Criar pergunta"}
                </button>
              </div>
              <div className="dashboard-filter-grid">
                <Input
                  label="Ordem"
                  type="number"
                  value={questionForm.sortOrder}
                  onChange={(value) => setQuestionForm((current) => ({ ...current, sortOrder: value }))}
                />
                <Input
                  label="Chave da dimensao"
                  value={questionForm.dimensionKey}
                  onChange={(value) => setQuestionForm((current) => ({ ...current, dimensionKey: value }))}
                />
                <Input
                  label="Titulo da dimensao"
                  value={questionForm.dimensionTitle}
                  onChange={(value) => setQuestionForm((current) => ({ ...current, dimensionTitle: value }))}
                />
              </div>
              <Textarea
                label="Pergunta"
                rows={3}
                value={questionForm.prompt}
                onChange={(value) => setQuestionForm((current) => ({ ...current, prompt: value }))}
              />
              <div className="dashboard-filter-grid">
                <Input
                  label="Secao"
                  value={questionForm.sectionTitle}
                  onChange={(value) => setQuestionForm((current) => ({ ...current, sectionTitle: value }))}
                />
                <SafeSelect
                  label="Tipo de resposta"
                  value={questionForm.inputType}
                  options={["scale", "text", "multi-select"]}
                  renderLabel={(value) =>
                    value === "scale" ? "Escala" : value === "text" ? "Texto" : "Multipla escolha"
                  }
                  onChange={(value) => setQuestionForm((current) => ({ ...current, inputType: value }))}
                />
                <SafeSelect
                  label="Escala"
                  value={questionForm.scaleProfile}
                  options={["performance", "agreement", "satisfaction"]}
                  onChange={(value) => setQuestionForm((current) => ({ ...current, scaleProfile: value }))}
                />
              </div>
              <Textarea
                label="Texto de apoio"
                rows={2}
                value={questionForm.helperText}
                onChange={(value) => setQuestionForm((current) => ({ ...current, helperText: value }))}
              />
              {questionForm.inputType === "multi-select" ? (
                <Textarea
                  label="Respostas possiveis separadas por |"
                  rows={2}
                  value={questionForm.optionsText}
                  onChange={(value) => setQuestionForm((current) => ({ ...current, optionsText: value }))}
                />
              ) : null}
              <div className="dashboard-filter-grid">
                <SafeSelect
                  label="Visibilidade"
                  value={questionForm.visibility}
                  options={["shared", "private", "confidential"]}
                  onChange={(value) => setQuestionForm((current) => ({ ...current, visibility: value }))}
                />
                <label className="checkbox-option">
                  <input
                    checked={Boolean(questionForm.isRequired)}
                    type="checkbox"
                    onChange={(event) =>
                      setQuestionForm((current) => ({ ...current, isRequired: event.target.checked }))
                    }
                  />
                  <span>Obrigatoria</span>
                </label>
                <label className="checkbox-option">
                  <input
                    checked={Boolean(questionForm.isSensitive)}
                    type="checkbox"
                    onChange={(event) =>
                      setQuestionForm((current) => ({ ...current, isSensitive: event.target.checked }))
                    }
                  />
                  <span>Sensivel</span>
                </label>
                <label className="checkbox-option">
                  <input
                    checked={Boolean(questionForm.collectEvidenceOnExtreme)}
                    type="checkbox"
                    onChange={(event) =>
                      setQuestionForm((current) => ({
                        ...current,
                        collectEvidenceOnExtreme: event.target.checked
                      }))
                    }
                  />
                  <span>Evidencia em extremos</span>
                </label>
              </div>
              <button
                className="refresh"
                type="button"
                onClick={() => {
                  setEditingQuestionId("");
                  setIsQuestionFormOpen(false);
                }}
              >
                {editingQuestionId ? "Cancelar edicao" : "Fechar formulario"}
              </button>
            </form>
            ) : null}

            <div className="stack-list">
              {activeQuestions.map((question, index) => (
                <div className="list-card compact-list-card" key={question.id}>
                  <div className="row">
                    <div>
                      <strong>
                        {question.sortOrder}. {question.dimensionTitle || question.sectionTitle || "Pergunta"}
                      </strong>
                      <p className="muted">{question.prompt}</p>
                    </div>
                    <span className="badge">{question.isSensitive ? "Sensivel" : question.inputType || "scale"}</span>
                  </div>
                  {question.options?.length ? (
                    <p className="muted">
                      Respostas: {question.options.map((option) => option.label || option.value).join(" | ")}
                    </p>
                  ) : null}
                  <div className="evaluation-assignment-meta">
                    <span className="evaluation-assignment-meta-item">{question.sectionTitle || "Sem secao"}</span>
                    <span className="evaluation-assignment-meta-item">{question.visibility || "shared"}</span>
                    <span className="evaluation-assignment-meta-item">
                      {question.isRequired === false ? "Opcional" : "Obrigatoria"}
                    </span>
                  </div>
                  <div className="row">
                    <button
                      type="button"
                      className="refresh"
                      disabled={!canManageEvaluationQuestions}
                      onClick={() => {
                        setEditingQuestionId(question.id);
                        setIsQuestionFormOpen(true);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="refresh"
                      disabled={!canManageEvaluationQuestions || index === 0}
                      onClick={() => onQuestionReorder(question.id, "up")}
                    >
                      Subir
                    </button>
                    <button
                      type="button"
                      className="refresh"
                      disabled={!canManageEvaluationQuestions || index === activeQuestions.length - 1}
                      onClick={() => onQuestionReorder(question.id, "down")}
                    >
                      Descer
                    </button>
                    <button
                      type="button"
                      className="refresh"
                      disabled={!canManageEvaluationQuestions}
                      onClick={() => handleEvaluationLibraryQuestionDelete(question.id)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="list-card">
              <div className="card-header">
                <strong>Competencias</strong>
                <span>{competencies?.length || 0} cadastradas</span>
              </div>
              {competencies?.length ? (
                <div className="stack-list compact-stack">
                  {competencies.map((competency) => {
                    const draft = competencyDrafts[competency.id] || competency;
                    return (
                      <div className="list-card compact-list-card" key={competency.id}>
                        <div className="row">
                          <strong>{competency.name}</strong>
                          <span className="badge">{draft.status === "active" ? "Ativa" : "Inativa"}</span>
                        </div>
                        <div className="compact-actions structure-actions">
                          <label className="field">
                            <span>Nome</span>
                            <input
                              type="text"
                              value={draft.name}
                              onChange={(event) =>
                                setCompetencyDrafts((current) => ({
                                  ...current,
                                  [competency.id]: { ...draft, name: event.target.value }
                                }))
                              }
                            />
                          </label>
                          <label className="field">
                            <span>Chave</span>
                            <input
                              type="text"
                              value={draft.key}
                              onChange={(event) =>
                                setCompetencyDrafts((current) => ({
                                  ...current,
                                  [competency.id]: { ...draft, key: event.target.value }
                                }))
                              }
                            />
                          </label>
                          <label className="field">
                            <span>Status</span>
                            <select
                              value={draft.status}
                              onChange={(event) =>
                                setCompetencyDrafts((current) => ({
                                  ...current,
                                  [competency.id]: { ...draft, status: event.target.value }
                                }))
                              }
                            >
                              {competencyStatusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <label className="field">
                          <span>Descricao</span>
                          <textarea
                            rows={3}
                            value={draft.description}
                            onChange={(event) =>
                              setCompetencyDrafts((current) => ({
                                ...current,
                                [competency.id]: { ...draft, description: event.target.value }
                              }))
                            }
                          />
                        </label>
                        <button className="secondary-button" type="button" onClick={() => onCompetencySave(competency.id)}>
                          Salvar competencia
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="muted">Nenhuma competencia formal cadastrada ainda.</p>
              )}
            </div>

            <form className="list-card" onSubmit={onCompetencySubmit}>
              <div className="card-header">
                <strong>Nova competencia</strong>
                <span>Nova dimensao</span>
              </div>
              <div className="compact-actions structure-actions">
                <Input
                  label="Nome"
                  value={competencyForm.name}
                  onChange={(value) => setCompetencyForm({ ...competencyForm, name: value })}
                />
                <Input
                  label="Chave"
                  value={competencyForm.key}
                  onChange={(value) => setCompetencyForm({ ...competencyForm, key: value })}
                />
                <label className="field">
                  <span>Status</span>
                  <select
                    value={competencyForm.status}
                    onChange={(event) =>
                      setCompetencyForm({ ...competencyForm, status: event.target.value })
                    }
                  >
                    {competencyStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <Textarea
                label="Descricao"
                value={competencyForm.description}
                onChange={(value) => setCompetencyForm({ ...competencyForm, description: value })}
              />
              <button className="primary-button" type="submit">
                Cadastrar competencia
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
