CREATE TABLE IF NOT EXISTS incident_evidences (
  id VARCHAR(36) PRIMARY KEY,
  incident_id VARCHAR(36) NOT NULL,
  file_name VARCHAR(180) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes INT NOT NULL,
  content_blob LONGBLOB NOT NULL,
  uploaded_by_user_id VARCHAR(36) NULL,
  uploaded_at DATETIME NOT NULL,
  KEY idx_incident_evidences_incident (incident_id),
  FOREIGN KEY (incident_id) REFERENCES incident_reports(id),
  FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id)
);
