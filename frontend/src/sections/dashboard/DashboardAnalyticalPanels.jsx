import {
  buildDimensionSummary,
  formatSatisfactionScore
} from "./dashboardData.js";

export function DashboardOperationsPanels({
  DashboardCardHeader,
  SafeBarMetricRow,
  SafeDashboardDonut,
  SafeFunnelSeriesChart,
  SafeHeatmapMatrixCard,
  SafeResponseDistributionChartCard,
  SafeTrendAreaChartCard,
  analyticalRelationshipItems,
  applauseCoverageMetric,
  cycleTimelineItems,
  dashboard,
  dashboardAnalyticalTheme,
  dashboardTimeGroupingLabel,
  developmentByTypeItems,
  developmentCoverageMetric,
  dimensionFilters,
  evaluationMixItems,
  filteredDevelopmentByTypeItems,
  funnelItems,
  getRelationshipLabel,
  isExecutiveView,
  isSatisfactionAnalyticsSelected,
  onSectionChange,
  performanceAreaHighlights,
  performanceAreaSeries,
  performanceDistributionItems,
  performanceHealth,
  performanceRecommendations,
  resolvedSatisfactionQuestionAreaFilter,
  rhythmInsightDetail,
  rhythmInsightTitle,
  rhythmMiniMetrics,
  satisfactionQuestionAreaOptions,
  satisfactionQuestionTrendItems,
  selectedAnalyticalRelationship,
  selectedDashboardCompositionMeta,
  setDashboardCompositionFilter,
  setDimensionFilterForGroup,
  setSatisfactionQuestionAreaFilter,
  summary,
  visibleRelationshipTypes
}) {
  const resultNarrative = buildResultNarrative({
    analyticalRelationshipItems,
    getRelationshipLabel
  });

  return (
    <>
      <div className="card-span dashboard-section-band operations">
        <div className="dashboard-section-band-copy">
          <span>Operacao</span>
          <strong>
            {isExecutiveView ? "Cobertura, pulso e ritmo do ciclo" : "Distribuicao e cobertura do fluxo"}
          </strong>
        </div>
        <p>
          {isExecutiveView
            ? "Blocos dedicados a cobertura, adesao e volume do periodo em andamento."
            : "Leitura detalhada da distribuicao das respostas, funil e evolucao temporal."}
        </p>
      </div>

      <div
        className={`card-span dashboard-board-grid ${
          isExecutiveView ? "dashboard-board-grid-executive" : "dashboard-board-grid-analytical"
        }`}
      >
        {isExecutiveView ? (
          <>
            {(dashboard?.donutMetrics || []).length ? (
              <div className="card dashboard-visual-card dashboard-board-featured">
                <DashboardCardHeader eyebrow="Cobertura" title="Panorama de cobertura" subtitle="Vista rapida do ciclo" tone="primary" />
                <div className="donut-grid">
                  {(dashboard?.donutMetrics || []).filter(Boolean).map((item) => (
                    <SafeDashboardDonut key={item.key || item.label} item={item} />
                  ))}
                </div>
              </div>
            ) : null}

            {cycleTimelineItems.length ? (
              <div className="card dashboard-visual-card dashboard-board-featured">
                <DashboardCardHeader eyebrow="Pulso" title="Pulso do ciclo" subtitle={`Adesao por ${dashboardTimeGroupingLabel.toLowerCase()}`} tone="success" />
                <SafeTrendAreaChartCard
                  items={cycleTimelineItems}
                  valueKey="adherencePercentage"
                  labelKey="label"
                  formatter={(value) => `${value}%`}
                  detailFormatter={(item) => `${item.submittedAssignments}/${item.totalAssignments}`}
                />
              </div>
            ) : null}

            {cycleTimelineItems.length ? (
              <div className="card dashboard-visual-card dashboard-board-tall">
                <DashboardCardHeader eyebrow="Ritmo" title="Ritmo de distribuicao" subtitle="Volume no tempo" tone="warning" />
                <SafeTrendAreaChartCard
                  items={cycleTimelineItems}
                  valueKey="totalAssignments"
                  labelKey="label"
                  formatter={(value) => String(value)}
                  detailFormatter={(item) => `${item.totalResponses} respostas`}
                />
                <div className="dashboard-rhythm-metrics">
                  {rhythmMiniMetrics.map((item) => (
                    <article className="dashboard-rhythm-metric-card" key={item.label}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                      <p>{item.detail}</p>
                    </article>
                  ))}
                </div>
                <div className="dashboard-rhythm-insight">
                  <span className="dashboard-card-eyebrow warning">Insight operacional</span>
                  <strong>{rhythmInsightTitle}</strong>
                  <p>{rhythmInsightDetail}</p>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <>
            {dashboardAnalyticalTheme === "evaluations" ? (
              <div className="card dashboard-visual-card dashboard-board-featured dashboard-analytical-primary">
                <DashboardCardHeader
                  eyebrow="Analise"
                  title="Resultado por modalidade"
                  subtitle={
                    selectedDashboardCompositionMeta
                      ? `Resumo macro e detalhamento de ${selectedDashboardCompositionMeta.label}`
                      : "Resumo consolidado com detalhamento por modalidade"
                  }
                  tone="secondary"
                />
                <div className="stack-list">
                  {analyticalRelationshipItems.length ? (
                    <div className="dashboard-result-narrative-grid">
                      {resultNarrative.map((item) => (
                        <article className={`dashboard-result-narrative-card ${item.tone}`} key={item.label}>
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                          <p>{item.detail}</p>
                        </article>
                      ))}
                    </div>
                  ) : null}

                  {analyticalRelationshipItems.length ? (
                    <div className="list-card">
                      <div className="row">
                        <strong>Resumo macro por modalidade</strong>
                        <span className="badge">{analyticalRelationshipItems.length} modalidades</span>
                      </div>
                      <div className="dashboard-mode-summary-grid">
                        {analyticalRelationshipItems.map(({ relationshipType, summary: itemSummary }) => {
                          const item = itemSummary || {
                            relationshipType,
                            averageScoreLabel: "-",
                            totalResponses: 0,
                            adherencePercentage: 0,
                            tone: "neutral"
                          };
                          return (
                            <article className={`dashboard-mode-summary-card ${item.tone}`} key={relationshipType}>
                              <div className="dashboard-mode-summary-head">
                                <span className={`dashboard-card-eyebrow ${item.tone}`}>
                                  {getRelationshipLabel(relationshipType)}
                                </span>
                                <strong>{item.averageScoreLabel}</strong>
                              </div>
                              <div className="dashboard-mode-summary-metrics">
                                <span>{item.totalResponses} respostas</span>
                                <span>{item.adherencePercentage}% de adesao</span>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {analyticalRelationshipItems.length ? (
                    <div className="list-card">
                      <div className="row">
                        <strong>Comparativo entre modalidades</strong>
                        <span className="muted">Media final e adesao</span>
                      </div>
                      <div className="dashboard-mode-comparison-list">
                        {analyticalRelationshipItems.map(({ relationshipType, summary: itemSummary }) => {
                          const item = itemSummary || {
                            relationshipType,
                            totalResponses: 0,
                            totalAssignments: 0,
                            averageScore: 0,
                            averageScoreLabel: "-",
                            adherencePercentage: 0,
                            tone: "neutral"
                          };
                          return (
                            <div className="dashboard-mode-comparison-row" key={`comparison-${relationshipType}`}>
                              <div className="dashboard-mode-comparison-copy">
                                <strong>{getRelationshipLabel(relationshipType)}</strong>
                                <span>
                                  {item.totalResponses}/{item.totalAssignments || item.totalResponses} respostas
                                </span>
                              </div>
                              <div className="dashboard-mode-comparison-bar">
                                <div
                                  className={`dashboard-mode-comparison-fill ${item.tone}`}
                                  style={{ width: `${item.averageScore ? (item.averageScore / 5) * 100 : 0}%` }}
                                />
                              </div>
                              <div className="dashboard-mode-comparison-values">
                                <strong>{item.averageScoreLabel}</strong>
                                <span>{item.adherencePercentage}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {selectedAnalyticalRelationship ? (
                    <SelectedRelationshipPanel
                      SafeResponseDistributionChartCard={SafeResponseDistributionChartCard}
                      SafeTrendAreaChartCard={SafeTrendAreaChartCard}
                      distribution={selectedAnalyticalRelationship.distribution}
                      dimensionFilters={dimensionFilters}
                      getRelationshipLabel={getRelationshipLabel}
                      isSatisfactionAnalyticsSelected={isSatisfactionAnalyticsSelected}
                      relationshipType={selectedAnalyticalRelationship.relationshipType}
                      resolvedSatisfactionQuestionAreaFilter={resolvedSatisfactionQuestionAreaFilter}
                      satisfactionQuestionAreaOptions={satisfactionQuestionAreaOptions}
                      satisfactionQuestionTrendItems={satisfactionQuestionTrendItems}
                      setDashboardCompositionFilter={setDashboardCompositionFilter}
                      setDimensionFilterForGroup={setDimensionFilterForGroup}
                      setSatisfactionQuestionAreaFilter={setSatisfactionQuestionAreaFilter}
                      summary={summary}
                      totalResponses={
                        selectedAnalyticalRelationship.summary?.totalResponses ||
                        selectedAnalyticalRelationship.distribution?.totalResponses ||
                        0
                      }
                      visibleRelationshipTypes={visibleRelationshipTypes}
                    />
                  ) : (
                    <div className="list-card">
                      <strong>Sem respostas para o filtro aplicado</strong>
                      <p className="muted">
                        Ajuste a modalidade analisada ou revise o recorte atual para liberar a leitura consolidada.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {dashboardAnalyticalTheme === "performance" ? (
              <div className="card dashboard-visual-card dashboard-board-featured dashboard-analytical-primary dashboard-theme-drilldown-card">
                <DashboardCardHeader eyebrow="Desempenho 360" title="Saude de performance" subtitle="Leitura agregada e privada" tone="primary" />
                {performanceHealth ? (
                  <>
                    <div className="dashboard-theme-split">
                      <article className={`dashboard-performance-score-card ${performanceHealth.tone}`}>
                        <span>Resultado agregado</span>
                        <strong>{performanceHealth.averageScoreLabel}/10</strong>
                        <p>{performanceHealth.confidenceLabel}</p>
                        <small>
                          {performanceHealth.reviewCount} leituras consideradas
                          {performanceHealth.partialReadings
                            ? ` · ${performanceHealth.partialReadings} em consolidacao`
                            : ""}
                        </small>
                      </article>
                      <div className="dashboard-theme-summary-grid">
                        {performanceDistributionItems.map((item) => (
                          <article className={`dashboard-theme-metric-card ${item.tone}`} key={item.label}>
                            <span>{item.label}</span>
                            <strong>{item.total}</strong>
                            <p>{item.percentage}% do recorte</p>
                          </article>
                        ))}
                      </div>
                    </div>
                    {performanceAreaHighlights.length ? (
                      <div className="dashboard-dimension-summary-block">
                        <div className="dashboard-dimension-summary-head">
                          <strong>Prioridades por area</strong>
                          <span className="muted">Leitura agregada, sem expor notas individuais</span>
                        </div>
                        <div className="dashboard-dimension-summary-grid">
                          {performanceAreaHighlights.map((item) => (
                            <article className={`dashboard-dimension-summary-card ${item.tone}`} key={item.area}>
                              <span>{item.area}</span>
                              <strong>{item.scoreLabel}/10</strong>
                              <p>{item.peopleCount} leituras</p>
                            </article>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {performanceAreaSeries.length ? (
                      <div className="dashboard-performance-area-panel">
                        <div className="dashboard-dimension-summary-head">
                          <strong>Desempenho por area</strong>
                          <span className="muted">Base macro para ações profiláticas</span>
                        </div>
                        <div className="bar-list">
                          {performanceAreaSeries.map((item) => (
                            <SafeBarMetricRow
                              key={`performance-area-${item.area}`}
                              label={item.area}
                              value={`${item.scoreLabel}/10`}
                              detail={`${item.peopleCount} leituras agregadas`}
                              percentage={item.percentage}
                              toneKey={`performance-${item.tone}-${item.area}`}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {performanceRecommendations.length ? (
                      <div className="dashboard-performance-action-panel">
                        <div className="dashboard-dimension-summary-head">
                          <strong>Ações profiláticas</strong>
                          <span className="muted">Recomendações agregadas e não punitivas</span>
                        </div>
                        <div className="dashboard-performance-action-grid">
                          {performanceRecommendations.map((item) => (
                            <article className={`dashboard-performance-action-card ${item.tone}`} key={item.key}>
                              <span>{item.title}</span>
                              <strong>{item.detail}</strong>
                              <p>{item.action}</p>
                            </article>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div className="dashboard-theme-action-row">
                      <p className="muted">{performanceHealth.guidance}</p>
                      <button type="button" className="dashboard-quick-action primary" onClick={() => onSectionChange?.("Desenvolvimento")}>
                        <span>Abrir modulo</span>
                        <strong>Ver direcionamentos</strong>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="dashboard-empty-relationship-state">
                    <strong>Sem leitura 360 agregada</strong>
                    <p className="muted">
                      Quando houver respostas suficientes, este painel mostrara apenas sinais agregados de performance e direcionamento.
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            {dashboardAnalyticalTheme === "compliance" ? (
              <div className="card dashboard-visual-card dashboard-board-featured dashboard-analytical-primary dashboard-theme-drilldown-card">
                <DashboardCardHeader eyebrow="Compliance" title="Risco e fila de tratamento" subtitle="Leitura operacional do recorte" tone="warning" />
                <div className="dashboard-theme-summary-grid">
                  <article className="dashboard-theme-metric-card critical">
                    <span>Incidentes abertos</span>
                    <strong>{summary?.openIncidents ?? 0}</strong>
                    <p>Casos que exigem acompanhamento ou encerramento.</p>
                  </article>
                  <article className="dashboard-theme-metric-card neutral">
                    <span>Pessoas no recorte</span>
                    <strong>{dashboard?.scopeSummary?.peopleCount ?? summary?.peopleCount ?? 0}</strong>
                    <p>Base considerada para leitura de exposicao e cultura.</p>
                  </article>
                  <article className="dashboard-theme-metric-card warning">
                    <span>Assignments pendentes</span>
                    <strong>{dashboard?.scopeSummary?.pendingAssignments ?? 0}</strong>
                    <p>Pendencias podem atrasar sinais de risco do ciclo.</p>
                  </article>
                </div>
                <div className="dashboard-theme-action-row">
                  <p className="muted">Use este drilldown para sair do indicador e tratar a fila real de compliance.</p>
                  <button type="button" className="dashboard-quick-action success" onClick={() => onSectionChange?.("Compliance")}>
                    <span>Abrir modulo</span>
                    <strong>Ver incidentes</strong>
                  </button>
                </div>
              </div>
            ) : null}

            {dashboardAnalyticalTheme === "development" ? (
              <div className="card dashboard-visual-card dashboard-board-featured dashboard-analytical-primary dashboard-theme-drilldown-card">
                <DashboardCardHeader eyebrow="Desenvolvimento" title="Cobertura e trilhas de PDI" subtitle="Evolucao profissional do recorte" tone="success" />
                <div className="dashboard-theme-split">
                  {developmentCoverageMetric ? <SafeDashboardDonut item={developmentCoverageMetric} /> : null}
                  <div className="dashboard-theme-summary-grid">
                    <article className="dashboard-theme-metric-card positive">
                      <span>Registros</span>
                      <strong>{dashboard?.scopeSummary?.developmentRecords ?? 0}</strong>
                      <p>Marcos, cursos, certificacoes e PDIs no recorte.</p>
                    </article>
                    <article className="dashboard-theme-metric-card neutral">
                      <span>Trilhas</span>
                      <strong>{developmentByTypeItems.length}</strong>
                      <p>Tipos de desenvolvimento com volume registrado.</p>
                    </article>
                  </div>
                </div>
                {developmentByTypeItems.length ? (
                  <SafeHeatmapMatrixCard
                    items={filteredDevelopmentByTypeItems}
                    getLabel={(item) => item.type}
                    getValue={(item) => Number(item.total || 0)}
                    getDetail={(item) => `${item.percentage}% do recorte`}
                    toneSeed="development"
                  />
                ) : null}
              </div>
            ) : null}

            {dashboardAnalyticalTheme === "applause" ? (
              <div className="card dashboard-visual-card dashboard-board-featured dashboard-analytical-primary dashboard-theme-drilldown-card">
                <DashboardCardHeader eyebrow="Aplause" title="Reconhecimento e cultura" subtitle="Sinais positivos do recorte" tone="accent" />
                <div className="dashboard-theme-split">
                  {applauseCoverageMetric ? <SafeDashboardDonut item={applauseCoverageMetric} /> : null}
                  <div className="dashboard-theme-summary-grid">
                    <article className="dashboard-theme-metric-card positive">
                      <span>Reconhecimentos</span>
                      <strong>{dashboard?.scopeSummary?.applauseEntries ?? 0}</strong>
                      <p>Registros validados considerados no recorte atual.</p>
                    </article>
                    <article className="dashboard-theme-metric-card neutral">
                      <span>Cobertura</span>
                      <strong>{applauseCoverageMetric ? `${applauseCoverageMetric.percentage}%` : "-"}</strong>
                      <p>Pessoas reconhecidas dentro da base filtrada.</p>
                    </article>
                  </div>
                </div>
                <div className="dashboard-theme-action-row">
                  <p className="muted">Aprofunde quando quiser entender quais comportamentos estao sendo reforcados.</p>
                  <button type="button" className="dashboard-quick-action accent" onClick={() => onSectionChange?.("Aplause")}>
                    <span>Abrir modulo</span>
                    <strong>Ver reconhecimentos</strong>
                  </button>
                </div>
              </div>
            ) : null}

            {dashboardAnalyticalTheme === "evaluations" && funnelItems.length ? (
              <div className="card">
                <DashboardCardHeader eyebrow="Fluxo" title="Funil do recorte" subtitle="Cobertura do fluxo" tone="neutral" />
                <SafeFunnelSeriesChart items={funnelItems} emptyMessage="Sem dados para compor o funil neste recorte." />
              </div>
            ) : null}

            {dashboardAnalyticalTheme === "evaluations" && cycleTimelineItems.length ? (
              <div className={`card dashboard-visual-card ${funnelItems.length ? "" : "dashboard-board-featured"}`}>
                <DashboardCardHeader eyebrow="Volume" title={`Volume por ${dashboardTimeGroupingLabel.toLowerCase()}`} subtitle="Evolucao temporal" tone="primary" />
                <SafeTrendAreaChartCard
                  items={cycleTimelineItems}
                  valueKey="totalAssignments"
                  labelKey="label"
                  formatter={(value) => String(value)}
                  detailFormatter={(item) => `${item.adherencePercentage}% de adesao`}
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}

function buildResultNarrative({ analyticalRelationshipItems = [], getRelationshipLabel }) {
  const populatedItems = analyticalRelationshipItems
    .map(({ relationshipType, summary }) => ({
      relationshipType,
      ...(summary || {})
    }))
    .filter((item) => (item.totalAssignments || 0) > 0 || (item.totalResponses || 0) > 0);

  if (!populatedItems.length) {
    return [
      {
        label: "Parecer",
        value: "Sem base suficiente",
        detail: "Assim que houver respostas no recorte, a leitura de resultado sera consolidada aqui.",
        tone: "neutral"
      }
    ];
  }

  const scoredItems = populatedItems.filter((item) => Number.isFinite(Number(item.averageScore)));
  const strongest = [...scoredItems].sort(
    (left, right) => Number(right.averageScore) - Number(left.averageScore)
  )[0];
  const attention = [...populatedItems].sort((left, right) => {
    const leftScore = Number.isFinite(Number(left.averageScore)) ? Number(left.averageScore) : 0;
    const rightScore = Number.isFinite(Number(right.averageScore)) ? Number(right.averageScore) : 0;
    const leftAdherence = Number(left.adherencePercentage || 0);
    const rightAdherence = Number(right.adherencePercentage || 0);
    if (leftAdherence !== rightAdherence) {
      return leftAdherence - rightAdherence;
    }
    return leftScore - rightScore;
  })[0];
  const totalAssignments = populatedItems.reduce(
    (total, item) => total + Number(item.totalAssignments || 0),
    0
  );
  const totalResponses = populatedItems.reduce(
    (total, item) => total + Number(item.totalResponses || 0),
    0
  );
  const adherence = totalAssignments
    ? Math.round((totalResponses / totalAssignments) * 100)
    : 100;
  const actionDetail =
    adherence < 70
      ? "Priorize comunicacao e cobranca de pendencias antes de tomar decisoes sobre desempenho."
      : attention
        ? `Aprofunde ${getRelationshipLabel(attention.relationshipType)} para separar aderencia baixa de sinal de desempenho.`
        : "Use o detalhamento por pergunta para transformar o resultado em plano de acao.";

  return [
    {
      label: "Aderencia",
      value: `${adherence}%`,
      detail: `${totalResponses}/${totalAssignments || totalResponses} respostas no recorte analisado.`,
      tone: adherence >= 85 ? "positive" : adherence >= 70 ? "warning" : "critical"
    },
    {
      label: "Melhor sinal",
      value: strongest ? getRelationshipLabel(strongest.relationshipType) : "Sem nota",
      detail: strongest
        ? `${strongest.averageScoreLabel || Number(strongest.averageScore).toFixed(1)} de media.`
        : "Ainda nao ha score consolidado para comparar modalidades.",
      tone: "positive"
    },
    {
      label: "Ponto de atencao",
      value: attention ? getRelationshipLabel(attention.relationshipType) : "Sem alerta",
      detail: attention
        ? `${attention.adherencePercentage || 0}% de aderencia e media ${attention.averageScoreLabel || "-"}.`
        : "Nao ha modalidade com gargalo claro neste recorte.",
      tone: attention?.tone || "neutral"
    },
    {
      label: "Proxima acao",
      value: adherence < 70 ? "Fechar pendencias" : "Aprofundar leitura",
      detail: actionDetail,
      tone: adherence < 70 ? "critical" : "neutral"
    }
  ];
}

function SelectedRelationshipPanel({
  SafeResponseDistributionChartCard,
  SafeTrendAreaChartCard,
  distribution,
  dimensionFilters,
  getRelationshipLabel,
  isSatisfactionAnalyticsSelected,
  relationshipType,
  resolvedSatisfactionQuestionAreaFilter,
  satisfactionQuestionAreaOptions,
  satisfactionQuestionTrendItems,
  setDashboardCompositionFilter,
  setDimensionFilterForGroup,
  setSatisfactionQuestionAreaFilter,
  summary,
  totalResponses,
  visibleRelationshipTypes
}) {
  const dimensionSummary = buildDimensionSummary(distribution?.questions || []);
  const selectedDimension = dimensionFilters[relationshipType] || "all";
  const filteredQuestions =
    selectedDimension === "all"
      ? distribution?.questions || []
      : (distribution?.questions || []).filter(
          (question) => question.dimensionTitle === selectedDimension
        );

  return (
    <div className="list-card" key={relationshipType}>
      <div className="row">
        <label className="dashboard-card-filter-card dashboard-relationship-filter-card">
          <span>Avaliacao</span>
          <select
            value={relationshipType}
            onChange={(event) => setDashboardCompositionFilter(event.target.value)}
          >
            {visibleRelationshipTypes.map((type) => (
              <option key={type} value={type}>
                {getRelationshipLabel(type)}
              </option>
            ))}
          </select>
        </label>
        <span className="badge">{totalResponses} respostas</span>
      </div>
      {isSatisfactionAnalyticsSelected ? (
        <div className="dashboard-satisfaction-analytics-panel">
          <div className="dashboard-dimension-summary-head">
            <div>
              <strong>Satisfacao por pergunta</strong>
              <p className="muted">
                Compare a opiniao dos colaboradores por ciclo, semestre, trimestre ou ano.
              </p>
            </div>
            <label className="dashboard-card-filter-card dashboard-dimension-filter-card">
              <span>Area</span>
              <select
                value={resolvedSatisfactionQuestionAreaFilter}
                onChange={(event) => setSatisfactionQuestionAreaFilter(event.target.value)}
              >
                {satisfactionQuestionAreaOptions.map((area) => (
                  <option key={area} value={area}>
                    {area === "all" ? "Todas" : area}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {satisfactionQuestionTrendItems.length ? (
            <div className="dashboard-satisfaction-question-grid">
              {satisfactionQuestionTrendItems.map((question) => (
                <article
                  className="dashboard-satisfaction-question-card"
                  key={`${question.questionId}-${resolvedSatisfactionQuestionAreaFilter}`}
                >
                  <div className="dashboard-satisfaction-question-head">
                    <div>
                      <span className="dashboard-card-eyebrow secondary">
                        {question.dimensionTitle || "Satisfacao"}
                      </span>
                      <strong>{question.latestScoreLabel}/5</strong>
                    </div>
                    <div className="dashboard-satisfaction-question-meta">
                      <span>{question.totalAnswers} respostas</span>
                      {question.trendDelta !== null ? (
                        <b className={question.trendDelta >= 0 ? "positive" : "warning"}>
                          {question.trendDelta > 0 ? "+" : ""}
                          {formatSatisfactionScore(question.trendDelta)}
                        </b>
                      ) : null}
                    </div>
                  </div>
                  <p className="muted dashboard-satisfaction-question-prompt">
                    {question.questionPrompt}
                  </p>
                  <SafeTrendAreaChartCard
                    items={question.periods}
                    valueKey="averageScore"
                    labelKey="label"
                    formatter={formatSatisfactionScore}
                    detailFormatter={(item) => `${item.totalAnswers} resp.`}
                  />
                </article>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-relationship-state">
              <strong>Sem respostas para esta area</strong>
              <p className="muted">
                Ajuste o filtro aplicado ou aguarde novas respostas da avaliacao de satisfacao.
              </p>
            </div>
          )}
        </div>
      ) : null}
      {dimensionSummary.length ? (
        <div className="dashboard-dimension-summary-block">
          <div className="dashboard-dimension-summary-head">
            <strong>Leitura por dimensão</strong>
            <label className="dashboard-card-filter-card dashboard-dimension-filter-card">
              <span>Dimensão</span>
              <select
                value={selectedDimension}
                onChange={(event) =>
                  setDimensionFilterForGroup(relationshipType, event.target.value)
                }
              >
                <option value="all">Todas</option>
                {dimensionSummary.map((item) => (
                  <option key={item.dimensionTitle} value={item.dimensionTitle}>
                    {item.dimensionTitle}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="dashboard-dimension-summary-grid">
            {dimensionSummary.map((item) => (
              <article
                className={`dashboard-dimension-summary-card ${item.tone} ${
                  selectedDimension === item.dimensionTitle ? "active" : ""
                }`}
                key={`${relationshipType}-${item.dimensionTitle}`}
              >
                <span>{item.dimensionTitle}</span>
                <strong>{item.averageScoreLabel}</strong>
                <p>{item.questionCount} perguntas</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}
      {!isSatisfactionAnalyticsSelected && filteredQuestions.length ? (
        <div className="response-chart-grid">
          {filteredQuestions.map((question) => (
            <SafeResponseDistributionChartCard key={question.questionId} question={question} />
          ))}
        </div>
      ) : !isSatisfactionAnalyticsSelected ? (
        <div className="dashboard-empty-relationship-state">
          <strong>Sem detalhe analitico disponivel</strong>
          <p className="muted">
            {summary?.totalResponses
              ? "Esta modalidade ainda nao tem volume suficiente para abrir a leitura pergunta por pergunta."
              : "Ainda nao existem respostas registradas para esta modalidade neste recorte."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
