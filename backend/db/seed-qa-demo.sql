-- Seed de QA/dev para dados e credenciais demo.
-- Nao execute este arquivo no banco de producao real.
-- Execute a partir da raiz do projeto: mysql ... < backend/db/seed-qa-demo.sql
SET @SMART_COMPLIANCE_ALLOW_DEMO_SEED = 'true';
SOURCE backend/db/seed.sql;
