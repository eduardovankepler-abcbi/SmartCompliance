ALTER TABLE evaluation_assignments
  ADD COLUMN reminder_count INT NOT NULL DEFAULT 0;

ALTER TABLE evaluation_assignments
  ADD COLUMN last_reminder_sent_at DATETIME NULL;
