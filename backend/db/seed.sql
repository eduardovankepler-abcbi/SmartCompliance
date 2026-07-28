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
('q_manager_01', 't_manager', 'delivery', 'Desempenho e Entregas', 'Avalie prazos, qualidade, resolucao de problemas e organizacao das entregas do colaborador.', 'delivery', 'Cumprimento de prazos', '1) O colaborador cumpre suas tarefas e entregas dentro dos prazos estabelecidos.', '', 'scale', NULL, 181, TRUE, FALSE),
('q_manager_02', 't_manager', 'delivery', 'Desempenho e Entregas', 'Avalie prazos, qualidade, resolucao de problemas e organizacao das entregas do colaborador.', 'delivery', 'Qualidade e precisao', '2) O colaborador realiza suas atividades com atencao a qualidade e precisao.', '', 'scale', NULL, 182, TRUE, FALSE),
('q_manager_03', 't_manager', 'delivery', 'Desempenho e Entregas', 'Avalie prazos, qualidade, resolucao de problemas e organizacao das entregas do colaborador.', 'delivery', 'Resolucao de problemas', '3) O colaborador lida de forma eficiente com problemas ou obstaculos que surgem no trabalho.', '', 'scale', NULL, 183, TRUE, FALSE),
('q_manager_04', 't_manager', 'delivery', 'Desempenho e Entregas', 'Avalie prazos, qualidade, resolucao de problemas e organizacao das entregas do colaborador.', 'delivery', 'Organizacao e resultados', '4) O colaborador organiza suas atividades de forma a otimizar tempo e resultados.', '', 'scale', NULL, 184, TRUE, FALSE),
('q_manager_05', 't_manager', 'knowledge', 'Conhecimento e Desenvolvimento', 'Considere conhecimento tecnico, aprendizado, aplicacao pratica e abertura a feedbacks.', 'knowledge', 'Conhecimentos da funcao', '5) O colaborador possui os conhecimentos necessarios para desempenhar suas atividades com seguranca e qualidade.', '', 'scale', NULL, 185, TRUE, FALSE),
('q_manager_06', 't_manager', 'knowledge', 'Conhecimento e Desenvolvimento', 'Considere conhecimento tecnico, aprendizado, aplicacao pratica e abertura a feedbacks.', 'development', 'Aprendizado continuo', '6) O colaborador busca aprender constantemente e desenvolver novas habilidades.', '', 'scale', NULL, 186, TRUE, FALSE),
('q_manager_07', 't_manager', 'knowledge', 'Conhecimento e Desenvolvimento', 'Considere conhecimento tecnico, aprendizado, aplicacao pratica e abertura a feedbacks.', 'development', 'Aplicacao de aprendizados', '7) O colaborador aplica novos conhecimentos e aprendizados para melhorar seu desempenho profissional.', '', 'scale', NULL, 187, TRUE, FALSE),
('q_manager_08', 't_manager', 'knowledge', 'Conhecimento e Desenvolvimento', 'Considere conhecimento tecnico, aprendizado, aplicacao pratica e abertura a feedbacks.', 'development', 'Abertura a feedbacks', '8) O colaborador demonstra abertura para receber feedbacks e utiliza-los para aprimorar seu desempenho.', '', 'scale', NULL, 188, TRUE, FALSE),
('q_manager_09', 't_manager', 'teamwork', 'Trabalho em Equipe e Colaboracao', 'Avalie colaboracao, compartilhamento de conhecimento, comunicacao e relacionamento profissional.', 'collaboration', 'Colaboracao com a equipe', '9) O colaborador colabora de forma produtiva com os colegas de equipe.', '', 'scale', NULL, 189, TRUE, FALSE),
('q_manager_10', 't_manager', 'teamwork', 'Trabalho em Equipe e Colaboracao', 'Avalie colaboracao, compartilhamento de conhecimento, comunicacao e relacionamento profissional.', 'collaboration', 'Compartilhamento de conhecimentos', '10) O colaborador compartilha conhecimentos e experiencias que contribuem para o desempenho da equipe.', '', 'scale', NULL, 190, TRUE, FALSE),
('q_manager_11', 't_manager', 'teamwork', 'Trabalho em Equipe e Colaboracao', 'Avalie colaboracao, compartilhamento de conhecimento, comunicacao e relacionamento profissional.', 'communication', 'Comunicacao profissional', '11) O colaborador mantem uma comunicacao clara, respeitosa e profissional com colegas e stakeholders.', '', 'scale', NULL, 191, TRUE, FALSE),
('q_manager_12', 't_manager', 'teamwork', 'Trabalho em Equipe e Colaboracao', 'Avalie colaboracao, compartilhamento de conhecimento, comunicacao e relacionamento profissional.', 'interpersonal', 'Conflitos e divergencias', '12) O colaborador lida de forma construtiva com conflitos ou divergencias de opiniao.', '', 'scale', NULL, 192, TRUE, FALSE),
('q_manager_13', 't_manager', 'commitment', 'Comprometimento e Responsabilidade', 'Considere comprometimento, responsabilidade, conformidade e postura diante de desafios.', 'commitment', 'Comprometimento com objetivos', '13) O colaborador demonstra comprometimento com os objetivos da equipe e da empresa.', '', 'scale', NULL, 193, TRUE, FALSE),
('q_manager_14', 't_manager', 'commitment', 'Comprometimento e Responsabilidade', 'Considere comprometimento, responsabilidade, conformidade e postura diante de desafios.', 'responsibility', 'Responsabilidade por resultados', '14) O colaborador assume responsabilidade por suas atividades e resultados.', '', 'scale', NULL, 194, TRUE, FALSE),
('q_manager_15', 't_manager', 'commitment', 'Comprometimento e Responsabilidade', 'Considere comprometimento, responsabilidade, conformidade e postura diante de desafios.', 'responsibility', 'Conformidade com regras', '15) O colaborador cumpre regras, normas e procedimentos da empresa de forma consistente.', '', 'scale', NULL, 195, TRUE, FALSE),
('q_manager_16', 't_manager', 'commitment', 'Comprometimento e Responsabilidade', 'Considere comprometimento, responsabilidade, conformidade e postura diante de desafios.', 'adaptability', 'Postura diante de mudancas', '16) O colaborador mantem uma postura positiva e produtiva diante de mudancas, desafios e situacoes inesperadas.', '', 'scale', NULL, 196, TRUE, FALSE),
('q_manager_17', 't_manager', 'growth', 'Potencial e Crescimento', 'Considere disposicao para aprender, evolucao profissional, iniciativa e autonomia.', 'growth', 'Disposicao para ampliar contribuicao', '17) O colaborador demonstra disposicao para aprender novas atividades e ampliar sua contribuicao para a equipe.', '', 'scale', NULL, 197, TRUE, FALSE),
('q_manager_18', 't_manager', 'growth', 'Potencial e Crescimento', 'Considere disposicao para aprender, evolucao profissional, iniciativa e autonomia.', 'growth', 'Busca de evolucao', '18) O colaborador busca oportunidades para aprimorar seu desempenho e evolucao profissional.', '', 'scale', NULL, 198, TRUE, FALSE),
('q_manager_19', 't_manager', 'growth', 'Potencial e Crescimento', 'Considere disposicao para aprender, evolucao profissional, iniciativa e autonomia.', 'initiative', 'Iniciativa para melhorias', '19) O colaborador demonstra iniciativa para propor melhorias ou solucoes para seu trabalho, equipe ou processos.', '', 'scale', NULL, 199, TRUE, FALSE),
('q_manager_20', 't_manager', 'growth', 'Potencial e Crescimento', 'Considere disposicao para aprender, evolucao profissional, iniciativa e autonomia.', 'autonomy', 'Autonomia com apoio', '20) O colaborador atua de forma autonoma em suas atividades, buscando apoio quando necessario.', '', 'scale', NULL, 200, TRUE, FALSE),
('q_manager_21', 't_manager', 'final', 'Consideracoes Finais', 'Espaco para resposta dissertativa sobre desenvolvimento e evolucao profissional.', 'final-comments', 'Pontos fortes e desenvolvimento', 'Descreva os principais pontos fortes do colaborador, oportunidades de desenvolvimento e quaisquer observacoes relevantes que possam contribuir para sua evolucao profissional.', '', 'text', NULL, 201, TRUE, FALSE)
ON DUPLICATE KEY UPDATE prompt_text = VALUES(prompt_text), question_type = VALUES(question_type);

INSERT INTO evaluation_questions (
  id, template_id, section_key, section_title, section_description, dimension_key, dimension_title,
  prompt_text, helper_text, question_type, options_json, sort_order, is_required, collect_evidence_on_extreme
) VALUES
('q_cross_01', 't_cross', 'cross-functional-visibility', 'Colega de Outro Setor', 'Mapeia o quanto colaboradores de outras areas conhecem o trabalho do avaliado.', 'activity-awareness', 'Conhecimento das atividades', 'Voce sabe quais sao as principais atividades e responsabilidades do colaborador avaliado?', '', 'scale', NULL, 231, TRUE, FALSE),
('q_cross_02', 't_cross', 'cross-functional-visibility', 'Colega de Outro Setor', 'Mapeia o quanto colaboradores de outras areas conhecem o trabalho do avaliado.', 'interaction', 'Interacao direta ou indireta', 'Voce ja teve algum tipo de interacao direta ou indireta com o colaborador avaliado?', '', 'scale', NULL, 232, TRUE, FALSE),
('q_cross_03', 't_cross', 'cross-functional-visibility', 'Colega de Outro Setor', 'Mapeia o quanto colaboradores de outras areas conhecem o trabalho do avaliado.', 'deliverables-contact', 'Contato com entregas', 'Voce ja teve contato com entregas ou materiais desenvolvidos pelo colaborador avaliado?', '', 'scale', NULL, 233, TRUE, FALSE),
('q_cross_04', 't_cross', 'cross-functional-visibility', 'Colega de Outro Setor', 'Mapeia o quanto colaboradores de outras areas conhecem o trabalho do avaliado.', 'cross-area-impact', 'Impacto em outras areas', 'Com base no que voce conhece, voce considera que o trabalho do colaborador avaliado tem impacto em outras areas da empresa?', '', 'scale', NULL, 234, TRUE, FALSE),
('q_cross_05', 't_cross', 'cross-functional-visibility', 'Colega de Outro Setor', 'Mapeia o quanto colaboradores de outras areas conhecem o trabalho do avaliado.', 'evaluation-visibility', 'Visibilidade para avaliar', 'De forma geral, voce sente que tem visibilidade suficiente para avaliar o trabalho do colaborador avaliado?', '', 'scale', NULL, 235, TRUE, FALSE)
ON DUPLICATE KEY UPDATE prompt_text = VALUES(prompt_text), question_type = VALUES(question_type);

INSERT INTO evaluation_questions (
  id, template_id, section_key, section_title, section_description, dimension_key, dimension_title,
  prompt_text, helper_text, question_type, options_json, sort_order, is_required, collect_evidence_on_extreme
) VALUES
('q_leader_01', 't1', 'support', 'Apoio e Orientacao', 'Avalie disponibilidade, direcionamento, acompanhamento e suporte da lideranca.', 'support', 'Disponibilidade para apoio', '1) Meu lider esta disponivel para orientar e apoiar quando preciso.', '', 'scale', NULL, 201, TRUE, FALSE),
('q_leader_02', 't1', 'communication', 'Comunicacao e Escuta', 'Considere clareza, respeito, abertura para ouvir e qualidade das interacoes.', 'communication', 'Clareza de alinhamentos', '2) Meu lider transmite informacoes, prioridades e alinhamentos de forma clara.', '', 'scale', NULL, 202, TRUE, FALSE),
('q_leader_03', 't1', 'communication', 'Comunicacao e Escuta', 'Considere clareza, respeito, abertura para ouvir e qualidade das interacoes.', 'listening', 'Abertura para ouvir', '3) Meu lider demonstra abertura para ouvir duvidas, opinioes e sugestoes.', '', 'scale', NULL, 203, TRUE, FALSE),
('q_leader_04', 't1', 'communication', 'Comunicacao e Escuta', 'Considere clareza, respeito, abertura para ouvir e qualidade das interacoes.', 'communication', 'Comunicacao respeitosa', '4) Meu lider mantem uma comunicacao respeitosa e profissional no dia a dia.', '', 'scale', NULL, 204, TRUE, FALSE),
('q_leader_05', 't1', 'recognition', 'Reconhecimento e Desenvolvimento', 'Avalie reconhecimento, desenvolvimento profissional e confianca na lideranca.', 'recognition', 'Reconhecimento de entregas', '5) Meu lider valoriza minhas entregas e contribuicoes por meio de feedbacks, elogios ou outras formas de reconhecimento.', '', 'scale', NULL, 205, TRUE, FALSE),
('q_leader_06', 't1', 'support', 'Apoio e Orientacao', 'Avalie disponibilidade, direcionamento, acompanhamento e suporte da lideranca.', 'direction', 'Direcionamento na execucao', '6) Quando necessario, meu lider fornece direcionamento para ajudar na execucao das atividades.', '', 'scale', NULL, 206, TRUE, FALSE),
('q_leader_07', 't1', 'support', 'Apoio e Orientacao', 'Avalie disponibilidade, direcionamento, acompanhamento e suporte da lideranca.', 'follow-up', 'Acompanhamento do trabalho', '7) Meu lider demonstra que acompanha e considera o trabalho que realizo no dia a dia.', '', 'scale', NULL, 207, TRUE, FALSE),
('q_leader_08', 't1', 'support', 'Apoio e Orientacao', 'Avalie disponibilidade, direcionamento, acompanhamento e suporte da lideranca.', 'feedback', 'Orientacoes e correcoes', '8) Recebo orientacoes e correcoes ao longo do trabalho, permitindo ajustes e aprimoramento das minhas atividades.', '', 'scale', NULL, 208, TRUE, FALSE),
('q_leader_09', 't1', 'environment', 'Ambiente e Tomada de Decisao', 'Considere ambiente de trabalho, colaboracao, decisoes e equilibrio diante de desafios.', 'environment', 'Ambiente respeitoso', '9) Meu lider contribui para manter um ambiente de trabalho respeitoso e colaborativo.', '', 'scale', NULL, 209, TRUE, FALSE),
('q_leader_10', 't1', 'environment', 'Ambiente e Tomada de Decisao', 'Considere ambiente de trabalho, colaboracao, decisoes e equilibrio diante de desafios.', 'collaboration', 'Interacoes profissionais', '10) Meu lider promove alinhamentos e interacoes profissionais pautados no respeito, na colaboracao e na boa convivencia entre a equipe.', '', 'scale', NULL, 210, TRUE, FALSE),
('q_leader_11', 't1', 'environment', 'Ambiente e Tomada de Decisao', 'Considere ambiente de trabalho, colaboracao, decisoes e equilibrio diante de desafios.', 'decision', 'Decisoes coerentes', '11) Meu lider toma decisoes de forma coerente e alinhada as necessidades da equipe.', '', 'scale', NULL, 211, TRUE, FALSE),
('q_leader_12', 't1', 'environment', 'Ambiente e Tomada de Decisao', 'Considere ambiente de trabalho, colaboracao, decisoes e equilibrio diante de desafios.', 'balance', 'Equilibrio em desafios', '12) Meu lider demonstra equilibrio ao lidar com desafios, mudancas e situacoes inesperadas.', '', 'scale', NULL, 212, TRUE, FALSE),
('q_leader_13', 't1', 'environment', 'Ambiente e Tomada de Decisao', 'Considere ambiente de trabalho, colaboracao, decisoes e equilibrio diante de desafios.', 'accessibility', 'Acessibilidade presencial/remota', '13) Meu lider esta acessivel para apoiar a equipe, tanto presencialmente quanto em home office, quando aplicavel.', '', 'scale', NULL, 213, TRUE, FALSE),
('q_leader_14', 't1', 'recognition', 'Reconhecimento e Desenvolvimento', 'Avalie reconhecimento, desenvolvimento profissional e confianca na lideranca.', 'development', 'Desenvolvimento profissional', '14) Meu lider cria oportunidades para que eu desenvolva novos conhecimentos e habilidades profissionais.', '', 'scale', NULL, 214, TRUE, FALSE),
('q_leader_15', 't1', 'recognition', 'Reconhecimento e Desenvolvimento', 'Avalie reconhecimento, desenvolvimento profissional e confianca na lideranca.', 'trust', 'Confianca na lideranca', '15) De forma geral, sinto que posso contar com meu lider quando necessario.', '', 'scale', NULL, 215, TRUE, FALSE),
('q_leader_16', 't1', 'final', 'Consideracoes Finais', 'Espaco para resposta dissertativa sobre lideranca.', 'final-comments', 'Sugestoes e observacoes', 'Escreva aqui suas sugestoes, ideias de melhoria, observacoes sobre processos, comunicacao, recursos, desenvolvimento da equipe, lideranca ou qualquer outro ponto relevante para aprimorar seu trabalho, sua equipe ou a empresa.', '', 'text', NULL, 216, TRUE, FALSE)
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
