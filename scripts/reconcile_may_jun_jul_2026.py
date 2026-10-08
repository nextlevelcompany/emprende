# Reconciliation Script for May - June - July 2026 Settlement

# 1. Recaudación en Caja (Mayo + Junio 2026)
ingresos_mayo = 18057.23
ingresos_junio = 26596.86
total_recaudado = ingresos_mayo + ingresos_junio

print(f"1. FLUJO DE FONDOS RECAUDADOS:")
print(f"   Saldo Mayo 2026:     S/. {ingresos_mayo:10.2f}")
print(f"   Saldo Junio 2026:    S/. {ingresos_junio:10.2f}")
print(f"   Total Recaudado:     S/. {total_recaudado:10.2f}")

# 2. Utilidades 2026 pagadas a todos los socios
utilidades_pagadas = 18652.80
saldo_disponible_retiros = total_recaudado - utilidades_pagadas

print(f"\n2. PAGO DE UTILIDADES (EJERCICIO 2026):")
print(f"   Utilidades a todos:  S/. {utilidades_pagadas:10.2f}")
print(f"   Saldo Disponible:    S/. {saldo_disponible_retiros:10.2f}")

# 3. Capital de los 6 socios retirados (hasta 08/05/2026)
socios_retirados = [
    {"nombre": "EDITH PILAR LINDO MORAN", "acciones": 356, "capital": 10680.00, "utilidad": 2898.80},
    {"nombre": "YAJHAIRA ROCIO LINDO MORAN", "acciones": 299, "capital": 8970.00, "utilidad": 2316.30},
    {"nombre": "MARGARITA LEON CONDE", "acciones": 65, "capital": 1950.00, "utilidad": 549.40},
    {"nombre": "HENRY JOSE HUAMAN CANTURIN", "acciones": 47, "capital": 1410.00, "utilidad": 221.40},
    {"nombre": "JUANA MARIA CACRO HINOSTROZA", "acciones": 196, "capital": 5880.00, "utilidad": 1561.70},
    {"nombre": "TEOFILA MORAN VASQUEZ", "acciones": 66, "capital": 1980.00, "utilidad": 418.50},
]

total_acciones_retirados = sum(s["acciones"] for s in socios_retirados)
total_capital_retirados = sum(s["capital"] for s in socios_retirados)
total_utilidades_retirados = sum(s["utilidad"] for s in socios_retirados)
total_liquidacion_retirados = total_capital_retirados + total_utilidades_retirados

print(f"\n3. CAPITAL Y UTILIDADES DE SOCIOS RETIRADOS:")
print(f"   Total Acciones a liquidar: {total_acciones_retirados} acciones (a S/. 30.00 c/u)")
print(f"   Total Capital por entregar:   S/. {total_capital_retirados:10.2f}")
print(f"   Total Utilidades 2026:        S/. {total_utilidades_retirados:10.2f}")
print(f"   Total Liquidación Retirados:  S/. {total_liquidacion_retirados:10.2f}")

print("\n   Desglose Individual:")
for s in socios_retirados:
    tot_ind = s["capital"] + s["utilidad"]
    print(f"   - {s['nombre']:<32} | Acc: {s['acciones']:3d} | Cap: S/. {s['capital']:8.2f} | Util: S/. {s['utilidad']:7.2f} | Total: S/. {tot_ind:8.2f}")

# 4. Cobertura del Capital en Junio vs Julio
diferencia_pendiente = total_capital_retirados - saldo_disponible_retiros
print(f"\n4. COBERTURA DEL CAPITAL EN JUNIO 2026:")
print(f"   Capital Total Requerido:      S/. {total_capital_retirados:10.2f}")
print(f"   Saldo Disponible en Junio:    S/. {saldo_disponible_retiros:10.2f}")
print(f"   Diferencia Pendiente (Julio): S/. {diferencia_pendiente:10.2f}")

# 5. Pagos registrados en Julio 2026 (Libro CAJA)
pagos_julio = [
    {"nombre": "MARGARITA LEON CONDE", "monto": 1950.00, "concepto": "100% de su Capital (65 acc x S/. 30)"},
    {"nombre": "EDITH LINDO MORAN", "monto": 1648.71, "concepto": "Saldo liquidación"},
    {"nombre": "JUANA CACRO HINOSTROZA", "monto": 850.00, "concepto": "Saldo liquidación"},
]
total_pagos_retirados_julio = sum(p["monto"] for p in pagos_julio)
print(f"\n5. PAGOS REGISTRADOS EN JULIO 2026:")
for p in pagos_julio:
    print(f"   - {p['nombre']:<25}: S/. {p['monto']:8.2f} ({p['concepto']})")
print(f"   Total Pagos Retiro Julio:     S/. {total_pagos_retirados_julio:10.2f}")
print(f"   (Ajuste pendiente mínimo:     S/. {diferencia_pendiente - total_pagos_retirados_julio:10.2f} por compensación de cuotas/intereses)")
