-- =====================================================================
-- V8__junta_directiva.sql | PostgreSQL 16+
-- Tabla para registrar la Junta Directiva / Cargos de la Caja Comunal
-- (Presidente, Tesorero, Secretario, etc.) para firmas oficiales.
-- =====================================================================

CREATE TABLE IF NOT EXISTS junta_directiva (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caja_id UUID NOT NULL REFERENCES caja(id),
    cargo VARCHAR(50) NOT NULL, -- 'PRESIDENTE', 'TESORERO', 'SECRETARIO', 'VOCAL', etc.
    cargo_titulo VARCHAR(100) NOT NULL, -- 'Presidente', 'Tesorero(a)', 'Secretario(a)'
    socio_id UUID REFERENCES socio(id),
    nombre_completo VARCHAR(200) NOT NULL,
    tipo_documento VARCHAR(20) DEFAULT 'DNI',
    numero_documento VARCHAR(20),
    telefono VARCHAR(30),
    email VARCHAR(100),
    periodo_inicio DATE,
    periodo_fin DATE,
    activo BOOLEAN NOT NULL DEFAULT true,
    orden SMALLINT NOT NULL DEFAULT 1,
    observaciones TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES app_user(id),
    CONSTRAINT uq_junta_caja_cargo UNIQUE (caja_id, cargo)
);

CREATE INDEX IF NOT EXISTS ix_junta_caja_activo ON junta_directiva(caja_id, activo, orden);

-- Políticas RLS
ALTER TABLE junta_directiva ENABLE ROW LEVEL SECURITY;
ALTER TABLE junta_directiva FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS directiva_read ON junta_directiva;
CREATE POLICY directiva_read ON junta_directiva FOR SELECT USING (caja_id = app_caja_id());

DROP POLICY IF EXISTS directiva_admin ON junta_directiva;
CREATE POLICY directiva_admin ON junta_directiva FOR ALL 
USING (caja_id = app_caja_id() AND app_es_admin())
WITH CHECK (caja_id = app_caja_id() AND app_es_admin());

-- Permisos para app_rw y app_ro
GRANT SELECT, INSERT, UPDATE, DELETE ON junta_directiva TO app_rw;
GRANT SELECT ON junta_directiva TO app_ro;

-- Carga inicial de cargos directivos fundamentales
INSERT INTO junta_directiva (
    caja_id, cargo, cargo_titulo, socio_id, nombre_completo, tipo_documento, numero_documento, orden, activo, observaciones
) VALUES 
  (
    'a0000000-0000-0000-0000-000000000001',
    'PRESIDENTE',
    'Presidente',
    '01a10f3a-7ea1-7dfc-be82-7e2754a4db3c', -- Adela Ponce
    'PONCE HUILCAYA ADELA',
    'DNI',
    '09812345',
    1,
    true,
    'Representante legal y Presidenta del Comité de Administración'
  ),
  (
    'a0000000-0000-0000-0000-000000000001',
    'TESORERO',
    'Tesorero(a)',
    '01a10f3a-7eff-7381-bf54-47bfedcad2f9', -- Alejandra Silvia Huamán Morán
    'HUAMAN MORAN ALEJANDRA SILVIA',
    'DNI',
    '10876543',
    2,
    true,
    'Custodia de fondos, balance y arqueo de caja'
  ),
  (
    'a0000000-0000-0000-0000-000000000001',
    'SECRETARIO',
    'Secretario(a)',
    '01a10f3a-7e76-7d8d-b628-45fe5228ad9d', -- Anabel María Laime
    'LAIME CCACCRO ANABEL MARIA',
    'DNI',
    '41765432',
    3,
    true,
    'Custodia del Libro de Actas, Libro de Socios y Matrícula de Acciones'
  )
ON CONFLICT DO NOTHING;
