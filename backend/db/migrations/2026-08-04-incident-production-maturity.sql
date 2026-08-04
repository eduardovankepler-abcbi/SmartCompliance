ALTER TABLE incident_reports
  ADD COLUMN protocol VARCHAR(40) NULL,
  ADD COLUMN due_at DATETIME NULL,
  ADD COLUMN closed_at DATETIME NULL,
  ADD COLUMN closure_note TEXT NULL;

UPDATE incident_reports
SET protocol = CONCAT(
  'SC-',
  DATE_FORMAT(created_at, '%Y%m%d'),
  '-',
  UPPER(RIGHT(REPLACE(id, '_', ''), 6))
)
WHERE protocol IS NULL OR protocol = '';

ALTER TABLE incident_reports
  MODIFY protocol VARCHAR(40) NOT NULL,
  ADD UNIQUE KEY unique_incident_protocol (protocol);
