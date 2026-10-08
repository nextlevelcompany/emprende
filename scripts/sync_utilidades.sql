BEGIN;

DELETE FROM distribucion_utilidad_detalle;

-- 1. Distribución 2024
INSERT INTO distribucion_utilidad (
  id, caja_id, ejercicio, fecha_corte, utilidad_total, total_acciones, estado, aprobado_por, aprobado_at, created_at, updated_at
) VALUES (
  'c0000000-0000-0000-0000-000000002024', 'a0000000-0000-0000-0000-000000000001', 2024, '2024-06-08', 4243.52, 405, 'PAGADA', '01a10e7a-0c97-7e1f-aca6-64803b2c03c4', '2024-06-08 19:00:00+00', '2024-06-08 19:00:00+00', NOW()
) ON CONFLICT (caja_id, ejercicio) DO UPDATE SET
  total_acciones = EXCLUDED.total_acciones, utilidad_total = EXCLUDED.utilidad_total, estado = EXCLUDED.estado, updated_at = NOW();

INSERT INTO distribucion_utilidad_detalle (
  distribucion_id, socio_id, acciones, monto, monto_cobrado, monto_reinvertido, acciones_compradas, modalidad, operacion_id
) VALUES
  ('c0000000-0000-0000-0000-000000002024', '01a10f3a-7e4b-7148-9d2c-d9b709236310', 22, 269.72, 269.72, 0, 0, 'EFECTIVO', '6389e697-3c1d-d12e-ac11-7fa69bef2753'),
  ('c0000000-0000-0000-0000-000000002024', '01a10f3a-7e76-7d8d-b628-45fe5228ad9d', 28, 370.11, 370.11, 0, 0, 'EFECTIVO', '6389e697-3c1d-d12e-ac11-7fa69bef2753'),
  ('c0000000-0000-0000-0000-000000002024', '01a10f3a-7e8c-7907-9e87-61346c6d5318', 17, 200.79, 200.79, 0, 0, 'EFECTIVO', '6389e697-3c1d-d12e-ac11-7fa69bef2753'),
  ('c0000000-0000-0000-0000-000000002024', '01a10f3a-7ea1-7dfc-be82-7e2754a4db3c', 23, 244.24, 244.24, 0, 0, 'EFECTIVO', '6389e697-3c1d-d12e-ac11-7fa69bef2753'),
  ('c0000000-0000-0000-0000-000000002024', '01a10f3a-7eb9-7e1d-8b2b-81e0c2598c35', 45, 455.52, 455.52, 0, 0, 'EFECTIVO', '6389e697-3c1d-d12e-ac11-7fa69bef2753'),
  ('c0000000-0000-0000-0000-000000002024', '01a10f3a-7ece-778a-9572-2f1865c6b20b', 13, 149.84, 149.84, 0, 0, 'EFECTIVO', '6389e697-3c1d-d12e-ac11-7fa69bef2753'),
  ('c0000000-0000-0000-0000-000000002024', '01a10f3a-7ee6-714f-a1ec-9fda25bee73a', 28, 370.11, 370.11, 0, 0, 'EFECTIVO', '6389e697-3c1d-d12e-ac11-7fa69bef2753'),
  ('c0000000-0000-0000-0000-000000002024', '01a10f3a-7eff-7381-bf54-47bfedcad2f9', 29, 227.76, 227.76, 0, 0, 'EFECTIVO', '6389e697-3c1d-d12e-ac11-7fa69bef2753'),
  ('c0000000-0000-0000-0000-000000002024', '01a10f3a-7f1e-708b-9624-4af5e433dfe7', 26, 260.72, 260.72, 0, 0, 'EFECTIVO', '6389e697-3c1d-d12e-ac11-7fa69bef2753'),
  ('c0000000-0000-0000-0000-000000002024', '01a10f3a-801d-767c-bbf3-c066b407c724', 27, 253.23, 253.23, 0, 0, 'EFECTIVO', '6389e697-3c1d-d12e-ac11-7fa69bef2753'),
  ('c0000000-0000-0000-0000-000000002024', '01a10f3a-7f3b-7309-be00-9d669a6a2820', 47, 448.03, 448.03, 0, 0, 'EFECTIVO', '6389e697-3c1d-d12e-ac11-7fa69bef2753'),
  ('c0000000-0000-0000-0000-000000002024', '01a10f3a-7f55-7102-8d63-9433a269447a', 39, 347.63, 347.63, 0, 0, 'EFECTIVO', '6389e697-3c1d-d12e-ac11-7fa69bef2753'),
  ('c0000000-0000-0000-0000-000000002024', '01a10f3a-7f73-7074-9f57-b295bd4ce788', 41, 398.58, 398.58, 0, 0, 'EFECTIVO', '6389e697-3c1d-d12e-ac11-7fa69bef2753'),
  ('c0000000-0000-0000-0000-000000002024', '01a10f3a-7f97-7b5b-b833-8e178efe792f', 20, 194.79, 194.79, 0, 0, 'EFECTIVO', '6389e697-3c1d-d12e-ac11-7fa69bef2753');

-- 2. Distribución 2025
INSERT INTO distribucion_utilidad (
  id, caja_id, ejercicio, fecha_corte, utilidad_total, total_acciones, estado, aprobado_por, aprobado_at, created_at, updated_at
) VALUES (
  'c0000000-0000-0000-0000-000000002025', 'a0000000-0000-0000-0000-000000000001', 2025, '2025-05-08', 9894.31, 922, 'PAGADA', '01a10e7a-0c97-7e1f-aca6-64803b2c03c4', '2025-06-08 19:00:00+00', '2025-06-08 19:00:00+00', NOW()
) ON CONFLICT (caja_id, ejercicio) DO UPDATE SET
  fecha_corte = EXCLUDED.fecha_corte, total_acciones = EXCLUDED.total_acciones, utilidad_total = EXCLUDED.utilidad_total, estado = EXCLUDED.estado, updated_at = NOW();

INSERT INTO distribucion_utilidad_detalle (
  distribucion_id, socio_id, acciones, monto, monto_cobrado, monto_reinvertido, acciones_compradas, modalidad, operacion_id
) VALUES
  ('c0000000-0000-0000-0000-000000002025', '01a10f3a-7e4b-7148-9d2c-d9b709236310', 43, 513.25, 513.25, 0, 0, 'EFECTIVO', '8f467ae9-ada1-411f-ce60-33219edbfa42'),
  ('c0000000-0000-0000-0000-000000002025', '01a10f3a-7e76-7d8d-b628-45fe5228ad9d', 52, 636.43, 636.43, 0, 0, 'EFECTIVO', '8f467ae9-ada1-411f-ce60-33219edbfa42'),
  ('c0000000-0000-0000-0000-000000002025', '01a10f3a-7e8c-7907-9e87-61346c6d5318', 36, 416.32, 416.32, 0, 0, 'EFECTIVO', '8f467ae9-ada1-411f-ce60-33219edbfa42'),
  ('c0000000-0000-0000-0000-000000002025', '01a10f3a-7ea1-7dfc-be82-7e2754a4db3c', 49, 557.73, 377.73, 180.00, 6, 'MIXTO', '8f467ae9-ada1-411f-ce60-33219edbfa42'),
  ('c0000000-0000-0000-0000-000000002025', '01a10f3a-7eb9-7e1d-8b2b-81e0c2598c35', 75, 833.74, 83.74, 750.00, 25, 'MIXTO', '8f467ae9-ada1-411f-ce60-33219edbfa42'),
  ('c0000000-0000-0000-0000-000000002025', '01a10f3a-7ece-778a-9572-2f1865c6b20b', 25, 266.89, 26.89, 240.00, 8, 'MIXTO', '8f467ae9-ada1-411f-ce60-33219edbfa42'),
  ('c0000000-0000-0000-0000-000000002025', '01a10f3a-7ee6-714f-a1ec-9fda25bee73a', 52, 636.43, 636.43, 0, 0, 'EFECTIVO', '8f467ae9-ada1-411f-ce60-33219edbfa42'),
  ('c0000000-0000-0000-0000-000000002025', '01a10f3a-7eff-7381-bf54-47bfedcad2f9', 90, 799.53, 799.53, 0, 0, 'EFECTIVO', '8f467ae9-ada1-411f-ce60-33219edbfa42'),
  ('c0000000-0000-0000-0000-000000002025', '01a10f3a-7f1e-708b-9624-4af5e433dfe7', 66, 704.86, 14.86, 690.00, 23, 'MIXTO', '8f467ae9-ada1-411f-ce60-33219edbfa42'),
  ('c0000000-0000-0000-0000-000000002025', '01a10f3a-801d-767c-bbf3-c066b407c724', 68, 737.94, 737.94, 0, 0, 'EFECTIVO', '8f467ae9-ada1-411f-ce60-33219edbfa42'),
  ('c0000000-0000-0000-0000-000000002025', '01a10f3a-7f3b-7309-be00-9d669a6a2820', 130, 1405.16, 25.16, 1380.00, 46, 'MIXTO', '8f467ae9-ada1-411f-ce60-33219edbfa42'),
  ('c0000000-0000-0000-0000-000000002025', '01a10f3a-7f55-7102-8d63-9433a269447a', 111, 1141.69, 1.69, 1140.00, 38, 'MIXTO', '8f467ae9-ada1-411f-ce60-33219edbfa42'),
  ('c0000000-0000-0000-0000-000000002025', '01a10f3a-7f73-7074-9f57-b295bd4ce788', 90, 848.57, 8.57, 840.00, 28, 'MIXTO', '8f467ae9-ada1-411f-ce60-33219edbfa42'),
  ('c0000000-0000-0000-0000-000000002025', '01a10f3a-7f97-7b5b-b833-8e178efe792f', 35, 395.77, 245.77, 150.00, 5, 'MIXTO', '8f467ae9-ada1-411f-ce60-33219edbfa42');

-- Ejercicio 2026 (Oficial según REPARTO DE UTILIDADES UNICA CHAMBALA -MAYO2026.xlsx)
-- Período: JUNIO 2025 A MAYO 2026 - Corte: 08/05/2026 - Pagado: 08/06/2026 en efectivo
INSERT INTO distribucion_utilidad (
  id, caja_id, ejercicio, fecha_corte, utilidad_total, total_acciones, estado, aprobado_por, aprobado_at, created_at, updated_at
) VALUES (
  'c0000000-0000-0000-0000-000000002026', 'a0000000-0000-0000-0000-000000000001', 2026, '2026-05-08', 18652.84, 2469, 'PAGADA', '01a10e7a-0c97-7e1f-aca6-64803b2c03c4', '2026-06-08 19:00:00+00', '2026-06-08 19:00:00+00', NOW()
) ON CONFLICT (caja_id, ejercicio) DO UPDATE SET
  fecha_corte = EXCLUDED.fecha_corte, utilidad_total = EXCLUDED.utilidad_total, total_acciones = EXCLUDED.total_acciones, estado = EXCLUDED.estado, updated_at = NOW();

INSERT INTO distribucion_utilidad_detalle (
  distribucion_id, socio_id, acciones, monto, monto_cobrado, monto_reinvertido, acciones_compradas, modalidad, operacion_id
) VALUES
  ('c0000000-0000-0000-0000-000000002026', '01a10f3a-7e4b-7148-9d2c-d9b709236310', 109, 777.20, 777.20, 0, 0, 'EFECTIVO', '287bf48a-07fe-e7be-fd50-ef85b65cbd01'),
  ('c0000000-0000-0000-0000-000000002026', '01a10f3a-7e76-7d8d-b628-45fe5228ad9d', 64, 567.10, 567.10, 0, 0, 'EFECTIVO', '287bf48a-07fe-e7be-fd50-ef85b65cbd01'),
  ('c0000000-0000-0000-0000-000000002026', '01a10f3a-7e8c-7907-9e87-61346c6d5318', 66, 557.50, 557.50, 0, 0, 'EFECTIVO', '287bf48a-07fe-e7be-fd50-ef85b65cbd01'),
  ('c0000000-0000-0000-0000-000000002026', '01a10f3a-7ea1-7dfc-be82-7e2754a4db3c', 87, 730.30, 730.30, 0, 0, 'EFECTIVO', '287bf48a-07fe-e7be-fd50-ef85b65cbd01'),
  ('c0000000-0000-0000-0000-000000002026', '01a10f3a-7eb9-7e1d-8b2b-81e0c2598c35', 154, 1261.90, 1261.90, 0, 0, 'EFECTIVO', '287bf48a-07fe-e7be-fd50-ef85b65cbd01'),
  ('c0000000-0000-0000-0000-000000002026', '01a10f3a-7ece-778a-9572-2f1865c6b20b', 128, 793.40, 793.40, 0, 0, 'EFECTIVO', '287bf48a-07fe-e7be-fd50-ef85b65cbd01'),
  ('c0000000-0000-0000-0000-000000002026', '01a10f3a-7ee6-714f-a1ec-9fda25bee73a', 64, 567.10, 567.10, 0, 0, 'EFECTIVO', '287bf48a-07fe-e7be-fd50-ef85b65cbd01'),
  ('c0000000-0000-0000-0000-000000002026', '01a10f3a-7eff-7381-bf54-47bfedcad2f9', 180, 1430.80, 1430.80, 0, 0, 'EFECTIVO', '287bf48a-07fe-e7be-fd50-ef85b65cbd01'),
  ('c0000000-0000-0000-0000-000000002026', '01a10f3a-7f1e-708b-9624-4af5e433dfe7', 195, 1561.70, 1561.70, 0, 0, 'EFECTIVO', '287bf48a-07fe-e7be-fd50-ef85b65cbd01'),
  ('c0000000-0000-0000-0000-000000002026', '01a10f3a-801d-767c-bbf3-c066b407c724', 68, 659.20, 659.20, 0, 0, 'EFECTIVO', '287bf48a-07fe-e7be-fd50-ef85b65cbd01'),
  ('c0000000-0000-0000-0000-000000002026', '01a10f3a-7f3b-7309-be00-9d669a6a2820', 355, 2898.80, 2898.80, 0, 0, 'EFECTIVO', '287bf48a-07fe-e7be-fd50-ef85b65cbd01'),
  ('c0000000-0000-0000-0000-000000002026', '01a10f3a-7f55-7102-8d63-9433a269447a', 446, 2822.00, 2822.00, 0, 0, 'EFECTIVO', '287bf48a-07fe-e7be-fd50-ef85b65cbd01'),
  ('c0000000-0000-0000-0000-000000002026', '01a10f3a-7f73-7074-9f57-b295bd4ce788', 298, 2316.30, 2316.30, 0, 0, 'EFECTIVO', '287bf48a-07fe-e7be-fd50-ef85b65cbd01'),
  ('c0000000-0000-0000-0000-000000002026', '01a10f3a-7f97-7b5b-b833-8e178efe792f', 65, 549.40, 549.40, 0, 0, 'EFECTIVO', '287bf48a-07fe-e7be-fd50-ef85b65cbd01'),
  ('c0000000-0000-0000-0000-000000002026', '01a10f3a-7fb7-7ddc-add4-9fd93b83b88b', 37, 221.40, 221.40, 0, 0, 'EFECTIVO', '287bf48a-07fe-e7be-fd50-ef85b65cbd01'),
  ('c0000000-0000-0000-0000-000000002026', '01a10f3a-7fd1-70ff-a915-a946082b58b7', 69, 405.60, 405.60, 0, 0, 'EFECTIVO', '287bf48a-07fe-e7be-fd50-ef85b65cbd01'),
  ('c0000000-0000-0000-0000-000000002026', '01a10f3a-7fea-7c0e-b952-862211e55116', 19, 114.70, 114.70, 0, 0, 'EFECTIVO', '287bf48a-07fe-e7be-fd50-ef85b65cbd01'),
  ('c0000000-0000-0000-0000-000000002026', '01a10f3a-8004-7118-aea6-aebeb766fb41', 65, 418.50, 418.50, 0, 0, 'EFECTIVO', '287bf48a-07fe-e7be-fd50-ef85b65cbd01');

-- Vista v_acciones_socio para reflejar el capital social en acciones de cada socio
CREATE OR REPLACE VIEW v_acciones_socio WITH (security_invoker = true) AS
SELECT o.caja_id, o.socio_id,
  SUM(d.monto) AS monto_acciones,
  FLOOR(SUM(d.monto) / NULLIF((SELECT pa.valor FROM parametro pa
                               WHERE pa.caja_id = o.caja_id AND pa.clave = 'VALOR_ACCION'
                               ORDER BY pa.vigente_desde DESC LIMIT 1), 0))::int AS nro_acciones
FROM operacion o
JOIN operacion_detalle d ON d.operacion_id = o.id
JOIN concepto c          ON c.id = d.concepto_id AND c.codigo = 'ACCION'
WHERE o.estado = 'VIGENTE'
GROUP BY o.caja_id, o.socio_id;

COMMIT;
