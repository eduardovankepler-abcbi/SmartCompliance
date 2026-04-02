import { useState } from "react";
import { AuditTrailPanel } from "../components/AuditTrailPanel";
import { workModeOptions } from "../appConfig.js";
import { getRoleLabel } from "../appLabels.js";
import {
  getPersonConsistencyMessages,
  getUserConsistencyMessages,
  validatePersonPayload,
  validateUserPayload
} from "../registry.js";

function getSuggestedRoleDescription(roleKey) {
  if (roleKey === "manager") {
    return "Recomendado para quem lidera area ou acompanha entregas diretas do time.";
  }
  if (roleKey === "employee") {
    return "Recomendado para acesso individual, sem gestao formal de pessoas.";
  }
  return "Ajuste o perfil conforme a responsabilidade operacional desta pessoa.";
}

function getAccessJourneyLabel(accessState, linkedUser) {
  if (accessState === "active") {
    return `Acesso ativo · ${getRoleLabel(linkedUser?.roleKey)}`;
  }
  if (accessState === "inactive") {
    return `Acesso inativo · ${getRoleLabel(linkedUser?.roleKey)}`;
  }
  return "Acesso pendente";
}

function getGuideStepTone(isComplete, isCurrent) {
  if (isComplete) {
    return "complete";
  }
  if (isCurrent) {
    return "current";
  }
  return "pending";
}

function getEmploymentTypeLabel(value) {
  if (value === "consultant") {
    return "Consultor";
  }
  if (value === "internal") {
    return "Interno";
  }
  return value || "-";
}

function buildOrganizationalConsistencyAlerts({ areas, people }) {
  const alerts = [];
  const duplicateRegistry = new Map();

  areas.forEach((area) => {
    if (area.peopleCount > 0 && !area.managerPersonId) {
      alerts.push(`A area ${area.name} tem pessoas cadastradas, mas ainda esta sem lider definido.`);
    }
  });

  people.forEach((person) => {
    if (!person.managerPersonId && person.areaManagerPersonId !== person.id) {
      alerts.push(`${person.name} esta sem gestor direto definido.`);
    }

    const duplicateKey = [
      String(person.name || "").trim().toLowerCase(),
      String(person.area || "").trim().toLowerCase(),
      String(person.roleTitle || "").trim().toLowerCase()
    ].join("|");

    if (duplicateRegistry.has(duplicateKey)) {
      alerts.push(
        `${person.name} aparece repetido com o mesmo cargo na area ${person.area}. Revise possivel duplicidade.`
      );
    } else {
      duplicateRegistry.set(duplicateKey, person.id);
    }
  });

  return alerts;
}

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
  incidentAreaOptions,
  incidentClassificationOptions,
  incidentStatusOptions,
  incidentForm,
  incidents,
  incidentResponsibleOptions,
  roleKey,
  setIncidentForm
}) {
  const isOperationalCompliance = roleKey === "compliance";
  const shouldShowReporterLabel = incidentForm.anonymity === "identified";
  const shouldShowAssignedPerson = canManageIncidentQueue;

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
        <Select
          label="Area responsavel"
          value={incidentForm.responsibleArea}
          options={incidentAreaOptions.map((item) => item.value)}
          renderLabel={(value) =>
            incidentAreaOptions.find((item) => item.value === value)?.label || value
          }
          onChange={(value) =>
            setIncidentForm({
              ...incidentForm,
              responsibleArea: value,
              assignedPersonId:
                incidentResponsibleOptions.find((item) => item.area === value && item.isAreaManager)
                  ?.value || ""
            })
          }
        />
        {shouldShowAssignedPerson ? (
          <Select
            label="Responsavel inicial"
            value={incidentForm.assignedPersonId}
            options={incidentResponsibleOptions
              .filter((item) => item.value === "" || item.area === incidentForm.responsibleArea)
              .map((item) => item.value)}
            renderLabel={(value) =>
              incidentResponsibleOptions.find((item) => item.value === value)?.label || value
            }
            onChange={(value) => setIncidentForm({ ...incidentForm, assignedPersonId: value })}
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
                areaOptions={incidentAreaOptions}
                incidentClassificationOptions={incidentClassificationOptions}
                responsibleOptions={incidentResponsibleOptions}
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
  auditEntries,
  canViewAuditTrail,
  DevelopmentPlanAdminCard,
  DevelopmentRecordAdminCard,
  Input,
  MetricCard,
  Select,
  Textarea,
  activeDevelopmentView,
  developmentForm,
  developmentPlanForm,
  developmentPlanCycleOptions,
  developmentPlanCompetencyOptions,
  developmentPlanPeopleOptions,
  developmentPlanStatusOptions,
  developmentFormPeopleOptions,
  developmentHighlights,
  developmentMetrics,
  developmentPlans,
  developmentRecordTypes,
  developmentEditablePlanPeopleOptions,
  developmentEditablePeopleOptions,
  developmentViewLabels,
  developmentViewOptions,
  filteredDevelopmentRecords,
  formatDate,
  getDevelopmentTrackLabel,
  handleDevelopmentPlanSubmit,
  handleDevelopmentPlanUpdate,
  handleDevelopmentSubmit,
  handleDevelopmentUpdate,
  roleKey,
  setActiveDevelopmentView,
  setDevelopmentForm,
  setDevelopmentPlanForm
}) {
  const isEmployeeJourney = roleKey === "employee";
  const showDevelopmentViews = developmentViewOptions.length > 1;
  const showDevelopmentMetrics = !isEmployeeJourney;
  const showDevelopmentPersonSelect = developmentFormPeopleOptions.length > 1;
  const showDevelopmentPlanPersonSelect = developmentPlanPeopleOptions.length > 1;

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

      <form className="card compact-card admin-form-card" onSubmit={handleDevelopmentPlanSubmit}>
        <div className="card-header">
          <h3>{isEmployeeJourney ? "Meu PDI" : "Novo PDI"}</h3>
          <span>
            {activeDevelopmentView === "team"
              ? "Plano de desenvolvimento para reportes diretos"
              : activeDevelopmentView === "organization"
                ? "Plano estruturado para pessoas da organizacao"
                : "Plano de desenvolvimento individual com acao e evidencia"}
          </span>
        </div>
        {showDevelopmentPlanPersonSelect ? (
          <Select
            label="Pessoa"
            value={developmentPlanForm.personId}
            options={developmentPlanPeopleOptions.map((item) => item.value)}
            renderLabel={(value) =>
              developmentPlanPeopleOptions.find((item) => item.value === value)?.label || value
            }
            onChange={(value) => setDevelopmentPlanForm({ ...developmentPlanForm, personId: value })}
          />
        ) : null}
        <Select
          label="Ciclo"
          value={developmentPlanForm.cycleId}
          options={developmentPlanCycleOptions.map((item) => item.value)}
          renderLabel={(value) =>
            developmentPlanCycleOptions.find((item) => item.value === value)?.label || value
          }
          onChange={(value) => setDevelopmentPlanForm({ ...developmentPlanForm, cycleId: value })}
        />
        <Select
          label="Competencia"
          value={developmentPlanForm.competencyId}
          options={developmentPlanCompetencyOptions.map((item) => item.value)}
          renderLabel={(value) =>
            developmentPlanCompetencyOptions.find((item) => item.value === value)?.label || value
          }
          onChange={(value) =>
            setDevelopmentPlanForm({ ...developmentPlanForm, competencyId: value })
          }
        />
        <Input
          label="Foco prioritario"
          value={developmentPlanForm.focusTitle}
          onChange={(value) => setDevelopmentPlanForm({ ...developmentPlanForm, focusTitle: value })}
        />
        <Textarea
          label="Acao sugerida"
          rows={3}
          value={developmentPlanForm.actionText}
          onChange={(value) => setDevelopmentPlanForm({ ...developmentPlanForm, actionText: value })}
        />
        <Input
          label="Prazo"
          type="date"
          value={developmentPlanForm.dueDate}
          onChange={(value) => setDevelopmentPlanForm({ ...developmentPlanForm, dueDate: value })}
        />
        <Textarea
          label="Evidencia esperada"
          rows={3}
          value={developmentPlanForm.expectedEvidence}
          onChange={(value) =>
            setDevelopmentPlanForm({ ...developmentPlanForm, expectedEvidence: value })
          }
        />
        <button className="primary-button" type="submit">
          Registrar PDI
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
          <h3>{isEmployeeJourney ? "Meu PDI ativo" : "Planos de desenvolvimento"}</h3>
          <span>
            {isEmployeeJourney
              ? "Acoes combinadas a partir do seu ciclo"
              : "Acompanhamento estruturado de foco, acao e evidencia"}
          </span>
        </div>
        <div className="stack-list">
          {developmentPlans.length ? (
            developmentPlans.map((plan) => (
              <DevelopmentPlanAdminCard
                key={plan.id}
                competencyOptions={developmentPlanCompetencyOptions}
                cycleOptions={developmentPlanCycleOptions}
                onSave={handleDevelopmentPlanUpdate}
                personOptions={developmentEditablePlanPeopleOptions}
                plan={{
                  ...plan,
                  dueDate: plan.dueDate?.slice?.(0, 10) || plan.dueDate
                }}
                statusOptions={developmentPlanStatusOptions}
              />
            ))
          ) : (
            <div className="list-card">
              <strong>Nenhum PDI encontrado</strong>
              <p className="muted">
                Registre um plano com foco, acao e evidencia para acompanhar a evolucao.
              </p>
            </div>
          )}
        </div>
      </div>

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
              <DevelopmentRecordAdminCard
                key={record.id}
                developmentRecordTypes={developmentRecordTypes}
                getDevelopmentTrackLabel={getDevelopmentTrackLabel}
                onSave={handleDevelopmentUpdate}
                personOptions={developmentEditablePeopleOptions}
                record={{
                  ...record,
                  completedAt: record.completedAt?.slice?.(0, 10) || record.completedAt
                }}
              />
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

      {canViewAuditTrail ? (
        <AuditTrailPanel
          entries={auditEntries.slice(0, 6)}
          emptyMessage="Criacoes, atualizacoes e arquivamentos de desenvolvimento aparecerao aqui."
          formatDate={formatDate}
          subtitle="Historico recente de manutencao e evolucao"
          title="Trilha operacional"
        />
      ) : null}
    </section>
  );
}

export function ApplauseSection({
  ApplauseAdminCard,
  Input,
  Select,
  Textarea,
  auditEntries,
  applauseEntries,
  applausePeopleOptions,
  applauseForm,
  canManageApplause,
  canViewAuditTrail,
  formatDate,
  handleApplauseSubmit,
  handleApplauseUpdate,
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
            canManageApplause ? (
              <ApplauseAdminCard
                key={entry.id}
                onSave={handleApplauseUpdate}
                personOptions={applausePeopleOptions}
                record={entry}
              />
            ) : (
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
            )
          ))}
        </div>
      </div>

      {canViewAuditTrail ? (
        <AuditTrailPanel
          entries={auditEntries.slice(0, 6)}
          emptyMessage="Criacoes e revisoes de Aplause aparecerao nesta trilha."
          formatDate={formatDate}
          subtitle="Historico recente de reconhecimento e manutencao"
          title="Trilha operacional"
        />
      ) : null}
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
  handlePersonSubmitAndCreateUser,
  handlePersonUpdate,
  managerOptions,
  onPrepareUserProvisioning,
  people,
  personAccessStateById,
  personForm,
  setAreaForm,
  setPersonForm
}) {
  const selectedArea = areas.find((area) => area.name === personForm.area) || null;
  const hasRegisteredAreas = areaOptions.length > 0;
  const selectedManager =
    managerOptions.find((option) => option.value === personForm.managerPersonId)?.label ||
    "Sem gestor direto definido";
  const hierarchyLeadLabel =
    personForm.isAreaManager === "yes"
      ? personForm.name || "Esta pessoa"
      : selectedArea?.managerName || "Ainda nao definido";
  const personValidationError = validatePersonPayload(personForm);
  const personConsistency = getPersonConsistencyMessages(personForm, { areas, people });
  const organizationalConsistencyAlerts = buildOrganizationalConsistencyAlerts({ areas, people });
  const isPersonReadyToSave =
    hasRegisteredAreas && !personValidationError && personConsistency.blocking.length === 0;
  const peopleGuideSteps = [
    {
      title: "1. Area base",
      description: hasRegisteredAreas
        ? "Ha pelo menos uma area disponivel para iniciar o cadastro."
        : "Cadastre a primeira area antes de concluir o cadastro da pessoa.",
      tone: getGuideStepTone(hasRegisteredAreas, !hasRegisteredAreas)
    },
    {
      title: "2. Pessoa preenchida",
      description:
        !hasRegisteredAreas
          ? "A etapa depende da criacao da area."
          : personValidationError || personConsistency.blocking[0] || "Dados obrigatorios preenchidos para seguir.",
      tone: getGuideStepTone(
        hasRegisteredAreas && !personValidationError && personConsistency.blocking.length === 0,
        hasRegisteredAreas && Boolean(personValidationError || personConsistency.blocking.length)
      )
    },
    {
      title: "3. Estrutura pronta",
      description: isPersonReadyToSave
        ? "A pessoa ja pode ser salva com a hierarquia completa."
        : "Salve apenas quando area, cargo, vinculo e relacoes estiverem consistentes.",
      tone: getGuideStepTone(
        isPersonReadyToSave,
        hasRegisteredAreas && Boolean(personValidationError || personConsistency.blocking.length)
      )
    },
    {
      title: "4. Acesso",
      description: isPersonReadyToSave
        ? "Use Salvar e criar usuario para seguir sem perder o contexto."
        : "A liberacao do acesso vem logo depois da estrutura ficar pronta.",
      tone: getGuideStepTone(false, isPersonReadyToSave)
    }
  ];

  return (
    <section className="page-grid">
      {canManagePeopleRegistry ? (
        <div className="card card-span compact-card">
          <div className="card-header">
            <h3>Fluxo de hierarquia</h3>
            <span>Pessoas passam a ser o centro do cadastro organizacional</span>
          </div>
          <div className="people-flow-grid">
            <form className="list-card compact-list-card admin-form-card people-primary-form" onSubmit={handlePersonSubmit}>
              <div className="card-header">
                <h3>Nova pessoa</h3>
                <span>Defina a hierarquia da pessoa em um unico fluxo</span>
              </div>
              <Input
                label="Nome"
                placeholder="Ex.: Maria Clara Souza"
                value={personForm.name}
                onChange={(value) => setPersonForm({ ...personForm, name: value })}
              />
              <Input
                label="Cargo"
                placeholder="Ex.: Analista de Compliance"
                value={personForm.roleTitle}
                onChange={(value) => setPersonForm({ ...personForm, roleTitle: value })}
              />
              <Select
                label="Area"
                value={personForm.area}
                options={areaOptions.map((item) => item.value)}
                renderLabel={(value) => areaOptions.find((item) => item.value === value)?.label || value}
                disabled={!hasRegisteredAreas}
                onChange={(value) => setPersonForm({ ...personForm, area: value })}
              />
              <Select
                label="Gestor direto"
                value={personForm.managerPersonId}
                options={managerOptions.map((item) => item.value)}
                renderLabel={(value) =>
                  managerOptions.find((item) => item.value === value)?.label || value
                }
                helper="Escolha a pessoa que acompanha a rotina e aprova as entregas diretas deste colaborador."
                onChange={(value) => setPersonForm({ ...personForm, managerPersonId: value })}
              />
              <Select
                label="Lider da area"
                value={personForm.isAreaManager}
                options={["no", "yes"]}
                renderLabel={(value) => (value === "yes" ? "Sim" : "Nao")}
                helper="Use esta opcao apenas quando a pessoa for a lider atual da area selecionada."
                onChange={(value) => setPersonForm({ ...personForm, isAreaManager: value })}
              />
              <Input
                label="Unidade de trabalho"
                helper="Use o nome da base/unidade para organizar as avaliacoes entre pares."
                placeholder="Ex.: Sao Paulo"
                value={personForm.workUnit}
                onChange={(value) => setPersonForm({ ...personForm, workUnit: value })}
              />
              <Select
                label="Modalidade"
                value={personForm.workMode}
                options={workModeOptions}
                renderLabel={(value) =>
                  value === "onsite"
                    ? "Presencial"
                    : value === "remote"
                      ? "100% Home Office"
                      : "Hibrido"
                }
                onChange={(value) => setPersonForm({ ...personForm, workMode: value })}
              />
              <Select
                label="Vinculo"
                value={personForm.employmentType}
                options={["internal", "consultant"]}
                renderLabel={(value) => (value === "internal" ? "Interno" : "Consultor")}
                onChange={(value) => setPersonForm({ ...personForm, employmentType: value })}
              />
              <button className="primary-button" type="submit" disabled={!isPersonReadyToSave}>
                Cadastrar pessoa
              </button>
              <button
                className="refresh"
                type="button"
                disabled={!isPersonReadyToSave}
                onClick={() => handlePersonSubmitAndCreateUser()}
              >
                Salvar e criar usuario
              </button>
              {!hasRegisteredAreas ? (
                <small className="field-helper form-guidance-error">
                  Cadastre a primeira area para liberar o cadastro completo da pessoa.
                </small>
              ) : personConsistency.blocking.length ? (
                <small className="field-helper form-guidance-error">
                  {personConsistency.blocking[0]}
                </small>
              ) : personValidationError ? (
                <small className="field-helper form-guidance-error">{personValidationError}</small>
              ) : (
                <small className="field-helper form-guidance-success">
                  Estrutura pronta para salvar. Se quiser, siga direto para a criacao do usuario.
                </small>
              )}
            </form>

            <div className="stack-list compact-stack">
              <article className="list-card compact-list-card">
                <div className="card-header">
                  <h3>Passo a passo</h3>
                  <span>Fluxo assistido para evitar cadastros pela metade</span>
                </div>
                <div className="guide-step-grid">
                  {peopleGuideSteps.map((step) => (
                    <article className={`guide-step-card ${step.tone}`} key={step.title}>
                      <strong>{step.title}</strong>
                      <p className="muted">{step.description}</p>
                    </article>
                  ))}
                </div>
              </article>

              {personConsistency.blocking.length || personConsistency.warnings.length ? (
                <article className="list-card compact-list-card">
                  <div className="card-header">
                    <h3>Alertas do cadastro</h3>
                    <span>Validacoes aplicadas antes de salvar a nova pessoa</span>
                  </div>
                  <div className="stack-list compact-stack">
                    {personConsistency.blocking.map((message) => (
                      <article className="guide-step-card current" key={`blocking-${message}`}>
                        <strong>Bloqueio</strong>
                        <p className="muted">{message}</p>
                      </article>
                    ))}
                    {personConsistency.warnings.map((message) => (
                      <article className="guide-step-card pending" key={`warning-${message}`}>
                        <strong>Atencao</strong>
                        <p className="muted">{message}</p>
                      </article>
                    ))}
                  </div>
                </article>
              ) : null}

              {organizationalConsistencyAlerts.length ? (
                <article className="list-card compact-list-card">
                  <div className="card-header">
                    <h3>Pendencias da estrutura</h3>
                    <span>Leitura rapida do que ainda merece ajuste no cadastro existente</span>
                  </div>
                  <div className="stack-list compact-stack">
                    {organizationalConsistencyAlerts.slice(0, 5).map((message) => (
                      <article className="guide-step-card pending" key={message}>
                        <strong>Revisar</strong>
                        <p className="muted">{message}</p>
                      </article>
                    ))}
                  </div>
                </article>
              ) : null}

              <article className="list-card compact-list-card people-hierarchy-summary">
                <div className="card-header">
                  <h3>Resumo da hierarquia</h3>
                  <span>Leitura imediata da estrutura que sera criada</span>
                </div>
                <div className="hierarchy-summary-grid">
                  <div className="mini-card">
                    <p className="mini-label">Area</p>
                    <strong>{selectedArea?.name || "Selecione uma area"}</strong>
                  </div>
                  <div className="mini-card">
                    <p className="mini-label">Gestor direto</p>
                    <strong>{selectedManager}</strong>
                  </div>
                  <div className="mini-card">
                    <p className="mini-label">Lider da area</p>
                    <strong>{hierarchyLeadLabel}</strong>
                  </div>
                  <div className="mini-card">
                    <p className="mini-label">Modalidade</p>
                    <strong>
                      {personForm.workMode === "onsite"
                        ? "Presencial"
                        : personForm.workMode === "remote"
                          ? "100% Home Office"
                          : "Hibrido"}
                    </strong>
                  </div>
                </div>
                <div className="stack-list compact-stack">
                  <article className="compact-list-card hierarchy-step-card">
                    <strong>1. Area</strong>
                    <p className="muted">Cadastre a area apenas se ela ainda nao existir.</p>
                  </article>
                  <article className="compact-list-card hierarchy-step-card">
                    <strong>2. Pessoa</strong>
                    <p className="muted">Defina area, gestor direto, unidade, modalidade e vinculo.</p>
                  </article>
                  <article className="compact-list-card hierarchy-step-card">
                    <strong>3. Lideranca</strong>
                    <p className="muted">
                      Use o campo de lider da area para definir a responsavel atual pela area.
                    </p>
                  </article>
                  <article className="compact-list-card hierarchy-step-card">
                    <strong>4. Acesso</strong>
                    <p className="muted">Crie o usuario depois que a estrutura da pessoa estiver pronta.</p>
                  </article>
                </div>
              </article>

              <article className="list-card compact-list-card">
                <div className="card-header">
                  <h3>Jornada de acesso</h3>
                  <span>Feche a estrutura da pessoa e siga para o usuario sem perder o contexto</span>
                </div>
                <div className="stack-list compact-stack">
                  <article className="compact-list-card hierarchy-step-card">
                    <strong>Estrutura pronta</strong>
                    <p className="muted">Quando a pessoa ja tiver area, gestor direto, unidade e modalidade.</p>
                  </article>
                  <article className="compact-list-card hierarchy-step-card">
                    <strong>Acesso pendente</strong>
                    <p className="muted">Use o botao de criar usuario para concluir o provisionamento logo em seguida.</p>
                  </article>
                </div>
              </article>

              <form className="list-card compact-list-card admin-form-card" onSubmit={handleAreaSubmit}>
                <div className="card-header">
                  <h3>Nova area</h3>
                  <span>Cadastre a area primeiro e volte para concluir a hierarquia pela pessoa.</span>
                </div>
                <Input
                  label="Nome da area"
                  placeholder="Ex.: Tecnologia"
                  value={areaForm.name}
                  onChange={(value) => setAreaForm({ ...areaForm, name: value })}
                  helper="A lideranca da area sera definida no cadastro da pessoa."
                />
                <button className="primary-button" type="submit">
                  Cadastrar area
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      <div className="card compact-card">
        <div className="card-header">
          <h3>Estrutura de pessoas</h3>
          <span>
            {canManagePeopleRegistry
              ? "Hierarquia viva da organizacao, com gestor direto e lideranca da area"
              : "Areas visiveis dentro do seu escopo"}
          </span>
        </div>
        <div className="stack-list compact-stack">
          {people.map((person) =>
            canManagePeopleRegistry ? (
              <PersonStructureCard
                key={person.id}
                areaOptions={areaOptions}
                accessState={personAccessStateById[person.id]}
                managerOptions={managerOptions}
                onSave={handlePersonUpdate}
                onPrepareUserProvisioning={onPrepareUserProvisioning}
                person={person}
              />
            ) : (
              <article className="list-card compact-list-card" key={person.id}>
                <div className="row">
                  <strong>{person.name}</strong>
                  <span className="badge">
                    {person.areaManagerPersonId === person.id
                      ? "Lider da area"
                      : getEmploymentTypeLabel(person.employmentType)}
                  </span>
                </div>
                <p className="muted">{person.roleTitle}</p>
                <p className="muted">
                  {person.area} | Gestor direto: {person.managerName || "-"}
                </p>
                <p className="muted">
                  Unidade: {person.workUnit || "-"} | Modalidade:{" "}
                  {person.workMode === "onsite"
                    ? "Presencial"
                    : person.workMode === "remote"
                      ? "100% Home Office"
                      : "Hibrido"}
                </p>
                <p className="muted">
                  {getAccessJourneyLabel(
                    personAccessStateById[person.id]?.key,
                    personAccessStateById[person.id]?.user
                  )}
                </p>
              </article>
            )
          )}
        </div>
      </div>

      <div className="card compact-card">
        <div className="card-header">
          <h3>Areas e liderancas</h3>
          <span>
            {canManagePeopleRegistry
              ? "A area passa a ser um cadastro minimo e a lideranca vem das pessoas"
              : "Perfis visiveis dentro do seu escopo"}
          </span>
        </div>
        <div className="stack-list compact-stack">
          {areas.map((area) =>
            canManagePeopleRegistry ? (
              <AreaAdminCard
                key={area.id}
                area={area}
                onSave={handleAreaUpdate}
              />
            ) : (
              <article className="list-card compact-list-card" key={area.id}>
                <div className="row">
                  <strong>{area.name}</strong>
                  <span className="badge">{area.peopleCount} pessoas</span>
                </div>
                <p className="muted">Lider atual da area: {area.managerName || "Nao definido"}</p>
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
  accessJourneySummary,
  auditEntries,
  availableUserPeopleOptions,
  formatDate,
  handleUserPersonSelect,
  handleUserSubmit,
  handleUserUpdate,
  onPrepareUserProvisioning,
  pendingAccessPeople,
  selectedUserPerson,
  setUserForm,
  suggestedUserEmail,
  suggestedUserRole,
  suggestedUserRoleReason,
  userForm,
  userRoleOptions,
  userStatusOptions,
  users
}) {
  const hasPendingAccess = pendingAccessPeople.length > 0;
  const userValidationError = hasPendingAccess ? validateUserPayload(userForm) : "";
  const userConsistency = getUserConsistencyMessages(userForm, {
    selectedPerson: selectedUserPerson,
    suggestedRole: suggestedUserRole
  });
  const hasCredentialStep =
    Boolean(String(userForm.email || "").trim()) && String(userForm.password || "").trim().length >= 6;
  const hasProfileStep = Boolean(String(userForm.roleKey || "").trim()) && Boolean(String(userForm.status || "").trim());
  const isUserReadyToCreate = hasPendingAccess && !userValidationError;
  const userGuideSteps = [
    {
      title: "1. Pessoa pronta",
      description: selectedUserPerson
        ? "A pessoa selecionada ja veio da etapa de estrutura."
        : "Escolha uma pessoa com acesso pendente para iniciar.",
      tone: getGuideStepTone(Boolean(selectedUserPerson), !selectedUserPerson)
    },
    {
      title: "2. Credenciais",
      description: hasCredentialStep
        ? "Email e senha inicial prontos."
        : "Defina email valido e senha inicial com pelo menos 6 caracteres.",
      tone: getGuideStepTone(hasCredentialStep, Boolean(selectedUserPerson) && !hasCredentialStep)
    },
    {
      title: "3. Perfil de acesso",
      description: hasProfileStep
        ? "Perfil e status configurados."
        : "Escolha perfil e status para concluir o provisionamento.",
      tone: getGuideStepTone(hasProfileStep, hasCredentialStep && !hasProfileStep)
    },
    {
      title: "4. Criacao",
      description: isUserReadyToCreate
        ? "O acesso ja pode ser criado."
        : userValidationError || "Finalize as etapas anteriores para liberar o botao de criacao.",
      tone: getGuideStepTone(isUserReadyToCreate, hasPendingAccess && !isUserReadyToCreate)
    }
  ];

  return (
    <section className="page-grid">
      <div className="card compact-card">
        <div className="card-header">
          <h3>Jornada de acesso</h3>
          <span>Visualize quem ja concluiu o acesso e quem ainda depende de provisionamento</span>
        </div>
        <div className="access-journey-grid">
          <div className="mini-card">
            <p className="mini-label">Estrutura cadastrada</p>
            <strong>{accessJourneySummary.totalPeople}</strong>
          </div>
          <div className="mini-card">
            <p className="mini-label">Acessos ativos</p>
            <strong>{accessJourneySummary.active}</strong>
          </div>
          <div className="mini-card">
            <p className="mini-label">Acessos pendentes</p>
            <strong>{accessJourneySummary.pending}</strong>
          </div>
          <div className="mini-card">
            <p className="mini-label">Acessos inativos</p>
            <strong>{accessJourneySummary.inactive}</strong>
          </div>
        </div>
        <div className="stack-list compact-stack">
          {pendingAccessPeople.length ? (
            pendingAccessPeople.slice(0, 5).map((person) => (
              <article className="compact-list-card pending-access-card" key={person.id}>
                <div className="row">
                  <strong>{person.name}</strong>
                  <span className="badge">Acesso pendente</span>
                </div>
                <p className="muted">
                  {person.roleTitle} | {person.area}
                </p>
                <p className="muted">
                  Gestor direto: {person.managerName || "Nao definido"} | Unidade: {person.workUnit || "-"}
                </p>
                <button
                  className="refresh"
                  type="button"
                  onClick={() => onPrepareUserProvisioning(person.id)}
                >
                  Preparar acesso
                </button>
              </article>
            ))
          ) : (
            <article className="compact-list-card pending-access-card">
              <strong>Nenhum acesso pendente</strong>
              <p className="muted">Todas as pessoas cadastradas ja possuem usuario vinculado.</p>
            </article>
          )}
        </div>
      </div>

      <div className="card compact-card">
        <div className="card-header">
          <h3>Passo a passo</h3>
          <span>Provisionamento assistido para reduzir retrabalho na criacao de acessos</span>
        </div>
        <div className="guide-step-grid">
          {userGuideSteps.map((step) => (
            <article className={`guide-step-card ${step.tone}`} key={step.title}>
              <strong>{step.title}</strong>
              <p className="muted">{step.description}</p>
            </article>
          ))}
        </div>
      </div>

      {userConsistency.warnings.length ? (
        <div className="card compact-card">
          <div className="card-header">
            <h3>Alertas do acesso</h3>
            <span>Conferencias de coerencia antes de criar ou ajustar o usuario</span>
          </div>
          <div className="stack-list compact-stack">
            {userConsistency.warnings.map((message) => (
              <article className="guide-step-card pending" key={message}>
                <strong>Atencao</strong>
                <p className="muted">{message}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <form className="card compact-card admin-form-card" onSubmit={handleUserSubmit}>
        <div className="card-header">
          <h3>Novo usuario</h3>
          <span>Crie o acesso depois que a pessoa ja estiver posicionada na hierarquia</span>
        </div>
        <Select
          label="Pessoa"
          value={userForm.personId}
          options={availableUserPeopleOptions.map((item) => item.value)}
          renderLabel={(value) =>
            availableUserPeopleOptions.find((item) => item.value === value)?.label || value
          }
          onChange={(value) => handleUserPersonSelect(value)}
          helper="Somente pessoas sem usuario vinculado aparecem aqui."
        />
        {selectedUserPerson ? (
          <article className="list-card compact-list-card">
            <div className="row">
              <strong>{selectedUserPerson.name}</strong>
              <span className="badge">{getEmploymentTypeLabel(selectedUserPerson.employmentType)}</span>
            </div>
            <p className="muted">
              {selectedUserPerson.roleTitle} | {selectedUserPerson.area}
            </p>
            <p className="muted">
              Gestor direto: {selectedUserPerson.managerName || "Nao definido"} | Lider da area:{" "}
              {selectedUserPerson.areaManagerName || "Nao definido"}
            </p>
            <p className="muted">
              Unidade: {selectedUserPerson.workUnit || "-"} | Modalidade:{" "}
              {selectedUserPerson.workMode === "onsite"
                ? "Presencial"
                : selectedUserPerson.workMode === "remote"
                  ? "100% Home Office"
                  : "Hibrido"}
            </p>
            <p className="muted">
              Perfil sugerido: {getRoleLabel(suggestedUserRole)} · {suggestedUserRoleReason}
            </p>
          </article>
        ) : null}
        <Input
          label="Email"
          type="email"
          placeholder="nome.sobrenome@empresa.com"
          helper={
            suggestedUserEmail
              ? `Sugestao automatica: ${suggestedUserEmail}`
              : "Defina o email que sera usado no login."
          }
          value={userForm.email}
          onChange={(value) => setUserForm({ ...userForm, email: value })}
        />
        <Input
          label="Senha inicial"
          type="password"
          helper="Minimo de 6 caracteres. Use uma senha temporaria para o primeiro acesso."
          value={userForm.password}
          onChange={(value) => setUserForm({ ...userForm, password: value })}
        />
        <Select
          label="Perfil de acesso"
          value={userForm.roleKey}
          options={userRoleOptions}
          renderLabel={(value) => getRoleLabel(value)}
          helper={getSuggestedRoleDescription(userForm.roleKey)}
          onChange={(value) => setUserForm({ ...userForm, roleKey: value })}
        />
        <Select
          label="Status"
          value={userForm.status}
          options={userStatusOptions}
          onChange={(value) => setUserForm({ ...userForm, status: value })}
        />
        <button className="primary-button" type="submit" disabled={!isUserReadyToCreate}>
          Criar usuario
        </button>
        {!hasPendingAccess ? (
          <small className="field-helper form-guidance-success">
            Todas as pessoas cadastradas ja possuem usuario vinculado.
          </small>
        ) : userValidationError ? (
          <small className="field-helper form-guidance-error">{userValidationError}</small>
        ) : (
          <small className="field-helper form-guidance-success">
            Provisionamento pronto. O acesso pode ser criado com segurança.
          </small>
        )}
      </form>

      <div className="card compact-card">
        <div className="card-header">
          <h3>Usuarios ativos e inativos</h3>
          <span>Acompanhe o perfil de acesso com contexto de hierarquia e area</span>
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
