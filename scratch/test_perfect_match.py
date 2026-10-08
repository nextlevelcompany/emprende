import xlrd
import subprocess

# 1. Fetch DB operations for months 6, 7, 8, 9
cmd = [
    "docker", "exec", "caja_chambala_db", "psql", "-U", "postgres", "-d", "caja_chambala", "-t", "-A", "-F", "|", "-c",
    """
    SELECT p.mes, o.id, s.codigo, s.nombres, 
           (SELECT sum(monto) FROM operacion_detalle WHERE operacion_id = o.id) as tot
    FROM operacion o
    JOIN periodo p ON o.periodo_id = p.id
    JOIN socio s ON o.socio_id = s.id
    WHERE p.anio = 2026 AND p.mes IN (6, 7, 8, 9) AND o.estado = 'VIGENTE' AND o.tipo = 'INGRESO'
    ORDER BY p.mes;
    """
]
out = subprocess.check_output(cmd, encoding='utf-8')
db_ops_by_mes = {6: [], 7: [], 8: [], 9: []}
for line in out.strip().split('\n'):
    if not line.strip(): continue
    parts = line.strip().split('|')
    mes = int(parts[0])
    op_id = parts[1]
    socio_cod = int(parts[2])
    nombre = parts[3]
    tot = round(float(parts[4]), 2)
    db_ops_by_mes[mes].append({'id': op_id, 'codigo': socio_cod, 'nombre': nombre, 'tot': tot})

wb = xlrd.open_workbook('Datos Emprende/Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls')
months = [('JUNIO 2026', 6), ('JULIO 2026', 7), ('AGOSTO 2026', 8), ('SEPTIEMBRE 2026', 9)]

current_recibo = 523
mapping = []

# Map socio name tokens to match
def match_socio(name, db_name):
    # e.g. "CIRILO ENRIQUE HUAMAN MORAN" vs "CIRILO ENRIQUE"
    tokens1 = set(name.upper().split())
    tokens2 = set(db_name.upper().split())
    return len(tokens1.intersection(tokens2)) >= 1

for sheet_name, mes in months:
    sh = wb.sheet_by_name(sheet_name)
    available_db_ops = list(db_ops_by_mes[mes])
    
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
            rec = current_recibo
            current_recibo += 1
            
            # Find matching DB op:
            # 1. First by name match AND amount match
            match = None
            for op in available_db_ops:
                if match_socio(name, op['nombre']) and abs(op['tot'] - tot) < 0.05:
                    match = op
                    break
            
            # 2. If not found, match by name only (in case of small rounding diff)
            if not match:
                for op in available_db_ops:
                    if match_socio(name, op['nombre']):
                        match = op
                        break
            
            if not match:
                print(f"ERROR: No match for mes {mes}, row {r+1}, {name}, tot={tot}")
            else:
                available_db_ops.remove(match)
                mapping.append({
                    'mes': mes,
                    'sheet': sheet_name,
                    'row': r + 1,
                    'cell': f'A{r+1}',
                    'recibo': rec,
                    'name': name,
                    'tot': tot,
                    'db_id': match['id'],
                    'db_nombre': match['nombre'],
                    'db_tot': match['tot']
                })
    if len(available_db_ops) > 0:
        print(f"WARNING: Unmatched DB ops in mes {mes}: {len(available_db_ops)}")

print(f"\nTotal mapped: {len(mapping)} (Expected: 68)")
print(f"Next recibo for Octubre: {current_recibo} (Expected: 591)")

for m in mapping:
    print(f"Mes {m['mes']} | {m['cell']:4s} | Recibo {m['recibo']} | {m['name'][:20]:20s} S/ {m['tot']:8.2f} <-> DB {m['db_nombre'][:15]} S/ {m['db_tot']:8.2f} (op: {m['db_id'][:8]})")
