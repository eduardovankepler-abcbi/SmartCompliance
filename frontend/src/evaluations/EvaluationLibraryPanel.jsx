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

  return (
    <div className="card card-span">
      <div className="card-header">
        <div>
          <h3>Biblioteca de avaliacoes</h3>
          <span>Organize perguntas por tipo de avaliacao e mantenha as dimensoes do modelo</span>
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
              <div className="card-header">
                <strong>Como a biblioteca esta organizada</strong>
                <span>Leitura rapida para o RH</span>
              </div>
              <p className="muted">
                <strong>Biblioteca</strong> e o conjunto completo de templates.{" "}
                <strong>Template</strong> e o questionario de um tipo de avaliacao.{" "}
                <strong>Pergunta</strong> e cada item respondido dentro do template.
              </p>
            </div>

            <div className="list-card">
              <strong>Bibliotecas publicadas</strong>
              <p className="muted">
                Espaco para o RH gerenciar os conjuntos de perguntas e templates usados nos tipos
                de avaliacao.
              </p>
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
              <p className="muted">
                Visualizacao operacional dos templates e perguntas disponiveis em cada tipo de
                avaliacao.
              </p>
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
              {activeLibrary?.templates?.length ? (
                <div className="stack-list compact-stack">
                  {(libraryDrafts[activeLibrary.id]?.templates || activeLibrary.templates).map((template, templateIndex) => (
                    <div className="list-card compact-list-card" key={template.id}>
                      <div className="row">
                        <strong>
                          {getRelationshipLabel(template.relationshipType || template.key) ||
                            template.modelName}
                        </strong>
                        <span className="badge">
                          {template.questions?.length || 0} pergunta(s)
                        </span>
                      </div>
                      <p className="muted">
                        Tipo de avaliacao:{" "}
                        {getRelationshipLabel(template.relationshipType || template.key)}
                      </p>
                      {activeLibrary.sourceType === "custom" ? (
                        <>
                          <Input
                            label="Nome do template"
                            value={template.modelName}
                            onChange={(value) =>
                              setLibraryDrafts((current) => ({
                                ...current,
                                [activeLibrary.id]: {
                                  ...current[activeLibrary.id],
                                  templates: current[activeLibrary.id].templates.map((item, index) =>
                                    index === templateIndex ? { ...item, modelName: value } : item
                                  )
                                }
                              }))
                            }
                          />
                          <Textarea
                            label="Descricao do template"
                            value={template.description || ""}
                            onChange={(value) =>
                              setLibraryDrafts((current) => ({
                                ...current,
                                [activeLibrary.id]: {
                                  ...current[activeLibrary.id],
                                  templates: current[activeLibrary.id].templates.map((item, index) =>
                                    index === templateIndex ? { ...item, description: value } : item
                                  )
                                }
                              }))
                            }
                          />
                        </>
                      ) : (
                        <>
                          <p className="muted">{template.modelName}</p>
                          {template.description ? (
                            <p className="muted">{template.description}</p>
                          ) : null}
                        </>
                      )}
                      {template.questions?.length ? (
                        <div className="stack-list compact-stack">
                          {template.questions.map((question, index) => (
                            <div className="list-card compact-list-card" key={question.id || index}>
                              <p className="mini-label">Pergunta {index + 1}</p>
                              {activeLibrary.sourceType === "custom" ? (
                                <>
                                  <Input
                                    label="Dimensao da pergunta"
                                    value={question.dimensionTitle || ""}
                                    onChange={(value) =>
                                      setLibraryDrafts((current) => ({
                                        ...current,
                                        [activeLibrary.id]: {
                                          ...current[activeLibrary.id],
                                          templates: current[activeLibrary.id].templates.map((item, itemIndex) =>
                                            itemIndex === templateIndex
                                              ? {
                                                  ...item,
                                                  questions: item.questions.map((entry, entryIndex) =>
                                                    entryIndex === index
                                                      ? { ...entry, dimensionTitle: value }
                                                      : entry
                                                  )
                                                }
                                              : item
                                          )
                                        }
                                      }))
                                    }
                                  />
                                  <Textarea
                                    label="Enunciado da pergunta"
                                    value={question.prompt || ""}
                                    onChange={(value) =>
                                      setLibraryDrafts((current) => ({
                                        ...current,
                                        [activeLibrary.id]: {
                                          ...current[activeLibrary.id],
                                          templates: current[activeLibrary.id].templates.map((item, itemIndex) =>
                                            itemIndex === templateIndex
                                              ? {
                                                  ...item,
                                                  questions: item.questions.map((entry, entryIndex) =>
                                                    entryIndex === index
                                                      ? { ...entry, prompt: value }
                                                      : entry
                                                  )
                                                }
                                              : item
                                          )
                                        }
                                      }))
                                    }
                                  />
                                  <Textarea
                                    label="Texto de apoio ao respondente"
                                    value={question.helperText || ""}
                                    onChange={(value) =>
                                      setLibraryDrafts((current) => ({
                                        ...current,
                                        [activeLibrary.id]: {
                                          ...current[activeLibrary.id],
                                          templates: current[activeLibrary.id].templates.map((item, itemIndex) =>
                                            itemIndex === templateIndex
                                              ? {
                                                  ...item,
                                                  questions: item.questions.map((entry, entryIndex) =>
                                                    entryIndex === index
                                                      ? { ...entry, helperText: value }
                                                      : entry
                                                  )
                                                }
                                              : item
                                          )
                                        }
                                      }))
                                    }
                                  />
                                  {question.inputType === "multi-select" ? (
                                    <Input
                                      label="Opcoes da multipla escolha"
                                      value={question.optionsText || ""}
                                      onChange={(value) =>
                                        setLibraryDrafts((current) => ({
                                          ...current,
                                          [activeLibrary.id]: {
                                            ...current[activeLibrary.id],
                                            templates: current[activeLibrary.id].templates.map((item, itemIndex) =>
                                              itemIndex === templateIndex
                                                ? {
                                                    ...item,
                                                    questions: item.questions.map((entry, entryIndex) =>
                                                      entryIndex === index
                                                        ? { ...entry, optionsText: value }
                                                        : entry
                                                    )
                                                  }
                                                : item
                                            )
                                          }
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
                  ))}
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
              ) : (
                <p className="muted">
                  A biblioteca padrao continua como referencia. Para personalizar perguntas, use
                  uma biblioteca customizada via importacao ou edite uma biblioteca publicada.
                </p>
              )}
            </div>

            <div className="list-card">
              <strong>Importar biblioteca</strong>
              <p className="muted">
                Use planilhas para cadastrar ou atualizar perguntas por tipo de avaliacao.
              </p>
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
                <strong>Competencias formais do modelo</strong>
                <span>{competencies?.length || 0} cadastradas</span>
              </div>
              <p className="muted">
                Dimensoes estruturais do modelo de avaliacao, usadas para organizar perguntas,
                leituras e PDIs.
              </p>
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
                <span>Base formal para questionarios, leituras e desenvolvimento</span>
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
