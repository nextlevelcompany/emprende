-- Diagnóstico de claves foráneas compuestas agregadas en V15.
-- Ejecutar primero en modo de solo lectura; los recuentos deben ser cero.
-- Para validar las restricciones cuando los recuentos sean cero:
--   SET app.validate_multicaja_constraints = 'true';
--   \i scripts/validate_multicaja_integrity.sql

SELECT 'certificado_accion.socio_id' AS relacion, count(*) AS inconsistencias
FROM certificado_accion c
WHERE c.socio_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM socio s WHERE s.caja_id = c.caja_id AND s.id = c.socio_id)
UNION ALL
SELECT 'certificado_accion.periodo_id', count(*)
FROM certificado_accion c
WHERE c.periodo_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM periodo p WHERE p.caja_id = c.caja_id AND p.id = c.periodo_id)
UNION ALL
SELECT 'certificado_accion.operacion_id', count(*)
FROM certificado_accion c
WHERE c.operacion_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM operacion o WHERE o.caja_id = c.caja_id AND o.id = c.operacion_id)
UNION ALL
SELECT 'certificado_accion.certificado_origen_id', count(*)
FROM certificado_accion c
WHERE c.certificado_origen_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM certificado_accion origen WHERE origen.caja_id = c.caja_id AND origen.id = c.certificado_origen_id)
UNION ALL
SELECT 'transferencia_accion.socio_origen_id', count(*)
FROM transferencia_accion t
WHERE t.socio_origen_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM socio s WHERE s.caja_id = t.caja_id AND s.id = t.socio_origen_id)
UNION ALL
SELECT 'transferencia_accion.socio_destino_id', count(*)
FROM transferencia_accion t
WHERE t.socio_destino_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM socio s WHERE s.caja_id = t.caja_id AND s.id = t.socio_destino_id)
UNION ALL
SELECT 'transferencia_accion.certificado_origen_id', count(*)
FROM transferencia_accion t
WHERE t.certificado_origen_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM certificado_accion c WHERE c.caja_id = t.caja_id AND c.id = t.certificado_origen_id)
UNION ALL
SELECT 'transferencia_accion.certificado_destino_id', count(*)
FROM transferencia_accion t
WHERE t.certificado_destino_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM certificado_accion c WHERE c.caja_id = t.caja_id AND c.id = t.certificado_destino_id)
UNION ALL
SELECT 'transferencia_accion.periodo_id', count(*)
FROM transferencia_accion t
WHERE t.periodo_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM periodo p WHERE p.caja_id = t.caja_id AND p.id = t.periodo_id)
UNION ALL
SELECT 'transferencia_accion.operacion_id', count(*)
FROM transferencia_accion t
WHERE t.operacion_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM operacion o WHERE o.caja_id = t.caja_id AND o.id = t.operacion_id)
UNION ALL
SELECT 'junta_directiva.socio_id', count(*)
FROM junta_directiva j
WHERE j.socio_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM socio s WHERE s.caja_id = j.caja_id AND s.id = j.socio_id)
ORDER BY relacion;

-- La segunda fase es opt-in. Repite las comprobaciones en la misma sesión y
-- aborta antes de validar si detecta cualquier vínculo entre cajas.
DO $$
DECLARE
  v_violations bigint;
BEGIN
  IF current_setting('app.validate_multicaja_constraints', true) IS DISTINCT FROM 'true' THEN
    RAISE NOTICE 'Solo se ejecutó el diagnóstico. Establece app.validate_multicaja_constraints=true para solicitar la validación.';
    RETURN;
  END IF;

  SELECT
    (SELECT count(*) FROM certificado_accion c WHERE c.socio_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM socio s WHERE s.caja_id=c.caja_id AND s.id=c.socio_id)) +
    (SELECT count(*) FROM certificado_accion c WHERE c.periodo_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM periodo p WHERE p.caja_id=c.caja_id AND p.id=c.periodo_id)) +
    (SELECT count(*) FROM certificado_accion c WHERE c.operacion_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM operacion o WHERE o.caja_id=c.caja_id AND o.id=c.operacion_id)) +
    (SELECT count(*) FROM certificado_accion c WHERE c.certificado_origen_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM certificado_accion x WHERE x.caja_id=c.caja_id AND x.id=c.certificado_origen_id)) +
    (SELECT count(*) FROM transferencia_accion t WHERE t.socio_origen_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM socio s WHERE s.caja_id=t.caja_id AND s.id=t.socio_origen_id)) +
    (SELECT count(*) FROM transferencia_accion t WHERE t.socio_destino_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM socio s WHERE s.caja_id=t.caja_id AND s.id=t.socio_destino_id)) +
    (SELECT count(*) FROM transferencia_accion t WHERE t.certificado_origen_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM certificado_accion c WHERE c.caja_id=t.caja_id AND c.id=t.certificado_origen_id)) +
    (SELECT count(*) FROM transferencia_accion t WHERE t.certificado_destino_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM certificado_accion c WHERE c.caja_id=t.caja_id AND c.id=t.certificado_destino_id)) +
    (SELECT count(*) FROM transferencia_accion t WHERE t.periodo_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM periodo p WHERE p.caja_id=t.caja_id AND p.id=t.periodo_id)) +
    (SELECT count(*) FROM transferencia_accion t WHERE t.operacion_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM operacion o WHERE o.caja_id=t.caja_id AND o.id=t.operacion_id)) +
    (SELECT count(*) FROM junta_directiva j WHERE j.socio_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM socio s WHERE s.caja_id=j.caja_id AND s.id=j.socio_id))
  INTO v_violations;

  IF v_violations <> 0 THEN
    RAISE EXCEPTION 'No se validaron las claves compuestas: se detectaron % relaciones inconsistentes. Corrige o revisa los registros antes de reintentar.', v_violations;
  END IF;

  EXECUTE 'ALTER TABLE certificado_accion VALIDATE CONSTRAINT fk_certificado_socio_caja';
  EXECUTE 'ALTER TABLE certificado_accion VALIDATE CONSTRAINT fk_certificado_periodo_caja';
  EXECUTE 'ALTER TABLE certificado_accion VALIDATE CONSTRAINT fk_certificado_operacion_caja';
  EXECUTE 'ALTER TABLE certificado_accion VALIDATE CONSTRAINT fk_certificado_origen_caja';
  EXECUTE 'ALTER TABLE transferencia_accion VALIDATE CONSTRAINT fk_transferencia_socio_origen_caja';
  EXECUTE 'ALTER TABLE transferencia_accion VALIDATE CONSTRAINT fk_transferencia_socio_destino_caja';
  EXECUTE 'ALTER TABLE transferencia_accion VALIDATE CONSTRAINT fk_transferencia_cert_origen_caja';
  EXECUTE 'ALTER TABLE transferencia_accion VALIDATE CONSTRAINT fk_transferencia_cert_destino_caja';
  EXECUTE 'ALTER TABLE transferencia_accion VALIDATE CONSTRAINT fk_transferencia_periodo_caja';
  EXECUTE 'ALTER TABLE transferencia_accion VALIDATE CONSTRAINT fk_transferencia_operacion_caja';
  EXECUTE 'ALTER TABLE junta_directiva VALIDATE CONSTRAINT fk_junta_socio_caja';
  RAISE NOTICE 'Todas las claves foráneas compuestas quedaron validadas.';
END $$;
