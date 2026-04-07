import { academicDevelopmentTypes, evaluationModules } from "./appConfig.js";

export function getEvaluationModule(type) {
  return evaluationModules.find((module) => module.relationshipType === type) || null;
}

export function getRelationshipLabel(type) {
  return getEvaluationModule(type)?.label || type;
}

export function getRelationshipDescription(type) {
  return getEvaluationModule(type)?.description || "";
}

export function getEvaluationWorkspaceCopy(moduleKey, workspace = "respond") {
  const defaults = {
    heading: workspace === "insights" ? "Leituras do submodulo" : "Responder avaliacao",
    description:
      workspace === "insights"
        ? "Consolidado visivel para gestao no escopo permitido."
        : "Area exclusiva de resposta das avaliacoes.",
    selectionTitle: "Selecione um assignment",
    selectionDescription: "Escolha uma avaliacao da lista para abrir o formulario completo.",
    emptyAssignmentsTitle: "Nenhum assignment neste submodulo",
    emptyAssignmentsDescription:
      "Troque o submodulo acima para navegar por outro tipo de avaliacao.",
    responseTitle: "Responder avaliacao",
    submitLabel: "Enviar avaliacao",
    evidenceLabel: "Evidencia",
    strengthsLabel: "Pontos fortes",
    developmentLabel: "Oportunidades de desenvolvimento",
    insightsEmptyTitle: "Sem leitura agregada neste submodulo",
    insightsEmptyDescription:
      "O recorte atual ainda nao atingiu o minimo necessario ou nao usa agregacao."
  };

  const byModule = {
    company: {
      heading:
        workspace === "insights" ? "Leitura de satisfacao" : "Avaliacao de satisfacao",
      description:
        workspace === "insights"
          ? "Leitura consolidada da percepcao sobre satisfacao, carreira, recursos e experiencia geral."
          : "Responda a pesquisa de satisfacao sobre experiencia, carreira, recursos e ambiente.",
      responseTitle: "Responder avaliacao de satisfacao",
      submitLabel: "Enviar percepcao",
      evidenceLabel: "Contexto da percepcao",
      strengthsLabel: "O que funciona bem",
      developmentLabel: "O que a empresa pode evoluir"
    },
    leader: {
      heading: workspace === "insights" ? "Escuta da lideranca" : "Avaliacao do lider",
      description:
        workspace === "insights"
          ? "As respostas ficam agregadas para preservar sigilo e orientar a lideranca."
          : "Registre sua percepcao sobre clareza, apoio e direcionamento da lideranca.",
      responseTitle: "Responder avaliacao do lider",
      submitLabel: "Enviar leitura da lideranca",
      evidenceLabel: "Exemplos observados",
      strengthsLabel: "Pontos fortes da lideranca",
      developmentLabel: "Oportunidades para a lideranca"
    },
    manager: {
      heading: workspace === "insights" ? "Leitura do feedback do lider" : "Feedback do lider",
      description:
        workspace === "insights"
          ? "Compare o feedback formal do gestor entre ciclos e acompanhe evolucao."
          : "Registre feedback formal sobre entrega, colaboracao e evolucao do colaborador.",
      responseTitle: "Responder feedback do lider",
      submitLabel: "Enviar feedback do lider",
      evidenceLabel: "Evidencia de desempenho",
      strengthsLabel: "Pontos fortes do colaborador",
      developmentLabel: "Oportunidades de desenvolvimento"
    },
    peer: {
      heading: workspace === "insights" ? "Leitura de feedback direto" : "Feedback direto",
      description:
        workspace === "insights"
          ? "Observe a evolucao da colaboracao real entre pares em cada ciclo."
          : "Foque em parceria real, entrega e colaboracao observada no trabalho direto.",
      responseTitle: "Responder feedback direto",
      submitLabel: "Enviar feedback direto",
      evidenceLabel: "Evidencia da colaboracao",
      strengthsLabel: "Contribuicoes mais fortes",
      developmentLabel: "Oportunidades na parceria",
      emptyAssignmentsTitle: "Nenhum feedback direto gerado",
      emptyAssignmentsDescription:
        "Solicite ou aguarde a aprovacao de fornecedores para este ciclo."
    },
    "cross-functional": {
      heading: workspace === "insights" ? "Leitura de feedback transversal" : "Feedback transversal",
      description:
        workspace === "insights"
          ? "Leitura confidencial da colaboracao transversal entre areas da mesma unidade."
          : "Avalie a colaboracao observada entre areas da mesma unidade.",
      responseTitle: "Responder feedback transversal",
      submitLabel: "Enviar feedback transversal",
      evidenceLabel: "Sinais observados",
      strengthsLabel: "Fortes sinais de relacionamento",
      developmentLabel: "Oportunidades de interacao"
    },
    "client-internal": {
      heading:
        workspace === "insights" ? "Leitura de cliente interno" : "Cliente interno",
      description:
        workspace === "insights"
          ? "Leitura agregada da experiencia das areas clientes com as entregas recebidas."
          : "Avalie atendimento, parceria e valor percebido por quem consome a entrega internamente.",
      responseTitle: "Responder cliente interno",
      submitLabel: "Enviar leitura do cliente interno",
      evidenceLabel: "Contexto da entrega",
      strengthsLabel: "Pontos fortes percebidos",
      developmentLabel: "Oportunidades de melhoria na experiencia"
    },
    "client-external": {
      heading:
        workspace === "insights" ? "Leitura de cliente externo" : "Cliente externo",
      description:
        workspace === "insights"
          ? "Leitura agregada da experiencia de consultorias, parceiros e clientes externos."
          : "Avalie confiabilidade, atendimento e valor entregue na relacao com parceiros ou consultorias.",
      responseTitle: "Responder cliente externo",
      submitLabel: "Enviar leitura do cliente externo",
      evidenceLabel: "Contexto da parceria",
      strengthsLabel: "Pontos fortes percebidos",
      developmentLabel: "Oportunidades na relacao externa"
    },
    self: {
      heading: workspace === "insights" ? "Leitura da autoavaliacao" : "Autoavaliacao",
      description:
        workspace === "insights"
          ? "Historico de autopercepcao do colaborador ao longo dos ciclos."
          : "Registre sua leitura do ciclo, das entregas e do proprio desenvolvimento.",
      responseTitle: "Responder autoavaliacao",
      submitLabel: "Enviar autoavaliacao",
      evidenceLabel: "Base da reflexao",
      strengthsLabel: "Forcas percebidas",
      developmentLabel: "Prioridades de desenvolvimento"
    }
  };

  return {
    ...defaults,
    ...(byModule[moduleKey] || {})
  };
}

export function getEvaluationModuleExperience(moduleKey, workspace = "respond") {
  const defaults = {
    tone: "default",
    spotlightTitle: workspace === "insights" ? "Leitura do submodulo" : "Jornada do submodulo",
    spotlightItems: []
  };

  const byModule = {
    leader: {
      tone: "leader",
      spotlightTitle:
        workspace === "insights" ? "Sigilo e consolidacao" : "Escuta confidencial da lideranca",
      spotlightItems:
        workspace === "insights"
          ? [
              { label: "Consumo", value: "Apenas agregado" },
              { label: "Uso", value: "Apoiar desenvolvimento do lider" },
              { label: "Leitura", value: "Sem expor respostas individuais" }
            ]
          : [
              { label: "Foco", value: "Clareza, apoio e direcionamento" },
              { label: "Sigilo", value: "Resposta confidencial" },
              { label: "Tom", value: "Objetivo e respeitoso" }
            ]
    },
    peer: {
      tone: "peer",
      spotlightTitle:
        workspace === "insights" ? "Colaboracao direta entre pares" : "Parceria real em foco",
      spotlightItems:
        workspace === "insights"
          ? [
              { label: "Base", value: "Fornecedores aprovados no ciclo" },
              { label: "Leitura", value: "Entrega e colaboracao observada" },
              { label: "Comparacao", value: "Evolucao entre ciclos" }
            ]
          : [
              { label: "Base", value: "Experiencia de trabalho direto" },
              { label: "Foco", value: "Entrega, parceria e confiabilidade" },
              { label: "Regra", value: "Ate 3 fornecedores por ciclo" }
            ]
    },
    company: {
      tone: "company",
      spotlightTitle:
        workspace === "insights" ? "Leitura de satisfacao" : "Experiencia e satisfacao",
      spotlightItems: [
        { label: "Tema", value: "Satisfacao, carreira e recursos" },
        { label: "Leitura", value: "Consolidada por ciclo" },
        { label: "Uso", value: "Ajustes institucionais" }
      ]
    },
    manager: {
      tone: "manager",
      spotlightTitle:
        workspace === "insights" ? "Feedback formal da lideranca" : "Evolucao do colaborador",
      spotlightItems: [
        { label: "Base", value: "Entrega observada no ciclo" },
        { label: "Uso", value: "Reconhecer forcas e lacunas" },
        { label: "Resultado", value: "Plano de desenvolvimento" }
      ]
    },
    self: {
      tone: "self",
      spotlightTitle:
        workspace === "insights" ? "Historico de autopercepcao" : "Reflexao sobre o proprio ciclo",
      spotlightItems: [
        { label: "Foco", value: "Autoleitura do semestre" },
        { label: "Base", value: "Entregas, aprendizados e contexto" },
        { label: "Saida", value: "Prioridades de desenvolvimento" }
      ]
    },
    "client-internal": {
      tone: "peer",
      spotlightTitle:
        workspace === "insights" ? "Experiencia do cliente interno" : "Entrega percebida por outras areas",
      spotlightItems: [
        { label: "Foco", value: "Atendimento, parceria e valor entregue" },
        { label: "Origem", value: "Areas clientes do mesmo ciclo" },
        { label: "Uso", value: "Ajustar experiencia entre areas" }
      ]
    },
    "client-external": {
      tone: "leader",
      spotlightTitle:
        workspace === "insights" ? "Experiencia externa consolidada" : "Percepcao de consultoria e parceiros",
      spotlightItems: [
        { label: "Foco", value: "Confiabilidade, atendimento e resultado" },
        { label: "Origem", value: "Consultoria, parceiro ou cliente externo" },
        { label: "Leitura", value: "Apenas consolidada quando houver massa critica" }
      ]
    }
  };

  return {
    ...defaults,
    ...(byModule[moduleKey] || {})
  };
}

export function getVisibilityLabel(visibility) {
  if (visibility === "confidential") {
    return "Confidencial";
  }
  if (visibility === "private") {
    return "Privada";
  }
  return "Compartilhada";
}

export function getCycleStatusDescription(status) {
  if (status === "Planejamento") {
    return "Aguardando liberacao de RH/Admin para abrir respostas.";
  }
  if (status === "Liberado") {
    return "Ciclo aberto para resposta dos assignments distribuidos.";
  }
  if (status === "Encerrado") {
    return "Ciclo fechado para novas interacoes.";
  }
  if (status === "Processado") {
    return "Ciclo consolidado com snapshot final das leituras do periodo.";
  }
  return "Status do ciclo nao identificado.";
}

export function getDevelopmentTrackLabel(recordType) {
  if (academicDevelopmentTypes.has(recordType)) {
    return "Formacao academica";
  }
  if (recordType === "Certificacao") {
    return "Credencial tecnica";
  }
  if (recordType === "Projeto") {
    return "Experiencia aplicada";
  }
  return "Aprendizagem continua";
}

export function getRoleLabel(roleKey) {
  const labels = {
    admin: "Administrador",
    hr: "RH",
    manager: "Gestor",
    employee: "Colaborador",
    compliance: "Compliance"
  };
  return labels[roleKey] || roleKey;
}

export function getAssignmentStatusLabel(status) {
  const labels = {
    pending: "Pendentes",
    submitted: "Concluidas"
  };
  return labels[status] || status;
}

export function getAssignmentStatusBadgeLabel(status) {
  const labels = {
    pending: "Pendente",
    submitted: "Concluida"
  };
  return labels[status] || status;
}

export function getFeedbackRequestStatusLabel(status) {
  const labels = {
    pending: "Pendente",
    approved: "Aprovada",
    rejected: "Recusada"
  };
  return labels[status] || status;
}

export function formatDate(value) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("pt-BR");
}
