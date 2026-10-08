BEGIN;
ALTER TABLE operacion DISABLE TRIGGER trg_operacion_periodo_cerrado;
ALTER TABLE operacion_detalle DISABLE TRIGGER trg_detalle_periodo_cerrado;

-- 1. CREAR CONCEPTO DEVOLUCION_CAPITAL SI NO EXISTE
INSERT INTO concepto (codigo, nombre, tipo, requiere_socio, orden, activo)
VALUES ('DEVOLUCION_CAPITAL', 'Devolución de capital social', 'EGRESO', true, 15, true)
ON CONFLICT (codigo) DO NOTHING;

-- 2. INSERTAR DEVOLUCIONES DE CAPITAL SOCIAL DE JUNIO 2026 (S/. 26,001.29)
-- EDITH PILAR LINDO MORAN (S/. 9001.29)
INSERT INTO operacion (id, caja_id, periodo_id, socio_id, tipo, fecha, nro_recibo, descripcion, estado, created_at, created_by, updated_at)
VALUES ('48b72f40-fce8-6f48-c013-d1fac09be9f2', 'a0000000-0000-0000-0000-000000000001', 'a292dc72-ec9e-0757-512b-7db828497365', '01a10f3a-7f3b-7309-be00-9d669a6a2820', 'EGRESO', '2026-06-08', NULL, 'Devolución de capital social por retiro (Asamblea 2026-06-08) - EDITH PILAR LINDO MORAN', 'VIGENTE', '2026-06-08 12:00:00+00', '01a10e7a-0c97-7e1f-aca6-64803b2c03c4', '2026-06-08 12:00:00+00')
ON CONFLICT (id) DO UPDATE SET descripcion = EXCLUDED.descripcion;
INSERT INTO operacion_detalle (id, operacion_id, tipo, concepto_id, monto)
VALUES ('7a458fe6-0973-f95a-7d53-1a268f1980d4', '48b72f40-fce8-6f48-c013-d1fac09be9f2', 'EGRESO', (SELECT id FROM concepto WHERE codigo = 'DEVOLUCION_CAPITAL'), 9001.29)
ON CONFLICT (id) DO UPDATE SET monto = EXCLUDED.monto, concepto_id = EXCLUDED.concepto_id;

-- YAJHAIRA ROCIO LINDO MORAN (S/. 8940.00)
INSERT INTO operacion (id, caja_id, periodo_id, socio_id, tipo, fecha, nro_recibo, descripcion, estado, created_at, created_by, updated_at)
VALUES ('9453a7b4-6198-21fd-c2ff-851c6e20dab3', 'a0000000-0000-0000-0000-000000000001', 'a292dc72-ec9e-0757-512b-7db828497365', '01a10f3a-7f73-7074-9f57-b295bd4ce788', 'EGRESO', '2026-06-08', NULL, 'Devolución de capital social por retiro (Asamblea 2026-06-08) - YAJHAIRA ROCIO LINDO MORAN', 'VIGENTE', '2026-06-08 12:00:00+00', '01a10e7a-0c97-7e1f-aca6-64803b2c03c4', '2026-06-08 12:00:00+00')
ON CONFLICT (id) DO UPDATE SET descripcion = EXCLUDED.descripcion;
INSERT INTO operacion_detalle (id, operacion_id, tipo, concepto_id, monto)
VALUES ('509d3b0a-1852-cc33-14f3-0e108533a149', '9453a7b4-6198-21fd-c2ff-851c6e20dab3', 'EGRESO', (SELECT id FROM concepto WHERE codigo = 'DEVOLUCION_CAPITAL'), 8940.00)
ON CONFLICT (id) DO UPDATE SET monto = EXCLUDED.monto, concepto_id = EXCLUDED.concepto_id;

-- HENRY JOSE HUAMAN CANTURIN (S/. 1110.00)
INSERT INTO operacion (id, caja_id, periodo_id, socio_id, tipo, fecha, nro_recibo, descripcion, estado, created_at, created_by, updated_at)
VALUES ('084ddf7e-388a-66b2-39ee-ed0a0b4a8a14', 'a0000000-0000-0000-0000-000000000001', 'a292dc72-ec9e-0757-512b-7db828497365', '01a10f3a-7fb7-7ddc-add4-9fd93b83b88b', 'EGRESO', '2026-06-08', NULL, 'Devolución de capital social por retiro (Asamblea 2026-06-08) - HENRY JOSE HUAMAN CANTURIN', 'VIGENTE', '2026-06-08 12:00:00+00', '01a10e7a-0c97-7e1f-aca6-64803b2c03c4', '2026-06-08 12:00:00+00')
ON CONFLICT (id) DO UPDATE SET descripcion = EXCLUDED.descripcion;
INSERT INTO operacion_detalle (id, operacion_id, tipo, concepto_id, monto)
VALUES ('a6109000-7afb-c6ac-5961-51a8bcc8667e', '084ddf7e-388a-66b2-39ee-ed0a0b4a8a14', 'EGRESO', (SELECT id FROM concepto WHERE codigo = 'DEVOLUCION_CAPITAL'), 1110.00)
ON CONFLICT (id) DO UPDATE SET monto = EXCLUDED.monto, concepto_id = EXCLUDED.concepto_id;

-- TEOFILA MORAN VASQUEZ (S/. 1950.00)
INSERT INTO operacion (id, caja_id, periodo_id, socio_id, tipo, fecha, nro_recibo, descripcion, estado, created_at, created_by, updated_at)
VALUES ('dfe558c3-3407-6882-bc6f-bbca88be79e7', 'a0000000-0000-0000-0000-000000000001', 'a292dc72-ec9e-0757-512b-7db828497365', '01a10f3a-8004-7118-aea6-aebeb766fb41', 'EGRESO', '2026-06-08', NULL, 'Devolución de capital social por retiro (Asamblea 2026-06-08) - TEOFILA MORAN VASQUEZ', 'VIGENTE', '2026-06-08 12:00:00+00', '01a10e7a-0c97-7e1f-aca6-64803b2c03c4', '2026-06-08 12:00:00+00')
ON CONFLICT (id) DO UPDATE SET descripcion = EXCLUDED.descripcion;
INSERT INTO operacion_detalle (id, operacion_id, tipo, concepto_id, monto)
VALUES ('0d363032-f212-37f3-1e8c-dfeaa2608029', 'dfe558c3-3407-6882-bc6f-bbca88be79e7', 'EGRESO', (SELECT id FROM concepto WHERE codigo = 'DEVOLUCION_CAPITAL'), 1950.00)
ON CONFLICT (id) DO UPDATE SET monto = EXCLUDED.monto, concepto_id = EXCLUDED.concepto_id;

-- JUANA MARIA CACRO HINOSTROZA (S/. 5000.00)
INSERT INTO operacion (id, caja_id, periodo_id, socio_id, tipo, fecha, nro_recibo, descripcion, estado, created_at, created_by, updated_at)
VALUES ('7af634e6-79b6-fb4d-2563-be42d649971f', 'a0000000-0000-0000-0000-000000000001', 'a292dc72-ec9e-0757-512b-7db828497365', '01a10f3a-7f1e-708b-9624-4af5e433dfe7', 'EGRESO', '2026-06-08', NULL, 'Devolución de capital social por retiro (Asamblea 2026-06-08) - JUANA MARIA CACRO HINOSTROZA', 'VIGENTE', '2026-06-08 12:00:00+00', '01a10e7a-0c97-7e1f-aca6-64803b2c03c4', '2026-06-08 12:00:00+00')
ON CONFLICT (id) DO UPDATE SET descripcion = EXCLUDED.descripcion;
INSERT INTO operacion_detalle (id, operacion_id, tipo, concepto_id, monto)
VALUES ('1246c0cd-8e12-5f5c-92dd-dcc560b131f8', '7af634e6-79b6-fb4d-2563-be42d649971f', 'EGRESO', (SELECT id FROM concepto WHERE codigo = 'DEVOLUCION_CAPITAL'), 5000.00)
ON CONFLICT (id) DO UPDATE SET monto = EXCLUDED.monto, concepto_id = EXCLUDED.concepto_id;

-- 3. ACTUALIZAR DEVOLUCIONES DE CAPITAL SOCIAL DE JULIO 2026 (CONCEPTO DEVOLUCION_CAPITAL)
UPDATE operacion_detalle od
SET concepto_id = (SELECT id FROM concepto WHERE codigo = 'DEVOLUCION_CAPITAL')
WHERE od.id IN (
  'e709b6ea-3fbc-89af-57af-47c393467687', -- JUANA CACRO (S/. 850.00)
  '2b69f77c-d54d-967d-c0e4-73c701294af3', -- EDITH LINDO (S/. 1,648.71)
  '5db34086-f514-1ad7-7110-c48e6369348b'  -- MARGARITA LEON (S/. 1,950.00)
);
UPDATE operacion
SET descripcion = 'Devolución saldo final de capital social por retiro (Asamblea 2026-07-08) - JUANA MARIA CACRO HINOSTROZA'
WHERE id = 'e709b6ea-3fbc-89af-57af-47c393467687';
UPDATE operacion
SET descripcion = 'Devolución saldo final de capital social por retiro (Asamblea 2026-07-08) - EDITH PILAR LINDO MORAN'
WHERE id = '2b69f77c-d54d-967d-c0e4-73c701294af3';
UPDATE operacion
SET descripcion = 'Devolución de capital social por liquidación de 65 acciones (Asamblea 2026-07-08) - MARGARITA LEON CONDE'
WHERE id = '5db34086-f514-1ad7-7110-c48e6369348b';

ALTER TABLE operacion ENABLE TRIGGER trg_operacion_periodo_cerrado;
ALTER TABLE operacion_detalle ENABLE TRIGGER trg_detalle_periodo_cerrado;
COMMIT;