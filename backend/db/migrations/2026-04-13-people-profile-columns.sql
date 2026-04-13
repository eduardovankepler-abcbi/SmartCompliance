ALTER TABLE people
  ADD COLUMN employment_type VARCHAR(40) NOT NULL DEFAULT 'internal';

ALTER TABLE people
  ADD COLUMN satisfaction_score DECIMAL(4,2) NOT NULL DEFAULT 0;
