CREATE TABLE IF NOT EXISTS people (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  role_title VARCHAR(120) NOT NULL,
  area VARCHAR(120) NOT NULL,
  work_unit VARCHAR(120) NOT NULL DEFAULT 'Unidade principal',
  work_mode VARCHAR(30) NOT NULL DEFAULT 'hybrid',
  manager_person_id VARCHAR(36) NULL,
  employment_type VARCHAR(40) NOT NULL,
  satisfaction_score DECIMAL(4,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (manager_person_id) REFERENCES people(id)
);

CREATE TABLE IF NOT EXISTS areas (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  manager_person_id VARCHAR(36) NULL,
  FOREIGN KEY (manager_person_id) REFERENCES people(id)
);

CREATE TABLE IF NOT EXISTS competencies (
  id VARCHAR(36) PRIMARY KEY,
  competency_key VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  person_id VARCHAR(36) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(128) NOT NULL,
  role_key VARCHAR(40) NOT NULL,
  status VARCHAR(30) NOT NULL,
  FOREIGN KEY (person_id) REFERENCES people(id)
);

CREATE TABLE IF NOT EXISTS incident_reports (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  category VARCHAR(80) NOT NULL,
  classification VARCHAR(80) NOT NULL,
  status VARCHAR(40) NOT NULL,
  anonymity VARCHAR(20) NOT NULL,
  reporter_label VARCHAR(120) NOT NULL,
  responsible_area VARCHAR(120) NOT NULL,
  assigned_person_id VARCHAR(36) NULL,
  assigned_to VARCHAR(120) NOT NULL,
  created_at DATETIME NOT NULL,
  description TEXT NOT NULL,
  FOREIGN KEY (assigned_person_id) REFERENCES people(id)
);

CREATE TABLE IF NOT EXISTS evaluation_templates (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  manager_custom_questions_limit INT NOT NULL DEFAULT 3,
  scale_json JSON NOT NULL
);

CREATE TABLE IF NOT EXISTS evaluation_questions (
  id VARCHAR(36) PRIMARY KEY,
  template_id VARCHAR(36) NOT NULL,
  section_key VARCHAR(80) NULL,
  section_title VARCHAR(160) NULL,
  section_description TEXT NULL,
  dimension_key VARCHAR(60) NOT NULL,
  dimension_title VARCHAR(120) NOT NULL,
  prompt_text TEXT NOT NULL,
  helper_text TEXT NULL,
  question_type VARCHAR(40) NOT NULL DEFAULT 'scale',
  options_json JSON NULL,
  sort_order INT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  collect_evidence_on_extreme BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (template_id) REFERENCES evaluation_templates(id)
);

CREATE TABLE IF NOT EXISTS evaluation_cycles (
  id VARCHAR(36) PRIMARY KEY,
  template_id VARCHAR(36) NOT NULL,
  library_id VARCHAR(120) NULL,
  library_name VARCHAR(160) NULL,
  title VARCHAR(160) NOT NULL,
  semester_label VARCHAR(60) NOT NULL,
  status VARCHAR(40) NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  enabled_relationships_json JSON NULL,
  transversal_config_json JSON NULL,
  due_date DATE NOT NULL,
  target_group VARCHAR(80) NOT NULL,
  created_by_user_id VARCHAR(36) NOT NULL,
  FOREIGN KEY (template_id) REFERENCES evaluation_templates(id),
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS evaluation_assignments (
  id VARCHAR(36) PRIMARY KEY,
  cycle_id VARCHAR(36) NOT NULL,
  reviewer_user_id VARCHAR(36) NOT NULL,
  reviewee_person_id VARCHAR(36) NOT NULL,
  relationship_type VARCHAR(60) NOT NULL,
  project_context VARCHAR(160) NOT NULL,
  collaboration_context TEXT NOT NULL,
  status VARCHAR(40) NOT NULL,
  reminder_count INT NOT NULL DEFAULT 0,
  last_reminder_sent_at DATETIME NULL,
  due_date DATE NOT NULL,
  FOREIGN KEY (cycle_id) REFERENCES evaluation_cycles(id),
  FOREIGN KEY (reviewer_user_id) REFERENCES users(id),
  FOREIGN KEY (reviewee_person_id) REFERENCES people(id)
);

CREATE TABLE IF NOT EXISTS evaluation_cycle_participants (
  id VARCHAR(36) PRIMARY KEY,
  cycle_id VARCHAR(36) NOT NULL,
  person_id VARCHAR(36) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'active',
  UNIQUE KEY unique_cycle_participant (cycle_id, person_id),
  FOREIGN KEY (cycle_id) REFERENCES evaluation_cycles(id),
  FOREIGN KEY (person_id) REFERENCES people(id)
);

CREATE TABLE IF NOT EXISTS evaluation_cycle_raters (
  id VARCHAR(36) PRIMARY KEY,
  cycle_id VARCHAR(36) NOT NULL,
  participant_person_id VARCHAR(36) NOT NULL,
  rater_user_id VARCHAR(36) NOT NULL,
  relationship_type VARCHAR(60) NOT NULL,
  status VARCHAR(40) NOT NULL,
  UNIQUE KEY unique_cycle_rater (cycle_id, participant_person_id, rater_user_id, relationship_type),
  FOREIGN KEY (cycle_id) REFERENCES evaluation_cycles(id),
  FOREIGN KEY (participant_person_id) REFERENCES people(id),
  FOREIGN KEY (rater_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS evaluation_cycle_reports (
  id VARCHAR(36) PRIMARY KEY,
  cycle_id VARCHAR(36) NOT NULL,
  relationship_type VARCHAR(60) NOT NULL,
  total_responses INT NOT NULL,
  average_score DECIMAL(4,2) NOT NULL,
  question_averages_json JSON NOT NULL,
  generated_at DATETIME NOT NULL,
  UNIQUE KEY unique_cycle_report (cycle_id, relationship_type),
  FOREIGN KEY (cycle_id) REFERENCES evaluation_cycles(id)
);

CREATE TABLE IF NOT EXISTS evaluation_pairings (
  id VARCHAR(36) PRIMARY KEY,
  cycle_id VARCHAR(36) NOT NULL,
  relationship_type VARCHAR(60) NOT NULL,
  reviewer_user_id VARCHAR(36) NOT NULL,
  reviewee_person_id VARCHAR(36) NOT NULL,
  pairing_source VARCHAR(30) NOT NULL,
  pairing_reason TEXT NOT NULL,
  seed VARCHAR(120) NULL,
  created_at DATETIME NOT NULL,
  created_by_user_id VARCHAR(36) NULL,
  blocked_at DATETIME NULL,
  blocked_by_user_id VARCHAR(36) NULL,
  FOREIGN KEY (cycle_id) REFERENCES evaluation_cycles(id),
  FOREIGN KEY (reviewer_user_id) REFERENCES users(id),
  FOREIGN KEY (reviewee_person_id) REFERENCES people(id),
  FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  FOREIGN KEY (blocked_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS evaluation_pairing_exceptions (
  id VARCHAR(36) PRIMARY KEY,
  cycle_id VARCHAR(36) NOT NULL,
  pairing_id VARCHAR(36) NULL,
  action_type VARCHAR(40) NOT NULL,
  reviewer_user_id VARCHAR(36) NOT NULL,
  previous_reviewee_person_id VARCHAR(36) NULL,
  next_reviewee_person_id VARCHAR(36) NULL,
  reason TEXT NOT NULL,
  actor_user_id VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (cycle_id) REFERENCES evaluation_cycles(id),
  FOREIGN KEY (pairing_id) REFERENCES evaluation_pairings(id),
  FOREIGN KEY (reviewer_user_id) REFERENCES users(id),
  FOREIGN KEY (previous_reviewee_person_id) REFERENCES people(id),
  FOREIGN KEY (next_reviewee_person_id) REFERENCES people(id),
  FOREIGN KEY (actor_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS evaluation_feedback_requests (
  id VARCHAR(36) PRIMARY KEY,
  cycle_id VARCHAR(36) NOT NULL,
  requester_user_id VARCHAR(36) NOT NULL,
  reviewee_person_id VARCHAR(36) NOT NULL,
  status VARCHAR(40) NOT NULL,
  context_note TEXT NOT NULL,
  requested_at DATETIME NOT NULL,
  decided_at DATETIME NULL,
  decided_by_user_id VARCHAR(36) NULL,
  FOREIGN KEY (cycle_id) REFERENCES evaluation_cycles(id),
  FOREIGN KEY (requester_user_id) REFERENCES users(id),
  FOREIGN KEY (reviewee_person_id) REFERENCES people(id),
  FOREIGN KEY (decided_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS evaluation_feedback_request_items (
  id VARCHAR(36) PRIMARY KEY,
  request_id VARCHAR(36) NOT NULL,
  provider_person_id VARCHAR(36) NOT NULL,
  assignment_id VARCHAR(36) NULL,
  FOREIGN KEY (request_id) REFERENCES evaluation_feedback_requests(id),
  FOREIGN KEY (provider_person_id) REFERENCES people(id),
  FOREIGN KEY (assignment_id) REFERENCES evaluation_assignments(id)
);

CREATE TABLE IF NOT EXISTS evaluation_submissions (
  id VARCHAR(36) PRIMARY KEY,
  assignment_id VARCHAR(36) NOT NULL,
  cycle_id VARCHAR(36) NOT NULL,
  reviewer_user_id VARCHAR(36) NOT NULL,
  reviewee_person_id VARCHAR(36) NOT NULL,
  overall_score DECIMAL(4,2) NOT NULL,
  strengths_note TEXT NOT NULL,
  development_note TEXT NOT NULL,
  reviewee_acknowledgement_status VARCHAR(30) NULL,
  reviewee_acknowledgement_note TEXT NULL,
  reviewee_acknowledged_at DATETIME NULL,
  submitted_at DATETIME NOT NULL,
  FOREIGN KEY (assignment_id) REFERENCES evaluation_assignments(id),
  FOREIGN KEY (cycle_id) REFERENCES evaluation_cycles(id),
  FOREIGN KEY (reviewer_user_id) REFERENCES users(id),
  FOREIGN KEY (reviewee_person_id) REFERENCES people(id)
);

CREATE TABLE IF NOT EXISTS evaluation_answers (
  id VARCHAR(36) PRIMARY KEY,
  submission_id VARCHAR(36) NOT NULL,
  question_id VARCHAR(36) NOT NULL,
  answer_type VARCHAR(40) NOT NULL DEFAULT 'scale',
  score INT NULL,
  evidence_note TEXT NULL,
  answer_text TEXT NULL,
  answer_options_json JSON NULL,
  FOREIGN KEY (submission_id) REFERENCES evaluation_submissions(id),
  FOREIGN KEY (question_id) REFERENCES evaluation_questions(id)
);

CREATE TABLE IF NOT EXISTS applause_entries (
  id VARCHAR(36) PRIMARY KEY,
  sender_person_id VARCHAR(36) NOT NULL,
  receiver_person_id VARCHAR(36) NOT NULL,
  category VARCHAR(80) NOT NULL,
  impact VARCHAR(160) NOT NULL,
  context_note TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  status VARCHAR(40) NOT NULL,
  FOREIGN KEY (sender_person_id) REFERENCES people(id),
  FOREIGN KEY (receiver_person_id) REFERENCES people(id)
);

CREATE TABLE IF NOT EXISTS development_records (
  id VARCHAR(36) PRIMARY KEY,
  person_id VARCHAR(36) NOT NULL,
  record_type VARCHAR(80) NOT NULL,
  title VARCHAR(160) NOT NULL,
  provider_name VARCHAR(120) NOT NULL,
  completed_at DATE NOT NULL,
  skill_signal VARCHAR(120) NOT NULL,
  notes TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  archived_at DATETIME NULL,
  FOREIGN KEY (person_id) REFERENCES people(id)
);

CREATE TABLE IF NOT EXISTS development_plans (
  id VARCHAR(36) PRIMARY KEY,
  person_id VARCHAR(36) NOT NULL,
  cycle_id VARCHAR(36) NULL,
  competency_id VARCHAR(36) NULL,
  focus_title VARCHAR(160) NOT NULL,
  action_text TEXT NOT NULL,
  due_date DATE NOT NULL,
  expected_evidence TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_by_user_id VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL,
  archived_at DATETIME NULL,
  FOREIGN KEY (person_id) REFERENCES people(id),
  FOREIGN KEY (cycle_id) REFERENCES evaluation_cycles(id),
  FOREIGN KEY (competency_id) REFERENCES competencies(id),
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS learning_integration_events (
  id VARCHAR(36) PRIMARY KEY,
  source_system VARCHAR(120) NOT NULL,
  external_id VARCHAR(160) NOT NULL,
  person_email VARCHAR(180) NOT NULL,
  person_document VARCHAR(80),
  person_id VARCHAR(36),
  event_type VARCHAR(80) NOT NULL,
  title VARCHAR(220) NOT NULL,
  provider_name VARCHAR(160) NOT NULL,
  status VARCHAR(40) NOT NULL,
  occurred_at DATE,
  workload_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
  competency_key VARCHAR(120),
  suggested_action VARCHAR(80) NOT NULL,
  processing_status VARCHAR(40) NOT NULL,
  applied_entity_type VARCHAR(80),
  applied_entity_id VARCHAR(36),
  applied_at DATETIME,
  review_note TEXT,
  raw_payload_json JSON,
  created_at DATETIME NOT NULL,
  created_by_user_id VARCHAR(36),
  UNIQUE KEY unique_learning_event (source_system, external_id),
  FOREIGN KEY (person_id) REFERENCES people(id),
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  category VARCHAR(60) NOT NULL,
  action_key VARCHAR(60) NOT NULL,
  entity_type VARCHAR(60) NOT NULL,
  entity_id VARCHAR(36) NOT NULL,
  entity_label VARCHAR(180) NOT NULL,
  actor_user_id VARCHAR(36) NULL,
  actor_name VARCHAR(160) NOT NULL,
  actor_role_key VARCHAR(40) NOT NULL,
  summary_text TEXT NOT NULL,
  detail_text TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  FOREIGN KEY (actor_user_id) REFERENCES users(id)
);
