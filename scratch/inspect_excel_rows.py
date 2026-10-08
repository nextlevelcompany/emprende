import xlrd
import subprocess
import json

wb = xlrd.open_workbook('Datos Emprende/Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls')

months = [('JUNIO 2026', 6), ('JULIO 2026', 7), ('AGOSTO 2026', 8), ('SEPTIEMBRE 2026', 9)]

for sheet_name, mes in months:
    sh = wb.sheet_by_name(sheet_name)
    print(f"\n==================== {sheet_name} (Mes {mes}) ====================")
    for r in range(6, 30):
        if r < sh.nrows:
            name = sh.cell_value(r, 1)
            c0 = sh.cell_value(r, 0)
            c3 = sh.cell_value(r, 3)
            c4 = sh.cell_value(r, 4)
            c5 = sh.cell_value(r, 5)
            c8 = sh.cell_value(r, 8) if sh.ncols > 8 else ''
            # print if name exists
            if name:
                has_val = any([c3, c4, c5, c8 and c8 != 0.0])
                print(f"Row {r+1:2d} (A{r+1}): old_recibo={str(c0):5s} | has_val={has_val} | name={name[:25]:25s} | c3={str(c3):8s} c4={str(c4):8s} c5={str(c5):8s} c8={str(c8):8s}")
