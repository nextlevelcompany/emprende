const xlsx = require('../frontend/node_modules/xlsx');
const wb = xlsx.readFile('C:\\Proyectos\\Emprende\\Datos Emprende\\Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls');

// Let's inspect JUNIO 2026 rows
const jun26 = wb.Sheets['JUNIO 2026'];
console.log('=== JUNIO 2026 ROWS ===');
for (let r = 7; r <= 30; r++) {
  const socio = jun26[`B${r}`]?.v;
  const acc = jun26[`F${r}`]?.v;
  const retAhorros = jun26[`M${r}`]?.v;
  const pres = jun26[`N${r}`]?.v;
  const totalEg = jun26[`T${r}`]?.v;
  if (socio || acc || retAhorros) {
    console.log(`R${r}: B=${socio} | F(Acc)=${acc} | M(Ret/Util)=${retAhorros} | N(Pres)=${pres} | T(TotEg)=${totalEg}`);
  }
}
