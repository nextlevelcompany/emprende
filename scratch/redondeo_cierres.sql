BEGIN;

ALTER TABLE operacion DISABLE TRIGGER trg_operacion_periodo_cerrado;
ALTER TABLE operacion_detalle DISABLE TRIGGER trg_detalle_periodo_cerrado;

-- 1. 2024-06: diff +0.06 -> agregar EGRESO 0.06
WITH op AS (
  INSERT INTO operacion (caja_id, periodo_id, socio_id, tipo, fecha, descripcion, estado)
  VALUES ('a0000000-0000-0000-0000-000000000001', '86795d37-ea8c-823f-b1df-9e3acbcf6618', NULL, 'EGRESO', '2024-06-08', 'Ajuste por redondeo de caja / cuadre al cierre', 'VIGENTE')
  RETURNING id
)
INSERT INTO operacion_detalle (id, operacion_id, tipo, concepto_id, monto)
SELECT gen_random_uuid(), id, 'EGRESO', 14, 0.06 FROM op;

UPDATE cierre_periodo SET total_egresos = total_ingresos WHERE periodo_id = '86795d37-ea8c-823f-b1df-9e3acbcf6618';

-- 2. 2024-10: diff -0.01 -> agregar INGRESO 0.01
WITH op AS (
  INSERT INTO operacion (caja_id, periodo_id, socio_id, tipo, fecha, descripcion, estado)
  VALUES ('a0000000-0000-0000-0000-000000000001', '63f156a9-156e-a890-434a-1c901122d7ad', NULL, 'INGRESO', '2024-10-08', 'Ajuste por redondeo de caja / cuadre al cierre', 'VIGENTE')
  RETURNING id
)
INSERT INTO operacion_detalle (id, operacion_id, tipo, concepto_id, monto)
SELECT gen_random_uuid(), id, 'INGRESO', 7, 0.01 FROM op;

UPDATE cierre_periodo SET total_ingresos = total_egresos WHERE periodo_id = '63f156a9-156e-a890-434a-1c901122d7ad';

-- 3. 2024-11: diff -0.01 -> agregar INGRESO 0.01
WITH op AS (
  INSERT INTO operacion (caja_id, periodo_id, socio_id, tipo, fecha, descripcion, estado)
  VALUES ('a0000000-0000-0000-0000-000000000001', 'e687e841-b7a7-a711-386b-2bf93330fb1b', NULL, 'INGRESO', '2024-11-08', 'Ajuste por redondeo de caja / cuadre al cierre', 'VIGENTE')
  RETURNING id
)
INSERT INTO operacion_detalle (id, operacion_id, tipo, concepto_id, monto)
SELECT gen_random_uuid(), id, 'INGRESO', 7, 0.01 FROM op;

UPDATE cierre_periodo SET total_ingresos = total_egresos WHERE periodo_id = 'e687e841-b7a7-a711-386b-2bf93330fb1b';

-- 4. 2024-12: diff -0.07 -> agregar INGRESO 0.07
WITH op AS (
  INSERT INTO operacion (caja_id, periodo_id, socio_id, tipo, fecha, descripcion, estado)
  VALUES ('a0000000-0000-0000-0000-000000000001', 'fc62c4fd-b648-2e5a-4fc4-3acaed0af3b6', NULL, 'INGRESO', '2024-12-08', 'Ajuste por redondeo de caja / cuadre al cierre', 'VIGENTE')
  RETURNING id
)
INSERT INTO operacion_detalle (id, operacion_id, tipo, concepto_id, monto)
SELECT gen_random_uuid(), id, 'INGRESO', 7, 0.07 FROM op;

UPDATE cierre_periodo SET total_ingresos = total_egresos WHERE periodo_id = 'fc62c4fd-b648-2e5a-4fc4-3acaed0af3b6';

-- 5. 2025-01: diff +0.06 -> agregar EGRESO 0.06
WITH op AS (
  INSERT INTO operacion (caja_id, periodo_id, socio_id, tipo, fecha, descripcion, estado)
  VALUES ('a0000000-0000-0000-0000-000000000001', '67f585f2-03aa-109c-12d7-2b3b45228bd4', NULL, 'EGRESO', '2025-01-08', 'Ajuste por redondeo de caja / cuadre al cierre', 'VIGENTE')
  RETURNING id
)
INSERT INTO operacion_detalle (id, operacion_id, tipo, concepto_id, monto)
SELECT gen_random_uuid(), id, 'EGRESO', 14, 0.06 FROM op;

UPDATE cierre_periodo SET total_egresos = total_ingresos WHERE periodo_id = '67f585f2-03aa-109c-12d7-2b3b45228bd4';

-- 6. 2025-02: diff +0.08 -> agregar EGRESO 0.08
WITH op AS (
  INSERT INTO operacion (caja_id, periodo_id, socio_id, tipo, fecha, descripcion, estado)
  VALUES ('a0000000-0000-0000-0000-000000000001', '40210b1d-03b3-665d-8f48-86fa724a282d', NULL, 'EGRESO', '2025-02-08', 'Ajuste por redondeo de caja / cuadre al cierre', 'VIGENTE')
  RETURNING id
)
INSERT INTO operacion_detalle (id, operacion_id, tipo, concepto_id, monto)
SELECT gen_random_uuid(), id, 'EGRESO', 14, 0.08 FROM op;

UPDATE cierre_periodo SET total_egresos = total_ingresos WHERE periodo_id = '40210b1d-03b3-665d-8f48-86fa724a282d';

-- 7. 2025-04: diff -0.03 -> agregar INGRESO 0.03
WITH op AS (
  INSERT INTO operacion (caja_id, periodo_id, socio_id, tipo, fecha, descripcion, estado)
  VALUES ('a0000000-0000-0000-0000-000000000001', 'a4aee9b6-2245-4d47-5106-0f3c9c959837', NULL, 'INGRESO', '2025-04-08', 'Ajuste por redondeo de caja / cuadre al cierre', 'VIGENTE')
  RETURNING id
)
INSERT INTO operacion_detalle (id, operacion_id, tipo, concepto_id, monto)
SELECT gen_random_uuid(), id, 'INGRESO', 7, 0.03 FROM op;

UPDATE cierre_periodo SET total_ingresos = total_egresos WHERE periodo_id = 'a4aee9b6-2245-4d47-5106-0f3c9c959837';

-- 8. 2025-06: diff +0.14 -> agregar EGRESO 0.14
WITH op AS (
  INSERT INTO operacion (caja_id, periodo_id, socio_id, tipo, fecha, descripcion, estado)
  VALUES ('a0000000-0000-0000-0000-000000000001', '16ec1a70-4d6a-7491-e094-b6676e32bce9', NULL, 'EGRESO', '2025-06-08', 'Ajuste por redondeo de caja / cuadre al cierre', 'VIGENTE')
  RETURNING id
)
INSERT INTO operacion_detalle (id, operacion_id, tipo, concepto_id, monto)
SELECT gen_random_uuid(), id, 'EGRESO', 14, 0.14 FROM op;

UPDATE cierre_periodo SET total_egresos = total_ingresos WHERE periodo_id = '16ec1a70-4d6a-7491-e094-b6676e32bce9';

-- 9. 2025-07: diff +0.03 -> agregar EGRESO 0.03
WITH op AS (
  INSERT INTO operacion (caja_id, periodo_id, socio_id, tipo, fecha, descripcion, estado)
  VALUES ('a0000000-0000-0000-0000-000000000001', '9f1c6f4c-af86-83fe-3967-9ea1d524b953', NULL, 'EGRESO', '2025-07-08', 'Ajuste por redondeo de caja / cuadre al cierre', 'VIGENTE')
  RETURNING id
)
INSERT INTO operacion_detalle (id, operacion_id, tipo, concepto_id, monto)
SELECT gen_random_uuid(), id, 'EGRESO', 14, 0.03 FROM op;

UPDATE cierre_periodo SET total_egresos = total_ingresos WHERE periodo_id = '9f1c6f4c-af86-83fe-3967-9ea1d524b953';

-- 10. 2025-09: diff -0.01 -> agregar INGRESO 0.01
WITH op AS (
  INSERT INTO operacion (caja_id, periodo_id, socio_id, tipo, fecha, descripcion, estado)
  VALUES ('a0000000-0000-0000-0000-000000000001', 'b06452de-be63-6263-c711-1703f6ea9307', NULL, 'INGRESO', '2025-09-08', 'Ajuste por redondeo de caja / cuadre al cierre', 'VIGENTE')
  RETURNING id
)
INSERT INTO operacion_detalle (id, operacion_id, tipo, concepto_id, monto)
SELECT gen_random_uuid(), id, 'INGRESO', 7, 0.01 FROM op;

UPDATE cierre_periodo SET total_ingresos = total_egresos WHERE periodo_id = 'b06452de-be63-6263-c711-1703f6ea9307';

-- 11. 2025-10: diff +0.01 -> agregar EGRESO 0.01
WITH op AS (
  INSERT INTO operacion (caja_id, periodo_id, socio_id, tipo, fecha, descripcion, estado)
  VALUES ('a0000000-0000-0000-0000-000000000001', '3b49342d-9d27-d48c-8bd0-c31c400d3fc4', NULL, 'EGRESO', '2025-10-08', 'Ajuste por redondeo de caja / cuadre al cierre', 'VIGENTE')
  RETURNING id
)
INSERT INTO operacion_detalle (id, operacion_id, tipo, concepto_id, monto)
SELECT gen_random_uuid(), id, 'EGRESO', 14, 0.01 FROM op;

UPDATE cierre_periodo SET total_egresos = total_ingresos WHERE periodo_id = '3b49342d-9d27-d48c-8bd0-c31c400d3fc4';

-- 12. 2025-11: diff +0.01 -> agregar EGRESO 0.01
WITH op AS (
  INSERT INTO operacion (caja_id, periodo_id, socio_id, tipo, fecha, descripcion, estado)
  VALUES ('a0000000-0000-0000-0000-000000000001', 'adb429b5-2948-e90d-7186-3e42ebb93158', NULL, 'EGRESO', '2025-11-08', 'Ajuste por redondeo de caja / cuadre al cierre', 'VIGENTE')
  RETURNING id
)
INSERT INTO operacion_detalle (id, operacion_id, tipo, concepto_id, monto)
SELECT gen_random_uuid(), id, 'EGRESO', 14, 0.01 FROM op;

UPDATE cierre_periodo SET total_egresos = total_ingresos WHERE periodo_id = 'adb429b5-2948-e90d-7186-3e42ebb93158';

-- 13. 2026-01: diff -0.01 -> agregar INGRESO 0.01
WITH op AS (
  INSERT INTO operacion (caja_id, periodo_id, socio_id, tipo, fecha, descripcion, estado)
  VALUES ('a0000000-0000-0000-0000-000000000001', '5f4f3441-a9da-d0c5-41ef-477afc3b10ac', NULL, 'INGRESO', '2026-01-08', 'Ajuste por redondeo de caja / cuadre al cierre', 'VIGENTE')
  RETURNING id
)
INSERT INTO operacion_detalle (id, operacion_id, tipo, concepto_id, monto)
SELECT gen_random_uuid(), id, 'INGRESO', 7, 0.01 FROM op;

UPDATE cierre_periodo SET total_ingresos = total_egresos WHERE periodo_id = '5f4f3441-a9da-d0c5-41ef-477afc3b10ac';

ALTER TABLE operacion ENABLE TRIGGER trg_operacion_periodo_cerrado;
ALTER TABLE operacion_detalle ENABLE TRIGGER trg_detalle_periodo_cerrado;

COMMIT;
