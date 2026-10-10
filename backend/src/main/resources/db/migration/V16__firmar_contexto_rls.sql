-- Elimina la confianza directa en GUCs que app_rw puede establecer por sí
-- mismo. El proceso backend firma cada contexto autenticado con una clave
-- compartida; la función SECURITY DEFINER valida la firma sin exponer la clave.
CREATE SCHEMA IF NOT EXISTS rls_private AUTHORIZATION CURRENT_USER;
REVOKE ALL ON SCHEMA rls_private FROM PUBLIC, app_rw, app_ro;
GRANT USAGE ON SCHEMA rls_private TO app_rw;

CREATE TABLE rls_private.context_secret (
    singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
    secret_hex varchar(64) NOT NULL CHECK (secret_hex ~ '^[0-9a-fA-F]{64}$')
);
REVOKE ALL ON rls_private.context_secret FROM PUBLIC, app_rw, app_ro;

INSERT INTO rls_private.context_secret (singleton, secret_hex)
VALUES (true, '${rls_context_secret_hex}');

CREATE OR REPLACE FUNCTION rls_private.context_is_valid()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, rls_private, public
AS $$
DECLARE
    v_caja text := nullif(current_setting('app.caja_id', true), '');
    v_socio text := nullif(current_setting('app.socio_id', true), '');
    v_role text := upper(coalesce(current_setting('app.role', true), ''));
    v_signature text := lower(coalesce(current_setting('app.context_signature', true), ''));
    v_secret text;
    v_expected text;
BEGIN
    IF v_caja IS NULL OR v_role NOT IN ('ADMIN', 'SOCIO')
       OR v_signature !~ '^[0-9a-f]{64}$' THEN
        RETURN false;
    END IF;

    SELECT secret_hex INTO STRICT v_secret
    FROM rls_private.context_secret WHERE singleton = true;

    v_expected := encode(
        public.hmac(
            convert_to(v_caja || E'\n' || coalesce(v_socio, '') || E'\n' || v_role, 'UTF8'),
            decode(v_secret, 'hex'),
            'sha256'
        ),
        'hex'
    );
    RETURN v_signature = v_expected;
EXCEPTION WHEN OTHERS THEN
    RETURN false;
END;
$$;
REVOKE ALL ON FUNCTION rls_private.context_is_valid() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rls_private.context_is_valid() TO app_rw;

CREATE OR REPLACE FUNCTION public.app_caja_id()
RETURNS uuid LANGUAGE sql STABLE
SET search_path = pg_catalog, public, rls_private
AS $$
  SELECT CASE WHEN rls_private.context_is_valid()
              THEN nullif(current_setting('app.caja_id', true), '')::uuid
              ELSE NULL::uuid END
$$;

CREATE OR REPLACE FUNCTION public.app_socio_id()
RETURNS uuid LANGUAGE sql STABLE
SET search_path = pg_catalog, public, rls_private
AS $$
  SELECT CASE WHEN rls_private.context_is_valid()
              THEN nullif(current_setting('app.socio_id', true), '')::uuid
              ELSE NULL::uuid END
$$;

CREATE OR REPLACE FUNCTION public.app_es_admin()
RETURNS boolean LANGUAGE sql STABLE
SET search_path = pg_catalog, public, rls_private
AS $$
  SELECT rls_private.context_is_valid()
     AND upper(coalesce(current_setting('app.role', true), '')) = 'ADMIN'
$$;
