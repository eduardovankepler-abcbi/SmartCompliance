export { DashboardOperationsPanels } from "./DashboardAnalyticalPanels.jsx";
export { DashboardInsightPanels } from "./DashboardInsightPanels.jsx";

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
  priorityActions,
  quickActions,
  setDashboardAnalyticalTheme,
  setDashboardAreaFilter,
  setDashboardCompositionFilter,
  setDashboardTimeGrouping,
  setDashboardViewMode,
  storyCards,
  topKpis
}) {
  return (
    <>
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
        <>
          <div className="card-span dashboard-section-band summary">
            <div className="dashboard-section-band-copy">
              <span>Resumo</span>
              <strong>Indicadores analiticos do recorte</strong>
            </div>
            <p>Visao de base para aprofundar volume, distribuicao e variacoes do ciclo.</p>
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
