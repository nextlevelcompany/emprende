import subprocess
import json

# 1. Fetch all share purchases
cmd = [
    "docker", "exec", "caja_chambala_db", "psql", "-U", "postgres", "-d", "caja_chambala", "-t", "-A", "-F", "|", "-c",
    """
    SELECT p.anio, p.mes, o.fecha, s.id, s.codigo, s.nombres, s.apellidos, 
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
out = subprocess.check_output(cmd, encoding='utf-8')
purchases = []
for line in out.strip().split('\n'):
    if not line.strip(): continue
    parts = line.strip().split('|')
    purchases.append({
        'anio': int(parts[0]),
        'mes': int(parts[1]),
        'fecha': parts[2],
        'socio_id': parts[3],
        'codigo': int(parts[4]),
        'nombre': f"{parts[6]} {parts[5]}",
        'monto': float(parts[7]),
        'acciones': int(parts[8]),
        'operacion_id': parts[9],
        'periodo_id': parts[10]
    })

print(f"Total purchase operations: {len(purchases)}")
total_acc = sum(p['acciones'] for p in purchases)
print(f"Total shares bought in history: {total_acc} (Monto: S/ {total_acc * 30:,.2f})")

# 2. Fetch devoluciones
cmd2 = [
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
out2 = subprocess.check_output(cmd2, encoding='utf-8')
devoluciones = []
for line in out2.strip().split('\n'):
    if not line.strip(): continue
    parts = line.strip().split('|')
    devoluciones.append({
        'anio': int(parts[0]),
        'mes': int(parts[1]),
        'fecha': parts[2],
        'socio_id': parts[3],
        'codigo': int(parts[4]),
        'nombre': f"{parts[6]} {parts[5]}",
        'monto': float(parts[7]),
        'acciones': int(parts[8]),
        'operacion_id': parts[9],
        'periodo_id': parts[10]
    })

print(f"Total devoluciones: {len(devoluciones)}")
for d in devoluciones:
    print(f"  {d['anio']}-{d['mes']:02d}: Socio {d['codigo']} ({d['nombre']}) devuelto {d['acciones']} acc (S/ {d['monto']})")
