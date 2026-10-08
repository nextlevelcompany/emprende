const xlsx = require('../frontend/node_modules/xlsx');
const wb = xlsx.readFile('C:\\Proyectos\\Emprende\\Datos Emprende\\Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls');

const sheets2024 = ['JUL 23', 'AGO 23', 'SET 23', 'OCT 23', 'NOV 23 ', 'DIC 23  ', 'ENE 24   ', 'FEB 24', 'MAR 24', 'ABR 24 ', 'MAY 24', 'JUN 24 '];

let totalG33 = 0;
let perSocio = {};

sheets2024.forEach(sName => {
  const s = wb.Sheets[sName];
  if (!s) { console.log('Sheet not found:', sName); return; }
  const g33 = s['G33']?.v || 0;
  totalG33 += g33;
  console.log(`${sName}: G33 = ${g33}, G35 = ${s['G35']?.v}`);
  for (let r = 7; r <= 27; r++) {
    const socioName = s[`C${r}`]?.v;
    const acc = s[`G${r}`]?.v || 0;
    if (socioName && acc > 0) {
      perSocio[socioName] = (perSocio[socioName] || 0) + acc;
    }
  }
});

console.log('Total G33 sum across 12 months:', totalG33, 'Total acciones:', totalG33 / 30);
console.log('Per socio:', perSocio);
