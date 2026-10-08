import json
import subprocess

with open('scratch/exact_receipt_mapping.json', 'r', encoding='utf-8') as f:
    mapping = json.load(f)

sql_statements = [
    "BEGIN;",
    "ALTER TABLE operacion DISABLE TRIGGER trg_operacion_periodo_cerrado;",
    # Clear receipts for months 6..9 first to avoid unique key collision during swap
    "UPDATE operacion SET nro_recibo = NULL WHERE periodo_id IN (SELECT id FROM periodo WHERE anio = 2026 AND mes IN (6, 7, 8, 9));"
]

for item in mapping:
    if item['has_payment'] and item['db_id'] and item['recibo']:
        sql_statements.append(
            f"UPDATE operacion SET nro_recibo = {item['recibo']} WHERE id = '{item['db_id']}';"
        )

sql_statements.append("ALTER TABLE operacion ENABLE TRIGGER trg_operacion_periodo_cerrado;")
sql_statements.append("COMMIT;")

full_sql = "\n".join(sql_statements)

cmd = [
    "docker", "exec", "-i", "caja_chambala_db", "psql", "-U", "postgres", "-d", "caja_chambala"
]
p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
stdout, stderr = p.communicate(input=full_sql)

if stderr:
    print("STDERR:", stderr)
else:
    print("All statements executed successfully in transaction!")

print(f"Exited with code {p.returncode}")
