const xlsx = require('../frontend/node_modules/xlsx');
const wb = xlsx.readFile('C:\\Proyectos\\Emprende\\Datos Emprende\\Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls');

// Let's compute for each socio:
// 1) Shares from 2024 (531 total)
// 2) Shares added in 2024-2025 (440 total = 13200 aportes / 30)
// 3) Shares bought with utilidades in June 2025 (179 total = 5370 / 30)
// 4) Subtract retired shares of Silvia Cacro (68 shares = 2040 / 30)
// Total at end of June 2025 = 531 + 440 + 179 - 68 = 1082 shares? Or what?
// And then what happened between July 2025 and May 2026?

// Let's inspect cell G34 in JUNIO 2026: G34 = 33030 S/. (33030 / 30 = 1101)
// Let's print MAYO 2026 cell G35, G34, etc.
const may26 = wb.Sheets['MAYO 2026'];
console.log('=== MAYO 2026 ===');
for (let c = 0; c < 15; c++) {
  const col = xlsx.utils.encode_col(c);
  console.log(`${col}32: ${may26[col+'32']?.v}, ${col}33: ${may26[col+'33']?.v}, ${col}34: ${may26[col+'34']?.v}, ${col}35: ${may26[col+'35']?.v}`);
}
