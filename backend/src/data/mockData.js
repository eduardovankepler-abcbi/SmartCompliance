import crypto from "crypto";

const hashPassword = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

export const satisfactionScale = [
  { value: 1, label: "Muito insatisfeito" },
  { value: 2, label: "Insatisfeito" },
  { value: 3, label: "Parcialmente satisfeito" },
  { value: 4, label: "Satisfeito" },
  { value: 5, label: "Muito satisfeito" }
];

export const agreementScale = [
  { value: 5, label: "Concordo totalmente" },
  { value: 4, label: "Concordo parcialmente" },
  { value: 3, label: "Nem concordo, nem discordo" },
  { value: 2, label: "Discordo parcialmente" },
  { value: 1, label: "Discordo totalmente" }
];

export const performanceScale = [
  { value: 1, label: "Muito abaixo do esperado" },
  { value: 2, label: "Abaixo do esperado" },
  { value: 3, label: "Dentro do esperado" },
  { value: 4, label: "Acima do esperado" },
  { value: 5, label: "Muito acima do esperado" }
];

export const evaluationScaleProfiles = {
  satisfaction: satisfactionScale,
  agreement: agreementScale,
  performance: performanceScale
};

function createScaleQuestion({
  id,
  sectionKey,
  sectionTitle,
  sectionDescription = "",
  dimensionKey,
  dimensionTitle,
  prompt,
  helperText = "",
  sortOrder,
  visibility,
  scaleProfile = "agreement",
  collectEvidenceOnExtreme = false
}) {
  return {
    id,
    sectionKey,
    sectionTitle,
    sectionDescription,
    dimensionKey,
    dimensionTitle,
    prompt,
    helperText,
    sortOrder,
    isRequired: true,
    visibility,
    inputType: "scale",
    scaleProfile,
    collectEvidenceOnExtreme
  };
}

function createTextQuestion({
  id,
  sectionKey,
  sectionTitle,
  sectionDescription = "",
  dimensionKey,
  dimensionTitle,
  prompt,
  helperText = "",
  sortOrder,
  visibility
}) {
  return {
    id,
    sectionKey,
    sectionTitle,
    sectionDescription,
    dimensionKey,
    dimensionTitle,
    prompt,
    helperText,
    sortOrder,
    isRequired: true,
    visibility,
    inputType: "text"
  };
}

function createMultiSelectQuestion({
  id,
  sectionKey,
  sectionTitle,
  sectionDescription = "",
  dimensionKey,
  dimensionTitle,
  prompt,
  helperText = "",
  sortOrder,
  visibility,
  options
}) {
  return {
    id,
    sectionKey,
    sectionTitle,
    sectionDescription,
    dimensionKey,
    dimensionTitle,
    prompt,
    helperText,
    sortOrder,
    isRequired: true,
    visibility,
    inputType: "multi-select",
    options
  };
}

export const evaluationLibrary = {
  scale: satisfactionScale,
  weights: {
    self: 0.15,
    peer: 0.15,
    manager: 0.25,
    "cross-functional": 0.1,
    "client-internal": 0.1,
    "client-external": 0.1,
    leader: 0.1,
    company: 0.05
  },
  templates: {
    collaboration: {
      id: "t1",
      key: "collaboration",
      modelName: "Feedback de Colaboracao",
      description:
        "Questionario padrao para feedback entre pares, lideranca direta e colaboracoes cruzadas.",
      policy: {
        strategy: "hybrid-template",
        managerCustomQuestionsLimit: 3,
        scale: satisfactionScale,
        confidentiality: "mixed",
        showStrengthsNote: true,
        showDevelopmentNote: true
      },
      questions: [
        createScaleQuestion({
          id: "q1",
          sectionKey: "collaboration",
          sectionTitle: "Feedback de Colaboracao",
          dimensionKey: "delivery",
          dimensionTitle: "Qualidade das Entregas",
          prompt: "Quao satisfeito voce ficou com a qualidade das entregas feitas por esta pessoa?",
          sortOrder: 1,
          visibility: "shared",
          scaleProfile: "satisfaction",
          collectEvidenceOnExtreme: true
        }),
        createScaleQuestion({
          id: "q2",
          sectionKey: "collaboration",
          sectionTitle: "Feedback de Colaboracao",
          dimensionKey: "delivery",
          dimensionTitle: "Confiabilidade",
          prompt:
            "Quao satisfeito voce ficou com a consistencia e a responsabilidade demonstradas no periodo?",
          sortOrder: 2,
          visibility: "shared",
          scaleProfile: "satisfaction",
          collectEvidenceOnExtreme: true
        }),
        createScaleQuestion({
          id: "q3",
          sectionKey: "collaboration",
          sectionTitle: "Feedback de Colaboracao",
          dimensionKey: "collaboration",
          dimensionTitle: "Colaboracao",
          prompt: "Quao satisfeito voce ficou com a colaboracao com colegas e outras areas?",
          sortOrder: 3,
          visibility: "shared",
          scaleProfile: "satisfaction",
          collectEvidenceOnExtreme: true
        }),
        createScaleQuestion({
          id: "q4",
          sectionKey: "collaboration",
          sectionTitle: "Feedback de Colaboracao",
          dimensionKey: "collaboration",
          dimensionTitle: "Compartilhamento",
          prompt:
            "Quao satisfeito voce ficou com a disposicao desta pessoa em compartilhar conhecimento e apoiar o time?",
          sortOrder: 4,
          visibility: "shared",
          scaleProfile: "satisfaction",
          collectEvidenceOnExtreme: true
        }),
        createScaleQuestion({
          id: "q5",
          sectionKey: "collaboration",
          sectionTitle: "Feedback de Colaboracao",
          dimensionKey: "communication",
          dimensionTitle: "Comunicacao",
          prompt:
            "Quao satisfeito voce ficou com a clareza de comunicacao sobre prioridades, riscos e proximos passos?",
          sortOrder: 5,
          visibility: "shared",
          scaleProfile: "satisfaction",
          collectEvidenceOnExtreme: true
        }),
        createScaleQuestion({
          id: "q6",
          sectionKey: "collaboration",
          sectionTitle: "Feedback de Colaboracao",
          dimensionKey: "interpersonal",
          dimensionTitle: "Relacionamento Interpessoal",
          prompt:
            "Quao satisfeito voce ficou com a postura profissional, o respeito e a capacidade de relacionamento desta pessoa?",
          sortOrder: 6,
          visibility: "shared",
          scaleProfile: "satisfaction",
          collectEvidenceOnExtreme: true
        })
      ]
    },
    self: {
      id: "t2",
      key: "self",
      modelName: "Autoavaliacao profissional 02/2026",
      description:
        "Questionario completo de autoavaliacao profissional, alinhado ao formulario oficial do ciclo 02/2026.",
      policy: {
        strategy: "standard-library",
        managerCustomQuestionsLimit: 0,
        scale: agreementScale,
        confidentiality: "private-to-employee-and-manager",
        showStrengthsNote: false,
        showDevelopmentNote: false
      },
      questions: [
        createScaleQuestion({
          id: "q_self_01",
          sectionKey: "delivery",
          sectionTitle: "Desempenho e Entregas",
          sectionDescription:
            "Avalie como voce cumpre prazos, organiza tarefas, mantem a qualidade das entregas e resolve problemas no dia a dia.",
          dimensionKey: "delivery",
          dimensionTitle: "Cumprimento de prazos",
          prompt: "1) Cumpro minhas tarefas e entregas dentro dos prazos estabelecidos.",
          helperText:
            "Avalie se voce consegue concluir suas atividades dentro do tempo esperado.",
          sortOrder: 1,
          visibility: "private"
        }),
        createScaleQuestion({
          id: "q_self_02",
          sectionKey: "delivery",
          sectionTitle: "Desempenho e Entregas",
          sectionDescription:
            "Avalie como voce cumpre prazos, organiza tarefas, mantem a qualidade das entregas e resolve problemas no dia a dia.",
          dimensionKey: "delivery",
          dimensionTitle: "Qualidade e precisao",
          prompt: "2) Minhas atividades sao realizadas com atencao a qualidade e precisao.",
          helperText:
            "Considere se voce entrega trabalhos com cuidado e atencao aos detalhes.",
          sortOrder: 2,
          visibility: "private"
        }),
        createScaleQuestion({
          id: "q_self_03",
          sectionKey: "delivery",
          sectionTitle: "Desempenho e Entregas",
          sectionDescription:
            "Avalie como voce cumpre prazos, organiza tarefas, mantem a qualidade das entregas e resolve problemas no dia a dia.",
          dimensionKey: "delivery",
          dimensionTitle: "Resolucao de problemas",
          prompt:
            "3) Consigo lidar eficientemente com problemas ou obstaculos que surgem no trabalho.",
          helperText:
            "Reflita se voce consegue encontrar solucoes ou alternativas quando surgem dificuldades.",
          sortOrder: 3,
          visibility: "private"
        }),
        createScaleQuestion({
          id: "q_self_04",
          sectionKey: "delivery",
          sectionTitle: "Desempenho e Entregas",
          sectionDescription:
            "Avalie como voce cumpre prazos, organiza tarefas, mantem a qualidade das entregas e resolve problemas no dia a dia.",
          dimensionKey: "delivery",
          dimensionTitle: "Organizacao e priorizacao",
          prompt: "4) Procuro organizar minhas tarefas para otimizar resultados e tempo.",
          helperText: "Considere se voce planeja e prioriza bem suas atividades diarias.",
          sortOrder: 4,
          visibility: "private"
        }),
        createScaleQuestion({
          id: "q_self_05",
          sectionKey: "knowledge",
          sectionTitle: "Conhecimento e Desenvolvimento",
          sectionDescription:
            "Considere seu dominio tecnico, capacidade de aprendizado, aplicacao pratica de conhecimentos e abertura a feedbacks.",
          dimensionKey: "knowledge",
          dimensionTitle: "Dominio tecnico",
          prompt:
            "5) Tenho dominio adequado dos conhecimentos tecnicos necessarios para meu trabalho.",
          helperText:
            "Reflita sobre seu nivel de conhecimento tecnico para desempenhar suas funcoes com eficiencia.",
          sortOrder: 5,
          visibility: "private"
        }),
        createScaleQuestion({
          id: "q_self_06",
          sectionKey: "knowledge",
          sectionTitle: "Conhecimento e Desenvolvimento",
          sectionDescription:
            "Considere seu dominio tecnico, capacidade de aprendizado, aplicacao pratica de conhecimentos e abertura a feedbacks.",
          dimensionKey: "development",
          dimensionTitle: "Aprendizado continuo",
          prompt: "6) Busco aprender constantemente e desenvolver novas habilidades.",
          helperText:
            "Considere se voce procura oportunidades para aprimorar competencias e conhecimentos.",
          sortOrder: 6,
          visibility: "private"
        }),
        createScaleQuestion({
          id: "q_self_07",
          sectionKey: "knowledge",
          sectionTitle: "Conhecimento e Desenvolvimento",
          sectionDescription:
            "Considere seu dominio tecnico, capacidade de aprendizado, aplicacao pratica de conhecimentos e abertura a feedbacks.",
          dimensionKey: "development",
          dimensionTitle: "Aplicacao pratica",
          prompt:
            "7) Consigo aplicar de forma pratica o que aprendi em treinamentos, cursos ou experiencias anteriores.",
          helperText:
            "Avalie se consegue utilizar os aprendizados adquiridos no dia a dia.",
          sortOrder: 7,
          visibility: "private"
        }),
        createScaleQuestion({
          id: "q_self_08",
          sectionKey: "knowledge",
          sectionTitle: "Conhecimento e Desenvolvimento",
          sectionDescription:
            "Considere seu dominio tecnico, capacidade de aprendizado, aplicacao pratica de conhecimentos e abertura a feedbacks.",
          dimensionKey: "development",
          dimensionTitle: "Abertura a feedbacks",
          prompt:
            "8) Estou aberto a feedbacks e procuro utiliza-los para melhorar meu desempenho.",
          helperText:
            "Reflita sobre sua receptividade a orientacoes e sugestoes de melhoria.",
          sortOrder: 8,
          visibility: "private"
        }),
        createScaleQuestion({
          id: "q_self_09",
          sectionKey: "teamwork",
          sectionTitle: "Trabalho em Equipe e Colaboracao",
          sectionDescription:
            "Reflita sobre sua contribuicao a equipe, compartilhamento de conhecimentos, comunicacao e resolucao de conflitos.",
          dimensionKey: "collaboration",
          dimensionTitle: "Colaboracao com a equipe",
          prompt: "9) Colaboro de forma produtiva com meus colegas de equipe.",
          helperText:
            "Considere se voce contribui positivamente para o trabalho coletivo.",
          sortOrder: 9,
          visibility: "private"
        }),
        createScaleQuestion({
          id: "q_self_10",
          sectionKey: "teamwork",
          sectionTitle: "Trabalho em Equipe e Colaboracao",
          sectionDescription:
            "Reflita sobre sua contribuicao a equipe, compartilhamento de conhecimentos, comunicacao e resolucao de conflitos.",
          dimensionKey: "collaboration",
          dimensionTitle: "Compartilhamento de conhecimentos",
          prompt:
            "10) Compartilho conhecimentos e experiencias que ajudam o desempenho da equipe.",
          helperText: "Avalie se voce divide informacoes que beneficiam o grupo.",
          sortOrder: 10,
          visibility: "private"
        }),
        createScaleQuestion({
          id: "q_self_11",
          sectionKey: "teamwork",
          sectionTitle: "Trabalho em Equipe e Colaboracao",
          sectionDescription:
            "Reflita sobre sua contribuicao a equipe, compartilhamento de conhecimentos, comunicacao e resolucao de conflitos.",
          dimensionKey: "communication",
          dimensionTitle: "Comunicacao clara e respeitosa",
          prompt:
            "11) Mantenho uma comunicacao clara e respeitosa com colegas e stakeholders.",
          helperText: "Reflita se voce se comunica de forma efetiva e adequada.",
          sortOrder: 11,
          visibility: "private"
        }),
        createScaleQuestion({
          id: "q_self_12",
          sectionKey: "teamwork",
          sectionTitle: "Trabalho em Equipe e Colaboracao",
          sectionDescription:
            "Reflita sobre sua contribuicao a equipe, compartilhamento de conhecimentos, comunicacao e resolucao de conflitos.",
          dimensionKey: "interpersonal",
          dimensionTitle: "Conflitos e divergencias",
          prompt:
            "12) Consigo lidar de forma construtiva com conflitos ou divergencias de opiniao.",
          helperText:
            "Considere se voce consegue resolver conflitos mantendo o respeito e equilibrio.",
          sortOrder: 12,
          visibility: "private"
        }),
        createScaleQuestion({
          id: "q_self_13",
          sectionKey: "commitment",
          sectionTitle: "Comprometimento e Responsabilidade",
          sectionDescription:
            "Avalie seu comprometimento com metas e objetivos, responsabilidade pelas tarefas e capacidade de perseverar diante de desafios.",
          dimensionKey: "commitment",
          dimensionTitle: "Comprometimento com objetivos",
          prompt: "13) Demonstro comprometimento com os objetivos da equipe e da empresa.",
          helperText:
            "Avalie se voce se envolve e se dedica as metas da equipe e da organizacao.",
          sortOrder: 13,
          visibility: "private"
        }),
        createScaleQuestion({
          id: "q_self_14",
          sectionKey: "commitment",
          sectionTitle: "Comprometimento e Responsabilidade",
          sectionDescription:
            "Avalie seu comprometimento com metas e objetivos, responsabilidade pelas tarefas e capacidade de perseverar diante de desafios.",
          dimensionKey: "responsibility",
          dimensionTitle: "Responsabilidade por resultados",
          prompt: "14) Assumo responsabilidade por minhas tarefas e resultados.",
          helperText:
            "Reflita se voce reconhece sua participacao nos resultados positivos e negativos.",
          sortOrder: 14,
          visibility: "private"
        }),
        createScaleQuestion({
          id: "q_self_15",
          sectionKey: "commitment",
          sectionTitle: "Comprometimento e Responsabilidade",
          sectionDescription:
            "Avalie seu comprometimento com metas e objetivos, responsabilidade pelas tarefas e capacidade de perseverar diante de desafios.",
          dimensionKey: "responsibility",
          dimensionTitle: "Conformidade com regras",
          prompt: "15) Cumpro regras, normas e procedimentos da empresa com consistencia.",
          helperText:
            "Considere se voce segue politicas e praticas da empresa de forma confiavel.",
          sortOrder: 15,
          visibility: "private"
        }),
        createScaleQuestion({
          id: "q_self_16",
          sectionKey: "growth",
          sectionTitle: "Potencial e Crescimento",
          sectionDescription:
            "Considere sua iniciativa, interesse em assumir novas responsabilidades, oportunidades de desenvolvimento e autonomia no trabalho.",
          dimensionKey: "growth",
          dimensionTitle: "Perseveranca diante de desafios",
          prompt:
            "16) Me esforco para superar desafios e atingir metas mesmo diante de dificuldades.",
          helperText:
            "Avalie se voce persevera para alcancar resultados, mesmo com obstaculos.",
          sortOrder: 16,
          visibility: "private"
        }),
        createScaleQuestion({
          id: "q_self_17",
          sectionKey: "growth",
          sectionTitle: "Potencial e Crescimento",
          sectionDescription:
            "Considere sua iniciativa, interesse em assumir novas responsabilidades, oportunidades de desenvolvimento e autonomia no trabalho.",
          dimensionKey: "growth",
          dimensionTitle: "Novos desafios",
          prompt:
            "17) Tenho interesse em assumir novas responsabilidades e desafios profissionais.",
          helperText:
            "Reflita sobre sua disposicao para assumir tarefas maiores ou mais complexas.",
          sortOrder: 17,
          visibility: "private"
        }),
        createScaleQuestion({
          id: "q_self_18",
          sectionKey: "growth",
          sectionTitle: "Potencial e Crescimento",
          sectionDescription:
            "Considere sua iniciativa, interesse em assumir novas responsabilidades, oportunidades de desenvolvimento e autonomia no trabalho.",
          dimensionKey: "growth",
          dimensionTitle: "Busca de crescimento",
          prompt: "18) Busco oportunidades de crescimento e desenvolvimento dentro da empresa.",
          helperText: "Considere se voce procura se desenvolver e evoluir na carreira.",
          sortOrder: 18,
          visibility: "private"
        }),
        createScaleQuestion({
          id: "q_self_19",
          sectionKey: "growth",
          sectionTitle: "Potencial e Crescimento",
          sectionDescription:
            "Considere sua iniciativa, interesse em assumir novas responsabilidades, oportunidades de desenvolvimento e autonomia no trabalho.",
          dimensionKey: "initiative",
          dimensionTitle: "Iniciativa para melhorias",
          prompt:
            "19) Demonstro iniciativa para propor melhorias ou solucoes inovadoras em meu trabalho.",
          helperText:
            "Avalie se voce sugere ideias ou melhorias para processos ou resultados.",
          sortOrder: 19,
          visibility: "private"
        }),
        createScaleQuestion({
          id: "q_self_20",
          sectionKey: "growth",
          sectionTitle: "Potencial e Crescimento",
          sectionDescription:
            "Considere sua iniciativa, interesse em assumir novas responsabilidades, oportunidades de desenvolvimento e autonomia no trabalho.",
          dimensionKey: "autonomy",
          dimensionTitle: "Autonomia no dia a dia",
          prompt:
            "20) Sinto-me capaz de lidar de forma autonoma com minhas atividades e decisoes diarias.",
          helperText:
            "Reflita sobre sua capacidade de atuar de forma independente, mantendo resultados satisfatorios.",
          sortOrder: 20,
          visibility: "private"
        }),
        createTextQuestion({
          id: "q_self_21",
          sectionKey: "final",
          sectionTitle: "Consideracoes Finais",
          sectionDescription:
            "Espaco para voce registrar comentarios, feedbacks ou sugestoes adicionais que considere importantes.",
          dimensionKey: "final-comments",
          dimensionTitle: "Sugestoes e observacoes",
          prompt:
            "Escreva aqui suas sugestoes, ideias de melhoria, observacoes sobre processos, comunicacao, recursos, desenvolvimento da equipe, lideranca ou qualquer outro ponto relevante para aprimorar seu trabalho, sua equipe ou a empresa.",
          sortOrder: 21,
          visibility: "private"
        })
      ]
    },
    manager: {
      id: "t3",
      key: "manager",
      modelName: "Feedback do lider sobre o colaborador",
      description:
        "Questionario padrao para avaliacao gerencial do colaborador, com foco em desempenho, potencial e desenvolvimento.",
      policy: {
        strategy: "standard-library",
        managerCustomQuestionsLimit: 0,
        scale: performanceScale,
        confidentiality: "private-to-employee-and-manager",
        showStrengthsNote: false,
        showDevelopmentNote: false
      },
      questions: [
        createScaleQuestion({
          id: "q_manager_01",
          sectionKey: "results",
          sectionTitle: "Resultados",
          sectionDescription:
            "Avalie consistencia de entrega, qualidade e responsabilizacao pelos resultados.",
          dimensionKey: "results",
          dimensionTitle: "Cumprimento de prazos",
          prompt: "Cumpre prazos e entregas com consistencia",
          sortOrder: 1,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_02",
          sectionKey: "results",
          sectionTitle: "Resultados",
          sectionDescription:
            "Avalie consistencia de entrega, qualidade e responsabilizacao pelos resultados.",
          dimensionKey: "results",
          dimensionTitle: "Qualidade das entregas",
          prompt: "Entrega trabalho com qualidade adequada",
          sortOrder: 2,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_03",
          sectionKey: "results",
          sectionTitle: "Resultados",
          sectionDescription:
            "Avalie consistencia de entrega, qualidade e responsabilizacao pelos resultados.",
          dimensionKey: "results",
          dimensionTitle: "Responsabilidade pelos resultados",
          prompt: "Assume responsabilidade pelos resultados",
          sortOrder: 3,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_04",
          sectionKey: "teamwork",
          sectionTitle: "Trabalho em equipe",
          sectionDescription:
            "Considere colaboracao, convivencia profissional e contribuicao para o ambiente da equipe.",
          dimensionKey: "teamwork",
          dimensionTitle: "Colaboracao com a equipe",
          prompt: "Colabora de forma efetiva com a equipe",
          sortOrder: 4,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_05",
          sectionKey: "teamwork",
          sectionTitle: "Trabalho em equipe",
          sectionDescription:
            "Considere colaboracao, convivencia profissional e contribuicao para o ambiente da equipe.",
          dimensionKey: "teamwork",
          dimensionTitle: "Respeito e ambiente positivo",
          prompt: "Demonstra respeito e contribui para um ambiente positivo",
          sortOrder: 5,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_06",
          sectionKey: "communication",
          sectionTitle: "Comunicacao",
          sectionDescription:
            "Avalie clareza, objetividade e transparencia do colaborador na comunicacao do trabalho.",
          dimensionKey: "communication",
          dimensionTitle: "Comunicacao clara",
          prompt: "Comunica-se de forma clara e objetiva",
          sortOrder: 6,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_07",
          sectionKey: "communication",
          sectionTitle: "Comunicacao",
          sectionDescription:
            "Avalie clareza, objetividade e transparencia do colaborador na comunicacao do trabalho.",
          dimensionKey: "communication",
          dimensionTitle: "Alinhamento com o gestor",
          prompt: "Mantem o gestor informado sobre o andamento das atividades",
          sortOrder: 7,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_08",
          sectionKey: "proactivity",
          sectionTitle: "Proatividade",
          sectionDescription:
            "Considere iniciativa, autonomia e contribuicao do colaborador diante de desafios.",
          dimensionKey: "proactivity",
          dimensionTitle: "Resolucao de problemas",
          prompt: "Demonstra iniciativa na resolucao de problemas",
          sortOrder: 8,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_09",
          sectionKey: "proactivity",
          sectionTitle: "Proatividade",
          sectionDescription:
            "Considere iniciativa, autonomia e contribuicao do colaborador diante de desafios.",
          dimensionKey: "proactivity",
          dimensionTitle: "Melhorias e novas ideias",
          prompt: "Propoe melhorias e novas ideias",
          sortOrder: 9,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_10",
          sectionKey: "organization",
          sectionTitle: "Organizacao",
          sectionDescription:
            "Avalie capacidade de planejamento, priorizacao e tratamento de volume de trabalho.",
          dimensionKey: "organization",
          dimensionTitle: "Organizacao de tarefas",
          prompt: "Organiza bem suas tarefas e prioridades",
          sortOrder: 10,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_11",
          sectionKey: "organization",
          sectionTitle: "Organizacao",
          sectionDescription:
            "Avalie capacidade de planejamento, priorizacao e tratamento de volume de trabalho.",
          dimensionKey: "organization",
          dimensionTitle: "Multiplas demandas",
          prompt: "Consegue lidar com multiplas demandas",
          sortOrder: 11,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_12",
          sectionKey: "technical-capability",
          sectionTitle: "Capacidade tecnica",
          sectionDescription:
            "Considere dominio tecnico, autonomia e resolucao de problemas na funcao atual.",
          dimensionKey: "technical-capability",
          dimensionTitle: "Conhecimento tecnico",
          prompt: "Possui conhecimento tecnico adequado para a funcao",
          sortOrder: 12,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_13",
          sectionKey: "technical-capability",
          sectionTitle: "Capacidade tecnica",
          sectionDescription:
            "Considere dominio tecnico, autonomia e resolucao de problemas na funcao atual.",
          dimensionKey: "technical-capability",
          dimensionTitle: "Autonomia tecnica",
          prompt: "Resolve problemas com autonomia",
          sortOrder: 13,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_14",
          sectionKey: "business-focus",
          sectionTitle: "Foco no negocio",
          sectionDescription:
            "Avalie entendimento do contexto de negocio e priorizacao do que gera mais valor.",
          dimensionKey: "business-focus",
          dimensionTitle: "Impacto no negocio",
          prompt: "Entende o impacto do seu trabalho no negocio",
          sortOrder: 14,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_15",
          sectionKey: "business-focus",
          sectionTitle: "Foco no negocio",
          sectionDescription:
            "Avalie entendimento do contexto de negocio e priorizacao do que gera mais valor.",
          dimensionKey: "business-focus",
          dimensionTitle: "Prioridade de valor",
          prompt: "Prioriza atividades de maior valor",
          sortOrder: 15,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_16",
          sectionKey: "overall",
          sectionTitle: "Avaliacao geral",
          sectionDescription:
            "Registre a leitura geral do desempenho atual e do potencial de crescimento do colaborador.",
          dimensionKey: "overall",
          dimensionTitle: "Desempenho geral",
          prompt: "Desempenho geral do colaborador",
          sortOrder: 16,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_17",
          sectionKey: "overall",
          sectionTitle: "Avaliacao geral",
          sectionDescription:
            "Registre a leitura geral do desempenho atual e do potencial de crescimento do colaborador.",
          dimensionKey: "overall",
          dimensionTitle: "Potencial de crescimento",
          prompt: "Potencial de crescimento",
          sortOrder: 17,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createTextQuestion({
          id: "q_manager_18",
          sectionKey: "open-feedback",
          sectionTitle: "Perguntas abertas",
          sectionDescription:
            "Registre uma leitura qualitativa para orientar a devolutiva e o desenvolvimento do colaborador.",
          dimensionKey: "open-feedback",
          dimensionTitle: "Pontos fortes",
          prompt: "Quais sao os principais pontos fortes do colaborador?",
          sortOrder: 18,
          visibility: "private"
        }),
        createTextQuestion({
          id: "q_manager_19",
          sectionKey: "open-feedback",
          sectionTitle: "Perguntas abertas",
          sectionDescription:
            "Registre uma leitura qualitativa para orientar a devolutiva e o desenvolvimento do colaborador.",
          dimensionKey: "open-feedback",
          dimensionTitle: "Pontos de melhoria",
          prompt: "Quais sao os principais pontos de melhoria?",
          sortOrder: 19,
          visibility: "private"
        }),
        createTextQuestion({
          id: "q_manager_20",
          sectionKey: "open-feedback",
          sectionTitle: "Perguntas abertas",
          sectionDescription:
            "Registre uma leitura qualitativa para orientar a devolutiva e o desenvolvimento do colaborador.",
          dimensionKey: "open-feedback",
          dimensionTitle: "Recomendacao de desenvolvimento",
          prompt: "Que tipo de desenvolvimento voce recomenda?",
          sortOrder: 20,
          visibility: "private"
        })
      ]
    },
    "cross-functional": {
      id: "t3b",
      key: "cross-functional",
      modelName: "Feedback transversal organizacional",
      description:
        "Questionario enxuto para percepcao indireta entre areas, com foco em colaboracao, postura, cultura e sinais observaveis no ambiente organizacional.",
      policy: {
        strategy: "standard-library",
        managerCustomQuestionsLimit: 0,
        scale: satisfactionScale,
        confidentiality: "anonymous-aggregate",
        showStrengthsNote: false,
        showDevelopmentNote: false
      },
      questions: [
        createScaleQuestion({
          id: "q_cross_01",
          sectionKey: "organizational-collaboration",
          sectionTitle: "Colaboracao organizacional",
          sectionDescription:
            "Considere apenas o que e perceptivel na convivencia organizacional e nas interacoes entre times.",
          dimensionKey: "organizational-collaboration",
          dimensionTitle: "Disposicao para colaborar",
          prompt: "Demonstra disposicao para colaborar quando necessario",
          sortOrder: 1,
          visibility: "confidential",
          scaleProfile: "satisfaction"
        }),
        createScaleQuestion({
          id: "q_cross_02",
          sectionKey: "organizational-collaboration",
          sectionTitle: "Colaboracao organizacional",
          sectionDescription:
            "Considere apenas o que e perceptivel na convivencia organizacional e nas interacoes entre times.",
          dimensionKey: "organizational-collaboration",
          dimensionTitle: "Acessibilidade entre times",
          prompt: "E acessivel e aberto a interacoes com outros times",
          sortOrder: 2,
          visibility: "confidential",
          scaleProfile: "satisfaction"
        }),
        createScaleQuestion({
          id: "q_cross_03",
          sectionKey: "communication",
          sectionTitle: "Comunicacao",
          sectionDescription:
            "Avalie apenas sinais observaveis em reunioes, chats e interacoes compartilhadas.",
          dimensionKey: "communication",
          dimensionTitle: "Clareza em ambientes compartilhados",
          prompt: "Comunica-se de forma clara em ambientes compartilhados (reunioes, chats, etc.)",
          sortOrder: 3,
          visibility: "confidential",
          scaleProfile: "satisfaction"
        }),
        createScaleQuestion({
          id: "q_cross_04",
          sectionKey: "communication",
          sectionTitle: "Comunicacao",
          sectionDescription:
            "Avalie apenas sinais observaveis em reunioes, chats e interacoes compartilhadas.",
          dimensionKey: "communication",
          dimensionTitle: "Respeito na comunicacao",
          prompt: "Demonstra respeito na comunicacao com outros",
          sortOrder: 4,
          visibility: "confidential",
          scaleProfile: "satisfaction"
        }),
        createScaleQuestion({
          id: "q_cross_05",
          sectionKey: "professional-posture",
          sectionTitle: "Postura profissional",
          sectionDescription:
            "Considere o comportamento percebido no ambiente profissional e institucional.",
          dimensionKey: "professional-posture",
          dimensionTitle: "Comportamento profissional",
          prompt: "Demonstra comportamento profissional adequado",
          sortOrder: 5,
          visibility: "confidential",
          scaleProfile: "satisfaction"
        }),
        createScaleQuestion({
          id: "q_cross_06",
          sectionKey: "professional-posture",
          sectionTitle: "Postura profissional",
          sectionDescription:
            "Considere o comportamento percebido no ambiente profissional e institucional.",
          dimensionKey: "professional-posture",
          dimensionTitle: "Etica e respeito",
          prompt: "Age com etica e respeito no ambiente de trabalho",
          sortOrder: 6,
          visibility: "confidential",
          scaleProfile: "satisfaction"
        }),
        createScaleQuestion({
          id: "q_cross_07",
          sectionKey: "culture",
          sectionTitle: "Atitude e cultura",
          sectionDescription:
            "Observe a contribuicao geral para o clima e para a cultura da organizacao.",
          dimensionKey: "culture",
          dimensionTitle: "Ambiente positivo",
          prompt: "Contribui para um ambiente de trabalho positivo",
          sortOrder: 7,
          visibility: "confidential",
          scaleProfile: "satisfaction"
        }),
        createScaleQuestion({
          id: "q_cross_08",
          sectionKey: "culture",
          sectionTitle: "Atitude e cultura",
          sectionDescription:
            "Observe a contribuicao geral para o clima e para a cultura da organizacao.",
          dimensionKey: "culture",
          dimensionTitle: "Atitude colaborativa organizacional",
          prompt: "Demonstra atitude colaborativa com a organizacao como um todo",
          sortOrder: 8,
          visibility: "confidential",
          scaleProfile: "satisfaction"
        }),
        createScaleQuestion({
          id: "q_cross_09",
          sectionKey: "visible-proactivity",
          sectionTitle: "Proatividade perceptivel",
          sectionDescription:
            "Considere apenas iniciativas observaveis em interacoes institucionais ou entre areas.",
          dimensionKey: "visible-proactivity",
          dimensionTitle: "Iniciativa observavel",
          prompt: "Demonstra iniciativa em interacoes organizacionais (reunioes, discussoes, etc.)",
          sortOrder: 9,
          visibility: "confidential",
          scaleProfile: "satisfaction"
        }),
        createScaleQuestion({
          id: "q_cross_10",
          sectionKey: "visible-proactivity",
          sectionTitle: "Proatividade perceptivel",
          sectionDescription:
            "Considere apenas iniciativas observaveis em interacoes institucionais ou entre areas.",
          dimensionKey: "visible-proactivity",
          dimensionTitle: "Engajamento perceptivel",
          prompt: "Parece engajado com o trabalho e com a empresa",
          sortOrder: 10,
          visibility: "confidential",
          scaleProfile: "satisfaction"
        }),
        createTextQuestion({
          id: "q_cross_11",
          sectionKey: "open-feedback",
          sectionTitle: "Perguntas abertas",
          sectionDescription:
            "Use este espaco com base apenas na sua percepcao geral e em sinais observados no contexto organizacional.",
          dimensionKey: "open-feedback",
          dimensionTitle: "Pontos fortes percebidos",
          prompt: "Com base na sua percepcao geral, quais sao os principais pontos fortes deste colaborador?",
          sortOrder: 11,
          visibility: "confidential"
        }),
        createTextQuestion({
          id: "q_cross_12",
          sectionKey: "open-feedback",
          sectionTitle: "Perguntas abertas",
          sectionDescription:
            "Use este espaco com base apenas na sua percepcao geral e em sinais observados no contexto organizacional.",
          dimensionKey: "open-feedback",
          dimensionTitle: "Comportamentos a melhorar",
          prompt: "Ha algum comportamento que poderia ser melhorado?",
          sortOrder: 12,
          visibility: "confidential"
        }),
        createTextQuestion({
          id: "q_cross_13",
          sectionKey: "open-feedback",
          sectionTitle: "Perguntas abertas",
          sectionDescription:
            "Use este espaco com base apenas na sua percepcao geral e em sinais observados no contexto organizacional.",
          dimensionKey: "open-feedback",
          dimensionTitle: "Conforto de trabalho direto",
          prompt: "Voce se sentiria confortavel trabalhando diretamente com essa pessoa? Por que?",
          sortOrder: 13,
          visibility: "confidential"
        }),
        createTextQuestion({
          id: "q_cross_14",
          sectionKey: "open-feedback",
          sectionTitle: "Perguntas abertas",
          sectionDescription:
            "Use este espaco com base apenas na sua percepcao geral e em sinais observados no contexto organizacional.",
          dimensionKey: "open-feedback",
          dimensionTitle: "Destaque positivo",
          prompt: "Existe algo positivo que voce observou e que merece destaque?",
          sortOrder: 14,
          visibility: "confidential"
        })
      ]
    },
    leader: {
      id: "t4",
      key: "leader",
      modelName: "Avaliacao de lideres 02/2026",
      description:
        "Questionario oficial de avaliacao de lideres do ciclo 02/2026, com foco em resultados, desenvolvimento e engajamento.",
      policy: {
        strategy: "standard-library",
        managerCustomQuestionsLimit: 0,
        scale: agreementScale,
        confidentiality: "anonymous-aggregate",
        showStrengthsNote: false,
        showDevelopmentNote: false
      },
      questions: [
        createScaleQuestion({
          id: "q_leader_01",
          sectionKey: "results",
          sectionTitle: "Gestao de Resultados e Organizacao",
          sectionDescription:
            "Avalie se seu lider define metas claras, organiza tarefas, acompanha o progresso da equipe e garante entregas de qualidade e no prazo.",
          dimensionKey: "results",
          dimensionTitle: "Metas claras",
          prompt: "1) Meu lider define metas claras e alcancaveis para a equipe.",
          helperText:
            "Avalie se o lider estabelece objetivos claros e realistas para todos.",
          sortOrder: 1,
          visibility: "confidential"
        }),
        createScaleQuestion({
          id: "q_leader_02",
          sectionKey: "results",
          sectionTitle: "Gestao de Resultados e Organizacao",
          sectionDescription:
            "Avalie se seu lider define metas claras, organiza tarefas, acompanha o progresso da equipe e garante entregas de qualidade e no prazo.",
          dimensionKey: "results",
          dimensionTitle: "Distribuicao de tarefas",
          prompt: "2) Meu lider organiza e distribui tarefas de forma eficiente.",
          helperText:
            "Considere se ele distribui responsabilidades de forma equilibrada e organizada.",
          sortOrder: 2,
          visibility: "confidential"
        }),
        createScaleQuestion({
          id: "q_leader_03",
          sectionKey: "results",
          sectionTitle: "Gestao de Resultados e Organizacao",
          sectionDescription:
            "Avalie se seu lider define metas claras, organiza tarefas, acompanha o progresso da equipe e garante entregas de qualidade e no prazo.",
          dimensionKey: "results",
          dimensionTitle: "Acompanhamento do progresso",
          prompt: "3) Meu lider acompanha o progresso da equipe e ajusta quando necessario.",
          helperText:
            "Reflita sobre o acompanhamento das atividades e a capacidade de corrigir desvios.",
          sortOrder: 3,
          visibility: "confidential"
        }),
        createScaleQuestion({
          id: "q_leader_04",
          sectionKey: "results",
          sectionTitle: "Gestao de Resultados e Organizacao",
          sectionDescription:
            "Avalie se seu lider define metas claras, organiza tarefas, acompanha o progresso da equipe e garante entregas de qualidade e no prazo.",
          dimensionKey: "results",
          dimensionTitle: "Qualidade e prazo",
          prompt:
            "4) Meu lider assegura que as entregas da equipe atendam aos padroes de qualidade e prazo.",
          helperText:
            "Avalie se ele garante que o trabalho seja consistente e entregue no tempo esperado.",
          sortOrder: 4,
          visibility: "confidential"
        }),
        createScaleQuestion({
          id: "q_leader_05",
          sectionKey: "development",
          sectionTitle: "Desenvolvimento da Equipe",
          sectionDescription:
            "Considere como ele identifica oportunidades de crescimento, oferece feedbacks, incentiva aprendizado e apoia o desenvolvimento dos colaboradores.",
          dimensionKey: "development",
          dimensionTitle: "Oportunidades por colaborador",
          prompt:
            "5) Meu lider identifica oportunidades de desenvolvimento para cada membro da equipe.",
          helperText:
            "Considere se ele percebe o potencial e necessidades de crescimento de cada colaborador.",
          sortOrder: 5,
          visibility: "confidential"
        }),
        createScaleQuestion({
          id: "q_leader_06",
          sectionKey: "development",
          sectionTitle: "Desenvolvimento da Equipe",
          sectionDescription:
            "Considere como ele identifica oportunidades de crescimento, oferece feedbacks, incentiva aprendizado e apoia o desenvolvimento dos colaboradores.",
          dimensionKey: "development",
          dimensionTitle: "Feedback regular e claro",
          prompt: "6) Recebo feedbacks regulares, claros e construtivos do meu lider.",
          helperText:
            "Reflita se ele oferece orientacoes frequentes e uteis para seu desenvolvimento.",
          sortOrder: 6,
          visibility: "confidential"
        }),
        createScaleQuestion({
          id: "q_leader_07",
          sectionKey: "development",
          sectionTitle: "Desenvolvimento da Equipe",
          sectionDescription:
            "Considere como ele identifica oportunidades de crescimento, oferece feedbacks, incentiva aprendizado e apoia o desenvolvimento dos colaboradores.",
          dimensionKey: "development",
          dimensionTitle: "Incentivo ao aprendizado",
          prompt:
            "7) Meu lider incentiva o aprendizado continuo e aprimoramento das habilidades da equipe.",
          helperText:
            "Avalie se ele promove treinamentos e oportunidades de crescimento.",
          sortOrder: 7,
          visibility: "confidential"
        }),
        createScaleQuestion({
          id: "q_leader_08",
          sectionKey: "development",
          sectionTitle: "Desenvolvimento da Equipe",
          sectionDescription:
            "Considere como ele identifica oportunidades de crescimento, oferece feedbacks, incentiva aprendizado e apoia o desenvolvimento dos colaboradores.",
          dimensionKey: "development",
          dimensionTitle: "Apoio personalizado ao crescimento",
          prompt:
            "8) Meu lider apoia o crescimento profissional dos colaboradores, respeitando seus interesses e potencial.",
          helperText:
            "Considere se ele orienta o desenvolvimento da equipe de forma personalizada.",
          sortOrder: 8,
          visibility: "confidential"
        }),
        createScaleQuestion({
          id: "q_leader_09",
          sectionKey: "communication",
          sectionTitle: "Comunicacao e Relacionamento",
          sectionDescription:
            "Reflita sobre a clareza da comunicacao do lider, escuta ativa, promocao de colaboracao e habilidade de lidar com conflitos.",
          dimensionKey: "communication",
          dimensionTitle: "Comunicacao clara",
          prompt: "9) Meu lider se comunica de forma clara, assertiva e transparente.",
          helperText:
            "Reflita sobre a clareza das informacoes e instrucoes recebidas.",
          sortOrder: 9,
          visibility: "confidential"
        }),
        createScaleQuestion({
          id: "q_leader_10",
          sectionKey: "communication",
          sectionTitle: "Comunicacao e Relacionamento",
          sectionDescription:
            "Reflita sobre a clareza da comunicacao do lider, escuta ativa, promocao de colaboracao e habilidade de lidar com conflitos.",
          dimensionKey: "communication",
          dimensionTitle: "Escuta e valorizacao da equipe",
          prompt: "10) Meu lider escuta e valoriza opinioes e ideias da equipe.",
          helperText:
            "Avalie se ele da espaco para sua participacao e respeita suas contribuicoes.",
          sortOrder: 10,
          visibility: "confidential"
        }),
        createScaleQuestion({
          id: "q_leader_11",
          sectionKey: "communication",
          sectionTitle: "Comunicacao e Relacionamento",
          sectionDescription:
            "Reflita sobre a clareza da comunicacao do lider, escuta ativa, promocao de colaboracao e habilidade de lidar com conflitos.",
          dimensionKey: "trust",
          dimensionTitle: "Colaboracao, respeito e confianca",
          prompt: "11) Meu lider promove um ambiente de colaboracao, respeito e confianca.",
          helperText:
            "Considere se ele incentiva trabalho em equipe e cria um clima seguro.",
          sortOrder: 11,
          visibility: "confidential"
        }),
        createScaleQuestion({
          id: "q_leader_12",
          sectionKey: "communication",
          sectionTitle: "Comunicacao e Relacionamento",
          sectionDescription:
            "Reflita sobre a clareza da comunicacao do lider, escuta ativa, promocao de colaboracao e habilidade de lidar com conflitos.",
          dimensionKey: "trust",
          dimensionTitle: "Conflitos e divergencias",
          prompt:
            "12) Meu lider lida de forma construtiva com conflitos ou divergencias na equipe.",
          helperText:
            "Reflita sobre sua capacidade de resolver problemas de relacionamento e divergencias.",
          sortOrder: 12,
          visibility: "confidential"
        }),
        createScaleQuestion({
          id: "q_leader_13",
          sectionKey: "engagement",
          sectionTitle: "Engajamento e Motivacao",
          sectionDescription:
            "Avalie se ele demonstra comprometimento, inspira a equipe, reconhece esforcos e cria um ambiente de trabalho positivo.",
          dimensionKey: "engagement",
          dimensionTitle: "Comprometimento com objetivos",
          prompt:
            "13) Meu lider demonstra comprometimento com os objetivos da empresa e da equipe.",
          helperText:
            "Avalie se ele se envolve ativamente nos resultados e metas da equipe.",
          sortOrder: 13,
          visibility: "confidential"
        }),
        createScaleQuestion({
          id: "q_leader_14",
          sectionKey: "engagement",
          sectionTitle: "Engajamento e Motivacao",
          sectionDescription:
            "Avalie se ele demonstra comprometimento, inspira a equipe, reconhece esforcos e cria um ambiente de trabalho positivo.",
          dimensionKey: "engagement",
          dimensionTitle: "Inspiracao e motivacao",
          prompt: "14) Meu lider inspira e motiva a equipe a se empenhar nas atividades.",
          helperText:
            "Considere se ele incentiva engajamento, entusiasmo e participacao da equipe.",
          sortOrder: 14,
          visibility: "confidential"
        }),
        createScaleQuestion({
          id: "q_leader_15",
          sectionKey: "engagement",
          sectionTitle: "Engajamento e Motivacao",
          sectionDescription:
            "Avalie se ele demonstra comprometimento, inspira a equipe, reconhece esforcos e cria um ambiente de trabalho positivo.",
          dimensionKey: "engagement",
          dimensionTitle: "Reconhecimento de conquistas",
          prompt:
            "15) Meu lider reconhece e valoriza conquistas e esforcos individuais e coletivos.",
          helperText:
            "Reflita se ele oferece reconhecimento adequado aos colaboradores.",
          sortOrder: 15,
          visibility: "confidential"
        }),
        createScaleQuestion({
          id: "q_leader_16",
          sectionKey: "engagement",
          sectionTitle: "Engajamento e Motivacao",
          sectionDescription:
            "Avalie se ele demonstra comprometimento, inspira a equipe, reconhece esforcos e cria um ambiente de trabalho positivo.",
          dimensionKey: "engagement",
          dimensionTitle: "Ambiente positivo e inclusivo",
          prompt:
            "16) Meu lider promove um ambiente de trabalho positivo, inclusivo e engajador.",
          helperText:
            "Avalie se ele contribui para um clima motivador, seguro e produtivo.",
          sortOrder: 16,
          visibility: "confidential"
        }),
        createScaleQuestion({
          id: "q_leader_17",
          sectionKey: "strategy",
          sectionTitle: "Visao Estrategica e Autodesenvolvimento",
          sectionDescription:
            "Considere sua capacidade de tomar decisoes estrategicas, buscar aprendizado continuo e equilibrar orientacao e autonomia da equipe.",
          dimensionKey: "strategy",
          dimensionTitle: "Decisao estrategica",
          prompt:
            "17) Meu lider demonstra capacidade de tomar decisoes estrategicas e alinhadas aos objetivos da empresa.",
          helperText:
            "Considere se ele consegue tomar decisoes adequadas e consistentes com a estrategia da empresa.",
          sortOrder: 17,
          visibility: "confidential"
        }),
        createScaleQuestion({
          id: "q_leader_18",
          sectionKey: "strategy",
          sectionTitle: "Visao Estrategica e Autodesenvolvimento",
          sectionDescription:
            "Considere sua capacidade de tomar decisoes estrategicas, buscar aprendizado continuo e equilibrar orientacao e autonomia da equipe.",
          dimensionKey: "strategy",
          dimensionTitle: "Autodesenvolvimento da lideranca",
          prompt:
            "18) Meu lider esta atento as proprias oportunidades de desenvolvimento e aprimoramento como lider.",
          helperText:
            "Avalie se ele busca evoluir continuamente em suas competencias de gestao.",
          sortOrder: 18,
          visibility: "confidential"
        }),
        createScaleQuestion({
          id: "q_leader_19",
          sectionKey: "strategy",
          sectionTitle: "Visao Estrategica e Autodesenvolvimento",
          sectionDescription:
            "Considere sua capacidade de tomar decisoes estrategicas, buscar aprendizado continuo e equilibrar orientacao e autonomia da equipe.",
          dimensionKey: "strategy",
          dimensionTitle: "Aprendizado continuo",
          prompt:
            "19) Meu lider busca aprendizado continuo sobre gestao, lideranca e boas praticas.",
          helperText:
            "Reflita se ele se mantem atualizado e procura se aprimorar constantemente.",
          sortOrder: 19,
          visibility: "confidential"
        }),
        createScaleQuestion({
          id: "q_leader_20",
          sectionKey: "strategy",
          sectionTitle: "Visao Estrategica e Autodesenvolvimento",
          sectionDescription:
            "Considere sua capacidade de tomar decisoes estrategicas, buscar aprendizado continuo e equilibrar orientacao e autonomia da equipe.",
          dimensionKey: "strategy",
          dimensionTitle: "Equilibrio entre orientacao e autonomia",
          prompt:
            "20) Meu lider equilibra orientacao e autonomia, permitindo que a equipe trabalhe com confianca e responsabilidade.",
          helperText:
            "Considere se ele delega adequadamente, dando suporte sem sobrecarregar ou restringir a equipe.",
          sortOrder: 20,
          visibility: "confidential"
        }),
        createTextQuestion({
          id: "q_leader_21",
          sectionKey: "final",
          sectionTitle: "Consideracoes Finais",
          sectionDescription:
            "Espaco para voce registrar comentarios, feedbacks ou sugestoes adicionais que considere importantes.",
          dimensionKey: "final-comments",
          dimensionTitle: "Sugestoes e observacoes",
          prompt:
            "Escreva aqui suas sugestoes, ideias de melhoria, observacoes sobre processos, comunicacao, recursos, desenvolvimento da equipe, lideranca ou qualquer outro ponto relevante para aprimorar seu trabalho, sua equipe ou a empresa.",
          sortOrder: 21,
          visibility: "confidential"
        })
      ]
    },
    company: {
      id: "t5",
      key: "company",
      modelName: "Avaliacao de satisfacao 02/2026",
      description:
        "Pesquisa de satisfacao trimestral alinhada ao formulario oficial 02/2026, com perguntas de clima, carreira, recursos e experiencia profissional.",
      policy: {
        strategy: "standard-library",
        managerCustomQuestionsLimit: 0,
        scale: agreementScale,
        confidentiality: "manager-confidential",
        showStrengthsNote: false,
        showDevelopmentNote: false
      },
      questions: [
        createScaleQuestion({
          id: "q_company_01",
          sectionKey: "satisfaction",
          sectionTitle: "Satisfacao profissional e alinhamento",
          sectionDescription:
            "Perguntas sobre orgulho de pertencimento, alinhamento estrategico e satisfacao com a experiencia profissional na empresa.",
          dimensionKey: "satisfaction",
          dimensionTitle: "Orgulho de pertencer",
          prompt: "Voce tem orgulho em dizer que trabalha na ABC Technology Group?",
          helperText:
            "Considere se a empresa representa algo positivo para voce, se sente satisfacao em fazer parte dela e se recomendaria trabalhar aqui para outras pessoas.",
          sortOrder: 1,
          visibility: "shared"
        }),
        createMultiSelectQuestion({
          id: "q_company_02",
          sectionKey: "satisfaction",
          sectionTitle: "Satisfacao profissional e alinhamento",
          sectionDescription:
            "Perguntas sobre orgulho de pertencimento, alinhamento estrategico e satisfacao com a experiencia profissional na empresa.",
          dimensionKey: "satisfaction",
          dimensionTitle: "Fatores de satisfacao",
          prompt: "O que mais te satisfaz profissionalmente?",
          helperText:
            "Considere quais aspectos do seu trabalho lhe trazem maior motivacao, realizacao e satisfacao.",
          sortOrder: 2,
          visibility: "shared",
          options: [
            { value: "home-office", label: "Trabalho home office" },
            { value: "flexibilidade", label: "Flexibilidade nos horarios" },
            { value: "crescimento-financeiro", label: "Crescimento financeiro" },
            { value: "desenvolvimento-profissional", label: "Desenvolvimento profissional" },
            { value: "ambiente-de-trabalho", label: "Ambiente de trabalho" }
          ]
        }),
        createScaleQuestion({
          id: "q_company_03",
          sectionKey: "satisfaction",
          sectionTitle: "Satisfacao profissional e alinhamento",
          sectionDescription:
            "Perguntas sobre orgulho de pertencimento, alinhamento estrategico e satisfacao com a experiencia profissional na empresa.",
          dimensionKey: "strategy",
          dimensionTitle: "Metas da empresa",
          prompt: "Os objetivos e metas da ABC Technology Group para 2026 estao bem definidos?",
          helperText:
            "Reflita se voce conhece claramente as metas e prioridades da empresa para o ano, entende como elas impactam seu trabalho e se percebe uma comunicacao clara sobre esses objetivos.",
          sortOrder: 3,
          visibility: "shared"
        }),
        createScaleQuestion({
          id: "q_company_04",
          sectionKey: "satisfaction",
          sectionTitle: "Satisfacao profissional e alinhamento",
          sectionDescription:
            "Perguntas sobre orgulho de pertencimento, alinhamento estrategico e satisfacao com a experiencia profissional na empresa.",
          dimensionKey: "strategy",
          dimensionTitle: "Metas da equipe",
          prompt: "Os objetivos e metas da sua equipe ou departamento estao bem definidos?",
          helperText:
            "Avalie se voce compreende claramente as metas especificas da sua area, como elas se conectam aos objetivos gerais da empresa e se ha alinhamento entre o que e esperado e o que e comunicado.",
          sortOrder: 4,
          visibility: "shared"
        }),
        createScaleQuestion({
          id: "q_company_05",
          sectionKey: "satisfaction",
          sectionTitle: "Satisfacao profissional e alinhamento",
          sectionDescription:
            "Perguntas sobre orgulho de pertencimento, alinhamento estrategico e satisfacao com a experiencia profissional na empresa.",
          dimensionKey: "strategy",
          dimensionTitle: "Alinhamento com o trabalho diario",
          prompt:
            "Os objetivos e metas da sua equipe ou departamento estao alinhados com suas atividades diarias?",
          helperText:
            "Considere se suas tarefas e responsabilidades contribuem diretamente para alcancar as metas da equipe, garantindo que seu trabalho esteja conectado aos objetivos do departamento.",
          sortOrder: 5,
          visibility: "shared"
        }),
        createScaleQuestion({
          id: "q_company_06",
          sectionKey: "career",
          sectionTitle: "Rotina, carreira e desenvolvimento",
          sectionDescription:
            "Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.",
          dimensionKey: "routine",
          dimensionTitle: "Clareza sobre responsabilidades",
          prompt: "Voce tem clareza sobre suas responsabilidades e demandas diarias?",
          helperText:
            "Reflita se voce entende bem suas tarefas, prioridades e expectativas, sabendo exatamente o que precisa ser feito em seu dia a dia.",
          sortOrder: 6,
          visibility: "shared"
        }),
        createScaleQuestion({
          id: "q_company_07",
          sectionKey: "career",
          sectionTitle: "Rotina, carreira e desenvolvimento",
          sectionDescription:
            "Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.",
          dimensionKey: "routine",
          dimensionTitle: "Sobrecarga individual",
          prompt: "Voce sente que suas demandas individuais estao te sobrecarregando?",
          helperText:
            "Considere se a quantidade e complexidade das suas tarefas estao dentro da sua capacidade de execucao, sem comprometer qualidade, bem-estar ou equilibrio entre vida pessoal e profissional.",
          sortOrder: 7,
          visibility: "shared"
        }),
        createScaleQuestion({
          id: "q_company_08",
          sectionKey: "career",
          sectionTitle: "Rotina, carreira e desenvolvimento",
          sectionDescription:
            "Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.",
          dimensionKey: "career",
          dimensionTitle: "Plano de carreira",
          prompt: "Voce tem um entendimento claro sobre o seu plano de carreira?",
          helperText:
            "Reflita se voce conhece as oportunidades de crescimento e desenvolvimento dentro da empresa, os caminhos possiveis e os requisitos para avancar na sua carreira.",
          sortOrder: 8,
          visibility: "shared"
        }),
        createScaleQuestion({
          id: "q_company_09",
          sectionKey: "career",
          sectionTitle: "Rotina, carreira e desenvolvimento",
          sectionDescription:
            "Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.",
          dimensionKey: "career",
          dimensionTitle: "Satisfacao com area atual",
          prompt: "Voce esta satisfeito em atuar na area e departamento atuais?",
          helperText:
            "Considere se voce se sente motivado e realizado com as atividades e responsabilidades da sua area, e se acredita que seu trabalho contribui de forma significativa para a equipe e a empresa.",
          sortOrder: 9,
          visibility: "shared"
        }),
        createScaleQuestion({
          id: "q_company_10",
          sectionKey: "career",
          sectionTitle: "Rotina, carreira e desenvolvimento",
          sectionDescription:
            "Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.",
          dimensionKey: "career",
          dimensionTitle: "Interesse em migracao de area",
          prompt: "Seu objetivo futuro e migrar de area ou departamento?",
          helperText:
            "Reflita se voce tem interesse em desenvolver sua carreira em outra area da empresa e se busca oportunidades de aprendizado ou crescimento em funcoes diferentes da atual.",
          sortOrder: 10,
          visibility: "shared"
        }),
        createScaleQuestion({
          id: "q_company_11",
          sectionKey: "career",
          sectionTitle: "Rotina, carreira e desenvolvimento",
          sectionDescription:
            "Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.",
          dimensionKey: "career",
          dimensionTitle: "Clareza sobre competencias a desenvolver",
          prompt:
            "Voce sabe quais habilidades e competencias precisa desenvolver para crescer profissionalmente?",
          helperText:
            "Considere se voce tem clareza sobre as capacidades e conhecimentos necessarios para avancar na carreira e se conhece os caminhos ou recursos disponiveis para seu desenvolvimento.",
          sortOrder: 11,
          visibility: "shared"
        }),
        createTextQuestion({
          id: "q_company_12",
          sectionKey: "career",
          sectionTitle: "Rotina, carreira e desenvolvimento",
          sectionDescription:
            "Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.",
          dimensionKey: "career",
          dimensionTitle: "Competencias a desenvolver",
          prompt:
            "Quais habilidades e competencias voce precisa desenvolver para crescer profissionalmente? Se nao souber, informe qual e sua duvida sobre o assunto.",
          helperText:
            "Use este espaco para identificar as areas em que deseja se desenvolver ou esclarecer duvidas sobre as competencias necessarias para avancar na sua carreira.",
          sortOrder: 12,
          visibility: "shared"
        }),
        createScaleQuestion({
          id: "q_company_13",
          sectionKey: "career",
          sectionTitle: "Rotina, carreira e desenvolvimento",
          sectionDescription:
            "Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.",
          dimensionKey: "development",
          dimensionTitle: "Ciencia sobre cursos do departamento",
          prompt:
            "Voce tem ciencia de que a empresa disponibiliza cursos voltados ao seu departamento?",
          helperText:
            "Reflita se voce conhece os treinamentos e cursos oferecidos pela empresa que podem contribuir para o seu desenvolvimento profissional e aprimoramento das habilidades relacionadas a sua funcao.",
          sortOrder: 13,
          visibility: "shared"
        }),
        createScaleQuestion({
          id: "q_company_14",
          sectionKey: "career",
          sectionTitle: "Rotina, carreira e desenvolvimento",
          sectionDescription:
            "Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.",
          dimensionKey: "development",
          dimensionTitle: "Interesse em cursos de outras areas",
          prompt:
            "Voce tem interesse em participar de cursos oferecidos pela empresa em areas de conhecimento diferentes da sua?",
          helperText:
            "Considere se voce gostaria de ampliar seus conhecimentos e habilidades em outras areas, explorando novas oportunidades de aprendizado e desenvolvimento profissional.",
          sortOrder: 14,
          visibility: "shared"
        }),
        createScaleQuestion({
          id: "q_company_15",
          sectionKey: "experience",
          sectionTitle: "Realizacao, reconhecimento e recursos",
          sectionDescription:
            "Perguntas sobre realizacao profissional, reconhecimento, recursos e ferramentas disponiveis para o trabalho.",
          dimensionKey: "experience",
          dimensionTitle: "Realizacao profissional",
          prompt: "Voce se sente realizado profissionalmente?",
          helperText:
            "Reflita sobre seu nivel de satisfacao com suas conquistas, crescimento, reconhecimento e impacto do seu trabalho dentro da empresa.",
          sortOrder: 15,
          visibility: "shared"
        }),
        createScaleQuestion({
          id: "q_company_16",
          sectionKey: "experience",
          sectionTitle: "Realizacao, reconhecimento e recursos",
          sectionDescription:
            "Perguntas sobre realizacao profissional, reconhecimento, recursos e ferramentas disponiveis para o trabalho.",
          dimensionKey: "experience",
          dimensionTitle: "Motivacao com metas e prazos",
          prompt:
            "Voce se sente realizado quando seu trabalho exige metas e prazos para entrega?",
          helperText:
            "Considere se trabalhar com objetivos claros e prazos desafiadores aumenta sua motivacao, engajamento e sensacao de conquista profissional.",
          sortOrder: 16,
          visibility: "shared"
        }),
        createScaleQuestion({
          id: "q_company_17",
          sectionKey: "experience",
          sectionTitle: "Realizacao, reconhecimento e recursos",
          sectionDescription:
            "Perguntas sobre realizacao profissional, reconhecimento, recursos e ferramentas disponiveis para o trabalho.",
          dimensionKey: "recognition",
          dimensionTitle: "Reconhecimento pelos colegas",
          prompt:
            "Voce sente que seu trabalho e reconhecido e valorizado por seus colegas de departamento?",
          helperText:
            "Reflita se seus esforcos e contribuicoes sao percebidos e apreciados pelos colegas, promovendo um ambiente de respeito, colaboracao e motivacao.",
          sortOrder: 17,
          visibility: "shared"
        }),
        createScaleQuestion({
          id: "q_company_18",
          sectionKey: "experience",
          sectionTitle: "Realizacao, reconhecimento e recursos",
          sectionDescription:
            "Perguntas sobre realizacao profissional, reconhecimento, recursos e ferramentas disponiveis para o trabalho.",
          dimensionKey: "recognition",
          dimensionTitle: "Reconhecimento pela lideranca",
          prompt: "Voce sente que seu trabalho e reconhecido e valorizado pelo seu lider?",
          helperText:
            "Considere se seu lider reconhece suas entregas, esforcos e resultados, oferecendo feedbacks ou incentivos que reforcem sua motivacao e engajamento.",
          sortOrder: 18,
          visibility: "shared"
        }),
        createScaleQuestion({
          id: "q_company_19",
          sectionKey: "experience",
          sectionTitle: "Realizacao, reconhecimento e recursos",
          sectionDescription:
            "Perguntas sobre realizacao profissional, reconhecimento, recursos e ferramentas disponiveis para o trabalho.",
          dimensionKey: "resources",
          dimensionTitle: "Acessos e recursos",
          prompt:
            "Voce tem a sua disposicao os recursos e acessos necessarios para desempenhar suas funcoes de forma eficiente?",
          helperText:
            "Considere se voce possui os acessos a sistemas, informacoes e dados essenciais para realizar suas tarefas de forma completa e eficiente.",
          sortOrder: 19,
          visibility: "shared"
        }),
        createScaleQuestion({
          id: "q_company_20",
          sectionKey: "experience",
          sectionTitle: "Realizacao, reconhecimento e recursos",
          sectionDescription:
            "Perguntas sobre realizacao profissional, reconhecimento, recursos e ferramentas disponiveis para o trabalho.",
          dimensionKey: "resources",
          dimensionTitle: "Ferramentas e materiais",
          prompt:
            "Voce tem a sua disposicao as ferramentas e materiais necessarios para desempenhar suas funcoes de forma eficiente?",
          helperText:
            "Reflita se voce conta com os equipamentos, softwares, materiais e demais recursos fisicos ou digitais necessarios para realizar suas tarefas com qualidade e produtividade.",
          sortOrder: 20,
          visibility: "shared"
        }),
        createTextQuestion({
          id: "q_company_21",
          sectionKey: "experience",
          sectionTitle: "Realizacao, reconhecimento e recursos",
          sectionDescription:
            "Perguntas sobre realizacao profissional, reconhecimento, recursos e ferramentas disponiveis para o trabalho.",
          dimensionKey: "resources",
          dimensionTitle: "Sugestoes de melhoria para recursos",
          prompt: "Deixe uma sugestao de como melhorar os recursos e ferramentas disponiveis para seu trabalho.",
          helperText:
            "Use este espaco para indicar ideias ou melhorias que poderiam tornar seus recursos, equipamentos ou ferramentas mais eficientes e adequados as suas necessidades.",
          sortOrder: 21,
          visibility: "shared"
        }),
        createTextQuestion({
          id: "q_company_22",
          sectionKey: "final",
          sectionTitle: "Consideracoes Finais",
          sectionDescription:
            "Espaco final para autoavaliacao do periodo e sugestoes de melhoria para a empresa.",
          dimensionKey: "final-comments",
          dimensionTitle: "Desempenho profissional no periodo",
          prompt: "Descreva como voce avalia seu desempenho profissional ate 03/2026.",
          helperText:
            "Reflita sobre suas entregas, resultados e evolucao ate o momento, destacando conquistas, desafios superados e aprendizados obtidos no periodo.",
          sortOrder: 22,
          visibility: "shared"
        }),
        createTextQuestion({
          id: "q_company_23",
          sectionKey: "final",
          sectionTitle: "Consideracoes Finais",
          sectionDescription:
            "Espaco final para autoavaliacao do periodo e sugestoes de melhoria para a empresa.",
          dimensionKey: "final-comments",
          dimensionTitle: "Sugestoes gerais",
          prompt:
            "Deixe aqui sua sugestao! Pode ser sobre cursos do seu interesse, melhorias nos processos das suas atividades, melhoria na comunicacao da empresa, etc.",
          helperText:
            "Use este espaco para compartilhar ideias, opinioes ou propostas que possam contribuir para seu desenvolvimento, para a eficiencia do trabalho ou para melhorar o ambiente e a comunicacao na empresa.",
          sortOrder: 23,
          visibility: "shared"
        })
      ]
    }
  }
};

export const questionTemplate = evaluationLibrary.templates.collaboration;

function buildSeedCompetenciesFromLibrary() {
  const seen = new Map();

  Object.values(evaluationLibrary.templates).forEach((template) => {
    (template.questions || []).forEach((question) => {
      if (!question.dimensionKey || seen.has(question.dimensionKey)) {
        return;
      }

      seen.set(question.dimensionKey, {
        id: `cmp_${question.dimensionKey.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}`,
        key: question.dimensionKey,
        name: question.dimensionTitle || question.dimensionKey,
        description:
          question.sectionDescription ||
          question.helperText ||
          `Competencia derivada da biblioteca oficial: ${question.dimensionTitle || question.dimensionKey}.`,
        status: "active"
      });
    });
  });

  return [...seen.values()];
}

export const seed = {
  competencies: buildSeedCompetenciesFromLibrary(),
  areas: [
    {
      id: "a1",
      name: "Compliance",
      managerPersonId: "p7"
    },
    {
      id: "a2",
      name: "Tecnologia",
      managerPersonId: "p4"
    },
    {
      id: "a3",
      name: "Consultoria",
      managerPersonId: "p4"
    },
    {
      id: "a4",
      name: "Administracao",
      managerPersonId: "p5"
    },
    {
      id: "a5",
      name: "Gente e Gestao",
      managerPersonId: "p6"
    }
  ],
  people: [
    {
      id: "p1",
      name: "Colaborador Demo 01",
      roleTitle: "Analista Demo",
      area: "Compliance",
      workUnit: "Sao Paulo",
      workMode: "hybrid",
      managerPersonId: "p6",
      employmentType: "internal",
      satisfactionScore: 4.4
    },
    {
      id: "p2",
      name: "Colaborador Demo 02",
      roleTitle: "Lider Tecnico Demo",
      area: "Tecnologia",
      workUnit: "Sao Paulo",
      workMode: "onsite",
      managerPersonId: "p4",
      employmentType: "internal",
      satisfactionScore: 4.1
    },
    {
      id: "p3",
      name: "Consultor Demo 01",
      roleTitle: "Consultor Demo",
      area: "Consultoria",
      workUnit: "Sao Paulo",
      workMode: "remote",
      managerPersonId: "p4",
      employmentType: "consultant",
      satisfactionScore: 4
    },
    {
      id: "p4",
      name: "Gestor Demo Tecnologia",
      roleTitle: "Gerente Demo",
      area: "Tecnologia",
      workUnit: "Sao Paulo",
      workMode: "hybrid",
      managerPersonId: "p6",
      employmentType: "internal",
      satisfactionScore: 4.3
    },
    {
      id: "p5",
      name: "Admin Plataforma Demo",
      roleTitle: "Administrador da Plataforma",
      area: "Administracao",
      workUnit: "Sao Paulo",
      workMode: "onsite",
      managerPersonId: null,
      employmentType: "internal",
      satisfactionScore: 4.5
    },
    {
      id: "p6",
      name: "RH Demo Corporativo",
      roleTitle: "Business Partner RH",
      area: "Gente e Gestao",
      workUnit: "Sao Paulo",
      workMode: "hybrid",
      managerPersonId: "p5",
      employmentType: "internal",
      satisfactionScore: 4.6
    },
    {
      id: "p7",
      name: "Compliance Demo",
      roleTitle: "Analista de Compliance",
      area: "Compliance",
      workUnit: "Sao Paulo",
      workMode: "onsite",
      managerPersonId: "p6",
      employmentType: "internal",
      satisfactionScore: 4.2
    }
  ],
  users: [
    {
      id: "u1",
      personId: "p1",
      email: "colaborador1@demo.local",
      passwordHash: hashPassword("demo123"),
      roleKey: "employee",
      status: "active"
    },
    {
      id: "u2",
      personId: "p2",
      email: "colaborador2@demo.local",
      passwordHash: hashPassword("demo123"),
      roleKey: "employee",
      status: "active"
    },
    {
      id: "u3",
      personId: "p3",
      email: "consultor1@demo.local",
      passwordHash: hashPassword("demo123"),
      roleKey: "employee",
      status: "active"
    },
    {
      id: "u4",
      personId: "p4",
      email: "gestor@demo.local",
      passwordHash: hashPassword("demo123"),
      roleKey: "manager",
      status: "active"
    },
    {
      id: "u5",
      personId: "p5",
      email: "admin@demo.local",
      passwordHash: hashPassword("demo123"),
      roleKey: "admin",
      status: "active"
    },
    {
      id: "u6",
      personId: "p6",
      email: "rh@demo.local",
      passwordHash: hashPassword("demo123"),
      roleKey: "hr",
      status: "active"
    },
    {
      id: "u7",
      personId: "p7",
      email: "compliance@demo.local",
      passwordHash: hashPassword("demo123"),
      roleKey: "compliance",
      status: "active"
    }
  ],
  templates: Object.values(evaluationLibrary.templates),
  cycles: [
    {
      id: "c1",
      templateId: "t1",
      libraryId: "library_standard_02_2026",
      libraryName: "Biblioteca padrao 02/2026",
      title: "Ciclo Semestral 2026.1",
      semesterLabel: "2026.1",
      status: "Liberado",
      dueDate: "2026-04-15",
      targetGroup: "Todos os colaboradores",
      createdByUserId: "u6"
    }
  ],
  cycleParticipants: [
    {
      id: "ecp1",
      cycleId: "c1",
      personId: "p1",
      status: "active"
    },
    {
      id: "ecp2",
      cycleId: "c1",
      personId: "p2",
      status: "active"
    },
    {
      id: "ecp3",
      cycleId: "c1",
      personId: "p4",
      status: "active"
    },
    {
      id: "ecp4",
      cycleId: "c1",
      personId: "p3",
      status: "active"
    }
  ],
  cycleRaters: [
    {
      id: "ecr1",
      cycleId: "c1",
      participantPersonId: "p2",
      raterUserId: "u1",
      relationshipType: "peer",
      status: "completed"
    },
    {
      id: "ecr2",
      cycleId: "c1",
      participantPersonId: "p2",
      raterUserId: "u4",
      relationshipType: "manager",
      status: "pending"
    },
    {
      id: "ecr3",
      cycleId: "c1",
      participantPersonId: "p1",
      raterUserId: "u2",
      relationshipType: "cross-functional",
      status: "pending"
    },
    {
      id: "ecr4",
      cycleId: "c1",
      participantPersonId: "p1",
      raterUserId: "u1",
      relationshipType: "self",
      status: "pending"
    },
    {
      id: "ecr5",
      cycleId: "c1",
      participantPersonId: "p4",
      raterUserId: "u1",
      relationshipType: "leader",
      status: "pending"
    },
    {
      id: "ecr6",
      cycleId: "c1",
      participantPersonId: "p1",
      raterUserId: "u1",
      relationshipType: "company",
      status: "pending"
    },
    {
      id: "ecr7",
      cycleId: "c1",
      participantPersonId: "p2",
      raterUserId: "u1",
      relationshipType: "client-internal",
      status: "pending"
    },
    {
      id: "ecr8",
      cycleId: "c1",
      participantPersonId: "p3",
      raterUserId: "u1",
      relationshipType: "client-external",
      status: "pending"
    }
  ],
  cycleReports: [],
  assignments: [
    {
      id: "ea1",
      cycleId: "c1",
      reviewerUserId: "u1",
      revieweePersonId: "p2",
      relationshipType: "peer",
      projectContext: "Projeto Modernizacao Portal",
      collaborationContext:
        "Atuaram juntos na priorizacao de melhorias e alinhamento de requisitos.",
      status: "submitted",
      reminderCount: 0,
      lastReminderSentAt: null,
      dueDate: "2026-04-15"
    },
    {
      id: "ea2",
      cycleId: "c1",
      reviewerUserId: "u4",
      revieweePersonId: "p2",
      relationshipType: "manager",
      projectContext: "Rotina da area",
      collaborationContext: "Avaliacao gerencial semestral.",
      status: "pending",
      reminderCount: 0,
      lastReminderSentAt: null,
      dueDate: "2026-04-15"
    },
    {
      id: "ea3",
      cycleId: "c1",
      reviewerUserId: "u2",
      revieweePersonId: "p1",
      relationshipType: "cross-functional",
      projectContext: "Politica de acessos",
      collaborationContext:
        "Solicitacao de feedback de colaboracao em atividade compartilhada.",
      status: "pending",
      reminderCount: 0,
      lastReminderSentAt: null,
      dueDate: "2026-04-15"
    },
    {
      id: "ea4",
      cycleId: "c1",
      reviewerUserId: "u1",
      revieweePersonId: "p1",
      relationshipType: "self",
      projectContext: "Reflexao individual",
      collaborationContext: "Autoavaliacao semestral do colaborador.",
      status: "pending",
      reminderCount: 0,
      lastReminderSentAt: null,
      dueDate: "2026-04-15"
    },
    {
      id: "ea5",
      cycleId: "c1",
      reviewerUserId: "u1",
      revieweePersonId: "p4",
      relationshipType: "leader",
      projectContext: "Avaliacao da lideranca imediata",
      collaborationContext: "Leitura da lideranca no semestre.",
      status: "pending",
      reminderCount: 0,
      lastReminderSentAt: null,
      dueDate: "2026-04-15"
    },
    {
      id: "ea6",
      cycleId: "c1",
      reviewerUserId: "u1",
      revieweePersonId: "p1",
      relationshipType: "company",
      projectContext: "Experiencia institucional",
      collaborationContext: "Avaliacao da empresa e da experiencia geral do colaborador.",
      status: "pending",
      reminderCount: 0,
      lastReminderSentAt: null,
      dueDate: "2026-04-15"
    },
    {
      id: "ea7",
      cycleId: "c1",
      reviewerUserId: "u1",
      revieweePersonId: "p2",
      relationshipType: "client-internal",
      projectContext: "Consumo interno entre areas",
      collaborationContext:
        "Leitura da area cliente sobre qualidade de atendimento, parceria e entrega.",
      status: "pending",
      reminderCount: 0,
      lastReminderSentAt: null,
      dueDate: "2026-04-15"
    },
    {
      id: "ea8",
      cycleId: "c1",
      reviewerUserId: "u1",
      revieweePersonId: "p3",
      relationshipType: "client-external",
      projectContext: "Interacao com consultoria",
      collaborationContext:
        "Percepcao de parceria, confiabilidade e resultado na relacao com consultoria.",
      status: "pending",
      reminderCount: 0,
      lastReminderSentAt: null,
      dueDate: "2026-04-15"
    }
  ],
  feedbackRequests: [
    {
      id: "fr1",
      cycleId: "c1",
      requesterUserId: "u1",
      revieweePersonId: "p1",
      status: "pending",
      contextNote:
        "Colaborei diretamente com tecnologia e consultoria na revisao de politicas e gostaria de receber feedback mais aderente ao ciclo.",
      requestedAt: "2026-03-16T11:00:00.000Z",
      decidedAt: null,
      decidedByUserId: null
    }
  ],
  feedbackRequestItems: [
    {
      id: "fri1",
      requestId: "fr1",
      providerPersonId: "p2",
      assignmentId: null
    },
    {
      id: "fri2",
      requestId: "fr1",
      providerPersonId: "p3",
      assignmentId: null
    }
  ],
  submissions: [
    {
      id: "es1",
      assignmentId: "ea1",
      cycleId: "c1",
      reviewerUserId: "u1",
      revieweePersonId: "p2",
      overallScore: 4.17,
      strengthsNote: "Boa articulacao entre frentes e consistencia nas entregas.",
      developmentNote: "Pode registrar riscos com ainda mais antecedencia.",
      revieweeAcknowledgementStatus: null,
      revieweeAcknowledgementNote: "",
      revieweeAcknowledgedAt: null,
      submittedAt: "2026-03-12T12:00:00.000Z"
    }
  ],
  answers: [
    {
      id: "ans1",
      submissionId: "es1",
      questionId: "q1",
      score: 4,
      evidenceNote: "Cumpriu marcos importantes no periodo."
    },
    {
      id: "ans2",
      submissionId: "es1",
      questionId: "q2",
      score: 4,
      evidenceNote: "Manteve consistencia em sprint critica."
    },
    {
      id: "ans3",
      submissionId: "es1",
      questionId: "q3",
      score: 5,
      evidenceNote: "Apoiou integracao entre times com rapidez."
    },
    {
      id: "ans4",
      submissionId: "es1",
      questionId: "q4",
      score: 4,
      evidenceNote: "Compartilhou contexto tecnico com clareza."
    },
    {
      id: "ans5",
      submissionId: "es1",
      questionId: "q5",
      score: 4,
      evidenceNote: "Comunicou riscos sem ruido."
    },
    {
      id: "ans6",
      submissionId: "es1",
      questionId: "q6",
      score: 4,
      evidenceNote: "Relacao respeitosa e colaborativa com o time."
    }
  ],
  incidents: [
    {
      id: "i1",
      title: "Conduta impropria em reuniao",
      category: "Conduta Impropria",
      classification: "Conduta e Relacionamento",
      status: "Em triagem",
      anonymity: "anonymous",
      reporterLabel: "Anonimo",
      responsibleArea: "Compliance",
      assignedPersonId: "p6",
      assignedTo: "RH Corporativo",
      createdAt: "2026-03-10T10:00:00.000Z",
      description: "Relato de comentario inadequado em reuniao de area."
    },
    {
      id: "i2",
      title: "Possivel conflito de interesse em fornecedor",
      category: "Conflito de interesse",
      classification: "Integridade e Etica",
      status: "Em apuracao",
      anonymity: "identified",
      reporterLabel: "Canal identificado",
      responsibleArea: "Compliance",
      assignedPersonId: "p7",
      assignedTo: "Compliance Corporativo",
      createdAt: "2026-03-14T15:20:00.000Z",
      description:
        "Sinalizacao de relacionamento proximo entre colaborador e fornecedor participante de cotacao."
    }
  ],
  applauseEntries: [
    {
      id: "a1",
      senderPersonId: "p2",
      receiverPersonId: "p1",
      category: "Colaboracao",
      impact: "Destravou uma revisao critica de politica interna.",
      contextNote: "Apoiou a equipe em um prazo curto e organizou as evidencias.",
      createdAt: "2026-03-11T09:30:00.000Z",
      status: "Validado"
    }
  ],
  developmentRecords: [
    {
      id: "d1",
      personId: "p3",
      recordType: "Certificacao",
      title: "SAP GRC Foundation",
      providerName: "SAP Learning",
      completedAt: "2026-02-05",
      skillSignal: "Governanca de acessos",
      notes: "Certificacao vinculada ao projeto de compliance.",
      status: "active",
      archivedAt: null
    },
    {
      id: "d2",
      personId: "p4",
      recordType: "MBA",
      title: "MBA em Gestao de Tecnologia",
      providerName: "FIA Business School",
      completedAt: "2025-12-10",
      skillSignal: "Lideranca, governanca e estrategia",
      notes: "Formacao utilizada para fortalecer rituais de acompanhamento e desenvolvimento da equipe.",
      status: "active",
      archivedAt: null
    },
    {
      id: "d3",
      personId: "p2",
      recordType: "Graduacao",
      title: "Sistemas de Informacao",
      providerName: "Universidade Presbiteriana Mackenzie",
      completedAt: "2024-12-18",
      skillSignal: "Arquitetura, produto e analise de requisitos",
      notes: "Base academica aplicada nas frentes de tecnologia e integracao.",
      status: "active",
      archivedAt: null
    },
    {
      id: "d4",
      personId: "p1",
      recordType: "Pos-graduacao",
      title: "Compliance e Integridade Corporativa",
      providerName: "FGV",
      completedAt: "2025-08-22",
      skillSignal: "Etica, controles internos e investigacao",
      notes: "Evolucao academica diretamente conectada ao papel atual no time de compliance.",
      status: "active",
      archivedAt: null
    }
  ],
  developmentPlans: [
    {
      id: "dp1",
      personId: "p1",
      cycleId: "c1",
      competencyId: "cmp_communication",
      focusTitle: "Fortalecer comunicacao executiva",
      actionText:
        "Conduzir checkpoint quinzenal com a area e formalizar riscos-chave em ate 24h.",
      dueDate: "2026-06-30",
      expectedEvidence:
        "Ata dos checkpoints e melhoria percebida nas avaliacoes do proximo ciclo.",
      status: "active",
      createdByUserId: "u6",
      createdAt: "2026-03-20T09:00:00.000Z",
      archivedAt: null,
      progressStatus: "not_started",
      progressNote: "",
      progressUpdatedAt: null
    }
  ],
  auditLogs: [
    {
      id: "al1",
      category: "cycle",
      action: "created",
      entityType: "cycle",
      entityId: "c1",
      entityLabel: "Ciclo Semestral 2026.1",
      actorUserId: "u6",
      actorName: "RH Demo Corporativo",
      actorRoleKey: "hr",
      summary: "Ciclo criado: Ciclo Semestral 2026.1",
      detail: "2026.1 · 6 assignments distribuidos",
      createdAt: "2026-03-08T09:00:00.000Z"
    },
    {
      id: "al2",
      category: "cycle",
      action: "status_changed",
      entityType: "cycle",
      entityId: "c1",
      entityLabel: "Ciclo Semestral 2026.1",
      actorUserId: "u6",
      actorName: "RH Demo Corporativo",
      actorRoleKey: "hr",
      summary: "Status do ciclo atualizado: Ciclo Semestral 2026.1",
      detail: "Planejamento -> Liberado",
      createdAt: "2026-03-09T10:30:00.000Z"
    },
    {
      id: "al3",
      category: "incident",
      action: "updated",
      entityType: "incident",
      entityId: "i2",
      entityLabel: "Possivel conflito de interesse em fornecedor",
      actorUserId: "u7",
      actorName: "Compliance Demo",
      actorRoleKey: "compliance",
      summary: "Caso atualizado: Possivel conflito de interesse em fornecedor",
      detail: "Em apuracao · Integridade e Etica · Responsavel: Compliance Corporativo",
      createdAt: "2026-03-15T08:45:00.000Z"
    },
    {
      id: "al4",
      category: "feedback_request",
      action: "created",
      entityType: "feedback_request",
      entityId: "fr1",
      entityLabel: "Colaborador Demo 01",
      actorUserId: "u1",
      actorName: "Colaborador Demo 01",
      actorRoleKey: "employee",
      summary: "Solicitacao de feedback direto registrada",
      detail: "2 fornecedores sugeridos · Ciclo c1",
      createdAt: "2026-03-16T11:00:00.000Z"
    },
    {
      id: "al5",
      category: "user",
      action: "created",
      entityType: "user",
      entityId: "u7",
      entityLabel: "Compliance Demo",
      actorUserId: "u5",
      actorName: "Admin Plataforma Demo",
      actorRoleKey: "admin",
      summary: "Usuario criado para Compliance Demo",
      detail: "compliance · active · compliance@demo.local",
      createdAt: "2026-03-05T14:20:00.000Z"
    }
  ]
};
