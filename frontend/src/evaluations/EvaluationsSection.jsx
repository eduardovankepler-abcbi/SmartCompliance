import { EvaluationInsightsPanel } from "./EvaluationInsightsPanel";
import { EvaluationLibraryPanel } from "./EvaluationLibraryPanel";
import { EvaluationResponsePanel } from "./EvaluationResponsePanel";
import { FeedbackRequestPanel } from "./FeedbackRequestPanel";
import { AuditTrailPanel } from "../components/AuditTrailPanel";
import { getRelationshipLabel } from "../appLabels.js";

const EmptyComponent = () => null;

function NativeInputField({
  label,
  value = "",
  onChange,
  type = "text"
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NativeSelectField({ label, value = "", options = [], onChange, renderLabel }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {renderLabel ? renderLabel(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}

function NativeTextareaField({ label, value = "", rows = 4, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function getWorkModeLabel(value) {
  switch (value) {
    case "onsite":
      return "Presencial";
    case "remote":
      return "100% home office";
    case "hybrid":
      return "Hibrido";
    default:
      return value || "-";
  }
}

export function EvaluationsSection(props) {
  const {
    Input,
    Select,
    Textarea,
    activeCycleModuleSummary,
    activeEvaluationCycleId,
    evaluationCycleStructure,
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
    competencies,
    cycleForm,
    cycles,
    evaluationCycleHistory,
    evaluationCycleOptions,
    evaluationOperationNotice,
    evaluationOperationWorkModeFilter,
    evaluationOperationWorkModeOptions,
    evaluationOperationWorkUnitFilter,
    evaluationOperationWorkUnitOptions,
    evaluationLibrary,
    evaluationModuleOptions,
    feedbackProviderOptions,
    feedbackRequestCycleOptions,
    feedbackRequestForm,
    filteredReceivedManagerFeedback,
    filteredEvaluationCycleStructure,
    filteredFeedbackRequests,
    formatDate,
    getCycleStatusDescription,
    getFeedbackRequestStatusLabel,
    handleCompetencyCreate,
    handleCompetencyUpdate,
    handleCustomLibraryImport,
    handleCustomLibraryUpdate,
    handleCustomLibraryTemplateDownload,
    handleCustomLibraryPublish,
    handleCycleStatusChange,
    handleCycleEnabledToggle,
    handleCycleModuleToggle,
    handleCycleSubmit,
    handleFeedbackProviderToggle,
    handleFeedbackRequestReview,
    handleFeedbackRequestSubmit,
    handleNotifyDelinquents,
    handleReceivedManagerFeedbackSubmit,
    receivedManagerFeedbackDrafts,
    roleKey,
    setActiveEvaluationCycleId,
    setActiveEvaluationModule,
    setActiveEvaluationWorkspace,
    setComparisonEvaluationCycleId,
    setCustomLibraryPublishForm,
    setCycleForm,
    setEvaluationOperationWorkModeFilter,
    setEvaluationOperationWorkUnitFilter,
    setFeedbackRequestForm,
    setReceivedManagerFeedbackDraft,
    setShowEvaluationLibrary,
    showEvaluationLibrary
  } = props;
  const SafeEvaluationInsightsPanel = EvaluationInsightsPanel || EmptyComponent;
  const SafeEvaluationLibraryPanel = EvaluationLibraryPanel || EmptyComponent;
  const SafeEvaluationResponsePanel = EvaluationResponsePanel || EmptyComponent;
  const SafeFeedbackRequestPanel = FeedbackRequestPanel || EmptyComponent;
  const SafeAuditTrailPanel = AuditTrailPanel || EmptyComponent;
  const SafeInput = Input || NativeInputField;
  const SafeSelect = Select || NativeSelectField;
  const SafeTextarea = Textarea || NativeTextareaField;

  const isIndividualJourney = roleKey === "employee";
  const shouldShowPublishedCycles = !isIndividualJourney;
  const isRespondWorkspace = activeEvaluationWorkspace === "respond";
  const isInsightsWorkspace = activeEvaluationWorkspace === "insights";
  const isOperationsWorkspace = activeEvaluationWorkspace === "operations";
  const operationsStructure = filteredEvaluationCycleStructure || evaluationCycleStructure;
  const hasOperationFilters =
    evaluationOperationWorkUnitFilter !== "all" || evaluationOperationWorkModeFilter !== "all";
  const cycleRelationshipTypes = [
    "self",
    "company",
    "leader",
    "manager",
    "peer",
    "cross-functional",
    "client-internal",
    "client-external"
  ];

  return (
    <section className="page-grid">
      <div className={isIndividualJourney ? "card card-span compact-card" : "card card-span"}>
        <div className="card-header">
          <div>
            <h3>{isIndividualJourney ? "Minhas avaliacoes" : "Submodulos de avaliacao"}</h3>
            <span>
              {isIndividualJourney ? "Ciclo ativo" : "Fluxos do ciclo ativo"}
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
          {(evaluationModuleOptions || []).map((module) => (
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
          {(evaluationCycleOptions || []).length > 1 ? (
            <SafeSelect
              label="Ciclo ativo"
              value={activeEvaluationCycleId}
              options={(evaluationCycleOptions || []).map((cycle) => cycle.id)}
              renderLabel={(value) =>
                (evaluationCycleOptions || []).find((cycle) => cycle.id === value)?.title || value
              }
              onChange={setActiveEvaluationCycleId}
            />
          ) : null}
        </div>
        {!isIndividualJourney && activeEvaluationModuleMeta ? (
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

      <SafeEvaluationInsightsPanel
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

      <SafeEvaluationLibraryPanel
        Input={Input}
        Textarea={Textarea}
        canViewEvaluationLibrary={canViewEvaluationLibrary}
        competencies={competencies}
        customLibraryDraft={props.customLibraryDraft}
        customLibraryPublishForm={props.customLibraryPublishForm}
        evaluationLibrary={evaluationLibrary}
        handleCompetencyCreate={handleCompetencyCreate}
        handleCompetencyUpdate={handleCompetencyUpdate}
        handleCustomLibraryImport={handleCustomLibraryImport}
        handleCustomLibraryUpdate={handleCustomLibraryUpdate}
        handleCustomLibraryTemplateDownload={handleCustomLibraryTemplateDownload}
        handleCustomLibraryPublish={handleCustomLibraryPublish}
        setCustomLibraryPublishForm={setCustomLibraryPublishForm}
        showEvaluationLibrary={showEvaluationLibrary}
      />

      {canManageCycles && isOperationsWorkspace ? (
        <form className="card" onSubmit={handleCycleSubmit}>
          <div className="card-header">
            <h3>Novo ciclo</h3>
            <span>Planejamento</span>
          </div>
          <SafeInput
            label="Titulo"
            value={cycleForm.title}
            onChange={(value) => setCycleForm({ ...cycleForm, title: value })}
          />
          <SafeSelect
            label="Biblioteca aplicada"
            value={cycleForm.libraryId}
            options={evaluationLibrary?.cycleLibraries?.map((library) => library.id) || []}
            renderLabel={(value) =>
              evaluationLibrary?.cycleLibraries?.find((library) => library.id === value)?.name ||
              value
            }
            onChange={(value) => setCycleForm({ ...cycleForm, libraryId: value })}
          />
          <SafeInput
            label="Semestre"
            value={cycleForm.semesterLabel}
            onChange={(value) => setCycleForm({ ...cycleForm, semesterLabel: value })}
          />
          <SafeInput
            label="Prazo"
            type="date"
            value={cycleForm.dueDate}
            onChange={(value) => setCycleForm({ ...cycleForm, dueDate: value })}
          />
          <SafeInput
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
            <span>Semestre</span>
          </div>
          <div className="metrics-grid">
            {(cycles || []).map((cycle) => (
              <div className="mini-card" key={cycle.id}>
                <div className="row">
                  <p className="mini-label">{cycle.semesterLabel}</p>
                  <span className="badge">{cycle.status}</span>
                </div>
                <strong>{cycle.title}</strong>
                <p className="muted">{cycle.libraryName || cycle.modelName}</p>
                <p className="muted">{getCycleStatusDescription(cycle.status)}</p>
                <p className="muted">Prazo: {formatDate(cycle.dueDate)}</p>
                {cycle.reportSnapshotCount ? (
                  <p className="muted">Snapshots finais: {cycle.reportSnapshotCount}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {canManageCycles && isOperationsWorkspace ? (
        <div className="card card-span">
          <div className="card-header">
            <h3>Ciclos ativos</h3>
            <span>Controle</span>
          </div>
          <div className="metrics-grid">
            {(cycles || []).map((cycle) => (
              <div className="mini-card" key={cycle.id}>
                <div className="row">
                  <p className="mini-label">{cycle.semesterLabel}</p>
                  <span className="badge">{cycle.status}</span>
                </div>
                <strong>{cycle.title}</strong>
                <p className="muted">{cycle.libraryName || cycle.modelName}</p>
                <p className="muted">{cycle.targetGroup}</p>
                <p className="muted">{getCycleStatusDescription(cycle.status)}</p>
                <p className="muted">Prazo: {formatDate(cycle.dueDate)}</p>
                {cycle.reportSnapshotCount ? (
                  <p className="muted">Snapshots finais: {cycle.reportSnapshotCount}</p>
                ) : null}
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
                  {cycle.status === "Encerrado" ? (
                    <button
                      type="button"
                      className="refresh"
                      onClick={() => handleCycleStatusChange(cycle.id, "Processado")}
                    >
                      Processar ciclo
                    </button>
                  ) : null}
                </div>
                {cycle.supportsConfig === false ? (
                  <p className="muted">
                    Este ambiente ainda nao suporta switches de ciclo. Atualize o schema do MySQL
                    para habilitar ativacao e controle por questionario.
                  </p>
                ) : (
                  <div className="checkbox-stack">
                    <label className="checkbox-option">
                      <input
                        checked={cycle.isEnabled !== false}
                        type="checkbox"
                        onChange={(event) =>
                          handleCycleEnabledToggle(cycle.id, event.target.checked)
                        }
                      />
                      <span>Ciclo ativo (visivel para colaboradores)</span>
                    </label>
                    {cycleRelationshipTypes.map((relationshipType) => {
                      const enabled = cycle.moduleAvailability?.[relationshipType] !== false;

                      return (
                        <label className="checkbox-option" key={relationshipType}>
                          <input
                            checked={enabled}
                            disabled={cycle.isEnabled === false}
                            type="checkbox"
                            onChange={(event) =>
                              handleCycleModuleToggle(
                                cycle.id,
                                relationshipType,
                                event.target.checked
                              )
                            }
                          />
                          <span>{getRelationshipLabel(relationshipType)}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <SafeFeedbackRequestPanel
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
        <SafeAuditTrailPanel
          entries={auditEntries.slice(0, 6)}
          emptyMessage="Criacoes de ciclo, liberacoes e aprovacoes de feedback aparecerao aqui."
          formatDate={formatDate}
          subtitle="Mudancas operacionais recentes do ciclo"
          title="Trilha do ciclo"
        />
      ) : null}

      <SafeEvaluationResponsePanel
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
        filteredReceivedManagerFeedback={filteredReceivedManagerFeedback}
        formatDate={formatDate}
        getCycleStatusDescription={getCycleStatusDescription}
        getRelationshipDescription={props.getRelationshipDescription}
        getRelationshipLabel={props.getRelationshipLabel}
        getVisibilityLabel={props.getVisibilityLabel}
        handleAssignmentSubmit={props.handleAssignmentSubmit}
        handleReceivedManagerFeedbackSubmit={handleReceivedManagerFeedbackSubmit}
        isIndividualJourney={isIndividualJourney}
        receivedManagerFeedbackDrafts={receivedManagerFeedbackDrafts}
        selectedAssignment={props.selectedAssignment}
        setAnswerForm={props.setAnswerForm}
        setDevelopmentNote={props.setDevelopmentNote}
        setReceivedManagerFeedbackDraft={setReceivedManagerFeedbackDraft}
        setSelectedAssignment={props.setSelectedAssignment}
        setStrengthsNote={props.setStrengthsNote}
        strengthsNote={props.strengthsNote}
      />

      {isOperationsWorkspace ? (
        <div className="card card-span compact-card evaluation-operations-summary">
          <div className="card-header">
            <h3>Participantes e avaliadores do ciclo</h3>
            <span>Estrutura do ciclo</span>
          </div>
          <div className="list-card">
            <div className="dashboard-filter-grid">
              <SafeSelect
                label="Unidade"
                value={evaluationOperationWorkUnitFilter}
                options={evaluationOperationWorkUnitOptions}
                renderLabel={(value) => (value === "all" ? "Todas as unidades" : value)}
                onChange={setEvaluationOperationWorkUnitFilter}
              />
              <SafeSelect
                label="Modalidade"
                value={evaluationOperationWorkModeFilter}
                options={evaluationOperationWorkModeOptions}
                renderLabel={(value) =>
                  value === "all" ? "Todas as modalidades" : getWorkModeLabel(value)
                }
                onChange={setEvaluationOperationWorkModeFilter}
              />
            </div>
            {hasOperationFilters ? <p className="muted">Filtros aplicados</p> : null}
          </div>
          <div className="metrics-grid">
            <div className="mini-card">
              <p className="mini-label">Ciclo</p>
              <strong>{operationsStructure?.cycle?.title || "Sem ciclo ativo"}</strong>
            </div>
            <div className="mini-card">
              <p className="mini-label">Participantes</p>
              <strong>{operationsStructure?.cycle?.participantCount ?? 0}</strong>
            </div>
            <div className="mini-card">
              <p className="mini-label">Avaliadores</p>
              <strong>{operationsStructure?.cycle?.raterCount ?? 0}</strong>
            </div>
            <div className="mini-card">
              <p className="mini-label">Submodulo</p>
              <strong>{activeEvaluationModuleMeta?.label || "Fluxo ativo"}</strong>
            </div>
            <div className="mini-card">
              <p className="mini-label">Taxa de adesao</p>
              <strong>{operationsStructure?.compliance?.adherenceRate ?? 0}%</strong>
            </div>
            <div className="mini-card">
              <p className="mini-label">Taxa de inadimplencia</p>
              <strong>{operationsStructure?.compliance?.delinquencyRate ?? 0}%</strong>
            </div>
            <div className="mini-card">
              <p className="mini-label">Inadimplentes</p>
              <strong>{operationsStructure?.compliance?.delinquentAssignments ?? 0}</strong>
            </div>
          </div>
          <div className="list-card">
            <div className="row">
              <div>
                <strong>Notificar inadimplentes</strong>
              </div>
              <button
                type="button"
                className="primary-button"
                onClick={() => handleNotifyDelinquents(activeEvaluationCycleId)}
              >
                Notificar inadimplentes
              </button>
            </div>
            {evaluationOperationNotice ? (
              <p className="muted">{evaluationOperationNotice}</p>
            ) : null}
          </div>
          {operationsStructure?.relationshipSummary?.length ? (
            <div className="metrics-grid">
              {operationsStructure.relationshipSummary.map((item) => (
                <div className="mini-card" key={item.relationshipType}>
                  <p className="mini-label">{getRelationshipLabel(item.relationshipType)}</p>
                  <strong>{item.total}</strong>
                </div>
              ))}
            </div>
          ) : null}
          {operationsStructure?.delinquents?.length ? (
            <div className="stack-list">
              <div className="list-card">
                <strong>Lista de inadimplentes</strong>
              </div>
              <div className="metrics-grid">
                {operationsStructure.delinquents.map((assignment) => (
                  <article className="mini-card" key={assignment.id}>
                    <div className="row">
                      <strong>{assignment.reviewerName || "Avaliador"}</strong>
                      <span className="badge">{assignment.daysOverdue} dia(s)</span>
                    </div>
                    <p className="muted">
                      {getRelationshipLabel(assignment.relationshipType)} ·{" "}
                      {assignment.revieweeName}
                    </p>
                    <p className="muted">
                      Unidade: {assignment.revieweeWorkUnit || "-"} · Modalidade:{" "}
                      {getWorkModeLabel(assignment.revieweeWorkMode)}
                    </p>
                    <p className="muted">
                      Prazo: {formatDate(assignment.dueDate)} · Lembretes:{" "}
                      {assignment.reminderCount || 0}
                    </p>
                    <p className="muted">
                      Ultimo lembrete: {formatDate(assignment.lastReminderSentAt)}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="list-card">
              <strong>Sem inadimplentes no ciclo</strong>
            </div>
          )}
          {operationsStructure?.participants?.length ? (
            <div className="metrics-grid">
              {operationsStructure.participants.map((participant) => (
                <div className="mini-card" key={participant.id}>
                  <div className="row">
                    <strong>{participant.personName}</strong>
                    <span className="badge">
                      {participant.completedRaters}/{participant.totalRaters}
                    </span>
                  </div>
                  <p className="muted">
                    {participant.personArea}
                    {participant.managerName ? ` · Gestor direto: ${participant.managerName}` : ""}
                  </p>
                  <p className="muted">
                    Unidade: {participant.personWorkUnit || "-"} · Modalidade:{" "}
                    {getWorkModeLabel(participant.personWorkMode)}
                  </p>
                  <p className="muted">
                    {participant.raters
                      .map((rater) => `${rater.raterName} (${getRelationshipLabel(rater.relationshipType)})`)
                      .join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Nenhum participante neste ciclo.</p>
          )}
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
