-- Diagnóstico de solo lectura sobre tablas que reciben filas históricas desde
-- V6, V8 y V10. Los resultados son conteos; no imprime nombres ni documentos.
BEGIN TRANSACTION READ ONLY;

SELECT 'registro_institucional: llaves potencialmente personales' AS fuente,
       count(*) FILTER (WHERE payload ?| ARRAY['documentoNumero', 'numeroDocumentoRepresentante']) AS filas_con_documento,
       count(*) FILTER (WHERE payload ?| ARRAY['nombreCompleto', 'representanteLegal', 'presidente', 'secretario']) AS filas_con_nombre,
       count(*) FILTER (WHERE payload ?| ARRAY['telefono', 'email', 'direccion']) AS filas_con_contacto
FROM registro_institucional;

SELECT 'transferencia_accion: observaciones con texto' AS fuente,
       count(*) AS filas,
       count(*) FILTER (WHERE observaciones IS NOT NULL AND btrim(observaciones) <> '') AS filas_con_observaciones,
       count(*) FILTER (WHERE socio_origen_id IS NOT NULL OR socio_destino_id IS NOT NULL) AS filas_vinculadas_a_socio
FROM transferencia_accion;

SELECT 'junta_directiva: datos identificatorios/contacto' AS fuente,
       count(*) AS filas,
       count(*) FILTER (WHERE numero_documento IS NOT NULL AND btrim(numero_documento) <> '') AS filas_con_documento,
       count(*) FILTER (WHERE telefono IS NOT NULL OR email IS NOT NULL) AS filas_con_contacto
FROM junta_directiva;

COMMIT;
