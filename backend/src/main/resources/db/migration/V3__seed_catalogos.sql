-- =====================================================================
-- V3__seed_catalogos.sql  |  PostgreSQL 16+  |  Caja "Emprende Chambala"
-- Caja inicial fija para desarrollo/producción y parámetros contables base.
-- NOTA: El usuario ADMIN se crea mediante bootstrap de aplicación,
-- nunca mediante contraseñas quemadas en migraciones SQL.
-- =====================================================================

-- 1. Caja Comunal Principal ("Emprende Chambala")
INSERT INTO caja (id, nombre, moneda, zona_horaria, activa)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Caja Comunal Emprende Chambala',
  'PEN',
  'America/Lima',
  true
)
ON CONFLICT (id) DO NOTHING;

-- 2. Parámetros contables y operativos de la caja inicial
INSERT INTO parametro (caja_id, clave, valor, vigente_desde, descripcion)
VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'VALOR_ACCION',
    30.0000,
    '2023-07-01',
    'Valor nominal de cada acción de la caja comunal (en PEN S/.)'
  ),
  (
    'a0000000-0000-0000-0000-000000000001',
    'TASA_DEFECTO',
    0.0500,
    '2023-07-01',
    'Tasa de interés mensual por defecto para préstamos regulares (5 % = 0.0500)'
  ),
  (
    'a0000000-0000-0000-0000-000000000001',
    'DIA_REUNION',
    8.0000,
    '2023-07-01',
    'Día fijo del mes en que se celebra la asamblea y reunión de caja'
  ),
  (
    'a0000000-0000-0000-0000-000000000001',
    'SALDO_INICIAL_CAJA',
    0.0000,
    '2023-07-01',
    'Saldo inicial de caja al momento del arranque histórico de operaciones (julio 2023)'
  )
ON CONFLICT (caja_id, clave, vigente_desde) DO NOTHING;
