const xlsx = require('../frontend/node_modules/xlsx');
const wb = xlsx.readFile('C:\\Proyectos\\Emprende\\Datos Emprende\\Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls');

['JULIO 2026', 'AGOSTO 2026', 'SEPTIEMBRE 2026'].forEach(sName => {
  console.log(`\n=== SOCIOS EN ${sName} ===`);
  const s = wb.Sheets[sName];
  if (!s) return;
  for (let r = 7; r <= 30; r++) {
    const name = s[`C${r}`]?.v || s[`B${r}`]?.v;
    const acc = s[`F${r}`]?.v || s[`G${r}`]?.v;
    if (name) {
      const u = String(name).trim().toUpperCase();
      if (!u.includes('TOTAL') && !u.includes('ACUMULADO') && !u.includes('INGRESOS')) {
        console.log(`  R${r}: ${name} | Aporte Acc: ${acc}`);
      }
    }
  }
});
