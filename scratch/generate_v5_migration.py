import json
import subprocess

# 1. Load mapping for months 6, 7, 8, 9
with open('scratch/exact_receipt_mapping.json', 'r', encoding='utf-8') as f:
    mapping = json.load(f)

# 2. Query month 10 (Octubre 2026) operations from DB
cmd = [
    "docker", "exec", "caja_chambala_db", "psql", "-U", "postgres", "-d", "caja_chambala", "-t", "-A", "-F", "|", "-c",
    """
    SELECT o.id, o.nro_recibo, s.nombres
    FROM operacion o
    JOIN periodo p ON o.periodo_id = p.id
    JOIN socio s ON o.socio_id = s.id
    WHERE p.anio = 2026 AND p.mes = 10 AND o.estado = 'VIGENTE' AND o.tipo = 'INGRESO'
    ORDER BY o.nro_recibo;
    """
]
out = subprocess.check_output(cmd, encoding='utf-8')
oct_ops = []
for line in out.strip().split('\n'):
    if not line.strip(): continue
    parts = line.strip().split('|')
    oct_ops.append({'id': parts[0], 'recibo': int(parts[1]), 'nombre': parts[2]})

lines = [
    "-- =====================================================================",
    "-- V5__correlativo_recibos_sin_duplicados.sql  |  PostgreSQL 16+",
    "-- Corrige el correlativo histórico de recibos (nro_recibo) a partir de",
    "-- junio de 2026 para eliminar duplicados originados por la plantilla del Excel.",
    "-- Se renumeran de forma estrictamente secuencial y única en toda la caja:",
    "--   - Mayo 2026: culmina en el recibo 522.",
    "--   - Junio 2026: 523 al 538 (16 recibos segun filas del Excel)",
    "--   - Julio 2026: 539 al 555 (17 recibos segun filas del Excel)",
    "--   - Agosto 2026: 556 al 572 (17 recibos segun filas del Excel)",
    "--   - Setiembre 2026: 573 al 590 (18 recibos segun filas del Excel)",
    "--   - Octubre 2026: 591 al 608 (18 recibos)",
    "-- Se establece el indice unico global (caja_id, nro_recibo) sobre operaciones vigentes.",
    "-- =====================================================================",
    "",
    "-- Desactivar temporalmente el trigger de periodo cerrado durante la migración",
    "ALTER TABLE operacion DISABLE TRIGGER trg_operacion_periodo_cerrado;",
    "",
    "-- 1. Asignar recibo 522 a la operación de Juan Carlos Rázuri en Mayo 2026 si estaba en null",
    "UPDATE operacion",
    "SET nro_recibo = 522",
    "WHERE id = 'ca852c88-4f2b-c532-d9f2-b042f87704d0' AND nro_recibo IS NULL;",
    "",
    "-- 2. Limpiar nro_recibo en operaciones anuladas para evitar colisiones",
    "UPDATE operacion",
    "SET nro_recibo = NULL",
    "WHERE estado = 'ANULADA';",
    "",
    "-- 3. Limpiar temporalmente nro_recibo en periodos a renumerar (mes >= 6) para evitar colisiones unicas durante la actualizacion",
    "UPDATE operacion",
    "SET nro_recibo = NULL",
    "WHERE periodo_id IN (SELECT id FROM periodo WHERE anio = 2026 AND mes >= 6);",
    "",
    "-- 4. Asignar correlativo exacto segun el orden fisico del Libro de Caja (Excel) y planilla"
]

cur_mes = None
for item in mapping:
    if item['has_payment'] and item['db_id'] and item['recibo']:
        if item['mes'] != cur_mes:
            cur_mes = item['mes']
            lines.append(f"\n-- Mes {cur_mes} ({item['sheet']})")
        lines.append(f"UPDATE operacion SET nro_recibo = {item['recibo']} WHERE id = '{item['db_id']}'; -- {item['name']} ({item['cell']})")

lines.append("\n-- Mes 10 (OCTUBRE 2026)")
for op in oct_ops:
    lines.append(f"UPDATE operacion SET nro_recibo = {op['recibo']} WHERE id = '{op['id']}'; -- {op['nombre']}")

lines.extend([
    "",
    "-- 5. Reemplazar índice de periodo por índice único global en toda la caja",
    "DROP INDEX IF EXISTS ux_operacion_periodo_recibo;",
    "DROP INDEX IF EXISTS ux_operacion_recibo;",
    "",
    "CREATE UNIQUE INDEX ux_operacion_recibo ON operacion (caja_id, nro_recibo)",
    "  WHERE nro_recibo IS NOT NULL AND estado = 'VIGENTE';",
    "",
    "-- Reactivar trigger de periodo cerrado",
    "ALTER TABLE operacion ENABLE TRIGGER trg_operacion_periodo_cerrado;",
    ""
])

sql_content = "\n".join(lines)
with open('backend/src/main/resources/db/migration/V5__correlativo_recibos_sin_duplicados.sql', 'w', encoding='utf-8') as f:
    f.write(sql_content)

print("V5 migration updated successfully with exact mappings!")
