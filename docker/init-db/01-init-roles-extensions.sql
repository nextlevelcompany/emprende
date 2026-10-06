-- =====================================================================
-- 01-init-roles-extensions.sql
-- Ejecutado automáticamente en el arranque inicial del contenedor PostgreSQL
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Crear roles de aplicación si no existen
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_rw') THEN
    CREATE ROLE app_rw WITH LOGIN PASSWORD 'dev_password_rw';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_ro') THEN
    CREATE ROLE app_ro WITH LOGIN PASSWORD 'dev_password_ro';
  END IF;
END $$;
