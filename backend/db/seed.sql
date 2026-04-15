SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO people (id, name, role_title, area, work_unit, work_mode, manager_person_id, employment_type, satisfaction_score) VALUES
('p1', 'Colaborador Demo 01', 'Analista Demo', 'Compliance', 'Sao Paulo', 'hybrid', 'p6', 'internal', 4.4),
('p2', 'Colaborador Demo 02', 'Lider Tecnico Demo', 'Tecnologia', 'Sao Paulo', 'onsite', 'p4', 'internal', 4.1),
('p3', 'Consultor Demo 01', 'Consultor Demo', 'Consultoria', 'Sao Paulo', 'remote', 'p4', 'consultant', 4.0),
('p4', 'Gestor Demo Tecnologia', 'Gerente Demo', 'Tecnologia', 'Sao Paulo', 'hybrid', 'p6', 'internal', 4.3),
('p5', 'Admin Plataforma Demo', 'Administrador da Plataforma', 'Administracao', 'Sao Paulo', 'onsite', NULL, 'internal', 4.5),
('p6', 'RH Demo Corporativo', 'Business Partner RH', 'Gente e Gestao', 'Sao Paulo', 'hybrid', 'p5', 'internal', 4.6),
('p7', 'Compliance Demo', 'Analista de Compliance', 'Compliance', 'Sao Paulo', 'onsite', 'p6', 'internal', 4.2)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO areas (id, name, manager_person_id) VALUES
('a1', 'Compliance', 'p7'),
('a2', 'Tecnologia', 'p4'),
('a3', 'Consultoria', 'p4'),
('a4', 'Administracao', 'p5'),
('a5', 'Gente e Gestao', 'p6')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  manager_person_id = VALUES(manager_person_id);

INSERT INTO competencies (id, competency_key, name, description, status) VALUES
('cmp_delivery', 'delivery', 'Entrega e qualidade', 'Competencia ligada a cumprimento de prazos, qualidade das entregas e consistencia no periodo.', 'active'),
('cmp_collaboration', 'collaboration', 'Colaboracao', 'Competencia ligada a trabalho em equipe, compartilhamento e parceria entre areas.', 'active'),
('cmp_communication', 'communication', 'Comunicacao', 'Competencia ligada a clareza, transparencia e qualidade das interacoes profissionais.', 'active'),
('cmp_interpersonal', 'interpersonal', 'Relacionamento interpessoal', 'Competencia ligada a postura profissional, respeito e convivencia saudavel.', 'active'),
('cmp_development', 'development', 'Desenvolvimento', 'Competencia ligada a aprendizado continuo, feedback e crescimento profissional.', 'active'),
('cmp_strategy', 'strategy', 'Alinhamento estrategico', 'Competencia ligada a entendimento de metas, objetivos e conexao com o trabalho diario.', 'active'),
('cmp_career', 'career', 'Carreira', 'Competencia ligada a visibilidade de trilha, interesses de crescimento e mobilidade interna.', 'active'),
('cmp_resources', 'resources', 'Recursos e estrutura', 'Competencia ligada a acessos, ferramentas e condicoes para execucao do trabalho.', 'active'),
('cmp_recognition', 'recognition', 'Reconhecimento', 'Competencia ligada a valorizacao do trabalho por colegas e lideranca.', 'active'),
('cmp_results', 'results', 'Gestao de resultados', 'Competencia ligada a metas claras, acompanhamento e qualidade de entrega da equipe.', 'active'),
('cmp_engagement', 'engagement', 'Engajamento', 'Competencia ligada a motivacao, comprometimento e energia mobilizadora da lideranca.', 'active'),
('cmp_trust', 'trust', 'Confianca e ambiente', 'Competencia ligada a seguranca psicologica, respeito e construcao de confianca.', 'active'),
('cmp_growth', 'growth', 'Crescimento', 'Competencia ligada a potencial, iniciativa e disposicao para novos desafios.', 'active'),
('cmp_commitment', 'commitment', 'Comprometimento', 'Competencia ligada a responsabilidade com objetivos, regras e resultados.', 'active'),
('cmp_knowledge', 'knowledge', 'Conhecimento tecnico', 'Competencia ligada a dominio tecnico, aplicacao pratica e atualizacao profissional.', 'active'),
('cmp_wellbeing', 'wellbeing', 'Experiencia de trabalho', 'Competencia ligada a bem-estar e percepcao geral da experiencia no trabalho.', 'active')
ON DUPLICATE KEY UPDATE
  competency_key = VALUES(competency_key),
  name = VALUES(name),
  description = VALUES(description),
  status = VALUES(status);

INSERT INTO users (id, person_id, email, password_hash, role_key, status) VALUES
('u1', 'p1', 'colaborador1@demo.local', SHA2('demo123', 256), 'employee', 'active'),
('u2', 'p2', 'colaborador2@demo.local', SHA2('demo123', 256), 'employee', 'active'),
('u3', 'p3', 'consultor1@demo.local', SHA2('demo123', 256), 'employee', 'active'),
('u4', 'p4', 'gestor@demo.local', SHA2('demo123', 256), 'manager', 'active'),
('u5', 'p5', 'admin@demo.local', SHA2('demo123', 256), 'admin', 'active'),
('u6', 'p6', 'rh@demo.local', SHA2('demo123', 256), 'hr', 'active'),
('u7', 'p7', 'compliance@demo.local', SHA2('demo123', 256), 'compliance', 'active')
ON DUPLICATE KEY UPDATE email = VALUES(email);

INSERT INTO evaluation_templates (id, name, description, manager_custom_questions_limit, scale_json) VALUES
(
  't1',
  'Feedback de Colaboracao',
  'Biblioteca padrao para feedback entre pares, lideranca direta e colaboracoes cruzadas.',
  3,
  JSON_ARRAY(
    JSON_OBJECT('value', 1, 'label', 'Muito insatisfeito'),
    JSON_OBJECT('value', 2, 'label', 'Insatisfeito'),
    JSON_OBJECT('value', 3, 'label', 'Parcialmente satisfeito'),
    JSON_OBJECT('value', 4, 'label', 'Satisfeito'),
    JSON_OBJECT('value', 5, 'label', 'Muito satisfeito')
  )
),
(
  't_manager',
  'Feedback do lider sobre o colaborador',
  'Questionario padrao para avaliacao gerencial do colaborador, com foco em desempenho, potencial e desenvolvimento.',
  0,
  JSON_ARRAY(
    JSON_OBJECT('value', 1, 'label', 'Muito abaixo do esperado'),
    JSON_OBJECT('value', 2, 'label', 'Abaixo do esperado'),
    JSON_OBJECT('value', 3, 'label', 'Dentro do esperado'),
    JSON_OBJECT('value', 4, 'label', 'Acima do esperado'),
    JSON_OBJECT('value', 5, 'label', 'Muito acima do esperado')
  )
),
(
  't_cross',
  'Feedback indireto organizacional',
  'Questionario enxuto para percepcao indireta entre areas, com foco em colaboracao, postura, cultura e sinais observaveis no ambiente organizacional.',
  0,
  JSON_ARRAY(
    JSON_OBJECT('value', 1, 'label', 'Muito insatisfeito'),
    JSON_OBJECT('value', 2, 'label', 'Insatisfeito'),
    JSON_OBJECT('value', 3, 'label', 'Parcialmente satisfeito'),
    JSON_OBJECT('value', 4, 'label', 'Satisfeito'),
    JSON_OBJECT('value', 5, 'label', 'Muito satisfeito')
  )
)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO evaluation_questions (id, template_id, dimension_key, dimension_title, prompt_text, sort_order, is_required) VALUES
('q1', 't1', 'delivery', 'Qualidade das Entregas', 'Quao satisfeito voce ficou com a qualidade das entregas feitas por esta pessoa?', 1, TRUE),
('q2', 't1', 'delivery', 'Confiabilidade', 'Quao satisfeito voce ficou com a consistencia e a responsabilidade demonstradas no periodo?', 2, TRUE),
('q3', 't1', 'collaboration', 'Colaboracao', 'Quao satisfeito voce ficou com a colaboracao com colegas e outras areas?', 3, TRUE),
('q4', 't1', 'collaboration', 'Compartilhamento', 'Quao satisfeito voce ficou com a disposicao desta pessoa em compartilhar conhecimento e apoiar o time?', 4, TRUE),
('q5', 't1', 'communication', 'Comunicacao', 'Quao satisfeito voce ficou com a clareza de comunicacao sobre prioridades, riscos e proximos passos?', 5, TRUE),
('q6', 't1', 'interpersonal', 'Relacionamento Interpessoal', 'Quao satisfeito voce ficou com a postura profissional, o respeito e a capacidade de relacionamento desta pessoa?', 6, TRUE),
('q7', 't1', 'self-awareness', 'Autopercepcao', 'Quao satisfeito voce esta com sua propria qualidade de entrega neste semestre?', 7, TRUE),
('q8', 't1', 'development', 'Desenvolvimento', 'Quao satisfeito voce esta com sua evolucao profissional e aprendizado recente?', 8, TRUE),
('q9', 't1', 'collaboration', 'Colaboracao', 'Quao satisfeito voce esta com sua contribuicao para a equipe e para parceiros internos?', 9, TRUE),
('q10', 't1', 'wellbeing', 'Experiencia no Trabalho', 'Quao satisfeito voce esta com sua experiencia geral de trabalho no periodo?', 10, TRUE),
('q11', 't1', 'leadership', 'Clareza de Direcao', 'Quao satisfeito voce esta com a clareza de direcionamento e prioridades dadas pela lideranca?', 11, TRUE),
('q12', 't1', 'support', 'Suporte e Acessibilidade', 'Quao satisfeito voce esta com a disponibilidade da lideranca para apoiar o time?', 12, TRUE),
('q13', 't1', 'development', 'Desenvolvimento da Equipe', 'Quao satisfeito voce esta com o incentivo ao desenvolvimento profissional dado pela lideranca?', 13, TRUE),
('q14', 't1', 'trust', 'Confianca e Ambiente', 'Quao satisfeito voce esta com a forma como a lideranca promove um ambiente respeitoso e confiavel?', 14, TRUE),
('q15', 't1', 'culture', 'Cultura e Valores', 'Quao satisfeito voce esta com a cultura e os valores praticados pela empresa?', 15, TRUE),
('q16', 't1', 'communication', 'Comunicacao Institucional', 'Quao satisfeito voce esta com a transparencia e a comunicacao da empresa?', 16, TRUE),
('q17', 't1', 'resources', 'Estrutura e Recursos', 'Quao satisfeito voce esta com os recursos e a estrutura oferecidos para seu trabalho?', 17, TRUE),
('q18', 't1', 'experience', 'Experiencia Geral', 'Quao satisfeito voce esta com sua experiencia geral na empresa neste semestre?', 18, TRUE)
ON DUPLICATE KEY UPDATE prompt_text = VALUES(prompt_text);

INSERT INTO evaluation_questions (
  id, template_id, section_key, section_title, section_description, dimension_key, dimension_title,
  prompt_text, helper_text, question_type, options_json, sort_order, is_required, collect_evidence_on_extreme
) VALUES
('q_self_01', 't1', 'delivery', 'Desempenho e Entregas', 'Avalie como voce cumpre prazos, organiza tarefas, mantem a qualidade das entregas e resolve problemas no dia a dia.', 'delivery', 'Cumprimento de prazos', '1) Cumpro minhas tarefas e entregas dentro dos prazos estabelecidos.', 'Avalie se voce consegue concluir suas atividades dentro do tempo esperado.', 'scale', NULL, 101, TRUE, FALSE),
('q_self_02', 't1', 'delivery', 'Desempenho e Entregas', 'Avalie como voce cumpre prazos, organiza tarefas, mantem a qualidade das entregas e resolve problemas no dia a dia.', 'delivery', 'Qualidade e precisao', '2) Minhas atividades sao realizadas com atencao a qualidade e precisao.', 'Considere se voce entrega trabalhos com cuidado e atencao aos detalhes.', 'scale', NULL, 102, TRUE, FALSE),
('q_self_03', 't1', 'delivery', 'Desempenho e Entregas', 'Avalie como voce cumpre prazos, organiza tarefas, mantem a qualidade das entregas e resolve problemas no dia a dia.', 'delivery', 'Resolucao de problemas', '3) Consigo lidar eficientemente com problemas ou obstaculos que surgem no trabalho.', 'Reflita se voce consegue encontrar solucoes ou alternativas quando surgem dificuldades.', 'scale', NULL, 103, TRUE, FALSE),
('q_self_04', 't1', 'delivery', 'Desempenho e Entregas', 'Avalie como voce cumpre prazos, organiza tarefas, mantem a qualidade das entregas e resolve problemas no dia a dia.', 'delivery', 'Organizacao e priorizacao', '4) Procuro organizar minhas tarefas para otimizar resultados e tempo.', 'Considere se voce planeja e prioriza bem suas atividades diarias.', 'scale', NULL, 104, TRUE, FALSE),
('q_self_05', 't1', 'knowledge', 'Conhecimento e Desenvolvimento', 'Considere seu dominio tecnico, capacidade de aprendizado, aplicacao pratica de conhecimentos e abertura a feedbacks.', 'knowledge', 'Dominio tecnico', '5) Tenho dominio adequado dos conhecimentos tecnicos necessarios para meu trabalho.', 'Reflita sobre seu nivel de conhecimento tecnico para desempenhar suas funcoes com eficiencia.', 'scale', NULL, 105, TRUE, FALSE),
('q_self_06', 't1', 'knowledge', 'Conhecimento e Desenvolvimento', 'Considere seu dominio tecnico, capacidade de aprendizado, aplicacao pratica de conhecimentos e abertura a feedbacks.', 'development', 'Aprendizado continuo', '6) Busco aprender constantemente e desenvolver novas habilidades.', 'Considere se voce procura oportunidades para aprimorar competencias e conhecimentos.', 'scale', NULL, 106, TRUE, FALSE),
('q_self_07', 't1', 'knowledge', 'Conhecimento e Desenvolvimento', 'Considere seu dominio tecnico, capacidade de aprendizado, aplicacao pratica de conhecimentos e abertura a feedbacks.', 'development', 'Aplicacao pratica', '7) Consigo aplicar de forma pratica o que aprendi em treinamentos, cursos ou experiencias anteriores.', 'Avalie se consegue utilizar os aprendizados adquiridos no dia a dia.', 'scale', NULL, 107, TRUE, FALSE),
('q_self_08', 't1', 'knowledge', 'Conhecimento e Desenvolvimento', 'Considere seu dominio tecnico, capacidade de aprendizado, aplicacao pratica de conhecimentos e abertura a feedbacks.', 'development', 'Abertura a feedbacks', '8) Estou aberto a feedbacks e procuro utiliza-los para melhorar meu desempenho.', 'Reflita sobre sua receptividade a orientacoes e sugestoes de melhoria.', 'scale', NULL, 108, TRUE, FALSE),
('q_self_09', 't1', 'teamwork', 'Trabalho em Equipe e Colaboracao', 'Reflita sobre sua contribuicao a equipe, compartilhamento de conhecimentos, comunicacao e resolucao de conflitos.', 'collaboration', 'Colaboracao com a equipe', '9) Colaboro de forma produtiva com meus colegas de equipe.', 'Considere se voce contribui positivamente para o trabalho coletivo.', 'scale', NULL, 109, TRUE, FALSE),
('q_self_10', 't1', 'teamwork', 'Trabalho em Equipe e Colaboracao', 'Reflita sobre sua contribuicao a equipe, compartilhamento de conhecimentos, comunicacao e resolucao de conflitos.', 'collaboration', 'Compartilhamento de conhecimentos', '10) Compartilho conhecimentos e experiencias que ajudam o desempenho da equipe.', 'Avalie se voce divide informacoes que beneficiam o grupo.', 'scale', NULL, 110, TRUE, FALSE),
('q_self_11', 't1', 'teamwork', 'Trabalho em Equipe e Colaboracao', 'Reflita sobre sua contribuicao a equipe, compartilhamento de conhecimentos, comunicacao e resolucao de conflitos.', 'communication', 'Comunicacao clara e respeitosa', '11) Mantenho uma comunicacao clara e respeitosa com colegas e stakeholders.', 'Reflita se voce se comunica de forma efetiva e adequada.', 'scale', NULL, 111, TRUE, FALSE),
('q_self_12', 't1', 'teamwork', 'Trabalho em Equipe e Colaboracao', 'Reflita sobre sua contribuicao a equipe, compartilhamento de conhecimentos, comunicacao e resolucao de conflitos.', 'interpersonal', 'Conflitos e divergencias', '12) Consigo lidar de forma construtiva com conflitos ou divergencias de opiniao.', 'Considere se voce consegue resolver conflitos mantendo o respeito e equilibrio.', 'scale', NULL, 112, TRUE, FALSE),
('q_self_13', 't1', 'commitment', 'Comprometimento e Responsabilidade', 'Avalie seu comprometimento com metas e objetivos, responsabilidade pelas tarefas e capacidade de perseverar diante de desafios.', 'commitment', 'Comprometimento com objetivos', '13) Demonstro comprometimento com os objetivos da equipe e da empresa.', 'Avalie se voce se envolve e se dedica as metas da equipe e da organizacao.', 'scale', NULL, 113, TRUE, FALSE),
('q_self_14', 't1', 'commitment', 'Comprometimento e Responsabilidade', 'Avalie seu comprometimento com metas e objetivos, responsabilidade pelas tarefas e capacidade de perseverar diante de desafios.', 'responsibility', 'Responsabilidade por resultados', '14) Assumo responsabilidade por minhas tarefas e resultados.', 'Reflita se voce reconhece sua participacao nos resultados positivos e negativos.', 'scale', NULL, 114, TRUE, FALSE),
('q_self_15', 't1', 'commitment', 'Comprometimento e Responsabilidade', 'Avalie seu comprometimento com metas e objetivos, responsabilidade pelas tarefas e capacidade de perseverar diante de desafios.', 'responsibility', 'Conformidade com regras', '15) Cumpro regras, normas e procedimentos da empresa com consistencia.', 'Considere se voce segue politicas e praticas da empresa de forma confiavel.', 'scale', NULL, 115, TRUE, FALSE),
('q_self_16', 't1', 'growth', 'Potencial e Crescimento', 'Considere sua iniciativa, interesse em assumir novas responsabilidades, oportunidades de desenvolvimento e autonomia no trabalho.', 'growth', 'Perseveranca diante de desafios', '16) Me esforco para superar desafios e atingir metas mesmo diante de dificuldades.', 'Avalie se voce persevera para alcancar resultados, mesmo com obstaculos.', 'scale', NULL, 116, TRUE, FALSE),
('q_self_17', 't1', 'growth', 'Potencial e Crescimento', 'Considere sua iniciativa, interesse em assumir novas responsabilidades, oportunidades de desenvolvimento e autonomia no trabalho.', 'growth', 'Novos desafios', '17) Tenho interesse em assumir novas responsabilidades e desafios profissionais.', 'Reflita sobre sua disposicao para assumir tarefas maiores ou mais complexas.', 'scale', NULL, 117, TRUE, FALSE),
('q_self_18', 't1', 'growth', 'Potencial e Crescimento', 'Considere sua iniciativa, interesse em assumir novas responsabilidades, oportunidades de desenvolvimento e autonomia no trabalho.', 'growth', 'Busca de crescimento', '18) Busco oportunidades de crescimento e desenvolvimento dentro da empresa.', 'Considere se voce procura se desenvolver e evoluir na carreira.', 'scale', NULL, 118, TRUE, FALSE),
('q_self_19', 't1', 'growth', 'Potencial e Crescimento', 'Considere sua iniciativa, interesse em assumir novas responsabilidades, oportunidades de desenvolvimento e autonomia no trabalho.', 'initiative', 'Iniciativa para melhorias', '19) Demonstro iniciativa para propor melhorias ou solucoes inovadoras em meu trabalho.', 'Avalie se voce sugere ideias ou melhorias para processos ou resultados.', 'scale', NULL, 119, TRUE, FALSE),
('q_self_20', 't1', 'growth', 'Potencial e Crescimento', 'Considere sua iniciativa, interesse em assumir novas responsabilidades, oportunidades de desenvolvimento e autonomia no trabalho.', 'autonomy', 'Autonomia no dia a dia', '20) Sinto-me capaz de lidar de forma autonoma com minhas atividades e decisoes diarias.', 'Reflita sobre sua capacidade de atuar de forma independente, mantendo resultados satisfatorios.', 'scale', NULL, 120, TRUE, FALSE),
('q_self_21', 't1', 'final', 'Consideracoes Finais', 'Espaco para voce registrar comentarios, feedbacks ou sugestoes adicionais que considere importantes.', 'final-comments', 'Sugestoes e observacoes', 'Escreva aqui suas sugestoes, ideias de melhoria, observacoes sobre processos, comunicacao, recursos, desenvolvimento da equipe, lideranca ou qualquer outro ponto relevante para aprimorar seu trabalho, sua equipe ou a empresa.', '', 'text', NULL, 121, TRUE, FALSE)
ON DUPLICATE KEY UPDATE prompt_text = VALUES(prompt_text), question_type = VALUES(question_type);

INSERT INTO evaluation_questions (
  id, template_id, section_key, section_title, section_description, dimension_key, dimension_title,
  prompt_text, helper_text, question_type, options_json, sort_order, is_required, collect_evidence_on_extreme
) VALUES
('q_manager_01', 't_manager', 'results', 'Resultados', 'Avalie consistencia de entrega, qualidade e responsabilizacao pelos resultados.', 'results', 'Cumprimento de prazos', 'Cumpre prazos e entregas com consistencia', '', 'scale', NULL, 181, TRUE, FALSE),
('q_manager_02', 't_manager', 'results', 'Resultados', 'Avalie consistencia de entrega, qualidade e responsabilizacao pelos resultados.', 'results', 'Qualidade das entregas', 'Entrega trabalho com qualidade adequada', '', 'scale', NULL, 182, TRUE, FALSE),
('q_manager_03', 't_manager', 'results', 'Resultados', 'Avalie consistencia de entrega, qualidade e responsabilizacao pelos resultados.', 'results', 'Responsabilidade pelos resultados', 'Assume responsabilidade pelos resultados', '', 'scale', NULL, 183, TRUE, FALSE),
('q_manager_04', 't_manager', 'teamwork', 'Trabalho em equipe', 'Considere colaboracao, convivencia profissional e contribuicao para o ambiente da equipe.', 'teamwork', 'Colaboracao com a equipe', 'Colabora de forma efetiva com a equipe', '', 'scale', NULL, 184, TRUE, FALSE),
('q_manager_05', 't_manager', 'teamwork', 'Trabalho em equipe', 'Considere colaboracao, convivencia profissional e contribuicao para o ambiente da equipe.', 'teamwork', 'Respeito e ambiente positivo', 'Demonstra respeito e contribui para um ambiente positivo', '', 'scale', NULL, 185, TRUE, FALSE),
('q_manager_06', 't_manager', 'communication', 'Comunicacao', 'Avalie clareza, objetividade e transparencia do colaborador na comunicacao do trabalho.', 'communication', 'Comunicacao clara', 'Comunica-se de forma clara e objetiva', '', 'scale', NULL, 186, TRUE, FALSE),
('q_manager_07', 't_manager', 'communication', 'Comunicacao', 'Avalie clareza, objetividade e transparencia do colaborador na comunicacao do trabalho.', 'communication', 'Alinhamento com o gestor', 'Mantem o gestor informado sobre o andamento das atividades', '', 'scale', NULL, 187, TRUE, FALSE),
('q_manager_08', 't_manager', 'proactivity', 'Proatividade', 'Considere iniciativa, autonomia e contribuicao do colaborador diante de desafios.', 'proactivity', 'Resolucao de problemas', 'Demonstra iniciativa na resolucao de problemas', '', 'scale', NULL, 188, TRUE, FALSE),
('q_manager_09', 't_manager', 'proactivity', 'Proatividade', 'Considere iniciativa, autonomia e contribuicao do colaborador diante de desafios.', 'proactivity', 'Melhorias e novas ideias', 'Propoe melhorias e novas ideias', '', 'scale', NULL, 189, TRUE, FALSE),
('q_manager_10', 't_manager', 'organization', 'Organizacao', 'Avalie capacidade de planejamento, priorizacao e tratamento de volume de trabalho.', 'organization', 'Organizacao de tarefas', 'Organiza bem suas tarefas e prioridades', '', 'scale', NULL, 190, TRUE, FALSE),
('q_manager_11', 't_manager', 'organization', 'Organizacao', 'Avalie capacidade de planejamento, priorizacao e tratamento de volume de trabalho.', 'organization', 'Multiplas demandas', 'Consegue lidar com multiplas demandas', '', 'scale', NULL, 191, TRUE, FALSE),
('q_manager_12', 't_manager', 'technical-capability', 'Capacidade tecnica', 'Considere dominio tecnico, autonomia e resolucao de problemas na funcao atual.', 'technical-capability', 'Conhecimento tecnico', 'Possui conhecimento tecnico adequado para a funcao', '', 'scale', NULL, 192, TRUE, FALSE),
('q_manager_13', 't_manager', 'technical-capability', 'Capacidade tecnica', 'Considere dominio tecnico, autonomia e resolucao de problemas na funcao atual.', 'technical-capability', 'Autonomia tecnica', 'Resolve problemas com autonomia', '', 'scale', NULL, 193, TRUE, FALSE),
('q_manager_14', 't_manager', 'business-focus', 'Foco no negocio', 'Avalie entendimento do contexto de negocio e priorizacao do que gera mais valor.', 'business-focus', 'Impacto no negocio', 'Entende o impacto do seu trabalho no negocio', '', 'scale', NULL, 194, TRUE, FALSE),
('q_manager_15', 't_manager', 'business-focus', 'Foco no negocio', 'Avalie entendimento do contexto de negocio e priorizacao do que gera mais valor.', 'business-focus', 'Prioridade de valor', 'Prioriza atividades de maior valor', '', 'scale', NULL, 195, TRUE, FALSE),
('q_manager_16', 't_manager', 'overall', 'Avaliacao geral', 'Registre a leitura geral do desempenho atual e do potencial de crescimento do colaborador.', 'overall', 'Desempenho geral', 'Desempenho geral do colaborador', '', 'scale', NULL, 196, TRUE, FALSE),
('q_manager_17', 't_manager', 'overall', 'Avaliacao geral', 'Registre a leitura geral do desempenho atual e do potencial de crescimento do colaborador.', 'overall', 'Potencial de crescimento', 'Potencial de crescimento', '', 'scale', NULL, 197, TRUE, FALSE),
('q_manager_18', 't_manager', 'open-feedback', 'Perguntas abertas', 'Registre uma leitura qualitativa para orientar a devolutiva e o desenvolvimento do colaborador.', 'open-feedback', 'Pontos fortes', 'Quais sao os principais pontos fortes do colaborador?', '', 'text', NULL, 198, TRUE, FALSE),
('q_manager_19', 't_manager', 'open-feedback', 'Perguntas abertas', 'Registre uma leitura qualitativa para orientar a devolutiva e o desenvolvimento do colaborador.', 'open-feedback', 'Pontos de melhoria', 'Quais sao os principais pontos de melhoria?', '', 'text', NULL, 199, TRUE, FALSE),
('q_manager_20', 't_manager', 'open-feedback', 'Perguntas abertas', 'Registre uma leitura qualitativa para orientar a devolutiva e o desenvolvimento do colaborador.', 'open-feedback', 'Recomendacao de desenvolvimento', 'Que tipo de desenvolvimento voce recomenda?', '', 'text', NULL, 200, TRUE, FALSE)
ON DUPLICATE KEY UPDATE prompt_text = VALUES(prompt_text), question_type = VALUES(question_type);

INSERT INTO evaluation_questions (
  id, template_id, section_key, section_title, section_description, dimension_key, dimension_title,
  prompt_text, helper_text, question_type, options_json, sort_order, is_required, collect_evidence_on_extreme
) VALUES
('q_cross_01', 't_cross', 'organizational-collaboration', 'Colaboracao organizacional', 'Considere apenas o que e perceptivel na convivencia organizacional e nas interacoes entre times.', 'organizational-collaboration', 'Disposicao para colaborar', 'Demonstra disposicao para colaborar quando necessario', '', 'scale', NULL, 231, TRUE, FALSE),
('q_cross_02', 't_cross', 'organizational-collaboration', 'Colaboracao organizacional', 'Considere apenas o que e perceptivel na convivencia organizacional e nas interacoes entre times.', 'organizational-collaboration', 'Acessibilidade entre times', 'E acessivel e aberto a interacoes com outros times', '', 'scale', NULL, 232, TRUE, FALSE),
('q_cross_03', 't_cross', 'communication', 'Comunicacao', 'Avalie apenas sinais observaveis em reunioes, chats e interacoes compartilhadas.', 'communication', 'Clareza em ambientes compartilhados', 'Comunica-se de forma clara em ambientes compartilhados (reunioes, chats, etc.)', '', 'scale', NULL, 233, TRUE, FALSE),
('q_cross_04', 't_cross', 'communication', 'Comunicacao', 'Avalie apenas sinais observaveis em reunioes, chats e interacoes compartilhadas.', 'communication', 'Respeito na comunicacao', 'Demonstra respeito na comunicacao com outros', '', 'scale', NULL, 234, TRUE, FALSE),
('q_cross_05', 't_cross', 'professional-posture', 'Postura profissional', 'Considere o comportamento percebido no ambiente profissional e institucional.', 'professional-posture', 'Comportamento profissional', 'Demonstra comportamento profissional adequado', '', 'scale', NULL, 235, TRUE, FALSE),
('q_cross_06', 't_cross', 'professional-posture', 'Postura profissional', 'Considere o comportamento percebido no ambiente profissional e institucional.', 'professional-posture', 'Etica e respeito', 'Age com etica e respeito no ambiente de trabalho', '', 'scale', NULL, 236, TRUE, FALSE),
('q_cross_07', 't_cross', 'culture', 'Atitude e cultura', 'Observe a contribuicao geral para o clima e para a cultura da organizacao.', 'culture', 'Ambiente positivo', 'Contribui para um ambiente de trabalho positivo', '', 'scale', NULL, 237, TRUE, FALSE),
('q_cross_08', 't_cross', 'culture', 'Atitude e cultura', 'Observe a contribuicao geral para o clima e para a cultura da organizacao.', 'culture', 'Atitude colaborativa organizacional', 'Demonstra atitude colaborativa com a organizacao como um todo', '', 'scale', NULL, 238, TRUE, FALSE),
('q_cross_09', 't_cross', 'visible-proactivity', 'Proatividade perceptivel', 'Considere apenas iniciativas observaveis em interacoes institucionais ou entre areas.', 'visible-proactivity', 'Iniciativa observavel', 'Demonstra iniciativa em interacoes organizacionais (reunioes, discussoes, etc.)', '', 'scale', NULL, 239, TRUE, FALSE),
('q_cross_10', 't_cross', 'visible-proactivity', 'Proatividade perceptivel', 'Considere apenas iniciativas observaveis em interacoes institucionais ou entre areas.', 'visible-proactivity', 'Engajamento perceptivel', 'Parece engajado com o trabalho e com a empresa', '', 'scale', NULL, 240, TRUE, FALSE),
('q_cross_11', 't_cross', 'open-feedback', 'Perguntas abertas', 'Use este espaco com base apenas na sua percepcao geral e em sinais observados no contexto organizacional.', 'open-feedback', 'Pontos fortes percebidos', 'Com base na sua percepcao geral, quais sao os principais pontos fortes deste colaborador?', '', 'text', NULL, 241, TRUE, FALSE),
('q_cross_12', 't_cross', 'open-feedback', 'Perguntas abertas', 'Use este espaco com base apenas na sua percepcao geral e em sinais observados no contexto organizacional.', 'open-feedback', 'Comportamentos a melhorar', 'Ha algum comportamento que poderia ser melhorado?', '', 'text', NULL, 242, TRUE, FALSE),
('q_cross_13', 't_cross', 'open-feedback', 'Perguntas abertas', 'Use este espaco com base apenas na sua percepcao geral e em sinais observados no contexto organizacional.', 'open-feedback', 'Conforto de trabalho direto', 'Voce se sentiria confortavel trabalhando diretamente com essa pessoa? Por que?', '', 'text', NULL, 243, TRUE, FALSE),
('q_cross_14', 't_cross', 'open-feedback', 'Perguntas abertas', 'Use este espaco com base apenas na sua percepcao geral e em sinais observados no contexto organizacional.', 'open-feedback', 'Destaque positivo', 'Existe algo positivo que voce observou e que merece destaque?', '', 'text', NULL, 244, TRUE, FALSE)
ON DUPLICATE KEY UPDATE prompt_text = VALUES(prompt_text), question_type = VALUES(question_type);

INSERT INTO evaluation_questions (
  id, template_id, section_key, section_title, section_description, dimension_key, dimension_title,
  prompt_text, helper_text, question_type, options_json, sort_order, is_required, collect_evidence_on_extreme
) VALUES
('q_leader_01', 't1', 'results', 'Gestao de Resultados e Organizacao', 'Avalie se seu lider define metas claras, organiza tarefas, acompanha o progresso da equipe e garante entregas de qualidade e no prazo.', 'results', 'Metas claras', '1) Meu lider define metas claras e alcancaveis para a equipe.', 'Avalie se o lider estabelece objetivos claros e realistas para todos.', 'scale', NULL, 201, TRUE, FALSE),
('q_leader_02', 't1', 'results', 'Gestao de Resultados e Organizacao', 'Avalie se seu lider define metas claras, organiza tarefas, acompanha o progresso da equipe e garante entregas de qualidade e no prazo.', 'results', 'Distribuicao de tarefas', '2) Meu lider organiza e distribui tarefas de forma eficiente.', 'Considere se ele distribui responsabilidades de forma equilibrada e organizada.', 'scale', NULL, 202, TRUE, FALSE),
('q_leader_03', 't1', 'results', 'Gestao de Resultados e Organizacao', 'Avalie se seu lider define metas claras, organiza tarefas, acompanha o progresso da equipe e garante entregas de qualidade e no prazo.', 'results', 'Acompanhamento do progresso', '3) Meu lider acompanha o progresso da equipe e ajusta quando necessario.', 'Reflita sobre o acompanhamento das atividades e a capacidade de corrigir desvios.', 'scale', NULL, 203, TRUE, FALSE),
('q_leader_04', 't1', 'results', 'Gestao de Resultados e Organizacao', 'Avalie se seu lider define metas claras, organiza tarefas, acompanha o progresso da equipe e garante entregas de qualidade e no prazo.', 'results', 'Qualidade e prazo', '4) Meu lider assegura que as entregas da equipe atendam aos padroes de qualidade e prazo.', 'Avalie se ele garante que o trabalho seja consistente e entregue no tempo esperado.', 'scale', NULL, 204, TRUE, FALSE),
('q_leader_05', 't1', 'development', 'Desenvolvimento da Equipe', 'Considere como ele identifica oportunidades de crescimento, oferece feedbacks, incentiva aprendizado e apoia o desenvolvimento dos colaboradores.', 'development', 'Oportunidades por colaborador', '5) Meu lider identifica oportunidades de desenvolvimento para cada membro da equipe.', 'Considere se ele percebe o potencial e necessidades de crescimento de cada colaborador.', 'scale', NULL, 205, TRUE, FALSE),
('q_leader_06', 't1', 'development', 'Desenvolvimento da Equipe', 'Considere como ele identifica oportunidades de crescimento, oferece feedbacks, incentiva aprendizado e apoia o desenvolvimento dos colaboradores.', 'development', 'Feedback regular e claro', '6) Recebo feedbacks regulares, claros e construtivos do meu lider.', 'Reflita se ele oferece orientacoes frequentes e uteis para seu desenvolvimento.', 'scale', NULL, 206, TRUE, FALSE),
('q_leader_07', 't1', 'development', 'Desenvolvimento da Equipe', 'Considere como ele identifica oportunidades de crescimento, oferece feedbacks, incentiva aprendizado e apoia o desenvolvimento dos colaboradores.', 'development', 'Incentivo ao aprendizado', '7) Meu lider incentiva o aprendizado continuo e aprimoramento das habilidades da equipe.', 'Avalie se ele promove treinamentos e oportunidades de crescimento.', 'scale', NULL, 207, TRUE, FALSE),
('q_leader_08', 't1', 'development', 'Desenvolvimento da Equipe', 'Considere como ele identifica oportunidades de crescimento, oferece feedbacks, incentiva aprendizado e apoia o desenvolvimento dos colaboradores.', 'development', 'Apoio personalizado ao crescimento', '8) Meu lider apoia o crescimento profissional dos colaboradores, respeitando seus interesses e potencial.', 'Considere se ele orienta o desenvolvimento da equipe de forma personalizada.', 'scale', NULL, 208, TRUE, FALSE),
('q_leader_09', 't1', 'communication', 'Comunicacao e Relacionamento', 'Reflita sobre a clareza da comunicacao do lider, escuta ativa, promocao de colaboracao e habilidade de lidar com conflitos.', 'communication', 'Comunicacao clara', '9) Meu lider se comunica de forma clara, assertiva e transparente.', 'Reflita sobre a clareza das informacoes e instrucoes recebidas.', 'scale', NULL, 209, TRUE, FALSE),
('q_leader_10', 't1', 'communication', 'Comunicacao e Relacionamento', 'Reflita sobre a clareza da comunicacao do lider, escuta ativa, promocao de colaboracao e habilidade de lidar com conflitos.', 'communication', 'Escuta e valorizacao da equipe', '10) Meu lider escuta e valoriza opinioes e ideias da equipe.', 'Avalie se ele da espaco para sua participacao e respeita suas contribuicoes.', 'scale', NULL, 210, TRUE, FALSE),
('q_leader_11', 't1', 'communication', 'Comunicacao e Relacionamento', 'Reflita sobre a clareza da comunicacao do lider, escuta ativa, promocao de colaboracao e habilidade de lidar com conflitos.', 'trust', 'Colaboracao, respeito e confianca', '11) Meu lider promove um ambiente de colaboracao, respeito e confianca.', 'Considere se ele incentiva trabalho em equipe e cria um clima seguro.', 'scale', NULL, 211, TRUE, FALSE),
('q_leader_12', 't1', 'communication', 'Comunicacao e Relacionamento', 'Reflita sobre a clareza da comunicacao do lider, escuta ativa, promocao de colaboracao e habilidade de lidar com conflitos.', 'trust', 'Conflitos e divergencias', '12) Meu lider lida de forma construtiva com conflitos ou divergencias na equipe.', 'Reflita sobre sua capacidade de resolver problemas de relacionamento e divergencias.', 'scale', NULL, 212, TRUE, FALSE),
('q_leader_13', 't1', 'engagement', 'Engajamento e Motivacao', 'Avalie se ele demonstra comprometimento, inspira a equipe, reconhece esforcos e cria um ambiente de trabalho positivo.', 'engagement', 'Comprometimento com objetivos', '13) Meu lider demonstra comprometimento com os objetivos da empresa e da equipe.', 'Avalie se ele se envolve ativamente nos resultados e metas da equipe.', 'scale', NULL, 213, TRUE, FALSE),
('q_leader_14', 't1', 'engagement', 'Engajamento e Motivacao', 'Avalie se ele demonstra comprometimento, inspira a equipe, reconhece esforcos e cria um ambiente de trabalho positivo.', 'engagement', 'Inspiracao e motivacao', '14) Meu lider inspira e motiva a equipe a se empenhar nas atividades.', 'Considere se ele incentiva engajamento, entusiasmo e participacao da equipe.', 'scale', NULL, 214, TRUE, FALSE),
('q_leader_15', 't1', 'engagement', 'Engajamento e Motivacao', 'Avalie se ele demonstra comprometimento, inspira a equipe, reconhece esforcos e cria um ambiente de trabalho positivo.', 'engagement', 'Reconhecimento de conquistas', '15) Meu lider reconhece e valoriza conquistas e esforcos individuais e coletivos.', 'Reflita se ele oferece reconhecimento adequado aos colaboradores.', 'scale', NULL, 215, TRUE, FALSE),
('q_leader_16', 't1', 'engagement', 'Engajamento e Motivacao', 'Avalie se ele demonstra comprometimento, inspira a equipe, reconhece esforcos e cria um ambiente de trabalho positivo.', 'engagement', 'Ambiente positivo e inclusivo', '16) Meu lider promove um ambiente de trabalho positivo, inclusivo e engajador.', 'Avalie se ele contribui para um clima motivador, seguro e produtivo.', 'scale', NULL, 216, TRUE, FALSE),
('q_leader_17', 't1', 'strategy', 'Visao Estrategica e Autodesenvolvimento', 'Considere sua capacidade de tomar decisoes estrategicas, buscar aprendizado continuo e equilibrar orientacao e autonomia da equipe.', 'strategy', 'Decisao estrategica', '17) Meu lider demonstra capacidade de tomar decisoes estrategicas e alinhadas aos objetivos da empresa.', 'Considere se ele consegue tomar decisoes adequadas e consistentes com a estrategia da empresa.', 'scale', NULL, 217, TRUE, FALSE),
('q_leader_18', 't1', 'strategy', 'Visao Estrategica e Autodesenvolvimento', 'Considere sua capacidade de tomar decisoes estrategicas, buscar aprendizado continuo e equilibrar orientacao e autonomia da equipe.', 'strategy', 'Autodesenvolvimento da lideranca', '18) Meu lider esta atento as proprias oportunidades de desenvolvimento e aprimoramento como lider.', 'Avalie se ele busca evoluir continuamente em suas competencias de gestao.', 'scale', NULL, 218, TRUE, FALSE),
('q_leader_19', 't1', 'strategy', 'Visao Estrategica e Autodesenvolvimento', 'Considere sua capacidade de tomar decisoes estrategicas, buscar aprendizado continuo e equilibrar orientacao e autonomia da equipe.', 'strategy', 'Aprendizado continuo', '19) Meu lider busca aprendizado continuo sobre gestao, lideranca e boas praticas.', 'Reflita se ele se mantem atualizado e procura se aprimorar constantemente.', 'scale', NULL, 219, TRUE, FALSE),
('q_leader_20', 't1', 'strategy', 'Visao Estrategica e Autodesenvolvimento', 'Considere sua capacidade de tomar decisoes estrategicas, buscar aprendizado continuo e equilibrar orientacao e autonomia da equipe.', 'strategy', 'Equilibrio entre orientacao e autonomia', '20) Meu lider equilibra orientacao e autonomia, permitindo que a equipe trabalhe com confianca e responsabilidade.', 'Considere se ele delega adequadamente, dando suporte sem sobrecarregar ou restringir a equipe.', 'scale', NULL, 220, TRUE, FALSE),
('q_leader_21', 't1', 'final', 'Consideracoes Finais', 'Espaco para voce registrar comentarios, feedbacks ou sugestoes adicionais que considere importantes.', 'final-comments', 'Sugestoes e observacoes', 'Escreva aqui suas sugestoes, ideias de melhoria, observacoes sobre processos, comunicacao, recursos, desenvolvimento da equipe, lideranca ou qualquer outro ponto relevante para aprimorar seu trabalho, sua equipe ou a empresa.', '', 'text', NULL, 221, TRUE, FALSE)
ON DUPLICATE KEY UPDATE prompt_text = VALUES(prompt_text), question_type = VALUES(question_type);

INSERT INTO evaluation_questions (
  id, template_id, section_key, section_title, section_description, dimension_key, dimension_title,
  prompt_text, helper_text, question_type, options_json, sort_order, is_required, collect_evidence_on_extreme
) VALUES
('q_company_01', 't1', 'satisfaction', 'Satisfacao profissional e alinhamento', 'Perguntas sobre orgulho de pertencimento, alinhamento estrategico e satisfacao com a experiencia profissional na empresa.', 'satisfaction', 'Orgulho de pertencer', 'Voce tem orgulho em dizer que trabalha na ABC Technology Group?', 'Considere se a empresa representa algo positivo para voce, se sente satisfacao em fazer parte dela e se recomendaria trabalhar aqui para outras pessoas.', 'scale', NULL, 301, TRUE, FALSE),
('q_company_02', 't1', 'satisfaction', 'Satisfacao profissional e alinhamento', 'Perguntas sobre orgulho de pertencimento, alinhamento estrategico e satisfacao com a experiencia profissional na empresa.', 'satisfaction', 'Fatores de satisfacao', 'O que mais te satisfaz profissionalmente?', 'Considere quais aspectos do seu trabalho lhe trazem maior motivacao, realizacao e satisfacao.', 'multi-select', JSON_ARRAY('home-office', 'flexibilidade', 'crescimento-financeiro', 'desenvolvimento-profissional', 'ambiente-de-trabalho'), 302, TRUE, FALSE),
('q_company_03', 't1', 'satisfaction', 'Satisfacao profissional e alinhamento', 'Perguntas sobre orgulho de pertencimento, alinhamento estrategico e satisfacao com a experiencia profissional na empresa.', 'strategy', 'Metas da empresa', 'Os objetivos e metas da ABC Technology Group para 2026 estao bem definidos?', 'Reflita se voce conhece claramente as metas e prioridades da empresa para o ano, entende como elas impactam seu trabalho e se percebe uma comunicacao clara sobre esses objetivos.', 'scale', NULL, 303, TRUE, FALSE),
('q_company_04', 't1', 'satisfaction', 'Satisfacao profissional e alinhamento', 'Perguntas sobre orgulho de pertencimento, alinhamento estrategico e satisfacao com a experiencia profissional na empresa.', 'strategy', 'Metas da equipe', 'Os objetivos e metas da sua equipe ou departamento estao bem definidos?', 'Avalie se voce compreende claramente as metas especificas da sua area, como elas se conectam aos objetivos gerais da empresa e se ha alinhamento entre o que e esperado e o que e comunicado.', 'scale', NULL, 304, TRUE, FALSE),
('q_company_05', 't1', 'satisfaction', 'Satisfacao profissional e alinhamento', 'Perguntas sobre orgulho de pertencimento, alinhamento estrategico e satisfacao com a experiencia profissional na empresa.', 'strategy', 'Alinhamento com o trabalho diario', 'Os objetivos e metas da sua equipe ou departamento estao alinhados com suas atividades diarias?', 'Considere se suas tarefas e responsabilidades contribuem diretamente para alcancar as metas da equipe, garantindo que seu trabalho esteja conectado aos objetivos do departamento.', 'scale', NULL, 305, TRUE, FALSE),
('q_company_06', 't1', 'career', 'Rotina, carreira e desenvolvimento', 'Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.', 'routine', 'Clareza sobre responsabilidades', 'Voce tem clareza sobre suas responsabilidades e demandas diarias?', 'Reflita se voce entende bem suas tarefas, prioridades e expectativas, sabendo exatamente o que precisa ser feito em seu dia a dia.', 'scale', NULL, 306, TRUE, FALSE),
('q_company_07', 't1', 'career', 'Rotina, carreira e desenvolvimento', 'Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.', 'routine', 'Sobrecarga individual', 'Voce sente que suas demandas individuais estao te sobrecarregando?', 'Considere se a quantidade e complexidade das suas tarefas estao dentro da sua capacidade de execucao, sem comprometer qualidade, bem-estar ou equilibrio entre vida pessoal e profissional.', 'scale', NULL, 307, TRUE, FALSE),
('q_company_08', 't1', 'career', 'Rotina, carreira e desenvolvimento', 'Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.', 'career', 'Plano de carreira', 'Voce tem um entendimento claro sobre o seu plano de carreira?', 'Reflita se voce conhece as oportunidades de crescimento e desenvolvimento dentro da empresa, os caminhos possiveis e os requisitos para avancar na sua carreira.', 'scale', NULL, 308, TRUE, FALSE),
('q_company_09', 't1', 'career', 'Rotina, carreira e desenvolvimento', 'Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.', 'career', 'Satisfacao com area atual', 'Voce esta satisfeito em atuar na area e departamento atuais?', 'Considere se voce se sente motivado e realizado com as atividades e responsabilidades da sua area, e se acredita que seu trabalho contribui de forma significativa para a equipe e a empresa.', 'scale', NULL, 309, TRUE, FALSE),
('q_company_10', 't1', 'career', 'Rotina, carreira e desenvolvimento', 'Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.', 'career', 'Interesse em migracao de area', 'Seu objetivo futuro e migrar de area ou departamento?', 'Reflita se voce tem interesse em desenvolver sua carreira em outra area da empresa e se busca oportunidades de aprendizado ou crescimento em funcoes diferentes da atual.', 'scale', NULL, 310, TRUE, FALSE),
('q_company_11', 't1', 'career', 'Rotina, carreira e desenvolvimento', 'Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.', 'career', 'Clareza sobre competencias a desenvolver', 'Voce sabe quais habilidades e competencias precisa desenvolver para crescer profissionalmente?', 'Considere se voce tem clareza sobre as capacidades e conhecimentos necessarios para avancar na carreira e se conhece os caminhos ou recursos disponiveis para seu desenvolvimento.', 'scale', NULL, 311, TRUE, FALSE),
('q_company_12', 't1', 'career', 'Rotina, carreira e desenvolvimento', 'Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.', 'career', 'Competencias a desenvolver', 'Quais habilidades e competencias voce precisa desenvolver para crescer profissionalmente? Se nao souber, informe qual e sua duvida sobre o assunto.', 'Use este espaco para identificar as areas em que deseja se desenvolver ou esclarecer duvidas sobre as competencias necessarias para avancar na sua carreira.', 'text', NULL, 312, TRUE, FALSE),
('q_company_13', 't1', 'career', 'Rotina, carreira e desenvolvimento', 'Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.', 'development', 'Ciencia sobre cursos do departamento', 'Voce tem ciencia de que a empresa disponibiliza cursos voltados ao seu departamento?', 'Reflita se voce conhece os treinamentos e cursos oferecidos pela empresa que podem contribuir para o seu desenvolvimento profissional e aprimoramento das habilidades relacionadas a sua funcao.', 'scale', NULL, 313, TRUE, FALSE),
('q_company_14', 't1', 'career', 'Rotina, carreira e desenvolvimento', 'Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.', 'development', 'Interesse em cursos de outras areas', 'Voce tem interesse em participar de cursos oferecidos pela empresa em areas de conhecimento diferentes da sua?', 'Considere se voce gostaria de ampliar seus conhecimentos e habilidades em outras areas, explorando novas oportunidades de aprendizado e desenvolvimento profissional.', 'scale', NULL, 314, TRUE, FALSE),
('q_company_15', 't1', 'experience', 'Realizacao, reconhecimento e recursos', 'Perguntas sobre realizacao profissional, reconhecimento, recursos e ferramentas disponiveis para o trabalho.', 'experience', 'Realizacao profissional', 'Voce se sente realizado profissionalmente?', 'Reflita sobre seu nivel de satisfacao com suas conquistas, crescimento, reconhecimento e impacto do seu trabalho dentro da empresa.', 'scale', NULL, 315, TRUE, FALSE),
('q_company_16', 't1', 'experience', 'Realizacao, reconhecimento e recursos', 'Perguntas sobre realizacao profissional, reconhecimento, recursos e ferramentas disponiveis para o trabalho.', 'experience', 'Motivacao com metas e prazos', 'Voce se sente realizado quando seu trabalho exige metas e prazos para entrega?', 'Considere se trabalhar com objetivos claros e prazos desafiadores aumenta sua motivacao, engajamento e sensacao de conquista profissional.', 'scale', NULL, 316, TRUE, FALSE),
('q_company_17', 't1', 'experience', 'Realizacao, reconhecimento e recursos', 'Perguntas sobre realizacao profissional, reconhecimento, recursos e ferramentas disponiveis para o trabalho.', 'recognition', 'Reconhecimento pelos colegas', 'Voce sente que seu trabalho e reconhecido e valorizado por seus colegas de departamento?', 'Reflita se seus esforcos e contribuicoes sao percebidos e apreciados pelos colegas, promovendo um ambiente de respeito, colaboracao e motivacao.', 'scale', NULL, 317, TRUE, FALSE),
('q_company_18', 't1', 'experience', 'Realizacao, reconhecimento e recursos', 'Perguntas sobre realizacao profissional, reconhecimento, recursos e ferramentas disponiveis para o trabalho.', 'recognition', 'Reconhecimento pela lideranca', 'Voce sente que seu trabalho e reconhecido e valorizado pelo seu lider?', 'Considere se seu lider reconhece suas entregas, esforcos e resultados, oferecendo feedbacks ou incentivos que reforcem sua motivacao e engajamento.', 'scale', NULL, 318, TRUE, FALSE),
('q_company_19', 't1', 'experience', 'Realizacao, reconhecimento e recursos', 'Perguntas sobre realizacao profissional, reconhecimento, recursos e ferramentas disponiveis para o trabalho.', 'resources', 'Acessos e recursos', 'Voce tem a sua disposicao os recursos e acessos necessarios para desempenhar suas funcoes de forma eficiente?', 'Considere se voce possui os acessos a sistemas, informacoes e dados essenciais para realizar suas tarefas de forma completa e eficiente.', 'scale', NULL, 319, TRUE, FALSE),
('q_company_20', 't1', 'experience', 'Realizacao, reconhecimento e recursos', 'Perguntas sobre realizacao profissional, reconhecimento, recursos e ferramentas disponiveis para o trabalho.', 'resources', 'Ferramentas e materiais', 'Voce tem a sua disposicao as ferramentas e materiais necessarios para desempenhar suas funcoes de forma eficiente?', 'Reflita se voce conta com os equipamentos, softwares, materiais e demais recursos fisicos ou digitais necessarios para realizar suas tarefas com qualidade e produtividade.', 'scale', NULL, 320, TRUE, FALSE),
('q_company_21', 't1', 'experience', 'Realizacao, reconhecimento e recursos', 'Perguntas sobre realizacao profissional, reconhecimento, recursos e ferramentas disponiveis para o trabalho.', 'resources', 'Sugestoes de melhoria para recursos', 'Deixe uma sugestao de como melhorar os recursos e ferramentas disponiveis para seu trabalho.', 'Use este espaco para indicar ideias ou melhorias que poderiam tornar seus recursos, equipamentos ou ferramentas mais eficientes e adequados as suas necessidades.', 'text', NULL, 321, TRUE, FALSE),
('q_company_22', 't1', 'final', 'Consideracoes Finais', 'Espaco final para autoavaliacao do periodo e sugestoes de melhoria para a empresa.', 'final-comments', 'Desempenho profissional no periodo', 'Descreva como voce avalia seu desempenho profissional ate 03/2026.', 'Reflita sobre suas entregas, resultados e evolucao ate o momento, destacando conquistas, desafios superados e aprendizados obtidos no periodo.', 'text', NULL, 322, TRUE, FALSE),
('q_company_23', 't1', 'final', 'Consideracoes Finais', 'Espaco final para autoavaliacao do periodo e sugestoes de melhoria para a empresa.', 'final-comments', 'Sugestoes gerais', 'Deixe aqui sua sugestao! Pode ser sobre cursos do seu interesse, melhorias nos processos das suas atividades, melhoria na comunicacao da empresa, etc.', 'Use este espaco para compartilhar ideias, opinioes ou propostas que possam contribuir para seu desenvolvimento, para a eficiencia do trabalho ou para melhorar o ambiente e a comunicacao na empresa.', 'text', NULL, 323, TRUE, FALSE)
ON DUPLICATE KEY UPDATE prompt_text = VALUES(prompt_text), question_type = VALUES(question_type), options_json = VALUES(options_json);

INSERT INTO evaluation_cycles (id, template_id, library_id, library_name, title, semester_label, status, is_enabled, enabled_relationships_json, due_date, target_group, created_by_user_id) VALUES
('c1', 't1', 'library_standard_02_2026', 'Biblioteca padrao 02/2026', 'Ciclo Semestral 2026.1', '2026.1', 'Liberado', TRUE, NULL, '2026-04-15', 'Todos os colaboradores', 'u6')
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO evaluation_assignments (id, cycle_id, reviewer_user_id, reviewee_person_id, relationship_type, project_context, collaboration_context, status, reminder_count, last_reminder_sent_at, due_date) VALUES
('ea1', 'c1', 'u1', 'p2', 'peer', 'Projeto Modernizacao Portal', 'Atuaram juntos na priorizacao de melhorias e alinhamento de requisitos.', 'submitted', 0, NULL, '2026-04-15'),
('ea2', 'c1', 'u4', 'p2', 'manager', 'Rotina da area', 'Avaliacao gerencial semestral.', 'pending', 0, NULL, '2026-04-15'),
('ea3', 'c1', 'u2', 'p1', 'cross-functional', 'Politica de acessos', 'Solicitacao de feedback de colaboracao em atividade compartilhada.', 'pending', 0, NULL, '2026-04-15'),
('ea4', 'c1', 'u1', 'p1', 'self', 'Reflexao individual', 'Autoavaliacao semestral do colaborador.', 'pending', 0, NULL, '2026-04-15'),
('ea5', 'c1', 'u1', 'p4', 'leader', 'Avaliacao da lideranca imediata', 'Leitura da lideranca no semestre.', 'pending', 0, NULL, '2026-04-15'),
('ea6', 'c1', 'u1', 'p1', 'company', 'Experiencia institucional', 'Avaliacao da empresa e da experiencia geral do colaborador.', 'pending', 0, NULL, '2026-04-15'),
('ea7', 'c1', 'u1', 'p2', 'client-internal', 'Consumo interno entre areas', 'Leitura da area cliente sobre qualidade de atendimento, parceria e entrega.', 'pending', 0, NULL, '2026-04-15'),
('ea8', 'c1', 'u1', 'p3', 'client-external', 'Interacao com consultoria', 'Percepcao de parceria, confiabilidade e resultado na relacao com consultoria.', 'pending', 0, NULL, '2026-04-15')
ON DUPLICATE KEY UPDATE relationship_type = VALUES(relationship_type), status = VALUES(status);

INSERT INTO evaluation_cycle_participants (id, cycle_id, person_id, status) VALUES
('ecp1', 'c1', 'p1', 'active'),
('ecp2', 'c1', 'p2', 'active'),
('ecp3', 'c1', 'p4', 'active'),
('ecp4', 'c1', 'p3', 'active')
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO evaluation_cycle_raters (id, cycle_id, participant_person_id, rater_user_id, relationship_type, status) VALUES
('ecr1', 'c1', 'p2', 'u1', 'peer', 'completed'),
('ecr2', 'c1', 'p2', 'u4', 'manager', 'pending'),
('ecr3', 'c1', 'p1', 'u2', 'cross-functional', 'pending'),
('ecr4', 'c1', 'p1', 'u1', 'self', 'pending'),
('ecr5', 'c1', 'p4', 'u1', 'leader', 'pending'),
('ecr6', 'c1', 'p1', 'u1', 'company', 'pending'),
('ecr7', 'c1', 'p2', 'u1', 'client-internal', 'pending'),
('ecr8', 'c1', 'p3', 'u1', 'client-external', 'pending')
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO evaluation_feedback_requests (id, cycle_id, requester_user_id, reviewee_person_id, status, context_note, requested_at, decided_at, decided_by_user_id) VALUES
('fr1', 'c1', 'u1', 'p1', 'pending', 'Colaborei diretamente com tecnologia e consultoria na revisao de politicas e gostaria de receber feedback mais aderente ao ciclo.', '2026-03-16 11:00:00', NULL, NULL)
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO evaluation_feedback_request_items (id, request_id, provider_person_id, assignment_id) VALUES
('fri1', 'fr1', 'p2', NULL),
('fri2', 'fr1', 'p3', NULL)
ON DUPLICATE KEY UPDATE provider_person_id = VALUES(provider_person_id);

INSERT INTO evaluation_submissions (id, assignment_id, cycle_id, reviewer_user_id, reviewee_person_id, overall_score, strengths_note, development_note, reviewee_acknowledgement_status, reviewee_acknowledgement_note, reviewee_acknowledged_at, submitted_at) VALUES
('es1', 'ea1', 'c1', 'u1', 'p2', 4.17, 'Boa articulacao entre frentes e consistencia nas entregas.', 'Pode registrar riscos com ainda mais antecedencia.', NULL, NULL, NULL, '2026-03-12 12:00:00')
ON DUPLICATE KEY UPDATE overall_score = VALUES(overall_score);

INSERT INTO evaluation_answers (id, submission_id, question_id, score, evidence_note) VALUES
('ans1', 'es1', 'q1', 4, 'Cumpriu marcos importantes no periodo.'),
('ans2', 'es1', 'q2', 4, 'Manteve consistencia em sprint critica.'),
('ans3', 'es1', 'q3', 5, 'Apoiou integracao entre times com rapidez.'),
('ans4', 'es1', 'q4', 4, 'Compartilhou contexto tecnico com clareza.'),
('ans5', 'es1', 'q5', 4, 'Comunicou riscos sem ruido.'),
('ans6', 'es1', 'q6', 4, 'Relacao respeitosa e colaborativa com o time.')
ON DUPLICATE KEY UPDATE score = VALUES(score);

INSERT INTO incident_reports (id, title, category, classification, status, anonymity, reporter_label, responsible_area, assigned_person_id, assigned_to, created_at, description) VALUES
('i1', 'Conduta impropria em reuniao', 'Conduta Impropria', 'Conduta e Relacionamento', 'Em triagem', 'anonymous', 'Anonimo', 'Compliance', 'p6', 'RH Corporativo', '2026-03-10 10:00:00', 'Relato de comentario inadequado em reuniao de area.'),
('i2', 'Possivel conflito de interesse em fornecedor', 'Conflito de interesse', 'Integridade e Etica', 'Em apuracao', 'identified', 'Canal identificado', 'Compliance', 'p7', 'Compliance Corporativo', '2026-03-14 15:20:00', 'Sinalizacao de relacionamento proximo entre colaborador e fornecedor participante de cotacao.')
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO applause_entries (id, sender_person_id, receiver_person_id, category, impact, context_note, created_at, status) VALUES
('a1', 'p2', 'p1', 'Colaboracao', 'Destravou uma revisao critica de politica interna.', 'Apoiou a equipe em um prazo curto e organizou as evidencias.', '2026-03-11 09:30:00', 'Validado')
ON DUPLICATE KEY UPDATE impact = VALUES(impact);

INSERT INTO development_records (id, person_id, record_type, title, provider_name, completed_at, skill_signal, notes) VALUES
('d1', 'p3', 'Certificacao', 'SAP GRC Foundation', 'SAP Learning', '2026-02-05', 'Governanca de acessos', 'Certificacao vinculada ao projeto de compliance.'),
('d2', 'p4', 'MBA', 'MBA em Gestao de Tecnologia', 'FIA Business School', '2025-12-10', 'Lideranca, governanca e estrategia', 'Formacao utilizada para fortalecer rituais de acompanhamento e desenvolvimento da equipe.'),
('d3', 'p2', 'Graduacao', 'Sistemas de Informacao', 'Universidade Presbiteriana Mackenzie', '2024-12-18', 'Arquitetura, produto e analise de requisitos', 'Base academica aplicada nas frentes de tecnologia e integracao.'),
('d4', 'p1', 'Pos-graduacao', 'Compliance e Integridade Corporativa', 'FGV', '2025-08-22', 'Etica, controles internos e investigacao', 'Evolucao academica diretamente conectada ao papel atual no time de compliance.')
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO development_plans (id, person_id, cycle_id, competency_id, focus_title, action_text, due_date, expected_evidence, status, created_by_user_id, created_at, archived_at, progress_status, progress_note, progress_updated_at) VALUES
('dp1', 'p1', 'c1', 'cmp_communication', 'Fortalecer comunicacao executiva', 'Conduzir checkpoint quinzenal com a area e formalizar riscos-chave em ate 24h.', '2026-06-30', 'Ata dos checkpoints e melhoria percebida nas avaliacoes do proximo ciclo.', 'active', 'u6', '2026-03-20 09:00:00', NULL, 'not_started', '', NULL)
ON DUPLICATE KEY UPDATE focus_title = VALUES(focus_title);

INSERT INTO audit_logs (id, category, action_key, entity_type, entity_id, entity_label, actor_user_id, actor_name, actor_role_key, summary_text, detail_text, created_at) VALUES
('al1', 'cycle', 'created', 'cycle', 'c1', 'Ciclo Semestral 2026.1', 'u6', 'RH Demo Corporativo', 'hr', 'Ciclo criado: Ciclo Semestral 2026.1', '2026.1 · 6 assignments distribuidos', '2026-03-08 09:00:00'),
('al2', 'cycle', 'status_changed', 'cycle', 'c1', 'Ciclo Semestral 2026.1', 'u6', 'RH Demo Corporativo', 'hr', 'Status do ciclo atualizado: Ciclo Semestral 2026.1', 'Planejamento -> Liberado', '2026-03-09 10:30:00'),
('al3', 'incident', 'updated', 'incident', 'i2', 'Possivel conflito de interesse em fornecedor', 'u7', 'Compliance Demo', 'compliance', 'Caso atualizado: Possivel conflito de interesse em fornecedor', 'Em apuracao · Integridade e Etica · Responsavel: Compliance Corporativo', '2026-03-15 08:45:00'),
('al4', 'feedback_request', 'created', 'feedback_request', 'fr1', 'Colaborador Demo 01', 'u1', 'Colaborador Demo 01', 'employee', 'Solicitacao de feedback direto registrada', '2 fornecedores sugeridos · Ciclo c1', '2026-03-16 11:00:00'),
('al5', 'user', 'created', 'user', 'u7', 'Compliance Demo', 'u5', 'Admin Plataforma Demo', 'admin', 'Usuario criado para Compliance Demo', 'compliance · active · compliance@demo.local', '2026-03-05 14:20:00')
ON DUPLICATE KEY UPDATE summary_text = VALUES(summary_text);

SET FOREIGN_KEY_CHECKS = 1;
