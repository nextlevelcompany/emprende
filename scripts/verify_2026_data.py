import openpyxl

wb = openpyxl.load_workbook(r'c:\Proyectos\Emprende\Datos Emprende\REPARTO DE UTILIDADES UNICA CHAMBALA -MAYO2026.xlsx', data_only=True)
ws = wb['Table 1']

socio_mapping = {
    'CIRILO ENRIQUE HUAMAN MORAN': '01a10f3a-7e4b-7148-9d2c-d9b709236310',
    'ANABEL MARIA LAIME CCACCRO': '01a10f3a-7e76-7d8d-b628-45fe5228ad9d',
    'DORIS HAYDEE LAIME CCACCRO': '01a10f3a-7e8c-7907-9e87-61346c6d5318',
    'ADELA PONCE HUILCAYA': '01a10f3a-7ea1-7dfc-be82-7e2754a4db3c',
    'JULIAN MORAN VASQUEZ': '01a10f3a-7eb9-7e1d-8b2b-81e0c2598c35',
    'ALICIA LAIME CCACCRO': '01a10f3a-7ece-778a-9572-2f1865c6b20b',
    'JUAN CARLOS RAZURI MONJA': '01a10f3a-7ee6-714f-a1ec-9fda25bee73a',
    'ALEJANDRA SILVIA HUAMAN MORAN': '01a10f3a-7eff-7381-bf54-47bfedcad2f9',
    'JUANA MARIA CACRO HINOSTROZA': '01a10f3a-7f1e-708b-9624-4af5e433dfe7',
    'SILVIA CACRO HINOSTROZA': '01a10f3a-801d-767c-bbf3-c066b407c724',
    'EDITH PILAR LINDO MORAN': '01a10f3a-7f3b-7309-be00-9d669a6a2820',
    'ELIZABETH V. HUAMAN ORDAYA': '01a10f3a-7f55-7102-8d63-9433a269447a',
    'YAJHAIRA ROCIO LINDO MORAN': '01a10f3a-7f73-7074-9f57-b295bd4ce788',
    'MARGARITA LEON CONDE': '01a10f3a-7f97-7b5b-b833-8e178efe792f',
    'HENRY': '01a10f3a-7fb7-7ddc-add4-9fd93b83b88b',
    'MIRTHA': '01a10f3a-7fd1-70ff-a915-a946082b58b7',
    'YESENIA': '01a10f3a-7fea-7c0e-b952-862211e55116',
    'TEOFILA': '01a10f3a-8004-7118-aea6-aebeb766fb41'
}

print(f"Total mapped socios: {len(socio_mapping)}")

results = []
r = 25
while r <= 60:
    name = ws.cell(r, 1).value
    if name:
        name_clean = name.strip()
        socio_id = socio_mapping.get(name_clean)
        tot_acc = int(ws.cell(r, 18).value or 0)
        util_r = float(str(ws.cell(r+1, 18).value).replace('S/.','').replace(',','').strip())
        results.append({
            'name': name_clean,
            'socio_id': socio_id,
            'acciones': tot_acc,
            'monto': util_r
        })
        r += 2
    else:
        r += 1

print(f"{'Socio':<35} | {'Acciones':<8} | {'Monto (S/.)':<12}")
print("-" * 60)
total_acc = 0
total_monto = 0.0
for res in results:
    total_acc += res['acciones']
    total_monto += res['monto']
    print(f"{res['name']:<35} | {res['acciones']:8d} | {res['monto']:12.2f}")

print("-" * 60)
print(f"{'TOTAL':<35} | {total_acc:8d} | {total_monto:12.2f}")
