CREATE TABLE caja_correlativo (
    caja_id uuid NOT NULL REFERENCES caja(id) ON DELETE CASCADE,
    tipo varchar(40) NOT NULL,
    ultimo_valor integer NOT NULL CHECK (ultimo_valor >= 0),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (caja_id, tipo)
);

ALTER TABLE caja_correlativo ENABLE ROW LEVEL SECURITY;
ALTER TABLE caja_correlativo FORCE ROW LEVEL SECURITY;
CREATE POLICY caja_correlativo_tenant ON caja_correlativo FOR ALL
    USING (caja_id = app_caja_id())
    WITH CHECK (caja_id = app_caja_id());
GRANT SELECT, INSERT, UPDATE ON caja_correlativo TO app_rw;
GRANT SELECT ON caja_correlativo TO app_ro;

-- Store tenant identity on every distribution detail so both relationships
-- can be enforced as tenant-local foreign keys.
ALTER TABLE distribucion_utilidad ADD CONSTRAINT uq_distribucion_caja_id UNIQUE (caja_id, id);
ALTER TABLE distribucion_utilidad_detalle ADD COLUMN caja_id uuid;
UPDATE distribucion_utilidad_detalle d
SET caja_id = u.caja_id
FROM distribucion_utilidad u
WHERE u.id = d.distribucion_id;
ALTER TABLE distribucion_utilidad_detalle ALTER COLUMN caja_id SET NOT NULL;
ALTER TABLE distribucion_utilidad_detalle
    ADD CONSTRAINT fk_distrib_det_distribucion_tenant
        FOREIGN KEY (caja_id, distribucion_id) REFERENCES distribucion_utilidad(caja_id, id),
    ADD CONSTRAINT fk_distrib_det_socio_tenant
        FOREIGN KEY (caja_id, socio_id) REFERENCES socio(caja_id, id);
CREATE INDEX ix_distrib_det_caja_socio ON distribucion_utilidad_detalle(caja_id, socio_id);
