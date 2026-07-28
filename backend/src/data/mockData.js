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

export const crossFunctionalVisibilityScale = [
  { value: 1, label: "Nao" },
  { value: 2, label: "Pouco" },
  { value: 3, label: "Parcialmente" },
  { value: 4, label: "Sim" },
  { value: 5, label: "Completamente" }
];

export const sameAreaPeerOptions = [
  { value: "A", label: "Muito abaixo do esperado" },
  { value: "B", label: "Abaixo do esperado" },
  { value: "C", label: "Dentro do esperado" },
  { value: "D", label: "Acima do esperado" },
  { value: "E", label: "Muito acima do esperado" }
];

export const evaluationScaleProfiles = {
  satisfaction: satisfactionScale,
  agreement: agreementScale,
  performance: performanceScale,
  visibility: crossFunctionalVisibilityScale
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
    self: 1,
    peer: 0.15,
    "peer-same-area": 1,
    manager: 1,
    "cross-functional": 0,
    "client-internal": 0.1,
    "client-external": 0.1,
    leader: 1,
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
    "peer-same-area": {
      id: "t_peer_same_area",
      key: "peer-same-area",
      modelName: "Avaliacao por colaborador do mesmo setor",
      description:
        "Questionario padrao para colega do mesmo setor pontuar o colaborador avaliado.",
      policy: {
        strategy: "standard-library",
        managerCustomQuestionsLimit: 0,
        scale: sameAreaPeerOptions,
        confidentiality: "mixed",
        showStrengthsNote: true,
        showDevelopmentNote: true,
        maxScore: 1.5
      },
      questions: [
        createMultiSelectQuestion({
          id: "q_peer_same_area_01",
          sectionKey: "same_area_peer",
          sectionTitle: "Avaliacao do mesmo setor",
          sectionDescription:
            "Avalie a contribuicao observada no dia a dia por alguem do mesmo setor.",
          dimensionKey: "role_clarity",
          dimensionTitle: "Conhecimento da funcao",
          prompt:
            "Voce sabe quais sao as principais atividades e responsabilidades do colaborador avaliado?",
          sortOrder: 1,
          visibility: "shared",
          options: sameAreaPeerOptions
        }),
        createMultiSelectQuestion({
          id: "q_peer_same_area_02",
          sectionKey: "same_area_peer",
          sectionTitle: "Avaliacao do mesmo setor",
          sectionDescription:
            "Avalie a contribuicao observada no dia a dia por alguem do mesmo setor.",
          dimensionKey: "delivery",
          dimensionTitle: "Entrega",
          prompt:
            "O colaborador avaliado entrega suas atividades com qualidade e dentro do esperado para a funcao?",
          sortOrder: 2,
          visibility: "shared",
          options: sameAreaPeerOptions
        }),
        createMultiSelectQuestion({
          id: "q_peer_same_area_03",
          sectionKey: "same_area_peer",
          sectionTitle: "Avaliacao do mesmo setor",
          sectionDescription:
            "Avalie a contribuicao observada no dia a dia por alguem do mesmo setor.",
          dimensionKey: "collaboration",
          dimensionTitle: "Colaboracao",
          prompt:
            "O colaborador avaliado colabora com colegas do setor de forma produtiva e respeitosa?",
          sortOrder: 3,
          visibility: "shared",
          options: sameAreaPeerOptions
        }),
        createMultiSelectQuestion({
          id: "q_peer_same_area_04",
          sectionKey: "same_area_peer",
          sectionTitle: "Avaliacao do mesmo setor",
          sectionDescription:
            "Avalie a contribuicao observada no dia a dia por alguem do mesmo setor.",
          dimensionKey: "communication",
          dimensionTitle: "Comunicacao",
          prompt:
            "O colaborador avaliado comunica prioridades, pendencias e riscos com clareza para o setor?",
          sortOrder: 4,
          visibility: "shared",
          options: sameAreaPeerOptions
        }),
        createMultiSelectQuestion({
          id: "q_peer_same_area_05",
          sectionKey: "same_area_peer",
          sectionTitle: "Avaliacao do mesmo setor",
          sectionDescription:
            "Avalie a contribuicao observada no dia a dia por alguem do mesmo setor.",
          dimensionKey: "accountability",
          dimensionTitle: "Responsabilidade",
          prompt:
            "O colaborador avaliado assume combinados, acompanha demandas e responde por suas entregas?",
          sortOrder: 5,
          visibility: "shared",
          options: sameAreaPeerOptions
        }),
        createMultiSelectQuestion({
          id: "q_peer_same_area_06",
          sectionKey: "same_area_peer",
          sectionTitle: "Avaliacao do mesmo setor",
          sectionDescription:
            "Avalie a contribuicao observada no dia a dia por alguem do mesmo setor.",
          dimensionKey: "technical_domain",
          dimensionTitle: "Dominio tecnico",
          prompt:
            "O colaborador avaliado demonstra dominio tecnico adequado para apoiar as rotinas do setor?",
          sortOrder: 6,
          visibility: "shared",
          options: sameAreaPeerOptions
        }),
        createMultiSelectQuestion({
          id: "q_peer_same_area_07",
          sectionKey: "same_area_peer",
          sectionTitle: "Avaliacao do mesmo setor",
          sectionDescription:
            "Avalie a contribuicao observada no dia a dia por alguem do mesmo setor.",
          dimensionKey: "team_impact",
          dimensionTitle: "Impacto no setor",
          prompt:
            "O colaborador avaliado contribui positivamente para o desempenho e o clima do setor?",
          sortOrder: 7,
          visibility: "shared",
          options: sameAreaPeerOptions
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
        scale: performanceScale,
        confidentiality: "private-to-employee-and-manager",
        showStrengthsNote: false,
        showDevelopmentNote: false,
        maxScore: 1.5
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
        maxScore: 7,
        confidentiality: "private-to-employee-and-manager",
        showStrengthsNote: false,
        showDevelopmentNote: false
      },
      questions: [
        createScaleQuestion({
          id: "q_manager_01",
          sectionKey: "delivery",
          sectionTitle: "Desempenho e Entregas",
          sectionDescription:
            "Avalie prazos, qualidade, resolucao de problemas e organizacao das entregas do colaborador.",
          dimensionKey: "delivery",
          dimensionTitle: "Cumprimento de prazos",
          prompt: "1) O colaborador cumpre suas tarefas e entregas dentro dos prazos estabelecidos.",
          sortOrder: 1,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_02",
          sectionKey: "delivery",
          sectionTitle: "Desempenho e Entregas",
          sectionDescription:
            "Avalie prazos, qualidade, resolucao de problemas e organizacao das entregas do colaborador.",
          dimensionKey: "delivery",
          dimensionTitle: "Qualidade e precisao",
          prompt: "2) O colaborador realiza suas atividades com atencao a qualidade e precisao.",
          sortOrder: 2,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_03",
          sectionKey: "delivery",
          sectionTitle: "Desempenho e Entregas",
          sectionDescription:
            "Avalie prazos, qualidade, resolucao de problemas e organizacao das entregas do colaborador.",
          dimensionKey: "delivery",
          dimensionTitle: "Resolucao de problemas",
          prompt: "3) O colaborador lida de forma eficiente com problemas ou obstaculos que surgem no trabalho.",
          sortOrder: 3,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_04",
          sectionKey: "delivery",
          sectionTitle: "Desempenho e Entregas",
          sectionDescription:
            "Avalie prazos, qualidade, resolucao de problemas e organizacao das entregas do colaborador.",
          dimensionKey: "delivery",
          dimensionTitle: "Organizacao e resultados",
          prompt: "4) O colaborador organiza suas atividades de forma a otimizar tempo e resultados.",
          sortOrder: 4,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_05",
          sectionKey: "knowledge",
          sectionTitle: "Conhecimento e Desenvolvimento",
          sectionDescription:
            "Considere conhecimento tecnico, aprendizado, aplicacao pratica e abertura a feedbacks.",
          dimensionKey: "knowledge",
          dimensionTitle: "Conhecimentos da funcao",
          prompt: "5) O colaborador possui os conhecimentos necessarios para desempenhar suas atividades com seguranca e qualidade.",
          sortOrder: 5,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_06",
          sectionKey: "knowledge",
          sectionTitle: "Conhecimento e Desenvolvimento",
          sectionDescription:
            "Considere conhecimento tecnico, aprendizado, aplicacao pratica e abertura a feedbacks.",
          dimensionKey: "development",
          dimensionTitle: "Aprendizado continuo",
          prompt: "6) O colaborador busca aprender constantemente e desenvolver novas habilidades.",
          sortOrder: 6,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_07",
          sectionKey: "knowledge",
          sectionTitle: "Conhecimento e Desenvolvimento",
          sectionDescription:
            "Considere conhecimento tecnico, aprendizado, aplicacao pratica e abertura a feedbacks.",
          dimensionKey: "development",
          dimensionTitle: "Aplicacao de aprendizados",
          prompt: "7) O colaborador aplica novos conhecimentos e aprendizados para melhorar seu desempenho profissional.",
          sortOrder: 7,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_08",
          sectionKey: "knowledge",
          sectionTitle: "Conhecimento e Desenvolvimento",
          sectionDescription:
            "Considere conhecimento tecnico, aprendizado, aplicacao pratica e abertura a feedbacks.",
          dimensionKey: "development",
          dimensionTitle: "Abertura a feedbacks",
          prompt: "8) O colaborador demonstra abertura para receber feedbacks e utiliza-los para aprimorar seu desempenho.",
          sortOrder: 8,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_09",
          sectionKey: "teamwork",
          sectionTitle: "Trabalho em Equipe e Colaboracao",
          sectionDescription:
            "Avalie colaboracao, compartilhamento de conhecimento, comunicacao e relacionamento profissional.",
          dimensionKey: "collaboration",
          dimensionTitle: "Colaboracao com a equipe",
          prompt: "9) O colaborador colabora de forma produtiva com os colegas de equipe.",
          sortOrder: 9,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_10",
          sectionKey: "teamwork",
          sectionTitle: "Trabalho em Equipe e Colaboracao",
          sectionDescription:
            "Avalie colaboracao, compartilhamento de conhecimento, comunicacao e relacionamento profissional.",
          dimensionKey: "collaboration",
          dimensionTitle: "Compartilhamento de conhecimentos",
          prompt: "10) O colaborador compartilha conhecimentos e experiencias que contribuem para o desempenho da equipe.",
          sortOrder: 10,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_11",
          sectionKey: "teamwork",
          sectionTitle: "Trabalho em Equipe e Colaboracao",
          sectionDescription:
            "Avalie colaboracao, compartilhamento de conhecimento, comunicacao e relacionamento profissional.",
          dimensionKey: "communication",
          dimensionTitle: "Comunicacao profissional",
          prompt: "11) O colaborador mantem uma comunicacao clara, respeitosa e profissional com colegas e stakeholders.",
          sortOrder: 11,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_12",
          sectionKey: "teamwork",
          sectionTitle: "Trabalho em Equipe e Colaboracao",
          sectionDescription:
            "Avalie colaboracao, compartilhamento de conhecimento, comunicacao e relacionamento profissional.",
          dimensionKey: "interpersonal",
          dimensionTitle: "Conflitos e divergencias",
          prompt: "12) O colaborador lida de forma construtiva com conflitos ou divergencias de opiniao.",
          sortOrder: 12,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_13",
          sectionKey: "commitment",
          sectionTitle: "Comprometimento e Responsabilidade",
          sectionDescription:
            "Considere comprometimento, responsabilidade, conformidade e postura diante de desafios.",
          dimensionKey: "commitment",
          dimensionTitle: "Comprometimento com objetivos",
          prompt: "13) O colaborador demonstra comprometimento com os objetivos da equipe e da empresa.",
          sortOrder: 13,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_14",
          sectionKey: "commitment",
          sectionTitle: "Comprometimento e Responsabilidade",
          sectionDescription:
            "Considere comprometimento, responsabilidade, conformidade e postura diante de desafios.",
          dimensionKey: "responsibility",
          dimensionTitle: "Responsabilidade por resultados",
          prompt: "14) O colaborador assume responsabilidade por suas atividades e resultados.",
          sortOrder: 14,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_15",
          sectionKey: "commitment",
          sectionTitle: "Comprometimento e Responsabilidade",
          sectionDescription:
            "Considere comprometimento, responsabilidade, conformidade e postura diante de desafios.",
          dimensionKey: "responsibility",
          dimensionTitle: "Conformidade com regras",
          prompt: "15) O colaborador cumpre regras, normas e procedimentos da empresa de forma consistente.",
          sortOrder: 15,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_16",
          sectionKey: "commitment",
          sectionTitle: "Comprometimento e Responsabilidade",
          sectionDescription:
            "Considere comprometimento, responsabilidade, conformidade e postura diante de desafios.",
          dimensionKey: "adaptability",
          dimensionTitle: "Postura diante de mudancas",
          prompt: "16) O colaborador mantem uma postura positiva e produtiva diante de mudancas, desafios e situacoes inesperadas.",
          sortOrder: 16,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_17",
          sectionKey: "growth",
          sectionTitle: "Potencial e Crescimento",
          sectionDescription:
            "Considere disposicao para aprender, evolucao profissional, iniciativa e autonomia.",
          dimensionKey: "growth",
          dimensionTitle: "Disposicao para ampliar contribuicao",
          prompt: "17) O colaborador demonstra disposicao para aprender novas atividades e ampliar sua contribuicao para a equipe.",
          sortOrder: 17,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_18",
          sectionKey: "growth",
          sectionTitle: "Potencial e Crescimento",
          sectionDescription:
            "Considere disposicao para aprender, evolucao profissional, iniciativa e autonomia.",
          dimensionKey: "growth",
          dimensionTitle: "Busca de evolucao",
          prompt: "18) O colaborador busca oportunidades para aprimorar seu desempenho e evolucao profissional.",
          sortOrder: 18,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_19",
          sectionKey: "growth",
          sectionTitle: "Potencial e Crescimento",
          sectionDescription:
            "Considere disposicao para aprender, evolucao profissional, iniciativa e autonomia.",
          dimensionKey: "initiative",
          dimensionTitle: "Iniciativa para melhorias",
          prompt: "19) O colaborador demonstra iniciativa para propor melhorias ou solucoes para seu trabalho, equipe ou processos.",
          sortOrder: 19,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_manager_20",
          sectionKey: "growth",
          sectionTitle: "Potencial e Crescimento",
          sectionDescription:
            "Considere disposicao para aprender, evolucao profissional, iniciativa e autonomia.",
          dimensionKey: "autonomy",
          dimensionTitle: "Autonomia com apoio",
          prompt: "20) O colaborador atua de forma autonoma em suas atividades, buscando apoio quando necessario.",
          sortOrder: 20,
          visibility: "private",
          scaleProfile: "performance"
        }),
        createTextQuestion({
          id: "q_manager_21",
          sectionKey: "final",
          sectionTitle: "Consideracoes Finais",
          sectionDescription:
            "Espaco para resposta dissertativa sobre desenvolvimento e evolucao profissional.",
          dimensionKey: "final-comments",
          dimensionTitle: "Pontos fortes e desenvolvimento",
          prompt:
            "Descreva os principais pontos fortes do colaborador, oportunidades de desenvolvimento e quaisquer observacoes relevantes que possam contribuir para sua evolucao profissional.",
          sortOrder: 21,
          visibility: "private"
        })
      ]
    },
    "cross-functional": {
      id: "t3b",
      key: "cross-functional",
      modelName: "Colega de Outro Setor",
      description:
        "Questionario de visibilidade entre areas. As respostas nao entram na pontuacao final do colaborador.",
      policy: {
        strategy: "standard-library",
        managerCustomQuestionsLimit: 0,
        scale: crossFunctionalVisibilityScale,
        scaleProfile: "visibility",
        confidentiality: "anonymous-aggregate",
        showStrengthsNote: false,
        showDevelopmentNote: false
      },
      questions: [
        createScaleQuestion({
          id: "q_cross_01",
          sectionKey: "cross-functional-visibility",
          sectionTitle: "Colega de Outro Setor",
          sectionDescription:
            "Mapeia o quanto colaboradores de outras areas conhecem o trabalho do avaliado.",
          dimensionKey: "activity-awareness",
          dimensionTitle: "Conhecimento das atividades",
          prompt: "Voce sabe quais sao as principais atividades e responsabilidades do colaborador avaliado?",
          sortOrder: 1,
          visibility: "confidential",
          scaleProfile: "visibility"
        }),
        createScaleQuestion({
          id: "q_cross_02",
          sectionKey: "cross-functional-visibility",
          sectionTitle: "Colega de Outro Setor",
          sectionDescription:
            "Mapeia o quanto colaboradores de outras areas conhecem o trabalho do avaliado.",
          dimensionKey: "interaction",
          dimensionTitle: "Interacao direta ou indireta",
          prompt: "Voce ja teve algum tipo de interacao direta ou indireta com o colaborador avaliado?",
          sortOrder: 2,
          visibility: "confidential",
          scaleProfile: "visibility"
        }),
        createScaleQuestion({
          id: "q_cross_03",
          sectionKey: "cross-functional-visibility",
          sectionTitle: "Colega de Outro Setor",
          sectionDescription:
            "Mapeia o quanto colaboradores de outras areas conhecem o trabalho do avaliado.",
          dimensionKey: "deliverables-contact",
          dimensionTitle: "Contato com entregas",
          prompt: "Voce ja teve contato com entregas ou materiais desenvolvidos pelo colaborador avaliado?",
          sortOrder: 3,
          visibility: "confidential",
          scaleProfile: "visibility"
        }),
        createScaleQuestion({
          id: "q_cross_04",
          sectionKey: "cross-functional-visibility",
          sectionTitle: "Colega de Outro Setor",
          sectionDescription:
            "Mapeia o quanto colaboradores de outras areas conhecem o trabalho do avaliado.",
          dimensionKey: "cross-area-impact",
          dimensionTitle: "Impacto em outras areas",
          prompt: "Com base no que voce conhece, voce considera que o trabalho do colaborador avaliado tem impacto em outras areas da empresa?",
          sortOrder: 4,
          visibility: "confidential",
          scaleProfile: "visibility"
        }),
        createScaleQuestion({
          id: "q_cross_05",
          sectionKey: "cross-functional-visibility",
          sectionTitle: "Colega de Outro Setor",
          sectionDescription:
            "Mapeia o quanto colaboradores de outras areas conhecem o trabalho do avaliado.",
          dimensionKey: "evaluation-visibility",
          dimensionTitle: "Visibilidade para avaliar",
          prompt: "De forma geral, voce sente que tem visibilidade suficiente para avaliar o trabalho do colaborador avaliado?",
          sortOrder: 5,
          visibility: "confidential",
          scaleProfile: "visibility"
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
        scale: performanceScale,
        confidentiality: "anonymous-aggregate",
        showStrengthsNote: false,
        showDevelopmentNote: false,
        maxScore: 2.5
      },
      questions: [
        createScaleQuestion({
          id: "q_leader_01",
          sectionKey: "support",
          sectionTitle: "Apoio e Orientacao",
          sectionDescription:
            "Avalie disponibilidade, direcionamento, acompanhamento e suporte da lideranca.",
          dimensionKey: "support",
          dimensionTitle: "Disponibilidade para apoio",
          prompt:
            "1) Meu lider esta disponivel para orientar e apoiar quando preciso.",
          sortOrder: 1,
          visibility: "confidential",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_leader_02",
          sectionKey: "communication",
          sectionTitle: "Comunicacao e Escuta",
          sectionDescription:
            "Considere clareza, respeito, abertura para ouvir e qualidade das interacoes.",
          dimensionKey: "communication",
          dimensionTitle: "Clareza de alinhamentos",
          prompt:
            "2) Meu lider transmite informacoes, prioridades e alinhamentos de forma clara.",
          sortOrder: 2,
          visibility: "confidential",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_leader_03",
          sectionKey: "communication",
          sectionTitle: "Comunicacao e Escuta",
          sectionDescription:
            "Considere clareza, respeito, abertura para ouvir e qualidade das interacoes.",
          dimensionKey: "listening",
          dimensionTitle: "Abertura para ouvir",
          prompt:
            "3) Meu lider demonstra abertura para ouvir duvidas, opinioes e sugestoes.",
          sortOrder: 3,
          visibility: "confidential",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_leader_04",
          sectionKey: "communication",
          sectionTitle: "Comunicacao e Escuta",
          sectionDescription:
            "Considere clareza, respeito, abertura para ouvir e qualidade das interacoes.",
          dimensionKey: "communication",
          dimensionTitle: "Comunicacao respeitosa",
          prompt:
            "4) Meu lider mantem uma comunicacao respeitosa e profissional no dia a dia.",
          sortOrder: 4,
          visibility: "confidential",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_leader_05",
          sectionKey: "recognition",
          sectionTitle: "Reconhecimento e Desenvolvimento",
          sectionDescription:
            "Avalie reconhecimento, desenvolvimento profissional e confianca na lideranca.",
          dimensionKey: "recognition",
          dimensionTitle: "Reconhecimento de entregas",
          prompt:
            "5) Meu lider valoriza minhas entregas e contribuicoes por meio de feedbacks, elogios ou outras formas de reconhecimento.",
          sortOrder: 5,
          visibility: "confidential",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_leader_06",
          sectionKey: "support",
          sectionTitle: "Apoio e Orientacao",
          sectionDescription:
            "Avalie disponibilidade, direcionamento, acompanhamento e suporte da lideranca.",
          dimensionKey: "direction",
          dimensionTitle: "Direcionamento na execucao",
          prompt:
            "6) Quando necessario, meu lider fornece direcionamento para ajudar na execucao das atividades.",
          sortOrder: 6,
          visibility: "confidential",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_leader_07",
          sectionKey: "support",
          sectionTitle: "Apoio e Orientacao",
          sectionDescription:
            "Avalie disponibilidade, direcionamento, acompanhamento e suporte da lideranca.",
          dimensionKey: "follow-up",
          dimensionTitle: "Acompanhamento do trabalho",
          prompt:
            "7) Meu lider demonstra que acompanha e considera o trabalho que realizo no dia a dia.",
          sortOrder: 7,
          visibility: "confidential",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_leader_08",
          sectionKey: "support",
          sectionTitle: "Apoio e Orientacao",
          sectionDescription:
            "Avalie disponibilidade, direcionamento, acompanhamento e suporte da lideranca.",
          dimensionKey: "feedback",
          dimensionTitle: "Orientacoes e correcoes",
          prompt:
            "8) Recebo orientacoes e correcoes ao longo do trabalho, permitindo ajustes e aprimoramento das minhas atividades.",
          sortOrder: 8,
          visibility: "confidential",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_leader_09",
          sectionKey: "environment",
          sectionTitle: "Ambiente e Tomada de Decisao",
          sectionDescription:
            "Considere ambiente de trabalho, colaboracao, decisoes e equilibrio diante de desafios.",
          dimensionKey: "environment",
          dimensionTitle: "Ambiente respeitoso",
          prompt:
            "9) Meu lider contribui para manter um ambiente de trabalho respeitoso e colaborativo.",
          sortOrder: 9,
          visibility: "confidential",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_leader_10",
          sectionKey: "environment",
          sectionTitle: "Ambiente e Tomada de Decisao",
          sectionDescription:
            "Considere ambiente de trabalho, colaboracao, decisoes e equilibrio diante de desafios.",
          dimensionKey: "collaboration",
          dimensionTitle: "Interacoes profissionais",
          prompt:
            "10) Meu lider promove alinhamentos e interacoes profissionais pautados no respeito, na colaboracao e na boa convivencia entre a equipe.",
          sortOrder: 10,
          visibility: "confidential",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_leader_11",
          sectionKey: "environment",
          sectionTitle: "Ambiente e Tomada de Decisao",
          sectionDescription:
            "Considere ambiente de trabalho, colaboracao, decisoes e equilibrio diante de desafios.",
          dimensionKey: "decision",
          dimensionTitle: "Decisoes coerentes",
          prompt:
            "11) Meu lider toma decisoes de forma coerente e alinhada as necessidades da equipe.",
          sortOrder: 11,
          visibility: "confidential",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_leader_12",
          sectionKey: "environment",
          sectionTitle: "Ambiente e Tomada de Decisao",
          sectionDescription:
            "Considere ambiente de trabalho, colaboracao, decisoes e equilibrio diante de desafios.",
          dimensionKey: "balance",
          dimensionTitle: "Equilibrio em desafios",
          prompt:
            "12) Meu lider demonstra equilibrio ao lidar com desafios, mudancas e situacoes inesperadas.",
          sortOrder: 12,
          visibility: "confidential",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_leader_13",
          sectionKey: "environment",
          sectionTitle: "Ambiente e Tomada de Decisao",
          sectionDescription:
            "Considere ambiente de trabalho, colaboracao, decisoes e equilibrio diante de desafios.",
          dimensionKey: "accessibility",
          dimensionTitle: "Acessibilidade presencial/remota",
          prompt:
            "13) Meu lider esta acessivel para apoiar a equipe, tanto presencialmente quanto em home office, quando aplicavel.",
          sortOrder: 13,
          visibility: "confidential",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_leader_14",
          sectionKey: "recognition",
          sectionTitle: "Reconhecimento e Desenvolvimento",
          sectionDescription:
            "Avalie reconhecimento, desenvolvimento profissional e confianca na lideranca.",
          dimensionKey: "development",
          dimensionTitle: "Desenvolvimento profissional",
          prompt:
            "14) Meu lider cria oportunidades para que eu desenvolva novos conhecimentos e habilidades profissionais.",
          sortOrder: 14,
          visibility: "confidential",
          scaleProfile: "performance"
        }),
        createScaleQuestion({
          id: "q_leader_15",
          sectionKey: "recognition",
          sectionTitle: "Reconhecimento e Desenvolvimento",
          sectionDescription:
            "Avalie reconhecimento, desenvolvimento profissional e confianca na lideranca.",
          dimensionKey: "trust",
          dimensionTitle: "Confianca na lideranca",
          prompt:
            "15) De forma geral, sinto que posso contar com meu lider quando necessario.",
          sortOrder: 15,
          visibility: "confidential",
          scaleProfile: "performance"
        }),
        createTextQuestion({
          id: "q_leader_16",
          sectionKey: "final",
          sectionTitle: "Consideracoes Finais",
          sectionDescription:
            "Espaco para resposta dissertativa sobre lideranca.",
          dimensionKey: "final-comments",
          dimensionTitle: "Sugestoes e observacoes",
          prompt:
            "Escreva aqui suas sugestoes, ideias de melhoria, observacoes sobre processos, comunicacao, recursos, desenvolvimento da equipe, lideranca ou qualquer outro ponto relevante para aprimorar seu trabalho, sua equipe ou a empresa.",
          sortOrder: 16,
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
  questionnaires: [],
  questionnaireQuestions: [],
  questionnaireAccessPolicies: [],
  assignments: [
    {
      id: "ea1",
      cycleId: "c1",
      reviewerUserId: "u1",
      revieweePersonId: "p2",
      questionnaireId: null,
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
      questionnaireId: null,
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
      questionnaireId: null,
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
      questionnaireId: null,
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
      questionnaireId: null,
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
      questionnaireId: null,
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
      questionnaireId: null,
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
      questionnaireId: null,
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
      questionnaireQuestionId: null,
      score: 4,
      evidenceNote: "Cumpriu marcos importantes no periodo."
    },
    {
      id: "ans2",
      submissionId: "es1",
      questionId: "q2",
      questionnaireQuestionId: null,
      score: 4,
      evidenceNote: "Manteve consistencia em sprint critica."
    },
    {
      id: "ans3",
      submissionId: "es1",
      questionId: "q3",
      questionnaireQuestionId: null,
      score: 5,
      evidenceNote: "Apoiou integracao entre times com rapidez."
    },
    {
      id: "ans4",
      submissionId: "es1",
      questionId: "q4",
      questionnaireQuestionId: null,
      score: 4,
      evidenceNote: "Compartilhou contexto tecnico com clareza."
    },
    {
      id: "ans5",
      submissionId: "es1",
      questionId: "q5",
      questionnaireQuestionId: null,
      score: 4,
      evidenceNote: "Comunicou riscos sem ruido."
    },
    {
      id: "ans6",
      submissionId: "es1",
      questionId: "q6",
      questionnaireQuestionId: null,
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
