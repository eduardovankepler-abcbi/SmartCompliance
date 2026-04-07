import { useState } from "react";

const EmptyComponent = () => null;

export function DashboardSection({
  BarMetricRow,
  ColumnMetricCard,
  DashboardDonut,
  FunnelSeriesChart,
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
  summary
}) {
  const SafeBarMetricRow = BarMetricRow || EmptyComponent;
  const SafeColumnMetricCard = ColumnMetricCard || EmptyComponent;
  const SafeDashboardDonut = DashboardDonut || EmptyComponent;
  const SafeFunnelSeriesChart = FunnelSeriesChart || EmptyComponent;
  const SafeMetricCard = MetricCard || EmptyComponent;
  const SafeResponseDistributionChartCard = ResponseDistributionChartCard || EmptyComponent;
  const SafeSelect = Select || EmptyComponent;
  const [dashboardViewMode, setDashboardViewMode] = useState("executive");
  const executiveHighlights = buildExecutiveHighlights({
    dashboard,
    dashboardAreaFilter,
    dashboardTimeGroupingLabel,
    selectedDashboardCompositionMeta
  });
  const executiveComparisons = buildExecutiveComparisons({ dashboard, dashboardTimeGroupingLabel });
  const executiveMessages = buildExecutiveMessages({
    dashboard,
    dashboardAreaFilter,
    selectedDashboardCompositionMeta
  });
  const isExecutiveView = dashboardViewMode === "executive";

  return (
    <section className="page-grid">
      <div className="card card-span dashboard-filter-card">
        <div className="card-header">
          <h3>Filtros analiticos</h3>
          <span>Refine o dashboard por elemento do ciclo e por area ou setor</span>
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
      </div>

      <div className="hero-panel card-span">
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
              "O ambiente combina denuncias, ciclos de avaliacao, reconhecimento e historico profissional."}
          </p>
        </div>
        <div className="hero-panel-grid">
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
          <span>Sintese pronta para reunioes e checkpoints</span>
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

      {executiveComparisons.length ? (
        <div className="card card-span">
          <div className="card-header">
            <h3>Comparativo automatico do periodo</h3>
            <span>Melhora, queda e pontos criticos destacados automaticamente</span>
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

      {executiveMessages.length ? (
        <div className="card card-span">
          <div className="card-header">
            <h3>Mensagens-chave do recorte</h3>
            <span>Resumo orientado a decisao para apresentacoes e comites</span>
          </div>
          <div className="executive-message-grid">
            {executiveMessages.map((item) => (
              <article className={`list-card executive-message-card ${item.tone}`} key={item.title}>
                <p className="mini-label">{item.title}</p>
                <strong>{item.headline}</strong>
                <p className="muted">{item.detail}</p>
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

      {isExecutiveView && dashboard?.donutMetrics?.length ? (
        <div className="card card-span">
          <div className="card-header">
            <h3>Indicadores de cobertura</h3>
            <span>Resumo executivo do recorte atual</span>
          </div>
          <div className="metrics-grid">
            {dashboard.donutMetrics.map((item) => (
              <article className="list-card" key={item.key}>
                <p className="mini-label">{item.label}</p>
                <strong>{item.percentage}%</strong>
                <p className="muted">
                  {item.value} / {item.total}
                </p>
                <p className="muted">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {dashboard?.cycleTimeline?.length ? (
        <>
          <div className="card">
            <div className="card-header">
              <h3>Ciclos consolidados por {dashboardTimeGroupingLabel.toLowerCase()}</h3>
              <span>Volume de assignments distribuidos em cada periodo</span>
            </div>
            <div className="stack-list">
              {dashboard.cycleTimeline.map((item) => (
                <article className="list-card" key={item.periodKey}>
                  <div className="row">
                    <strong>{item.label}</strong>
                    <span>{item.totalAssignments}</span>
                  </div>
                  <p className="muted">
                    {item.cycleCount} ciclos | {item.totalResponses} respostas
                  </p>
                  <p className="muted">Volume relativo: {item.volumePercentage}%</p>
                </article>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Adesao por {dashboardTimeGroupingLabel.toLowerCase()}</h3>
              <span>Concluidas versus distribuidas em cada periodo</span>
            </div>
            <div className="bar-list">
              {dashboard.cycleTimeline.map((item) => (
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
        </>
      ) : null}

      {dashboard?.satisfactionByArea?.length ? (
        <div className="card">
          <div className="card-header">
            <h3>Satisfacao por area</h3>
            <span>Somente dados agregados</span>
          </div>
          <div className="bar-list">
            {dashboard.satisfactionByArea.map((item) => (
              <SafeBarMetricRow
                key={item.area}
                label={item.area}
                value={item.score}
                detail={`${item.peopleCount} pessoas`}
                percentage={item.percentage}
                toneKey={item.area}
              />
            ))}
          </div>
        </div>
      ) : null}

      {dashboard?.assignmentStatus?.length ? (
        <div className="card">
          <div className="card-header">
            <h3>Status dos assignments</h3>
            <span>Leitura de fluxo no recorte atual</span>
          </div>
          <div className="bar-list">
            {dashboard.assignmentStatus.map((item) => (
              <SafeBarMetricRow
                key={item.status}
                label={getAssignmentStatusLabel(item.status)}
                value={item.total}
                detail={`${item.percentage}% do total`}
                percentage={item.percentage}
                toneKey={item.status}
              />
            ))}
          </div>
        </div>
      ) : null}

      {dashboard?.developmentByType?.length ? (
        <div className="card">
          <div className="card-header">
            <h3>Desenvolvimento por trilha</h3>
            <span>Volume por tipo de registro</span>
          </div>
          <div className="stack-list">
            {dashboard.developmentByType.map((item) => (
              <article className="list-card" key={item.type}>
                <div className="row">
                  <strong>{item.type}</strong>
                  <span>{item.total}</span>
                </div>
                <p className="muted">{item.percentage}% do recorte</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {!isExecutiveView ? (
        <div className="card card-span">
          <div className="card-header">
            <h3>Composicao do ciclo</h3>
            <span>
              {selectedDashboardCompositionMeta
                ? `Recorte de ${selectedDashboardCompositionMeta.label}`
                : "Mix de tipos de avaliacao usados no periodo"}
            </span>
          </div>
          <div className="stack-list">
            {filteredDashboardEvaluationMix.map((item) => (
              <article className="list-card" key={item.type}>
                <div className="row">
                  <strong>{getRelationshipLabel(item.type)}</strong>
                  <span>{item.total}</span>
                </div>
                <p className="muted">{item.percentage}% do total</p>
                <p className="muted">{getRelationshipDescription(item.type)}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {!isExecutiveView && dashboard?.responseDistributions?.length ? (
        <div className="card card-span">
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
      ) : null}

      {isExecutiveView ? (
        <>
          <div className="card">
            <div className="card-header">
              <h3>Panorama de clima</h3>
              <span>Leitura radial do sentimento agregado</span>
            </div>
            {(dashboard?.donutMetrics || []).length ? (
              <div className="metrics-grid">
                {(dashboard?.donutMetrics || []).filter(Boolean).map((item) => (
                  <SafeDashboardDonut key={item.key || item.label} item={item} />
                ))}
              </div>
            ) : (
              <div className="list-card">
                <strong>Sem indicadores suficientes para compor o panorama.</strong>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Resumo de distribuicao</h3>
              <span>Comparativo rapido de concluido e pendente</span>
            </div>
            <SafeColumnMetricCard
              items={dashboard?.assignmentStatus || []}
              getLabel={getAssignmentStatusLabel}
            />
          </div>
        </>
      ) : (
        <>
          <div className="card">
            <div className="card-header">
              <h3>Funil do recorte</h3>
              <span>Leitura de cobertura ao longo do fluxo</span>
            </div>
            <SafeFunnelSeriesChart
              items={dashboard?.funnelMetrics || []}
              emptyMessage="Sem dados para compor o funil neste recorte."
            />
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Comparativo por relacionamento</h3>
              <span>Media consolidada dos modulos ativos no recorte</span>
            </div>
            <SafeColumnMetricCard
              items={dashboard?.evaluationMix || []}
              getLabel={getRelationshipLabel}
            />
          </div>
        </>
      )}
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

function buildExecutiveMessages({ dashboard, dashboardAreaFilter, selectedDashboardCompositionMeta }) {
  const areaLabel = dashboardAreaFilter === "all" ? "organizacao" : dashboardAreaFilter;
  const compositionLabel =
    selectedDashboardCompositionMeta?.label?.toLowerCase() || "todos os elementos do ciclo";
  const satisfactionByArea = dashboard?.satisfactionByArea || [];
  const pendingAssignments = dashboard?.assignmentStatus?.find((item) => item.status === "pending");
  const submittedAssignments = dashboard?.assignmentStatus?.find((item) => item.status === "submitted");
  const latestPeriod = dashboard?.cycleTimeline?.[0];
  const strongestArea = [...satisfactionByArea].sort(
    (left, right) => Number(right.score) - Number(left.score)
  )[0];
  const weakestArea = [...satisfactionByArea].sort(
    (left, right) => Number(left.score) - Number(right.score)
  )[0];

  const messages = [];

  if (pendingAssignments) {
    messages.push({
      title: "Risco principal",
      headline:
        pendingAssignments.percentage >= 40
          ? "Pendencia ainda pressiona o fechamento do ciclo"
          : "Pendencia sob controle, mas ainda requer acompanhamento",
      detail: `${pendingAssignments.total} assignments pendentes em ${areaLabel}, olhando ${compositionLabel}.`,
      tone: "warning"
    });
  }

  if (strongestArea) {
    messages.push({
      title: "Sinal positivo",
      headline: `${strongestArea.area} sustenta a melhor leitura agregada`,
      detail: `${strongestArea.score} de media no recorte atual, indicando um bom ponto de referencia interno.`,
      tone: "positive"
    });
  }

  if (weakestArea) {
    messages.push({
      title: "Prioridade recomendada",
      headline: `Atuar em ${weakestArea.area} tende a gerar maior ganho imediato`,
      detail: `${weakestArea.score} de media sugere concentrar escuta, acompanhamento e acoes corretivas nessa frente.`,
      tone: "neutral"
    });
  }

  if (latestPeriod && submittedAssignments) {
    messages.push({
      title: "Leitura do momento",
      headline: `${latestPeriod.label} concentra ${submittedAssignments.total} respostas concluidas`,
      detail: `O periodo mais recente resume o ritmo atual do ciclo e deve orientar a narrativa principal da reuniao.`,
      tone: "neutral"
    });
  }

  return messages.slice(0, 4);
}
