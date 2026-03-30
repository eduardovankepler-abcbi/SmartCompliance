import { EvaluationInsightsPanel } from "./EvaluationInsightsPanel";
import { EvaluationLibraryPanel } from "./EvaluationLibraryPanel";
import { EvaluationResponsePanel } from "./EvaluationResponsePanel";
import { FeedbackRequestPanel } from "./FeedbackRequestPanel";
import { AuditTrailPanel } from "../components/AuditTrailPanel";

export function EvaluationsSection(props) {
  const {
    Input,
    Select,
    Textarea,
    activeCycleModuleSummary,
    activeEvaluationCycleId,
    activeEvaluationModule,
    activeEvaluationModuleMeta,
    activeEvaluationWorkspace,
    auditEntries,
    canManageCycles,
    canManageFeedbackRequests,
    canViewEvaluationInsights,
    canViewEvaluationLibrary,
    canViewEvaluationOperations,
    comparisonCycleModuleSummary,
    cycleComparisonHighlights,
    comparisonCycleOptions,
    comparisonEvaluationCycleId,
    cycleForm,
    cycles,
    evaluationCycleHistory,
    evaluationCycleOptions,
    evaluationLibrary,
    evaluationModuleOptions,
    feedbackProviderOptions,
    feedbackRequestCycleOptions,
    feedbackRequestForm,
    filteredFeedbackRequests,
    formatDate,
    getCycleStatusDescription,
    getFeedbackRequestStatusLabel,
    handleCustomLibraryImport,
    handleCustomLibraryTemplateDownload,
    handleCustomLibraryPublish,
    handleCycleStatusChange,
    handleCycleSubmit,
    handleFeedbackProviderToggle,
    handleFeedbackRequestReview,
    handleFeedbackRequestSubmit,
    roleKey,
    setActiveEvaluationCycleId,
    setActiveEvaluationModule,
    setActiveEvaluationWorkspace,
    setComparisonEvaluationCycleId,
    setCustomLibraryPublishForm,
    setCycleForm,
    setFeedbackRequestForm,
    setShowEvaluationLibrary,
    showEvaluationLibrary
  } = props;

  const isIndividualJourney = roleKey === "employee";
  const shouldShowPublishedCycles = !isIndividualJourney;
  const isRespondWorkspace = activeEvaluationWorkspace === "respond";
  const isInsightsWorkspace = activeEvaluationWorkspace === "insights";
  const isOperationsWorkspace = activeEvaluationWorkspace === "operations";

  return (
    <section className="page-grid">
      <div className={isIndividualJourney ? "card card-span compact-card" : "card card-span"}>
        <div className="card-header">
          <div>
            <h3>{isIndividualJourney ? "Minhas avaliacoes" : "Submodulos de avaliacao"}</h3>
            <span>
              {isIndividualJourney
                ? "Escolha o fluxo e responda os assignments pendentes do ciclo ativo"
                : "Navegue pelos fluxos do ciclo ativo"}
            </span>
          </div>
          <div className="action-row">
            {canViewEvaluationInsights || canViewEvaluationOperations ? (
              <div className="evaluation-workspace-tabs">
                <button
                  type="button"
                  className={
                    isRespondWorkspace
                      ? "button-reset module-tab active"
                      : "button-reset module-tab"
                  }
                  onClick={() => setActiveEvaluationWorkspace("respond")}
                >
                  <span className="module-tab-title">Responder</span>
                </button>
                {canViewEvaluationInsights ? (
                  <button
                    type="button"
                    className={
                      isInsightsWorkspace
                        ? "button-reset module-tab active"
                        : "button-reset module-tab"
                    }
                    onClick={() => setActiveEvaluationWorkspace("insights")}
                  >
                    <span className="module-tab-title">Leituras</span>
                  </button>
                ) : null}
                {canViewEvaluationOperations ? (
                  <button
                    type="button"
                    className={
                      isOperationsWorkspace
                        ? "button-reset module-tab active"
                        : "button-reset module-tab"
                    }
                    onClick={() => setActiveEvaluationWorkspace("operations")}
                  >
                    <span className="module-tab-title">Operacao</span>
                  </button>
                ) : null}
              </div>
            ) : null}
            {canViewEvaluationLibrary && isOperationsWorkspace ? (
              <button
                type="button"
                className="refresh"
                onClick={() => setShowEvaluationLibrary((current) => !current)}
              >
                {showEvaluationLibrary ? "Ocultar biblioteca" : "Biblioteca"}
              </button>
            ) : null}
          </div>
        </div>
        <div className="module-toolbar">
          {evaluationModuleOptions.map((module) => (
            <button
              key={module.key}
              type="button"
              className={
                activeEvaluationModule === module.key
                  ? "button-reset module-tab active"
                  : "button-reset module-tab"
              }
              onClick={() => setActiveEvaluationModule(module.key)}
            >
              <span className="module-tab-title">{module.label}</span>
              <span className="module-tab-meta">{module.pendingAssignments} pend.</span>
            </button>
          ))}
        </div>
        <div className="evaluation-cycle-toolbar">
          <Select
            label="Ciclo ativo"
            value={activeEvaluationCycleId}
            options={evaluationCycleOptions.map((cycle) => cycle.id)}
            renderLabel={(value) =>
              evaluationCycleOptions.find((cycle) => cycle.id === value)?.title || value
            }
            onChange={setActiveEvaluationCycleId}
          />
        </div>
        {activeEvaluationModuleMeta ? (
          <div className="list-card evaluation-module-spotlight">
            <div className="row">
              <div>
                <strong>{activeEvaluationModuleMeta.label}</strong>
                <p className="muted">{activeEvaluationModuleMeta.audience}</p>
              </div>
              <span className="badge">
                {activeCycleModuleSummary?.pendingAssignments ?? 0} pendentes
              </span>
            </div>
            <p className="muted">{activeEvaluationModuleMeta.description}</p>
            <div className="metrics-grid evaluation-cycle-metrics">
              <MiniMetric
                label="Assignments"
                value={activeCycleModuleSummary?.totalAssignments ?? 0}
              />
              <MiniMetric
                label="Respostas visiveis"
                value={activeCycleModuleSummary?.visibleResponses ?? 0}
              />
              <MiniMetric
                label="Conclusao"
                value={`${activeCycleModuleSummary?.completionRate ?? 0}%`}
              />
            </div>
          </div>
        ) : null}
      </div>

      <EvaluationInsightsPanel
        Select={Select}
        activeCycleModuleSummary={activeCycleModuleSummary}
        activeEvaluationCycleId={activeEvaluationCycleId}
        activeEvaluationWorkspace={activeEvaluationWorkspace}
        canViewEvaluationInsights={canViewEvaluationInsights}
        cycleComparisonHighlights={cycleComparisonHighlights}
        comparisonCycleModuleSummary={comparisonCycleModuleSummary}
        comparisonCycleOptions={comparisonCycleOptions}
        comparisonEvaluationCycleId={comparisonEvaluationCycleId}
        evaluationCycleHistory={evaluationCycleHistory}
        formatDate={formatDate}
        setActiveEvaluationCycleId={setActiveEvaluationCycleId}
        setComparisonEvaluationCycleId={setComparisonEvaluationCycleId}
      />

      <EvaluationLibraryPanel
        Input={Input}
        Textarea={Textarea}
        canViewEvaluationLibrary={canViewEvaluationLibrary}
        customLibraryDraft={props.customLibraryDraft}
        customLibraryPublishForm={props.customLibraryPublishForm}
        evaluationLibrary={evaluationLibrary}
        handleCustomLibraryImport={handleCustomLibraryImport}
        handleCustomLibraryTemplateDownload={handleCustomLibraryTemplateDownload}
        handleCustomLibraryPublish={handleCustomLibraryPublish}
        setCustomLibraryPublishForm={setCustomLibraryPublishForm}
        showEvaluationLibrary={showEvaluationLibrary}
      />

      {canManageCycles && isOperationsWorkspace ? (
        <form className="card" onSubmit={handleCycleSubmit}>
          <div className="card-header">
            <h3>Novo ciclo</h3>
            <span>Distribuicao automatica com liberacao posterior</span>
          </div>
          <Input
            label="Titulo"
            value={cycleForm.title}
            onChange={(value) => setCycleForm({ ...cycleForm, title: value })}
          />
          <Input
            label="Semestre"
            value={cycleForm.semesterLabel}
            onChange={(value) => setCycleForm({ ...cycleForm, semesterLabel: value })}
          />
          <Input
            label="Prazo"
            type="date"
            value={cycleForm.dueDate}
            onChange={(value) => setCycleForm({ ...cycleForm, dueDate: value })}
          />
          <Input
            label="Grupo alvo"
            value={cycleForm.targetGroup}
            onChange={(value) => setCycleForm({ ...cycleForm, targetGroup: value })}
          />
          <button className="primary-button" type="submit">
            Criar em planejamento
          </button>
        </form>
      ) : shouldShowPublishedCycles && isOperationsWorkspace ? (
        <div className="card card-span">
          <div className="card-header">
            <h3>Ciclos publicados</h3>
            <span>Status visivel para acompanhamento do semestre</span>
          </div>
          <div className="metrics-grid">
            {cycles.map((cycle) => (
              <div className="mini-card" key={cycle.id}>
                <div className="row">
                  <p className="mini-label">{cycle.semesterLabel}</p>
                  <span className="badge">{cycle.status}</span>
                </div>
                <strong>{cycle.title}</strong>
                <p className="muted">{getCycleStatusDescription(cycle.status)}</p>
                <p className="muted">Prazo: {formatDate(cycle.dueDate)}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {canManageCycles && isOperationsWorkspace ? (
        <div className="card card-span">
          <div className="card-header">
            <h3>Ciclos ativos</h3>
            <span>Controle de liberacao e encerramento</span>
          </div>
          <div className="metrics-grid">
            {cycles.map((cycle) => (
              <div className="mini-card" key={cycle.id}>
                <div className="row">
                  <p className="mini-label">{cycle.semesterLabel}</p>
                  <span className="badge">{cycle.status}</span>
                </div>
                <strong>{cycle.title}</strong>
                <p className="muted">{cycle.targetGroup}</p>
                <p className="muted">{getCycleStatusDescription(cycle.status)}</p>
                <p className="muted">Prazo: {formatDate(cycle.dueDate)}</p>
                <div className="row">
                  {cycle.status === "Planejamento" ? (
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => handleCycleStatusChange(cycle.id, "Liberado")}
                    >
                      Liberar ciclo
                    </button>
                  ) : null}
                  {cycle.status === "Liberado" ? (
                    <button
                      type="button"
                      className="refresh"
                      onClick={() => handleCycleStatusChange(cycle.id, "Encerrado")}
                    >
                      Encerrar ciclo
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <FeedbackRequestPanel
        Select={Select}
        Textarea={Textarea}
        activeEvaluationModuleMeta={activeEvaluationModuleMeta}
        activeEvaluationWorkspace={activeEvaluationWorkspace}
        canManageFeedbackRequests={canManageFeedbackRequests}
        feedbackProviderOptions={feedbackProviderOptions}
        feedbackRequestCycleOptions={feedbackRequestCycleOptions}
        feedbackRequestForm={feedbackRequestForm}
        filteredFeedbackRequests={filteredFeedbackRequests}
        formatDate={formatDate}
        getFeedbackRequestStatusLabel={getFeedbackRequestStatusLabel}
        handleFeedbackProviderToggle={handleFeedbackProviderToggle}
        handleFeedbackRequestReview={handleFeedbackRequestReview}
        handleFeedbackRequestSubmit={handleFeedbackRequestSubmit}
        setFeedbackRequestForm={setFeedbackRequestForm}
      />

      {!isIndividualJourney && isOperationsWorkspace ? (
        <AuditTrailPanel
          entries={auditEntries.slice(0, 6)}
          emptyMessage="Criacoes de ciclo, liberacoes e aprovacoes de feedback aparecerao aqui."
          formatDate={formatDate}
          subtitle="Mudancas operacionais recentes do ciclo"
          title="Trilha do ciclo"
        />
      ) : null}

      <EvaluationResponsePanel
        Select={Select}
        Textarea={Textarea}
        activeCycleModuleSummary={activeCycleModuleSummary}
        activeEvaluationModuleMeta={activeEvaluationModuleMeta}
        activeEvaluationWorkspace={activeEvaluationWorkspace}
        answerForm={props.answerForm}
        assignmentDetail={props.assignmentDetail}
        canViewEvaluationInsights={canViewEvaluationInsights}
        canViewResponses={props.canViewResponses}
        developmentNote={props.developmentNote}
        filteredAggregateResponses={props.filteredAggregateResponses}
        filteredAssignments={props.filteredAssignments}
        filteredIndividualResponses={props.filteredIndividualResponses}
        formatDate={formatDate}
        getCycleStatusDescription={getCycleStatusDescription}
        getRelationshipDescription={props.getRelationshipDescription}
        getRelationshipLabel={props.getRelationshipLabel}
        getVisibilityLabel={props.getVisibilityLabel}
        handleAssignmentSubmit={props.handleAssignmentSubmit}
        selectedAssignment={props.selectedAssignment}
        setAnswerForm={props.setAnswerForm}
        setDevelopmentNote={props.setDevelopmentNote}
        setSelectedAssignment={props.setSelectedAssignment}
        setStrengthsNote={props.setStrengthsNote}
        strengthsNote={props.strengthsNote}
      />

      {isOperationsWorkspace ? (
        <div className="card card-span compact-card evaluation-operations-summary">
          <div className="card-header">
            <h3>Operacao do submodulo</h3>
            <span>Governanca, biblioteca e tratamento reunidos em uma area separada</span>
          </div>
          <div className="metrics-grid">
            <div className="mini-card">
              <p className="mini-label">Submodulo</p>
              <strong>{activeEvaluationModuleMeta?.label || "Fluxo ativo"}</strong>
            </div>
            <div className="mini-card">
              <p className="mini-label">Ciclo em foco</p>
              <strong>{activeCycleModuleSummary?.title || "Sem ciclo ativo"}</strong>
            </div>
            <div className="mini-card">
              <p className="mini-label">Assignments</p>
              <strong>{activeCycleModuleSummary?.totalAssignments ?? 0}</strong>
            </div>
            <div className="mini-card">
              <p className="mini-label">Pendentes</p>
              <strong>{activeCycleModuleSummary?.pendingAssignments ?? 0}</strong>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="mini-card">
      <p className="mini-label">{label}</p>
      <strong>{value}</strong>
    </div>
  );
}
