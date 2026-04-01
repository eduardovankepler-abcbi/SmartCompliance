ALTER TABLE evaluation_submissions
  ADD COLUMN reviewee_acknowledgement_status VARCHAR(30) NULL;

ALTER TABLE evaluation_submissions
  ADD COLUMN reviewee_acknowledgement_note TEXT NULL;

ALTER TABLE evaluation_submissions
  ADD COLUMN reviewee_acknowledged_at DATETIME NULL;
