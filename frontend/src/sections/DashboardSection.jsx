import { useState } from "react";

const EmptyComponent = () => null;

export function DashboardSection({
  BarMetricRow,
  ColumnMetricCard,
  DashboardDonut,
  FunnelSeriesChart,
  HeatmapMatrixCard,
  MetricCard,
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
  filteredDashboardEvaluationMix,
  filteredDashboardResponseDistributions,
  getAssignmentStatusLabel,
  getRelationshipDescription,
  getRelationshipLabel,
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
  const SafeMetricCard = MetricCard || EmptyComponent;
  const SafeResponseDistributionChartCard = ResponseDistributionChartCard || EmptyComponent;
  const SafeSelect = Select || EmptyComponent;
  const SafeTrendAreaChartCard = TrendAreaChartCard || EmptyComponent;
  const [dashboardViewMode, setDashboardViewMode] = useState("executive");
  const [satisfactionView, setSatisfactionView] = useState("all");
  const [developmentView, setDevelopmentView] = useState("all");
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

  return (
    <section className="page-grid dashboard-grid">
      <div className="card card-span dashboard-filter-card">
        <div className="card-header">
          <h3>Painel de controle</h3>
          <span>Defina o contexto da leitura</span>
        </div>
        <div className="dashboard-filter-grid">
          <SafeSelect
            label="Elemento da composicao do ciclo"
            value={dashboardCompositionFilter}
            options={dashboardCompositionOptions.map((item) => item.value)}
            renderLabel={(value) =>
              dashboardCompositionOptions.find((item) => item.value === value)?.label || value
            }
            onChange={setDashboardCompositionFilter}
          />
          <SafeSelect
            label="Area / Setor"
            value={dashboardAreaFilter}
            options={["all", ...((canFilterDashboardByArea && dashboard?.areaOptions) || [])]}
            renderLabel={(value) => (value === "all" ? "Todas as areas e setores" : value)}
            onChange={setDashboardAreaFilter}
          />
          <SafeSelect
            label="Consolidar ciclos por"
            value={dashboardTimeGrouping}
            options={dashboardTimeGroupingOptions.map((item) => item.value)}
            renderLabel={(value) =>
              dashboardTimeGroupingOptions.find((item) => item.value === value)?.label || value
            }
            onChange={setDashboardTimeGrouping}
          />
        </div>
        <div className="dashboard-view-toggle">
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
        <div className="dashboard-focus-strip">
          {focusPills.map((item) => (
            <div className={`dashboard-focus-pill ${item.tone}`} key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="hero-panel card-span">
        <div className="dashboard-hero-copy">
          <div>
            <p className="eyebrow">
              {dashboard?.mode === "executive"
                ? "Visao executiva"
                : dashboard?.mode === "team"
                  ? "Visao gerencial"
                  : "Visao pessoal"}
            </p>
            <h3>
              {dashboard?.mode === "executive"
                ? "Governanca, clima e desenvolvimento em uma unica leitura"
                : dashboard?.mode === "team"
                  ? "Sua equipe direta em foco, sem exposicao de outras areas"
                  : "Seu recorte operacional do ciclo e da evolucao profissional"}
            </h3>
            <p className="muted">
              {dashboard?.notice ||
                "Acompanhe cobertura, adesao, desenvolvimento e sinais do ciclo em um painel unico."}
            </p>
          </div>
          <div className="dashboard-hero-caption">
            <span className="badge">Painel {isExecutiveView ? "executivo" : "analitico"}</span>
            <p className="muted">
              {isExecutiveView
                ? "Leitura pronta para comites, checkpoints e tomada de decisao."
                : "Leitura detalhada para explorar gargalos, distribuicao e cobertura."}
            </p>
          </div>
        </div>
        <div className="hero-panel-grid dashboard-kpi-strip">
          <SafeMetricCard
            label="Pessoas"
            value={dashboard?.scopeSummary?.peopleCount ?? summary?.peopleCount}
          />
          <SafeMetricCard label="Incidentes abertos" value={summary?.openIncidents} />
          <SafeMetricCard label="Ciclos ativos" value={summary?.activeEvaluationCycles} />
          <SafeMetricCard
            label="Assignments pendentes"
            value={dashboard?.scopeSummary?.pendingAssignments ?? summary?.pendingAssignments}
          />
        </div>
      </div>

      <div className="card card-span">
        <div className="card-header">
          <h3>Leitura executiva do recorte</h3>
          <span>Sintese orientada a decisao</span>
        </div>
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
          <div className="card-header">
            <h3>Panorama por tema</h3>
            <span>Governanca, avaliacoes, desenvolvimento e risco</span>
          </div>
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

      <div className="card card-span">
        <div className="card-header">
          <h3>
            {dashboard?.mode === "executive"
              ? "Indicadores executivos"
              : dashboard?.mode === "team"
                ? "Indicadores gerenciais"
                : "Indicadores pessoais"}
          </h3>
          <span>
            {isExecutiveView
              ? "Leitura sintetica priorizada"
              : dashboard?.mode === "executive"
                ? "Uso em reunioes e apresentacoes"
                : dashboard?.mode === "team"
                  ? "Leitura da sua equipe direta"
                  : "Leitura individual do semestre"}
          </span>
        </div>
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

      <div
        className={`card-span dashboard-board-grid ${
          isExecutiveView ? "dashboard-board-grid-executive" : "dashboard-board-grid-analytical"
        }`}
      >
        {isExecutiveView ? (
          <>
            {(dashboard?.donutMetrics || []).length ? (
              <div className="card dashboard-visual-card dashboard-board-featured">
                <div className="card-header">
                  <h3>Panorama de cobertura</h3>
                  <span>Vista rapida do ciclo</span>
                </div>
                <div className="donut-grid">
                  {(dashboard?.donutMetrics || []).filter(Boolean).map((item) => (
                    <SafeDashboardDonut key={item.key || item.label} item={item} />
                  ))}
                </div>
              </div>
            ) : null}

            {cycleTimelineItems.length ? (
              <div className="card dashboard-visual-card dashboard-board-featured">
                <div className="card-header">
                  <h3>Pulso do ciclo</h3>
                  <span>Adesao por {dashboardTimeGroupingLabel.toLowerCase()}</span>
                </div>
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
                <div className="card-header">
                  <h3>Ritmo de distribuicao</h3>
                  <span>Volume no tempo</span>
                </div>
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
              <div className="card-header">
                <h3>Distribuicao das respostas</h3>
                <span>
                  {selectedDashboardCompositionMeta
                    ? `Perguntas e distribuicoes de ${selectedDashboardCompositionMeta.label}`
                    : "Leitura consolidada por relacionamento"}
                </span>
              </div>
              <div className="stack-list">
                {filteredDashboardResponseDistributions.length ? (
                  filteredDashboardResponseDistributions.map((group) => (
                    <div className="list-card" key={group.relationshipType}>
                      <div className="row">
                        <strong>{getRelationshipLabel(group.relationshipType)}</strong>
                        <span className="badge">{group.totalResponses} respostas</span>
                      </div>
                      <div className="response-chart-grid">
                        {group.questions.map((question) => (
                          <SafeResponseDistributionChartCard
                            key={question.questionId}
                            question={question}
                          />
                        ))}
                      </div>
                    </div>
                  ))
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
                <div className="card-header">
                  <h3>Funil do recorte</h3>
                  <span>Cobertura do fluxo</span>
                </div>
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
                <div className="card-header">
                  <h3>Volume por {dashboardTimeGroupingLabel.toLowerCase()}</h3>
                  <span>Evolucao temporal</span>
                </div>
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

      <div
        className={`card-span dashboard-insight-grid ${
          isExecutiveView ? "dashboard-insight-grid-executive" : "dashboard-insight-grid-analytical"
        }`}
      >
        {assignmentStatusItems.length ? (
          <div className={`card dashboard-side-card ${isExecutiveView ? "dashboard-card-tall" : ""}`}>
            <div className="card-header">
              <h3>Status dos assignments</h3>
              <span>Fluxo atual</span>
            </div>
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
                <h3>Satisfacao por area</h3>
                <span>Mapa de calor</span>
              </div>
              <div className="dashboard-card-filter">
                <label className="dashboard-card-select">
                  <span>Filtro</span>
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
            <div className="card-header">
              <h3>Comparativos do periodo</h3>
              <span>Variacoes relevantes</span>
            </div>
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
                <h3>Desenvolvimento por trilha</h3>
                <span>Volume por tipo</span>
              </div>
              <div className="dashboard-card-filter">
                <label className="dashboard-card-select">
                  <span>Filtro</span>
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
            <div className="card-header">
              <h3>Adesao por {dashboardTimeGroupingLabel.toLowerCase()}</h3>
              <span>Concluidas vs distribuidas</span>
            </div>
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
            <div className="card-header">
              <h3>Composicao do ciclo</h3>
              <span>
                {selectedDashboardCompositionMeta
                  ? `Recorte de ${selectedDashboardCompositionMeta.label}`
                  : "Mix de tipos de avaliacao"}
              </span>
            </div>
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
