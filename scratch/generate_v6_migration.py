import subprocess
import json
import uuid

# Fetch caja_id and admin_user_id
cmd_caja = ["docker", "exec", "caja_chambala_db", "psql", "-U", "postgres", "-d", "caja_chambala", "-t", "-A", "-c", "SELECT id FROM caja LIMIT 1;"]
caja_id = subprocess.check_output(cmd_caja, encoding='utf-8').strip()

cmd_user = ["docker", "exec", "caja_chambala_db", "psql", "-U", "postgres", "-d", "caja_chambala", "-t", "-A", "-c", "SELECT id FROM app_user WHERE role = 'ADMIN' LIMIT 1;"]
admin_id = subprocess.check_output(cmd_user, encoding='utf-8').strip()

cmd_purchases = [
    "docker", "exec", "caja_chambala_db", "psql", "-U", "postgres", "-d", "caja_chambala", "-t", "-A", "-F", "|", "-c",
    """
    SELECT p.anio, p.mes, o.fecha, s.id as socio_id, s.codigo, s.nombres, s.apellidos, 
           od.monto, (od.monto / 30)::int as acciones,
           o.id as operacion_id, p.id as periodo_id
    FROM operacion_detalle od
    JOIN operacion o ON od.operacion_id = o.id
    JOIN periodo p ON o.periodo_id = p.id
    JOIN socio s ON o.socio_id = s.id
    WHERE od.concepto_id = (SELECT id FROM concepto WHERE codigo = 'ACCION')
      AND o.estado = 'VIGENTE'
    ORDER BY p.anio, p.mes, s.codigo, o.fecha;
    """
]
out = subprocess.check_output(cmd_purchases, encoding='utf-8')
certificados = []
curr_serie = 0
cert_num = 1

for line in out.strip().split('\n'):
    if not line.strip(): continue
    parts = line.strip().split('|')
    acc = int(parts[8])
    if acc <= 0: continue
    s_ini = curr_serie + 1
    s_fin = curr_serie + acc
    curr_serie = s_fin
    
    certificados.append({
        'id': str(uuid.uuid4()),
        'num': cert_num,
        'socio_id': parts[3],
        'codigo': int(parts[4]),
        'nombre': f"{parts[6]} {parts[5]}",
        'serie_inicio': s_ini,
        'serie_fin': s_fin,
        'cantidad': acc,
        'monto': float(parts[7]),
        'fecha': parts[2],
        'periodo_id': parts[10],
        'operacion_id': parts[9],
        'estado': 'ACTIVO',
        'tipo_origen': 'APORTE_MENSUAL',
        'anio': int(parts[0]),
        'mes': int(parts[1])
    })
    cert_num += 1

cmd_devol = [
    "docker", "exec", "caja_chambala_db", "psql", "-U", "postgres", "-d", "caja_chambala", "-t", "-A", "-F", "|", "-c",
    """
    SELECT p.anio, p.mes, o.fecha, s.id, s.codigo, s.nombres, s.apellidos, 
           od.monto, (od.monto / 30)::int as acciones,
           o.id as operacion_id, p.id as periodo_id
    FROM operacion_detalle od
    JOIN operacion o ON od.operacion_id = o.id
    JOIN periodo p ON o.periodo_id = p.id
    JOIN socio s ON o.socio_id = s.id
    WHERE od.concepto_id = (SELECT id FROM concepto WHERE codigo = 'DEVOLUCION_CAPITAL')
      AND o.estado = 'VIGENTE'
    ORDER BY p.anio, p.mes, s.codigo, o.fecha;
    """
]
out_d = subprocess.check_output(cmd_devol, encoding='utf-8')
transferencias = []
trans_num = 1

socio_certs = {}
for c in certificados:
    socio_certs.setdefault(c['socio_id'], []).append(c)

for line in out_d.strip().split('\n'):
    if not line.strip(): continue
    parts = line.strip().split('|')
    socio_id = parts[3]
    acc_dev = int(parts[8])
    fecha = parts[2]
    op_id = parts[9]
    per_id = parts[10]
    
    remaining = acc_dev
    user_c_list = socio_certs.get(socio_id, [])
    for c in list(user_c_list):
        if c['estado'] != 'ACTIVO': continue
        if remaining <= 0: break
        
        take = min(remaining, c['cantidad'])
        if take == c['cantidad']:
            c['estado'] = 'DEVUELTO_RETIRO'
            transferencias.append({
                'id': str(uuid.uuid4()),
                'num': trans_num,
                'socio_origen_id': socio_id,
                'socio_destino_id': None,
                'cert_origen_id': c['id'],
                'cert_destino_id': None,
                'serie_inicio': c['serie_inicio'],
                'serie_fin': c['serie_fin'],
                'cantidad': c['cantidad'],
                'monto': c['cantidad'] * 30.0,
                'fecha': fecha,
                'periodo_id': per_id,
                'operacion_id': op_id,
                'motivo': 'DEVOLUCION_CAPITAL',
                'doc': f"Asamblea {parts[0]}-{int(parts[1]):02d}",
                'obs': f"Liquidación / Devolución de capital por retiro ({c['nombre']})"
            })
            trans_num += 1
            remaining -= take
        else:
            orig_fin = c['serie_fin']
            orig_cant = c['cantidad']
            split_fin = c['serie_inicio'] + take - 1
            retained_ini = split_fin + 1
            retained_cant = orig_cant - take
            
            c['serie_fin'] = split_fin
            c['cantidad'] = take
            c['monto'] = take * 30.0
            c['estado'] = 'DEVUELTO_RETIRO'
            
            transferencias.append({
                'id': str(uuid.uuid4()),
                'num': trans_num,
                'socio_origen_id': socio_id,
                'socio_destino_id': None,
                'cert_origen_id': c['id'],
                'cert_destino_id': None,
                'serie_inicio': c['serie_inicio'],
                'serie_fin': split_fin,
                'cantidad': take,
                'monto': take * 30.0,
                'fecha': fecha,
                'periodo_id': per_id,
                'operacion_id': op_id,
                'motivo': 'DEVOLUCION_CAPITAL',
                'doc': f"Asamblea {parts[0]}-{int(parts[1]):02d}",
                'obs': f"Liquidación parcial por retiro ({c['nombre']})"
            })
            trans_num += 1
            
            if retained_cant > 0:
                retained_cert = {
                    'id': str(uuid.uuid4()),
                    'num': cert_num,
                    'socio_id': socio_id,
                    'codigo': c['codigo'],
                    'nombre': c['nombre'],
                    'serie_inicio': retained_ini,
                    'serie_fin': orig_fin,
                    'cantidad': retained_cant,
                    'monto': retained_cant * 30.0,
                    'fecha': fecha,
                    'periodo_id': per_id,
                    'operacion_id': op_id,
                    'estado': 'ACTIVO',
                    'tipo_origen': 'DESDOBLAMIENTO',
                    'anio': c['anio'],
                    'mes': c['mes']
                }
                cert_num += 1
                certificados.append(retained_cert)
                user_c_list.append(retained_cert)
            remaining -= take

sql = [
    "-- =====================================================================",
    "-- V6__matricula_acciones_certificados_y_transferencias.sql",
    "-- Sistema de Matrícula y Trazabilidad de Acciones para Caja Chambala",
    "-- Implementa numeración fija correlativa, certificados y transferencias.",
    "-- =====================================================================",
    "",
    "-- 1. Tabla de Certificados de Acciones",
    "CREATE TABLE IF NOT EXISTS certificado_accion (",
    "  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),",
    "  caja_id               uuid NOT NULL REFERENCES caja(id),",
    "  numero_certificado    integer NOT NULL,",
    "  socio_id              uuid REFERENCES socio(id),",
    "  serie_inicio          integer NOT NULL,",
    "  serie_fin             integer NOT NULL,",
    "  cantidad              integer NOT NULL,",
    "  valor_nominal         numeric(10,2) NOT NULL DEFAULT 30.00,",
    "  total_monto           numeric(12,2) NOT NULL,",
    "  fecha_emision         date NOT NULL,",
    "  periodo_id            uuid REFERENCES periodo(id),",
    "  operacion_id          uuid REFERENCES operacion(id),",
    "  estado                varchar(20) NOT NULL DEFAULT 'ACTIVO', -- 'ACTIVO', 'TRANSFERIDO', 'DEVUELTO_RETIRO', 'EN_CARTERA', 'ANULADO'",
    "  tipo_origen           varchar(30) NOT NULL DEFAULT 'APORTE_MENSUAL', -- 'APORTE_MENSUAL', 'EMISION_INICIAL', 'TRASPASO_VENTA', 'DESDOBLAMIENTO'",
    "  certificado_origen_id uuid REFERENCES certificado_accion(id),",
    "  observaciones         text,",
    "  created_at            timestamptz NOT NULL DEFAULT now(),",
    "  updated_at            timestamptz NOT NULL DEFAULT now(),",
    "  created_by            uuid REFERENCES app_user(id),",
    "  CONSTRAINT uq_cert_caja_numero UNIQUE (caja_id, numero_certificado),",
    "  CONSTRAINT ck_cert_series CHECK (serie_fin >= serie_inicio),",
    "  CONSTRAINT ck_cert_cantidad CHECK (cantidad = serie_fin - serie_inicio + 1)",
    ");",
    "",
    "CREATE INDEX IF NOT EXISTS ix_cert_caja_socio ON certificado_accion (caja_id, socio_id);",
    "CREATE INDEX IF NOT EXISTS ix_cert_series ON certificado_accion (caja_id, serie_inicio, serie_fin);",
    "CREATE INDEX IF NOT EXISTS ix_cert_estado ON certificado_accion (caja_id, estado);",
    "",
    "-- 2. Tabla de Transferencias y Movimientos de Acciones",
    "CREATE TABLE IF NOT EXISTS transferencia_accion (",
    "  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),",
    "  caja_id                uuid NOT NULL REFERENCES caja(id),",
    "  numero_transferencia   integer NOT NULL,",
    "  socio_origen_id        uuid REFERENCES socio(id),",
    "  socio_destino_id       uuid REFERENCES socio(id),",
    "  certificado_origen_id  uuid REFERENCES certificado_accion(id),",
    "  certificado_destino_id uuid REFERENCES certificado_accion(id),",
    "  serie_inicio           integer NOT NULL,",
    "  serie_fin              integer NOT NULL,",
    "  cantidad               integer NOT NULL,",
    "  precio_unitario        numeric(10,2) NOT NULL DEFAULT 30.00,",
    "  total_monto            numeric(12,2) NOT NULL,",
    "  fecha                  date NOT NULL,",
    "  periodo_id             uuid REFERENCES periodo(id),",
    "  operacion_id           uuid REFERENCES operacion(id),",
    "  motivo                 varchar(50) NOT NULL, -- 'RETIRO_SOCIO', 'VENTA_ENTRE_SOCIOS', 'DEVOLUCION_CAPITAL', 'REASIGNACION_CARTERA'",
    "  documento_acta         varchar(100),",
    "  observaciones          text,",
    "  created_at             timestamptz NOT NULL DEFAULT now(),",
    "  created_by             uuid REFERENCES app_user(id),",
    "  CONSTRAINT uq_trans_caja_numero UNIQUE (caja_id, numero_transferencia),",
    "  CONSTRAINT ck_trans_series CHECK (serie_fin >= serie_inicio)",
    ");",
    "",
    "CREATE INDEX IF NOT EXISTS ix_trans_caja_origen ON transferencia_accion (caja_id, socio_origen_id);",
    "CREATE INDEX IF NOT EXISTS ix_trans_caja_destino ON transferencia_accion (caja_id, socio_destino_id);",
    "",
    "-- 3. RLS Policies",
    "ALTER TABLE certificado_accion ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE certificado_accion FORCE ROW LEVEL SECURITY;",
    "",
    "DROP POLICY IF EXISTS cert_read ON certificado_accion;",
    "CREATE POLICY cert_read ON certificado_accion FOR SELECT USING (caja_id = app_caja_id());",
    "DROP POLICY IF EXISTS cert_admin ON certificado_accion;",
    "CREATE POLICY cert_admin ON certificado_accion FOR ALL USING (caja_id = app_caja_id() AND app_es_admin()) WITH CHECK (caja_id = app_caja_id() AND app_es_admin());",
    "",
    "ALTER TABLE transferencia_accion ENABLE ROW LEVEL SECURITY;",
    "ALTER TABLE transferencia_accion FORCE ROW LEVEL SECURITY;",
    "",
    "DROP POLICY IF EXISTS trans_read ON transferencia_accion;",
    "CREATE POLICY trans_read ON transferencia_accion FOR SELECT USING (caja_id = app_caja_id());",
    "DROP POLICY IF EXISTS trans_admin ON transferencia_accion;",
    "CREATE POLICY trans_admin ON transferencia_accion FOR ALL USING (caja_id = app_caja_id() AND app_es_admin()) WITH CHECK (caja_id = app_caja_id() AND app_es_admin());",
    "",
    "-- 4. Permisos de aplicación",
    "GRANT SELECT, INSERT, UPDATE ON certificado_accion TO app_rw;",
    "GRANT SELECT, INSERT, UPDATE ON transferencia_accion TO app_rw;",
    "GRANT SELECT ON certificado_accion TO app_ro;",
    "GRANT SELECT ON transferencia_accion TO app_ro;",
    "",
    "-- 5. Carga Histórica de Certificados",
]

for c in certificados:
    sql.append(
        f"INSERT INTO certificado_accion (id, caja_id, numero_certificado, socio_id, serie_inicio, serie_fin, cantidad, valor_nominal, total_monto, fecha_emision, periodo_id, operacion_id, estado, tipo_origen, created_by) "
        f"VALUES ('{c['id']}', '{caja_id}', {c['num']}, '{c['socio_id']}', {c['serie_inicio']}, {c['serie_fin']}, {c['cantidad']}, 30.00, {c['monto']:.2f}, '{c['fecha']}', '{c['periodo_id']}', '{c['operacion_id']}', '{c['estado']}', '{c['tipo_origen']}', '{admin_id}') "
        f"ON CONFLICT (caja_id, numero_certificado) DO NOTHING;"
    )

sql.append("\n-- 6. Carga Histórica de Transferencias y Devoluciones")
for t in transferencias:
    s_dest = f"'{t['socio_destino_id']}'" if t['socio_destino_id'] else "NULL"
    sql.append(
        f"INSERT INTO transferencia_accion (id, caja_id, numero_transferencia, socio_origen_id, socio_destino_id, certificado_origen_id, serie_inicio, serie_fin, cantidad, precio_unitario, total_monto, fecha, periodo_id, operacion_id, motivo, documento_acta, observaciones, created_by) "
        f"VALUES ('{t['id']}', '{caja_id}', {t['num']}, '{t['socio_origen_id']}', {s_dest}, '{t['cert_origen_id']}', {t['serie_inicio']}, {t['serie_fin']}, {t['cantidad']}, 30.00, {t['monto']:.2f}, '{t['fecha']}', '{t['periodo_id']}', '{t['operacion_id']}', '{t['motivo']}', '{t['doc']}', '{t['obs']}', '{admin_id}') "
        f"ON CONFLICT (caja_id, numero_transferencia) DO NOTHING;"
    )

output_path = 'backend/src/main/resources/db/migration/V6__matricula_acciones_certificados_y_transferencias.sql'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write("\n".join(sql) + "\n")

print(f"Generated idempotent {output_path} with {len(certificados)} certificates and {len(transferencias)} transfers!")
