-- Actualización de utilidades 2024 y 2025 según Libro y Plantilla Oficial Excel
-- 'DISTRIBUCION DE UTILIDADES EMPRENDE CHAMBALA 2025 (3).xlsx'

BEGIN;

-- 1. Actualizar Distribución 2024
UPDATE distribucion_utilidad
SET total_acciones = 405,
    utilidad_total = 4243.52,
    updated_at = NOW()
WHERE id = 'c0000000-0000-0000-0000-000000002024';

DELETE FROM distribucion_utilidad_detalle WHERE distribucion_id = 'c0000000-0000-0000-0000-000000002024';

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

-- 2. Actualizar Distribución 2025
UPDATE distribucion_utilidad
SET total_acciones = 922,
    utilidad_total = 9894.31,
    updated_at = NOW()
WHERE id = 'c0000000-0000-0000-0000-000000002025';

DELETE FROM distribucion_utilidad_detalle WHERE distribucion_id = 'c0000000-0000-0000-0000-000000002025';

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

-- 3. Actualizar vista v_acciones_socio para reflejar el principio oficial de Caja Comunal:
-- Las acciones aportadas permanecen como capital social activo en la Caja tras cada cierre anual;
-- lo único que se distribuye y cobra anualmente son las utilidades del ejercicio (y algunos reinvierten en acciones).
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
  AND o.socio_id IS NOT NULL
GROUP BY o.caja_id, o.socio_id;

COMMIT;
