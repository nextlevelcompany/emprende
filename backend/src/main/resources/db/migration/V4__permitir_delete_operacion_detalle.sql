-- =====================================================================
-- V4__permitir_delete_operacion_detalle.sql  |  PostgreSQL 16+
-- Concede permiso DELETE a app_rw sobre operacion_detalle para permitir
-- la remoción o ajuste de conceptos en operaciones de periodos abiertos.
-- La inmutabilidad de periodos cerrados se mantiene garantizada por
-- el trigger trg_detalle_periodo_cerrado.
-- =====================================================================

GRANT DELETE ON operacion_detalle TO app_rw;
