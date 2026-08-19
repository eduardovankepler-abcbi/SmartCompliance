CREATE TABLE IF NOT EXISTS development_plan_progress_events (
  id VARCHAR(36) PRIMARY KEY,
  plan_id VARCHAR(36) NOT NULL,
  person_id VARCHAR(36) NOT NULL,
  previous_status VARCHAR(32) NULL,
  progress_status VARCHAR(32) NOT NULL,
  progress_note TEXT NULL,
  occurred_at DATETIME NOT NULL,
  changed_by_user_id VARCHAR(36) NULL,
  INDEX idx_development_progress_plan_date (plan_id, occurred_at),
  INDEX idx_development_progress_person_date (person_id, occurred_at),
  FOREIGN KEY (plan_id) REFERENCES development_plans(id),
  FOREIGN KEY (person_id) REFERENCES people(id),
  FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
);

INSERT INTO development_plan_progress_events
  (id, plan_id, person_id, previous_status, progress_status, progress_note, occurred_at, changed_by_user_id)
SELECT
  CONCAT('dph_', REPLACE(UUID(), '-', '')),
  plan.id,
  plan.person_id,
  NULL,
  COALESCE(plan.progress_status, 'not_started'),
  plan.progress_note,
  COALESCE(plan.progress_updated_at, plan.created_at),
  plan.created_by_user_id
FROM development_plans plan
WHERE NOT EXISTS (
  SELECT 1
  FROM development_plan_progress_events event
  WHERE event.plan_id = plan.id
);
