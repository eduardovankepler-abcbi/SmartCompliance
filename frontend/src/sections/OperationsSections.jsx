import { AuditTrailPanel } from "../components/AuditTrailPanel";

const EmptyComponent = () => null;

function DevelopmentPerformanceSummaryCard({ summary }) {
  if (!summary) {
    return null;
  }

  const scoreValue = Number(summary.scoreLabel?.replace?.("/10", "") || 0);
  const scorePercentage = Number.isFinite(scoreValue) ? Math.min(Math.max(scoreValue * 10, 0), 100) : 0;

  return (
    <div className={`development-performance-panel ${summary.tone || "neutral"}`}>
      <div className="development-performance-main">
        <span>{summary.eyebrow}</span>
        <strong>{summary.title}</strong>
        <p>{summary.guidance}</p>
      </div>
      <div className="development-performance-score">
        <span>Índice</span>
        <strong>{summary.scoreLabel}</strong>
        <p>{summary.detail}</p>
        <div className="development-performance-bar" aria-hidden="true">
          <span style={{ width: `${scorePercentage}%` }} />
        </div>
      </div>
      {summary.rows?.length ? (
        <div className="development-performance-breakdown">
          {summary.rows.slice(0, 4).map((item) => (
            <article className={`development-performance-row ${item.tone}`} key={item.personId || item.area || item.label}>
              <span>{item.area || item.label}</span>
              <strong>{item.scoreLabel}/10</strong>
              <p>{item.peopleCount ? `${item.peopleCount} colaboradores` : item.detail}</p>
            </article>
          ))}
        </div>
      ) : null}
      {summary.distribution?.length && summary.mode !== "personal" ? (
        <div className="development-performance-distribution">
          {summary.distribution.map((item) => (
            <article className={`development-performance-row ${item.tone}`} key={item.key}>
              <span>{item.label}</span>
              <strong>{item.total}</strong>
              <p>{item.percentage}% do recorte</p>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
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
  const SafeIncidentQueueCard = IncidentQueueCard || EmptyComponent;
  const isOperationalCompliance = roleKey === "compliance";
  const shouldShowReporterLabel = incidentForm.anonymity === "identified";
  const shouldShowAssignedPerson = canManageIncidentQueue;
  const filteredResponsibleOptions = incidentResponsibleOptions.filter(
    (item) => item.value === "" || item.area === incidentForm.responsibleArea
  );
  const categoryOptions = [
    "Conduta Impropria",
    "Assedio",
    "Conflito de interesse",
    "Uso indevido de recurso",
    "Fraude"
  ];

  return (
    <section className="page-grid">
      <form className="card card-span compact-card admin-form-card compliance-intake-form" onSubmit={handleIncidentSubmit}>
        <div className="card-header">
          <h3>{isOperationalCompliance ? "Registrar novo caso" : "Novo relato"}</h3>
          <span>
            {isOperationalCompliance
              ? "Entrada estruturada para triagem e encaminhamento"
              : "Canal estruturado de etica e conduta"}
          </span>
        </div>
        <div className="compliance-report-grid">
          <div className="compliance-form-span-main">
            <label className="field">
              <span>Titulo</span>
              <input
                value={incidentForm.title}
                onChange={(event) => setIncidentForm({ ...incidentForm, title: event.target.value })}
              />
            </label>
            <label className="field">
              <span>Descricao detalhada</span>
              <textarea
                rows={8}
                value={incidentForm.description}
                onChange={(event) => setIncidentForm({ ...incidentForm, description: event.target.value })}
              />
              <small className="field-helper">
                Descreva o fato, onde aconteceu, quem foi impactado e qualquer contexto util para a triagem.
              </small>
            </label>
          </div>
          <div className="compliance-form-span-sidebar">
            <div className="compliance-intake-panel">
              <div className="card-header compliance-panel-header">
                <h4>Triagem inicial</h4>
                <span>Classifique e encaminhe o relato</span>
              </div>
              <div className="compliance-side-grid">
                <label className="field">
                  <span>Categoria</span>
                  <select
                    value={incidentForm.category}
                    onChange={(event) => setIncidentForm({ ...incidentForm, category: event.target.value })}
                  >
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Classificacao inicial</span>
                  <select
                    value={incidentForm.classification}
                    onChange={(event) =>
                      setIncidentForm({ ...incidentForm, classification: event.target.value })
                    }
                  >
                    {incidentClassificationOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Identificacao</span>
                  <select
                    value={incidentForm.anonymity}
                    onChange={(event) => setIncidentForm({ ...incidentForm, anonymity: event.target.value })}
                  >
                    <option value="anonymous">Anonimo</option>
                    <option value="identified">Identificado</option>
                  </select>
                </label>
                {shouldShowReporterLabel ? (
                  <label className="field">
                    <span>Nome do relator</span>
                    <input
                      value={incidentForm.reporterLabel}
                      onChange={(event) =>
                        setIncidentForm({ ...incidentForm, reporterLabel: event.target.value })
                      }
                    />
                  </label>
                ) : null}
                <label className="field">
                  <span>Area responsavel</span>
                  <select
                    value={incidentForm.responsibleArea}
                    onChange={(event) => {
                      const nextArea = event.target.value;
                      setIncidentForm({
                        ...incidentForm,
                        responsibleArea: nextArea,
                        assignedPersonId:
                          incidentResponsibleOptions.find(
                            (item) => item.area === nextArea && item.isAreaManager
                          )?.value || ""
                      });
                    }}
                  >
                    {incidentAreaOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                {shouldShowAssignedPerson ? (
                  <label className="field">
                    <span>Responsavel inicial</span>
                    <select
                      value={incidentForm.assignedPersonId}
                      onChange={(event) =>
                        setIncidentForm({ ...incidentForm, assignedPersonId: event.target.value })
                      }
                    >
                      {filteredResponsibleOptions.map((item) => (
                        <option key={item.value || "empty"} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <small className="field-helper">
                      Defina quem recebe a triagem inicial dentro da area escolhida.
                    </small>
                  </label>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <button className="primary-button" type="submit">
          Registrar relato
        </button>
      </form>

      <div className="card card-span compact-card">
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
              <SafeIncidentQueueCard
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
  developmentPlanProgressStatusOptions = [],
  developmentPlanStatusOptions,
  developmentFormPeopleOptions,
  developmentHighlights,
  developmentMetrics,
  developmentPerformanceSummary,
  developmentPlans,
  developmentRecordTypes,
  developmentEditablePlanPeopleOptions,
  developmentEditablePeopleOptions,
  developmentViewLabels,
  developmentViewOptions,
  learningIntegrationPeopleOptions = [],
  learningIntegrationReviewItems = [],
  learningIntegrationSummary = null,
  filteredDevelopmentRecords,
  formatDate,
  getDevelopmentTrackLabel,
  handleDevelopmentPlanProgressUpdate,
  handleDevelopmentPlanSubmit,
  handleDevelopmentPlanUpdate,
  handleDevelopmentSubmit,
  handleDevelopmentUpdate,
  handleLearningIntegrationApply,
  roleKey,
  setActiveDevelopmentView,
  setDevelopmentForm,
  setLearningIntegrationDraft,
  setDevelopmentPlanForm
}) {
  const SafeDevelopmentPlanAdminCard = DevelopmentPlanAdminCard || EmptyComponent;
  const SafeDevelopmentRecordAdminCard = DevelopmentRecordAdminCard || EmptyComponent;
  const SafeInput = Input || EmptyComponent;
  const SafeMetricCard = MetricCard || EmptyComponent;
  const SafeSelect = Select || EmptyComponent;
  const SafeTextarea = Textarea || EmptyComponent;
  const isEmployeeJourney = roleKey === "employee";
  const showDevelopmentViews = developmentViewOptions.length > 1;
  const showDevelopmentMetrics = !isEmployeeJourney;
  const showDevelopmentPersonSelect = developmentFormPeopleOptions.length > 1;
  const showDevelopmentPlanPersonSelect = developmentPlanPeopleOptions.length > 1;
  const showLearningIntegrations = Boolean(learningIntegrationSummary);
  const canStructureDevelopmentPlan = ["admin", "hr", "manager"].includes(roleKey);

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
        <DevelopmentPerformanceSummaryCard summary={developmentPerformanceSummary} />
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
              </button>
            ))}
          </div>
        ) : null}
        {showDevelopmentMetrics ? (
          <div className="metrics-grid">
            {developmentMetrics.map((item) => (
              <SafeMetricCard key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        ) : null}
      </div>

      {showLearningIntegrations ? (
        <div className="card card-span compact-card learning-integration-panel">
          <div className="card-header">
            <h3>Integrações de aprendizagem</h3>
            <span>Revisão antes de atualizar Desenvolvimento e PDI</span>
          </div>
          <div className="metrics-grid">
            <SafeMetricCard label="Na fila" value={learningIntegrationSummary.pending} />
            <SafeMetricCard label="Prontos" value={learningIntegrationSummary.ready} />
            <SafeMetricCard label="Exigem revisão" value={learningIntegrationSummary.needsReview} />
            <SafeMetricCard label="Aplicados" value={learningIntegrationSummary.applied} />
          </div>
          <div className="learning-integration-grid">
            {learningIntegrationReviewItems.length ? (
              learningIntegrationReviewItems.slice(0, 6).map((item) => {
                const targetLabel =
                  item.suggestedAction === "development_record_candidate"
                    ? "Desenvolvimento"
                    : "PDI";
                const canApply = Boolean(item.reviewDraft.personId);

                return (
                  <article className="list-card learning-integration-card" key={item.id}>
                    <div className="row">
                      <strong>{item.title}</strong>
                      <span className={canApply ? "badge success" : "badge danger"}>
                        {canApply ? "Pronto" : "Revisar"}
                      </span>
                    </div>
                    <p className="muted">
                      {item.personName || item.personEmail} · {item.providerName} · {targetLabel}
                    </p>
                    <p className="muted">
                      {item.sourceSystem} · {item.workloadHours || 0}h · {item.competencyKey || "sem competencia"}
                    </p>
                    <div className="learning-integration-review-fields">
                      <SafeSelect
                        label="Pessoa"
                        value={item.reviewDraft.personId}
                        options={learningIntegrationPeopleOptions.map((person) => person.value)}
                        renderLabel={(value) =>
                          learningIntegrationPeopleOptions.find((person) => person.value === value)
                            ?.label || value
                        }
                        onChange={(value) =>
                          setLearningIntegrationDraft(item.id, { personId: value })
                        }
                      />
                      <SafeSelect
                        label="Competencia"
                        value={item.reviewDraft.competencyId}
                        options={developmentPlanCompetencyOptions.map((option) => option.value)}
                        renderLabel={(value) =>
                          developmentPlanCompetencyOptions.find((option) => option.value === value)
                            ?.label || value
                        }
                        onChange={(value) =>
                          setLearningIntegrationDraft(item.id, { competencyId: value })
                        }
                      />
                      {item.suggestedAction === "development_plan_candidate" ? (
                        <SafeInput
                          label="Prazo sugerido"
                          type="date"
                          value={item.reviewDraft.dueDate}
                          onChange={(value) =>
                            setLearningIntegrationDraft(item.id, { dueDate: value })
                          }
                        />
                      ) : null}
                      <SafeTextarea
                        label="Nota de revisão"
                        rows={2}
                        value={item.reviewDraft.reviewNote}
                        onChange={(value) =>
                          setLearningIntegrationDraft(item.id, { reviewNote: value })
                        }
                      />
                    </div>
                    <button
                      className="secondary-button"
                      disabled={!canApply}
                      type="button"
                      onClick={() => handleLearningIntegrationApply(item.id)}
                    >
                      {canApply ? `Aplicar em ${targetLabel}` : "Selecione uma pessoa"}
                    </button>
                  </article>
                );
              })
            ) : (
              <div className="list-card">
                <strong>Fila limpa</strong>
                <p className="muted">
                  Cursos e treinamentos importados aparecerão aqui antes da aplicação.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <form className="card card-span compact-card admin-form-card development-intake-form" onSubmit={handleDevelopmentSubmit}>
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
          <SafeSelect
            label="Pessoa"
            value={developmentForm.personId}
            options={developmentFormPeopleOptions.map((item) => item.value)}
            renderLabel={(value) =>
              developmentFormPeopleOptions.find((item) => item.value === value)?.label || value
            }
            onChange={(value) => setDevelopmentForm({ ...developmentForm, personId: value })}
          />
        ) : null}
        <SafeSelect
          label="Tipo"
          value={developmentForm.recordType}
          options={developmentRecordTypes}
          onChange={(value) => setDevelopmentForm({ ...developmentForm, recordType: value })}
        />
        <SafeInput
          label="Titulo"
          value={developmentForm.title}
          onChange={(value) => setDevelopmentForm({ ...developmentForm, title: value })}
        />
        <SafeInput
          label="Instituicao / provedor"
          value={developmentForm.providerName}
          onChange={(value) => setDevelopmentForm({ ...developmentForm, providerName: value })}
        />
        <SafeInput
          label="Conclusao"
          type="date"
          value={developmentForm.completedAt}
          onChange={(value) => setDevelopmentForm({ ...developmentForm, completedAt: value })}
        />
        <SafeInput
          label="Competencia / eixo"
          value={developmentForm.skillSignal}
          onChange={(value) => setDevelopmentForm({ ...developmentForm, skillSignal: value })}
        />
        <SafeTextarea
          label="Notas"
          value={developmentForm.notes}
          onChange={(value) => setDevelopmentForm({ ...developmentForm, notes: value })}
        />
        <button className="primary-button" type="submit">
          Registrar desenvolvimento
        </button>
      </form>

      {!canStructureDevelopmentPlan ? (
        <div className="card card-span compact-card development-plan-readonly-note">
          <div className="card-header">
            <h3>{isEmployeeJourney ? "Meu PDI" : "PDI"}</h3>
            <span>Plano definido pelo gestor</span>
          </div>
          <p className="muted">
            O foco, a ação, o prazo e a evidência esperada são combinados pelo gestor. Colaboradores
            acompanham os planos abaixo e reportam andamento sem alterar a estrutura do PDI.
          </p>
        </div>
      ) : (
        <form className="card card-span compact-card admin-form-card development-plan-form" onSubmit={handleDevelopmentPlanSubmit}>
          <div className="card-header">
            <h3>Novo PDI</h3>
            <span>
              {activeDevelopmentView === "team"
                ? "Plano de desenvolvimento para reportes diretos"
                : activeDevelopmentView === "organization"
                  ? "Plano estruturado para pessoas da organizacao"
                  : "Plano de desenvolvimento individual com acao e evidencia"}
            </span>
          </div>
          {showDevelopmentPlanPersonSelect ? (
            <SafeSelect
              label="Pessoa"
              value={developmentPlanForm.personId}
              options={developmentPlanPeopleOptions.map((item) => item.value)}
              renderLabel={(value) =>
                developmentPlanPeopleOptions.find((item) => item.value === value)?.label || value
              }
              onChange={(value) => setDevelopmentPlanForm({ ...developmentPlanForm, personId: value })}
            />
          ) : null}
          <SafeSelect
            label="Ciclo"
            value={developmentPlanForm.cycleId}
            options={developmentPlanCycleOptions.map((item) => item.value)}
            renderLabel={(value) =>
              developmentPlanCycleOptions.find((item) => item.value === value)?.label || value
            }
            onChange={(value) => setDevelopmentPlanForm({ ...developmentPlanForm, cycleId: value })}
          />
          <SafeSelect
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
          <SafeInput
            label="Foco prioritario"
            value={developmentPlanForm.focusTitle}
            onChange={(value) => setDevelopmentPlanForm({ ...developmentPlanForm, focusTitle: value })}
          />
          <SafeTextarea
            label="Acao sugerida"
            rows={3}
            value={developmentPlanForm.actionText}
            onChange={(value) => setDevelopmentPlanForm({ ...developmentPlanForm, actionText: value })}
          />
          <SafeInput
            label="Prazo"
            type="date"
            value={developmentPlanForm.dueDate}
            onChange={(value) => setDevelopmentPlanForm({ ...developmentPlanForm, dueDate: value })}
          />
          <SafeTextarea
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
      )}

      {!isEmployeeJourney ? (
        <div className="card card-span compact-card">
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
              <SafeDevelopmentPlanAdminCard
                key={plan.id}
                competencyOptions={developmentPlanCompetencyOptions}
                cycleOptions={developmentPlanCycleOptions}
                canEdit={canStructureDevelopmentPlan}
                canReportProgress={roleKey === "employee"}
                onSave={handleDevelopmentPlanUpdate}
                onProgressSave={handleDevelopmentPlanProgressUpdate}
                personOptions={developmentEditablePlanPeopleOptions}
                plan={{
                  ...plan,
                  dueDate: plan.dueDate?.slice?.(0, 10) || plan.dueDate
                }}
                progressStatusOptions={developmentPlanProgressStatusOptions}
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
              <SafeDevelopmentRecordAdminCard
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
  const SafeApplauseAdminCard = ApplauseAdminCard || EmptyComponent;
  const SafeInput = Input || EmptyComponent;
  const SafeTextarea = Textarea || EmptyComponent;
  const isEmployeeJourney = roleKey === "employee";
  const selectedReceiver = applausePeopleOptions.find((item) => item.value === applauseForm.receiverPersonId);
  const applauseCategoryOptions = [
    "Colaboracao",
    "Apoio em momento critico",
    "Resolucao de problema",
    "Postura exemplar",
    "Compartilhamento de conhecimento"
  ];
  const applauseOccasionOptions = [
    "Projeto",
    "Reuniao",
    "Entrega critica",
    "Suporte ao time",
    "Treinamento",
    "Atendimento ao cliente",
    "Outro"
  ];

  return (
    <section className="page-grid">
      <form className="card compact-card admin-form-card applause-intake-form card-span" onSubmit={handleApplauseSubmit}>
        <div className="card-header">
          <h3>{isEmployeeJourney ? "Reconhecer alguem" : "Novo Aplause"}</h3>
          <span>
            {isEmployeeJourney
              ? "Reconhecimento rapido com descricao objetiva"
              : "Reconhecimento formal com contexto obrigatorio"}
          </span>
        </div>
        <div className="applause-intake-grid">
          <div className="applause-intake-main">
            <div className="applause-intake-toolbar">
              <label className="field">
                <span>Quem recebe</span>
                <select
                  value={applauseForm.receiverPersonId}
                  onChange={(event) =>
                    setApplauseForm({ ...applauseForm, receiverPersonId: event.target.value })
                  }
                >
                  {applausePeopleOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <small className="field-helper">
                  Escolha a pessoa que deve receber o reconhecimento.
                </small>
              </label>
              <label className="field">
                <span>Contexto</span>
                <select
                  value={applauseForm.occasion || "Projeto"}
                  onChange={(event) => setApplauseForm({ ...applauseForm, occasion: event.target.value })}
                >
                  {applauseOccasionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <small className="field-helper">
                  Indique o ambiente em que esse reconhecimento aconteceu.
                </small>
              </label>
              <label className="field">
                <span>Tipo de reconhecimento</span>
                <select
                  value={applauseForm.category}
                  onChange={(event) => setApplauseForm({ ...applauseForm, category: event.target.value })}
                >
                  {applauseCategoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <small className="field-helper">
                  Escolha o tipo de contribuicao que melhor representa esse reconhecimento.
                </small>
              </label>
            </div>
            <SafeInput
              label="Impacto gerado"
              placeholder="Ex.: destravou entrega critica do cliente"
              helper="Resuma em uma frase o efeito concreto da atitude reconhecida."
              value={applauseForm.impact}
              onChange={(value) => setApplauseForm({ ...applauseForm, impact: value })}
            />
            <SafeTextarea
              label="Descricao do reconhecimento"
              rows={6}
              helper="Explique o que aconteceu, quando ocorreu e por que esse comportamento merece destaque."
              value={applauseForm.contextNote}
              onChange={(value) => setApplauseForm({ ...applauseForm, contextNote: value })}
            />
          </div>
          <div className="applause-intake-side">
            <div className="applause-highlight-card">
              <p className="mini-label">Reconhecimento em foco</p>
              <strong>{selectedReceiver?.label || "Selecione quem recebe"}</strong>
              <p className="muted">
                Registre um reconhecimento com impacto claro para reforcar a cultura que queremos repetir.
              </p>
            </div>
            <div className="applause-guidance-card">
              <p className="mini-label">Como registrar bem</p>
              <strong>{applauseForm.category || "Defina o tipo de reconhecimento"}</strong>
              <p className="muted">
                {applauseForm.occasion || "Projeto"} · Diga o que a pessoa fez, qual foi o impacto concreto e por que esse comportamento merece ser repetido.
              </p>
            </div>
          </div>
        </div>
        <button className="primary-button" type="submit">
          Registrar Aplause
        </button>
      </form>

      <div className="card compact-card card-span">
        <div className="card-header">
          <h3>{isEmployeeJourney ? "Historico de reconhecimentos" : "Reconhecimentos"}</h3>
          <span>
            {isEmployeeJourney
              ? "Entradas recentes do seu ambiente de colaboracao"
              : "Impacto complementar nas avaliacoes"}
          </span>
        </div>
        <div className="stack-list">
          {applauseEntries.map((entry) =>
            canManageApplause ? (
              <SafeApplauseAdminCard
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
          )}
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
