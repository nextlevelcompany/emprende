CREATE TABLE idempotency_record (
    caja_id uuid NOT NULL REFERENCES caja(id) ON DELETE CASCADE,
    operacion varchar(60) NOT NULL,
    idempotency_key varchar(120) NOT NULL,
    request_hash char(64) NOT NULL,
    response jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (caja_id, operacion, idempotency_key),
    CHECK (response IS NULL OR jsonb_typeof(response) = 'object')
);
ALTER TABLE idempotency_record ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_record FORCE ROW LEVEL SECURITY;
CREATE POLICY idempotency_record_tenant ON idempotency_record FOR ALL
    USING (caja_id = app_caja_id() AND app_es_admin())
    WITH CHECK (caja_id = app_caja_id() AND app_es_admin());
CREATE INDEX ix_idempotency_created_at ON idempotency_record(created_at);
GRANT SELECT, INSERT, UPDATE ON idempotency_record TO app_rw;
GRANT SELECT ON idempotency_record TO app_ro;
