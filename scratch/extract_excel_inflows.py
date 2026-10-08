import xlrd
import subprocess
import json

wb = xlrd.open_workbook('Datos Emprende/Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls')

months = [('JUNIO 2026', 6), ('JULIO 2026', 7), ('AGOSTO 2026', 8), ('SEPTIEMBRE 2026', 9)]

excel_ops = []
for sheet_name, mes in months:
    sh = wb.sheet_by_name(sheet_name)
    for r in range(6, sh.nrows):
        name = sh.cell_value(r, 1).strip()
        c3 = sh.cell_value(r, 3) # pago capital
        c4 = sh.cell_value(r, 4) # interes
        c5 = sh.cell_value(r, 5) # acciones / aporte
        c8 = sh.cell_value(r, 8) if sh.ncols > 8 else '' # total
        
        # calculate total paid
        cap = float(c3) if str(c3).strip() and isinstance(c3, (int, float)) else 0.0
        inte = float(c4) if str(c4).strip() and isinstance(c4, (int, float)) else 0.0
        apo = float(c5) if str(c5).strip() and isinstance(c5, (int, float)) else 0.0
        tot = float(c8) if str(c8).strip() and isinstance(c8, (int, float)) else (cap + inte + apo)
        
        if name and tot > 0:
            excel_ops.append({
                'sheet': sheet_name,
                'mes': mes,
                'row': r + 1,
                'cell': f'A{r + 1}',
                'name': name,
                'cap': round(cap, 2),
                'inte': round(inte, 2),
                'apo': round(apo, 2),
                'tot': round(tot, 2)
            })

print(f"Total excel operations found: {len(excel_ops)}")
for op in excel_ops:
    print(f"Mes {op['mes']} | Row {op['row']:2d} ({op['cell']}): {op['name'][:22]:22s} | Tot={op['tot']:8.2f} (cap={op['cap']}, int={op['inte']}, apo={op['apo']})")
