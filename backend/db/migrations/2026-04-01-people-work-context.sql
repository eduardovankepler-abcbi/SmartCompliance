ALTER TABLE people
  ADD COLUMN work_unit VARCHAR(120) NOT NULL DEFAULT 'Unidade principal';

ALTER TABLE people
  ADD COLUMN work_mode VARCHAR(30) NOT NULL DEFAULT 'hybrid';
