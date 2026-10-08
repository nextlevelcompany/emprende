const xlsx = require('../frontend/node_modules/xlsx');
const wb = xlsx.readFile('C:\\Proyectos\\Emprende\\Datos Emprende\\Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls');

const sheets2025 = ['JUL 24 ', 'AGO 24', 'SET 24 ', 'OCT 24', 'NOV 24', 'DIC 24', 'ENE 25', 'FEB 25', 'MAR 25', 'ABR 25', 'MAY 25', 'JUN 25'];

let totalG33 = 0;
let totalH33 = 0;
let perSocioAcc = {};
let perSocioCompradas = {};

sheets2025.forEach(sName => {
  const s = wb.Sheets[sName];
  if (!s) { console.log('Sheet not found:', sName); return; }
  const g33 = s['G33']?.v || 0;
  const h33 = s['H33']?.v || 0;
  totalG33 += g33;
  totalH33 += h33;
  console.log(`${sName}: G33 = ${g33}, H33 = ${h33}, G35 = ${s['G35']?.v}`);
  for (let r = 7; r <= 27; r++) {
    const socioName = s[`C${r}`]?.v;
    const acc = s[`G${r}`]?.v || 0;
    const comp = s[`H${r}`]?.v || 0;
    if (socioName && acc > 0) {
      perSocioAcc[socioName] = (perSocioAcc[socioName] || 0) + acc;
    }
    if (socioName && comp > 0) {
      perSocioCompradas[socioName] = (perSocioCompradas[socioName] || 0) + comp;
    }
  }
});

console.log('Total G33 (Aportes acciones ciclo 24-25):', totalG33);
console.log('Total H33 (Acciones compradas con utilidades):', totalH33);
console.log('JUN 25 cell G35 (Capital social total acumulado):', wb.Sheets['JUN 25']['G35']?.v);
console.log('JUN 25 cell H35:', wb.Sheets['JUN 25']['H35']?.v);
console.log('Per socio aportes 24-25:', perSocioAcc);
console.log('Per socio compradas con utilidades 25:', perSocioCompradas);
