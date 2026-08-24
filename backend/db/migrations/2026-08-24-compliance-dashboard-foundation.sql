ALTER TABLE evaluation_cycles
  ADD COLUMN compliance_grace_due_date DATE NULL,
  ADD COLUMN compliance_grace_configured_by_user_id VARCHAR(36) NULL,
  ADD COLUMN compliance_grace_configured_at DATETIME NULL,
  ADD CONSTRAINT chk_evaluation_cycles_compliance_grace
    CHECK (compliance_grace_due_date IS NULL OR due_date IS NULL OR compliance_grace_due_date >= due_date),
  ADD INDEX idx_evaluation_cycles_compliance_grace (status, compliance_grace_due_date),
  ADD FOREIGN KEY (compliance_grace_configured_by_user_id) REFERENCES users(id);

ALTER TABLE development_plans
  ADD COLUMN is_compliance_required BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN compliance_required_at DATETIME NULL,
  ADD COLUMN compliance_required_by_user_id VARCHAR(36) NULL,
  ADD INDEX idx_development_plans_compliance_required (is_compliance_required, due_date, status),
  ADD FOREIGN KEY (compliance_required_by_user_id) REFERENCES users(id);

CREATE TABLE IF NOT EXISTS development_plan_extensions (
  id VARCHAR(36) PRIMARY KEY,
  plan_id VARCHAR(36) NOT NULL,
  requested_due_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'pending',
  requested_by_user_id VARCHAR(36) NOT NULL,
  requested_at DATETIME NOT NULL,
  decided_by_user_id VARCHAR(36) NULL,
  decided_at DATETIME NULL,
  leader_area_name VARCHAR(160) NULL,
  decision_note TEXT NULL,
  CONSTRAINT chk_development_plan_extensions_status
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  INDEX idx_development_plan_extensions_plan_status (plan_id, status, requested_due_date),
  FOREIGN KEY (plan_id) REFERENCES development_plans(id),
  FOREIGN KEY (requested_by_user_id) REFERENCES users(id),
  FOREIGN KEY (decided_by_user_id) REFERENCES users(id)
);

ALTER TABLE incident_reports
  ADD COLUMN subject_person_id VARCHAR(36) NULL,
  ADD COLUMN finding_status VARCHAR(24) NOT NULL DEFAULT 'pending',
  ADD COLUMN finding_decided_at DATETIME NULL,
  ADD COLUMN finding_decided_by_user_id VARCHAR(36) NULL,
  ADD CONSTRAINT chk_incident_reports_finding_status
    CHECK (finding_status IN ('pending', 'substantiated', 'unsubstantiated')),
  ADD INDEX idx_incident_reports_subject_finding (subject_person_id, finding_status, status, closed_at),
  ADD FOREIGN KEY (subject_person_id) REFERENCES people(id),
  ADD FOREIGN KEY (finding_decided_by_user_id) REFERENCES users(id);

CREATE TABLE IF NOT EXISTS people_area_history (
  id VARCHAR(36) PRIMARY KEY,
  person_id VARCHAR(36) NOT NULL,
  area_name VARCHAR(160) NOT NULL,
  valid_from DATE NOT NULL,
  valid_until DATE NULL,
  source VARCHAR(40) NOT NULL DEFAULT 'system',
  created_at DATETIME NOT NULL,
  created_by_user_id VARCHAR(36) NULL,
  INDEX idx_people_area_history_person_date (person_id, valid_from, valid_until),
  INDEX idx_people_area_history_area_date (area_name, valid_from, valid_until),
  FOREIGN KEY (person_id) REFERENCES people(id),
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

INSERT INTO people_area_history
  (id, person_id, area_name, valid_from, valid_until, source, created_at, created_by_user_id)
SELECT
  CONCAT('pah_', REPLACE(UUID(), '-', '')),
  person.id,
  COALESCE(NULLIF(person.area, ''), 'Sem area'),
  CURRENT_DATE(),
  NULL,
  'system',
  NOW(),
  NULL
FROM people person
WHERE NOT EXISTS (
  SELECT 1
  FROM people_area_history history
  WHERE history.person_id = person.id
    AND history.valid_until IS NULL
);

CREATE TABLE IF NOT EXISTS compliance_control_records (
  id VARCHAR(36) PRIMARY KEY,
  person_id VARCHAR(36) NOT NULL,
  control_type VARCHAR(32) NOT NULL,
  source_entity_type VARCHAR(40) NOT NULL,
  source_entity_id VARCHAR(36) NOT NULL,
  eligible_from DATE NOT NULL,
  eligible_until DATE NULL,
  non_compliant_from DATETIME NULL,
  resolved_at DATETIME NULL,
  origin_area_name VARCHAR(160) NOT NULL,
  current_area_name VARCHAR(160) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT chk_compliance_control_records_type
    CHECK (control_type IN ('conduct', 'evaluation_response', 'mandatory_pdi')),
  UNIQUE KEY unique_compliance_control_source
    (control_type, source_entity_type, source_entity_id, person_id),
  INDEX idx_compliance_control_person_state (person_id, non_compliant_from, resolved_at),
  INDEX idx_compliance_control_origin_area (origin_area_name, control_type),
  INDEX idx_compliance_control_current_area (current_area_name, control_type),
  FOREIGN KEY (person_id) REFERENCES people(id)
);

CREATE TABLE IF NOT EXISTS compliance_daily_snapshots (
  snapshot_date DATE NOT NULL,
  area_name VARCHAR(160) NOT NULL,
  eligible_people_count INT NOT NULL DEFAULT 0,
  compliant_people_count INT NOT NULL DEFAULT 0,
  non_compliant_people_count INT NOT NULL DEFAULT 0,
  conduct_issue_count INT NOT NULL DEFAULT 0,
  evaluation_response_issue_count INT NOT NULL DEFAULT 0,
  mandatory_pdi_issue_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (snapshot_date, area_name),
  INDEX idx_compliance_daily_snapshots_date (snapshot_date)
);
