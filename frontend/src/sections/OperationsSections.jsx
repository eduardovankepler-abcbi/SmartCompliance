import { AuditTrailPanel } from "../components/AuditTrailPanel";

const EmptyComponent = () => null;

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
              <SafeMetricCard key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
        ) : null}
      </div>

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

      <form className="card card-span compact-card admin-form-card development-plan-form" onSubmit={handleDevelopmentPlanSubmit}>
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
  const SafeApplauseAdminCard = ApplauseAdminCard || EmptyComponent;
  const SafeInput = Input || EmptyComponent;
  const SafeSelect = Select || EmptyComponent;
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

  return (
    <section className="page-grid">
      <form className="card compact-card admin-form-card applause-intake-form card-span" onSubmit={handleApplauseSubmit}>
        <div className="card-header">
          <h3>{isEmployeeJourney ? "Reconhecer alguem" : "Novo Aplause"}</h3>
          <span>
            {isEmployeeJourney
              ? "Reconhecimento rapido com contexto objetivo"
              : "Reconhecimento formal com contexto obrigatorio"}
          </span>
        </div>
        <div className="applause-intake-grid">
          <div className="applause-intake-main">
            <div className="applause-intake-toolbar">
              <SafeSelect
                label="Quem recebe"
                value={applauseForm.receiverPersonId}
                options={applausePeopleOptions.map((item) => item.value)}
                renderLabel={(value) =>
                  applausePeopleOptions.find((item) => item.value === value)?.label || value
                }
                helper="Escolha a pessoa que deve receber o reconhecimento."
                onChange={(value) => setApplauseForm({ ...applauseForm, receiverPersonId: value })}
              />
              <SafeSelect
                label="Contexto do reconhecimento"
                value={applauseForm.category}
                options={applauseCategoryOptions}
                helper="Escolha o tipo de contribuicao que melhor representa esse reconhecimento."
                onChange={(value) => setApplauseForm({ ...applauseForm, category: value })}
              />
            </div>
            <SafeInput
              label="Impacto gerado"
              placeholder="Ex.: destravou entrega critica do cliente"
              helper="Resuma em uma frase o efeito concreto da atitude reconhecida."
              value={applauseForm.impact}
              onChange={(value) => setApplauseForm({ ...applauseForm, impact: value })}
            />
            <SafeTextarea
              label="Contexto objetivo"
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
              <strong>{applauseForm.category || "Defina um contexto objetivo"}</strong>
              <p className="muted">
                Diga o que a pessoa fez, qual foi o impacto concreto e por que esse comportamento merece ser repetido.
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
