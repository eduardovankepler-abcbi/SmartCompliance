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
  const [dashboardAnalyticalTheme, setDashboardAnalyticalTheme] = useState("evaluations");
  const [satisfactionView, setSatisfactionView] = useState("all");
  const [satisfactionQuestionAreaFilter, setSatisfactionQuestionAreaFilter] = useState("all");
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
  const latestCyclePeriod = cycleTimelineItems[0] || null;
  const pendingAssignmentsItem =
    assignmentStatusItems.find((item) => item.status === "pending") || null;
  const submittedAssignmentsItem =
    assignmentStatusItems.find((item) => item.status === "submitted") || null;
  const satisfactionByAreaItems = dashboard?.satisfactionByArea || [];
  const developmentByTypeItems = dashboard?.developmentByType || [];
  const evaluationMixItems = filteredDashboardEvaluationMix || [];
  const evaluationResultsSummaryItems = filteredDashboardEvaluationResultsSummary || [];
  const funnelItems = dashboard?.funnelMetrics || [];
  const donutMetrics = dashboard?.donutMetrics || [];
  const developmentCoverageMetric = donutMetrics.find((item) => item.key === "development");
  const applauseCoverageMetric = donutMetrics.find((item) => item.key === "applause");
  const performanceHealth = dashboard?.performanceHealth || null;
  const performanceDistributionItems = performanceHealth?.distribution || [];
  const performanceAreaHighlights = performanceHealth?.areaHighlights || [];
  const performanceAreaSeries = performanceHealth?.areaSeries || [];
  const performanceRecommendations = performanceHealth?.recommendations || [];
  const satisfactionQuestionAnalyticsItems = dashboard?.satisfactionQuestionAnalytics || [];
  const satisfactionQuestionAreaOptions = getSatisfactionQuestionAreaOptions(
    satisfactionQuestionAnalyticsItems
  );
  const resolvedSatisfactionQuestionAreaFilter = satisfactionQuestionAreaOptions.includes(
    satisfactionQuestionAreaFilter
  )
    ? satisfactionQuestionAreaFilter
    : "all";
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
  const isSatisfactionAnalyticsSelected = selectedAnalyticalRelationshipType === "company";
  const satisfactionQuestionTrendItems = satisfactionQuestionAnalyticsItems
    .map((question) =>
      getSatisfactionQuestionAreaView(question, resolvedSatisfactionQuestionAreaFilter)
    )
    .filter((question) => question.totalAnswers > 0);
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
  const laggingEvaluationSummary = [...evaluationResultsSummaryItems]
    .filter((item) => (item.totalAssignments || 0) > 0 || (item.totalResponses || 0) > 0)
    .sort((left, right) => {
      const leftAdherence = Number(left.adherencePercentage || 0);
      const rightAdherence = Number(right.adherencePercentage || 0);
      if (leftAdherence !== rightAdherence) {
        return leftAdherence - rightAdherence;
      }
      return Number(left.averageScore || 0) - Number(right.averageScore || 0);
    })[0];
  const rhythmInsightTitle = laggingEvaluationSummary
    ? `Gargalo em ${getRelationshipLabel(laggingEvaluationSummary.relationshipType)}`
    : "Fluxo sem gargalo dominante";
  const rhythmInsightDetail = laggingEvaluationSummary
    ? `${laggingEvaluationSummary.adherencePercentage}% de adesao com ${laggingEvaluationSummary.totalResponses}/${laggingEvaluationSummary.totalAssignments || laggingEvaluationSummary.totalResponses} respostas no recorte.`
    : "Os indicadores do ciclo estao equilibrados dentro do recorte atual.";
  const rhythmMiniMetrics = [
    {
      label: "Distribuidos",
      value: latestCyclePeriod ? latestCyclePeriod.totalAssignments : 0,
      detail: latestCyclePeriod ? latestCyclePeriod.label : "recorte"
    },
    {
      label: "Respondidos",
      value: latestCyclePeriod ? latestCyclePeriod.totalResponses : 0,
      detail: submittedAssignmentsItem ? `${submittedAssignmentsItem.percentage}% do total` : "sem retorno"
    },
    {
      label: "Pendentes",
      value: latestCyclePeriod ? latestCyclePeriod.pendingAssignments : pendingAssignmentsItem?.total || 0,
      detail: pendingAssignmentsItem ? `${pendingAssignmentsItem.percentage}% do total` : "sem fila"
    },
    {
      label: "Conversao",
      value: `${latestCyclePeriod ? latestCyclePeriod.adherencePercentage : 0}%`,
      detail: `adesao em ${latestCyclePeriod?.label || "andamento"}`
    }
  ];
  const topKpis = [
    {
      label: "Saude 360",
      value: performanceHealth ? `${performanceHealth.averageScoreLabel}/10` : "-",
      detail: performanceHealth?.confidenceLabel || "sem leitura agregada",
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
  const priorityActions = buildDashboardPriorityActions({
    dashboard,
    summary,
    dashboardAreaFilter,
    dashboardTimeGroupingLabel,
    laggingEvaluationSummary,
    pendingAssignmentsItem,
    satisfactionByAreaItems,
    developmentByTypeItems,
    getRelationshipLabel
  });
  const analyticalThemes = [
    {
      key: "evaluations",
      label: "Avaliacoes",
      detail: `${evaluationResultsSummaryItems.length} modalidades`
    },
    {
      key: "performance",
      label: "Desempenho 360",
      detail: performanceHealth ? `${performanceHealth.averageScoreLabel}/10` : "sem leitura"
    },
    {
      key: "compliance",
      label: "Compliance",
      detail: `${summary?.openIncidents ?? 0} incidentes abertos`
    },
    {
      key: "development",
      label: "Desenvolvimento",
      detail: `${dashboard?.scopeSummary?.developmentRecords ?? 0} registros`
    },
    {
      key: "applause",
      label: "Aplause",
      detail: `${dashboard?.scopeSummary?.applauseEntries ?? 0} reconhecimentos`
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

      {isExecutiveView ? (
        <div className="card card-span dashboard-decision-card">
          <DashboardCardHeader
            eyebrow="Decisao"
            title="Central de prioridades"
            subtitle="O que merece atencao agora"
            tone="primary"
          />
          <div className="dashboard-decision-layout">
            <div className="dashboard-decision-kpis">
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
            <div className="dashboard-priority-queue">
              {priorityActions.map((item) => (
                <article className={`dashboard-priority-card ${item.tone}`} key={item.title}>
                  <div>
                    <p className="mini-label">{item.label}</p>
                    <strong>{item.title}</strong>
                  </div>
                  <p className="muted">{item.detail}</p>
                  <span>{item.action}</span>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {!isExecutiveView ? (
        <div className="card-span dashboard-analytical-nav">
          {analyticalThemes.map((theme) => (
            <button
              key={theme.key}
              type="button"
              className={
                dashboardAnalyticalTheme === theme.key
                  ? "button-reset dashboard-analytical-tab active"
                  : "button-reset dashboard-analytical-tab"
              }
              onClick={() => setDashboardAnalyticalTheme(theme.key)}
            >
              <strong>{theme.label}</strong>
              <span>{theme.detail}</span>
            </button>
          ))}
        </div>
      ) : null}

      {!isExecutiveView ? (
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
      ) : null}

      {!isExecutiveView && storyCards.length ? (
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

      {!isExecutiveView ? (
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
      ) : null}

      {!isExecutiveView ? (
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
      ) : null}

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
              <div className="card dashboard-visual-card dashboard-board-tall">
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
                            {isSatisfactionAnalyticsSelected ? (
                              <div className="dashboard-satisfaction-analytics-panel">
                                <div className="dashboard-dimension-summary-head">
                                  <div>
                                    <strong>Satisfacao por pergunta</strong>
                                    <p className="muted">
                                      Compare a opiniao dos colaboradores por ciclo, semestre,
                                      trimestre ou ano.
                                    </p>
                                  </div>
                                  <label className="dashboard-card-filter-card dashboard-dimension-filter-card">
                                    <span>Area</span>
                                    <select
                                      value={resolvedSatisfactionQuestionAreaFilter}
                                      onChange={(event) =>
                                        setSatisfactionQuestionAreaFilter(event.target.value)
                                      }
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
                                      Ajuste o filtro de area ou aguarde novas respostas da
                                      avaliacao de satisfacao.
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
                            {!isSatisfactionAnalyticsSelected && filteredQuestions.length ? (
                              <div className="response-chart-grid">
                                {filteredQuestions.map((question) => (
                                  <SafeResponseDistributionChartCard
                                    key={question.questionId}
                                    question={question}
                                  />
                                ))}
                              </div>
                            ) : !isSatisfactionAnalyticsSelected ? (
                              <div className="dashboard-empty-relationship-state">
                                <strong>Sem detalhe analitico disponivel</strong>
                                <p className="muted">
                                  {summary?.totalResponses
                                    ? "Esta modalidade ainda nao tem granularidade suficiente para abrir o nivel pergunta por pergunta."
                                    : "Ainda nao existem respostas registradas para esta modalidade neste recorte."}
                                </p>
                              </div>
                            ) : null}
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
            ) : null}

            {dashboardAnalyticalTheme === "performance" ? (
              <div className="card dashboard-visual-card dashboard-board-featured dashboard-analytical-primary dashboard-theme-drilldown-card">
                <DashboardCardHeader
                  eyebrow="Desempenho 360"
                  title="Saude de performance"
                  subtitle="Leitura agregada e privada"
                  tone="primary"
                />
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
                          <article
                            className={`dashboard-theme-metric-card ${item.tone}`}
                            key={item.label}
                          >
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
                            <article
                              className={`dashboard-dimension-summary-card ${item.tone}`}
                              key={item.area}
                            >
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
                            <article
                              className={`dashboard-performance-action-card ${item.tone}`}
                              key={item.key}
                            >
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
                      <button
                        type="button"
                        className="dashboard-quick-action primary"
                        onClick={() => onSectionChange?.("Desenvolvimento")}
                      >
                        <span>Abrir modulo</span>
                        <strong>Ver direcionamentos</strong>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="dashboard-empty-relationship-state">
                    <strong>Sem leitura 360 agregada</strong>
                    <p className="muted">
                      Quando houver respostas suficientes, este painel mostrara apenas sinais
                      agregados de performance e direcionamento.
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            {dashboardAnalyticalTheme === "compliance" ? (
              <div className="card dashboard-visual-card dashboard-board-featured dashboard-analytical-primary dashboard-theme-drilldown-card">
                <DashboardCardHeader
                  eyebrow="Compliance"
                  title="Risco e fila de tratamento"
                  subtitle="Leitura operacional do recorte"
                  tone="warning"
                />
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
                  <p className="muted">
                    Use este drilldown para sair do indicador e tratar a fila real de compliance.
                  </p>
                  <button
                    type="button"
                    className="dashboard-quick-action success"
                    onClick={() => onSectionChange?.("Compliance")}
                  >
                    <span>Abrir modulo</span>
                    <strong>Ver incidentes</strong>
                  </button>
                </div>
              </div>
            ) : null}

            {dashboardAnalyticalTheme === "development" ? (
              <div className="card dashboard-visual-card dashboard-board-featured dashboard-analytical-primary dashboard-theme-drilldown-card">
                <DashboardCardHeader
                  eyebrow="Desenvolvimento"
                  title="Cobertura e trilhas de PDI"
                  subtitle="Evolucao profissional do recorte"
                  tone="success"
                />
                <div className="dashboard-theme-split">
                  {developmentCoverageMetric ? (
                    <SafeDashboardDonut item={developmentCoverageMetric} />
                  ) : null}
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
                <DashboardCardHeader
                  eyebrow="Aplause"
                  title="Reconhecimento e cultura"
                  subtitle="Sinais positivos do recorte"
                  tone="accent"
                />
                <div className="dashboard-theme-split">
                  {applauseCoverageMetric ? (
                    <SafeDashboardDonut item={applauseCoverageMetric} />
                  ) : null}
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
                  <p className="muted">
                    Aprofunde quando quiser entender quais comportamentos estao sendo reforcados.
                  </p>
                  <button
                    type="button"
                    className="dashboard-quick-action accent"
                    onClick={() => onSectionChange?.("Aplause")}
                  >
                    <span>Abrir modulo</span>
                    <strong>Ver reconhecimentos</strong>
                  </button>
                </div>
              </div>
            ) : null}

            {dashboardAnalyticalTheme === "evaluations" && funnelItems.length ? (
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

            {dashboardAnalyticalTheme === "evaluations" && cycleTimelineItems.length ? (
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
        {assignmentStatusItems.length &&
        (isExecutiveView || dashboardAnalyticalTheme === "evaluations") ? (
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

        {satisfactionByAreaItems.length &&
        (isExecutiveView || dashboardAnalyticalTheme === "evaluations") ? (
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
            <DashboardCardHeader
              eyebrow="Desempenho 360"
              title="Desempenho por area"
              subtitle="Leitura macro agregada"
              tone="primary"
            />
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
            <DashboardCardHeader
              eyebrow="Profilaxia"
              title="Ações recomendadas"
              subtitle="Intervenção preventiva"
              tone="warning"
            />
            <div className="dashboard-performance-action-grid">
              {performanceRecommendations.map((item) => (
                <article
                  className={`dashboard-performance-action-card ${item.tone}`}
                  key={`executive-${item.key}`}
                >
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

        {developmentByTypeItems.length &&
        (isExecutiveView || dashboardAnalyticalTheme === "development") ? (
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

        {cycleTimelineItems.length &&
        (isExecutiveView || dashboardAnalyticalTheme === "evaluations") ? (
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

        {isExecutiveView ? null : dashboardAnalyticalTheme === "evaluations" && evaluationMixItems.length ? (
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

function buildDashboardPriorityActions({
  dashboard,
  summary,
  dashboardAreaFilter,
  dashboardTimeGroupingLabel,
  laggingEvaluationSummary,
  pendingAssignmentsItem,
  satisfactionByAreaItems,
  developmentByTypeItems,
  getRelationshipLabel
}) {
  const priorities = [];
  const areaLabel = dashboardAreaFilter === "all" ? "todas as areas" : dashboardAreaFilter;
  const pendingAssignments =
    dashboard?.scopeSummary?.pendingAssignments ??
    summary?.pendingAssignments ??
    pendingAssignmentsItem?.total ??
    0;
  const openIncidents = summary?.openIncidents ?? 0;
  const peopleCount = dashboard?.scopeSummary?.peopleCount ?? summary?.peopleCount ?? 0;
  const developmentRecords = dashboard?.scopeSummary?.developmentRecords ?? 0;
  const lowestArea = [...(satisfactionByAreaItems || [])].sort(
    (left, right) => Number(left.score || 0) - Number(right.score || 0)
  )[0];
  const topDevelopment = [...(developmentByTypeItems || [])].sort(
    (left, right) => Number(right.total || 0) - Number(left.total || 0)
  )[0];

  if (pendingAssignments > 0) {
    priorities.push({
      label: "Ciclo",
      title: `${pendingAssignments} assignments pendentes`,
      detail: `Pendencias ainda abertas no recorte de ${areaLabel}.`,
      action: "Acione a operacao de avaliacoes antes de ampliar analises.",
      tone: "warning"
    });
  }

  if (openIncidents > 0) {
    priorities.push({
      label: "Compliance",
      title: `${openIncidents} incidentes em aberto`,
      detail: "Risco operacional que pode demandar acompanhamento fora do ciclo.",
      action: "Revise a fila de tratamento e responsaveis.",
      tone: "critical"
    });
  }

  if (laggingEvaluationSummary) {
    priorities.push({
      label: "Avaliacao",
      title: `Gargalo em ${getRelationshipLabel(laggingEvaluationSummary.relationshipType)}`,
      detail: `${laggingEvaluationSummary.adherencePercentage}% de adesao em ${dashboardTimeGroupingLabel.toLowerCase()}.`,
      action: "Priorize comunicacao e acompanhamento neste submodulo.",
      tone: "warning"
    });
  }

  if (lowestArea) {
    priorities.push({
      label: "Satisfacao",
      title: `${lowestArea.area} pede leitura de contexto`,
      detail: `${lowestArea.score} de media agregada com ${lowestArea.peopleCount} pessoa(s).`,
      action: "Use a analitica para separar sinal consistente de amostra pequena.",
      tone: Number(lowestArea.score || 0) < 4 ? "critical" : "neutral"
    });
  }

  if (peopleCount && developmentRecords < peopleCount) {
    priorities.push({
      label: "Desenvolvimento",
      title: "Cobertura de desenvolvimento incompleta",
      detail: `${developmentRecords}/${peopleCount} pessoas com historico registrado no recorte.`,
      action: topDevelopment
        ? `Trilha mais frequente: ${topDevelopment.type}.`
        : "Estimule registros de PDI e marcos recentes.",
      tone: "neutral"
    });
  }

  if (!priorities.length) {
    priorities.push({
      label: "Operacao",
      title: "Sem urgencia dominante",
      detail: "O recorte atual nao apresenta gargalo claro nos indicadores principais.",
      action: "Use a leitura analitica apenas para refinamento e acompanhamento.",
      tone: "positive"
    });
  }

  return priorities.slice(0, 4);
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

function getSatisfactionQuestionAreaOptions(items) {
  const areas = new Set();
  (items || []).forEach((question) => {
    (question.areas || []).forEach((area) => {
      if (area.area) {
        areas.add(area.area);
      }
    });
  });

  return ["all", ...[...areas].sort((left, right) => left.localeCompare(right, "pt-BR"))];
}

function getSatisfactionQuestionAreaView(question, areaFilter) {
  if (areaFilter === "all") {
    return {
      ...question,
      latestScoreLabel: question.latestScoreLabel || question.averageScoreLabel || "-",
      periods: question.periods || [],
      trendDelta: question.trendDelta ?? null
    };
  }

  const area = (question.areas || []).find((item) => item.area === areaFilter);
  if (!area) {
    return {
      ...question,
      totalAnswers: 0,
      averageScore: 0,
      averageScoreLabel: "-",
      latestScoreLabel: "-",
      periods: [],
      trendDelta: null
    };
  }

  const latestPeriod = area.periods?.[area.periods.length - 1] || null;
  const previousPeriod = area.periods?.[area.periods.length - 2] || null;

  return {
    ...question,
    totalAnswers: area.totalAnswers,
    averageScore: area.averageScore,
    averageScoreLabel: area.averageScoreLabel,
    latestScoreLabel: latestPeriod?.averageScoreLabel || area.averageScoreLabel,
    periods: area.periods || [],
    trendDelta:
      latestPeriod && previousPeriod
        ? Number((latestPeriod.averageScore - previousPeriod.averageScore).toFixed(1))
        : null
  };
}

function formatSatisfactionScore(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(1) : "-";
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
