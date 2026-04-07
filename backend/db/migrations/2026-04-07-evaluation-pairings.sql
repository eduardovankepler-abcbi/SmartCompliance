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
