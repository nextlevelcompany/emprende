import subprocess
import json

# Fetch caja_id and admin_user_id
cmd_caja = ["docker", "exec", "caja_chambala_db", "psql", "-U", "postgres", "-d", "caja_chambala", "-t", "-A", "-c", "SELECT id FROM caja LIMIT 1;"]
caja_id = subprocess.check_output(cmd_caja, encoding='utf-8').strip()

cmd_user = ["docker", "exec", "caja_chambala_db", "psql", "-U", "postgres", "-d", "caja_chambala", "-t", "-A", "-c", "SELECT id FROM app_user WHERE role = 'ADMIN' LIMIT 1;"]
admin_id = subprocess.check_output(cmd_user, encoding='utf-8').strip()

print(f"Caja ID: {caja_id}, Admin ID: {admin_id}")

# Fetch purchases
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
        'anio': int(parts[0]),
        'mes': int(parts[1])
    })
    cert_num += 1

print(f"Total certificados iniciales: {len(certificados)}")
print(f"Total serie acumulada: 1 a {curr_serie}")

# Now let's trace devoluciones:
# When devolucion happens for a socio:
# We mark their oldest (or newest) certificates as DEVUELTO_RETIRO
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

# Dictionary of active certs by socio_id
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
    
    # Take certs of this socio until acc_dev is fulfilled
    remaining = acc_dev
    user_c_list = socio_certs.get(socio_id, [])
    for c in user_c_list:
        if c['estado'] != 'ACTIVO': continue
        if remaining <= 0: break
        
        take = min(remaining, c['cantidad'])
        if take == c['cantidad']:
            c['estado'] = 'DEVUELTO_RETIRO'
            transferencias.append({
                'num': trans_num,
                'socio_origen_id': socio_id,
                'socio_destino_id': None, # Pasa a Cartera de Caja
                'cert_origen_num': c['num'],
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
            # Partial devolution: we can split certificate if needed
            print(f"Partial dev on cert {c['num']}: take {take} of {c['cantidad']}")
            remaining -= take

print(f"Total transferencias generadas: {len(transferencias)}")
