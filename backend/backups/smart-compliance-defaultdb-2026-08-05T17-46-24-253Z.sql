-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: mysql-15206814-eduardovankepler-smart-compliance.k.aivencloud.com    Database: defaultdb
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '3fce1eab-584f-11f1-9654-3e98575f5aed:1-371,
5d807894-336e-11f1-a127-867a0ddfca1c:1-1118,
72b46efc-7515-11f1-b6da-2a4ec0f2190a:1-175,
d812c914-3296-11f1-8180-56b17466a430:1-73';

--
-- Table structure for table `applause_entries`
--

DROP TABLE IF EXISTS `applause_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `applause_entries` (
  `id` varchar(36) NOT NULL,
  `sender_person_id` varchar(36) NOT NULL,
  `receiver_person_id` varchar(36) NOT NULL,
  `category` varchar(80) NOT NULL,
  `impact` varchar(160) NOT NULL,
  `context_note` text NOT NULL,
  `created_at` datetime NOT NULL,
  `status` varchar(40) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sender_person_id` (`sender_person_id`),
  KEY `receiver_person_id` (`receiver_person_id`),
  CONSTRAINT `applause_entries_ibfk_1` FOREIGN KEY (`sender_person_id`) REFERENCES `people` (`id`),
  CONSTRAINT `applause_entries_ibfk_2` FOREIGN KEY (`receiver_person_id`) REFERENCES `people` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `applause_entries`
--

LOCK TABLES `applause_entries` WRITE;
/*!40000 ALTER TABLE `applause_entries` DISABLE KEYS */;
INSERT INTO `applause_entries` VALUES ('a1','p2','p1','Colaboracao','Destravou uma revisao critica de politica interna.','Apoiou a equipe em um prazo curto e organizou as evidencias.','2026-03-11 09:30:00','Validado'),('applause_qnr4e6m1','p5','p1','Colaboracao','Validacao remota de homologacao Angular 8.1','[Contexto: Projeto] [AUDIT-8.1-HOMOLOG-1784645775199] reconhecimento criado para validar persistencia MySQL e fluxo Angular.','2026-07-21 14:56:22','Arquivado');
/*!40000 ALTER TABLE `applause_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `areas`
--

DROP TABLE IF EXISTS `areas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `areas` (
  `id` varchar(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `manager_person_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `manager_person_id` (`manager_person_id`),
  CONSTRAINT `areas_ibfk_1` FOREIGN KEY (`manager_person_id`) REFERENCES `people` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `areas`
--

LOCK TABLES `areas` WRITE;
/*!40000 ALTER TABLE `areas` DISABLE KEYS */;
INSERT INTO `areas` VALUES ('a1','Compliance','p7'),('a2','Tecnologia','p4'),('a3','Consultoria','p4'),('a4','Administracao','p5'),('a5','Gente e Gestao','p6');
/*!40000 ALTER TABLE `areas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` varchar(36) NOT NULL,
  `category` varchar(60) NOT NULL,
  `action_key` varchar(60) NOT NULL,
  `entity_type` varchar(60) NOT NULL,
  `entity_id` varchar(36) NOT NULL,
  `entity_label` varchar(180) NOT NULL,
  `actor_user_id` varchar(36) DEFAULT NULL,
  `actor_name` varchar(160) NOT NULL,
  `actor_role_key` varchar(40) NOT NULL,
  `summary_text` text NOT NULL,
  `detail_text` text NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `actor_user_id` (`actor_user_id`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES ('al1','cycle','created','cycle','c1','Ciclo Semestral 2026.1','u6','RH Demo Corporativo','hr','Ciclo criado: Ciclo Semestral 2026.1','2026.1 · 6 assignments distribuidos','2026-03-08 09:00:00'),('al2','cycle','status_changed','cycle','c1','Ciclo Semestral 2026.1','u6','RH Demo Corporativo','hr','Status do ciclo atualizado: Ciclo Semestral 2026.1','Planejamento -> Liberado','2026-03-09 10:30:00'),('al3','incident','updated','incident','i2','Possivel conflito de interesse em fornecedor','u7','Compliance Demo','compliance','Caso atualizado: Possivel conflito de interesse em fornecedor','Em apuracao · Integridade e Etica · Responsavel: Compliance Corporativo','2026-03-15 08:45:00'),('al4','feedback_request','created','feedback_request','fr1','Colaborador Demo 01','u1','Colaborador Demo 01','employee','Solicitacao de feedback direto registrada','2 fornecedores sugeridos · Ciclo c1','2026-03-16 11:00:00'),('al5','user','created','user','u7','Compliance Demo','u5','Admin Plataforma Demo','admin','Usuario criado para Compliance Demo','compliance · active · compliance@demo.local','2026-03-05 14:20:00'),('audit_09pysua4','cycle','evaluation_question_deleted','evaluation_question','q_self_13','13) Demonstro comprometimento com os objetivos da equipe e da empresa.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','self','2026-06-15 12:26:38'),('audit_0babj24m','cycle','evaluation_question_deleted','evaluation_question','q_self_10','10) Compartilho conhecimentos e experiencias que ajudam o desempenho da equipe.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','self','2026-06-15 12:26:15'),('audit_0ihxjak3','user','updated','user','user_w3w2j8jk','Homologacao Onda2 20260804114937','u5','Admin Plataforma Demo','admin','Acesso atualizado para Homologacao Onda2 20260804114937','compliance · inactive · homolog.onda2.20260804114937@empresa.local','2026-08-04 15:00:10'),('audit_0u6rzy9o','user','login_success','user','u1','colaborador1@demo.local','u1','Colaborador Demo 01','employee','Login realizado','IP: 10.24.102.100','2026-08-05 16:54:36'),('audit_0x390e08','incident','created','incident','incident_4t9y5xio','HOMOLOGACAO ONDA 2 EVIDENCIA 2026-08-04T15:19:31.987Z','u5','Admin Plataforma Demo','admin','Relato registrado: HOMOLOGACAO ONDA 2 EVIDENCIA 2026-08-04T15:19:31.987Z','SC-20260804-9Y5XIO · Conduta e Relacionamento · Area: Compliance · Responsavel inicial: Compliance Demo','2026-08-04 15:19:32'),('audit_1ak1dy7w','user','login_success','user','u5','admin@demo.local','u5','Admin Plataforma Demo','admin','Login realizado','IP: 10.24.102.100','2026-08-05 16:55:05'),('audit_1venx4hw','cycle','evaluation_question_deleted','evaluation_question','q_self_08','8) Estou aberto a feedbacks e procuro utiliza-los para melhorar meu desempenho.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','self','2026-06-15 12:25:50'),('audit_1vz2cjxv','registry','created','person','person_0ahjeupd','Homologacao Onda2 20260804114937','u5','Admin Plataforma Demo','admin','Pessoa criada: Homologacao Onda2 20260804114937','Analista de Compliance · Compliance · Homologacao · Remoto · Interno · Gestor Nao definido · Sem lideranca de area','2026-08-04 14:49:39'),('audit_2d3kh17b','cycle','evaluation_question_deleted','evaluation_question','q_self_05','5) Tenho dominio adequado dos conhecimentos tecnicos necessarios para meu trabalho.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','self','2026-06-15 12:25:11'),('audit_2yu4kuta','user','login_success','user','u4','gestor@demo.local','u4','Gestor Demo Tecnologia','manager','Login realizado','IP: ::ffff:127.0.0.1','2026-08-05 15:07:28'),('audit_3fq0hvhn','cycle','evaluation_question_deleted','evaluation_question','q_self_11','11) Mantenho uma comunicacao clara e respeitosa com colegas e stakeholders.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','self','2026-06-15 12:26:21'),('audit_3kbeubvy','cycle','evaluation_question_deleted','evaluation_question','question_mm6wd9aa','Pergunta revisada pelo RH para regressao.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','self','2026-08-04 17:31:47'),('audit_3rpjf71a','cycle','evaluation_question_updated','evaluation_question','question_waqkzcxq','Pergunta revisada pelo RH para regressao.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao atualizada','self · multi-select','2026-08-04 14:38:43'),('audit_46f2zzbg','user','login_success','user','user_w3w2j8jk','homolog.onda2.20260804114937@empresa.local','user_w3w2j8jk','Homologacao Onda2 20260804114937','compliance','Login realizado','IP: 10.28.138.213','2026-08-04 14:49:40'),('audit_4qxx55fu','registry','created','person','person_a1lkrjk1','Subordinado Para Perfil Elevado','u4','Gestor Demo Tecnologia','manager','Pessoa criada: Subordinado Para Perfil Elevado','Analista do Time · Tecnologia · Sao Paulo · Hibrido · Interno · Gestor Gestor Demo Tecnologia · Sem lideranca de area','2026-08-04 17:32:00'),('audit_4rpxsvh0','cycle','evaluation_question_deleted','evaluation_question','q3','Quao satisfeito voce ficou com a colaboracao com colegas e outras areas?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','collaboration','2026-06-10 17:41:10'),('audit_54q1iu4r','cycle','evaluation_question_deleted','evaluation_question','q4','Quao satisfeito voce ficou com a disposicao desta pessoa em compartilhar conhecimento e apoiar o time?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','collaboration','2026-06-15 11:59:31'),('audit_571ylo61','user','login_success','user','u5','admin@demo.local','u5','Admin Plataforma Demo','admin','Login realizado','IP: 10.30.24.3','2026-08-04 13:54:34'),('audit_59easb4n','cycle','evaluation_question_created','evaluation_question','question_y7rw7b1w','Avaliação por Colaborador de Outro Setor – não entra na pontuação','u6','RH Demo Corporativo','hr','Pergunta de avaliacao criada','collaboration · multi-select','2026-06-10 13:34:59'),('audit_5f6u0a01','user','password_changed','user','user_zaj0pxsz','homolog.onda1.1785851695@empresa.local','user_zaj0pxsz','Homologacao Onda 1 1785851695','employee','Senha alterada pelo proprio usuario','Troca de senha autenticada','2026-08-04 13:55:27'),('audit_5iyfoc7w','cycle','evaluation_question_deleted','evaluation_question','q_self_09','9) Colaboro de forma produtiva com meus colegas de equipe.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','self','2026-06-15 12:26:08'),('audit_5lbj7u2v','cycle','evaluation_question_deleted','evaluation_question','q2','Quao satisfeito voce ficou com a consistencia e a responsabilidade demonstradas no periodo?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','collaboration','2026-06-15 11:59:58'),('audit_5nehcmj3','cycle','evaluation_question_deleted','evaluation_question','question_waqkzcxq','Pergunta revisada pelo RH para regressao.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','self','2026-08-04 14:38:43'),('audit_5nez29qo','user','updated','user','user_nav4x9yo','Homologacao Onda2 Full 1785857987057','u5','Admin Plataforma Demo','admin','Acesso atualizado para Homologacao Onda2 Full 1785857987057','compliance · inactive · homolog.onda2.full.1785857987057@empresa.local','2026-08-04 15:40:10'),('audit_5qax3vlx','cycle','evaluation_question_created','evaluation_question','question_1bh8202o','Como você avalia a capacidade do colaborador de considerar feedbacks e aplicá-los em suas atividades quando necessário?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao criada','collaboration · scale','2026-06-10 17:55:19'),('audit_5w2ycwb8','cycle','evaluation_question_updated','evaluation_question','question_mm6wd9aa','Pergunta revisada pelo RH para regressao.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao atualizada','self · multi-select','2026-08-04 17:31:46'),('audit_5zgmvygl','cycle','evaluation_question_deleted','evaluation_question','q_peer_same_area_07','O colaborador avaliado contribui positivamente para o desempenho e o clima do setor?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','peer-same-area','2026-06-10 17:40:20'),('audit_60ges094','cycle','evaluation_question_deleted','evaluation_question','q_self_17','17) Tenho interesse em assumir novas responsabilidades e desafios profissionais.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','self','2026-06-15 12:27:18'),('audit_6hpmdzev','user','login_success','user','u5','admin@demo.local','u5','Admin Plataforma Demo','admin','Login realizado','IP: 10.28.138.213','2026-08-05 16:58:56'),('audit_6hz6a30e','user','login_success','user','u1','colaborador1@demo.local','u1','Colaborador Demo 01','employee','Login realizado','IP: ::ffff:127.0.0.1','2026-08-05 15:09:56'),('audit_6yq3r61f','user','login_success','user','u1','colaborador1@demo.local','u1','Colaborador Demo 01','employee','Login realizado','IP: 10.30.24.3','2026-08-04 17:19:05'),('audit_72cullwk','user','login_success','user','u5','admin@demo.local','u5','Admin Plataforma Demo','admin','Login realizado','IP: ::ffff:127.0.0.1','2026-08-05 15:09:55'),('audit_760ud8wh','cycle','evaluation_question_deleted','evaluation_question','q_self_16','16) Me esforco para superar desafios e atingir metas mesmo diante de dificuldades.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','self','2026-06-15 12:27:08'),('audit_7p1e4nb6','user','login_success','user','u7','compliance@demo.local','u7','Compliance Demo','compliance','Login realizado','IP: ::ffff:127.0.0.1','2026-08-05 15:07:29'),('audit_7umzkkop','user','login_success','user','u1','colaborador1@demo.local','u1','Colaborador Demo 01','employee','Login realizado','IP: ::ffff:127.0.0.1','2026-08-05 15:07:28'),('audit_80ewyaz3','user','login_success','user','u4','gestor@demo.local','u4','Gestor Demo Tecnologia','manager','Login realizado','IP: ::ffff:127.0.0.1','2026-08-04 14:38:40'),('audit_8ezmep9f','registry','created','person','person_nwtk6wqf','Homologacao Onda 1 1785851673','u5','Admin Plataforma Demo','admin','Pessoa criada: Homologacao Onda 1 1785851673','Usuario de Homologacao · Tecnologia · Sao Paulo · Hibrido · Interno · Gestor Nao definido · Sem lideranca de area','2026-08-04 13:54:35'),('audit_8qlh7wbg','incident','updated','incident','incident_g4t1tckp','HOMOLOGACAO FUNCIONAL ONDA 2 1785857987057','user_nav4x9yo','Homologacao Onda2 Full 1785857987057','compliance','Caso atualizado: HOMOLOGACAO FUNCIONAL ONDA 2 1785857987057','SC-20260804-T1TCKP · Em apuracao · Conduta e Relacionamento · Area: Administracao · Responsavel: Admin Plataforma Demo','2026-08-04 15:40:00'),('audit_8y1frbmo','user','password_changed','user','u1','colaborador1@demo.local','u1','Colaborador Demo 01','employee','Senha alterada pelo proprio usuario','Troca de senha autenticada','2026-08-05 17:02:54'),('audit_90217zer','user','login_success','user','u2','colaborador2@demo.local','u2','Colaborador Demo 02','employee','Login realizado','IP: 10.24.102.100','2026-08-05 17:31:35'),('audit_93r3dr4n','cycle','evaluation_question_created','evaluation_question','question_ussbusoa','Procuro organizar minhas tarefas para otimizar resultados e tempo.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao criada','self · multi-select','2026-06-15 12:41:54'),('audit_9z7a7iu6','cycle','evaluation_question_created','evaluation_question','question_sghnbcaq','Minhas atividades são realizadas com atenção à qualidade e precisão.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao criada','self · multi-select','2026-06-15 12:33:18'),('audit_ad8bqjze','user','login_success','user','u5','admin@demo.local','u5','Admin Plataforma Demo','admin','Login realizado','IP: 10.30.24.3','2026-08-05 15:07:08'),('audit_ajgjnkt9','cycle','evaluation_question_created','evaluation_question','question_8i1hprbk','Como você avalia o relacionamento profissional do colaborador com os demais membros da equipe?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao criada','collaboration · multi-select','2026-06-10 18:04:36'),('audit_ajije4a9','user','login_success','user','u1','colaborador1@demo.local','u1','Colaborador Demo 01','employee','Login realizado','IP: 10.28.138.213','2026-08-04 15:40:08'),('audit_akjop1xa','user','password_changed','user','user_tmtq1fjp','homolog.onda2.full.1785857918474@empresa.local','user_tmtq1fjp','Homologacao Onda2 Full 1785857918474','compliance','Senha alterada pelo proprio usuario','Troca de senha autenticada','2026-08-04 15:38:41'),('audit_awkc5ahx','registry','created','person','person_u8gfuu37','Homologacao Onda2 Full 1785857918474','u5','Admin Plataforma Demo','admin','Pessoa criada: Homologacao Onda2 Full 1785857918474','Analista de Compliance · Compliance · Homologacao · Remoto · Interno · Gestor Nao definido · Sem lideranca de area','2026-08-04 15:38:39'),('audit_b14y7e09','user','password_changed','user','u5','admin@demo.local','u5','Admin Plataforma Demo','admin','Senha alterada pelo proprio usuario','Troca de senha autenticada','2026-08-05 16:58:57'),('audit_b4ul9hw7','cycle','evaluation_question_deleted','evaluation_question','q_self_20','20) Sinto-me capaz de lidar de forma autonoma com minhas atividades e decisoes diarias.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','self','2026-06-15 12:30:50'),('audit_b9fveeee','user','login_success','user','u5','admin@demo.local','u5','Admin Plataforma Demo','admin','Login realizado','IP: 10.30.24.3','2026-08-05 16:59:02'),('audit_be4h4wcn','user','created','user','user_tmtq1fjp','Homologacao Onda2 Full 1785857918474','u5','Admin Plataforma Demo','admin','Usuario criado para Homologacao Onda2 Full 1785857918474','compliance · active · homolog.onda2.full.1785857918474@empresa.local · senha redefinida','2026-08-04 15:38:40'),('audit_br2seaul','cycle','evaluation_question_created','evaluation_question','question_rmxsq310','Com base no que você conhece, você considera que o trabalho do colaborador avaliado tem impacto em outras áreas da empresa?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao criada','collaboration · multi-select','2026-06-10 13:51:36'),('audit_c0xg1acp','registry','created','person','person_ils1rj89','Subordinado Criado Pelo Gestor','u4','Gestor Demo Tecnologia','manager','Pessoa criada: Subordinado Criado Pelo Gestor','Analista do Time · Tecnologia · Sao Paulo · Hibrido · Interno · Gestor Gestor Demo Tecnologia · Sem lideranca de area','2026-08-04 17:31:55'),('audit_cosxdr7f','cycle','evaluation_question_created','evaluation_question','question_ue6k2ysa','Como você avalia a qualidade geral das entregas do colaborador com base no que você acompanha?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao criada','collaboration · multi-select','2026-06-10 17:51:44'),('audit_cox1zkzq','user','login_success','user','user_m8e0jit6','subordinado.gestor@empresa.local','user_m8e0jit6','Subordinado Criado Pelo Gestor','employee','Login realizado','IP: ::ffff:127.0.0.1','2026-08-04 17:31:57'),('audit_cq36ozrq','user','created','user','user_zaj0pxsz','Homologacao Onda 1 1785851695','u5','Admin Plataforma Demo','admin','Usuario criado para Homologacao Onda 1 1785851695','employee · active · homolog.onda1.1785851695@empresa.local · senha redefinida','2026-08-04 13:54:57'),('audit_cvwn8wlt','user','login_success','user','u5','admin@demo.local','u5','Admin Plataforma Demo','admin','Login realizado','IP: 10.24.102.100','2026-08-04 15:19:32'),('audit_d2oa904n','cycle','evaluation_question_deleted','evaluation_question','q3','Quao satisfeito voce ficou com a colaboracao com colegas e outras areas?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','collaboration','2026-06-15 11:59:52'),('audit_d4h45i09','cycle','evaluation_question_deleted','evaluation_question','q5','Quao satisfeito voce ficou com a clareza de comunicacao sobre prioridades, riscos e proximos passos?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','collaboration','2026-06-10 17:41:20'),('audit_dg9ob90e','user','updated','user','user_tmtq1fjp','Homologacao Onda2 Full 1785857918474','u5','Admin Plataforma Demo','admin','Acesso atualizado para Homologacao Onda2 Full 1785857918474','compliance · inactive · homolog.onda2.full.1785857918474@empresa.local','2026-08-04 15:38:58'),('audit_dj03zls5','cycle','evaluation_question_created','evaluation_question','question_4cydwcpp','Como você avalia a disponibilidade do colaborador para ajudar colegas e compartilhar conhecimento?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao criada','collaboration · multi-select','2026-06-10 17:49:44'),('audit_dm09x9tp','user','login_success','user','u5','admin@demo.local','u5','Admin Plataforma Demo','admin','Login realizado','IP: 10.24.102.100','2026-08-04 15:00:10'),('audit_e3j0p8br','user','login_success','user','u1','colaborador1@demo.local','u1','Colaborador Demo 01','employee','Login realizado','IP: 10.28.138.213','2026-08-05 17:02:53'),('audit_e46lvp1t','incident','evidence_added','incident','incident_g4t1tckp','HOMOLOGACAO FUNCIONAL ONDA 2 1785857987057','user_nav4x9yo','Homologacao Onda2 Full 1785857987057','compliance','Evidencia anexada ao caso: HOMOLOGACAO FUNCIONAL ONDA 2 1785857987057','SC-20260804-T1TCKP · homologacao-onda2-evidencia-1785857987057.txt · text/plain · 39 bytes','2026-08-04 15:39:56'),('audit_ebd4k0ko','cycle','evaluation_question_created','evaluation_question','question_26044vx6','Possuo os conhecimentos necessários para desempenhar minhas atividades com segurança e qualidade.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao criada','self · multi-select','2026-06-15 12:45:30'),('audit_eepkkv7h','user','login_success','user','user_nav4x9yo','homolog.onda2.full.1785857987057@empresa.local','user_nav4x9yo','Homologacao Onda2 Full 1785857987057','compliance','Login realizado','IP: 10.30.24.3','2026-08-04 15:39:51'),('audit_efvpb243','cycle','evaluation_question_updated','evaluation_question','question_sghnbcaq','Minhas atividades são realizadas com atenção à qualidade e precisão.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao atualizada','self · multi-select','2026-06-15 12:34:03'),('audit_epgkewp5','user','login_success','user','user_w3w2j8jk','homolog.onda2.20260804114937@empresa.local','user_w3w2j8jk','Homologacao Onda2 20260804114937','compliance','Login realizado','IP: 10.30.24.3','2026-08-04 14:59:45'),('audit_etg4r442','cycle','evaluation_question_deleted','evaluation_question','q2','Quao satisfeito voce ficou com a consistencia e a responsabilidade demonstradas no periodo?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','collaboration','2026-06-10 17:41:05'),('audit_evgg9bvd','incident','updated','incident','incident_g4t1tckp','HOMOLOGACAO FUNCIONAL ONDA 2 1785857987057','user_nav4x9yo','Homologacao Onda2 Full 1785857987057','compliance','Caso atualizado: HOMOLOGACAO FUNCIONAL ONDA 2 1785857987057','SC-20260804-T1TCKP · Concluido · Conduta e Relacionamento · Area: Administracao · Responsavel: Admin Plataforma Demo · Fechamento: Homologacao funcional completa validada em producao.','2026-08-04 15:40:02'),('audit_f731r7i4','user','login_success','user','u4','gestor@demo.local','u4','Gestor Demo Tecnologia','manager','Login realizado','IP: ::ffff:127.0.0.1','2026-08-04 17:31:43'),('audit_f9a4shsn','cycle','evaluation_question_deleted','evaluation_question','q_self_18','18) Busco oportunidades de crescimento e desenvolvimento dentro da empresa.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','self','2026-06-15 12:27:28'),('audit_fdo7i4dp','cycle','evaluation_question_deleted','evaluation_question','q_self_07','7) Consigo aplicar de forma pratica o que aprendi em treinamentos, cursos ou experiencias anteriores.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','self','2026-06-15 12:25:37'),('audit_ffxgxqz0','user','password_changed','user','user_w3w2j8jk','homolog.onda2.20260804114937@empresa.local','user_w3w2j8jk','Homologacao Onda2 20260804114937','compliance','Senha alterada pelo proprio usuario','Troca de senha autenticada','2026-08-04 14:49:40'),('audit_fij2v2dx','user','login_success','user','user_w3w2j8jk','homolog.onda2.20260804114937@empresa.local','user_w3w2j8jk','Homologacao Onda2 20260804114937','compliance','Login realizado','IP: 10.28.138.213','2026-08-04 14:51:45'),('audit_fkzb6h60','cycle','evaluation_question_created','evaluation_question','question_mtcxwnw8','Como você avalia a participação e contribuição do colaborador nos alinhamentos e discussões da equipe?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao criada','collaboration · multi-select','2026-06-10 17:56:34'),('audit_fv69shn6','cycle','evaluation_question_deleted','evaluation_question','q5','Quao satisfeito voce ficou com a clareza de comunicacao sobre prioridades, riscos e proximos passos?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','collaboration','2026-06-15 11:59:26'),('audit_g2zyszd5','cycle','evaluation_question_deleted','evaluation_question','q2','Quao satisfeito voce ficou com a consistencia e a responsabilidade demonstradas no periodo?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','collaboration','2026-06-10 13:29:16'),('audit_g4zi40sd','user','login_success','user','u5','admin@demo.local','u5','Admin Plataforma Demo','admin','Login realizado','IP: 10.30.24.3','2026-08-04 15:39:47'),('audit_gbt4ngly','cycle','evaluation_question_created','evaluation_question','question_m7iwxhdx','Cumpro minhas tarefas e entregas dentro dos prazos estabelecidos.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao criada','self · multi-select','2026-06-15 12:30:33'),('audit_gn9mxh06','cycle','evaluation_question_created','evaluation_question','question_fnlvkt5g','Você já teve contato com entregas ou materiais desenvolvidos pelo colaborador avaliado?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao criada','collaboration · multi-select','2026-06-10 13:49:59'),('audit_gu2wbd4h','user','login_success','user','user_w3w2j8jk','homolog.onda2.20260804114937@empresa.local','user_w3w2j8jk','Homologacao Onda2 20260804114937','compliance','Login realizado','IP: 10.24.102.100','2026-08-04 14:57:38'),('audit_gv0eju7g','user','login_success','user','user_w3w2j8jk','homolog.onda2.20260804114937@empresa.local','user_w3w2j8jk','Homologacao Onda2 20260804114937','compliance','Login realizado','IP: 10.30.24.3','2026-08-04 14:52:57'),('audit_hb0a2ki9','cycle','evaluation_question_updated','evaluation_question','question_6yejb5he','Como você avalia a disponibilidade do colaborador para interagir, responder demandas e prestar suporte à equipe quando em home office?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao atualizada','collaboration · multi-select','2026-06-10 17:49:57'),('audit_hj1jm7nh','user','login_success','user','u5','admin@demo.local','u5','Admin Plataforma Demo','admin','Login realizado','IP: 10.28.138.213','2026-08-04 15:40:30'),('audit_hja5479c','cycle','evaluation_question_deleted','evaluation_question','q3','Quao satisfeito voce ficou com a colaboracao com colegas e outras areas?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','collaboration','2026-06-10 13:30:11'),('audit_hkq31b07','applause','created','applause_entry','applause_qnr4e6m1','Colaboracao',NULL,'Admin Plataforma Demo','employee','Aplause registrado para Colaborador Demo 01','Colaboracao · Admin Plataforma Demo -> Colaborador Demo 01','2026-07-21 14:56:23'),('audit_hodn38xj','incident','created','incident','incident_fl0x8sa8','HOMOLOGACAO ONDA 2 INCIDENTE 20260804-114701','u5','Admin Plataforma Demo','admin','Relato registrado: HOMOLOGACAO ONDA 2 INCIDENTE 20260804-114701','SC-20260804-0X8SA8 · Conduta e Relacionamento · Area: Compliance · Responsavel inicial: Compliance Demo','2026-08-04 14:47:02'),('audit_hscx1e8l','cycle','evaluation_question_created','evaluation_question','question_mm6wd9aa','Pergunta criada pelo RH para regressao.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao criada','self · multi-select','2026-08-04 17:31:45'),('audit_hzjh6ggq','user','login_success','user','user_nav4x9yo','homolog.onda2.full.1785857987057@empresa.local','user_nav4x9yo','Homologacao Onda2 Full 1785857987057','compliance','Login realizado','IP: 10.24.102.100','2026-08-04 15:39:48'),('audit_ilcaux87','cycle','evaluation_question_created','evaluation_question','question_6yejb5he','Como você avalia a disponibilidade do colaborador para interagir, responder demandas e prestar suporte à equipe quando em home office?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao criada','collaboration · multi-select','2026-06-10 17:46:06'),('audit_itifnpgf','user','login_success','user','u4','gestor@demo.local','u4','Gestor Demo Tecnologia','manager','Login realizado','IP: 10.30.24.3','2026-08-05 16:54:36'),('audit_itnb3whp','user','login_success','user','u5','admin@demo.local','u5','Admin Plataforma Demo','admin','Login realizado','IP: 10.30.24.3','2026-08-04 17:19:04'),('audit_ivbruln7','cycle','evaluation_question_deleted','evaluation_question','question_lanshed3','Como você avalia o relacionamento profissional do colaborador com os demais membros da equipe?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','collaboration','2026-06-10 18:02:53'),('audit_ja6th5ad','user','login_success','user','user_zaj0pxsz','homolog.onda1.1785851695@empresa.local','user_zaj0pxsz','Homologacao Onda 1 1785851695','employee','Login realizado','IP: 10.24.102.100','2026-08-04 13:55:25'),('audit_jewwh7a7','cycle','evaluation_question_created','evaluation_question','question_cl4xrkqt','Pergunta temporaria para validar isolamento do mesmo setor.','u6','rh@demo.local','hr','Pergunta de avaliacao criada','peer-same-area · multi-select','2026-08-04 17:32:11'),('audit_jg50xsyx','user','login_success','user','u4','gestor@demo.local','u4','Gestor Demo Tecnologia','manager','Login realizado','IP: 10.30.24.3','2026-08-04 17:19:05'),('audit_k66hn9bz','user','login_success','user','user_zaj0pxsz','homolog.onda1.1785851695@empresa.local','user_zaj0pxsz','Homologacao Onda 1 1785851695','employee','Login realizado','IP: 10.24.102.100','2026-08-04 13:55:43'),('audit_kcsfl7ol','user','password_changed','user','user_m8e0jit6','subordinado.gestor@empresa.local','user_m8e0jit6','Subordinado Criado Pelo Gestor','employee','Senha alterada pelo proprio usuario','Troca de senha autenticada','2026-08-04 17:31:59'),('audit_khwjfzyn','cycle','evaluation_question_deleted','evaluation_question','q_self_06','6) Busco aprender constantemente e desenvolver novas habilidades.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','self','2026-06-15 12:25:25'),('audit_khz04dkr','user','login_success','user','u5','admin@demo.local','u5','Admin Plataforma Demo','admin','Login realizado','IP: 10.30.24.3','2026-08-05 16:54:35'),('audit_kuu5efd9','user','login_success','user','u1','colaborador1@demo.local','u1','Colaborador Demo 01','employee','Login realizado','IP: 10.28.138.213','2026-08-05 15:07:09'),('audit_kyvepq8u','user','login_success','user','u5','admin@demo.local','u5','Admin Plataforma Demo','admin','Login realizado','IP: 10.30.24.3','2026-08-04 14:49:38'),('audit_l8525jqu','user','login_success','user','user_tmtq1fjp','homolog.onda2.full.1785857918474@empresa.local','user_tmtq1fjp','Homologacao Onda2 Full 1785857918474','compliance','Login realizado','IP: 10.30.24.3','2026-08-04 15:38:40'),('audit_lnl7ajt5','cycle','evaluation_question_created','evaluation_question','question_waqkzcxq','Pergunta criada pelo RH para regressao.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao criada','self · multi-select','2026-08-04 14:38:42'),('audit_lqlh7j9n','user','login_success','user','u7','compliance@demo.local','u7','Compliance Demo','compliance','Login realizado','IP: 10.24.102.100','2026-08-05 16:54:37'),('audit_lr7kt25n','user','login_success','user','user_w3w2j8jk','homolog.onda2.20260804114937@empresa.local','user_w3w2j8jk','Homologacao Onda2 20260804114937','compliance','Login realizado','IP: 10.24.102.100','2026-08-04 14:50:02'),('audit_lzzi5m7b','cycle','evaluation_question_updated','evaluation_question','question_4l6lkw1a','Como você avalia a responsabilidade do colaborador no cumprimento de suas atividades e compromissos profissionais?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao atualizada','collaboration · multi-select','2026-06-10 17:53:40'),('audit_mb4asrso','cycle','evaluation_question_deleted','evaluation_question','q6','Quao satisfeito voce ficou com a postura profissional, o respeito e a capacidade de relacionamento desta pessoa?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','collaboration','2026-06-10 13:46:20'),('audit_mjt8g4g4','cycle','evaluation_question_updated','evaluation_question','question_lanshed3','Como você avalia o relacionamento profissional do colaborador com os demais membros da equipe?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao atualizada','collaboration · multi-select','2026-06-10 17:47:38'),('audit_mnz7q0fi','cycle','evaluation_question_deleted','evaluation_question','question_cl4xrkqt','Pergunta temporaria revisada para validar isolamento do mesmo setor.','u6','rh@demo.local','hr','Pergunta de avaliacao removida','peer-same-area','2026-08-04 17:32:11'),('audit_n01q56yz','user','login_success','user','user_tmtq1fjp','homolog.onda2.full.1785857918474@empresa.local','user_tmtq1fjp','Homologacao Onda2 Full 1785857918474','compliance','Login realizado','IP: 10.24.102.100','2026-08-04 15:38:47'),('audit_n4tv49v3','cycle','evaluation_question_deleted','evaluation_question','q_self_04','4) Procuro organizar minhas tarefas para otimizar resultados e tempo.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','self','2026-06-15 12:25:03'),('audit_namqfzps','cycle','pairing_forced','cycle','c1','Ciclo Semestral 2026.1','u5','admin@demo.local','admin','Pareamento transversal ajustado','Regressao do escopo gerencial no dashboard','2026-08-04 17:31:52'),('audit_o6bng1q1','cycle','evaluation_question_created','evaluation_question','question_l5huhwq7','Busco aprender constantemente e desenvolver novas habilidades.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao criada','self · multi-select','2026-06-15 12:48:59'),('audit_ob4av1y5','cycle','evaluation_question_deleted','evaluation_question','q_cross_01','Demonstra disposicao para colaborar quando necessario','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','cross-functional','2026-06-10 13:28:52'),('audit_od9j8jor','user','login_success','user','u5','admin@demo.local','u5','Admin Plataforma Demo','admin','Login realizado','IP: 10.28.138.213','2026-08-04 13:42:05'),('audit_op3vii8c','user','login_success','user','u5','admin@demo.local','u5','Admin Plataforma Demo','admin','Login realizado','IP: 10.28.138.213','2026-08-04 15:40:10'),('audit_osevntc0','user','login_success','user','u5','admin@demo.local','u5','Admin Plataforma Demo','admin','Login realizado','IP: 10.24.102.100','2026-08-04 13:54:56'),('audit_ox14466g','incident','updated','incident','incident_fl0x8sa8','HOMOLOGACAO ONDA 2 INCIDENTE 20260804-114701','u5','Admin Plataforma Demo','admin','Caso atualizado: HOMOLOGACAO ONDA 2 INCIDENTE 20260804-114701','SC-20260804-0X8SA8 · Concluido · Conduta e Relacionamento · Area: Compliance · Responsavel: Compliance Demo · Fechamento: Homologacao operacional da Onda 2 concluida com sucesso.','2026-08-04 14:47:03'),('audit_oxag0ap1','user','created','user','user_w3w2j8jk','Homologacao Onda2 20260804114937','u5','Admin Plataforma Demo','admin','Usuario criado para Homologacao Onda2 20260804114937','compliance · active · homolog.onda2.20260804114937@empresa.local · senha redefinida','2026-08-04 14:49:39'),('audit_plp48nfj','incident','created','incident','incident_ujv9xqov','HOMOLOGACAO FUNCIONAL ONDA 2 1785857918474','user_tmtq1fjp','Homologacao Onda2 Full 1785857918474','compliance','Relato registrado: HOMOLOGACAO FUNCIONAL ONDA 2 1785857918474','SC-20260804-V9XQOV · Nao classificado · Area: Compliance · Responsavel inicial: Compliance Demo','2026-08-04 15:38:51'),('audit_ptjuw673','cycle','evaluation_question_created','evaluation_question','question_e4kq93v1','Consigo lidar eficientemente com problemas ou obstáculos que surgem no trabalho.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao criada','self · scale','2026-06-15 12:35:23'),('audit_qaf15bt7','user','login_success','user','user_w3w2j8jk','homolog.onda2.20260804114937@empresa.local','user_w3w2j8jk','Homologacao Onda2 20260804114937','compliance','Login realizado','IP: 10.30.24.3','2026-08-04 14:52:26'),('audit_qbfckgis','cycle','evaluation_question_created','evaluation_question','question_lanshed3','Como você avalia o relacionamento profissional do colaborador com os demais membros da equipe?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao criada','collaboration · multi-select','2026-06-10 17:44:18'),('audit_qhkblb51','cycle','evaluation_question_deleted','evaluation_question','q4','Quao satisfeito voce ficou com a disposicao desta pessoa em compartilhar conhecimento e apoiar o time?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','collaboration','2026-06-10 13:31:46'),('audit_qzc8l3jq','cycle','evaluation_question_deleted','evaluation_question','q1','Quao satisfeito voce ficou com a qualidade das entregas feitas por esta pessoa?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','collaboration','2026-06-10 17:40:58'),('audit_r1u5akxv','registry','created','person','person_stw79im0','Homologacao Onda2 Full 1785857987057','u5','Admin Plataforma Demo','admin','Pessoa criada: Homologacao Onda2 Full 1785857987057','Analista de Compliance · Compliance · Homologacao · Remoto · Interno · Gestor Nao definido · Sem lideranca de area','2026-08-04 15:39:48'),('audit_r3rliqw8','cycle','evaluation_question_updated','evaluation_question','question_cl4xrkqt','Pergunta temporaria revisada para validar isolamento do mesmo setor.','u6','rh@demo.local','hr','Pergunta de avaliacao atualizada','peer-same-area · multi-select','2026-08-04 17:32:11'),('audit_r6kdwylg','user','password_changed','user','u2','colaborador2@demo.local','u2','Colaborador Demo 02','employee','Senha alterada pelo proprio usuario','Troca de senha autenticada','2026-08-05 17:24:40'),('audit_r7g1yf47','incident','created','incident','incident_g4t1tckp','HOMOLOGACAO FUNCIONAL ONDA 2 1785857987057','user_nav4x9yo','Homologacao Onda2 Full 1785857987057','compliance','Relato registrado: HOMOLOGACAO FUNCIONAL ONDA 2 1785857987057','SC-20260804-T1TCKP · Nao classificado · Area: Compliance · Responsavel inicial: Compliance Demo','2026-08-04 15:39:54'),('audit_rqo28l04','cycle','evaluation_question_deleted','evaluation_question','q_self_02','2) Minhas atividades sao realizadas com atencao a qualidade e precisao.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','self','2026-06-15 12:24:42'),('audit_ru6imapo','cycle','evaluation_question_deleted','evaluation_question','q_self_19','19) Demonstro iniciativa para propor melhorias ou solucoes inovadoras em meu trabalho.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','self','2026-06-15 12:27:37'),('audit_rzi2q899','cycle','evaluation_question_deleted','evaluation_question','q_self_14','14) Assumo responsabilidade por minhas tarefas e resultados.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','self','2026-06-15 12:26:47'),('audit_s3rzb8zt','cycle','evaluation_question_deleted','evaluation_question','q_self_01','1) Cumpro minhas tarefas e entregas dentro dos prazos estabelecidos.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','self','2026-06-15 12:24:20'),('audit_se88w8kh','cycle','evaluation_question_created','evaluation_question','question_162o1hc9','Você já teve algum tipo de interação (direta ou indireta) com o colaborador avaliado?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao criada','collaboration · multi-select','2026-06-10 13:47:33'),('audit_smk63v99','cycle','evaluation_question_deleted','evaluation_question','q1','Quao satisfeito voce ficou com a qualidade das entregas feitas por esta pessoa?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','collaboration','2026-06-10 13:29:10'),('audit_smqar6jw','user','login_success','user','u5','admin@demo.local','u5','Admin Plataforma Demo','admin','Login realizado','IP: 10.24.102.100','2026-08-04 13:51:16'),('audit_su0t1b3f','user','created','user','user_nav4x9yo','Homologacao Onda2 Full 1785857987057','u5','Admin Plataforma Demo','admin','Usuario criado para Homologacao Onda2 Full 1785857987057','compliance · active · homolog.onda2.full.1785857987057@empresa.local · senha redefinida','2026-08-04 15:39:48'),('audit_sz6ztzz3','cycle','evaluation_questions_reordered','evaluation_question_group','collaboration','collaboration','u6','RH Demo Corporativo','hr','Perguntas de avaliacao reordenadas','collaboration · 3 pergunta(s)','2026-06-10 17:50:10'),('audit_t1r01qob','cycle','evaluation_question_deleted','evaluation_question','q5','Quao satisfeito voce ficou com a clareza de comunicacao sobre prioridades, riscos e proximos passos?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','collaboration','2026-06-15 11:59:47'),('audit_taf6zqn7','cycle','evaluation_question_deleted','evaluation_question','q6','Quao satisfeito voce ficou com a postura profissional, o respeito e a capacidade de relacionamento desta pessoa?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','collaboration','2026-06-15 11:59:37'),('audit_tq3y54od','cycle','evaluation_question_created','evaluation_question','question_4l6lkw1a','Como você avalia a responsabilidade do colaborador no cumprimento de suas atividades e compromissos profissionais?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao criada','collaboration · multi-select','2026-06-10 17:53:10'),('audit_trj8eten','user','login_success','user','u5','admin@demo.local','u5','Admin Plataforma Demo','admin','Login realizado','IP: 10.30.24.3','2026-08-04 15:38:57'),('audit_u2p7b1k9','cycle','evaluation_question_updated','evaluation_question','question_8i1hprbk','Você sabe quais são as principais atividades e responsabilidades do colaborador avaliado?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao atualizada','collaboration · multi-select','2026-06-10 18:06:55'),('audit_u9zr4ivn','user','login_success','user','u4','gestor@demo.local','u4','Gestor Demo Tecnologia','manager','Login realizado','IP: 10.28.138.213','2026-08-05 15:07:08'),('audit_ur5e8mvi','cycle','evaluation_question_updated','evaluation_question','question_6yejb5he','Como você avalia a disponibilidade do colaborador para interagir, responder demandas e prestar suporte à equipe quando em home office?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao atualizada','collaboration · multi-select','2026-06-10 17:46:52'),('audit_uzgv33d4','cycle','evaluation_question_deleted','evaluation_question','q_self_03','3) Consigo lidar eficientemente com problemas ou obstaculos que surgem no trabalho.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','self','2026-06-15 12:24:52'),('audit_vbaukzyw','cycle','evaluation_question_created','evaluation_question','question_cuqrgx2j','De forma geral, você sente que tem visibilidade suficiente para avaliar o trabalho do colaborador avaliado?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao criada','collaboration · multi-select','2026-06-10 13:54:22'),('audit_vk6kmp9d','cycle','evaluation_question_updated','evaluation_question','question_e4kq93v1','Consigo lidar eficientemente com problemas ou obstáculos que surgem no trabalho.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao atualizada','self · multi-select','2026-06-15 12:37:19'),('audit_vkqzjtp2','cycle','evaluation_question_deleted','evaluation_question','q4','Quao satisfeito voce ficou com a disposicao desta pessoa em compartilhar conhecimento e apoiar o time?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','collaboration','2026-06-10 17:41:14'),('audit_vr29g28i','incident','updated','incident','incident_ujv9xqov','HOMOLOGACAO FUNCIONAL ONDA 2 1785857918474','user_tmtq1fjp','Homologacao Onda2 Full 1785857918474','compliance','Caso atualizado: HOMOLOGACAO FUNCIONAL ONDA 2 1785857918474','SC-20260804-V9XQOV · Em apuracao · Conduta e Relacionamento · Area: Administracao · Responsavel: Admin Plataforma Demo','2026-08-04 15:38:57'),('audit_vspns16f','cycle','evaluation_question_updated','evaluation_question','question_6yejb5he','Como você avalia a disponibilidade do colaborador para interagir, responder demandas e prestar suporte à equipe quando em home office?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao atualizada','collaboration · multi-select','2026-06-10 17:48:08'),('audit_vuhs46a9','user','created','user','user_m8e0jit6','Subordinado Criado Pelo Gestor','u4','Gestor Demo Tecnologia','manager','Usuario criado para Subordinado Criado Pelo Gestor','employee · active · subordinado.gestor@empresa.local · senha redefinida','2026-08-04 17:31:56'),('audit_wai9mlr4','cycle','evaluation_question_deleted','evaluation_question','q6','Quao satisfeito voce ficou com a postura profissional, o respeito e a capacidade de relacionamento desta pessoa?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','collaboration','2026-06-10 17:44:31'),('audit_wjqgwkd9','user','login_success','user','u7','compliance@demo.local','u7','Compliance Demo','compliance','Login realizado','IP: 10.30.24.3','2026-08-05 15:07:09'),('audit_wnwfyzzw','cycle','evaluation_questions_reordered','evaluation_question_group','collaboration','collaboration','u6','RH Demo Corporativo','hr','Perguntas de avaliacao reordenadas','collaboration · 7 pergunta(s)','2026-06-10 18:04:44'),('audit_wrnbyzf7','registry','created','person','person_uqj5iyg5','Homologacao Onda 1 1785851695','u5','Admin Plataforma Demo','admin','Pessoa criada: Homologacao Onda 1 1785851695','Usuario de Homologacao · Tecnologia · Sao Paulo · Hibrido · Interno · Gestor Nao definido · Sem lideranca de area','2026-08-04 13:54:56'),('audit_xdegwzmp','cycle','evaluation_question_deleted','evaluation_question','q_self_12','12) Consigo lidar de forma construtiva com conflitos ou divergencias de opiniao.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','self','2026-06-15 12:26:29'),('audit_xf8s0jxk','incident','evidence_added','incident','incident_ujv9xqov','HOMOLOGACAO FUNCIONAL ONDA 2 1785857918474','user_tmtq1fjp','Homologacao Onda2 Full 1785857918474','compliance','Evidencia anexada ao caso: HOMOLOGACAO FUNCIONAL ONDA 2 1785857918474','SC-20260804-V9XQOV · homologacao-onda2-evidencia-1785857918474.txt · text/plain · 39 bytes','2026-08-04 15:38:53'),('audit_xflz2xn2','cycle','evaluation_question_deleted','evaluation_question','q_cross_02','E acessivel e aberto a interacoes com outros times','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','cross-functional','2026-06-10 13:28:52'),('audit_xvfdxlr9','user','login_success','user','u4','gestor@demo.local','u4','Gestor Demo Tecnologia','manager','Login realizado','IP: ::ffff:127.0.0.1','2026-08-05 15:09:56'),('audit_xx76hmex','user','login_success','user','u5','admin@demo.local','u5','Admin Plataforma Demo','admin','Login realizado','IP: 10.28.138.213','2026-08-04 14:47:42'),('audit_y8w644j5','user','login_success','user','u5','admin@demo.local','u5','Admin Plataforma Demo','admin','Login realizado','IP: ::ffff:127.0.0.1','2026-08-05 15:07:27'),('audit_yl6pfxwy','user','login_success','user','u2','colaborador2@demo.local','u2','Colaborador Demo 02','employee','Login realizado','IP: 10.24.102.100','2026-08-05 17:24:39'),('audit_ytpa0fas','user','login_success','user','u5','admin@demo.local','u5','Admin Plataforma Demo','admin','Login realizado','IP: 10.28.138.213','2026-08-04 15:38:39'),('audit_yz2fq9um','user','login_success','user','u7','compliance@demo.local','u7','Compliance Demo','compliance','Login realizado','IP: ::ffff:127.0.0.1','2026-08-05 15:09:57'),('audit_yzm0960c','applause','archived','applause_entry','applause_qnr4e6m1','Colaboracao','u5','Admin Plataforma Demo','admin','Aplause arquivado para Colaborador Demo 01','Colaboracao · Admin Plataforma Demo -> Colaborador Demo 01','2026-07-21 14:56:24'),('audit_z40x95om','user','password_changed','user','user_nav4x9yo','homolog.onda2.full.1785857987057@empresa.local','user_nav4x9yo','Homologacao Onda2 Full 1785857987057','compliance','Senha alterada pelo proprio usuario','Troca de senha autenticada','2026-08-04 15:39:49'),('audit_z9b9ol0p','user','login_success','user','u5','admin@demo.local','u5','Admin Plataforma Demo','admin','Login realizado','IP: 10.30.24.3','2026-08-04 15:32:19'),('audit_zfwpvm5g','cycle','evaluation_question_deleted','evaluation_question','q_self_15','15) Cumpro regras, normas e procedimentos da empresa com consistencia.','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','self','2026-06-15 12:26:53'),('audit_zmwn95oo','user','login_success','user','u5','admin@demo.local','u5','Admin Plataforma Demo','admin','Login realizado','IP: 10.28.138.213','2026-08-04 14:47:02'),('audit_znwbfzdc','incident','created','incident','incident_sbd8i1tf','Relato de colaborador','u1','Colaborador Demo 01','employee','Relato registrado: Relato de colaborador','SC-20260804-D8I1TF · Nao classificado · Area: Compliance · Responsavel inicial: Compliance Demo','2026-08-04 17:32:04'),('audit_zps8i8y6','cycle','evaluation_question_deleted','evaluation_question','q6','Quao satisfeito voce ficou com a postura profissional, o respeito e a capacidade de relacionamento desta pessoa?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','collaboration','2026-06-15 11:59:19'),('audit_ztg62ms0','cycle','evaluation_question_deleted','evaluation_question','q5','Quao satisfeito voce ficou com a clareza de comunicacao sobre prioridades, riscos e proximos passos?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','collaboration','2026-06-10 13:31:52'),('audit_zuuvzqgt','incident','evidence_added','incident','incident_4t9y5xio','HOMOLOGACAO ONDA 2 EVIDENCIA 2026-08-04T15:19:31.987Z','u5','Admin Plataforma Demo','admin','Evidencia anexada ao caso: HOMOLOGACAO ONDA 2 EVIDENCIA 2026-08-04T15:19:31.987Z','SC-20260804-9Y5XIO · homologacao-evidencia.txt · text/plain · 32 bytes','2026-08-04 15:19:32'),('audit_zzc22dgn','cycle','evaluation_question_deleted','evaluation_question','q1','Quao satisfeito voce ficou com a qualidade das entregas feitas por esta pessoa?','u6','RH Demo Corporativo','hr','Pergunta de avaliacao removida','collaboration','2026-06-15 11:59:12');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `business_units`
--

DROP TABLE IF EXISTS `business_units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `business_units` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(120) NOT NULL,
  `head` varchar(120) DEFAULT '',
  `lider_tec` varchar(120) DEFAULT '',
  `lider_op` varchar(120) DEFAULT '',
  `comercial` varchar(120) DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `nome` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `business_units`
--

LOCK TABLES `business_units` WRITE;
/*!40000 ALTER TABLE `business_units` DISABLE KEYS */;
INSERT INTO `business_units` VALUES (1,'Corporativo','Claudio Gonçalves','Flávio Costa','Almedson Ferreira','David Cunha');
/*!40000 ALTER TABLE `business_units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `competencies`
--

DROP TABLE IF EXISTS `competencies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `competencies` (
  `id` varchar(36) NOT NULL,
  `competency_key` varchar(80) NOT NULL,
  `name` varchar(160) NOT NULL,
  `description` text NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `competency_key` (`competency_key`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `competencies`
--

LOCK TABLES `competencies` WRITE;
/*!40000 ALTER TABLE `competencies` DISABLE KEYS */;
INSERT INTO `competencies` VALUES ('cmp_career','career','Carreira','Competencia ligada a visibilidade de trilha, interesses de crescimento e mobilidade interna.','active'),('cmp_collaboration','collaboration','Colaboracao','Competencia ligada a trabalho em equipe, compartilhamento e parceria entre areas.','active'),('cmp_commitment','commitment','Comprometimento','Competencia ligada a responsabilidade com objetivos, regras e resultados.','active'),('cmp_communication','communication','Comunicacao','Competencia ligada a clareza, transparencia e qualidade das interacoes profissionais.','active'),('cmp_delivery','delivery','Entrega e qualidade','Competencia ligada a cumprimento de prazos, qualidade das entregas e consistencia no periodo.','active'),('cmp_development','development','Desenvolvimento','Competencia ligada a aprendizado continuo, feedback e crescimento profissional.','active'),('cmp_engagement','engagement','Engajamento','Competencia ligada a motivacao, comprometimento e energia mobilizadora da lideranca.','active'),('cmp_growth','growth','Crescimento','Competencia ligada a potencial, iniciativa e disposicao para novos desafios.','active'),('cmp_interpersonal','interpersonal','Relacionamento interpessoal','Competencia ligada a postura profissional, respeito e convivencia saudavel.','active'),('cmp_knowledge','knowledge','Conhecimento tecnico','Competencia ligada a dominio tecnico, aplicacao pratica e atualizacao profissional.','active'),('cmp_recognition','recognition','Reconhecimento','Competencia ligada a valorizacao do trabalho por colegas e lideranca.','active'),('cmp_resources','resources','Recursos e estrutura','Competencia ligada a acessos, ferramentas e condicoes para execucao do trabalho.','active'),('cmp_results','results','Gestao de resultados','Competencia ligada a metas claras, acompanhamento e qualidade de entrega da equipe.','active'),('cmp_strategy','strategy','Alinhamento estrategico','Competencia ligada a entendimento de metas, objetivos e conexao com o trabalho diario.','active'),('cmp_trust','trust','Confianca e ambiente','Competencia ligada a seguranca psicologica, respeito e construcao de confianca.','active'),('cmp_wellbeing','wellbeing','Experiencia de trabalho','Competencia ligada a bem-estar e percepcao geral da experiencia no trabalho.','active');
/*!40000 ALTER TABLE `competencies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `development_plans`
--

DROP TABLE IF EXISTS `development_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `development_plans` (
  `id` varchar(36) NOT NULL,
  `person_id` varchar(36) NOT NULL,
  `cycle_id` varchar(36) DEFAULT NULL,
  `competency_id` varchar(36) DEFAULT NULL,
  `focus_title` varchar(160) NOT NULL,
  `action_text` text NOT NULL,
  `due_date` date NOT NULL,
  `expected_evidence` text NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'active',
  `created_by_user_id` varchar(36) NOT NULL,
  `created_at` datetime NOT NULL,
  `archived_at` datetime DEFAULT NULL,
  `progress_status` varchar(32) NOT NULL DEFAULT 'not_started',
  `progress_note` text,
  `progress_updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `person_id` (`person_id`),
  KEY `cycle_id` (`cycle_id`),
  KEY `competency_id` (`competency_id`),
  KEY `created_by_user_id` (`created_by_user_id`),
  CONSTRAINT `development_plans_ibfk_1` FOREIGN KEY (`person_id`) REFERENCES `people` (`id`),
  CONSTRAINT `development_plans_ibfk_2` FOREIGN KEY (`cycle_id`) REFERENCES `evaluation_cycles` (`id`),
  CONSTRAINT `development_plans_ibfk_3` FOREIGN KEY (`competency_id`) REFERENCES `competencies` (`id`),
  CONSTRAINT `development_plans_ibfk_4` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `development_plans`
--

LOCK TABLES `development_plans` WRITE;
/*!40000 ALTER TABLE `development_plans` DISABLE KEYS */;
INSERT INTO `development_plans` VALUES ('dp1','p1','c1','cmp_communication','Fortalecer comunicacao executiva','Conduzir checkpoint quinzenal com a area e formalizar riscos-chave em ate 24h.','2026-06-30','Ata dos checkpoints e melhoria percebida nas avaliacoes do proximo ciclo.','active','u6','2026-03-20 09:00:00',NULL,'not_started',NULL,NULL);
/*!40000 ALTER TABLE `development_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `development_records`
--

DROP TABLE IF EXISTS `development_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `development_records` (
  `id` varchar(36) NOT NULL,
  `person_id` varchar(36) NOT NULL,
  `record_type` varchar(80) NOT NULL,
  `title` varchar(160) NOT NULL,
  `provider_name` varchar(120) NOT NULL,
  `completed_at` date NOT NULL,
  `skill_signal` varchar(120) NOT NULL,
  `notes` text NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'active',
  `archived_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `person_id` (`person_id`),
  CONSTRAINT `development_records_ibfk_1` FOREIGN KEY (`person_id`) REFERENCES `people` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `development_records`
--

LOCK TABLES `development_records` WRITE;
/*!40000 ALTER TABLE `development_records` DISABLE KEYS */;
INSERT INTO `development_records` VALUES ('d1','p3','Certificacao','SAP GRC Foundation','SAP Learning','2026-02-05','Governanca de acessos','Certificacao vinculada ao projeto de compliance.','active',NULL),('d2','p4','MBA','MBA em Gestao de Tecnologia','FIA Business School','2025-12-10','Lideranca, governanca e estrategia','Formacao utilizada para fortalecer rituais de acompanhamento e desenvolvimento da equipe.','active',NULL),('d3','p2','Graduacao','Sistemas de Informacao','Universidade Presbiteriana Mackenzie','2024-12-18','Arquitetura, produto e analise de requisitos','Base academica aplicada nas frentes de tecnologia e integracao.','active',NULL),('d4','p1','Pos-graduacao','Compliance e Integridade Corporativa','FGV','2025-08-22','Etica, controles internos e investigacao','Evolucao academica diretamente conectada ao papel atual no time de compliance.','active',NULL);
/*!40000 ALTER TABLE `development_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_answers`
--

DROP TABLE IF EXISTS `evaluation_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_answers` (
  `id` varchar(36) NOT NULL,
  `submission_id` varchar(36) NOT NULL,
  `question_id` varchar(36) DEFAULT NULL,
  `answer_type` varchar(40) NOT NULL DEFAULT 'scale',
  `score` int DEFAULT NULL,
  `evidence_note` text,
  `answer_text` text,
  `answer_options_json` json DEFAULT NULL,
  `questionnaire_question_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `submission_id` (`submission_id`),
  KEY `question_id` (`question_id`),
  KEY `idx_answers_questionnaire_question_id` (`questionnaire_question_id`),
  CONSTRAINT `evaluation_answers_ibfk_1` FOREIGN KEY (`submission_id`) REFERENCES `evaluation_submissions` (`id`),
  CONSTRAINT `evaluation_answers_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `evaluation_questions` (`id`),
  CONSTRAINT `fk_evaluation_answers_questionnaire_question` FOREIGN KEY (`questionnaire_question_id`) REFERENCES `evaluation_questionnaire_questions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_answers`
--

LOCK TABLES `evaluation_answers` WRITE;
/*!40000 ALTER TABLE `evaluation_answers` DISABLE KEYS */;
INSERT INTO `evaluation_answers` VALUES ('ans1','es1','q1','scale',4,'Cumpriu marcos importantes no periodo.',NULL,NULL,NULL),('ans2','es1','q2','scale',4,'Manteve consistencia em sprint critica.',NULL,NULL,NULL),('ans3','es1','q3','scale',5,'Apoiou integracao entre times com rapidez.',NULL,NULL,NULL),('ans4','es1','q4','scale',4,'Compartilhou contexto tecnico com clareza.',NULL,NULL,NULL),('ans5','es1','q5','scale',4,'Comunicou riscos sem ruido.',NULL,NULL,NULL),('ans6','es1','q6','scale',4,'Relacao respeitosa e colaborativa com o time.',NULL,NULL,NULL);
/*!40000 ALTER TABLE `evaluation_answers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_assignments`
--

DROP TABLE IF EXISTS `evaluation_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_assignments` (
  `id` varchar(36) NOT NULL,
  `cycle_id` varchar(36) NOT NULL,
  `reviewer_user_id` varchar(36) NOT NULL,
  `reviewee_person_id` varchar(36) NOT NULL,
  `relationship_type` varchar(60) NOT NULL,
  `project_context` varchar(160) NOT NULL,
  `collaboration_context` text NOT NULL,
  `status` varchar(40) NOT NULL,
  `reminder_count` int NOT NULL DEFAULT '0',
  `last_reminder_sent_at` datetime DEFAULT NULL,
  `due_date` date NOT NULL,
  `questionnaire_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cycle_id` (`cycle_id`),
  KEY `reviewer_user_id` (`reviewer_user_id`),
  KEY `reviewee_person_id` (`reviewee_person_id`),
  KEY `idx_assignments_questionnaire_id` (`questionnaire_id`),
  CONSTRAINT `evaluation_assignments_ibfk_1` FOREIGN KEY (`cycle_id`) REFERENCES `evaluation_cycles` (`id`),
  CONSTRAINT `evaluation_assignments_ibfk_2` FOREIGN KEY (`reviewer_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `evaluation_assignments_ibfk_3` FOREIGN KEY (`reviewee_person_id`) REFERENCES `people` (`id`),
  CONSTRAINT `fk_evaluation_assignments_questionnaire` FOREIGN KEY (`questionnaire_id`) REFERENCES `evaluation_questionnaires` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_assignments`
--

LOCK TABLES `evaluation_assignments` WRITE;
/*!40000 ALTER TABLE `evaluation_assignments` DISABLE KEYS */;
INSERT INTO `evaluation_assignments` VALUES ('assignment_duzfhh8p','c1','u4','p1','cross-functional','Colaboracao transversal entre areas','Feedback transversal gerado automaticamente para colaboracao entre areas da mesma unidade.','pending',0,NULL,'2026-04-15',NULL),('ea1','c1','u1','p2','peer','Projeto Modernizacao Portal','Atuaram juntos na priorizacao de melhorias e alinhamento de requisitos.','submitted',0,NULL,'2026-04-15',NULL),('ea2','c1','u4','p2','manager','Rotina da area','Avaliacao gerencial semestral.','pending',0,NULL,'2026-04-15',NULL),('ea3','c1','u2','p1','cross-functional','Politica de acessos','Solicitacao de feedback de colaboracao em atividade compartilhada.','pending',0,NULL,'2026-04-15',NULL),('ea4','c1','u1','p1','self','Reflexao individual','Autoavaliacao semestral do colaborador.','pending',0,NULL,'2026-04-15',NULL),('ea5','c1','u1','p4','leader','Avaliacao da lideranca imediata','Leitura da lideranca no semestre.','pending',0,NULL,'2026-04-15',NULL),('ea6','c1','u1','p1','company','Experiencia institucional','Avaliacao da empresa e da experiencia geral do colaborador.','pending',0,NULL,'2026-04-15',NULL),('ea7','c1','u1','p2','client-internal','Consumo interno entre areas','Leitura da area cliente sobre qualidade de atendimento, parceria e entrega.','pending',0,NULL,'2026-04-15',NULL),('ea8','c1','u1','p3','client-external','Interacao com consultoria','Percepcao de parceria, confiabilidade e resultado na relacao com consultoria.','pending',0,NULL,'2026-04-15',NULL);
/*!40000 ALTER TABLE `evaluation_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_cycle_participants`
--

DROP TABLE IF EXISTS `evaluation_cycle_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_cycle_participants` (
  `id` varchar(36) NOT NULL,
  `cycle_id` varchar(36) NOT NULL,
  `person_id` varchar(36) NOT NULL,
  `status` varchar(40) NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_cycle_participant` (`cycle_id`,`person_id`),
  KEY `person_id` (`person_id`),
  CONSTRAINT `evaluation_cycle_participants_ibfk_1` FOREIGN KEY (`cycle_id`) REFERENCES `evaluation_cycles` (`id`),
  CONSTRAINT `evaluation_cycle_participants_ibfk_2` FOREIGN KEY (`person_id`) REFERENCES `people` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_cycle_participants`
--

LOCK TABLES `evaluation_cycle_participants` WRITE;
/*!40000 ALTER TABLE `evaluation_cycle_participants` DISABLE KEYS */;
INSERT INTO `evaluation_cycle_participants` VALUES ('cycle_participant_0s9xrswj','c1','p1','active'),('cycle_participant_ej97y576','c1','p4','active'),('cycle_participant_j64s8awu','c1','p3','active'),('cycle_participant_la30d6pb','c1','p2','active');
/*!40000 ALTER TABLE `evaluation_cycle_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_cycle_raters`
--

DROP TABLE IF EXISTS `evaluation_cycle_raters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_cycle_raters` (
  `id` varchar(36) NOT NULL,
  `cycle_id` varchar(36) NOT NULL,
  `participant_person_id` varchar(36) NOT NULL,
  `rater_user_id` varchar(36) NOT NULL,
  `relationship_type` varchar(60) NOT NULL,
  `status` varchar(40) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_cycle_rater` (`cycle_id`,`participant_person_id`,`rater_user_id`,`relationship_type`),
  KEY `participant_person_id` (`participant_person_id`),
  KEY `rater_user_id` (`rater_user_id`),
  CONSTRAINT `evaluation_cycle_raters_ibfk_1` FOREIGN KEY (`cycle_id`) REFERENCES `evaluation_cycles` (`id`),
  CONSTRAINT `evaluation_cycle_raters_ibfk_2` FOREIGN KEY (`participant_person_id`) REFERENCES `people` (`id`),
  CONSTRAINT `evaluation_cycle_raters_ibfk_3` FOREIGN KEY (`rater_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_cycle_raters`
--

LOCK TABLES `evaluation_cycle_raters` WRITE;
/*!40000 ALTER TABLE `evaluation_cycle_raters` DISABLE KEYS */;
INSERT INTO `evaluation_cycle_raters` VALUES ('cycle_rater_5h03ht75','c1','p1','u2','cross-functional','pending'),('cycle_rater_6cemf8ra','c1','p1','u1','self','pending'),('cycle_rater_75p2dwt5','c1','p1','u4','cross-functional','pending'),('cycle_rater_hq27y1cu','c1','p2','u1','peer','completed'),('cycle_rater_kudnpe5f','c1','p2','u4','manager','pending'),('cycle_rater_mpfm8uk4','c1','p2','u1','client-internal','pending'),('cycle_rater_p4ziv1cs','c1','p1','u1','company','pending'),('cycle_rater_ppst280w','c1','p4','u1','leader','pending'),('cycle_rater_tsyc7mis','c1','p3','u1','client-external','pending');
/*!40000 ALTER TABLE `evaluation_cycle_raters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_cycle_reports`
--

DROP TABLE IF EXISTS `evaluation_cycle_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_cycle_reports` (
  `id` varchar(36) NOT NULL,
  `cycle_id` varchar(36) NOT NULL,
  `relationship_type` varchar(60) NOT NULL,
  `total_responses` int NOT NULL,
  `average_score` decimal(4,2) NOT NULL,
  `question_averages_json` json NOT NULL,
  `generated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_cycle_report` (`cycle_id`,`relationship_type`),
  CONSTRAINT `evaluation_cycle_reports_ibfk_1` FOREIGN KEY (`cycle_id`) REFERENCES `evaluation_cycles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_cycle_reports`
--

LOCK TABLES `evaluation_cycle_reports` WRITE;
/*!40000 ALTER TABLE `evaluation_cycle_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `evaluation_cycle_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_cycles`
--

DROP TABLE IF EXISTS `evaluation_cycles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_cycles` (
  `id` varchar(36) NOT NULL,
  `template_id` varchar(36) NOT NULL,
  `library_id` varchar(120) DEFAULT NULL,
  `library_name` varchar(160) DEFAULT NULL,
  `title` varchar(160) NOT NULL,
  `semester_label` varchar(60) NOT NULL,
  `status` varchar(40) NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `enabled_relationships_json` json DEFAULT NULL,
  `transversal_config_json` json DEFAULT NULL,
  `due_date` date NOT NULL,
  `target_group` varchar(80) NOT NULL,
  `created_by_user_id` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `template_id` (`template_id`),
  KEY `created_by_user_id` (`created_by_user_id`),
  CONSTRAINT `evaluation_cycles_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `evaluation_templates` (`id`),
  CONSTRAINT `evaluation_cycles_ibfk_2` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_cycles`
--

LOCK TABLES `evaluation_cycles` WRITE;
/*!40000 ALTER TABLE `evaluation_cycles` DISABLE KEYS */;
INSERT INTO `evaluation_cycles` VALUES ('c1','t1','library_standard_02_2026','Biblioteca padrao 02/2026','Ciclo Semestral 2026.1','2026.1','Liberado',1,NULL,NULL,'2026-04-15','Todos os colaboradores','u6');
/*!40000 ALTER TABLE `evaluation_cycles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_feedback_request_items`
--

DROP TABLE IF EXISTS `evaluation_feedback_request_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_feedback_request_items` (
  `id` varchar(36) NOT NULL,
  `request_id` varchar(36) NOT NULL,
  `provider_person_id` varchar(36) NOT NULL,
  `assignment_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `request_id` (`request_id`),
  KEY `provider_person_id` (`provider_person_id`),
  KEY `assignment_id` (`assignment_id`),
  CONSTRAINT `evaluation_feedback_request_items_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `evaluation_feedback_requests` (`id`),
  CONSTRAINT `evaluation_feedback_request_items_ibfk_2` FOREIGN KEY (`provider_person_id`) REFERENCES `people` (`id`),
  CONSTRAINT `evaluation_feedback_request_items_ibfk_3` FOREIGN KEY (`assignment_id`) REFERENCES `evaluation_assignments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_feedback_request_items`
--

LOCK TABLES `evaluation_feedback_request_items` WRITE;
/*!40000 ALTER TABLE `evaluation_feedback_request_items` DISABLE KEYS */;
INSERT INTO `evaluation_feedback_request_items` VALUES ('fri1','fr1','p2',NULL),('fri2','fr1','p3',NULL);
/*!40000 ALTER TABLE `evaluation_feedback_request_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_feedback_requests`
--

DROP TABLE IF EXISTS `evaluation_feedback_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_feedback_requests` (
  `id` varchar(36) NOT NULL,
  `cycle_id` varchar(36) NOT NULL,
  `requester_user_id` varchar(36) NOT NULL,
  `reviewee_person_id` varchar(36) NOT NULL,
  `status` varchar(40) NOT NULL,
  `context_note` text NOT NULL,
  `requested_at` datetime NOT NULL,
  `decided_at` datetime DEFAULT NULL,
  `decided_by_user_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cycle_id` (`cycle_id`),
  KEY `requester_user_id` (`requester_user_id`),
  KEY `reviewee_person_id` (`reviewee_person_id`),
  KEY `decided_by_user_id` (`decided_by_user_id`),
  CONSTRAINT `evaluation_feedback_requests_ibfk_1` FOREIGN KEY (`cycle_id`) REFERENCES `evaluation_cycles` (`id`),
  CONSTRAINT `evaluation_feedback_requests_ibfk_2` FOREIGN KEY (`requester_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `evaluation_feedback_requests_ibfk_3` FOREIGN KEY (`reviewee_person_id`) REFERENCES `people` (`id`),
  CONSTRAINT `evaluation_feedback_requests_ibfk_4` FOREIGN KEY (`decided_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_feedback_requests`
--

LOCK TABLES `evaluation_feedback_requests` WRITE;
/*!40000 ALTER TABLE `evaluation_feedback_requests` DISABLE KEYS */;
INSERT INTO `evaluation_feedback_requests` VALUES ('fr1','c1','u1','p1','pending','Colaborei diretamente com tecnologia e consultoria na revisao de politicas e gostaria de receber feedback mais aderente ao ciclo.','2026-03-16 11:00:00',NULL,NULL);
/*!40000 ALTER TABLE `evaluation_feedback_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_pairing_exceptions`
--

DROP TABLE IF EXISTS `evaluation_pairing_exceptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_pairing_exceptions` (
  `id` varchar(36) NOT NULL,
  `cycle_id` varchar(36) NOT NULL,
  `pairing_id` varchar(36) DEFAULT NULL,
  `action_type` varchar(40) NOT NULL,
  `reviewer_user_id` varchar(36) NOT NULL,
  `previous_reviewee_person_id` varchar(36) DEFAULT NULL,
  `next_reviewee_person_id` varchar(36) DEFAULT NULL,
  `reason` text NOT NULL,
  `actor_user_id` varchar(36) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `cycle_id` (`cycle_id`),
  KEY `pairing_id` (`pairing_id`),
  KEY `reviewer_user_id` (`reviewer_user_id`),
  KEY `previous_reviewee_person_id` (`previous_reviewee_person_id`),
  KEY `next_reviewee_person_id` (`next_reviewee_person_id`),
  KEY `actor_user_id` (`actor_user_id`),
  CONSTRAINT `evaluation_pairing_exceptions_ibfk_1` FOREIGN KEY (`cycle_id`) REFERENCES `evaluation_cycles` (`id`),
  CONSTRAINT `evaluation_pairing_exceptions_ibfk_2` FOREIGN KEY (`pairing_id`) REFERENCES `evaluation_pairings` (`id`),
  CONSTRAINT `evaluation_pairing_exceptions_ibfk_3` FOREIGN KEY (`reviewer_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `evaluation_pairing_exceptions_ibfk_4` FOREIGN KEY (`previous_reviewee_person_id`) REFERENCES `people` (`id`),
  CONSTRAINT `evaluation_pairing_exceptions_ibfk_5` FOREIGN KEY (`next_reviewee_person_id`) REFERENCES `people` (`id`),
  CONSTRAINT `evaluation_pairing_exceptions_ibfk_6` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_pairing_exceptions`
--

LOCK TABLES `evaluation_pairing_exceptions` WRITE;
/*!40000 ALTER TABLE `evaluation_pairing_exceptions` DISABLE KEYS */;
INSERT INTO `evaluation_pairing_exceptions` VALUES ('pairing_exception_tn6eynwi','c1','pairing_7tyiqryp','forced','u4',NULL,'p1','Regressao do escopo gerencial no dashboard','u5','2026-08-04 17:31:48');
/*!40000 ALTER TABLE `evaluation_pairing_exceptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_pairings`
--

DROP TABLE IF EXISTS `evaluation_pairings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_pairings` (
  `id` varchar(36) NOT NULL,
  `cycle_id` varchar(36) NOT NULL,
  `relationship_type` varchar(60) NOT NULL,
  `reviewer_user_id` varchar(36) NOT NULL,
  `reviewee_person_id` varchar(36) NOT NULL,
  `pairing_source` varchar(30) NOT NULL,
  `pairing_reason` text NOT NULL,
  `seed` varchar(120) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `created_by_user_id` varchar(36) DEFAULT NULL,
  `blocked_at` datetime DEFAULT NULL,
  `blocked_by_user_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cycle_id` (`cycle_id`),
  KEY `reviewer_user_id` (`reviewer_user_id`),
  KEY `reviewee_person_id` (`reviewee_person_id`),
  KEY `created_by_user_id` (`created_by_user_id`),
  KEY `blocked_by_user_id` (`blocked_by_user_id`),
  CONSTRAINT `evaluation_pairings_ibfk_1` FOREIGN KEY (`cycle_id`) REFERENCES `evaluation_cycles` (`id`),
  CONSTRAINT `evaluation_pairings_ibfk_2` FOREIGN KEY (`reviewer_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `evaluation_pairings_ibfk_3` FOREIGN KEY (`reviewee_person_id`) REFERENCES `people` (`id`),
  CONSTRAINT `evaluation_pairings_ibfk_4` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `evaluation_pairings_ibfk_5` FOREIGN KEY (`blocked_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_pairings`
--

LOCK TABLES `evaluation_pairings` WRITE;
/*!40000 ALTER TABLE `evaluation_pairings` DISABLE KEYS */;
INSERT INTO `evaluation_pairings` VALUES ('pairing_7tyiqryp','c1','cross-functional','u4','p1','manual','Regressao do escopo gerencial no dashboard','c1','2026-08-04 17:31:48','u5',NULL,NULL);
/*!40000 ALTER TABLE `evaluation_pairings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_questionnaire_access_policies`
--

DROP TABLE IF EXISTS `evaluation_questionnaire_access_policies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_questionnaire_access_policies` (
  `id` varchar(36) NOT NULL,
  `questionnaire_id` varchar(36) NOT NULL,
  `can_view_reviewee` tinyint(1) NOT NULL DEFAULT '0',
  `can_view_reviewer` tinyint(1) NOT NULL DEFAULT '1',
  `can_view_manager` tinyint(1) NOT NULL DEFAULT '0',
  `can_view_hr` tinyint(1) NOT NULL DEFAULT '1',
  `can_view_admin` tinyint(1) NOT NULL DEFAULT '1',
  `can_view_raw_answers` tinyint(1) NOT NULL DEFAULT '0',
  `can_view_prompt_text_after_submission` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_questionnaire_policy` (`questionnaire_id`),
  CONSTRAINT `evaluation_questionnaire_access_policies_ibfk_1` FOREIGN KEY (`questionnaire_id`) REFERENCES `evaluation_questionnaires` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_questionnaire_access_policies`
--

LOCK TABLES `evaluation_questionnaire_access_policies` WRITE;
/*!40000 ALTER TABLE `evaluation_questionnaire_access_policies` DISABLE KEYS */;
/*!40000 ALTER TABLE `evaluation_questionnaire_access_policies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_questionnaire_questions`
--

DROP TABLE IF EXISTS `evaluation_questionnaire_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_questionnaire_questions` (
  `id` varchar(36) NOT NULL,
  `questionnaire_id` varchar(36) NOT NULL,
  `sort_order` int NOT NULL,
  `section_key` varchar(80) DEFAULT NULL,
  `section_title` varchar(160) DEFAULT NULL,
  `section_description` text,
  `dimension_key` varchar(60) NOT NULL,
  `dimension_title` varchar(120) NOT NULL,
  `prompt_text` text NOT NULL,
  `helper_text` text,
  `input_type` varchar(40) NOT NULL DEFAULT 'scale',
  `scale_profile` varchar(40) DEFAULT NULL,
  `visibility` varchar(40) NOT NULL DEFAULT 'restricted',
  `is_required` tinyint(1) NOT NULL DEFAULT '1',
  `collect_evidence_on_extreme` tinyint(1) NOT NULL DEFAULT '0',
  `is_sensitive` tinyint(1) NOT NULL DEFAULT '0',
  `options_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_questionnaire_sort_order` (`questionnaire_id`,`sort_order`),
  CONSTRAINT `evaluation_questionnaire_questions_ibfk_1` FOREIGN KEY (`questionnaire_id`) REFERENCES `evaluation_questionnaires` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_questionnaire_questions`
--

LOCK TABLES `evaluation_questionnaire_questions` WRITE;
/*!40000 ALTER TABLE `evaluation_questionnaire_questions` DISABLE KEYS */;
/*!40000 ALTER TABLE `evaluation_questionnaire_questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_questionnaires`
--

DROP TABLE IF EXISTS `evaluation_questionnaires`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_questionnaires` (
  `id` varchar(36) NOT NULL,
  `cycle_id` varchar(36) NOT NULL,
  `reviewee_person_id` varchar(36) NOT NULL,
  `relationship_type` varchar(60) NOT NULL,
  `source_library_id` varchar(120) DEFAULT NULL,
  `title` varchar(180) NOT NULL,
  `description` text,
  `status` varchar(30) NOT NULL DEFAULT 'draft',
  `question_count` int NOT NULL DEFAULT '0',
  `visibility_level` varchar(40) NOT NULL DEFAULT 'restricted',
  `version_number` int NOT NULL DEFAULT '1',
  `published_at` datetime DEFAULT NULL,
  `created_by_user_id` varchar(36) NOT NULL,
  `updated_by_user_id` varchar(36) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_cycle_reviewee_relationship_questionnaire` (`cycle_id`,`reviewee_person_id`,`relationship_type`,`version_number`),
  KEY `idx_questionnaires_cycle_reviewee_relationship` (`cycle_id`,`reviewee_person_id`,`relationship_type`),
  KEY `idx_questionnaires_status` (`status`),
  KEY `reviewee_person_id` (`reviewee_person_id`),
  KEY `created_by_user_id` (`created_by_user_id`),
  KEY `updated_by_user_id` (`updated_by_user_id`),
  CONSTRAINT `evaluation_questionnaires_ibfk_1` FOREIGN KEY (`cycle_id`) REFERENCES `evaluation_cycles` (`id`),
  CONSTRAINT `evaluation_questionnaires_ibfk_2` FOREIGN KEY (`reviewee_person_id`) REFERENCES `people` (`id`),
  CONSTRAINT `evaluation_questionnaires_ibfk_3` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `evaluation_questionnaires_ibfk_4` FOREIGN KEY (`updated_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_questionnaires`
--

LOCK TABLES `evaluation_questionnaires` WRITE;
/*!40000 ALTER TABLE `evaluation_questionnaires` DISABLE KEYS */;
/*!40000 ALTER TABLE `evaluation_questionnaires` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_questions`
--

DROP TABLE IF EXISTS `evaluation_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_questions` (
  `id` varchar(36) NOT NULL,
  `template_id` varchar(36) NOT NULL,
  `section_key` varchar(80) DEFAULT NULL,
  `section_title` varchar(160) DEFAULT NULL,
  `section_description` text,
  `dimension_key` varchar(60) NOT NULL,
  `dimension_title` varchar(120) NOT NULL,
  `prompt_text` text NOT NULL,
  `helper_text` text,
  `question_type` varchar(40) NOT NULL DEFAULT 'scale',
  `options_json` json DEFAULT NULL,
  `sort_order` int NOT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT '1',
  `collect_evidence_on_extreme` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `template_id` (`template_id`),
  CONSTRAINT `evaluation_questions_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `evaluation_templates` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_questions`
--

LOCK TABLES `evaluation_questions` WRITE;
/*!40000 ALTER TABLE `evaluation_questions` DISABLE KEYS */;
INSERT INTO `evaluation_questions` VALUES ('q_company_01','t1','satisfaction','Satisfacao profissional e alinhamento','Perguntas sobre orgulho de pertencimento, alinhamento estrategico e satisfacao com a experiencia profissional na empresa.','satisfaction','Orgulho de pertencer','Voce tem orgulho em dizer que trabalha na ABC Technology Group?','Considere se a empresa representa algo positivo para voce, se sente satisfacao em fazer parte dela e se recomendaria trabalhar aqui para outras pessoas.','scale',NULL,301,1,0),('q_company_02','t1','satisfaction','Satisfacao profissional e alinhamento','Perguntas sobre orgulho de pertencimento, alinhamento estrategico e satisfacao com a experiencia profissional na empresa.','satisfaction','Fatores de satisfacao','O que mais te satisfaz profissionalmente?','Considere quais aspectos do seu trabalho lhe trazem maior motivacao, realizacao e satisfacao.','multi-select','[\"home-office\", \"flexibilidade\", \"crescimento-financeiro\", \"desenvolvimento-profissional\", \"ambiente-de-trabalho\"]',302,1,0),('q_company_03','t1','satisfaction','Satisfacao profissional e alinhamento','Perguntas sobre orgulho de pertencimento, alinhamento estrategico e satisfacao com a experiencia profissional na empresa.','strategy','Metas da empresa','Os objetivos e metas da ABC Technology Group para 2026 estao bem definidos?','Reflita se voce conhece claramente as metas e prioridades da empresa para o ano, entende como elas impactam seu trabalho e se percebe uma comunicacao clara sobre esses objetivos.','scale',NULL,303,1,0),('q_company_04','t1','satisfaction','Satisfacao profissional e alinhamento','Perguntas sobre orgulho de pertencimento, alinhamento estrategico e satisfacao com a experiencia profissional na empresa.','strategy','Metas da equipe','Os objetivos e metas da sua equipe ou departamento estao bem definidos?','Avalie se voce compreende claramente as metas especificas da sua area, como elas se conectam aos objetivos gerais da empresa e se ha alinhamento entre o que e esperado e o que e comunicado.','scale',NULL,304,1,0),('q_company_05','t1','satisfaction','Satisfacao profissional e alinhamento','Perguntas sobre orgulho de pertencimento, alinhamento estrategico e satisfacao com a experiencia profissional na empresa.','strategy','Alinhamento com o trabalho diario','Os objetivos e metas da sua equipe ou departamento estao alinhados com suas atividades diarias?','Considere se suas tarefas e responsabilidades contribuem diretamente para alcancar as metas da equipe, garantindo que seu trabalho esteja conectado aos objetivos do departamento.','scale',NULL,305,1,0),('q_company_06','t1','career','Rotina, carreira e desenvolvimento','Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.','routine','Clareza sobre responsabilidades','Voce tem clareza sobre suas responsabilidades e demandas diarias?','Reflita se voce entende bem suas tarefas, prioridades e expectativas, sabendo exatamente o que precisa ser feito em seu dia a dia.','scale',NULL,306,1,0),('q_company_07','t1','career','Rotina, carreira e desenvolvimento','Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.','routine','Sobrecarga individual','Voce sente que suas demandas individuais estao te sobrecarregando?','Considere se a quantidade e complexidade das suas tarefas estao dentro da sua capacidade de execucao, sem comprometer qualidade, bem-estar ou equilibrio entre vida pessoal e profissional.','scale',NULL,307,1,0),('q_company_08','t1','career','Rotina, carreira e desenvolvimento','Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.','career','Plano de carreira','Voce tem um entendimento claro sobre o seu plano de carreira?','Reflita se voce conhece as oportunidades de crescimento e desenvolvimento dentro da empresa, os caminhos possiveis e os requisitos para avancar na sua carreira.','scale',NULL,308,1,0),('q_company_09','t1','career','Rotina, carreira e desenvolvimento','Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.','career','Satisfacao com area atual','Voce esta satisfeito em atuar na area e departamento atuais?','Considere se voce se sente motivado e realizado com as atividades e responsabilidades da sua area, e se acredita que seu trabalho contribui de forma significativa para a equipe e a empresa.','scale',NULL,309,1,0),('q_company_10','t1','career','Rotina, carreira e desenvolvimento','Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.','career','Interesse em migracao de area','Seu objetivo futuro e migrar de area ou departamento?','Reflita se voce tem interesse em desenvolver sua carreira em outra area da empresa e se busca oportunidades de aprendizado ou crescimento em funcoes diferentes da atual.','scale',NULL,310,1,0),('q_company_11','t1','career','Rotina, carreira e desenvolvimento','Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.','career','Clareza sobre competencias a desenvolver','Voce sabe quais habilidades e competencias precisa desenvolver para crescer profissionalmente?','Considere se voce tem clareza sobre as capacidades e conhecimentos necessarios para avancar na carreira e se conhece os caminhos ou recursos disponiveis para seu desenvolvimento.','scale',NULL,311,1,0),('q_company_12','t1','career','Rotina, carreira e desenvolvimento','Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.','career','Competencias a desenvolver','Quais habilidades e competencias voce precisa desenvolver para crescer profissionalmente? Se nao souber, informe qual e sua duvida sobre o assunto.','Use este espaco para identificar as areas em que deseja se desenvolver ou esclarecer duvidas sobre as competencias necessarias para avancar na sua carreira.','text',NULL,312,1,0),('q_company_13','t1','career','Rotina, carreira e desenvolvimento','Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.','development','Ciencia sobre cursos do departamento','Voce tem ciencia de que a empresa disponibiliza cursos voltados ao seu departamento?','Reflita se voce conhece os treinamentos e cursos oferecidos pela empresa que podem contribuir para o seu desenvolvimento profissional e aprimoramento das habilidades relacionadas a sua funcao.','scale',NULL,313,1,0),('q_company_14','t1','career','Rotina, carreira e desenvolvimento','Perguntas sobre clareza de responsabilidades, plano de carreira, interesses de crescimento e desenvolvimento profissional.','development','Interesse em cursos de outras areas','Voce tem interesse em participar de cursos oferecidos pela empresa em areas de conhecimento diferentes da sua?','Considere se voce gostaria de ampliar seus conhecimentos e habilidades em outras areas, explorando novas oportunidades de aprendizado e desenvolvimento profissional.','scale',NULL,314,1,0),('q_company_15','t1','experience','Realizacao, reconhecimento e recursos','Perguntas sobre realizacao profissional, reconhecimento, recursos e ferramentas disponiveis para o trabalho.','experience','Realizacao profissional','Voce se sente realizado profissionalmente?','Reflita sobre seu nivel de satisfacao com suas conquistas, crescimento, reconhecimento e impacto do seu trabalho dentro da empresa.','scale',NULL,315,1,0),('q_company_16','t1','experience','Realizacao, reconhecimento e recursos','Perguntas sobre realizacao profissional, reconhecimento, recursos e ferramentas disponiveis para o trabalho.','experience','Motivacao com metas e prazos','Voce se sente realizado quando seu trabalho exige metas e prazos para entrega?','Considere se trabalhar com objetivos claros e prazos desafiadores aumenta sua motivacao, engajamento e sensacao de conquista profissional.','scale',NULL,316,1,0),('q_company_17','t1','experience','Realizacao, reconhecimento e recursos','Perguntas sobre realizacao profissional, reconhecimento, recursos e ferramentas disponiveis para o trabalho.','recognition','Reconhecimento pelos colegas','Voce sente que seu trabalho e reconhecido e valorizado por seus colegas de departamento?','Reflita se seus esforcos e contribuicoes sao percebidos e apreciados pelos colegas, promovendo um ambiente de respeito, colaboracao e motivacao.','scale',NULL,317,1,0),('q_company_18','t1','experience','Realizacao, reconhecimento e recursos','Perguntas sobre realizacao profissional, reconhecimento, recursos e ferramentas disponiveis para o trabalho.','recognition','Reconhecimento pela lideranca','Voce sente que seu trabalho e reconhecido e valorizado pelo seu lider?','Considere se seu lider reconhece suas entregas, esforcos e resultados, oferecendo feedbacks ou incentivos que reforcem sua motivacao e engajamento.','scale',NULL,318,1,0),('q_company_19','t1','experience','Realizacao, reconhecimento e recursos','Perguntas sobre realizacao profissional, reconhecimento, recursos e ferramentas disponiveis para o trabalho.','resources','Acessos e recursos','Voce tem a sua disposicao os recursos e acessos necessarios para desempenhar suas funcoes de forma eficiente?','Considere se voce possui os acessos a sistemas, informacoes e dados essenciais para realizar suas tarefas de forma completa e eficiente.','scale',NULL,319,1,0),('q_company_20','t1','experience','Realizacao, reconhecimento e recursos','Perguntas sobre realizacao profissional, reconhecimento, recursos e ferramentas disponiveis para o trabalho.','resources','Ferramentas e materiais','Voce tem a sua disposicao as ferramentas e materiais necessarios para desempenhar suas funcoes de forma eficiente?','Reflita se voce conta com os equipamentos, softwares, materiais e demais recursos fisicos ou digitais necessarios para realizar suas tarefas com qualidade e produtividade.','scale',NULL,320,1,0),('q_company_21','t1','experience','Realizacao, reconhecimento e recursos','Perguntas sobre realizacao profissional, reconhecimento, recursos e ferramentas disponiveis para o trabalho.','resources','Sugestoes de melhoria para recursos','Deixe uma sugestao de como melhorar os recursos e ferramentas disponiveis para seu trabalho.','Use este espaco para indicar ideias ou melhorias que poderiam tornar seus recursos, equipamentos ou ferramentas mais eficientes e adequados as suas necessidades.','text',NULL,321,1,0),('q_company_22','t1','final','Consideracoes Finais','Espaco final para autoavaliacao do periodo e sugestoes de melhoria para a empresa.','final-comments','Desempenho profissional no periodo','Descreva como voce avalia seu desempenho profissional ate 03/2026.','Reflita sobre suas entregas, resultados e evolucao ate o momento, destacando conquistas, desafios superados e aprendizados obtidos no periodo.','text',NULL,322,1,0),('q_company_23','t1','final','Consideracoes Finais','Espaco final para autoavaliacao do periodo e sugestoes de melhoria para a empresa.','final-comments','Sugestoes gerais','Deixe aqui sua sugestao! Pode ser sobre cursos do seu interesse, melhorias nos processos das suas atividades, melhoria na comunicacao da empresa, etc.','Use este espaco para compartilhar ideias, opinioes ou propostas que possam contribuir para seu desenvolvimento, para a eficiencia do trabalho ou para melhorar o ambiente e a comunicacao na empresa.','text',NULL,323,1,0),('q_cross_01','t_cross','organizational-collaboration','Colaboracao organizacional','Considere apenas o que e perceptivel na convivencia organizacional e nas interacoes entre times.','organizational-collaboration','Disposicao para colaborar','Demonstra disposicao para colaborar quando necessario','','scale',NULL,231,1,0),('q_cross_02','t_cross','organizational-collaboration','Colaboracao organizacional','Considere apenas o que e perceptivel na convivencia organizacional e nas interacoes entre times.','organizational-collaboration','Acessibilidade entre times','E acessivel e aberto a interacoes com outros times','','scale',NULL,232,1,0),('q_cross_03','t_cross','communication','Comunicacao','Avalie apenas sinais observaveis em reunioes, chats e interacoes compartilhadas.','communication','Clareza em ambientes compartilhados','Comunica-se de forma clara em ambientes compartilhados (reunioes, chats, etc.)','','scale',NULL,233,1,0),('q_cross_04','t_cross','communication','Comunicacao','Avalie apenas sinais observaveis em reunioes, chats e interacoes compartilhadas.','communication','Respeito na comunicacao','Demonstra respeito na comunicacao com outros','','scale',NULL,234,1,0),('q_cross_05','t_cross','professional-posture','Postura profissional','Considere o comportamento percebido no ambiente profissional e institucional.','professional-posture','Comportamento profissional','Demonstra comportamento profissional adequado','','scale',NULL,235,1,0),('q_cross_06','t_cross','professional-posture','Postura profissional','Considere o comportamento percebido no ambiente profissional e institucional.','professional-posture','Etica e respeito','Age com etica e respeito no ambiente de trabalho','','scale',NULL,236,1,0),('q_cross_07','t_cross','culture','Atitude e cultura','Observe a contribuicao geral para o clima e para a cultura da organizacao.','culture','Ambiente positivo','Contribui para um ambiente de trabalho positivo','','scale',NULL,237,1,0),('q_cross_08','t_cross','culture','Atitude e cultura','Observe a contribuicao geral para o clima e para a cultura da organizacao.','culture','Atitude colaborativa organizacional','Demonstra atitude colaborativa com a organizacao como um todo','','scale',NULL,238,1,0),('q_cross_09','t_cross','visible-proactivity','Proatividade perceptivel','Considere apenas iniciativas observaveis em interacoes institucionais ou entre areas.','visible-proactivity','Iniciativa observavel','Demonstra iniciativa em interacoes organizacionais (reunioes, discussoes, etc.)','','scale',NULL,239,1,0),('q_cross_10','t_cross','visible-proactivity','Proatividade perceptivel','Considere apenas iniciativas observaveis em interacoes institucionais ou entre areas.','visible-proactivity','Engajamento perceptivel','Parece engajado com o trabalho e com a empresa','','scale',NULL,240,1,0),('q_cross_11','t_cross','open-feedback','Perguntas abertas','Use este espaco com base apenas na sua percepcao geral e em sinais observados no contexto organizacional.','open-feedback','Pontos fortes percebidos','Com base na sua percepcao geral, quais sao os principais pontos fortes deste colaborador?','','text',NULL,241,1,0),('q_cross_12','t_cross','open-feedback','Perguntas abertas','Use este espaco com base apenas na sua percepcao geral e em sinais observados no contexto organizacional.','open-feedback','Comportamentos a melhorar','Ha algum comportamento que poderia ser melhorado?','','text',NULL,242,1,0),('q_cross_13','t_cross','open-feedback','Perguntas abertas','Use este espaco com base apenas na sua percepcao geral e em sinais observados no contexto organizacional.','open-feedback','Conforto de trabalho direto','Voce se sentiria confortavel trabalhando diretamente com essa pessoa? Por que?','','text',NULL,243,1,0),('q_cross_14','t_cross','open-feedback','Perguntas abertas','Use este espaco com base apenas na sua percepcao geral e em sinais observados no contexto organizacional.','open-feedback','Destaque positivo','Existe algo positivo que voce observou e que merece destaque?','','text',NULL,244,1,0),('q_leader_01','t1','results','Gestao de Resultados e Organizacao','Avalie se seu lider define metas claras, organiza tarefas, acompanha o progresso da equipe e garante entregas de qualidade e no prazo.','results','Metas claras','1) Meu lider define metas claras e alcancaveis para a equipe.','Avalie se o lider estabelece objetivos claros e realistas para todos.','scale',NULL,201,1,0),('q_leader_02','t1','results','Gestao de Resultados e Organizacao','Avalie se seu lider define metas claras, organiza tarefas, acompanha o progresso da equipe e garante entregas de qualidade e no prazo.','results','Distribuicao de tarefas','2) Meu lider organiza e distribui tarefas de forma eficiente.','Considere se ele distribui responsabilidades de forma equilibrada e organizada.','scale',NULL,202,1,0),('q_leader_03','t1','results','Gestao de Resultados e Organizacao','Avalie se seu lider define metas claras, organiza tarefas, acompanha o progresso da equipe e garante entregas de qualidade e no prazo.','results','Acompanhamento do progresso','3) Meu lider acompanha o progresso da equipe e ajusta quando necessario.','Reflita sobre o acompanhamento das atividades e a capacidade de corrigir desvios.','scale',NULL,203,1,0),('q_leader_04','t1','results','Gestao de Resultados e Organizacao','Avalie se seu lider define metas claras, organiza tarefas, acompanha o progresso da equipe e garante entregas de qualidade e no prazo.','results','Qualidade e prazo','4) Meu lider assegura que as entregas da equipe atendam aos padroes de qualidade e prazo.','Avalie se ele garante que o trabalho seja consistente e entregue no tempo esperado.','scale',NULL,204,1,0),('q_leader_05','t1','development','Desenvolvimento da Equipe','Considere como ele identifica oportunidades de crescimento, oferece feedbacks, incentiva aprendizado e apoia o desenvolvimento dos colaboradores.','development','Oportunidades por colaborador','5) Meu lider identifica oportunidades de desenvolvimento para cada membro da equipe.','Considere se ele percebe o potencial e necessidades de crescimento de cada colaborador.','scale',NULL,205,1,0),('q_leader_06','t1','development','Desenvolvimento da Equipe','Considere como ele identifica oportunidades de crescimento, oferece feedbacks, incentiva aprendizado e apoia o desenvolvimento dos colaboradores.','development','Feedback regular e claro','6) Recebo feedbacks regulares, claros e construtivos do meu lider.','Reflita se ele oferece orientacoes frequentes e uteis para seu desenvolvimento.','scale',NULL,206,1,0),('q_leader_07','t1','development','Desenvolvimento da Equipe','Considere como ele identifica oportunidades de crescimento, oferece feedbacks, incentiva aprendizado e apoia o desenvolvimento dos colaboradores.','development','Incentivo ao aprendizado','7) Meu lider incentiva o aprendizado continuo e aprimoramento das habilidades da equipe.','Avalie se ele promove treinamentos e oportunidades de crescimento.','scale',NULL,207,1,0),('q_leader_08','t1','development','Desenvolvimento da Equipe','Considere como ele identifica oportunidades de crescimento, oferece feedbacks, incentiva aprendizado e apoia o desenvolvimento dos colaboradores.','development','Apoio personalizado ao crescimento','8) Meu lider apoia o crescimento profissional dos colaboradores, respeitando seus interesses e potencial.','Considere se ele orienta o desenvolvimento da equipe de forma personalizada.','scale',NULL,208,1,0),('q_leader_09','t1','communication','Comunicacao e Relacionamento','Reflita sobre a clareza da comunicacao do lider, escuta ativa, promocao de colaboracao e habilidade de lidar com conflitos.','communication','Comunicacao clara','9) Meu lider se comunica de forma clara, assertiva e transparente.','Reflita sobre a clareza das informacoes e instrucoes recebidas.','scale',NULL,209,1,0),('q_leader_10','t1','communication','Comunicacao e Relacionamento','Reflita sobre a clareza da comunicacao do lider, escuta ativa, promocao de colaboracao e habilidade de lidar com conflitos.','communication','Escuta e valorizacao da equipe','10) Meu lider escuta e valoriza opinioes e ideias da equipe.','Avalie se ele da espaco para sua participacao e respeita suas contribuicoes.','scale',NULL,210,1,0),('q_leader_11','t1','communication','Comunicacao e Relacionamento','Reflita sobre a clareza da comunicacao do lider, escuta ativa, promocao de colaboracao e habilidade de lidar com conflitos.','trust','Colaboracao, respeito e confianca','11) Meu lider promove um ambiente de colaboracao, respeito e confianca.','Considere se ele incentiva trabalho em equipe e cria um clima seguro.','scale',NULL,211,1,0),('q_leader_12','t1','communication','Comunicacao e Relacionamento','Reflita sobre a clareza da comunicacao do lider, escuta ativa, promocao de colaboracao e habilidade de lidar com conflitos.','trust','Conflitos e divergencias','12) Meu lider lida de forma construtiva com conflitos ou divergencias na equipe.','Reflita sobre sua capacidade de resolver problemas de relacionamento e divergencias.','scale',NULL,212,1,0),('q_leader_13','t1','engagement','Engajamento e Motivacao','Avalie se ele demonstra comprometimento, inspira a equipe, reconhece esforcos e cria um ambiente de trabalho positivo.','engagement','Comprometimento com objetivos','13) Meu lider demonstra comprometimento com os objetivos da empresa e da equipe.','Avalie se ele se envolve ativamente nos resultados e metas da equipe.','scale',NULL,213,1,0),('q_leader_14','t1','engagement','Engajamento e Motivacao','Avalie se ele demonstra comprometimento, inspira a equipe, reconhece esforcos e cria um ambiente de trabalho positivo.','engagement','Inspiracao e motivacao','14) Meu lider inspira e motiva a equipe a se empenhar nas atividades.','Considere se ele incentiva engajamento, entusiasmo e participacao da equipe.','scale',NULL,214,1,0),('q_leader_15','t1','engagement','Engajamento e Motivacao','Avalie se ele demonstra comprometimento, inspira a equipe, reconhece esforcos e cria um ambiente de trabalho positivo.','engagement','Reconhecimento de conquistas','15) Meu lider reconhece e valoriza conquistas e esforcos individuais e coletivos.','Reflita se ele oferece reconhecimento adequado aos colaboradores.','scale',NULL,215,1,0),('q_leader_16','t1','engagement','Engajamento e Motivacao','Avalie se ele demonstra comprometimento, inspira a equipe, reconhece esforcos e cria um ambiente de trabalho positivo.','engagement','Ambiente positivo e inclusivo','16) Meu lider promove um ambiente de trabalho positivo, inclusivo e engajador.','Avalie se ele contribui para um clima motivador, seguro e produtivo.','scale',NULL,216,1,0),('q_leader_17','t1','strategy','Visao Estrategica e Autodesenvolvimento','Considere sua capacidade de tomar decisoes estrategicas, buscar aprendizado continuo e equilibrar orientacao e autonomia da equipe.','strategy','Decisao estrategica','17) Meu lider demonstra capacidade de tomar decisoes estrategicas e alinhadas aos objetivos da empresa.','Considere se ele consegue tomar decisoes adequadas e consistentes com a estrategia da empresa.','scale',NULL,217,1,0),('q_leader_18','t1','strategy','Visao Estrategica e Autodesenvolvimento','Considere sua capacidade de tomar decisoes estrategicas, buscar aprendizado continuo e equilibrar orientacao e autonomia da equipe.','strategy','Autodesenvolvimento da lideranca','18) Meu lider esta atento as proprias oportunidades de desenvolvimento e aprimoramento como lider.','Avalie se ele busca evoluir continuamente em suas competencias de gestao.','scale',NULL,218,1,0),('q_leader_19','t1','strategy','Visao Estrategica e Autodesenvolvimento','Considere sua capacidade de tomar decisoes estrategicas, buscar aprendizado continuo e equilibrar orientacao e autonomia da equipe.','strategy','Aprendizado continuo','19) Meu lider busca aprendizado continuo sobre gestao, lideranca e boas praticas.','Reflita se ele se mantem atualizado e procura se aprimorar constantemente.','scale',NULL,219,1,0),('q_leader_20','t1','strategy','Visao Estrategica e Autodesenvolvimento','Considere sua capacidade de tomar decisoes estrategicas, buscar aprendizado continuo e equilibrar orientacao e autonomia da equipe.','strategy','Equilibrio entre orientacao e autonomia','20) Meu lider equilibra orientacao e autonomia, permitindo que a equipe trabalhe com confianca e responsabilidade.','Considere se ele delega adequadamente, dando suporte sem sobrecarregar ou restringir a equipe.','scale',NULL,220,1,0),('q_leader_21','t1','final','Consideracoes Finais','Espaco para voce registrar comentarios, feedbacks ou sugestoes adicionais que considere importantes.','final-comments','Sugestoes e observacoes','Escreva aqui suas sugestoes, ideias de melhoria, observacoes sobre processos, comunicacao, recursos, desenvolvimento da equipe, lideranca ou qualquer outro ponto relevante para aprimorar seu trabalho, sua equipe ou a empresa.','','text',NULL,221,1,0),('q_manager_01','t_manager','results','Resultados','Avalie consistencia de entrega, qualidade e responsabilizacao pelos resultados.','results','Cumprimento de prazos','Cumpre prazos e entregas com consistencia','','scale',NULL,181,1,0),('q_manager_02','t_manager','results','Resultados','Avalie consistencia de entrega, qualidade e responsabilizacao pelos resultados.','results','Qualidade das entregas','Entrega trabalho com qualidade adequada','','scale',NULL,182,1,0),('q_manager_03','t_manager','results','Resultados','Avalie consistencia de entrega, qualidade e responsabilizacao pelos resultados.','results','Responsabilidade pelos resultados','Assume responsabilidade pelos resultados','','scale',NULL,183,1,0),('q_manager_04','t_manager','teamwork','Trabalho em equipe','Considere colaboracao, convivencia profissional e contribuicao para o ambiente da equipe.','teamwork','Colaboracao com a equipe','Colabora de forma efetiva com a equipe','','scale',NULL,184,1,0),('q_manager_05','t_manager','teamwork','Trabalho em equipe','Considere colaboracao, convivencia profissional e contribuicao para o ambiente da equipe.','teamwork','Respeito e ambiente positivo','Demonstra respeito e contribui para um ambiente positivo','','scale',NULL,185,1,0),('q_manager_06','t_manager','communication','Comunicacao','Avalie clareza, objetividade e transparencia do colaborador na comunicacao do trabalho.','communication','Comunicacao clara','Comunica-se de forma clara e objetiva','','scale',NULL,186,1,0),('q_manager_07','t_manager','communication','Comunicacao','Avalie clareza, objetividade e transparencia do colaborador na comunicacao do trabalho.','communication','Alinhamento com o gestor','Mantem o gestor informado sobre o andamento das atividades','','scale',NULL,187,1,0),('q_manager_08','t_manager','proactivity','Proatividade','Considere iniciativa, autonomia e contribuicao do colaborador diante de desafios.','proactivity','Resolucao de problemas','Demonstra iniciativa na resolucao de problemas','','scale',NULL,188,1,0),('q_manager_09','t_manager','proactivity','Proatividade','Considere iniciativa, autonomia e contribuicao do colaborador diante de desafios.','proactivity','Melhorias e novas ideias','Propoe melhorias e novas ideias','','scale',NULL,189,1,0),('q_manager_10','t_manager','organization','Organizacao','Avalie capacidade de planejamento, priorizacao e tratamento de volume de trabalho.','organization','Organizacao de tarefas','Organiza bem suas tarefas e prioridades','','scale',NULL,190,1,0),('q_manager_11','t_manager','organization','Organizacao','Avalie capacidade de planejamento, priorizacao e tratamento de volume de trabalho.','organization','Multiplas demandas','Consegue lidar com multiplas demandas','','scale',NULL,191,1,0),('q_manager_12','t_manager','technical-capability','Capacidade tecnica','Considere dominio tecnico, autonomia e resolucao de problemas na funcao atual.','technical-capability','Conhecimento tecnico','Possui conhecimento tecnico adequado para a funcao','','scale',NULL,192,1,0),('q_manager_13','t_manager','technical-capability','Capacidade tecnica','Considere dominio tecnico, autonomia e resolucao de problemas na funcao atual.','technical-capability','Autonomia tecnica','Resolve problemas com autonomia','','scale',NULL,193,1,0),('q_manager_14','t_manager','business-focus','Foco no negocio','Avalie entendimento do contexto de negocio e priorizacao do que gera mais valor.','business-focus','Impacto no negocio','Entende o impacto do seu trabalho no negocio','','scale',NULL,194,1,0),('q_manager_15','t_manager','business-focus','Foco no negocio','Avalie entendimento do contexto de negocio e priorizacao do que gera mais valor.','business-focus','Prioridade de valor','Prioriza atividades de maior valor','','scale',NULL,195,1,0),('q_manager_16','t_manager','overall','Avaliacao geral','Registre a leitura geral do desempenho atual e do potencial de crescimento do colaborador.','overall','Desempenho geral','Desempenho geral do colaborador','','scale',NULL,196,1,0),('q_manager_17','t_manager','overall','Avaliacao geral','Registre a leitura geral do desempenho atual e do potencial de crescimento do colaborador.','overall','Potencial de crescimento','Potencial de crescimento','','scale',NULL,197,1,0),('q_manager_18','t_manager','open-feedback','Perguntas abertas','Registre uma leitura qualitativa para orientar a devolutiva e o desenvolvimento do colaborador.','open-feedback','Pontos fortes','Quais sao os principais pontos fortes do colaborador?','','text',NULL,198,1,0),('q_manager_19','t_manager','open-feedback','Perguntas abertas','Registre uma leitura qualitativa para orientar a devolutiva e o desenvolvimento do colaborador.','open-feedback','Pontos de melhoria','Quais sao os principais pontos de melhoria?','','text',NULL,199,1,0),('q_manager_20','t_manager','open-feedback','Perguntas abertas','Registre uma leitura qualitativa para orientar a devolutiva e o desenvolvimento do colaborador.','open-feedback','Recomendacao de desenvolvimento','Que tipo de desenvolvimento voce recomenda?','','text',NULL,200,1,0),('q_self_01','t1','delivery','Desempenho e Entregas','Avalie como voce cumpre prazos, organiza tarefas, mantem a qualidade das entregas e resolve problemas no dia a dia.','delivery','Cumprimento de prazos','1) Cumpro minhas tarefas e entregas dentro dos prazos estabelecidos.','Avalie se voce consegue concluir suas atividades dentro do tempo esperado.','scale',NULL,101,1,0),('q_self_02','t1','delivery','Desempenho e Entregas','Avalie como voce cumpre prazos, organiza tarefas, mantem a qualidade das entregas e resolve problemas no dia a dia.','delivery','Qualidade e precisao','2) Minhas atividades sao realizadas com atencao a qualidade e precisao.','Considere se voce entrega trabalhos com cuidado e atencao aos detalhes.','scale',NULL,102,1,0),('q_self_03','t1','delivery','Desempenho e Entregas','Avalie como voce cumpre prazos, organiza tarefas, mantem a qualidade das entregas e resolve problemas no dia a dia.','delivery','Resolucao de problemas','3) Consigo lidar eficientemente com problemas ou obstaculos que surgem no trabalho.','Reflita se voce consegue encontrar solucoes ou alternativas quando surgem dificuldades.','scale',NULL,103,1,0),('q_self_04','t1','delivery','Desempenho e Entregas','Avalie como voce cumpre prazos, organiza tarefas, mantem a qualidade das entregas e resolve problemas no dia a dia.','delivery','Organizacao e priorizacao','4) Procuro organizar minhas tarefas para otimizar resultados e tempo.','Considere se voce planeja e prioriza bem suas atividades diarias.','scale',NULL,104,1,0),('q_self_05','t1','knowledge','Conhecimento e Desenvolvimento','Considere seu dominio tecnico, capacidade de aprendizado, aplicacao pratica de conhecimentos e abertura a feedbacks.','knowledge','Dominio tecnico','5) Tenho dominio adequado dos conhecimentos tecnicos necessarios para meu trabalho.','Reflita sobre seu nivel de conhecimento tecnico para desempenhar suas funcoes com eficiencia.','scale',NULL,105,1,0),('q_self_06','t1','knowledge','Conhecimento e Desenvolvimento','Considere seu dominio tecnico, capacidade de aprendizado, aplicacao pratica de conhecimentos e abertura a feedbacks.','development','Aprendizado continuo','6) Busco aprender constantemente e desenvolver novas habilidades.','Considere se voce procura oportunidades para aprimorar competencias e conhecimentos.','scale',NULL,106,1,0),('q_self_07','t1','knowledge','Conhecimento e Desenvolvimento','Considere seu dominio tecnico, capacidade de aprendizado, aplicacao pratica de conhecimentos e abertura a feedbacks.','development','Aplicacao pratica','7) Consigo aplicar de forma pratica o que aprendi em treinamentos, cursos ou experiencias anteriores.','Avalie se consegue utilizar os aprendizados adquiridos no dia a dia.','scale',NULL,107,1,0),('q_self_08','t1','knowledge','Conhecimento e Desenvolvimento','Considere seu dominio tecnico, capacidade de aprendizado, aplicacao pratica de conhecimentos e abertura a feedbacks.','development','Abertura a feedbacks','8) Estou aberto a feedbacks e procuro utiliza-los para melhorar meu desempenho.','Reflita sobre sua receptividade a orientacoes e sugestoes de melhoria.','scale',NULL,108,1,0),('q_self_09','t1','teamwork','Trabalho em Equipe e Colaboracao','Reflita sobre sua contribuicao a equipe, compartilhamento de conhecimentos, comunicacao e resolucao de conflitos.','collaboration','Colaboracao com a equipe','9) Colaboro de forma produtiva com meus colegas de equipe.','Considere se voce contribui positivamente para o trabalho coletivo.','scale',NULL,109,1,0),('q_self_10','t1','teamwork','Trabalho em Equipe e Colaboracao','Reflita sobre sua contribuicao a equipe, compartilhamento de conhecimentos, comunicacao e resolucao de conflitos.','collaboration','Compartilhamento de conhecimentos','10) Compartilho conhecimentos e experiencias que ajudam o desempenho da equipe.','Avalie se voce divide informacoes que beneficiam o grupo.','scale',NULL,110,1,0),('q_self_11','t1','teamwork','Trabalho em Equipe e Colaboracao','Reflita sobre sua contribuicao a equipe, compartilhamento de conhecimentos, comunicacao e resolucao de conflitos.','communication','Comunicacao clara e respeitosa','11) Mantenho uma comunicacao clara e respeitosa com colegas e stakeholders.','Reflita se voce se comunica de forma efetiva e adequada.','scale',NULL,111,1,0),('q_self_12','t1','teamwork','Trabalho em Equipe e Colaboracao','Reflita sobre sua contribuicao a equipe, compartilhamento de conhecimentos, comunicacao e resolucao de conflitos.','interpersonal','Conflitos e divergencias','12) Consigo lidar de forma construtiva com conflitos ou divergencias de opiniao.','Considere se voce consegue resolver conflitos mantendo o respeito e equilibrio.','scale',NULL,112,1,0),('q_self_13','t1','commitment','Comprometimento e Responsabilidade','Avalie seu comprometimento com metas e objetivos, responsabilidade pelas tarefas e capacidade de perseverar diante de desafios.','commitment','Comprometimento com objetivos','13) Demonstro comprometimento com os objetivos da equipe e da empresa.','Avalie se voce se envolve e se dedica as metas da equipe e da organizacao.','scale',NULL,113,1,0),('q_self_14','t1','commitment','Comprometimento e Responsabilidade','Avalie seu comprometimento com metas e objetivos, responsabilidade pelas tarefas e capacidade de perseverar diante de desafios.','responsibility','Responsabilidade por resultados','14) Assumo responsabilidade por minhas tarefas e resultados.','Reflita se voce reconhece sua participacao nos resultados positivos e negativos.','scale',NULL,114,1,0),('q_self_15','t1','commitment','Comprometimento e Responsabilidade','Avalie seu comprometimento com metas e objetivos, responsabilidade pelas tarefas e capacidade de perseverar diante de desafios.','responsibility','Conformidade com regras','15) Cumpro regras, normas e procedimentos da empresa com consistencia.','Considere se voce segue politicas e praticas da empresa de forma confiavel.','scale',NULL,115,1,0),('q_self_16','t1','growth','Potencial e Crescimento','Considere sua iniciativa, interesse em assumir novas responsabilidades, oportunidades de desenvolvimento e autonomia no trabalho.','growth','Perseveranca diante de desafios','16) Me esforco para superar desafios e atingir metas mesmo diante de dificuldades.','Avalie se voce persevera para alcancar resultados, mesmo com obstaculos.','scale',NULL,116,1,0),('q_self_17','t1','growth','Potencial e Crescimento','Considere sua iniciativa, interesse em assumir novas responsabilidades, oportunidades de desenvolvimento e autonomia no trabalho.','growth','Novos desafios','17) Tenho interesse em assumir novas responsabilidades e desafios profissionais.','Reflita sobre sua disposicao para assumir tarefas maiores ou mais complexas.','scale',NULL,117,1,0),('q_self_18','t1','growth','Potencial e Crescimento','Considere sua iniciativa, interesse em assumir novas responsabilidades, oportunidades de desenvolvimento e autonomia no trabalho.','growth','Busca de crescimento','18) Busco oportunidades de crescimento e desenvolvimento dentro da empresa.','Considere se voce procura se desenvolver e evoluir na carreira.','scale',NULL,118,1,0),('q_self_19','t1','growth','Potencial e Crescimento','Considere sua iniciativa, interesse em assumir novas responsabilidades, oportunidades de desenvolvimento e autonomia no trabalho.','initiative','Iniciativa para melhorias','19) Demonstro iniciativa para propor melhorias ou solucoes inovadoras em meu trabalho.','Avalie se voce sugere ideias ou melhorias para processos ou resultados.','scale',NULL,119,1,0),('q_self_20','t1','growth','Potencial e Crescimento','Considere sua iniciativa, interesse em assumir novas responsabilidades, oportunidades de desenvolvimento e autonomia no trabalho.','autonomy','Autonomia no dia a dia','20) Sinto-me capaz de lidar de forma autonoma com minhas atividades e decisoes diarias.','Reflita sobre sua capacidade de atuar de forma independente, mantendo resultados satisfatorios.','scale',NULL,120,1,0),('q_self_21','t1','final','Consideracoes Finais','Espaco para voce registrar comentarios, feedbacks ou sugestoes adicionais que considere importantes.','final-comments','Sugestoes e observacoes','Escreva aqui suas sugestoes, ideias de melhoria, observacoes sobre processos, comunicacao, recursos, desenvolvimento da equipe, lideranca ou qualquer outro ponto relevante para aprimorar seu trabalho, sua equipe ou a empresa.','','text',NULL,121,1,0),('q1','t1',NULL,NULL,NULL,'delivery','Qualidade das Entregas','Quao satisfeito voce ficou com a qualidade das entregas feitas por esta pessoa?',NULL,'scale',NULL,1,1,0),('q10','t1',NULL,NULL,NULL,'wellbeing','Experiencia no Trabalho','Quao satisfeito voce esta com sua experiencia geral de trabalho no periodo?',NULL,'scale',NULL,10,1,0),('q11','t1',NULL,NULL,NULL,'leadership','Clareza de Direcao','Quao satisfeito voce esta com a clareza de direcionamento e prioridades dadas pela lideranca?',NULL,'scale',NULL,11,1,0),('q12','t1',NULL,NULL,NULL,'support','Suporte e Acessibilidade','Quao satisfeito voce esta com a disponibilidade da lideranca para apoiar o time?',NULL,'scale',NULL,12,1,0),('q13','t1',NULL,NULL,NULL,'development','Desenvolvimento da Equipe','Quao satisfeito voce esta com o incentivo ao desenvolvimento profissional dado pela lideranca?',NULL,'scale',NULL,13,1,0),('q14','t1',NULL,NULL,NULL,'trust','Confianca e Ambiente','Quao satisfeito voce esta com a forma como a lideranca promove um ambiente respeitoso e confiavel?',NULL,'scale',NULL,14,1,0),('q15','t1',NULL,NULL,NULL,'culture','Cultura e Valores','Quao satisfeito voce esta com a cultura e os valores praticados pela empresa?',NULL,'scale',NULL,15,1,0),('q16','t1',NULL,NULL,NULL,'communication','Comunicacao Institucional','Quao satisfeito voce esta com a transparencia e a comunicacao da empresa?',NULL,'scale',NULL,16,1,0),('q17','t1',NULL,NULL,NULL,'resources','Estrutura e Recursos','Quao satisfeito voce esta com os recursos e a estrutura oferecidos para seu trabalho?',NULL,'scale',NULL,17,1,0),('q18','t1',NULL,NULL,NULL,'experience','Experiencia Geral','Quao satisfeito voce esta com sua experiencia geral na empresa neste semestre?',NULL,'scale',NULL,18,1,0),('q2','t1',NULL,NULL,NULL,'delivery','Confiabilidade','Quao satisfeito voce ficou com a consistencia e a responsabilidade demonstradas no periodo?',NULL,'scale',NULL,2,1,0),('q3','t1',NULL,NULL,NULL,'collaboration','Colaboracao','Quao satisfeito voce ficou com a colaboracao com colegas e outras areas?',NULL,'scale',NULL,3,1,0),('q4','t1',NULL,NULL,NULL,'collaboration','Compartilhamento','Quao satisfeito voce ficou com a disposicao desta pessoa em compartilhar conhecimento e apoiar o time?',NULL,'scale',NULL,4,1,0),('q5','t1',NULL,NULL,NULL,'communication','Comunicacao','Quao satisfeito voce ficou com a clareza de comunicacao sobre prioridades, riscos e proximos passos?',NULL,'scale',NULL,5,1,0),('q6','t1',NULL,NULL,NULL,'interpersonal','Relacionamento Interpessoal','Quao satisfeito voce ficou com a postura profissional, o respeito e a capacidade de relacionamento desta pessoa?',NULL,'scale',NULL,6,1,0),('q7','t1',NULL,NULL,NULL,'self-awareness','Autopercepcao','Quao satisfeito voce esta com sua propria qualidade de entrega neste semestre?',NULL,'scale',NULL,7,1,0),('q8','t1',NULL,NULL,NULL,'development','Desenvolvimento','Quao satisfeito voce esta com sua evolucao profissional e aprendizado recente?',NULL,'scale',NULL,8,1,0),('q9','t1',NULL,NULL,NULL,'collaboration','Colaboracao','Quao satisfeito voce esta com sua contribuicao para a equipe e para parceiros internos?',NULL,'scale',NULL,9,1,0);
/*!40000 ALTER TABLE `evaluation_questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_submissions`
--

DROP TABLE IF EXISTS `evaluation_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_submissions` (
  `id` varchar(36) NOT NULL,
  `assignment_id` varchar(36) NOT NULL,
  `cycle_id` varchar(36) NOT NULL,
  `reviewer_user_id` varchar(36) NOT NULL,
  `reviewee_person_id` varchar(36) NOT NULL,
  `overall_score` decimal(4,2) NOT NULL,
  `strengths_note` text NOT NULL,
  `development_note` text NOT NULL,
  `reviewee_acknowledgement_status` varchar(30) DEFAULT NULL,
  `reviewee_acknowledgement_note` text,
  `reviewee_acknowledged_at` datetime DEFAULT NULL,
  `submitted_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `assignment_id` (`assignment_id`),
  KEY `cycle_id` (`cycle_id`),
  KEY `reviewer_user_id` (`reviewer_user_id`),
  KEY `reviewee_person_id` (`reviewee_person_id`),
  CONSTRAINT `evaluation_submissions_ibfk_1` FOREIGN KEY (`assignment_id`) REFERENCES `evaluation_assignments` (`id`),
  CONSTRAINT `evaluation_submissions_ibfk_2` FOREIGN KEY (`cycle_id`) REFERENCES `evaluation_cycles` (`id`),
  CONSTRAINT `evaluation_submissions_ibfk_3` FOREIGN KEY (`reviewer_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `evaluation_submissions_ibfk_4` FOREIGN KEY (`reviewee_person_id`) REFERENCES `people` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_submissions`
--

LOCK TABLES `evaluation_submissions` WRITE;
/*!40000 ALTER TABLE `evaluation_submissions` DISABLE KEYS */;
INSERT INTO `evaluation_submissions` VALUES ('es1','ea1','c1','u1','p2',4.17,'Boa articulacao entre frentes e consistencia nas entregas.','Pode registrar riscos com ainda mais antecedencia.',NULL,NULL,NULL,'2026-03-12 12:00:00');
/*!40000 ALTER TABLE `evaluation_submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evaluation_templates`
--

DROP TABLE IF EXISTS `evaluation_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluation_templates` (
  `id` varchar(36) NOT NULL,
  `name` varchar(160) NOT NULL,
  `description` text NOT NULL,
  `manager_custom_questions_limit` int NOT NULL DEFAULT '3',
  `scale_json` json NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluation_templates`
--

LOCK TABLES `evaluation_templates` WRITE;
/*!40000 ALTER TABLE `evaluation_templates` DISABLE KEYS */;
INSERT INTO `evaluation_templates` VALUES ('t_cross','Feedback indireto organizacional','Questionario enxuto para percepcao indireta entre areas, com foco em colaboracao, postura, cultura e sinais observaveis no ambiente organizacional.',0,'[{\"label\": \"Muito insatisfeito\", \"value\": 1}, {\"label\": \"Insatisfeito\", \"value\": 2}, {\"label\": \"Parcialmente satisfeito\", \"value\": 3}, {\"label\": \"Satisfeito\", \"value\": 4}, {\"label\": \"Muito satisfeito\", \"value\": 5}]'),('t_manager','Feedback do lider sobre o colaborador','Questionario padrao para avaliacao gerencial do colaborador, com foco em desempenho, potencial e desenvolvimento.',0,'[{\"label\": \"Muito abaixo do esperado\", \"value\": 1}, {\"label\": \"Abaixo do esperado\", \"value\": 2}, {\"label\": \"Dentro do esperado\", \"value\": 3}, {\"label\": \"Acima do esperado\", \"value\": 4}, {\"label\": \"Muito acima do esperado\", \"value\": 5}]'),('t1','Feedback de Colaboracao','Biblioteca padrao para feedback entre pares, lideranca direta e colaboracoes cruzadas.',3,'[{\"label\": \"Muito insatisfeito\", \"value\": 1}, {\"label\": \"Insatisfeito\", \"value\": 2}, {\"label\": \"Parcialmente satisfeito\", \"value\": 3}, {\"label\": \"Satisfeito\", \"value\": 4}, {\"label\": \"Muito satisfeito\", \"value\": 5}]');
/*!40000 ALTER TABLE `evaluation_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `incident_evidences`
--

DROP TABLE IF EXISTS `incident_evidences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `incident_evidences` (
  `id` varchar(36) NOT NULL,
  `incident_id` varchar(36) NOT NULL,
  `file_name` varchar(180) NOT NULL,
  `mime_type` varchar(120) NOT NULL,
  `size_bytes` int NOT NULL,
  `content_blob` longblob NOT NULL,
  `uploaded_by_user_id` varchar(36) DEFAULT NULL,
  `uploaded_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_incident_evidences_incident` (`incident_id`),
  KEY `uploaded_by_user_id` (`uploaded_by_user_id`),
  CONSTRAINT `incident_evidences_ibfk_1` FOREIGN KEY (`incident_id`) REFERENCES `incident_reports` (`id`),
  CONSTRAINT `incident_evidences_ibfk_2` FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `incident_evidences`
--

LOCK TABLES `incident_evidences` WRITE;
/*!40000 ALTER TABLE `incident_evidences` DISABLE KEYS */;
INSERT INTO `incident_evidences` VALUES ('evidence_1yorqt3h','incident_ujv9xqov','homologacao-onda2-evidencia-1785857918474.txt','text/plain',39,_binary 'Evidencia funcional completa da Onda 2.','user_tmtq1fjp','2026-08-04 15:38:53'),('evidence_fjvp2ztj','incident_4t9y5xio','homologacao-evidencia.txt','text/plain',32,_binary 'Evidencia operacional da Onda 2.','u5','2026-08-04 15:19:32'),('evidence_usr5snam','incident_g4t1tckp','homologacao-onda2-evidencia-1785857987057.txt','text/plain',39,_binary 'Evidencia funcional completa da Onda 2.','user_nav4x9yo','2026-08-04 15:39:56');
/*!40000 ALTER TABLE `incident_evidences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `incident_reports`
--

DROP TABLE IF EXISTS `incident_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `incident_reports` (
  `id` varchar(36) NOT NULL,
  `title` varchar(160) NOT NULL,
  `category` varchar(80) NOT NULL,
  `classification` varchar(80) NOT NULL,
  `status` varchar(40) NOT NULL,
  `anonymity` varchar(20) NOT NULL,
  `reporter_label` varchar(120) NOT NULL,
  `responsible_area` varchar(120) NOT NULL,
  `assigned_person_id` varchar(36) DEFAULT NULL,
  `assigned_to` varchar(120) NOT NULL,
  `created_at` datetime NOT NULL,
  `description` text NOT NULL,
  `protocol` varchar(40) DEFAULT NULL,
  `due_at` datetime DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  `closure_note` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_incident_protocol` (`protocol`),
  KEY `assigned_person_id` (`assigned_person_id`),
  CONSTRAINT `incident_reports_ibfk_1` FOREIGN KEY (`assigned_person_id`) REFERENCES `people` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `incident_reports`
--

LOCK TABLES `incident_reports` WRITE;
/*!40000 ALTER TABLE `incident_reports` DISABLE KEYS */;
INSERT INTO `incident_reports` VALUES ('i1','Conduta impropria em reuniao','Conduta Impropria','Conduta e Relacionamento','Em triagem','anonymous','Anonimo','Compliance','p6','RH Corporativo','2026-03-10 10:00:00','Relato de comentario inadequado em reuniao de area.','SC-20260310-I1',NULL,NULL,NULL),('i2','Possivel conflito de interesse em fornecedor','Conflito de interesse','Integridade e Etica','Em apuracao','identified','Canal identificado','Compliance','p7','Compliance Corporativo','2026-03-14 15:20:00','Sinalizacao de relacionamento proximo entre colaborador e fornecedor participante de cotacao.','SC-20260314-I2',NULL,NULL,NULL),('incident_4t9y5xio','HOMOLOGACAO ONDA 2 EVIDENCIA 2026-08-04T15:19:31.987Z','Conduta','Conduta e Relacionamento','Em triagem','identified','Homologacao Codex','Compliance','p7','Compliance Demo','2026-08-04 15:19:32','Caso criado para homologar anexos de evidencias da Onda 2.','SC-20260804-9Y5XIO','2026-08-11 15:19:32',NULL,''),('incident_fl0x8sa8','HOMOLOGACAO ONDA 2 INCIDENTE 20260804-114701','Conduta','Conduta e Relacionamento','Concluido','identified','Homologacao Codex','Compliance','p7','Compliance Demo','2026-08-04 14:47:02','Registro operacional criado para homologar protocolo, SLA e fechamento controlado da Onda 2.','SC-20260804-0X8SA8','2026-08-11 14:47:02','2026-08-04 14:47:03','Homologacao operacional da Onda 2 concluida com sucesso.'),('incident_g4t1tckp','HOMOLOGACAO FUNCIONAL ONDA 2 1785857987057','Conduta Impropria','Conduta e Relacionamento','Concluido','anonymous','Anonimo','Administracao','p5','Admin Plataforma Demo','2026-08-04 15:39:54','Caso criado pela homologacao funcional completa da Onda 2.','SC-20260804-T1TCKP','2026-08-11 15:39:54','2026-08-04 15:40:02','Homologacao funcional completa validada em producao.'),('incident_sbd8i1tf','Relato de colaborador','Conduta','Nao classificado','Em triagem','identified','Colaborador identificado','Compliance','p7','Compliance Demo','2026-08-04 17:32:04','Relato registrado apenas para validar permissao de criacao.','SC-20260804-D8I1TF','2026-08-11 17:32:04',NULL,''),('incident_ujv9xqov','HOMOLOGACAO FUNCIONAL ONDA 2 1785857918474','Conduta Impropria','Conduta e Relacionamento','Em apuracao','anonymous','Anonimo','Administracao','p5','Admin Plataforma Demo','2026-08-04 15:38:51','Caso criado pela homologacao funcional completa da Onda 2.','SC-20260804-V9XQOV','2026-08-11 15:38:51',NULL,'');
/*!40000 ALTER TABLE `incident_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `learning_integration_events`
--

DROP TABLE IF EXISTS `learning_integration_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `learning_integration_events` (
  `id` varchar(36) NOT NULL,
  `source_system` varchar(120) NOT NULL,
  `external_id` varchar(160) NOT NULL,
  `person_email` varchar(180) NOT NULL,
  `person_document` varchar(80) DEFAULT NULL,
  `person_id` varchar(36) DEFAULT NULL,
  `event_type` varchar(80) NOT NULL,
  `title` varchar(220) NOT NULL,
  `provider_name` varchar(160) NOT NULL,
  `status` varchar(40) NOT NULL,
  `occurred_at` date DEFAULT NULL,
  `workload_hours` decimal(8,2) NOT NULL DEFAULT '0.00',
  `competency_key` varchar(120) DEFAULT NULL,
  `suggested_action` varchar(80) NOT NULL,
  `processing_status` varchar(40) NOT NULL,
  `applied_entity_type` varchar(80) DEFAULT NULL,
  `applied_entity_id` varchar(36) DEFAULT NULL,
  `applied_at` datetime DEFAULT NULL,
  `review_note` text,
  `raw_payload_json` json DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `created_by_user_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_learning_event` (`source_system`,`external_id`),
  KEY `person_id` (`person_id`),
  KEY `created_by_user_id` (`created_by_user_id`),
  CONSTRAINT `learning_integration_events_ibfk_1` FOREIGN KEY (`person_id`) REFERENCES `people` (`id`),
  CONSTRAINT `learning_integration_events_ibfk_2` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `learning_integration_events`
--

LOCK TABLES `learning_integration_events` WRITE;
/*!40000 ALTER TABLE `learning_integration_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `learning_integration_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `people`
--

DROP TABLE IF EXISTS `people`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `people` (
  `id` varchar(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `role_title` varchar(120) NOT NULL,
  `area` varchar(120) NOT NULL,
  `work_unit` varchar(120) NOT NULL DEFAULT 'Unidade principal',
  `work_mode` varchar(30) NOT NULL DEFAULT 'hybrid',
  `manager_person_id` varchar(36) DEFAULT NULL,
  `employment_type` varchar(40) NOT NULL,
  `satisfaction_score` decimal(4,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `manager_person_id` (`manager_person_id`),
  CONSTRAINT `people_ibfk_1` FOREIGN KEY (`manager_person_id`) REFERENCES `people` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `people`
--

LOCK TABLES `people` WRITE;
/*!40000 ALTER TABLE `people` DISABLE KEYS */;
INSERT INTO `people` VALUES ('p1','Colaborador Demo 01','Analista Demo','Compliance','Sao Paulo','hybrid','p6','internal',4.40),('p2','Colaborador Demo 02','Lider Tecnico Demo','Tecnologia','Sao Paulo','onsite','p4','internal',4.10),('p3','Consultor Demo 01','Consultor Demo','Consultoria','Sao Paulo','remote','p4','consultant',4.00),('p4','Gestor Demo Tecnologia','Gerente Demo','Tecnologia','Sao Paulo','hybrid','p6','internal',4.30),('p5','Admin Plataforma Demo','Administrador da Plataforma','Administracao','Sao Paulo','onsite',NULL,'internal',4.50),('p6','RH Demo Corporativo','Business Partner RH','Gente e Gestao','Sao Paulo','hybrid','p5','internal',4.60),('p7','Compliance Demo','Analista de Compliance','Compliance','Sao Paulo','onsite','p6','internal',4.20),('person_0ahjeupd','Homologacao Onda2 20260804114937','Analista de Compliance','Compliance','Homologacao','remote',NULL,'internal',0.00),('person_a1lkrjk1','Subordinado Para Perfil Elevado','Analista do Time','Tecnologia','Sao Paulo','hybrid','p4','internal',0.00),('person_ils1rj89','Subordinado Criado Pelo Gestor','Analista do Time','Tecnologia','Sao Paulo','hybrid','p4','internal',0.00),('person_nwtk6wqf','Homologacao Onda 1 1785851673','Usuario de Homologacao','Tecnologia','Sao Paulo','hybrid',NULL,'internal',0.00),('person_stw79im0','Homologacao Onda2 Full 1785857987057','Analista de Compliance','Compliance','Homologacao','remote',NULL,'internal',0.00),('person_u8gfuu37','Homologacao Onda2 Full 1785857918474','Analista de Compliance','Compliance','Homologacao','remote',NULL,'internal',0.00),('person_uqj5iyg5','Homologacao Onda 1 1785851695','Usuario de Homologacao','Tecnologia','Sao Paulo','hybrid',NULL,'internal',0.00);
/*!40000 ALTER TABLE `people` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `produtos`
--

DROP TABLE IF EXISTS `produtos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `produtos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(160) NOT NULL,
  `business_unit_id` int NOT NULL,
  `business_unit_nome` varchar(120) NOT NULL DEFAULT 'Corporativo',
  PRIMARY KEY (`id`),
  KEY `fk_produtos_business_unit` (`business_unit_id`),
  CONSTRAINT `fk_produtos_business_unit` FOREIGN KEY (`business_unit_id`) REFERENCES `business_units` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produtos`
--

LOCK TABLES `produtos` WRITE;
/*!40000 ALTER TABLE `produtos` DISABLE KEYS */;
/*!40000 ALTER TABLE `produtos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `person_id` varchar(36) NOT NULL,
  `email` varchar(160) NOT NULL,
  `password_hash` varchar(128) NOT NULL,
  `role_key` varchar(40) NOT NULL,
  `status` varchar(30) NOT NULL,
  `must_change_password` tinyint(1) NOT NULL DEFAULT '1',
  `password_changed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `person_id` (`person_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`person_id`) REFERENCES `people` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('u1','p1','colaborador1@demo.local','d92adcdac570eb9bfa5a47fea2fa341f14746a1cee740dc971e89a3283f4a354','employee','active',0,'2026-08-05 17:02:53'),('u2','p2','colaborador2@demo.local','39f0f4d403e3f70706bb312e8a832d09651d2ceb7ff8e57d8ab830eaf6fb0978','employee','active',0,'2026-08-05 17:31:29'),('u3','p3','consultor1@demo.local','d3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791','employee','active',1,NULL),('u4','p4','gestor@demo.local','d3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791','manager','active',1,NULL),('u5','p5','admin@demo.local','995e9094ad9f6aaa44d29dbbdcd2e8efdb1ff4afdd2a67f05e123f9a282a14bc','admin','active',0,'2026-08-05 16:58:57'),('u6','p6','rh@demo.local','d3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791','hr','active',1,NULL),('u7','p7','compliance@demo.local','d3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791','compliance','active',1,NULL),('user_m8e0jit6','person_ils1rj89','subordinado.gestor@empresa.local','4d015d5ce012726983e0091b6f261dda9b4cfb441f3d8520409bddc859d59d67','employee','active',0,'2026-08-04 17:31:58'),('user_nav4x9yo','person_stw79im0','homolog.onda2.full.1785857987057@empresa.local','3b14ff9038c140403ef02a1a8cc73d0fd7fa41a3c59598ab8dedb483ddc5114b','compliance','inactive',0,'2026-08-04 15:39:49'),('user_tmtq1fjp','person_u8gfuu37','homolog.onda2.full.1785857918474@empresa.local','582883c13e8cd127847e806903bfba8d30b9e3fa8898f3e371777e53124ab153','compliance','inactive',0,'2026-08-04 15:38:41'),('user_w3w2j8jk','person_0ahjeupd','homolog.onda2.20260804114937@empresa.local','a52dae9a3f52ac2684e60b336ec1d040a10527edb738c052bbba84bdb04edefc','compliance','inactive',0,'2026-08-04 14:49:40'),('user_zaj0pxsz','person_uqj5iyg5','homolog.onda1.1785851695@empresa.local','738aacf7ab1222d4a9a8bca1527b0534ec8398fd3e6848719e4b71792adc27db','employee','active',0,'2026-08-04 13:55:27');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'defaultdb'
--
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-05 14:48:01
