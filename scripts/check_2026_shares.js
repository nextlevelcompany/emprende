const xlsx = require('../frontend/node_modules/xlsx');
const wb = xlsx.readFile('C:\\Proyectos\\Emprende\\Datos Emprende\\Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls');

const sheets2026 = [
  'JUL 25', 'AGOSTO 25', 'SEPTIEMBR 25', 'OCTUBRE 2025', 'NOVIEMBRE 2025',
  'DICIEMBRE 2025', 'ENERO 2026', 'FEBRERO 2026', 'MARZO 2026',
  'ABRIL 2026', 'MAYO 2026', 'JUNIO 2026'
];

let totalG33 = 0;
let perSocioAcc = {};

sheets2026.forEach(sName => {
  const s = wb.Sheets[sName];
  if (!s) { console.log('Sheet not found:', sName); return; }
  // Find column for Acciones: might be G or F
  // Let's check headers on row 5
  let accCol = 'G';
  for (let c = 0; c < 15; c++) {
    const colL = xlsx.utils.encode_col(c);
    const h = s[colL + '5']?.v;
    if (h && String(h).toUpperCase().includes('ACCIONES')) {
      accCol = colL;
      break;
    }
  }
  
  for (let r = 7; r <= 30; r++) {
    // Socio name might be in B or C
    let socioName = s[`C${r}`]?.v || s[`B${r}`]?.v;
    let acc = s[`${accCol}${r}`]?.v || 0;
    if (socioName && typeof acc === 'number' && acc > 0) {
      const u = String(socioName).trim().toUpperCase();
      if (!u.includes('TOTAL') && !u.includes('ACUMULADO') && !u.includes('INGRESOS')) {
        perSocioAcc[socioName] = (perSocioAcc[socioName] || 0) + acc;
        totalG33 += acc;
      }
    }
  }
  console.log(`${sName}: accCol = ${accCol}, acumulado = ${s['G35']?.v || s['F34']?.v}`);
});

console.log('Total aportes acciones ciclo 25-26:', totalG33);
console.log('Per socio aportes 25-26:', perSocioAcc);
