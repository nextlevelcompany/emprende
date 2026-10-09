-- =====================================================================
-- V7__permitir_delete_cuota_prestamo.sql  |  PostgreSQL 16+
-- Concede permiso DELETE a app_rw sobre cuota_prestamo para permitir
-- la regeneración de cuotas o remoción al reprogramar o anular préstamos.
-- =====================================================================

GRANT DELETE ON cuota_prestamo TO app_rw;
