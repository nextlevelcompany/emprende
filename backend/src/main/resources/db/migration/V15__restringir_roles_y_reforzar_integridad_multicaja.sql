-- Reduce el rol de reportes a un rol sin acceso hasta que exista un caso de uso
-- explícito con políticas RLS dedicadas. Migraciones anteriores lo habilitaban
-- para leer todas las tablas, incluidas las que no tienen políticas RLS.
-- Reafirma también la barrera RLS en la base: se observó app_rw con BYPASSRLS.
ALTER ROLE app_rw NOBYPASSRLS;
ALTER ROLE app_ro NOBYPASSRLS;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM app_ro;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM app_ro;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM app_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM app_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM app_ro;

-- Las referencias compuestas impiden vincular registros pertenecientes a
-- cajas diferentes. NOT VALID protege nuevas escrituras sin hacer fallar el
-- despliegue por inconsistencias históricas que requieren inspección previa.
ALTER TABLE operacion
  ADD CONSTRAINT uq_operacion_caja_id UNIQUE (caja_id, id);

ALTER TABLE certificado_accion
  ADD CONSTRAINT uq_certificado_caja_id UNIQUE (caja_id, id);
ALTER TABLE certificado_accion
  ADD CONSTRAINT fk_certificado_socio_caja
    FOREIGN KEY (caja_id, socio_id) REFERENCES socio (caja_id, id) NOT VALID,
  ADD CONSTRAINT fk_certificado_periodo_caja
    FOREIGN KEY (caja_id, periodo_id) REFERENCES periodo (caja_id, id) NOT VALID,
  ADD CONSTRAINT fk_certificado_operacion_caja
    FOREIGN KEY (caja_id, operacion_id) REFERENCES operacion (caja_id, id) NOT VALID,
  ADD CONSTRAINT fk_certificado_origen_caja
    FOREIGN KEY (caja_id, certificado_origen_id)
    REFERENCES certificado_accion (caja_id, id) NOT VALID;

ALTER TABLE transferencia_accion
  ADD CONSTRAINT fk_transferencia_socio_origen_caja
    FOREIGN KEY (caja_id, socio_origen_id) REFERENCES socio (caja_id, id) NOT VALID,
  ADD CONSTRAINT fk_transferencia_socio_destino_caja
    FOREIGN KEY (caja_id, socio_destino_id) REFERENCES socio (caja_id, id) NOT VALID,
  ADD CONSTRAINT fk_transferencia_cert_origen_caja
    FOREIGN KEY (caja_id, certificado_origen_id)
    REFERENCES certificado_accion (caja_id, id) NOT VALID,
  ADD CONSTRAINT fk_transferencia_cert_destino_caja
    FOREIGN KEY (caja_id, certificado_destino_id)
    REFERENCES certificado_accion (caja_id, id) NOT VALID,
  ADD CONSTRAINT fk_transferencia_periodo_caja
    FOREIGN KEY (caja_id, periodo_id) REFERENCES periodo (caja_id, id) NOT VALID,
  ADD CONSTRAINT fk_transferencia_operacion_caja
    FOREIGN KEY (caja_id, operacion_id) REFERENCES operacion (caja_id, id) NOT VALID;

ALTER TABLE junta_directiva
  ADD CONSTRAINT fk_junta_socio_caja
    FOREIGN KEY (caja_id, socio_id) REFERENCES socio (caja_id, id) NOT VALID;
