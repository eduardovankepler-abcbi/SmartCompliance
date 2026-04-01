-- Add cycle enablement + per-questionnaire toggles (MySQL)
--
-- Run this on existing databases that already have `evaluation_cycles` created.
-- (CREATE TABLE IF NOT EXISTS in schema.sql does not add new columns.)

ALTER TABLE evaluation_cycles
  ADD COLUMN is_enabled BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE evaluation_cycles
  ADD COLUMN enabled_relationships_json JSON NULL;

