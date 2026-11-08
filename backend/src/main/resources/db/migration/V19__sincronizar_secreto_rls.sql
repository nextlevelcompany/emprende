-- =====================================================================
-- V19__sincronizar_secreto_rls.sql
-- Asegura que el secreto RLS de la base de datos coincida con la variable
-- de entorno RLS_CONTEXT_HMAC_SECRET_HEX configurada en el backend.
-- =====================================================================

INSERT INTO rls_private.context_secret (singleton, secret_hex)
VALUES (true, '${rls_context_secret_hex}')
ON CONFLICT (singleton) DO UPDATE
SET secret_hex = EXCLUDED.secret_hex;
