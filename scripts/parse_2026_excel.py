import openpyxl

wb = openpyxl.load_workbook(r'c:\Proyectos\Emprende\Datos Emprende\REPARTO DE UTILIDADES UNICA CHAMBALA -MAYO2026.xlsx', data_only=True)
ws = wb['Table 1']

print("Socio list in Table 1:")
socios = []
r = 25
while r <= 60:
    name = ws.cell(r, 1).value
    if name:
        acc_ini = ws.cell(r, 3).value or 0
        tot_acc = ws.cell(r, 18).value or 0
        util_r = ws.cell(r+1, 18).value
        util_t = ws.cell(r+1, 20).value
        util_u = ws.cell(r+1, 21).value
        socios.append({
            'row': r,
            'name': name,
            'acc_ini': acc_ini,
            'tot_acc': tot_acc,
            'util_r': util_r,
            'util_t': util_t,
            'util_u': util_u
        })
        r += 2
    else:
        r += 1

print(f"Found {len(socios)} socios:")
tot_acc_sum = sum(s['tot_acc'] for s in socios)
tot_util_r_sum = sum(float(str(s['util_r']).replace('S/.','').replace(',','').strip()) for s in socios if s['util_r'] is not None)
tot_util_u_sum = sum(float(s['util_u']) for s in socios if s['util_u'] is not None)

for s in socios:
    u_val = f"{float(s['util_u']):.2f}" if s['util_u'] is not None else "None"
    print(f"{s['row']:2d}: {s['name']:<35} | Acc: {s['tot_acc']:4d} | UtilR: {s['util_r']} | UtilU: {u_val}")

print(f"\nTotal Acciones sum: {tot_acc_sum} (Sheet R61: {ws.cell(61, 18).value})")
print(f"Total Utilidad R sum: {tot_util_r_sum:.2f} (Sheet R62: {ws.cell(62, 18).value})")
print(f"Total Utilidad U sum: {tot_util_u_sum:.2f}")
