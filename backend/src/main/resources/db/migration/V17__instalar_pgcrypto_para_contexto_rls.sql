-- V16 delega la validación de HMAC a pgcrypto. Algunas instalaciones
-- existentes no tenían la extensión, por lo que context_is_valid() devolvía
-- false y RLS denegaba también las solicitudes legítimas.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

DO $$
BEGIN
  IF to_regprocedure('public.hmac(bytea,bytea,text)') IS NULL THEN
    RAISE EXCEPTION 'pgcrypto no instaló public.hmac(bytea, bytea, text); no se puede habilitar el contexto RLS firmado';
  END IF;
END $$;
