import { useState } from "react";
import { AuditTrailPanel } from "../components/AuditTrailPanel";

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
          <Select
            label="Elemento da composicao do ciclo"
            value={dashboardCompositionFilter}
            options={dashboardCompositionOptions.map((item) => item.value)}
            renderLabel={(value) =>
              dashboardCompositionOptions.find((item) => item.value === value)?.label || value
            }
            onChange={setDashboardCompositionFilter}
          />
          <Select
            label="Area / Setor"
            value={dashboardAreaFilter}
            options={["all", ...((canFilterDashboardByArea && dashboard?.areaOptions) || [])]}
            renderLabel={(value) => (value === "all" ? "Todas as areas e setores" : value)}
            onChange={setDashboardAreaFilter}
          />
          <Select
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
          <MetricCard
            label="Pessoas"
            value={dashboard?.scopeSummary?.peopleCount ?? summary?.peopleCount}
          />
          <MetricCard label="Incidentes abertos" value={summary?.openIncidents} />
          <MetricCard label="Ciclos ativos" value={summary?.activeEvaluationCycles} />
          <MetricCard
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
                <BarMetricRow
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
              <BarMetricRow
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
              <BarMetricRow
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
                      <ResponseDistributionChartCard
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

export function ComplianceSection({
  IncidentQueueCard,
  Input,
  Select,
  Textarea,
  auditEntries,
  canManageIncidentQueue,
  canViewIncidents,
  formatDate,
  handleIncidentSubmit,
  handleIncidentUpdate,
  incidentClassificationOptions,
  incidentStatusOptions,
  incidentForm,
  incidents,
  roleKey,
  setIncidentForm
}) {
  const isOperationalCompliance = roleKey === "compliance";
  const shouldShowReporterLabel = incidentForm.anonymity === "identified";
  const shouldShowAssignedTo = canManageIncidentQueue;

  return (
    <section className="page-grid">
      <form className="card compact-card admin-form-card" onSubmit={handleIncidentSubmit}>
        <div className="card-header">
          <h3>{isOperationalCompliance ? "Registrar novo caso" : "Novo relato"}</h3>
          <span>
            {isOperationalCompliance
              ? "Entrada estruturada para triagem e encaminhamento"
              : "Canal estruturado de etica e conduta"}
          </span>
        </div>
        <Input
          label="Titulo"
          value={incidentForm.title}
          onChange={(value) => setIncidentForm({ ...incidentForm, title: value })}
        />
        <Select
          label="Categoria"
          value={incidentForm.category}
          options={[
            "Conduta Impropria",
            "Assedio",
            "Conflito de interesse",
            "Uso indevido de recurso",
            "Fraude"
          ]}
          onChange={(value) => setIncidentForm({ ...incidentForm, category: value })}
        />
        <Select
          label="Classificacao inicial"
          value={incidentForm.classification}
          options={incidentClassificationOptions}
          onChange={(value) => setIncidentForm({ ...incidentForm, classification: value })}
        />
        <Select
          label="Identificacao"
          value={incidentForm.anonymity}
          options={["anonymous", "identified"]}
          renderLabel={(value) => (value === "anonymous" ? "Anonimo" : "Identificado")}
          onChange={(value) => setIncidentForm({ ...incidentForm, anonymity: value })}
        />
        {shouldShowReporterLabel ? (
          <Input
            label="Nome do relator"
            value={incidentForm.reporterLabel}
            onChange={(value) => setIncidentForm({ ...incidentForm, reporterLabel: value })}
          />
        ) : null}
        {shouldShowAssignedTo ? (
          <Input
            label="Area responsavel"
            value={incidentForm.assignedTo}
            onChange={(value) => setIncidentForm({ ...incidentForm, assignedTo: value })}
          />
        ) : null}
        <Textarea
          label="Descricao"
          value={incidentForm.description}
          onChange={(value) => setIncidentForm({ ...incidentForm, description: value })}
        />
        <button className="primary-button" type="submit">
          Registrar relato
        </button>
      </form>

      <div className="card compact-card">
        <div className="card-header">
          <h3>Fila de tratamento</h3>
          <span>
            {canViewIncidents
              ? "Casos visiveis para RH, administracao e compliance"
              : "Seu papel pode registrar relatos, mas nao ver a fila completa"}
          </span>
        </div>
        <div className="stack-list">
          {canViewIncidents ? (
            incidents.map((incident) => (
              <IncidentQueueCard
                key={incident.id}
                canManage={canManageIncidentQueue}
                formatDate={formatDate}
                incident={incident}
                incidentClassificationOptions={incidentClassificationOptions}
                incidentStatusOptions={incidentStatusOptions}
                onSave={handleIncidentUpdate}
              />
            ))
          ) : (
            <div className="list-card">
              <strong>Canal ativo</strong>
              <p className="muted">
                O registro do relato continua disponivel, mas a fila detalhada fica restrita a
                perfis de gestao e compliance.
              </p>
            </div>
          )}
        </div>
      </div>

      <AuditTrailPanel
        entries={auditEntries.slice(0, 6)}
        emptyMessage="As acoes de tratamento e triagem aparecerao aqui."
        formatDate={formatDate}
        subtitle="Historico recente de triagem e tratamento"
        title="Trilha operacional"
      />
    </section>
  );
}

export function DevelopmentSection({
  Input,
  MetricCard,
  Select,
  Textarea,
  activeDevelopmentView,
  developmentForm,
  developmentFormPeopleOptions,
  developmentHighlights,
  developmentMetrics,
  developmentRecordTypes,
  developmentViewLabels,
  developmentViewOptions,
  filteredDevelopmentRecords,
  formatDate,
  getDevelopmentTrackLabel,
  handleDevelopmentSubmit,
  roleKey,
  setActiveDevelopmentView,
  setDevelopmentForm
}) {
  const isEmployeeJourney = roleKey === "employee";
  const showDevelopmentViews = developmentViewOptions.length > 1;
  const showDevelopmentMetrics = !isEmployeeJourney;
  const showDevelopmentPersonSelect = developmentFormPeopleOptions.length > 1;

  return (
    <section className="page-grid">
      <div className="card card-span compact-card">
        <div className="card-header">
          <h3>{isEmployeeJourney ? "Meu desenvolvimento" : "Trilha de desenvolvimento"}</h3>
          <span>
            {developmentViewLabels[activeDevelopmentView]?.description ||
              "Acompanhamento de evolucao academica e profissional"}
          </span>
        </div>
        {showDevelopmentViews ? (
          <div className="module-grid">
            {developmentViewOptions.map((view) => (
              <button
                key={view.key}
                type="button"
                className={
                  activeDevelopmentView === view.key
                    ? "mini-card button-reset module-card active"
                    : "mini-card button-reset module-card"
                }
                onClick={() => setActiveDevelopmentView(view.key)}
              >
                <p className="mini-label">{view.label}</p>
                <strong>{view.description}</strong>
                <p className="muted">
                  {view.key === "team"
                    ? "Gestor acompanha apenas reportes diretos."
                    : view.key === "organization"
                      ? "RH e administracao acompanham a organizacao."
                      : "Cada usuario visualiza o proprio historico."}
                </p>
              </button>
            ))}
          </div>
        ) : null}
        {showDevelopmentMetrics ? (
          <div className="metrics-grid">
            {developmentMetrics.map((item) => (
              <MetricCard key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        ) : null}
      </div>

      <form className="card compact-card admin-form-card" onSubmit={handleDevelopmentSubmit}>
        <div className="card-header">
          <h3>{isEmployeeJourney ? "Registrar marco" : "Novo registro"}</h3>
          <span>
            {activeDevelopmentView === "team"
              ? "Registrar marcos da equipe"
              : activeDevelopmentView === "organization"
                ? "Registrar marcos da organizacao"
                : "Registrar sua propria evolucao"}
          </span>
        </div>
        {showDevelopmentPersonSelect ? (
          <Select
            label="Pessoa"
            value={developmentForm.personId}
            options={developmentFormPeopleOptions.map((item) => item.value)}
            renderLabel={(value) =>
              developmentFormPeopleOptions.find((item) => item.value === value)?.label || value
            }
            onChange={(value) => setDevelopmentForm({ ...developmentForm, personId: value })}
          />
        ) : null}
        <Select
          label="Tipo"
          value={developmentForm.recordType}
          options={developmentRecordTypes}
          onChange={(value) => setDevelopmentForm({ ...developmentForm, recordType: value })}
        />
        <Input
          label="Titulo"
          value={developmentForm.title}
          onChange={(value) => setDevelopmentForm({ ...developmentForm, title: value })}
        />
        <Input
          label="Instituicao / provedor"
          value={developmentForm.providerName}
          onChange={(value) => setDevelopmentForm({ ...developmentForm, providerName: value })}
        />
        <Input
          label="Conclusao"
          type="date"
          value={developmentForm.completedAt}
          onChange={(value) => setDevelopmentForm({ ...developmentForm, completedAt: value })}
        />
        <Input
          label="Competencia / eixo"
          value={developmentForm.skillSignal}
          onChange={(value) => setDevelopmentForm({ ...developmentForm, skillSignal: value })}
        />
        <Textarea
          label="Notas"
          value={developmentForm.notes}
          onChange={(value) => setDevelopmentForm({ ...developmentForm, notes: value })}
        />
        <button className="primary-button" type="submit">
          Registrar desenvolvimento
        </button>
      </form>

      {!isEmployeeJourney ? (
        <div className="card compact-card">
          <div className="card-header">
            <h3>Mapa do recorte</h3>
            <span>Leitura resumida por pessoa</span>
          </div>
          <div className="stack-list">
            {developmentHighlights.length ? (
              developmentHighlights.map((item) => (
                <article className="list-card" key={item.personId}>
                  <div className="row">
                    <strong>{item.personName}</strong>
                    <span className="badge">{item.totalRecords} registros</span>
                  </div>
                  <p className="muted">
                    Formacao academica: {item.academicRecords} | Ultimo marco: {item.latestTitle}
                  </p>
                  <p className="muted">Atualizado em {formatDate(item.latestDate)}</p>
                </article>
              ))
            ) : (
              <div className="list-card">
                <strong>Sem dados neste recorte</strong>
                <p className="muted">
                  Registre um novo marco para iniciar a trilha de desenvolvimento.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div className="card card-span compact-card">
        <div className="card-header">
          <h3>{isEmployeeJourney ? "Meu historico" : "Historico"}</h3>
          <span>
            {isEmployeeJourney
              ? "Seus registros academicos e profissionais"
              : "Evidencias de evolucao academica e profissional"}
          </span>
        </div>
        <div className="stack-list">
          {filteredDevelopmentRecords.length ? (
            filteredDevelopmentRecords.map((record) => (
              <article className="list-card" key={record.id}>
                <div className="row">
                  <strong>{record.title}</strong>
                  <span className="badge">{record.recordType}</span>
                </div>
                <p>{record.personName}</p>
                <p className="muted">
                  {getDevelopmentTrackLabel(record.recordType)} | {record.providerName}
                </p>
                <p className="muted">{record.skillSignal}</p>
                <p className="muted">Conclusao: {formatDate(record.completedAt)}</p>
                {record.notes ? <p className="muted">{record.notes}</p> : null}
              </article>
            ))
          ) : (
            <div className="list-card">
              <strong>Nenhum registro encontrado</strong>
              <p className="muted">
                O recorte selecionado ainda nao possui historico de desenvolvimento.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function ApplauseSection({
  Input,
  Select,
  Textarea,
  applauseEntries,
  applauseForm,
  applausePeopleOptions,
  handleApplauseSubmit,
  roleKey,
  setApplauseForm
}) {
  const isEmployeeJourney = roleKey === "employee";

  return (
    <section className="page-grid">
      <form className="card compact-card admin-form-card" onSubmit={handleApplauseSubmit}>
        <div className="card-header">
          <h3>{isEmployeeJourney ? "Reconhecer alguem" : "Novo Aplause"}</h3>
          <span>
            {isEmployeeJourney
              ? "Reconhecimento rapido com contexto objetivo"
              : "Reconhecimento formal com contexto obrigatorio"}
          </span>
        </div>
        <Select
          label="Quem recebe"
          value={applauseForm.receiverPersonId}
          options={applausePeopleOptions.map((item) => item.value)}
          renderLabel={(value) =>
            applausePeopleOptions.find((item) => item.value === value)?.label || value
          }
          onChange={(value) => setApplauseForm({ ...applauseForm, receiverPersonId: value })}
        />
        <Select
          label="Categoria"
          value={applauseForm.category}
          options={[
            "Colaboracao",
            "Apoio em momento critico",
            "Resolucao de problema",
            "Postura exemplar",
            "Compartilhamento de conhecimento"
          ]}
          onChange={(value) => setApplauseForm({ ...applauseForm, category: value })}
        />
        <Input
          label="Impacto"
          value={applauseForm.impact}
          onChange={(value) => setApplauseForm({ ...applauseForm, impact: value })}
        />
        <Textarea
          label="Contexto"
          value={applauseForm.contextNote}
          onChange={(value) => setApplauseForm({ ...applauseForm, contextNote: value })}
        />
        <button className="primary-button" type="submit">
          Registrar Aplause
        </button>
      </form>

      <div className="card compact-card">
        <div className="card-header">
          <h3>{isEmployeeJourney ? "Historico de reconhecimentos" : "Reconhecimentos"}</h3>
          <span>
            {isEmployeeJourney
              ? "Entradas recentes do seu ambiente de colaboracao"
              : "Impacto complementar nas avaliacoes"}
          </span>
        </div>
        <div className="stack-list">
          {applauseEntries.map((entry) => (
            <article className="list-card" key={entry.id}>
              <div className="row">
                <strong>
                  {entry.senderName} {"->"} {entry.receiverName}
                </strong>
                <span className="badge">{entry.status}</span>
              </div>
              <p>{entry.category}</p>
              <p className="muted">{entry.impact}</p>
              <p className="muted">{entry.contextNote}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PeopleSection({
  AreaAdminCard,
  Input,
  PersonStructureCard,
  Select,
  areaForm,
  areaOptions,
  areas,
  canManagePeopleRegistry,
  handleAreaSubmit,
  handleAreaUpdate,
  handlePersonSubmit,
  handlePersonUpdate,
  managerOptions,
  people,
  personForm,
  setAreaForm,
  setPersonForm
}) {
  return (
    <section className="page-grid">
      {canManagePeopleRegistry ? (
        <>
          <form className="card compact-card admin-form-card" onSubmit={handleAreaSubmit}>
            <div className="card-header">
              <h3>Nova area</h3>
              <span>Defina a area e o gestor responsavel pelo recorte</span>
            </div>
            <Input
              label="Nome da area"
              value={areaForm.name}
              onChange={(value) => setAreaForm({ ...areaForm, name: value })}
            />
            <Select
              label="Gestor responsavel"
              value={areaForm.managerPersonId}
              options={managerOptions.map((item) => item.value)}
              renderLabel={(value) =>
                managerOptions.find((item) => item.value === value)?.label || value
              }
              onChange={(value) => setAreaForm({ ...areaForm, managerPersonId: value })}
            />
            <button className="primary-button" type="submit">
              Cadastrar area
            </button>
          </form>

          <form className="card compact-card admin-form-card" onSubmit={handlePersonSubmit}>
            <div className="card-header">
              <h3>Nova pessoa</h3>
              <span>Conecte colaborador, gestor e area no cadastro base</span>
            </div>
            <Input
              label="Nome"
              value={personForm.name}
              onChange={(value) => setPersonForm({ ...personForm, name: value })}
            />
            <Input
              label="Cargo"
              value={personForm.roleTitle}
              onChange={(value) => setPersonForm({ ...personForm, roleTitle: value })}
            />
            <Select
              label="Area"
              value={personForm.area}
              options={areaOptions.map((item) => item.value)}
              renderLabel={(value) => areaOptions.find((item) => item.value === value)?.label || value}
              onChange={(value) => setPersonForm({ ...personForm, area: value })}
            />
            <Select
              label="Gestor"
              value={personForm.managerPersonId}
              options={managerOptions.map((item) => item.value)}
              renderLabel={(value) =>
                managerOptions.find((item) => item.value === value)?.label || value
              }
              onChange={(value) => setPersonForm({ ...personForm, managerPersonId: value })}
            />
            <Select
              label="Vinculo"
              value={personForm.employmentType}
              options={["internal", "consultant"]}
              renderLabel={(value) => (value === "internal" ? "Interno" : "Consultor")}
              onChange={(value) => setPersonForm({ ...personForm, employmentType: value })}
            />
            <button className="primary-button" type="submit">
              Cadastrar pessoa
            </button>
          </form>
        </>
      ) : null}

      <div className="card compact-card">
        <div className="card-header">
          <h3>Areas e liderancas</h3>
          <span>
            {canManagePeopleRegistry
              ? "Conexao formal entre area e gestor responsavel"
              : "Areas visiveis dentro do seu escopo"}
          </span>
        </div>
        <div className="stack-list compact-stack">
          {areas.map((area) =>
            canManagePeopleRegistry ? (
              <AreaAdminCard
                key={area.id}
                area={area}
                managerOptions={managerOptions}
                onSave={handleAreaUpdate}
              />
            ) : (
              <article className="list-card compact-list-card" key={area.id}>
                <div className="row">
                  <strong>{area.name}</strong>
                  <span className="badge">{area.peopleCount} pessoas</span>
                </div>
                <p className="muted">Gestor responsavel: {area.managerName || "Nao definido"}</p>
              </article>
            )
          )}
        </div>
      </div>

      <div className="card compact-card">
        <div className="card-header">
          <h3>Estrutura de pessoas</h3>
          <span>
            {canManagePeopleRegistry
              ? "Conecte colaborador, gestor e area em um unico fluxo"
              : "Perfis visiveis dentro do seu escopo"}
          </span>
        </div>
        <div className="stack-list compact-stack">
          {people.map((person) =>
            canManagePeopleRegistry ? (
              <PersonStructureCard
                key={person.id}
                areaOptions={areaOptions}
                managerOptions={managerOptions}
                onSave={handlePersonUpdate}
                person={person}
              />
            ) : (
              <article className="list-card compact-list-card" key={person.id}>
                <div className="row">
                  <strong>{person.name}</strong>
                  <span className="badge">{person.employmentType || "-"}</span>
                </div>
                <p className="muted">{person.roleTitle}</p>
                <p className="muted">
                  {person.area} | Gestor: {person.managerName || "-"}
                </p>
              </article>
            )
          )}
        </div>
      </div>
    </section>
  );
}

export function UsersSection({
  Input,
  Select,
  UserAdminCard,
  auditEntries,
  availableUserPeopleOptions,
  formatDate,
  handleUserSubmit,
  handleUserUpdate,
  setUserForm,
  userForm,
  userRoleOptions,
  userStatusOptions,
  users
}) {
  return (
    <section className="page-grid">
      <form className="card compact-card admin-form-card" onSubmit={handleUserSubmit}>
        <div className="card-header">
          <h3>Novo usuario</h3>
          <span>Concessao de acesso vinculada a uma pessoa existente</span>
        </div>
        <Select
          label="Pessoa"
          value={userForm.personId}
          options={availableUserPeopleOptions.map((item) => item.value)}
          renderLabel={(value) =>
            availableUserPeopleOptions.find((item) => item.value === value)?.label || value
          }
          onChange={(value) => setUserForm({ ...userForm, personId: value })}
        />
        <Input
          label="Email"
          value={userForm.email}
          onChange={(value) => setUserForm({ ...userForm, email: value })}
        />
        <Input
          label="Senha inicial"
          type="password"
          value={userForm.password}
          onChange={(value) => setUserForm({ ...userForm, password: value })}
        />
        <Select
          label="Nivel de acesso"
          value={userForm.roleKey}
          options={userRoleOptions}
          onChange={(value) => setUserForm({ ...userForm, roleKey: value })}
        />
        <Select
          label="Status"
          value={userForm.status}
          options={userStatusOptions}
          onChange={(value) => setUserForm({ ...userForm, status: value })}
        />
        <button className="primary-button" type="submit">
          Criar usuario
        </button>
      </form>

      <div className="card compact-card">
        <div className="card-header">
          <h3>Usuarios ativos e inativos</h3>
          <span>Gestao de acesso e perfil operacional</span>
        </div>
        <div className="stack-list compact-stack">
          {users.map((item) => (
            <UserAdminCard
              key={item.id}
              user={item}
              onSave={handleUserUpdate}
              userRoleOptions={userRoleOptions}
              userStatusOptions={userStatusOptions}
            />
          ))}
        </div>
      </div>

      <AuditTrailPanel
        entries={auditEntries.slice(0, 6)}
        emptyMessage="Criacoes e atualizacoes de acesso aparecerao nesta trilha."
        formatDate={formatDate}
        subtitle="Historico recente de provisionamento e manutencao"
        title="Trilha de acesso"
      />
    </section>
  );
}
