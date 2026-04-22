import { AuditTrailPanel } from "../components/AuditTrailPanel";
import { workModeOptions } from "../appConfig.js";
import { getRoleLabel } from "../appLabels.js";
import {
  getPersonConsistencyMessages,
  getUserConsistencyMessages,
  validatePersonPayload,
  validateUserPayload
} from "../registry.js";

const EmptyComponent = () => null;

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

export function PeopleSection({
  AreaAdminCard,
  Input,
  PersonStructureCard,
  Select,
  auditEntries,
  areaForm,
  areaOptions,
  areas,
  canManagePeopleRegistry,
  formatDate,
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
  const SafeAreaAdminCard = AreaAdminCard || EmptyComponent;
  const SafeInput = Input || EmptyComponent;
  const SafePersonStructureCard = PersonStructureCard || EmptyComponent;
  const SafeSelect = Select || EmptyComponent;
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
          : personValidationError ||
            personConsistency.blocking[0] ||
            "Dados obrigatorios preenchidos para seguir.",
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
            <div className="stack-list compact-stack people-main-stack">
              <form
                className="list-card compact-list-card admin-form-card people-primary-form"
                onSubmit={handlePersonSubmit}
              >
                <div className="card-header">
                  <h3>Nova pessoa</h3>
                  <span>Defina a hierarquia da pessoa em um unico fluxo</span>
                </div>
                <SafeInput
                  label="Nome"
                  placeholder="Ex.: Maria Clara Souza"
                  value={personForm.name}
                  onChange={(value) => setPersonForm({ ...personForm, name: value })}
                />
                <SafeInput
                  label="Cargo"
                  placeholder="Ex.: Analista de Compliance"
                  value={personForm.roleTitle}
                  onChange={(value) => setPersonForm({ ...personForm, roleTitle: value })}
                />
                <SafeSelect
                  label="Area"
                  value={personForm.area}
                  options={areaOptions.map((item) => item.value)}
                  renderLabel={(value) => areaOptions.find((item) => item.value === value)?.label || value}
                  disabled={!hasRegisteredAreas}
                  onChange={(value) => setPersonForm({ ...personForm, area: value })}
                />
                <SafeSelect
                  label="Gestor direto"
                  value={personForm.managerPersonId}
                  options={managerOptions.map((item) => item.value)}
                  renderLabel={(value) =>
                    managerOptions.find((item) => item.value === value)?.label || value
                  }
                  helper="Escolha a pessoa que acompanha a rotina e aprova as entregas diretas deste colaborador."
                  onChange={(value) => setPersonForm({ ...personForm, managerPersonId: value })}
                />
                <SafeSelect
                  label="Lider da area"
                  value={personForm.isAreaManager}
                  options={["no", "yes"]}
                  renderLabel={(value) => (value === "yes" ? "Sim" : "Nao")}
                  helper="Use esta opcao apenas quando a pessoa for a lider atual da area selecionada."
                  onChange={(value) => setPersonForm({ ...personForm, isAreaManager: value })}
                />
                <SafeInput
                  label="Unidade de trabalho"
                  helper="Use o nome da base/unidade para organizar as avaliacoes entre pares."
                  placeholder="Ex.: Sao Paulo"
                  value={personForm.workUnit}
                  onChange={(value) => setPersonForm({ ...personForm, workUnit: value })}
                />
                <SafeSelect
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
                <SafeSelect
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

              <div className="people-support-grid">
                <article className="list-card compact-list-card people-guide-card">
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
                  <SafeInput
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
        </div>
      ) : null}

      <div className="card compact-card card-span">
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
              <SafePersonStructureCard
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

      {canManagePeopleRegistry ? (
        <AuditTrailPanel
          entries={auditEntries.slice(0, 6)}
          emptyMessage="Criacoes e atualizacoes de areas e pessoas aparecerao nesta trilha."
          formatDate={formatDate}
          subtitle="Historico recente de cadastro base, hierarquia e lideranca"
          title="Trilha da estrutura"
        />
      ) : null}
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
  const SafeInput = Input || EmptyComponent;
  const SafeSelect = Select || EmptyComponent;
  const SafeUserAdminCard = UserAdminCard || EmptyComponent;
  const hasPendingAccess = pendingAccessPeople.length > 0;
  const userValidationError = hasPendingAccess ? validateUserPayload(userForm) : "";
  const userConsistency = getUserConsistencyMessages(userForm, {
    selectedPerson: selectedUserPerson,
    suggestedRole: suggestedUserRole
  });
  const hasCredentialStep =
    Boolean(String(userForm.email || "").trim()) &&
    String(userForm.password || "").trim().length >= 6;
  const hasProfileStep =
    Boolean(String(userForm.roleKey || "").trim()) &&
    Boolean(String(userForm.status || "").trim());
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
      <div className="card compact-card card-span">
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

      <div className={`user-support-grid card-span${userConsistency.warnings.length ? "" : " single-support-card"}`}>
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
      </div>

      <form className="card compact-card admin-form-card user-provision-form card-span" onSubmit={handleUserSubmit}>
        <div className="card-header">
          <h3>Novo usuario</h3>
          <span>Crie o acesso depois que a pessoa ja estiver posicionada na hierarquia</span>
        </div>
        <SafeSelect
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
        <SafeInput
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
        <SafeInput
          label="Senha inicial"
          type="password"
          helper="Minimo de 6 caracteres. Use uma senha temporaria para o primeiro acesso."
          value={userForm.password}
          onChange={(value) => setUserForm({ ...userForm, password: value })}
        />
        <SafeSelect
          label="Perfil de acesso"
          value={userForm.roleKey}
          options={userRoleOptions}
          renderLabel={(value) => getRoleLabel(value)}
          helper={getSuggestedRoleDescription(userForm.roleKey)}
          onChange={(value) => setUserForm({ ...userForm, roleKey: value })}
        />
        <SafeSelect
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

      <div className="card compact-card card-span">
        <div className="card-header">
          <h3>Usuarios ativos e inativos</h3>
          <span>Acompanhe o perfil de acesso com contexto de hierarquia e area</span>
        </div>
        <div className="stack-list compact-stack">
          {users.map((item) => (
            <SafeUserAdminCard
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
