import { useEffect, useMemo, useState } from "react";
import { getRelationshipLabel } from "../appLabels.js";

const emptyCompetencyForm = {
  name: "",
  key: "",
  description: "",
  status: "active"
};

const competencyStatusOptions = [
  { value: "active", label: "Ativa" },
  { value: "inactive", label: "Inativa" }
];

function getLibrarySourceLabel(sourceType) {
  return sourceType === "custom" ? "Customizada" : "Padrao";
}

export function EvaluationLibraryPanel({
  Input,
  Textarea,
  canViewEvaluationLibrary,
  competencies,
  customLibraryDraft,
  customLibraryPublishForm,
  evaluationLibrary,
  handleCompetencyCreate,
  handleCompetencyUpdate,
  handleCustomLibraryImport,
  handleCustomLibraryUpdate,
  handleCustomLibraryTemplateDownload,
  handleCustomLibraryPublish,
  setCustomLibraryPublishForm,
  showEvaluationLibrary
}) {
  const [activeTab, setActiveTab] = useState("libraries");
  const [activeLibraryId, setActiveLibraryId] = useState("");
  const [activeTemplateKey, setActiveTemplateKey] = useState("");
  const [competencyForm, setCompetencyForm] = useState(emptyCompetencyForm);
  const [competencyDrafts, setCompetencyDrafts] = useState({});
  const [libraryDrafts, setLibraryDrafts] = useState({});
  const libraryOptions = useMemo(() => {
    const defaultLibrary = evaluationLibrary?.defaultLibrary
      ? {
          ...evaluationLibrary.defaultLibrary,
          templates: evaluationLibrary?.templates || []
        }
      : null;

    const customLibraries = (evaluationLibrary?.customLibraries || []).map((library) => ({
      ...library,
      templates: library.templates || []
    }));

    return [defaultLibrary, ...customLibraries].filter(Boolean);
  }, [evaluationLibrary]);

  const activeLibrary =
    libraryOptions.find((library) => library.id === activeLibraryId) || libraryOptions[0] || null;
  const activeLibraryTemplates =
    libraryDrafts[activeLibrary?.id]?.templates || activeLibrary?.templates || [];
  const activeTemplate =
    activeLibraryTemplates.find(
      (template) => (template.relationshipType || template.key) === activeTemplateKey
    ) || activeLibraryTemplates[0] || null;

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
    if (!libraryOptions.length) {
      setActiveLibraryId("");
      return;
    }

    if (!libraryOptions.some((library) => library.id === activeLibraryId)) {
      setActiveLibraryId(libraryOptions[0].id);
    }
  }, [activeLibraryId, libraryOptions]);

  useEffect(() => {
    if (!activeLibraryTemplates.length) {
      setActiveTemplateKey("");
      return;
    }

    if (
      !activeLibraryTemplates.some(
        (template) => (template.relationshipType || template.key) === activeTemplateKey
      )
    ) {
      setActiveTemplateKey(activeLibraryTemplates[0].relationshipType || activeLibraryTemplates[0].key);
    }
  }, [activeLibraryTemplates, activeTemplateKey]);

  useEffect(() => {
    setLibraryDrafts(
      Object.fromEntries(
        (evaluationLibrary?.customLibraries || []).map((library) => [
          library.id,
          {
            name: library.name,
            description: library.description || "",
            templates: (library.templates || []).map((template) => ({
              ...template,
              relationshipType: template.relationshipType || template.key,
              key: template.key || template.relationshipType,
              questions: (template.questions || []).map((question) => ({
                ...question,
                optionsText: (question.options || []).map((option) => option.label || option.value).join(" | ")
              }))
            }))
          }
        ])
      )
    );
  }, [evaluationLibrary]);

  if (!canViewEvaluationLibrary || !showEvaluationLibrary) {
    return null;
  }

  async function onCompetencySubmit(event) {
    event.preventDefault();
    await handleCompetencyCreate(competencyForm);
    setCompetencyForm(emptyCompetencyForm);
  }

  async function onCompetencySave(competencyId) {
    const draft = competencyDrafts[competencyId];
    if (!draft) {
      return;
    }

    await handleCompetencyUpdate(competencyId, draft);
  }

  async function onLibrarySave() {
    if (!activeLibrary || activeLibrary.sourceType !== "custom") {
      return;
    }

    const draft = libraryDrafts[activeLibrary.id];
    if (!draft) {
      return;
    }

    await handleCustomLibraryUpdate(activeLibrary.id, {
      name: draft.name,
      description: draft.description,
      templates: draft.templates.map((template) => ({
        ...template,
        questions: (template.questions || []).map((question) => ({
          ...question,
          options:
            question.inputType === "multi-select"
              ? String(question.optionsText || "")
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
              : question.options || []
        }))
      }))
    });
  }

  function updateActiveTemplate(updateFn) {
    if (!activeLibrary || !activeTemplate) {
      return;
    }

    setLibraryDrafts((current) => ({
      ...current,
      [activeLibrary.id]: {
        ...current[activeLibrary.id],
        templates: current[activeLibrary.id].templates.map((item) =>
          (item.relationshipType || item.key) === (activeTemplate.relationshipType || activeTemplate.key)
            ? updateFn(item)
            : item
        )
      }
    }));
  }

  return (
    <div className="card card-span">
      <div className="card-header">
        <div>
          <h3>Biblioteca de avaliacoes</h3>
          <span>Edite bibliotecas e competencias</span>
        </div>
        <span>{evaluationLibrary?.customLibraries?.length || 0} bibliotecas publicadas</span>
      </div>
      <div className="stack-list">
        <div className="module-toolbar">
          <button
            type="button"
            className={
              activeTab === "libraries" ? "button-reset module-tab active" : "button-reset module-tab"
            }
            onClick={() => setActiveTab("libraries")}
          >
            <span className="module-tab-title">Bibliotecas</span>
            <span className="module-tab-meta">
              {evaluationLibrary?.customLibraries?.length || 0} publicadas
            </span>
          </button>
          <button
            type="button"
            className={
              activeTab === "competencies"
                ? "button-reset module-tab active"
                : "button-reset module-tab"
            }
            onClick={() => setActiveTab("competencies")}
          >
            <span className="module-tab-title">Competencias</span>
            <span className="module-tab-meta">{competencies?.length || 0} cadastradas</span>
          </button>
        </div>

        {activeTab === "libraries" ? (
          <>
            <div className="list-card">
              <strong>Bibliotecas publicadas</strong>
              {libraryOptions.length ? (
                libraryOptions.map((library) => (
                  <p className="muted" key={library.id}>
                    {library.name} ({getLibrarySourceLabel(library.sourceType)}) |{" "}
                    {library.templateCount || library.templates?.length || 0} templates |{" "}
                    {library.questionCount ||
                      (library.templates || []).reduce(
                        (total, template) => total + (template.questions?.length || 0),
                        0
                      )}{" "}
                    perguntas
                  </p>
                ))
              ) : (
                <p className="muted">Nenhuma biblioteca customizada publicada ainda.</p>
              )}
            </div>

            <div className="list-card">
              <div className="card-header">
                <strong>Perguntas por tipo de avaliacao</strong>
                <span>{activeLibrary?.name || "Biblioteca ativa"}</span>
              </div>
              {libraryOptions.length > 1 ? (
                <label className="field">
                  <span>Biblioteca em foco</span>
                  <select
                    value={activeLibraryId}
                    onChange={(event) => setActiveLibraryId(event.target.value)}
                  >
                    {libraryOptions.map((library) => (
                      <option key={library.id} value={library.id}>
                        {library.name} - {getLibrarySourceLabel(library.sourceType)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {activeLibrary ? (
                <div className="row">
                  <span className="badge">{getLibrarySourceLabel(activeLibrary.sourceType)}</span>
                  <span className="muted">
                    {activeLibrary.templateCount || activeLibrary.templates?.length || 0} templates
                    ·{" "}
                    {activeLibrary.questionCount ||
                      (activeLibrary.templates || []).reduce(
                        (total, template) => total + (template.questions?.length || 0),
                        0
                      )}{" "}
                    perguntas
                  </span>
                </div>
              ) : null}
              {activeLibraryTemplates.length ? (
                <div className="stack-list compact-stack">
                  <div className="module-toolbar">
                    {activeLibraryTemplates.map((template) => {
                      const templateKey = template.relationshipType || template.key;
                      return (
                        <button
                          key={template.id}
                          type="button"
                          className={
                            templateKey === activeTemplateKey
                              ? "button-reset module-tab active"
                              : "button-reset module-tab"
                          }
                          onClick={() => setActiveTemplateKey(templateKey)}
                        >
                          <span className="module-tab-title">
                            {getRelationshipLabel(templateKey) || template.modelName}
                          </span>
                          <span className="module-tab-meta">
                            {template.questions?.length || 0} pergunta(s)
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {activeTemplate ? (
                    <div className="list-card compact-list-card">
                      <div className="row">
                        <strong>
                          {getRelationshipLabel(activeTemplate.relationshipType || activeTemplate.key) ||
                            activeTemplate.modelName}
                        </strong>
                        <span className="badge">
                          {activeTemplate.questions?.length || 0} pergunta(s)
                        </span>
                      </div>
                      {activeLibrary.sourceType === "custom" ? (
                        <>
                          <Input
                            label="Nome do template"
                            value={activeTemplate.modelName}
                            onChange={(value) =>
                              updateActiveTemplate((item) => ({ ...item, modelName: value }))
                            }
                          />
                          <Textarea
                            label="Descricao do template"
                            value={activeTemplate.description || ""}
                            onChange={(value) =>
                              updateActiveTemplate((item) => ({ ...item, description: value }))
                            }
                          />
                        </>
                      ) : (
                        <>
                          <p className="muted">{activeTemplate.modelName}</p>
                          {activeTemplate.description ? (
                            <p className="muted">{activeTemplate.description}</p>
                          ) : null}
                        </>
                      )}
                      {activeTemplate.questions?.length ? (
                        <div className="stack-list compact-stack">
                          {activeTemplate.questions.map((question, index) => (
                            <div className="list-card compact-list-card" key={question.id || index}>
                              <p className="mini-label">Pergunta {index + 1}</p>
                              {activeLibrary.sourceType === "custom" ? (
                                <>
                                  <Input
                                    label="Dimensao da pergunta"
                                    value={question.dimensionTitle || ""}
                                    onChange={(value) =>
                                      updateActiveTemplate((item) => ({
                                        ...item,
                                        questions: item.questions.map((entry, entryIndex) =>
                                          entryIndex === index
                                            ? { ...entry, dimensionTitle: value }
                                            : entry
                                        )
                                      }))
                                    }
                                  />
                                  <Textarea
                                    label="Enunciado da pergunta"
                                    value={question.prompt || ""}
                                    onChange={(value) =>
                                      updateActiveTemplate((item) => ({
                                        ...item,
                                        questions: item.questions.map((entry, entryIndex) =>
                                          entryIndex === index ? { ...entry, prompt: value } : entry
                                        )
                                      }))
                                    }
                                  />
                                  <Textarea
                                    label="Texto de apoio ao respondente"
                                    value={question.helperText || ""}
                                    onChange={(value) =>
                                      updateActiveTemplate((item) => ({
                                        ...item,
                                        questions: item.questions.map((entry, entryIndex) =>
                                          entryIndex === index
                                            ? { ...entry, helperText: value }
                                            : entry
                                        )
                                      }))
                                    }
                                  />
                                  {question.inputType === "multi-select" ? (
                                    <Input
                                      label="Opcoes da multipla escolha"
                                      value={question.optionsText || ""}
                                      onChange={(value) =>
                                        updateActiveTemplate((item) => ({
                                          ...item,
                                          questions: item.questions.map((entry, entryIndex) =>
                                            entryIndex === index
                                              ? { ...entry, optionsText: value }
                                              : entry
                                          )
                                        }))
                                      }
                                      helper="Separe as opcoes com |"
                                    />
                                  ) : null}
                                  <p className="muted">
                                    Tipo: {question.inputType || "scale"} · Visibilidade:{" "}
                                    {question.visibility || "shared"}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <strong>
                                    {question.dimensionTitle || question.sectionTitle || "Pergunta"}
                                  </strong>
                                  <p className="muted">{question.prompt}</p>
                                  <p className="muted">
                                    Tipo: {question.inputType || "score"} · Visibilidade:{" "}
                                    {question.visibility || "shared"}
                                  </p>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="muted">Nenhuma pergunta cadastrada neste template.</p>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="muted">
                  Nenhum template encontrado na biblioteca selecionada.
                </p>
              )}
              {activeLibrary?.sourceType === "custom" ? (
                <div className="stack-list">
                  <Input
                    label="Nome da biblioteca"
                    value={libraryDrafts[activeLibrary.id]?.name || activeLibrary.name || ""}
                    onChange={(value) =>
                      setLibraryDrafts((current) => ({
                        ...current,
                        [activeLibrary.id]: {
                          ...current[activeLibrary.id],
                          name: value
                        }
                      }))
                    }
                  />
                  <Textarea
                    label="Descricao da biblioteca"
                    value={
                      libraryDrafts[activeLibrary.id]?.description ||
                      activeLibrary.description ||
                      ""
                    }
                    onChange={(value) =>
                      setLibraryDrafts((current) => ({
                        ...current,
                        [activeLibrary.id]: {
                          ...current[activeLibrary.id],
                          description: value
                        }
                      }))
                    }
                  />
                  <button className="primary-button" type="button" onClick={onLibrarySave}>
                    Salvar biblioteca customizada
                  </button>
                </div>
              ) : null}
            </div>

            <div className="list-card">
              <strong>Importar biblioteca</strong>
              <button
                className="secondary-button"
                type="button"
                onClick={handleCustomLibraryTemplateDownload}
              >
                Baixar template XLSX
              </button>
              <label className="field">
                <span>Arquivo CSV ou XLSX</span>
                <input type="file" accept=".csv,.xlsx" onChange={handleCustomLibraryImport} />
              </label>
            </div>

            {customLibraryDraft ? (
              <div className="stack-list">
                <div className="list-card">
                  <strong>{customLibraryDraft.fileName}</strong>
                  <p className="muted">
                    Templates: {customLibraryDraft.summary.templates} | Perguntas:{" "}
                    {customLibraryDraft.summary.questions}
                  </p>
                  <p className="muted">Erros: {customLibraryDraft.errors.length}</p>
                </div>
                {customLibraryDraft.errors.length ? (
                  customLibraryDraft.errors.map((item) => (
                    <div className="error-banner" key={item}>
                      {item}
                    </div>
                  ))
                ) : (
                  <form className="stack-list" onSubmit={handleCustomLibraryPublish}>
                    <Input
                      label="Nome da biblioteca"
                      value={customLibraryPublishForm.name}
                      onChange={(value) =>
                        setCustomLibraryPublishForm({
                          ...customLibraryPublishForm,
                          name: value
                        })
                      }
                    />
                    <Textarea
                      label="Descricao"
                      value={customLibraryPublishForm.description}
                      onChange={(value) =>
                        setCustomLibraryPublishForm({
                          ...customLibraryPublishForm,
                          description: value
                        })
                      }
                    />
                    <button className="primary-button" type="submit">
                      Publicar biblioteca
                    </button>
                  </form>
                )}
              </div>
            ) : null}
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
                          <span className="badge">
                            {draft.status === "active" ? "Ativa" : "Inativa"}
                          </span>
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
                                  [competency.id]: {
                                    ...draft,
                                    name: event.target.value
                                  }
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
                                  [competency.id]: {
                                    ...draft,
                                    key: event.target.value
                                  }
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
                                  [competency.id]: {
                                    ...draft,
                                    status: event.target.value
                                  }
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
                                [competency.id]: {
                                  ...draft,
                                  description: event.target.value
                                }
                              }))
                            }
                          />
                        </label>
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => onCompetencySave(competency.id)}
                        >
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
                onChange={(value) =>
                  setCompetencyForm({ ...competencyForm, description: value })
                }
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
