export { DashboardOperationsPanels } from "./DashboardAnalyticalPanels.jsx";
export { DashboardInsightPanels } from "./DashboardInsightPanels.jsx";

export function DashboardExecutiveHealthSection({ DashboardCardHeader, priorityActions, topKpis }) {
  return (
    <div className="card card-span dashboard-decision-card dashboard-executive-health-card">
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
              <div className="dashboard-kpi-inline-head">
                <span>{item.label}</span>
                <b>{item.tone}</b>
              </div>
              <strong>{item.value}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
        <div className="dashboard-priority-panel">
          <div className="dashboard-priority-panel-head">
            <strong>Sinais prioritarios</strong>
            <span>{priorityActions.length} leituras</span>
          </div>
          <div className="dashboard-priority-queue">
            {priorityActions.map((item) => (
              <article className={`dashboard-priority-card ${item.tone}`} key={item.title}>
                <div className="dashboard-priority-card-head">
                  <span className="mini-label">{item.label}</span>
                  <b>{item.tone}</b>
                </div>
                <strong>{item.title}</strong>
                <p className="muted">{item.detail}</p>
                <span>{item.action}</span>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardTopPanels({
  DashboardCardHeader,
  DashboardFilterSelectCard,
  analyticalThemes,
  canFilterDashboardByArea,
  dashboard,
  dashboardAnalyticalTheme,
  dashboardAreaFilter,
  dashboardCompositionFilter,
  dashboardCompositionOptions,
  dashboardHeadline,
  dashboardTimeGrouping,
  dashboardTimeGroupingOptions,
  executiveHighlights,
  focusPills,
  isExecutiveView,
  onSectionChange,
  profileName,
  quickActions,
  setDashboardAnalyticalTheme,
  setDashboardAreaFilter,
  setDashboardCompositionFilter,
  setDashboardTimeGrouping,
  setDashboardViewMode,
  storyCards
}) {
  const areaFilterOptions = canFilterDashboardByArea
    ? ["all", ...((dashboard?.areaOptions) || [])]
    : [dashboard?.mode === "team" ? "team" : "scope"];

  const renderAreaFilterLabel = (value) => {
    if (canFilterDashboardByArea) {
      return value === "all" ? "Todas as areas e setores" : value;
    }

    if (dashboard?.mode === "team") {
      return "Equipe direta";
    }

    return dashboard?.scopeLabel || "Escopo atual";
  };

  return (
    <>
      <div className="card card-span dashboard-command-card">
        <div className="dashboard-command-hero">
          <div className="dashboard-command-copy">
            <div className="dashboard-command-kicker">
              <p className="eyebrow">
                {dashboard?.mode === "executive"
                  ? "Painel do administrador"
                  : dashboard?.mode === "team"
                    ? "Painel gerencial"
                    : "Painel individual"}
              </p>
              <span className="badge">Painel {isExecutiveView ? "executivo" : "analitico"}</span>
            </div>
            <p className="dashboard-command-headline">{dashboardHeadline}</p>
            <p className="muted">
              {dashboard?.notice || `Contexto de leitura para ${profileName || "time"}.`}
            </p>
          </div>
          <div className="dashboard-command-controls">
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
        <div className="dashboard-filter-toolbar" aria-label="Filtros do dashboard">
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
              options={areaFilterOptions}
              renderLabel={renderAreaFilterLabel}
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
      </div>

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
            title="Sintese rapida do recorte"
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
        <>
          <div className="card-span dashboard-section-band summary">
            <div className="dashboard-section-band-copy">
              <span>Resumo</span>
              <strong>Indicadores-base do recorte</strong>
            </div>
            <p>Base para aprofundar volume, distribuicao e variacoes do ciclo com mais contexto.</p>
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
                dashboard?.mode === "executive"
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
        </>
      ) : null}
    </>
  );
}
