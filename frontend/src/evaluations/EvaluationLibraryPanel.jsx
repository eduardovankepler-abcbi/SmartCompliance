import { useEffect, useState } from "react";

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
  handleCustomLibraryTemplateDownload,
  handleCustomLibraryPublish,
  setCustomLibraryPublishForm,
  showEvaluationLibrary
}) {
  const [activeTab, setActiveTab] = useState("libraries");
  const [competencyForm, setCompetencyForm] = useState(emptyCompetencyForm);
  const [competencyDrafts, setCompetencyDrafts] = useState({});

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
              <strong>Bibliotecas publicadas</strong>
              <p className="muted">
                Espaco para o RH gerenciar os conjuntos de perguntas e templates usados nos tipos
                de avaliacao.
              </p>
              {evaluationLibrary?.customLibraries?.length ? (
                evaluationLibrary.customLibraries.map((library) => (
                  <p className="muted" key={library.id}>
                    {library.name} | {library.templateCount} templates | {library.questionCount}{" "}
                    perguntas
                  </p>
                ))
              ) : (
                <p className="muted">Nenhuma biblioteca customizada publicada ainda.</p>
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
