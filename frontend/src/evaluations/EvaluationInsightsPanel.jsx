export function EvaluationInsightsPanel({
  Select,
  activeCycleModuleSummary,
  activeEvaluationCycleId,
  canViewEvaluationInsights,
  cycleComparisonHighlights,
  comparisonCycleModuleSummary,
  comparisonCycleOptions,
  comparisonEvaluationCycleId,
  evaluationCycleHistory,
  formatDate,
  setActiveEvaluationCycleId,
  setComparisonEvaluationCycleId,
  activeEvaluationWorkspace
}) {
  if (!canViewEvaluationInsights || activeEvaluationWorkspace !== "insights") {
    return null;
  }

  return (
    <>
      <div className="card card-span">
        <div className="card-header">
          <h3>Leituras do ciclo</h3>
          <span>Consolidado do submodulo no seu escopo de acesso</span>
        </div>
        <div className="evaluation-cycle-grid">
          <div className="list-card">
            <div className="row">
              <strong>{activeCycleModuleSummary?.title || "Ciclo ativo"}</strong>
              <span className="badge">{activeCycleModuleSummary?.status || "-"}</span>
            </div>
            <p className="muted">
              {activeCycleModuleSummary?.semesterLabel || "Sem semestre informado"} | Prazo:{" "}
              {formatDate(activeCycleModuleSummary?.dueDate)}
            </p>
            <div className="metrics-grid evaluation-cycle-metrics">
              <MiniMetric label="Assignments" value={activeCycleModuleSummary?.totalAssignments || 0} />
              <MiniMetric label="Concluidas" value={activeCycleModuleSummary?.submittedAssignments || 0} />
              <MiniMetric label="Pendentes" value={activeCycleModuleSummary?.pendingAssignments || 0} />
              <MiniMetric label="Media observada" value={activeCycleModuleSummary?.averageScore ?? "-"} />
              <MiniMetric label="Conclusao" value={`${activeCycleModuleSummary?.completionRate ?? 0}%`} />
            </div>
          </div>

          <div className="list-card">
            <div className="card-header">
              <strong>Comparar com outro ciclo</strong>
              <span>Historico armazenado por ciclo</span>
            </div>
            <Select
              label="Ciclo para comparacao"
              value={comparisonEvaluationCycleId}
              options={comparisonCycleOptions.map((cycle) => cycle.id)}
              renderLabel={(value) =>
                comparisonCycleOptions.find((cycle) => cycle.id === value)?.title || value
              }
              onChange={setComparisonEvaluationCycleId}
            />
            {comparisonCycleModuleSummary ? (
              <>
                <div className="metrics-grid evaluation-cycle-metrics">
                  <MiniMetric label="Assignments" value={comparisonCycleModuleSummary.totalAssignments} />
                  <MiniMetric label="Concluidas" value={comparisonCycleModuleSummary.submittedAssignments} />
                  <MiniMetric label="Pendentes" value={comparisonCycleModuleSummary.pendingAssignments} />
                  <MiniMetric label="Media observada" value={comparisonCycleModuleSummary.averageScore ?? "-"} />
                  <MiniMetric label="Conclusao" value={`${comparisonCycleModuleSummary.completionRate}%`} />
                </div>
                {cycleComparisonHighlights.length ? (
                  <div className="stack-list evaluation-comparison-list">
                    {cycleComparisonHighlights.map((item) => (
                      <article className="list-card evaluation-comparison-card" key={item.key}>
                        <div className="row">
                          <strong>{item.label}</strong>
                          <span
                            className={`badge evaluation-delta-badge ${item.direction}`}
                          >
                            {item.deltaLabel}
                          </span>
                        </div>
                        <p className="muted">
                          Ativo: {item.activeValue} | Comparado: {item.comparisonValue}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="muted">
                Ainda nao ha outro ciclo disponivel para comparacao neste ambiente.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="card card-span">
        <div className="card-header">
          <h3>Historico armazenado por ciclo</h3>
          <span>Comparativo do submodulo dentro do seu escopo</span>
        </div>
        <div className="stack-list evaluation-history-list">
          {evaluationCycleHistory.length ? (
            evaluationCycleHistory.map((cycleSummary) => (
              <article
                className={
                  cycleSummary.id === activeEvaluationCycleId
                    ? "list-card evaluation-history-card active"
                    : "list-card evaluation-history-card"
                }
                key={cycleSummary.id}
              >
                <div className="row">
                  <div>
                    <strong>{cycleSummary.title}</strong>
                    <p className="muted">{cycleSummary.semesterLabel}</p>
                  </div>
                  <span className="badge">{cycleSummary.status}</span>
                </div>
                <div className="metrics-grid evaluation-cycle-metrics">
                  <MiniMetric label="Assignments" value={cycleSummary.totalAssignments} />
                  <MiniMetric label="Concluidas" value={cycleSummary.submittedAssignments} />
                  <MiniMetric label="Media" value={cycleSummary.averageScore ?? "-"} />
                  <MiniMetric label="Conclusao" value={`${cycleSummary.completionRate}%`} />
                </div>
                <div className="action-row evaluation-history-actions">
                  <button
                    type="button"
                    className={
                      cycleSummary.id === activeEvaluationCycleId ? "primary-button" : "refresh"
                    }
                    onClick={() => setActiveEvaluationCycleId(cycleSummary.id)}
                  >
                    {cycleSummary.id === activeEvaluationCycleId ? "Ciclo em foco" : "Abrir ciclo"}
                  </button>
                  {cycleSummary.id !== activeEvaluationCycleId ? (
                    <button
                      type="button"
                      className="refresh"
                      onClick={() => setComparisonEvaluationCycleId(cycleSummary.id)}
                    >
                      Comparar com ativo
                    </button>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <div className="list-card">
              <strong>Sem historico para este submodulo</strong>
              <p className="muted">
                Assim que o ciclo tiver assignments ou respostas registradas, o historico passara a
                aparecer aqui para comparacao.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="mini-card">
      <p className="mini-label">{label}</p>
      <strong>{value}</strong>
    </div>
  );
}
