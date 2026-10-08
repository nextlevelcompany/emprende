import urllib.request
import json

req = urllib.request.Request('http://localhost:3000/api/utilidades')
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print(f"Total exercises: {len(data)}")
    for d in data:
        print("=" * 60)
        print(f"Ejercicio: {d['ejercicio']} | Corte: {d['fechaCorte']} | Estado: {d['estado']}")
        print(f"  Utilidad Total: S/. {d['utilidadTotal']:,.2f}")
        print(f"  Total Acciones: {d['totalAcciones']} acc.")
        print(f"  Valor por Acción: S/. {d['valorPorAccion']:.6f}")
        print(f"  Total Cobrado Efectivo: S/. {d.get('totalCobrado', 0):,.2f}")
        print(f"  Total Reinvertido: S/. {d.get('totalReinvertido', 0):,.2f}")
        print(f"  Acciones Compradas: {d.get('totalAccionesCompradas', 0)}")
        print(f"  Total Socios: {len(d['detalles'])}")
        tot_monto = sum(det['monto'] for det in d['detalles'])
        print(f"  Suma Montos Detalles: S/. {tot_monto:,.2f}")
