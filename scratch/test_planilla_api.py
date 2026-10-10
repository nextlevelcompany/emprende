import urllib.request
import json
import os

admin_email = os.environ["ADMIN_EMAIL"]
admin_password = os.environ["ADMIN_PASSWORD"]

# Login
login_data = json.dumps({
    'email': admin_email,
    'password': admin_password,
    'portal': 'ADMIN'
}).encode('utf-8')

req = urllib.request.Request('http://localhost:8080/api/v1/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    tokens = json.loads(resp.read().decode('utf-8'))
token = tokens['accessToken']

# Get Planilla for Octubre 2026
req2 = urllib.request.Request('http://localhost:8080/api/v1/periodos/01a11359-7e62-7da8-b2e4-bbb9029cb7ab/planilla', headers={
    'Authorization': f'Bearer {token}'
})
with urllib.request.urlopen(req2) as resp2:
    data = json.loads(resp2.read().decode('utf-8'))

filas = data.get('filas', [])
print(f"Periodo: {data.get('periodoNombre')}, Total filas: {len(filas)}")
receipts = [f.get('nroRecibo') for f in filas if f.get('nroRecibo')]
print(f"Total receipts: {len(receipts)}")
print(f"Receipts in planilla: {receipts}")
print(f"Min receipt: {min(receipts) if receipts else None}, Max receipt: {max(receipts) if receipts else None}")
for f in filas:
    print(f"Recibo #{f.get('nroRecibo')}: {f.get('socioNombre')} (Socio {f.get('socioCodigo')}) - Total: {f.get('totalIngreso')}")
