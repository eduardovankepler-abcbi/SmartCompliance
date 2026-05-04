export function DashboardInsightPanels({
  DashboardCardHeader,
  SafeBarMetricRow,
  SafeColumnMetricCard,
  SafeHeatmapMatrixCard,
  assignmentStatusItems,
  cycleTimelineItems,
  dashboardAnalyticalTheme,
  dashboardTimeGroupingLabel,
  developmentByTypeItems,
  developmentView,
  evaluationMixItems,
  executiveComparisons,
  filteredDevelopmentByTypeItems,
  filteredSatisfactionByAreaItems,
  getAssignmentStatusLabel,
  getRelationshipLabel,
  isExecutiveView,
  performanceAreaSeries,
  performanceRecommendations,
  satisfactionByAreaItems,
  satisfactionView,
  selectedDashboardCompositionMeta,
  setDevelopmentView,
  setSatisfactionView
}) {
  return (
    <>
      <div className="card-span dashboard-section-band insights">
        <div className="dashboard-section-band-copy">
          <span>Analise</span>
          <strong>
            {isExecutiveView
              ? "Leituras complementares para a decisao"
              : "Camadas de apoio para detalhamento do recorte"}
          </strong>
        </div>
        <p>
          {isExecutiveView
            ? "Cards de apoio para interpretar satisfacao, assignments, desenvolvimento e variacoes."
            : "Visoes complementares para composicao, adesao e sinais de comportamento do ciclo."}
        </p>
      </div>

      <div className={`card-span dashboard-insight-grid ${isExecutiveView ? "dashboard-insight-grid-executive" : "dashboard-insight-grid-analytical"}`}>
        {assignmentStatusItems.length && (isExecutiveView || dashboardAnalyticalTheme === "evaluations") ? (
          <div className={`card dashboard-side-card ${isExecutiveView ? "dashboard-card-tall" : ""}`}>
            <DashboardCardHeader eyebrow="Operacao" title="Status dos assignments" subtitle="Fluxo atual" tone="warning" />
            <div className="dashboard-column-grid">
              {assignmentStatusItems.map((item) => (
                <SafeColumnMetricCard
                  key={item.status}
                  label={getAssignmentStatusLabel(item.status)}
                  value={item.total}
                  percentage={item.percentage}
                  description={`${item.percentage}% do total`}
                  toneKey={item.status}
                />
              ))}
            </div>
          </div>
        ) : null}

        {satisfactionByAreaItems.length && (isExecutiveView || dashboardAnalyticalTheme === "evaluations") ? (
          <div className={`card dashboard-side-card ${isExecutiveView ? "dashboard-card-tall" : ""}`}>
            <div className="card-header">
              <div>
                <span className="dashboard-card-eyebrow secondary">Satisfacao</span>
                <h3>Satisfacao por area</h3>
                <span>Mapa de calor</span>
              </div>
              <div className="dashboard-card-filter">
                <label className="dashboard-card-filter-card">
                  <span>Filtro ativo</span>
                  <select value={satisfactionView} onChange={(event) => setSatisfactionView(event.target.value)}>
                    <option value="all">Todas</option>
                    <option value="top">Melhores</option>
                    <option value="critical">Menores notas</option>
                  </select>
                </label>
              </div>
            </div>
            <SafeHeatmapMatrixCard
              items={filteredSatisfactionByAreaItems}
              getLabel={(item) => item.area}
              getValue={(item) => Number(item.score || 0)}
              getDetail={(item) => `${item.peopleCount} pessoas · ${item.percentage}%`}
              toneSeed="area"
            />
          </div>
        ) : null}

        {isExecutiveView && performanceAreaSeries.length ? (
          <div className="card dashboard-side-card">
            <DashboardCardHeader eyebrow="Desempenho 360" title="Desempenho por area" subtitle="Leitura macro agregada" tone="primary" />
            <div className="bar-list">
              {performanceAreaSeries.map((item) => (
                <SafeBarMetricRow
                  key={`executive-performance-area-${item.area}`}
                  label={item.area}
                  value={`${item.scoreLabel}/10`}
                  detail={`${item.peopleCount} leituras · ${item.tone === "critical" ? "requer apoio" : item.tone === "warning" ? "acompanhar" : "saudavel"}`}
                  percentage={item.percentage}
                  toneKey={`executive-performance-${item.tone}-${item.area}`}
                />
              ))}
            </div>
          </div>
        ) : null}

        {isExecutiveView && performanceRecommendations.length ? (
          <div className="card dashboard-side-card dashboard-performance-action-panel">
            <DashboardCardHeader eyebrow="Profilaxia" title="Ações recomendadas" subtitle="Intervenção preventiva" tone="warning" />
            <div className="dashboard-performance-action-grid">
              {performanceRecommendations.map((item) => (
                <article className={`dashboard-performance-action-card ${item.tone}`} key={`executive-${item.key}`}>
                  <span>{item.title}</span>
                  <strong>{item.detail}</strong>
                  <p>{item.action}</p>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {isExecutiveView && executiveComparisons.length ? (
          <div className="card dashboard-side-card">
            <DashboardCardHeader eyebrow="Comparativo" title="Comparativos do periodo" subtitle="Variacoes relevantes" tone="accent" />
            <div className="executive-comparison-grid">
              {executiveComparisons.map((item) => (
                <article className={`list-card executive-comparison-card ${item.tone}`} key={item.title}>
                  <p className="mini-label">{item.title}</p>
                  <strong>{item.value}</strong>
                  <p className="muted">{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {developmentByTypeItems.length && (isExecutiveView || dashboardAnalyticalTheme === "development") ? (
          <div className="card dashboard-side-card">
            <div className="card-header">
              <div>
                <span className="dashboard-card-eyebrow success">Desenvolvimento</span>
                <h3>Desenvolvimento por trilha</h3>
                <span>Volume por tipo</span>
              </div>
              <div className="dashboard-card-filter">
                <label className="dashboard-card-filter-card">
                  <span>Filtro ativo</span>
                  <select value={developmentView} onChange={(event) => setDevelopmentView(event.target.value)}>
                    <option value="all">Todas</option>
                    <option value="top">Mais volume</option>
                    <option value="alpha">A-Z</option>
                  </select>
                </label>
              </div>
            </div>
            <SafeHeatmapMatrixCard
              items={filteredDevelopmentByTypeItems}
              getLabel={(item) => item.type}
              getValue={(item) => Number(item.total || 0)}
              getDetail={(item) => `${item.percentage}% do recorte`}
              toneSeed="development"
            />
          </div>
        ) : null}

        {cycleTimelineItems.length && (isExecutiveView || dashboardAnalyticalTheme === "evaluations") ? (
          <div className="card dashboard-side-card">
            <DashboardCardHeader eyebrow="Adesao" title={`Adesao por ${dashboardTimeGroupingLabel.toLowerCase()}`} subtitle="Concluidas vs distribuidas" tone="primary" />
            <div className="bar-list">
              {cycleTimelineItems.map((item) => (
                <SafeBarMetricRow
                  key={`${item.periodKey}-adherence`}
                  label={item.label}
                  value={`${item.adherencePercentage}%`}
                  detail={`${item.submittedAssignments}/${item.totalAssignments} concluidas | ${item.pendingAssignments} pendentes`}
                  percentage={item.adherencePercentage}
                  toneKey={item.periodKey}
                />
              ))}
            </div>
          </div>
        ) : null}

        {!isExecutiveView && dashboardAnalyticalTheme === "evaluations" && evaluationMixItems.length ? (
          <div className="card dashboard-side-card">
            <DashboardCardHeader
              eyebrow="Mix"
              title="Composicao do ciclo"
              subtitle={
                selectedDashboardCompositionMeta
                  ? `Recorte de ${selectedDashboardCompositionMeta.label}`
                  : "Mix de tipos de avaliacao"
              }
              tone="secondary"
            />
            <SafeHeatmapMatrixCard
              items={evaluationMixItems}
              getLabel={(item) => getRelationshipLabel(item.type)}
              getValue={(item) => Number(item.total || 0)}
              getDetail={(item) => `${item.percentage}% do total`}
              toneSeed="mix"
            />
          </div>
        ) : null}
      </div>
    </>
  );
}
