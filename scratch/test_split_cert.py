import subprocess
import json

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
        'id': f"cert-{cert_num}",
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

# Process devoluciones
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
    for c in user_c_list:
        if c['estado'] != 'ACTIVO': continue
        if remaining <= 0: break
        
        take = min(remaining, c['cantidad'])
        if take == c['cantidad']:
            c['estado'] = 'DEVUELTO_RETIRO'
            transferencias.append({
                'num': trans_num,
                'socio_origen_id': socio_id,
                'socio_destino_id': None,
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
            # Split certificate:
            # c is split into c_devuelto (take) and c_retained (c['cantidad'] - take)
            orig_fin = c['serie_fin']
            split_fin = c['serie_inicio'] + take - 1
            retained_ini = split_fin + 1
            
            # 1. Returned part:
            c['serie_fin'] = split_fin
            c['cantidad'] = take
            c['monto'] = take * 30.0
            c['estado'] = 'DEVUELTO_RETIRO'
            
            transferencias.append({
                'num': trans_num,
                'socio_origen_id': socio_id,
                'socio_destino_id': None,
                'cert_origen_num': c['num'],
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
            
            # 2. Retained part as a new certificate:
            retained_cert = {
                'id': f"cert-{cert_num}",
                'num': cert_num,
                'socio_id': socio_id,
                'codigo': c['codigo'],
                'nombre': c['nombre'],
                'serie_inicio': retained_ini,
                'serie_fin': orig_fin,
                'cantidad': c['cantidad'] - take,
                'monto': (c['cantidad'] - take) * 30.0,
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

print(f"Total certificados finales: {len(certificados)}")
print(f"Total transferencias finales: {len(transferencias)}")

# Let's verify active shares by socio:
active_by_socio = {}
for c in certificados:
    if c['estado'] == 'ACTIVO':
        active_by_socio[c['codigo']] = active_by_socio.get(c['codigo'], 0) + c['cantidad']

print("\n=== SALDO DE ACCIONES ACTIVAS VERIFICADO ===")
for cod, total in sorted(active_by_socio.items()):
    print(f"Socio {cod:2d}: {total:4d} acciones (S/ {total*30:8,.2f})")
