import xlrd
import subprocess
import json

# Fetch DB operations for months 6, 7, 8, 9, 10
cmd = [
    "docker", "exec", "caja_chambala_db", "psql", "-U", "postgres", "-d", "caja_chambala", "-t", "-A", "-F", "|", "-c",
    """
    SELECT p.mes, o.nro_recibo, s.nombres, 
           (SELECT sum(monto) FROM operacion_detalle WHERE operacion_id = o.id) as tot,
           o.id
    FROM operacion o
    JOIN periodo p ON o.periodo_id = p.id
    JOIN socio s ON o.socio_id = s.id
    WHERE p.anio = 2026 AND p.mes >= 6 AND o.estado = 'VIGENTE' AND o.tipo = 'INGRESO'
    ORDER BY p.mes, o.nro_recibo;
    """
]
out = subprocess.check_output(cmd, encoding='utf-8')
db_ops = {}
for line in out.strip().split('\n'):
    if not line.strip(): continue
    parts = line.strip().split('|')
    mes = int(parts[0])
    recibo = int(parts[1]) if parts[1] else None
    nombre = parts[2]
    tot = float(parts[3]) if parts[3] else 0.0
    op_id = parts[4]
    db_ops.setdefault(mes, []).append({'recibo': recibo, 'nombre': nombre, 'tot': tot, 'id': op_id})

wb = xlrd.open_workbook('Datos Emprende/Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls')
months = [('JUNIO 2026', 6), ('JULIO 2026', 7), ('AGOSTO 2026', 8), ('SEPTIEMBRE 2026', 9)]

for sheet_name, mes in months:
    sh = wb.sheet_by_name(sheet_name)
    excel_list = []
    for r in range(6, sh.nrows):
        name = sh.cell_value(r, 1).strip()
        c3 = sh.cell_value(r, 3)
        c4 = sh.cell_value(r, 4)
        c5 = sh.cell_value(r, 5)
        cap = float(c3) if str(c3).strip() and isinstance(c3, (int, float)) else 0.0
        inte = float(c4) if str(c4).strip() and isinstance(c4, (int, float)) else 0.0
        apo = float(c5) if str(c5).strip() and isinstance(c5, (int, float)) else 0.0
        tot = round(cap + inte + apo, 2)
        if name and tot > 0:
            excel_list.append({'row': r + 1, 'name': name, 'tot': tot})
    
    print(f"\n==================== COMPARISON MES {mes} ====================")
    print(f"Excel count: {len(excel_list)} | DB count: {len(db_ops.get(mes, []))}")
    max_len = max(len(excel_list), len(db_ops.get(mes, [])))
    for i in range(max_len):
        ex = excel_list[i] if i < len(excel_list) else None
        db = db_ops[mes][i] if i < len(db_ops[mes]) else None
        ex_str = f"Row {ex['row']:2d}: {ex['name'][:18]:18s} (S/ {ex['tot']:8.2f})" if ex else "None"
        db_str = f"Recibo {db['recibo']:3d}: {db['nombre'][:18]:18s} (S/ {db['tot']:8.2f})" if db else "None"
        print(f"[{i+1:2d}] Excel: {ex_str}  <===>  DB: {db_str}")
