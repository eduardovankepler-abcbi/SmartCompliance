CREATE TABLE IF NOT EXISTS people (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  role_title VARCHAR(120) NOT NULL,
  area VARCHAR(120) NOT NULL,
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
  due_date DATE NOT NULL,
  FOREIGN KEY (cycle_id) REFERENCES evaluation_cycles(id),
  FOREIGN KEY (reviewer_user_id) REFERENCES users(id),
  FOREIGN KEY (reviewee_person_id) REFERENCES people(id)
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
