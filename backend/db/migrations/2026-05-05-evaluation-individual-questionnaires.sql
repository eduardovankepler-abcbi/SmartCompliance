CREATE TABLE IF NOT EXISTS evaluation_questionnaires (
  id VARCHAR(36) PRIMARY KEY,
  cycle_id VARCHAR(36) NOT NULL,
  reviewee_person_id VARCHAR(36) NOT NULL,
  relationship_type VARCHAR(60) NOT NULL,
  source_library_id VARCHAR(120) NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'draft',
  question_count INT NOT NULL DEFAULT 0,
  visibility_level VARCHAR(40) NOT NULL DEFAULT 'restricted',
  version_number INT NOT NULL DEFAULT 1,
  published_at DATETIME NULL,
  created_by_user_id VARCHAR(36) NOT NULL,
  updated_by_user_id VARCHAR(36) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY unique_cycle_reviewee_relationship_questionnaire (
    cycle_id,
    reviewee_person_id,
    relationship_type,
    version_number
  ),
  KEY idx_questionnaires_cycle_reviewee_relationship (
    cycle_id,
    reviewee_person_id,
    relationship_type
  ),
  KEY idx_questionnaires_status (status),
  FOREIGN KEY (cycle_id) REFERENCES evaluation_cycles(id),
  FOREIGN KEY (reviewee_person_id) REFERENCES people(id),
  FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  FOREIGN KEY (updated_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS evaluation_questionnaire_questions (
  id VARCHAR(36) PRIMARY KEY,
  questionnaire_id VARCHAR(36) NOT NULL,
  sort_order INT NOT NULL,
  section_key VARCHAR(80) NULL,
  section_title VARCHAR(160) NULL,
  section_description TEXT NULL,
  dimension_key VARCHAR(60) NOT NULL,
  dimension_title VARCHAR(120) NOT NULL,
  prompt_text TEXT NOT NULL,
  helper_text TEXT NULL,
  input_type VARCHAR(40) NOT NULL DEFAULT 'scale',
  scale_profile VARCHAR(40) NULL,
  visibility VARCHAR(40) NOT NULL DEFAULT 'restricted',
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  collect_evidence_on_extreme BOOLEAN NOT NULL DEFAULT FALSE,
  is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
  options_json JSON NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY unique_questionnaire_sort_order (questionnaire_id, sort_order),
  FOREIGN KEY (questionnaire_id) REFERENCES evaluation_questionnaires(id)
);

CREATE TABLE IF NOT EXISTS evaluation_questionnaire_access_policies (
  id VARCHAR(36) PRIMARY KEY,
  questionnaire_id VARCHAR(36) NOT NULL,
  can_view_reviewee BOOLEAN NOT NULL DEFAULT FALSE,
  can_view_reviewer BOOLEAN NOT NULL DEFAULT TRUE,
  can_view_manager BOOLEAN NOT NULL DEFAULT FALSE,
  can_view_hr BOOLEAN NOT NULL DEFAULT TRUE,
  can_view_admin BOOLEAN NOT NULL DEFAULT TRUE,
  can_view_raw_answers BOOLEAN NOT NULL DEFAULT FALSE,
  can_view_prompt_text_after_submission BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY unique_questionnaire_policy (questionnaire_id),
  FOREIGN KEY (questionnaire_id) REFERENCES evaluation_questionnaires(id)
);

ALTER TABLE evaluation_assignments
  ADD COLUMN questionnaire_id VARCHAR(36) NULL,
  ADD KEY idx_assignments_questionnaire_id (questionnaire_id),
  ADD CONSTRAINT fk_evaluation_assignments_questionnaire
    FOREIGN KEY (questionnaire_id) REFERENCES evaluation_questionnaires(id);

ALTER TABLE evaluation_answers
  MODIFY COLUMN question_id VARCHAR(36) NULL,
  ADD COLUMN questionnaire_question_id VARCHAR(36) NULL,
  ADD KEY idx_answers_questionnaire_question_id (questionnaire_question_id),
  ADD CONSTRAINT fk_evaluation_answers_questionnaire_question
    FOREIGN KEY (questionnaire_question_id) REFERENCES evaluation_questionnaire_questions(id);
