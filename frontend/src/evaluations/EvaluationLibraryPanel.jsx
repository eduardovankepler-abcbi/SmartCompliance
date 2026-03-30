export function EvaluationLibraryPanel({
  Input,
  Textarea,
  canViewEvaluationLibrary,
  customLibraryDraft,
  customLibraryPublishForm,
  evaluationLibrary,
  handleCustomLibraryImport,
  handleCustomLibraryTemplateDownload,
  handleCustomLibraryPublish,
  setCustomLibraryPublishForm,
  showEvaluationLibrary
}) {
  if (!canViewEvaluationLibrary || !showEvaluationLibrary) {
    return null;
  }

  return (
    <div className="card card-span">
      <div className="card-header">
        <h3>Biblioteca e modelo</h3>
        <span>{evaluationLibrary?.customLibraries?.length || 0} bibliotecas publicadas</span>
      </div>
      <div className="stack-list">
        <div className="list-card">
          <strong>Bibliotecas publicadas</strong>
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
      </div>
    </div>
  );
}
