const xlsx = require('../frontend/node_modules/xlsx');
const wb = xlsx.readFile('C:\\Proyectos\\Emprende\\Datos Emprende\\Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls');

// Let's inspect the sheets and find the accumulated shares for 2024, 2025, 2026.
// Also let's check sheet 'JUN 25' rows 7 to 20 carefully
const jun25 = wb.Sheets['JUN 25'];
console.log('=== JUN 25 DETALLE DE SOCIOS ===');
for (let r = 7; r <= 20; r++) {
  const socio = jun25[`C${r}`]?.v;
  const cap = jun25[`E${r}`]?.v;
  const int = jun25[`F${r}`]?.v;
  const acc = jun25[`G${r}`]?.v;
  const accCompradas = jun25[`H${r}`]?.v;
  const totalIng = jun25[`J${r}`]?.v;
  console.log(`R${r}: ${socio} | Acc S/.=${acc} | AccCompradas S/.=${accCompradas} | Cap=${cap} | Int=${int} | TotalIng=${totalIng}`);
}
