export const sections = [
  {
    key: "Dashboard",
    label: "Dashboard",
    icon: "dashboard",
    group: "workspace",
    hint: "Resumo, indicadores e leitura executiva."
  },
  {
    key: "Compliance",
    label: "Compliance",
    icon: "shield",
    group: "workspace",
    hint: "Canal, fila de tratamento e status dos casos."
  },
  {
    key: "Avaliacoes",
    label: "Avaliacoes",
    icon: "clipboard",
    group: "workspace",
    hint: "Fluxos separados por origem do feedback."
  },
  {
    key: "Desenvolvimento",
    label: "Desenvolvimento",
    icon: "growth",
    group: "workspace",
    hint: "Formacao, trilhas e evolucao individual."
  },
  {
    key: "Aplause",
    label: "Aplause",
    icon: "spark",
    group: "workspace",
    hint: "Reconhecimento entre pares e cultura positiva."
  },
  {
    key: "Pessoas",
    label: "Pessoas",
    icon: "people",
    group: "registry",
    hint: "Estrutura da organizacao e cadastro base."
  },
  {
    key: "Usuarios",
    label: "Usuarios",
    icon: "users",
    group: "registry",
    hint: "Acessos, perfis e administracao do ambiente."
  }
];

export const navigationGroups = [
  { key: "workspace", label: "Workspace" },
  { key: "registry", label: "Cadastro" }
];

export const demoAccounts = [
  "admin@demo.local / demo123",
  "rh@demo.local / demo123",
  "gestor@demo.local / demo123",
  "compliance@demo.local / demo123",
  "colaborador1@demo.local / demo123",
  "colaborador2@demo.local / demo123"
];

export const emptyIncident = {
  title: "",
  category: "Conduta Impropria",
  classification: "Nao classificado",
  anonymity: "anonymous",
  reporterLabel: "",
  assignedTo: "RH Corporativo",
  description: ""
};

export const emptyCycle = {
  title: "",
  semesterLabel: "",
  dueDate: "",
  targetGroup: "Todos os colaboradores"
};

export const emptyLibraryPublish = {
  name: "",
  description: ""
};

export const emptyFeedbackRequest = {
  cycleId: "",
  providerPersonIds: [],
  contextNote: ""
};

export const emptyApplause = {
  receiverPersonId: "",
  category: "Colaboracao",
  impact: "",
  contextNote: ""
};

export const emptyDevelopment = {
  personId: "",
  recordType: "Graduacao",
  title: "",
  providerName: "",
  completedAt: "",
  skillSignal: "",
  notes: ""
};

export const emptyPerson = {
  name: "",
  roleTitle: "",
  area: "",
  managerPersonId: "",
  employmentType: "internal",
  satisfactionScore: "4.0"
};

export const emptyUser = {
  personId: "",
  email: "",
  password: "demo123",
  roleKey: "employee",
  status: "active"
};

export const emptyLogin = {
  email: "gestor@demo.local",
  password: "demo123"
};

export const incidentStatusOptions = [
  "Em triagem",
  "Em apuracao",
  "Aguardando retorno",
  "Concluido"
];

export const incidentClassificationOptions = [
  "Conduta e Relacionamento",
  "Integridade e Etica",
  "Assedio e Respeito",
  "Fraude e Desvio",
  "Processos e Controles",
  "Nao classificado"
];

export const userRoleOptions = ["admin", "hr", "manager", "employee", "compliance"];
export const userStatusOptions = ["active", "inactive"];
export const feedbackRequestStatusOptions = ["pending", "approved", "rejected"];

export const developmentRecordTypes = [
  "Graduacao",
  "Pos-graduacao",
  "MBA",
  "Certificacao",
  "Curso",
  "Treinamento",
  "Projeto",
  "Palestra"
];

export const academicDevelopmentTypes = new Set(["Graduacao", "Pos-graduacao", "MBA"]);

export const developmentViewLabels = {
  personal: {
    label: "Meu desenvolvimento",
    description: "Sua trilha individual de formacao, certificacoes e marcos recentes."
  },
  team: {
    label: "Minha equipe",
    description: "Leitura gerencial dos marcos de desenvolvimento dos reportes diretos."
  },
  organization: {
    label: "Organizacao",
    description: "Visao ampla de desenvolvimento para RH e administracao."
  }
};

export const evaluationModules = [
  {
    key: "overview",
    relationshipType: null,
    label: "Visao Geral",
    audience: "Todos os fluxos do ciclo",
    description: "Leitura consolidada das jornadas de avaliacao e feedback."
  },
  {
    key: "company",
    relationshipType: "company",
    label: "Avaliacao de Satisfacao",
    audience: "Funcionario responde a pesquisa de satisfacao",
    description: "Pesquisa institucional sobre experiencia, carreira, recursos e satisfacao."
  },
  {
    key: "leader",
    relationshipType: "leader",
    label: "Avaliacao do Lider",
    audience: "Equipe avalia sua lideranca",
    description: "Leitura confidencial do lider imediato com consumo agregado."
  },
  {
    key: "manager",
    relationshipType: "manager",
    label: "Feedback do Lider",
    audience: "Lider avalia seus funcionarios",
    description: "Feedback formal do gestor sobre entrega, colaboracao e evolucao."
  },
  {
    key: "peer",
    relationshipType: "peer",
    label: "Feedback Direto",
    audience: "Colega que trabalhou diretamente",
    description: "Feedback entre pares com contexto real de colaboracao e entrega."
  },
  {
    key: "cross-functional",
    relationshipType: "cross-functional",
    label: "Feedback Indireto",
    audience: "Colega sem convivencia direta",
    description: "Leitura de soft skills, relacionamento e interacao entre areas."
  },
  {
    key: "self",
    relationshipType: "self",
    label: "Autoavaliacao",
    audience: "Colaborador avalia seu proprio ciclo",
    description: "Reflexao individual complementar ao processo semestral."
  }
];
