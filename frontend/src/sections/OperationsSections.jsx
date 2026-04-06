import { AuditTrailPanel } from "../components/AuditTrailPanel";

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
          {applauseEntries.map((entry) =>
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
