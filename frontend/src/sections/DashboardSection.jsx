import { useState } from "react";
import {
  buildDashboardPriorityActions,
  buildDashboardStoryCards,
  buildDimensionSummary,
  buildExecutiveComparisons,
  buildExecutiveHighlights,
  formatSatisfactionScore,
  getFilteredDevelopmentItems,
  getFilteredSatisfactionItems,
  getSatisfactionQuestionAreaOptions,
  getSatisfactionQuestionAreaView
} from "./dashboard/dashboardData.js";
import {
  DashboardInsightPanels,
  DashboardOperationsPanels,
  DashboardTopPanels
} from "./dashboard/DashboardPanels.jsx";

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
      <DashboardTopPanels
        DashboardCardHeader={DashboardCardHeader}
        DashboardFilterSelectCard={DashboardFilterSelectCard}
        analyticalThemes={analyticalThemes}
        canFilterDashboardByArea={canFilterDashboardByArea}
        dashboard={dashboard}
        dashboardAnalyticalTheme={dashboardAnalyticalTheme}
        dashboardAreaFilter={dashboardAreaFilter}
        dashboardCompositionFilter={dashboardCompositionFilter}
        dashboardCompositionOptions={dashboardCompositionOptions}
        dashboardHeadline={dashboardHeadline}
        dashboardTimeGrouping={dashboardTimeGrouping}
        dashboardTimeGroupingOptions={dashboardTimeGroupingOptions}
        executiveHighlights={executiveHighlights}
        focusPills={focusPills}
        isExecutiveView={isExecutiveView}
        onSectionChange={onSectionChange}
        profileName={profileName}
        priorityActions={priorityActions}
        quickActions={quickActions}
        setDashboardAnalyticalTheme={setDashboardAnalyticalTheme}
        setDashboardAreaFilter={setDashboardAreaFilter}
        setDashboardCompositionFilter={setDashboardCompositionFilter}
        setDashboardTimeGrouping={setDashboardTimeGrouping}
        setDashboardViewMode={setDashboardViewMode}
        storyCards={storyCards}
        topKpis={topKpis}
      />

      <DashboardOperationsPanels
        DashboardCardHeader={DashboardCardHeader}
        SafeBarMetricRow={SafeBarMetricRow}
        SafeDashboardDonut={SafeDashboardDonut}
        SafeFunnelSeriesChart={SafeFunnelSeriesChart}
        SafeHeatmapMatrixCard={SafeHeatmapMatrixCard}
        SafeResponseDistributionChartCard={SafeResponseDistributionChartCard}
        SafeTrendAreaChartCard={SafeTrendAreaChartCard}
        analyticalRelationshipItems={analyticalRelationshipItems}
        applauseCoverageMetric={applauseCoverageMetric}
        cycleTimelineItems={cycleTimelineItems}
        dashboard={dashboard}
        dashboardAnalyticalTheme={dashboardAnalyticalTheme}
        dashboardTimeGroupingLabel={dashboardTimeGroupingLabel}
        developmentByTypeItems={developmentByTypeItems}
        developmentCoverageMetric={developmentCoverageMetric}
        dimensionFilters={dimensionFilters}
        evaluationMixItems={evaluationMixItems}
        filteredDevelopmentByTypeItems={filteredDevelopmentByTypeItems}
        funnelItems={funnelItems}
        getRelationshipLabel={getRelationshipLabel}
        isExecutiveView={isExecutiveView}
        isSatisfactionAnalyticsSelected={isSatisfactionAnalyticsSelected}
        onSectionChange={onSectionChange}
        performanceAreaHighlights={performanceAreaHighlights}
        performanceAreaSeries={performanceAreaSeries}
        performanceDistributionItems={performanceDistributionItems}
        performanceHealth={performanceHealth}
        performanceRecommendations={performanceRecommendations}
        resolvedSatisfactionQuestionAreaFilter={resolvedSatisfactionQuestionAreaFilter}
        rhythmInsightDetail={rhythmInsightDetail}
        rhythmInsightTitle={rhythmInsightTitle}
        rhythmMiniMetrics={rhythmMiniMetrics}
        satisfactionQuestionAreaOptions={satisfactionQuestionAreaOptions}
        satisfactionQuestionTrendItems={satisfactionQuestionTrendItems}
        selectedAnalyticalRelationship={selectedAnalyticalRelationship}
        selectedDashboardCompositionMeta={selectedDashboardCompositionMeta}
        setDashboardCompositionFilter={setDashboardCompositionFilter}
        setDimensionFilterForGroup={setDimensionFilterForGroup}
        setSatisfactionQuestionAreaFilter={setSatisfactionQuestionAreaFilter}
        summary={summary}
        visibleRelationshipTypes={visibleRelationshipTypes}
      />

      <DashboardInsightPanels
        DashboardCardHeader={DashboardCardHeader}
        SafeBarMetricRow={SafeBarMetricRow}
        SafeColumnMetricCard={SafeColumnMetricCard}
        SafeHeatmapMatrixCard={SafeHeatmapMatrixCard}
        assignmentStatusItems={assignmentStatusItems}
        cycleTimelineItems={cycleTimelineItems}
        dashboardAnalyticalTheme={dashboardAnalyticalTheme}
        dashboardTimeGroupingLabel={dashboardTimeGroupingLabel}
        developmentByTypeItems={developmentByTypeItems}
        developmentView={developmentView}
        evaluationMixItems={evaluationMixItems}
        executiveComparisons={executiveComparisons}
        filteredDevelopmentByTypeItems={filteredDevelopmentByTypeItems}
        filteredSatisfactionByAreaItems={filteredSatisfactionByAreaItems}
        getAssignmentStatusLabel={getAssignmentStatusLabel}
        getRelationshipLabel={getRelationshipLabel}
        isExecutiveView={isExecutiveView}
        performanceAreaSeries={performanceAreaSeries}
        performanceRecommendations={performanceRecommendations}
        satisfactionByAreaItems={satisfactionByAreaItems}
        satisfactionView={satisfactionView}
        selectedDashboardCompositionMeta={selectedDashboardCompositionMeta}
        setDevelopmentView={setDevelopmentView}
        setSatisfactionView={setSatisfactionView}
      />
    </section>
  );
}
