-- =====================================================================
-- V2__roles_y_permisos.sql  |  PostgreSQL 16+  |  Caja "Emprende Chambala"
-- Configuración de roles con principio de mínimo privilegio,
-- restricciones de borrado contable y RLS para cierre y arqueo.
-- =====================================================================

-- 1. Creación condicional de roles si no existen
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_rw') THEN
    CREATE ROLE app_rw WITH LOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_ro') THEN
    CREATE ROLE app_ro WITH LOGIN;
  END IF;
END $$;

-- 2. Asegurar que ningún rol de aplicación pueda evadir RLS
ALTER ROLE app_rw NOBYPASSRLS;
ALTER ROLE app_ro NOBYPASSRLS;

-- 3. RLS para cierre_periodo y arqueo_caja (solo lectura/escritura para administradores)
ALTER TABLE cierre_periodo ENABLE ROW LEVEL SECURITY;
ALTER TABLE cierre_periodo FORCE ROW LEVEL SECURITY;

CREATE POLICY cierre_periodo_admin ON cierre_periodo FOR ALL
  USING (EXISTS (SELECT 1 FROM periodo p WHERE p.id = cierre_periodo.periodo_id AND p.caja_id = app_caja_id() AND app_es_admin()))
  WITH CHECK (EXISTS (SELECT 1 FROM periodo p WHERE p.id = cierre_periodo.periodo_id AND p.caja_id = app_caja_id() AND app_es_admin()));

CREATE POLICY cierre_periodo_socio_select ON cierre_periodo FOR SELECT
  USING (EXISTS (SELECT 1 FROM periodo p WHERE p.id = cierre_periodo.periodo_id AND p.caja_id = app_caja_id()));

ALTER TABLE arqueo_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE arqueo_caja FORCE ROW LEVEL SECURITY;

CREATE POLICY arqueo_caja_admin ON arqueo_caja FOR ALL
  USING (EXISTS (SELECT 1 FROM periodo p WHERE p.id = arqueo_caja.periodo_id AND p.caja_id = app_caja_id() AND app_es_admin()))
  WITH CHECK (EXISTS (SELECT 1 FROM periodo p WHERE p.id = arqueo_caja.periodo_id AND p.caja_id = app_caja_id() AND app_es_admin()));

-- 4. Asignación de permisos granulares a app_rw (runtime transaccional)
GRANT USAGE ON SCHEMA public TO app_rw;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_rw;

-- Prohibición estricta de borrado contable y modificación de auditoría
REVOKE UPDATE ON audit_log FROM app_rw;
REVOKE DELETE ON operacion, operacion_detalle, audit_log, cierre_periodo, arqueo_caja FROM app_rw;

-- 5. Asignación de permisos a app_ro (reportes de solo lectura)
GRANT USAGE ON SCHEMA public TO app_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_ro;

-- 6. Configurar permisos por defecto para futuras tablas
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES TO app_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO app_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_rw;
