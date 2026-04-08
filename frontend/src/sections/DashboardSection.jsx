import { useState } from "react";

const EmptyComponent = () => null;

function DashboardCardHeader({ title, subtitle, tone = "neutral", eyebrow }) {
  return (
    <div className="card-header dashboard-card-header">
      <div className="dashboard-card-heading">
        {eyebrow ? <span className={`dashboard-card-eyebrow ${tone}`}>{eyebrow}</span> : null}
        <h3>{title}</h3>
      </div>
      <span>{subtitle}</span>
    </div>
  );
}

function DashboardFilterSelectCard({ label, value, options, onChange, renderLabel }) {
  return (
    <label className="dashboard-filter-select-card">
      <span>{label}</span>
      <div className="dashboard-filter-select-wrap">
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => (
            <option key={option} value={option}>
              {renderLabel ? renderLabel(option) : option}
            </option>
          ))}
        </select>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="m5 7 5 6 5-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </label>
  );
}

export function DashboardSection({
  BarMetricRow,
  ColumnMetricCard,
  DashboardDonut,
  FunnelSeriesChart,
  HeatmapMatrixCard,
  ResponseDistributionChartCard,
  Select,
  canFilterDashboardByArea,
  dashboard,
  dashboardAreaFilter,
  dashboardCompositionFilter,
  dashboardCompositionOptions,
  dashboardTimeGrouping,
  dashboardTimeGroupingLabel,
  dashboardTimeGroupingOptions,
  onSectionChange,
  filteredDashboardEvaluationMix,
  filteredDashboardEvaluationResultsSummary,
  filteredDashboardResponseDistributions,
  getAssignmentStatusLabel,
  getRelationshipDescription,
  getRelationshipLabel,
  profileName,
  selectedDashboardCompositionMeta,
  setDashboardAreaFilter,
  setDashboardCompositionFilter,
  setDashboardTimeGrouping,
  summary,
  TrendAreaChartCard
}) {
  const SafeBarMetricRow = BarMetricRow || EmptyComponent;
  const SafeColumnMetricCard = ColumnMetricCard || EmptyComponent;
  const SafeDashboardDonut = DashboardDonut || EmptyComponent;
  const SafeFunnelSeriesChart = FunnelSeriesChart || EmptyComponent;
  const SafeHeatmapMatrixCard = HeatmapMatrixCard || EmptyComponent;
  const SafeResponseDistributionChartCard = ResponseDistributionChartCard || EmptyComponent;
  const SafeTrendAreaChartCard = TrendAreaChartCard || EmptyComponent;
  const [dashboardViewMode, setDashboardViewMode] = useState("executive");
  const [satisfactionView, setSatisfactionView] = useState("all");
  const [developmentView, setDevelopmentView] = useState("all");
  const [dimensionFilters, setDimensionFilters] = useState({});
  const executiveHighlights = buildExecutiveHighlights({
    dashboard,
    dashboardAreaFilter,
    dashboardTimeGroupingLabel,
    selectedDashboardCompositionMeta
  });
  const executiveComparisons = buildExecutiveComparisons({ dashboard, dashboardTimeGroupingLabel });
  const storyCards = buildDashboardStoryCards({
    dashboard,
    summary,
    dashboardAreaFilter,
    dashboardTimeGroupingLabel
  });
  const isExecutiveView = dashboardViewMode === "executive";
  const assignmentStatusItems = dashboard?.assignmentStatus || [];
  const cycleTimelineItems = dashboard?.cycleTimeline || [];
  const satisfactionByAreaItems = dashboard?.satisfactionByArea || [];
  const developmentByTypeItems = dashboard?.developmentByType || [];
  const evaluationMixItems = filteredDashboardEvaluationMix || [];
  const evaluationResultsSummaryItems = filteredDashboardEvaluationResultsSummary || [];
  const funnelItems = dashboard?.funnelMetrics || [];
  const filteredSatisfactionByAreaItems = getFilteredSatisfactionItems(
    satisfactionByAreaItems,
    satisfactionView
  );
  const filteredDevelopmentByTypeItems = getFilteredDevelopmentItems(
    developmentByTypeItems,
    developmentView
  );
  const currentCompositionLabel =
    dashboardCompositionOptions.find((item) => item.value === dashboardCompositionFilter)?.label ||
    dashboardCompositionFilter;
  const visibleRelationshipTypes = dashboardCompositionOptions
    .map((item) => item.value)
    .filter((value) => value !== "all");
  const analyticalRelationshipItems = visibleRelationshipTypes.map((relationshipType) => ({
    relationshipType,
    summary:
      evaluationResultsSummaryItems.find((item) => item.relationshipType === relationshipType) || null,
    distribution:
      filteredDashboardResponseDistributions.find((item) => item.relationshipType === relationshipType) ||
      null
  }));
  const preferredAnalyticalRelationshipType =
    analyticalRelationshipItems.find(
      (item) => (item.distribution?.questions || []).length || (item.summary?.totalResponses || 0) > 0
    )?.relationshipType || analyticalRelationshipItems[0]?.relationshipType || "all";
  const selectedAnalyticalRelationshipType =
    dashboardCompositionFilter === "all"
      ? preferredAnalyticalRelationshipType
      : dashboardCompositionFilter;
  const selectedAnalyticalRelationship = analyticalRelationshipItems.find(
    (item) => item.relationshipType === selectedAnalyticalRelationshipType
  );
  const dashboardHeadline =
    dashboard?.mode === "executive"
      ? "Resumo estratégico da operação"
      : dashboard?.mode === "team"
        ? "Resumo estratégico da sua equipe"
        : "Resumo estratégico do seu recorte";
  const focusPills = [
    { label: "Recorte", value: currentCompositionLabel, tone: "neutral" },
    {
      label: "Area",
      value: dashboardAreaFilter === "all" ? "Todas" : dashboardAreaFilter,
      tone: "positive"
    },
    {
      label: "Consolidacao",
      value: dashboardTimeGroupingLabel,
      tone: "warning"
    }
  ];
  const quickActions = [
    {
      key: "Avaliacoes",
      label: "Novo ciclo",
      detail: "Abrir operacao de avaliacoes",
      tone: "primary"
    },
    {
      key: "Compliance",
      label: "Ver incidentes",
      detail: "Acompanhar fila ativa",
      tone: "success"
    },
    {
      key: "Usuarios",
      label: "Novo usuario",
      detail: "Provisionar acesso",
      tone: "secondary"
    },
    {
      key: "Pessoas",
      label: "Nova pessoa",
      detail: "Atualizar estrutura",
      tone: "accent"
    }
  ];
  const topKpis = [
    {
      label: "Pessoas",
      value: dashboard?.scopeSummary?.peopleCount ?? summary?.peopleCount ?? 0,
      detail: "base ativa no recorte",
      tone: "primary"
    },
    {
      label: "Incidentes abertos",
      value: summary?.openIncidents ?? 0,
      detail: "casos em acompanhamento",
      tone: "warning"
    },
    {
      label: "Ciclos ativos",
      value: summary?.activeEvaluationCycles ?? 0,
      detail: "avaliacoes em andamento",
      tone: "success"
    },
    {
      label: "Assignments pendentes",
      value: dashboard?.scopeSummary?.pendingAssignments ?? summary?.pendingAssignments ?? 0,
      detail: "acoes aguardando conclusao",
      tone: "accent"
    }
  ];

  function setDimensionFilterForGroup(relationshipType, nextValue) {
    setDimensionFilters((current) => ({
      ...current,
      [relationshipType]: nextValue
    }));
  }

  return (
    <section className="page-grid dashboard-grid">
      <div className="card card-span dashboard-command-card">
        <div className="dashboard-command-hero">
          <div className="dashboard-command-copy">
            <p className="eyebrow">
              {dashboard?.mode === "executive"
                ? "Painel do administrador"
                : dashboard?.mode === "team"
                  ? "Painel gerencial"
                  : "Painel individual"}
            </p>
            <h3>{`Ola, ${profileName || "time"}!`}</h3>
            <p className="dashboard-command-headline">{dashboardHeadline}</p>
            <p className="muted">
              {dashboard?.notice ||
                "Acompanhe cobertura, adesao, desenvolvimento e sinais do ciclo em uma leitura executiva mais objetiva."}
            </p>
          </div>
          <div className="dashboard-command-meta">
            <span className="badge">Painel {isExecutiveView ? "executivo" : "analitico"}</span>
            <p className="muted">
              {isExecutiveView
                ? "Pronto para checkpoints, comites e leitura de prioridade."
                : "Pronto para explorar distribuicao, cobertura e gargalos."}
            </p>
            <div className="dashboard-command-actions">
              {quickActions.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  className={`dashboard-quick-action ${action.tone}`}
                  onClick={() => onSectionChange?.(action.key)}
                >
                  <span>{action.label}</span>
                  <strong>{action.detail}</strong>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="dashboard-view-toggle dashboard-command-toggle">
          <button
            type="button"
            className={
              isExecutiveView ? "button-reset module-tab active" : "button-reset module-tab"
            }
            onClick={() => setDashboardViewMode("executive")}
          >
            <span className="module-tab-title">Leitura executiva</span>
            <span className="module-tab-meta">Sintese para reunioes</span>
          </button>
          <button
            type="button"
            className={
              !isExecutiveView ? "button-reset module-tab active" : "button-reset module-tab"
            }
            onClick={() => setDashboardViewMode("analytical")}
          >
            <span className="module-tab-title">Leitura analitica</span>
            <span className="module-tab-meta">Exploracao detalhada</span>
          </button>
        </div>
        <div className="dashboard-command-kpis">
          {topKpis.map((item) => (
            <article className={`dashboard-kpi-inline-card ${item.tone}`} key={item.label}>
              <div className="dashboard-kpi-inline-copy">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="card card-span dashboard-filter-card">
        <div className="card-header">
          <h3>Filtros do dashboard</h3>
          <span>Defina o contexto da leitura</span>
        </div>
        <div className="dashboard-filter-grid">
          <DashboardFilterSelectCard
            label="Recorte"
            value={dashboardCompositionFilter}
            options={dashboardCompositionOptions.map((item) => item.value)}
            renderLabel={(value) =>
              dashboardCompositionOptions.find((item) => item.value === value)?.label || value
            }
            onChange={setDashboardCompositionFilter}
          />
          <DashboardFilterSelectCard
            label="Area"
            value={dashboardAreaFilter}
            options={["all", ...((canFilterDashboardByArea && dashboard?.areaOptions) || [])]}
            renderLabel={(value) => (value === "all" ? "Todas as areas e setores" : value)}
            onChange={setDashboardAreaFilter}
          />
          <DashboardFilterSelectCard
            label="Consolidacao"
            value={dashboardTimeGrouping}
            options={dashboardTimeGroupingOptions.map((item) => item.value)}
            renderLabel={(value) =>
              dashboardTimeGroupingOptions.find((item) => item.value === value)?.label || value
            }
            onChange={setDashboardTimeGrouping}
          />
        </div>
        <div className="dashboard-focus-strip">
          {focusPills.map((item) => (
            <div className={`dashboard-focus-pill ${item.tone}`} key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="card card-span dashboard-executive-brief-card">
        <DashboardCardHeader
          eyebrow="Resumo"
          title="Leitura executiva do recorte"
          subtitle="Sintese orientada a decisao"
          tone="primary"
        />
        <div className="executive-brief-grid">
          {executiveHighlights.map((item) => (
            <article className="list-card executive-brief-card" key={item.title}>
              <p className="mini-label">{item.title}</p>
              <strong>{item.value}</strong>
              <p className="muted">{item.detail}</p>
            </article>
          ))}
        </div>
      </div>

      {storyCards.length ? (
        <div className="card card-span dashboard-story-card">
          <DashboardCardHeader
            eyebrow="Panorama"
            title="Panorama por tema"
            subtitle="Governanca, avaliacoes, desenvolvimento e risco"
            tone="secondary"
          />
          <div className="dashboard-story-grid">
            {storyCards.map((item) => (
              <article className={`list-card dashboard-story-tile ${item.tone}`} key={item.title}>
                <div className="dashboard-story-head">
                  <span className="dashboard-story-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <div>
                    <p className="mini-label">{item.title}</p>
                    <strong>{item.value}</strong>
                  </div>
                </div>
                <p className="muted">{item.detail}</p>
                <div className="dashboard-story-foot">
                  <span>{item.highlightLabel}</span>
                  <strong>{item.highlightValue}</strong>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <div className="card-span dashboard-section-band summary">
        <div className="dashboard-section-band-copy">
          <span>Resumo</span>
          <strong>
            {isExecutiveView ? "Indicadores executivos do recorte" : "Indicadores analiticos do recorte"}
          </strong>
        </div>
        <p>
          {isExecutiveView
            ? "KPIs consolidados para leitura rapida de performance, exposicao e cobertura."
            : "Visao de base para aprofundar volume, distribuicao e variacoes do ciclo."}
        </p>
      </div>

      <div className="card card-span">
        <DashboardCardHeader
          eyebrow="Kpis"
          title={
            dashboard?.mode === "executive"
              ? "Indicadores executivos"
              : dashboard?.mode === "team"
                ? "Indicadores gerenciais"
                : "Indicadores pessoais"
          }
          subtitle={
            isExecutiveView
              ? "Leitura sintetica priorizada"
              : dashboard?.mode === "executive"
                ? "Uso em reunioes e apresentacoes"
                : dashboard?.mode === "team"
                  ? "Leitura da sua equipe direta"
                  : "Leitura individual do semestre"
          }
          tone="neutral"
        />
        <div className="metrics-grid">
          {dashboard?.cards?.map((item) => (
            <div className="mini-card highlight-card" key={item.label}>
              <p className="mini-label">{item.label}</p>
              <strong>{item.value}</strong>
              <p className="muted">{item.trend}</p>
            </div>
          ))}
        </div>
      </div>

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
                <DashboardCardHeader
                  eyebrow="Cobertura"
                  title="Panorama de cobertura"
                  subtitle="Vista rapida do ciclo"
                  tone="primary"
                />
                <div className="donut-grid">
                  {(dashboard?.donutMetrics || []).filter(Boolean).map((item) => (
                    <SafeDashboardDonut key={item.key || item.label} item={item} />
                  ))}
                </div>
              </div>
            ) : null}

            {cycleTimelineItems.length ? (
              <div className="card dashboard-visual-card dashboard-board-featured">
                <DashboardCardHeader
                  eyebrow="Pulso"
                  title="Pulso do ciclo"
                  subtitle={`Adesao por ${dashboardTimeGroupingLabel.toLowerCase()}`}
                  tone="success"
                />
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
              <div className="card dashboard-visual-card">
                <DashboardCardHeader
                  eyebrow="Ritmo"
                  title="Ritmo de distribuicao"
                  subtitle="Volume no tempo"
                  tone="warning"
                />
                <SafeTrendAreaChartCard
                  items={cycleTimelineItems}
                  valueKey="totalAssignments"
                  labelKey="label"
                  formatter={(value) => String(value)}
                  detailFormatter={(item) => `${item.totalResponses} respostas`}
                />
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div className="card dashboard-visual-card dashboard-board-featured dashboard-analytical-primary">
              <DashboardCardHeader
                eyebrow="Analise"
                title="Resultado por modalidade"
                subtitle={
                  selectedDashboardCompositionMeta
                    ? `Visao macro e detalhamento de ${selectedDashboardCompositionMeta.label}`
                    : "Visao consolidada e drilldown por modalidade"
                }
                tone="secondary"
              />
              <div className="stack-list">
                {analyticalRelationshipItems.length ? (
                  <div className="list-card">
                    <div className="row">
                      <strong>Resumo macro por modalidade</strong>
                      <span className="badge">
                        {analyticalRelationshipItems.length} modalidades
                      </span>
                    </div>
                    <div className="dashboard-mode-summary-grid">
                      {analyticalRelationshipItems.map(({ relationshipType, summary }) => {
                        const item = summary || {
                          relationshipType,
                          averageScoreLabel: "-",
                          totalResponses: 0,
                          adherencePercentage: 0,
                          tone: "neutral"
                        };
                        return (
                        <article
                          className={`dashboard-mode-summary-card ${item.tone}`}
                          key={relationshipType}
                        >
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
                      {analyticalRelationshipItems.map(({ relationshipType, summary }) => {
                        const item = summary || {
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
                  <div className="list-card" key={selectedAnalyticalRelationship.relationshipType}>
                    {(() => {
                        const { relationshipType, distribution, summary } = selectedAnalyticalRelationship;
                        const dimensionSummary = buildDimensionSummary(distribution?.questions || []);
                        const selectedDimension = dimensionFilters[relationshipType] || "all";
                        const filteredQuestions =
                          selectedDimension === "all"
                            ? distribution?.questions || []
                            : (distribution?.questions || []).filter(
                                (question) => question.dimensionTitle === selectedDimension
                              );

                        return (
                          <>
                            <div className="row">
                              <label className="dashboard-card-filter-card dashboard-relationship-filter-card">
                                <span>Avaliacao</span>
                                <select
                                  value={selectedAnalyticalRelationshipType}
                                  onChange={(event) =>
                                    setDashboardCompositionFilter(event.target.value)
                                  }
                                >
                                  {visibleRelationshipTypes.map((type) => (
                                    <option key={type} value={type}>
                                      {getRelationshipLabel(type)}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <span className="badge">
                                {summary?.totalResponses || distribution?.totalResponses || 0} respostas
                              </span>
                            </div>
                            {dimensionSummary.length ? (
                              <div className="dashboard-dimension-summary-block">
                                <div className="dashboard-dimension-summary-head">
                                  <strong>Leitura por dimensão</strong>
                                  <label className="dashboard-card-filter-card dashboard-dimension-filter-card">
                                    <span>Dimensão</span>
                                    <select
                                      value={selectedDimension}
                                      onChange={(event) =>
                                        setDimensionFilterForGroup(
                                          relationshipType,
                                          event.target.value
                                        )
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
                            {filteredQuestions.length ? (
                              <div className="response-chart-grid">
                                {filteredQuestions.map((question) => (
                                  <SafeResponseDistributionChartCard
                                    key={question.questionId}
                                    question={question}
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="dashboard-empty-relationship-state">
                                <strong>Sem detalhe analitico disponivel</strong>
                                <p className="muted">
                                  {summary?.totalResponses
                                    ? "Esta modalidade ainda nao tem granularidade suficiente para abrir o nivel pergunta por pergunta."
                                    : "Ainda nao existem respostas registradas para esta modalidade neste recorte."}
                                </p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                  </div>
                ) : (
                  <div className="list-card">
                    <strong>Sem respostas para o filtro aplicado</strong>
                    <p className="muted">
                      Ajuste o elemento da composicao do ciclo ou o recorte de area/setor para
                      visualizar dados consolidados.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {funnelItems.length ? (
              <div className="card">
                <DashboardCardHeader
                  eyebrow="Fluxo"
                  title="Funil do recorte"
                  subtitle="Cobertura do fluxo"
                  tone="neutral"
                />
                <SafeFunnelSeriesChart
                  items={funnelItems}
                  emptyMessage="Sem dados para compor o funil neste recorte."
                />
              </div>
            ) : null}

            {cycleTimelineItems.length ? (
              <div
                className={`card dashboard-visual-card ${
                  funnelItems.length ? "" : "dashboard-board-featured"
                }`}
              >
                <DashboardCardHeader
                  eyebrow="Volume"
                  title={`Volume por ${dashboardTimeGroupingLabel.toLowerCase()}`}
                  subtitle="Evolucao temporal"
                  tone="primary"
                />
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

      <div
        className={`card-span dashboard-insight-grid ${
          isExecutiveView ? "dashboard-insight-grid-executive" : "dashboard-insight-grid-analytical"
        }`}
      >
        {assignmentStatusItems.length ? (
          <div className={`card dashboard-side-card ${isExecutiveView ? "dashboard-card-tall" : ""}`}>
            <DashboardCardHeader
              eyebrow="Operacao"
              title="Status dos assignments"
              subtitle="Fluxo atual"
              tone="warning"
            />
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

        {satisfactionByAreaItems.length ? (
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

        {isExecutiveView && executiveComparisons.length ? (
          <div className="card dashboard-side-card">
            <DashboardCardHeader
              eyebrow="Comparativo"
              title="Comparativos do periodo"
              subtitle="Variacoes relevantes"
              tone="accent"
            />
            <div className="executive-comparison-grid">
              {executiveComparisons.map((item) => (
                <article
                  className={`list-card executive-comparison-card ${item.tone}`}
                  key={item.title}
                >
                  <p className="mini-label">{item.title}</p>
                  <strong>{item.value}</strong>
                  <p className="muted">{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {developmentByTypeItems.length ? (
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

        {cycleTimelineItems.length ? (
          <div className="card dashboard-side-card">
            <DashboardCardHeader
              eyebrow="Adesao"
              title={`Adesao por ${dashboardTimeGroupingLabel.toLowerCase()}`}
              subtitle="Concluidas vs distribuidas"
              tone="primary"
            />
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

        {isExecutiveView ? null : evaluationMixItems.length ? (
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
    </section>
  );
}

function buildDimensionSummary(questions) {
  return Object.values(
    (questions || []).reduce((acc, question) => {
      const averageScore =
        (question.options || []).reduce(
          (sum, option) => sum + Number(option.value || 0) * (Number(option.percentage || 0) / 100),
          0
        ) || 0;
      const entry = acc[question.dimensionTitle] || {
        dimensionTitle: question.dimensionTitle || "Sem dimensão",
        scores: [],
        questionCount: 0
      };
      entry.scores.push(averageScore);
      entry.questionCount += 1;
      acc[question.dimensionTitle] = entry;
      return acc;
    }, {})
  )
    .map((entry) => {
      const averageScore = entry.scores.length
        ? Number((entry.scores.reduce((sum, value) => sum + value, 0) / entry.scores.length).toFixed(2))
        : null;
      return {
        dimensionTitle: entry.dimensionTitle,
        questionCount: entry.questionCount,
        averageScore,
        averageScoreLabel: averageScore === null ? "-" : averageScore.toFixed(1),
        tone:
          averageScore === null
            ? "neutral"
            : averageScore >= 4.3
              ? "positive"
              : averageScore >= 3.7
                ? "warning"
                : "critical"
      };
    })
    .sort((left, right) => {
      const leftScore = left.averageScore === null ? -1 : left.averageScore;
      const rightScore = right.averageScore === null ? -1 : right.averageScore;
      return rightScore - leftScore || left.dimensionTitle.localeCompare(right.dimensionTitle, "pt-BR");
    });
}

function buildExecutiveHighlights({
  dashboard,
  dashboardAreaFilter,
  dashboardTimeGroupingLabel,
  selectedDashboardCompositionMeta
}) {
  const areaLabel = dashboardAreaFilter === "all" ? "Todas as areas e setores" : dashboardAreaFilter;
  const compositionLabel = selectedDashboardCompositionMeta?.label || "Todos os elementos do ciclo";
  const latestPeriod = dashboard?.cycleTimeline?.[0];
  const previousPeriod = dashboard?.cycleTimeline?.[1];
  const pendingAssignments = dashboard?.assignmentStatus?.find((item) => item.status === "pending");
  const lowestArea = [...(dashboard?.satisfactionByArea || [])].sort(
    (left, right) => Number(left.score) - Number(right.score)
  )[0];

  const highlights = [
    {
      title: "Recorte em foco",
      value: compositionLabel,
      detail: `${areaLabel} · Consolidado por ${dashboardTimeGroupingLabel.toLowerCase()}`
    }
  ];

  if (latestPeriod && previousPeriod) {
    const delta = Number(
      (latestPeriod.adherencePercentage - previousPeriod.adherencePercentage).toFixed(1)
    );

    highlights.push({
      title: "Evolucao temporal",
      value: `${delta > 0 ? "+" : ""}${delta} p.p.`,
      detail: `${latestPeriod.label} vs ${previousPeriod.label} em adesao ao ciclo`
    });
  } else if (latestPeriod) {
    highlights.push({
      title: "Periodo mais recente",
      value: `${latestPeriod.adherencePercentage}%`,
      detail: `${latestPeriod.label} · ${latestPeriod.totalAssignments} assignments distribuidos`
    });
  }

  if (pendingAssignments) {
    highlights.push({
      title: "Ponto de atencao",
      value: `${pendingAssignments.percentage}%`,
      detail: `${pendingAssignments.total} assignments pendentes no recorte atual`
    });
  }

  if (lowestArea) {
    highlights.push({
      title: "Area com menor satisfacao",
      value: lowestArea.area,
      detail: `${lowestArea.score} de media com ${lowestArea.peopleCount} pessoas no recorte`
    });
  }

  return highlights;
}

function buildExecutiveComparisons({ dashboard, dashboardTimeGroupingLabel }) {
  const latestPeriod = dashboard?.cycleTimeline?.[0];
  const previousPeriod = dashboard?.cycleTimeline?.[1];
  const satisfactionByArea = dashboard?.satisfactionByArea || [];
  const pendingAssignments = dashboard?.assignmentStatus?.find((item) => item.status === "pending");
  const submittedAssignments = dashboard?.assignmentStatus?.find((item) => item.status === "submitted");

  const comparisons = [];

  if (latestPeriod && previousPeriod) {
    const adherenceDelta = Number(
      (latestPeriod.adherencePercentage - previousPeriod.adherencePercentage).toFixed(1)
    );
    const volumeDelta = latestPeriod.totalAssignments - previousPeriod.totalAssignments;

    comparisons.push({
      title: "Adesao vs periodo anterior",
      value: `${adherenceDelta > 0 ? "+" : ""}${adherenceDelta} p.p.`,
      detail: `${latestPeriod.label} comparado a ${previousPeriod.label} em conclusao de assignments`,
      tone: adherenceDelta > 0 ? "positive" : adherenceDelta < 0 ? "warning" : "neutral"
    });

    comparisons.push({
      title: `Carga por ${dashboardTimeGroupingLabel.toLowerCase()}`,
      value: `${volumeDelta > 0 ? "+" : ""}${volumeDelta}`,
      detail: `${latestPeriod.totalAssignments} distribuidos em ${latestPeriod.label}`,
      tone: volumeDelta > 0 ? "neutral" : volumeDelta < 0 ? "positive" : "neutral"
    });
  }

  if (satisfactionByArea.length) {
    const orderedAreas = [...satisfactionByArea].sort(
      (left, right) => Number(left.score) - Number(right.score)
    );
    const criticalArea = orderedAreas[0];
    const strongestArea = orderedAreas[orderedAreas.length - 1];

    comparisons.push({
      title: "Area critica",
      value: criticalArea.area,
      detail: `${criticalArea.score} de media no menor recorte de satisfacao`,
      tone: "warning"
    });

    if (strongestArea && strongestArea.area !== criticalArea.area) {
      comparisons.push({
        title: "Melhor leitura do recorte",
        value: strongestArea.area,
        detail: `${strongestArea.score} de media no melhor desempenho agregado`,
        tone: "positive"
      });
    }
  }

  if (pendingAssignments && submittedAssignments) {
    comparisons.push({
      title: "Ritmo operacional",
      value: `${submittedAssignments.total}/${pendingAssignments.total + submittedAssignments.total}`,
      detail: `${pendingAssignments.total} pendentes ainda exigem acompanhamento`,
      tone: pendingAssignments.total > submittedAssignments.total ? "warning" : "neutral"
    });
  }

  return comparisons.slice(0, 4);
}

function buildDashboardStoryCards({ dashboard, summary, dashboardAreaFilter, dashboardTimeGroupingLabel }) {
  const pendingAssignments =
    dashboard?.scopeSummary?.pendingAssignments ?? summary?.pendingAssignments ?? 0;
  const activeCycles = summary?.activeEvaluationCycles ?? 0;
  const openIncidents = summary?.openIncidents ?? 0;
  const peopleCount = dashboard?.scopeSummary?.peopleCount ?? summary?.peopleCount ?? 0;
  const topDevelopment = [...(dashboard?.developmentByType || [])].sort(
    (left, right) => Number(right.total || 0) - Number(left.total || 0)
  )[0];
  const topStatus = [...(dashboard?.assignmentStatus || [])].sort(
    (left, right) => Number(right.total || 0) - Number(left.total || 0)
  )[0];
  const bestArea = [...(dashboard?.satisfactionByArea || [])].sort(
    (left, right) => Number(right.score || 0) - Number(left.score || 0)
  )[0];

  return [
    {
      title: "Governanca",
      value: `${activeCycles} ciclos ativos`,
      detail: `Leitura consolidada por ${dashboardTimeGroupingLabel.toLowerCase()} para ${dashboardAreaFilter === "all" ? "toda a operacao" : dashboardAreaFilter}.`,
      highlightLabel: "Pessoas no recorte",
      highlightValue: peopleCount,
      tone: "neutral",
      icon: "GV"
    },
    {
      title: "Avaliacoes",
      value: `${pendingAssignments} pendentes`,
      detail: topStatus
        ? `${topStatus.total} assignments em ${topStatus.status}.`
        : "Sem distribuicao de assignments no recorte atual.",
      highlightLabel: "Status dominante",
      highlightValue: topStatus ? topStatus.status : "-",
      tone: "positive",
      icon: "AV"
    },
    {
      title: "Desenvolvimento",
      value: topDevelopment ? `${topDevelopment.total} registros` : "Sem registros",
      detail: topDevelopment
        ? `Trilha mais frequente: ${topDevelopment.type}.`
        : "Nao ha movimentacao de desenvolvimento no recorte.",
      highlightLabel: "Trilha principal",
      highlightValue: topDevelopment ? topDevelopment.type : "-",
      tone: "neutral",
      icon: "DV"
    },
    {
      title: "Risco",
      value: `${openIncidents} incidentes`,
      detail: bestArea
        ? `Melhor satisfacao atual em ${bestArea.area}.`
        : "Sem leitura de satisfacao por area neste recorte.",
      highlightLabel: "Melhor area",
      highlightValue: bestArea ? `${bestArea.area} · ${bestArea.score}` : "-",
      tone: openIncidents > 0 ? "warning" : "positive",
      icon: "RK"
    }
  ];
}

function getFilteredSatisfactionItems(items, mode) {
  const safeItems = [...(items || [])];
  if (mode === "top") {
    return safeItems
      .sort((left, right) => Number(right.score || 0) - Number(left.score || 0))
      .slice(0, 4);
  }
  if (mode === "critical") {
    return safeItems
      .sort((left, right) => Number(left.score || 0) - Number(right.score || 0))
      .slice(0, 4);
  }
  return safeItems;
}

function getFilteredDevelopmentItems(items, mode) {
  const safeItems = [...(items || [])];
  if (mode === "top") {
    return safeItems
      .sort((left, right) => Number(right.total || 0) - Number(left.total || 0))
      .slice(0, 4);
  }
  if (mode === "alpha") {
    return safeItems.sort((left, right) => String(left.type || "").localeCompare(String(right.type || "")));
  }
  return safeItems;
}
