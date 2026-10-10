-- Members may read only certificates attached to their own socio record.
DROP POLICY IF EXISTS cert_read ON certificado_accion;
CREATE POLICY cert_read ON certificado_accion FOR SELECT
    USING (caja_id = app_caja_id() AND (app_es_admin() OR socio_id = app_socio_id()));
