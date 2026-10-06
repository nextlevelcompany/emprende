-- =====================================================================
-- V1__init_schema.sql  |  PostgreSQL 16+  |  Caja "Emprende Chambala"
-- Convenciones: snake_case, PK uuid (el backend genera UUIDv7),
-- dinero numeric(14,2) en PEN, fechas timestamptz (UTC), sin DELETE físico
-- en datos contables (anulación lógica), multi-tenant por caja_id.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------- Tipos ----------
CREATE TYPE user_role           AS ENUM ('ADMIN', 'SOCIO');
CREATE TYPE user_status         AS ENUM ('PENDIENTE', 'ACTIVO', 'BLOQUEADO', 'INACTIVO');
CREATE TYPE socio_tipo          AS ENUM ('SOCIO', 'EXTERNO');
CREATE TYPE socio_estado        AS ENUM ('ACTIVO', 'INACTIVO', 'RETIRADO');
CREATE TYPE periodo_estado      AS ENUM ('ABIERTO', 'CERRADO');
CREATE TYPE flujo_tipo          AS ENUM ('INGRESO', 'EGRESO');
CREATE TYPE operacion_estado    AS ENUM ('VIGENTE', 'ANULADA');
CREATE TYPE prestamo_estado     AS ENUM ('SOLICITADO', 'APROBADO', 'VIGENTE', 'CANCELADO', 'CASTIGADO', 'RECHAZADO');
CREATE TYPE cuota_estado        AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADA', 'VENCIDA');
CREATE TYPE distribucion_estado AS ENUM ('BORRADOR', 'APROBADA', 'PAGADA');
CREATE TYPE token_proposito     AS ENUM ('RESET_PASSWORD', 'ACTIVACION');

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

-- ---------- Tenant ----------
CREATE TABLE caja (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        varchar(120) NOT NULL,
  moneda        char(3)      NOT NULL DEFAULT 'PEN',
  zona_horaria  varchar(40)  NOT NULL DEFAULT 'America/Lima',
  activa        boolean      NOT NULL DEFAULT true,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);

-- ---------- Identidad y acceso ----------
CREATE TABLE app_user (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id               uuid NOT NULL REFERENCES caja(id),
  email                 citext NOT NULL UNIQUE,
  password_hash         varchar(255) NOT NULL,              -- Argon2id
  role                  user_role   NOT NULL,
  status                user_status NOT NULL DEFAULT 'PENDIENTE',
  socio_id              uuid UNIQUE,                        -- FK se agrega tras crear socio
  must_change_password  boolean NOT NULL DEFAULT true,
  mfa_enabled           boolean NOT NULL DEFAULT false,
  mfa_secret_enc        bytea,                              -- TOTP cifrado a nivel de aplicación
  mfa_recovery_hashes   text[],
  failed_login_count    smallint NOT NULL DEFAULT 0,
  locked_until          timestamptz,
  last_login_at         timestamptz,
  password_changed_at   timestamptz NOT NULL DEFAULT now(),
  token_version         integer NOT NULL DEFAULT 0,         -- invalida JWT al incrementar
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_user_socio CHECK (role = 'ADMIN' OR socio_id IS NOT NULL),
  CONSTRAINT ck_user_mfa   CHECK (NOT mfa_enabled OR mfa_secret_enc IS NOT NULL)
);
CREATE INDEX ix_app_user_caja ON app_user (caja_id);

CREATE TABLE refresh_token (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  family_id    uuid NOT NULL,                               -- rotación + detección de reutilización
  token_hash   char(64) NOT NULL UNIQUE,                    -- SHA-256, nunca el token en claro
  issued_at    timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  revoked_at   timestamptz,
  replaced_by  uuid REFERENCES refresh_token(id),
  ip           inet,
  user_agent   text
);
CREATE INDEX ix_refresh_user_activo ON refresh_token (user_id) WHERE revoked_at IS NULL;
CREATE INDEX ix_refresh_family      ON refresh_token (family_id);

CREATE TABLE one_time_token (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  proposito   token_proposito NOT NULL,
  token_hash  char(64) NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------- Socios ----------
CREATE TABLE socio (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id              uuid NOT NULL REFERENCES caja(id),
  codigo               integer NOT NULL,                    -- correlativo interno por caja
  tipo                 socio_tipo   NOT NULL DEFAULT 'SOCIO',
  nombres              varchar(100) NOT NULL,
  apellidos            varchar(100) NOT NULL,
  nombre_completo      varchar(201) GENERATED ALWAYS AS (apellidos || ' ' || nombres) STORED,
  documento_tipo       varchar(10)  NOT NULL DEFAULT 'DNI',
  documento_enc        bytea,                               -- DNI cifrado (AES-GCM, app-level)
  documento_hash       char(64),                            -- HMAC-SHA256 para unicidad/búsqueda
  telefono             varchar(20),
  email                citext,
  direccion            text,
  fecha_ingreso        date NOT NULL,
  fecha_retiro         date,
  estado               socio_estado NOT NULL DEFAULT 'ACTIVO',
  notas                text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  created_by           uuid REFERENCES app_user(id),
  deleted_at           timestamptz,
  UNIQUE (caja_id, id),                                     -- habilita FKs compuestas anti-fuga entre tenants
  UNIQUE (caja_id, codigo),
  CONSTRAINT ck_socio_retiro CHECK (fecha_retiro IS NULL OR fecha_retiro >= fecha_ingreso)
);
CREATE UNIQUE INDEX ux_socio_documento ON socio (caja_id, documento_tipo, documento_hash)
  WHERE documento_hash IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_socio_nombre_trgm ON socio USING gin (nombre_completo gin_trgm_ops);

ALTER TABLE app_user
  ADD CONSTRAINT fk_user_socio FOREIGN KEY (socio_id) REFERENCES socio(id);

-- ---------- Parámetros y catálogo ----------
CREATE TABLE parametro (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id        uuid NOT NULL REFERENCES caja(id),
  clave          varchar(50) NOT NULL,                      -- VALOR_ACCION, TASA_DEFECTO, DIA_REUNION, SALDO_INICIAL_CAJA
  valor          numeric(14,4) NOT NULL,
  vigente_desde  date NOT NULL,
  descripcion    varchar(200),
  UNIQUE (caja_id, clave, vigente_desde)
);

CREATE TABLE concepto (
  id              smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo          varchar(40)  NOT NULL UNIQUE,
  nombre          varchar(100) NOT NULL,
  tipo            flujo_tipo   NOT NULL,
  requiere_socio  boolean NOT NULL DEFAULT true,
  orden           smallint NOT NULL,
  activo          boolean NOT NULL DEFAULT true,
  UNIQUE (id, tipo)
);

-- ---------- Periodos (cada hoja mensual del Excel) ----------
CREATE TABLE periodo (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id        uuid NOT NULL REFERENCES caja(id),
  anio           smallint NOT NULL CHECK (anio BETWEEN 2020 AND 2100),
  mes            smallint NOT NULL CHECK (mes BETWEEN 1 AND 12),
  fecha_reunion  date NOT NULL,
  estado         periodo_estado NOT NULL DEFAULT 'ABIERTO',
  cerrado_at     timestamptz,
  cerrado_por    uuid REFERENCES app_user(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (caja_id, id),
  UNIQUE (caja_id, anio, mes),
  CONSTRAINT ck_periodo_fecha  CHECK (EXTRACT(YEAR FROM fecha_reunion) = anio AND EXTRACT(MONTH FROM fecha_reunion) = mes),
  CONSTRAINT ck_periodo_cierre CHECK ((estado = 'CERRADO') = (cerrado_at IS NOT NULL))
);

CREATE TABLE cierre_periodo (                               -- foto inmutable al cerrar el mes
  periodo_id       uuid PRIMARY KEY REFERENCES periodo(id),
  saldo_anterior   numeric(14,2) NOT NULL,
  total_ingresos   numeric(14,2) NOT NULL,
  total_egresos    numeric(14,2) NOT NULL,
  saldo_final      numeric(14,2) GENERATED ALWAYS AS (saldo_anterior + total_ingresos - total_egresos) STORED,
  detalle          jsonb NOT NULL,                          -- totales por concepto
  hash_integridad  char(64) NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  created_by       uuid REFERENCES app_user(id)
);

CREATE TABLE arqueo_caja (
  periodo_id        uuid PRIMARY KEY REFERENCES periodo(id),
  efectivo          numeric(14,2) NOT NULL DEFAULT 0 CHECK (efectivo >= 0),
  depositos_bancos  numeric(14,2) NOT NULL DEFAULT 0 CHECK (depositos_bancos >= 0),
  total_contado     numeric(14,2) GENERATED ALWAYS AS (efectivo + depositos_bancos) STORED,
  saldo_sistema     numeric(14,2) NOT NULL,
  diferencia        numeric(14,2) GENERATED ALWAYS AS (efectivo + depositos_bancos - saldo_sistema) STORED, -- >0 sobrante, <0 faltante
  observacion       text,
  registrado_por    uuid REFERENCES app_user(id),
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ---------- Préstamos ----------
CREATE TABLE prestamo (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id              uuid NOT NULL,
  socio_id             uuid NOT NULL,
  numero               integer NOT NULL,                    -- correlativo por caja
  monto_principal      numeric(14,2) NOT NULL CHECK (monto_principal > 0),
  tasa_mensual         numeric(6,4)  NOT NULL CHECK (tasa_mensual >= 0 AND tasa_mensual <= 1),  -- 0.0500 = 5 % mensual
  nro_cuotas           smallint NOT NULL CHECK (nro_cuotas BETWEEN 1 AND 60),
  metodo_amortizacion  varchar(40) NOT NULL DEFAULT 'CAPITAL_FIJO_INTERES_SOBRE_SALDO',
  fecha_desembolso     date NOT NULL,
  fecha_primera_cuota  date NOT NULL,
  estado               prestamo_estado NOT NULL DEFAULT 'SOLICITADO',
  proposito            text,
  aprobado_por         uuid REFERENCES app_user(id),
  aprobado_at          timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  created_by           uuid REFERENCES app_user(id),
  UNIQUE (caja_id, numero),
  UNIQUE (caja_id, id),
  FOREIGN KEY (caja_id, socio_id) REFERENCES socio (caja_id, id),
  CONSTRAINT ck_prestamo_fechas CHECK (fecha_primera_cuota > fecha_desembolso)
);
CREATE INDEX ix_prestamo_socio  ON prestamo (socio_id);
CREATE INDEX ix_prestamo_estado ON prestamo (caja_id, estado);

CREATE TABLE cuota_prestamo (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestamo_id          uuid NOT NULL REFERENCES prestamo(id),
  nro_cuota            smallint NOT NULL CHECK (nro_cuota > 0),
  fecha_vencimiento    date NOT NULL,
  capital_programado   numeric(14,2) NOT NULL CHECK (capital_programado >= 0),
  interes_programado   numeric(14,2) NOT NULL CHECK (interes_programado >= 0),
  cuota_programada     numeric(14,2) GENERATED ALWAYS AS (capital_programado + interes_programado) STORED,
  capital_pagado       numeric(14,2) NOT NULL DEFAULT 0 CHECK (capital_pagado >= 0),
  interes_pagado       numeric(14,2) NOT NULL DEFAULT 0 CHECK (interes_pagado >= 0),
  mora_pagada          numeric(14,2) NOT NULL DEFAULT 0 CHECK (mora_pagada >= 0),
  estado               cuota_estado NOT NULL DEFAULT 'PENDIENTE',
  fecha_pago           date,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prestamo_id, nro_cuota),
  CONSTRAINT ck_cuota_capital CHECK (capital_pagado <= capital_programado),
  CONSTRAINT ck_cuota_interes CHECK (interes_pagado <= interes_programado)
);
CREATE INDEX ix_cuota_vencimiento ON cuota_prestamo (fecha_vencimiento) WHERE estado IN ('PENDIENTE', 'PARCIAL', 'VENCIDA');

-- ---------- Libro de caja: cabecera (recibo/fila del Excel) + detalle (columnas) ----------
CREATE TABLE import_batch (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id       uuid NOT NULL REFERENCES caja(id),
  archivo       varchar(255) NOT NULL,
  sha256        char(64) NOT NULL,
  estado        varchar(20) NOT NULL DEFAULT 'EN_CURSO',    -- EN_CURSO | OK | ERROR | REVERTIDO
  resumen       jsonb,
  errores       jsonb,
  ejecutado_por uuid REFERENCES app_user(id),
  started_at    timestamptz NOT NULL DEFAULT now(),
  finished_at   timestamptz,
  UNIQUE (caja_id, sha256)
);

CREATE TABLE operacion (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id           uuid NOT NULL,
  periodo_id        uuid NOT NULL,
  socio_id          uuid,
  tipo              flujo_tipo NOT NULL,
  fecha             date NOT NULL,
  nro_recibo        integer,                                -- correlativo de la columna "Día" del Excel (ingresos)
  descripcion       varchar(255),
  estado            operacion_estado NOT NULL DEFAULT 'VIGENTE',
  anulado_at        timestamptz,
  anulado_por       uuid REFERENCES app_user(id),
  motivo_anulacion  text,
  import_batch_id   uuid REFERENCES import_batch(id),
  origen_ref        varchar(80),                            -- p. ej. 'JUN 24'!B7  (trazabilidad de migración)
  created_at        timestamptz NOT NULL DEFAULT now(),
  created_by        uuid REFERENCES app_user(id),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tipo),
  FOREIGN KEY (caja_id, periodo_id) REFERENCES periodo (caja_id, id),
  FOREIGN KEY (caja_id, socio_id)   REFERENCES socio   (caja_id, id),
  CONSTRAINT ck_operacion_anulacion CHECK (
    estado = 'VIGENTE' OR (anulado_at IS NOT NULL AND anulado_por IS NOT NULL AND motivo_anulacion IS NOT NULL))
);
CREATE UNIQUE INDEX ux_operacion_recibo ON operacion (caja_id, nro_recibo)
  WHERE nro_recibo IS NOT NULL AND estado = 'VIGENTE';
CREATE INDEX ix_operacion_periodo ON operacion (periodo_id) WHERE estado = 'VIGENTE';
CREATE INDEX ix_operacion_socio   ON operacion (socio_id, fecha DESC) WHERE estado = 'VIGENTE';

CREATE TABLE operacion_detalle (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operacion_id  uuid NOT NULL,
  tipo          flujo_tipo NOT NULL,
  concepto_id   smallint NOT NULL,
  monto         numeric(14,2) NOT NULL CHECK (monto > 0),
  prestamo_id   uuid REFERENCES prestamo(id),
  cuota_id      uuid REFERENCES cuota_prestamo(id),
  FOREIGN KEY (operacion_id, tipo) REFERENCES operacion (id, tipo),   -- el detalle hereda el tipo de la cabecera
  FOREIGN KEY (concepto_id, tipo)  REFERENCES concepto  (id, tipo),   -- el concepto debe ser del mismo tipo
  UNIQUE NULLS NOT DISTINCT (operacion_id, concepto_id, cuota_id)   -- PG15+: evita líneas duplicadas del mismo concepto
);
CREATE INDEX ix_detalle_operacion ON operacion_detalle (operacion_id);
CREATE INDEX ix_detalle_concepto  ON operacion_detalle (concepto_id);
CREATE INDEX ix_detalle_prestamo  ON operacion_detalle (prestamo_id) WHERE prestamo_id IS NOT NULL;

-- ---------- Distribución anual de utilidades (proporcional a acciones) ----------
CREATE TABLE distribucion_utilidad (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id          uuid NOT NULL REFERENCES caja(id),
  ejercicio        smallint NOT NULL,
  fecha_corte      date NOT NULL,
  utilidad_total   numeric(14,2) NOT NULL CHECK (utilidad_total >= 0),
  total_acciones   integer NOT NULL CHECK (total_acciones > 0),
  valor_por_accion numeric(14,6) GENERATED ALWAYS AS (utilidad_total / total_acciones) STORED,
  estado           distribucion_estado NOT NULL DEFAULT 'BORRADOR',
  aprobado_por     uuid REFERENCES app_user(id),
  aprobado_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (caja_id, ejercicio)
);

CREATE TABLE distribucion_utilidad_detalle (
  distribucion_id  uuid NOT NULL REFERENCES distribucion_utilidad(id),
  socio_id         uuid NOT NULL REFERENCES socio(id),
  acciones         integer NOT NULL CHECK (acciones >= 0),
  monto            numeric(14,2) NOT NULL CHECK (monto >= 0),
  operacion_id     uuid REFERENCES operacion(id),           -- egreso que materializa el pago
  PRIMARY KEY (distribucion_id, socio_id)
);

-- ---------- Auditoría (append-only) ----------
CREATE TABLE audit_log (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at    timestamptz NOT NULL DEFAULT now(),
  caja_id        uuid,
  actor_user_id  uuid,
  actor_role     user_role,
  accion         varchar(60) NOT NULL,                      -- LOGIN_OK, LOGIN_FAIL, OPERACION_CREADA, PERIODO_CERRADO...
  entidad        varchar(60),
  entidad_id     uuid,
  antes          jsonb,
  despues        jsonb,
  ip             inet,
  user_agent     text,
  request_id     uuid
);
CREATE INDEX ix_audit_entidad ON audit_log (entidad, entidad_id);
CREATE INDEX ix_audit_actor   ON audit_log (actor_user_id, occurred_at DESC);
CREATE INDEX ix_audit_brin    ON audit_log USING brin (occurred_at);

CREATE OR REPLACE FUNCTION fn_audit_inmutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log es de solo inserción';
END $$;
CREATE TRIGGER trg_audit_inmutable BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION fn_audit_inmutable();

-- ---------- Triggers updated_at ----------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['caja','app_user','socio','periodo','operacion','prestamo','cuota_prestamo','distribucion_utilidad']
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON %1$I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t);
  END LOOP;
END $$;

-- Bloquea cambios contables en periodos cerrados (cabecera y detalle)
CREATE OR REPLACE FUNCTION fn_bloquear_periodo_cerrado() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_row     jsonb := to_jsonb(CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END);
  v_periodo uuid;
  v_estado  periodo_estado;
BEGIN
  IF TG_TABLE_NAME = 'operacion' THEN
    v_periodo := (v_row ->> 'periodo_id')::uuid;
  ELSE
    SELECT periodo_id INTO v_periodo FROM operacion WHERE id = (v_row ->> 'operacion_id')::uuid;
  END IF;
  SELECT estado INTO v_estado FROM periodo WHERE id = v_periodo;
  IF v_estado = 'CERRADO' THEN
    RAISE EXCEPTION 'El periodo está cerrado: no se permiten cambios' USING ERRCODE = 'P0001';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;

CREATE TRIGGER trg_operacion_periodo_cerrado BEFORE INSERT OR UPDATE OR DELETE ON operacion
  FOR EACH ROW EXECUTE FUNCTION fn_bloquear_periodo_cerrado();
CREATE TRIGGER trg_detalle_periodo_cerrado BEFORE INSERT OR UPDATE OR DELETE ON operacion_detalle
  FOR EACH ROW EXECUTE FUNCTION fn_bloquear_periodo_cerrado();

-- ---------- Vistas (security_invoker => respetan RLS del usuario que consulta) ----------
CREATE VIEW v_libro_caja_mensual WITH (security_invoker = true) AS
SELECT p.caja_id, p.id AS periodo_id, p.anio, p.mes,
  -- Ingresos (columnas del Excel)
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'DEPOSITO_AHORRO'),   0) AS deposito_ahorros,
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'PAGO_CAPITAL'),      0) AS pagos_capital,
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'INTERES_RECIBIDO'),  0) AS intereses_recibidos,
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'ACCION'),            0) AS acciones,
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'MULTA_TARDANZA'),    0) AS otros_tardanza,
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'RESERVA'),           0) AS reservas,
  COALESCE(SUM(d.monto) FILTER (WHERE d.tipo = 'INGRESO'),             0) AS total_ingresos,
  -- Egresos
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'RETIRO_AHORRO'),     0) AS retiros_ahorros,
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'PRESTAMO'),          0) AS prestamos,
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'INTERES_PAGADO'),    0) AS interes_pagado,
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'GASTO_ADMIN'),       0) AS gastos_admin,
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'UTILIDAD_DISTRIBUIDA'), 0) AS utilidad_distribuida,
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'RED'),               0) AS red,
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'OTRO_EGRESO'),       0) AS otros_egresos,
  COALESCE(SUM(d.monto) FILTER (WHERE d.tipo = 'EGRESO'),              0) AS total_egresos
FROM periodo p
LEFT JOIN operacion o          ON o.periodo_id = p.id AND o.estado = 'VIGENTE'
LEFT JOIN operacion_detalle d  ON d.operacion_id = o.id
LEFT JOIN concepto c           ON c.id = d.concepto_id
GROUP BY p.caja_id, p.id, p.anio, p.mes;

CREATE VIEW v_saldo_caja WITH (security_invoker = true) AS
SELECT caja_id, periodo_id, anio, mes, total_ingresos, total_egresos,
  COALESCE(SUM(total_ingresos - total_egresos) OVER w_prev, 0)  AS saldo_anterior,
  SUM(total_ingresos - total_egresos) OVER w_acum               AS saldo_final
FROM v_libro_caja_mensual
WINDOW w_acum AS (PARTITION BY caja_id ORDER BY anio, mes),
       w_prev AS (PARTITION BY caja_id ORDER BY anio, mes ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING);

CREATE VIEW v_saldo_ahorro_socio WITH (security_invoker = true) AS
SELECT o.caja_id, o.socio_id,
  SUM(CASE c.codigo WHEN 'DEPOSITO_AHORRO' THEN d.monto
                    WHEN 'RETIRO_AHORRO'   THEN -d.monto ELSE 0 END) AS saldo_ahorro
FROM operacion o
JOIN operacion_detalle d ON d.operacion_id = o.id
JOIN concepto c          ON c.id = d.concepto_id
WHERE o.estado = 'VIGENTE' AND o.socio_id IS NOT NULL
GROUP BY o.caja_id, o.socio_id;

CREATE VIEW v_acciones_socio WITH (security_invoker = true) AS
SELECT o.caja_id, o.socio_id,
  SUM(d.monto) AS monto_acciones,
  FLOOR(SUM(d.monto) / NULLIF((SELECT pa.valor FROM parametro pa
                               WHERE pa.caja_id = o.caja_id AND pa.clave = 'VALOR_ACCION'
                               ORDER BY pa.vigente_desde DESC LIMIT 1), 0))::int AS nro_acciones
FROM operacion o
JOIN operacion_detalle d ON d.operacion_id = o.id
JOIN concepto c          ON c.id = d.concepto_id AND c.codigo = 'ACCION'
WHERE o.estado = 'VIGENTE' AND o.socio_id IS NOT NULL
GROUP BY o.caja_id, o.socio_id;

CREATE VIEW v_prestamo_saldo WITH (security_invoker = true) AS
SELECT p.id AS prestamo_id, p.caja_id, p.socio_id, p.monto_principal, p.estado,
  COALESCE(SUM(c.capital_pagado), 0)                          AS capital_pagado,
  p.monto_principal - COALESCE(SUM(c.capital_pagado), 0)      AS saldo_capital,
  COUNT(*) FILTER (WHERE c.estado = 'VENCIDA')                AS cuotas_vencidas
FROM prestamo p
LEFT JOIN cuota_prestamo c ON c.prestamo_id = p.id
GROUP BY p.id;

-- ---------- Row Level Security (defensa en profundidad) ----------
CREATE OR REPLACE FUNCTION app_caja_id()  RETURNS uuid    LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.caja_id',  true), '')::uuid $$;
CREATE OR REPLACE FUNCTION app_socio_id() RETURNS uuid    LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.socio_id', true), '')::uuid $$;
CREATE OR REPLACE FUNCTION app_es_admin() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT coalesce(current_setting('app.role', true), '') = 'ADMIN' $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['socio','operacion','operacion_detalle','prestamo','cuota_prestamo',
                           'distribucion_utilidad','distribucion_utilidad_detalle','periodo','parametro']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- socio
CREATE POLICY socio_admin ON socio FOR ALL
  USING (caja_id = app_caja_id() AND app_es_admin()) WITH CHECK (caja_id = app_caja_id() AND app_es_admin());
CREATE POLICY socio_self  ON socio FOR SELECT
  USING (caja_id = app_caja_id() AND id = app_socio_id());

-- operacion (el socio solo ve sus propias operaciones)
CREATE POLICY operacion_admin ON operacion FOR ALL
  USING (caja_id = app_caja_id() AND app_es_admin()) WITH CHECK (caja_id = app_caja_id() AND app_es_admin());
CREATE POLICY operacion_self  ON operacion FOR SELECT
  USING (caja_id = app_caja_id() AND socio_id = app_socio_id());

-- prestamo
CREATE POLICY prestamo_admin ON prestamo FOR ALL
  USING (caja_id = app_caja_id() AND app_es_admin()) WITH CHECK (caja_id = app_caja_id() AND app_es_admin());
CREATE POLICY prestamo_self  ON prestamo FOR SELECT
  USING (caja_id = app_caja_id() AND socio_id = app_socio_id());

-- hijas: heredan visibilidad de la cabecera
CREATE POLICY detalle_read  ON operacion_detalle FOR SELECT
  USING (EXISTS (SELECT 1 FROM operacion o WHERE o.id = operacion_detalle.operacion_id));
CREATE POLICY detalle_admin ON operacion_detalle FOR ALL
  USING (app_es_admin() AND EXISTS (SELECT 1 FROM operacion o WHERE o.id = operacion_detalle.operacion_id))
  WITH CHECK (app_es_admin() AND EXISTS (SELECT 1 FROM operacion o WHERE o.id = operacion_detalle.operacion_id));

CREATE POLICY cuota_read  ON cuota_prestamo FOR SELECT
  USING (EXISTS (SELECT 1 FROM prestamo p WHERE p.id = cuota_prestamo.prestamo_id));
CREATE POLICY cuota_admin ON cuota_prestamo FOR ALL
  USING (app_es_admin() AND EXISTS (SELECT 1 FROM prestamo p WHERE p.id = cuota_prestamo.prestamo_id))
  WITH CHECK (app_es_admin() AND EXISTS (SELECT 1 FROM prestamo p WHERE p.id = cuota_prestamo.prestamo_id));

-- utilidades
CREATE POLICY distrib_read  ON distribucion_utilidad FOR SELECT USING (caja_id = app_caja_id());
CREATE POLICY distrib_admin ON distribucion_utilidad FOR ALL
  USING (caja_id = app_caja_id() AND app_es_admin()) WITH CHECK (caja_id = app_caja_id() AND app_es_admin());
CREATE POLICY distrib_det_admin ON distribucion_utilidad_detalle FOR ALL
  USING (app_es_admin() AND EXISTS (SELECT 1 FROM distribucion_utilidad d WHERE d.id = distribucion_id))
  WITH CHECK (app_es_admin() AND EXISTS (SELECT 1 FROM distribucion_utilidad d WHERE d.id = distribucion_id));
CREATE POLICY distrib_det_self ON distribucion_utilidad_detalle FOR SELECT USING (socio_id = app_socio_id());

-- periodo y parametro
CREATE POLICY periodo_read  ON periodo FOR SELECT USING (caja_id = app_caja_id());
CREATE POLICY periodo_admin ON periodo FOR ALL
  USING (caja_id = app_caja_id() AND app_es_admin()) WITH CHECK (caja_id = app_caja_id() AND app_es_admin());
CREATE POLICY parametro_read  ON parametro FOR SELECT USING (caja_id = app_caja_id());
CREATE POLICY parametro_admin ON parametro FOR ALL
  USING (caja_id = app_caja_id() AND app_es_admin()) WITH CHECK (caja_id = app_caja_id() AND app_es_admin());

-- ---------- Datos semilla (catálogo de conceptos) ----------
INSERT INTO concepto (codigo, nombre, tipo, requiere_socio, orden) VALUES
  ('DEPOSITO_AHORRO',      'Depósito de ahorros',       'INGRESO', true,  1),
  ('PAGO_CAPITAL',         'Pagos de capital',          'INGRESO', true,  2),
  ('INTERES_RECIBIDO',     'Intereses recibidos',       'INGRESO', true,  3),
  ('ACCION',               'Acciones',                  'INGRESO', true,  4),
  ('MULTA_TARDANZA',       'Otros / tardanza',          'INGRESO', true,  5),
  ('RESERVA',              'Reservas',                  'INGRESO', false, 6),
  ('OTRO_INGRESO',         'Otros ingresos',            'INGRESO', false, 7),
  ('RETIRO_AHORRO',        'Retiros de ahorros',        'EGRESO',  true,  1),
  ('PRESTAMO',             'Préstamos',                 'EGRESO',  true,  2),
  ('INTERES_PAGADO',       'Interés pagado',            'EGRESO',  true,  3),
  ('GASTO_ADMIN',          'Gastos administrativos',    'EGRESO',  false, 4),
  ('UTILIDAD_DISTRIBUIDA', 'Utilidad distribuida',      'EGRESO',  true,  5),
  ('RED',                  'Red',                       'EGRESO',  false, 6),
  ('OTRO_EGRESO',          'Otros egresos',             'EGRESO',  false, 7);
