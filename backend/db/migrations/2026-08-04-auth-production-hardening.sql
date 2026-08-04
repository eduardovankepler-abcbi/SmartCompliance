ALTER TABLE users
  ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN password_changed_at DATETIME NULL;

-- Validacao esperada apos aplicar:
-- SHOW COLUMNS FROM users LIKE 'must_change_password';
-- SHOW COLUMNS FROM users LIKE 'password_changed_at';
