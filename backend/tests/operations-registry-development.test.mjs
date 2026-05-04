import assert from "node:assert/strict";
import { createTestContext } from "./testContext.mjs";

export async function runOperationsRegistryDevelopmentRegression() {
  const context = await createTestContext();

  try {
    const { fetchJson, getAuthHeader, sendJson, store } = context;
    const admin = await store.findUserByEmail("admin@demo.local");
    const manager = await store.findUserByEmail("gestor@demo.local");
    const hr = await store.findUserByEmail("rh@demo.local");
    const employee = await store.findUserByEmail("colaborador1@demo.local");
    const compliance = await store.findUserByEmail("compliance@demo.local");
    const managerRevieweeEmployee = await store.findUserByEmail("colaborador2@demo.local");

    assert.ok(
      admin && manager && hr && employee && compliance && managerRevieweeEmployee,
      "Usuarios demo obrigatorios para operacao e estrutura"
    );

    const createdCycle = await store.createEvaluationCycle(
      {
        title: "Ciclo de apoio a desenvolvimento",
        semesterLabel: "2026.8",
        dueDate: "2026-11-15",
        targetGroup: "Todos os colaboradores",
        createdByUserId: admin.id
      },
      admin
    );

    const createdIncident = await store.createIncident(
      {
        title: "Teste estruturado de compliance",
        category: "Conduta Impropria",
        classification: "Conduta e Relacionamento",
        anonymity: "anonymous",
        reporterLabel: "Anonimo",
        responsibleArea: "Compliance",
        assignedPersonId: compliance.personId,
        description: "Caso de teste para validar area e responsavel."
      },
      admin
    );
    assert.equal(
      createdIncident.responsibleArea,
      "Compliance",
      "Caso deve manter a area responsavel selecionada"
    );
    assert.equal(
      createdIncident.assignedPersonId,
      compliance.personId,
      "Caso deve manter o responsavel designado"
    );

    const createdDevelopmentRecord = await store.createDevelopmentRecord(
      {
        personId: employee.personId,
        recordType: "Curso",
        title: "Programa de Lideranca Situacional",
        providerName: "ABC Academy",
        completedAt: "2026-03-20",
        skillSignal: "Gestao de conflitos",
        notes: "Registro criado para validar manutencao."
      },
      employee
    );

    const archivedDevelopmentRecord = await store.updateDevelopmentRecord(
      createdDevelopmentRecord.id,
      {
        personId: employee.personId,
        recordType: "Curso",
        title: "Programa de Lideranca Situacional",
        providerName: "ABC Academy",
        completedAt: "2026-03-20",
        skillSignal: "Gestao de conflitos",
        notes: "Registro arquivado para teste.",
        status: "archived"
      },
      employee
    );

    assert.equal(
      archivedDevelopmentRecord.status,
      "archived",
      "Registro de desenvolvimento deve permitir arquivamento"
    );
    assert.ok(
      archivedDevelopmentRecord.archivedAt,
      "Registro arquivado deve expor data de arquivamento"
    );

    await assert.rejects(
      () =>
        store.createDevelopmentPlan(
          {
            personId: employee.personId,
            cycleId: createdCycle.id,
            competencyId: "cmp_communication",
            focusTitle: "Evoluir comunicacao com stakeholders",
            actionText: "Conduzir checkpoints quinzenais com pauta e resumo de riscos.",
            dueDate: "2026-08-15",
            expectedEvidence: "Atas publicadas e feedback do gestor sobre clareza."
          },
          employee
        ),
      /gestor, RH ou admin/,
      "Colaborador nao deve estruturar o proprio PDI"
    );

    const createdDevelopmentPlan = await store.createDevelopmentPlan(
      {
        personId: managerRevieweeEmployee.personId,
        cycleId: createdCycle.id,
        competencyId: "cmp_communication",
        focusTitle: "Evoluir comunicacao com stakeholders",
        actionText: "Conduzir checkpoints quinzenais com pauta e resumo de riscos.",
        dueDate: "2026-08-15",
        expectedEvidence: "Atas publicadas e feedback do gestor sobre clareza."
      },
      manager
    );

    const completedDevelopmentPlan = await store.updateDevelopmentPlan(
      createdDevelopmentPlan.id,
      {
        personId: managerRevieweeEmployee.personId,
        cycleId: createdCycle.id,
        competencyId: "cmp_communication",
        focusTitle: "Evoluir comunicacao com stakeholders",
        actionText: "Conduzir checkpoints quinzenais com pauta e resumo de riscos.",
        dueDate: "2026-08-15",
        expectedEvidence: "Atas publicadas e feedback do gestor sobre clareza.",
        status: "completed"
      },
      manager
    );

    assert.equal(
      completedDevelopmentPlan.status,
      "completed",
      "Gestor deve poder concluir o PDI do reporte"
    );

    const progressDevelopmentPlan = await store.updateDevelopmentPlanProgress(
      createdDevelopmentPlan.id,
      {
        progressStatus: "in_progress",
        progressNote: "Primeiro checkpoint realizado e evidencias em coleta."
      },
      managerRevieweeEmployee
    );

    assert.equal(
      progressDevelopmentPlan.progressStatus,
      "in_progress",
      "Colaborador deve reportar andamento do proprio PDI"
    );
    assert.ok(
      progressDevelopmentPlan.progressUpdatedAt,
      "Reporte de andamento deve registrar data de atualizacao"
    );

    const progressApiResponse = await sendJson(
      `/api/development/plans/${createdDevelopmentPlan.id}/progress`,
      {
        method: "PATCH",
        headers: getAuthHeader(managerRevieweeEmployee.id),
        body: {
          progressStatus: "blocked",
          progressNote: "Aguardando agenda com stakeholders para validar o proximo passo."
        }
      }
    );
    assert.equal(
      progressApiResponse.response.status,
      200,
      "API deve permitir reporte de andamento pelo colaborador"
    );
    assert.equal(
      progressApiResponse.payload.progressStatus,
      "blocked",
      "API deve retornar o andamento atualizado do PDI"
    );

    const employeeDevelopmentPlans = await store.getDevelopmentPlans(managerRevieweeEmployee);
    assert.ok(
      employeeDevelopmentPlans.some((plan) => plan.id === createdDevelopmentPlan.id),
      "Colaborador deve visualizar o proprio PDI"
    );

    const createdApplause = await store.createApplauseEntry({
      senderPersonId: employee.personId,
      receiverPersonId: manager.personId,
      category: "Colaboracao",
      impact: "Apoio direto em entrega critica.",
      contextNote: "Reconhecimento criado para validar manutencao administrativa do modulo."
    });

    const updatedApplause = await store.updateApplauseEntry(
      createdApplause.id,
      {
        receiverPersonId: manager.personId,
        category: "Resolucao de problema",
        impact: "Apoio refinado para investigacao de causa raiz.",
        contextNote: "Registro revisado no fluxo administrativo.",
        status: "Arquivado"
      },
      admin
    );

    assert.equal(
      updatedApplause.status,
      "Arquivado",
      "Aplause deve permitir ajuste administrativo de status"
    );
    assert.equal(
      updatedApplause.category,
      "Resolucao de problema",
      "Aplause deve permitir atualizacao de categoria"
    );

    const createdArea = await store.createArea(
      {
        name: "Area Lideranca Teste",
        managerPersonId: null
      },
      admin
    );

    const createdPerson = await store.createPerson(
      {
        name: "  Pessoa Homologacao  ",
        roleTitle: "  Analista de Testes  ",
        area: createdArea.name,
        workUnit: "Sao Paulo",
        workMode: "hybrid",
        managerPersonId: manager.personId,
        employmentType: "internal",
        isAreaManager: true
      },
      admin
    );

    assert.equal(
      createdPerson.satisfactionScore,
      null,
      "Cadastro de pessoa nao deve aceitar score manual; o valor nasce sem pesquisa"
    );
    assert.equal(createdPerson.name, "Pessoa Homologacao", "Cadastro deve normalizar o nome");
    assert.equal(
      createdPerson.roleTitle,
      "Analista de Testes",
      "Cadastro deve normalizar o cargo"
    );
    assert.equal(createdPerson.workUnit, "Sao Paulo", "Pessoa deve manter unidade de trabalho");
    assert.equal(createdPerson.workMode, "hybrid", "Pessoa deve manter modalidade de trabalho");
    assert.equal(
      createdPerson.areaManagerPersonId,
      createdPerson.id,
      "Cadastro de pessoa deve permitir marcar lider da area no mesmo fluxo"
    );

    const areaAfterLeaderAssignment = (await store.getAreas(admin)).find(
      (area) => area.name === createdArea.name
    );
    assert.equal(
      areaAfterLeaderAssignment?.managerPersonId,
      createdPerson.id,
      "Area deve passar a apontar para a pessoa criada como lider"
    );

    const renamedArea = await store.updateArea(
      createdArea.id,
      {
        name: "Area Lideranca Teste Renomeada"
      },
      admin
    );
    assert.equal(
      renamedArea.managerPersonId,
      createdPerson.id,
      "Renomear a area nao deve remover a lideranca ja definida"
    );

    const updatedPersonWithoutLeadership = await store.updatePerson(
      createdPerson.id,
      {
        name: createdPerson.name,
        roleTitle: createdPerson.roleTitle,
        area: renamedArea.name,
        workUnit: createdPerson.workUnit,
        workMode: createdPerson.workMode,
        managerPersonId: createdPerson.managerPersonId,
        employmentType: createdPerson.employmentType,
        isAreaManager: false
      },
      admin
    );
    assert.equal(
      updatedPersonWithoutLeadership.areaManagerPersonId,
      null,
      "Edicao da pessoa deve permitir remover a lideranca da area"
    );

    const registryAudit = await store.getAuditTrail(admin, {
      category: "registry"
    });
    assert.ok(
      registryAudit.some(
        (entry) =>
          entry.entityType === "area" &&
          entry.action === "created" &&
          entry.entityLabel === createdArea.name
      ),
      "Criacao de area deve entrar na trilha estrutural"
    );
    assert.ok(
      registryAudit.some(
        (entry) =>
          entry.entityType === "area" &&
          entry.action === "updated" &&
          entry.entityLabel === renamedArea.name
      ),
      "Edicao de area deve entrar na trilha estrutural"
    );
    assert.ok(
      registryAudit.some(
        (entry) =>
          entry.entityType === "person" &&
          entry.action === "created" &&
          entry.entityLabel === createdPerson.name &&
          entry.detail.includes("Sao Paulo")
      ),
      "Criacao de pessoa deve entrar na trilha estrutural com contexto de unidade"
    );
    assert.ok(
      registryAudit.some(
        (entry) =>
          entry.entityType === "person" &&
          entry.action === "updated" &&
          entry.entityLabel === updatedPersonWithoutLeadership.name &&
          entry.detail.includes("Sem lideranca de area")
      ),
      "Edicao de pessoa deve refletir mudanca de lideranca na trilha estrutural"
    );

    await assert.rejects(
      () =>
        store.createPerson(
          {
            name: createdPerson.name,
            roleTitle: createdPerson.roleTitle,
            area: renamedArea.name,
            workUnit: createdPerson.workUnit,
            workMode: createdPerson.workMode,
            managerPersonId: manager.personId,
            employmentType: createdPerson.employmentType
          },
          admin
        ),
      /mesmo nome, area e cargo/i,
      "Cadastro deve bloquear duplicidade exata de nome, area e cargo"
    );

    const cycleArea = await store.createArea(
      {
        name: "Area Ciclo Hierarquia",
        managerPersonId: null
      },
      admin
    );

    const cycleLeader = await store.createPerson(
      {
        name: "Pessoa Ciclo Lider",
        roleTitle: "Coordenador",
        area: cycleArea.name,
        workUnit: "Curitiba",
        workMode: "hybrid",
        managerPersonId: manager.personId,
        employmentType: "internal"
      },
      admin
    );

    const cycleAnalyst = await store.createPerson(
      {
        name: "Pessoa Ciclo Analista",
        roleTitle: "Analista",
        area: cycleArea.name,
        workUnit: "Curitiba",
        workMode: "hybrid",
        managerPersonId: cycleLeader.id,
        employmentType: "internal"
      },
      admin
    );

    await assert.rejects(
      () =>
        store.updatePerson(
          cycleLeader.id,
          {
            name: cycleLeader.name,
            roleTitle: cycleLeader.roleTitle,
            area: cycleLeader.area,
            workUnit: cycleLeader.workUnit,
            workMode: cycleLeader.workMode,
            managerPersonId: cycleAnalyst.id,
            employmentType: cycleLeader.employmentType,
            isAreaManager: false
          },
          admin
        ),
      /ciclo de gestao invalido/i,
      "Edicao deve bloquear ciclos na hierarquia de gestao"
    );

    const remotePerson = await store.createPerson(
      {
        name: "Pessoa Remota Teste",
        roleTitle: "Consultor Remoto",
        area: "Consultoria",
        workUnit: "Sao Paulo",
        workMode: "remote",
        managerPersonId: manager.personId,
        employmentType: "consultant"
      },
      admin
    );
    const remoteUser = await store.createUser(
      {
        personId: remotePerson.id,
        email: "  REMOTO.TESTE@DEMO.LOCAL  ",
        password: "demo123",
        roleKey: "employee",
        status: "active"
      },
      admin
    );
    assert.equal(
      remoteUser.email,
      "remoto.teste@demo.local",
      "Cadastro de usuario deve normalizar email"
    );
    const updatedRemoteUser = await store.updateUser(
      remoteUser.id,
      {
        email: "remoto.lider@demo.local",
        roleKey: "manager",
        status: "active",
        password: "nova123"
      },
      admin
    );
    assert.equal(updatedRemoteUser.email, "remoto.lider@demo.local");
    assert.equal(updatedRemoteUser.roleKey, "manager");
    assert.equal(updatedRemoteUser.status, "active");

    const rioPerson = await store.createPerson(
      {
        name: "Pessoa Unidade Rio",
        roleTitle: "Analista Rio",
        area: "Consultoria",
        workUnit: "Rio de Janeiro",
        workMode: "onsite",
        managerPersonId: manager.personId,
        employmentType: "internal"
      },
      admin
    );
    await store.createUser(
      {
        personId: rioPerson.id,
        email: "rio.teste@demo.local",
        password: "demo123",
        roleKey: "employee",
        status: "active"
      },
      admin
    );
    const managedCrossAreaPerson = await store.createPerson(
      {
        name: "Pessoa sob gestao cruzada",
        roleTitle: "Analista de Consultoria",
        area: "Consultoria",
        workUnit: "Sao Paulo",
        workMode: "onsite",
        managerPersonId: employee.personId,
        employmentType: "internal"
      },
      admin
    );
    const managedCrossAreaUser = await store.createUser(
      {
        personId: managedCrossAreaPerson.id,
        email: "gestao.cruzada@demo.local",
        password: "demo123",
        roleKey: "employee",
        status: "active"
      },
      admin
    );

    const workContextCycle = await store.createEvaluationCycle(
      {
        title: "Ciclo por unidade",
        semesterLabel: "2026.3",
        dueDate: "2026-11-30",
        targetGroup: "Todos os colaboradores",
        createdByUserId: admin.id
      },
      admin
    );
    const workContextStructure = await store.getEvaluationCycleParticipants(workContextCycle.id);
    const remoteParticipant = workContextStructure.participants.find(
      (participant) => participant.personId === remotePerson.id
    );
    assert.ok(remoteParticipant, "Pessoa remota deve participar do ciclo");
    assert.equal(
      remoteParticipant.personWorkUnit,
      "Sao Paulo",
      "Estrutura do ciclo deve expor a unidade do participante"
    );
    assert.equal(
      remoteParticipant.personWorkMode,
      "remote",
      "Estrutura do ciclo deve expor a modalidade do participante"
    );
    assert.equal(
      remoteParticipant.raters.some((rater) => rater.relationshipType === "cross-functional"),
      false,
      "Pessoa 100% remota nao deve ser avaliada no Feedback transversal"
    );
    assert.equal(
      workContextStructure.participants.some((participant) =>
        participant.raters.some(
          (rater) =>
            rater.relationshipType === "cross-functional" && rater.raterUserId === remoteUser.id
        )
      ),
      false,
      "Pessoa 100% remota nao deve avaliar no Feedback transversal"
    );

    const rioParticipant = workContextStructure.participants.find(
      (participant) => participant.personId === rioPerson.id
    );
    assert.ok(rioParticipant, "Pessoa de outra unidade deve participar do ciclo");
    assert.equal(
      rioParticipant.raters.some((rater) => rater.relationshipType === "cross-functional"),
      false,
      "Pessoa sem colegas da mesma unidade nao deve receber Feedback transversal"
    );
    assert.ok(
      workContextStructure.transversal.eligible.some(
        (person) => person.personId === employee.personId
      ),
      "Operacao do ciclo deve listar elegiveis do Feedback transversal"
    );
    assert.ok(
      workContextStructure.transversal.ineligible.some(
        (person) => person.personId === remotePerson.id
      ),
      "Operacao do ciclo deve listar pessoas sem pareamento elegivel"
    );
    assert.equal(
      workContextStructure.participants
        .find((participant) => participant.personId === employee.personId)
        ?.raters.some(
          (rater) =>
            rater.relationshipType === "cross-functional" &&
            rater.raterUserId === managedCrossAreaUser.id
        ),
      false,
      "Feedback transversal nao deve parear gestor direto e liderado"
    );

    await store.createArea({ name: "Produto" }, admin);
    await store.createArea({ name: "Suporte" }, admin);

    const productPerson = await store.createPerson(
      {
        name: "Pessoa Produto Sao Paulo",
        roleTitle: "Analista de Produto",
        area: "Produto",
        workUnit: "Sao Paulo",
        workMode: "onsite",
        managerPersonId: manager.personId,
        employmentType: "internal"
      },
      admin
    );
    await store.createUser(
      {
        personId: productPerson.id,
        email: "produto.sp@demo.local",
        password: "demo123",
        roleKey: "employee",
        status: "active"
      },
      admin
    );

    const supportPerson = await store.createPerson(
      {
        name: "Pessoa Suporte Sao Paulo",
        roleTitle: "Analista de Suporte",
        area: "Suporte",
        workUnit: "Sao Paulo",
        workMode: "onsite",
        managerPersonId: manager.personId,
        employmentType: "internal"
      },
      admin
    );
    await store.createUser(
      {
        personId: supportPerson.id,
        email: "suporte.sp@demo.local",
        password: "demo123",
        roleKey: "employee",
        status: "active"
      },
      admin
    );

    const transversalConfigCycle = await store.createEvaluationCycle(
      {
        title: "Ciclo transversal parametrizado",
        semesterLabel: "2026.4",
        dueDate: "2026-12-15",
        targetGroup: "Todos os colaboradores",
        createdByUserId: admin.id
      },
      admin
    );
    await store.updateEvaluationCycleConfig(
      transversalConfigCycle.id,
      {
        transversalConfig: {
          defaultReviewersPerPerson: 2,
          unitOverrides: {
            "Sao Paulo": 2
          }
        }
      },
      admin
    );
    const transversalConfigStructure = await store.getEvaluationCycleParticipants(
      transversalConfigCycle.id
    );
    assert.equal(
      transversalConfigStructure.transversal.config.defaultReviewersPerPerson,
      2,
      "Configuracao transversal deve ficar persistida no ciclo"
    );
    assert.ok(
      (transversalConfigStructure.transversal.pairings || []).some(
        (pairing) =>
          pairing.reviewerUserId === employee.id &&
          pairing.revieweePersonId !== employee.personId
      ),
      "Pareamento transversal deve continuar gerando assignments apos configuracao"
    );
    assert.ok(
      (transversalConfigStructure.transversal.indicators?.coverageRate || 0) > 0,
      "Operacao do ciclo deve expor indicador historico/cobertura do Feedback transversal"
    );

    const employeeActor = await store.getUserById(employee.id);
    await assert.rejects(
      () =>
        store.createFeedbackRequest(
          {
            cycleId: workContextCycle.id,
            providerPersonIds: [rioPerson.id],
            contextNote:
              "Colaboramos em uma frente compartilhada e quero validar a restricao de unidade."
          },
          employeeActor
        ),
      /mesma unidade/i,
      "Feedback direto deve respeitar a mesma unidade de trabalho"
    );

    const overdueCycle = await store.createEvaluationCycle(
      {
        title: "Ciclo inadimplencia",
        semesterLabel: "2026.0",
        dueDate: "2026-03-01",
        targetGroup: "Todos os colaboradores",
        createdByUserId: admin.id
      },
      admin
    );
    await store.updateEvaluationCycleStatus(overdueCycle.id, "Liberado", admin);

    const overdueStructure = await store.getEvaluationCycleParticipants(overdueCycle.id);
    assert.ok(
      overdueStructure.compliance.delinquentAssignments > 0,
      "Ciclo vencido deve expor assignments inadimplentes"
    );
    assert.ok(
      overdueStructure.compliance.delinquencyRate > 0,
      "Ciclo vencido deve calcular taxa de inadimplencia"
    );
    assert.ok(
      overdueStructure.delinquents.length > 0,
      "Estrutura operacional deve listar inadimplentes"
    );

    const notifyDelinquentsResponse = await sendJson(
      `/api/evaluations/cycles/${overdueCycle.id}/notify-delinquents`,
      {
        method: "POST",
        headers: getAuthHeader(hr.id)
      }
    );
    assert.equal(
      notifyDelinquentsResponse.response.status,
      200,
      "RH deve conseguir notificar inadimplentes do ciclo"
    );
    assert.ok(
      notifyDelinquentsResponse.payload.notifiedAssignments > 0,
      "Notificacao deve atingir assignments vencidos"
    );
    assert.ok(
      notifyDelinquentsResponse.payload.delinquentAssignments.every(
        (assignment) => Number(assignment.reminderCount) >= 1
      ),
      "Assignments notificados devem registrar contagem de lembretes"
    );

    const createdCompetency = await store.createCompetency(
      {
        name: "Pensamento sistemico",
        key: "systemic-thinking",
        description: "Capacidade de conectar causas, efeitos e dependencias do processo.",
        status: "active"
      },
      admin
    );

    const updatedCompetency = await store.updateCompetency(
      createdCompetency.id,
      {
        name: "Pensamento sistemico e analitico",
        key: "systemic-thinking",
        description: "Leitura estruturada de cenarios, riscos e interdependencias.",
        status: "active"
      },
      admin
    );

    const competencies = await store.getCompetencies(admin);
    assert.equal(
      updatedCompetency.name,
      "Pensamento sistemico e analitico",
      "Competencia deve permitir manutencao de nome e descricao"
    );
    assert.ok(
      competencies.some((item) => item.id === createdCompetency.id),
      "Cadastro de competencias deve ficar disponivel para governanca do 360"
    );

    const learningIntegrationResponse = await sendJson(
      "/api/development/integrations/learning-events",
      {
        headers: getAuthHeader(hr.id),
        body: {
          sourceSystem: "LMS Corporativo",
          events: [
            {
              externalId: "course-001",
              personEmail: "colaborador1@demo.local",
              title: "Gestao de riscos aplicada",
              providerName: "Academia Corporativa",
              status: "completed",
              completedAt: "2026-04-12",
              workloadHours: 8,
              competencyKey: "risk-management"
            }
          ]
        }
      }
    );
    assert.equal(
      learningIntegrationResponse.response.status,
      202,
      "RH deve conseguir receber eventos de cursos e treinamentos"
    );
    assert.equal(
      learningIntegrationResponse.payload.accepted,
      1,
      "Integracao deve enfileirar o evento recebido"
    );
    assert.equal(
      learningIntegrationResponse.payload.events[0].processingStatus,
      "ready_for_review",
      "Evento com email conhecido deve ficar pronto para revisao"
    );

    const appliedLearningIntegrationResponse = await sendJson(
      `/api/development/integrations/learning-events/${learningIntegrationResponse.payload.events[0].id}/apply`,
      {
        headers: getAuthHeader(hr.id),
        body: {
          reviewNote: "Aplicacao validada pela regressao"
        }
      }
    );
    assert.equal(
      appliedLearningIntegrationResponse.response.status,
      200,
      "RH deve conseguir aplicar curso concluido no Desenvolvimento"
    );
    assert.equal(
      appliedLearningIntegrationResponse.payload.event.processingStatus,
      "applied",
      "Evento aplicado deve registrar status de processamento"
    );
    assert.equal(
      appliedLearningIntegrationResponse.payload.event.appliedEntityType,
      "development_record",
      "Curso concluido deve virar registro de desenvolvimento"
    );

    const developmentRecordsAfterIntegration = await fetchJson(
      "/api/development/records",
      getAuthHeader(hr.id)
    );
    assert.ok(
      developmentRecordsAfterIntegration.payload.some(
        (record) => record.title === "Gestao de riscos aplicada"
      ),
      "Curso aplicado deve aparecer nos registros de desenvolvimento"
    );

    const employeeLearningIntegrationResponse = await sendJson(
      "/api/development/integrations/learning-events",
      {
        headers: getAuthHeader(employee.id),
        body: {
          sourceSystem: "LMS Corporativo",
          events: [
            {
              externalId: "course-002",
              personEmail: "colaborador1@demo.local",
              title: "Curso sem permissao",
              status: "completed"
            }
          ]
        }
      }
    );
    assert.equal(
      employeeLearningIntegrationResponse.response.status,
      403,
      "Colaborador nao deve alimentar integracoes de aprendizagem"
    );
  } finally {
    await context.close();
  }
}
