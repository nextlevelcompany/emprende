const xlsx = require('../frontend/node_modules/xlsx');
const wb = xlsx.readFile('C:\\Proyectos\\Emprende\\Datos Emprende\\Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls');

// Let's trace shares per socio across all sheets up to MAYO 2026
const allSheets = [
  'JUL 23', 'AGO 23', 'SET 23', 'OCT 23', 'NOV 23 ', 'DIC 23  ',
  'ENE 24   ', 'FEB 24', 'MAR 24', 'ABR 24 ', 'MAY 24', 'JUN 24 ',
  'JUL 24 ', 'AGO 24', 'SET 24 ', 'OCT 24', 'NOV 24', 'DIC 24',
  'ENE 25', 'FEB 25', 'MAR 25', 'ABR 25', 'MAY 25', 'JUN 25',
  'JUL 25', 'AGOSTO 25', 'SEPTIEMBR 25', 'OCTUBRE 2025', 'NOVIEMBRE 2025',
  'DICIEMBRE 2025', 'ENERO 2026', 'FEBRERO 2026', 'MARZO 2026',
  'ABRIL 2026', 'MAYO 2026'
];

const aliases = {
  'CIRILO ENRIQUE HUAMAN MORAN': 'CIRILO ENRIQUE HUAMAN MORAN',
  'ANABEL MARIA LAIME CCACCRO': 'ANABEL MARIA LAIME CCACCRO',
  'DORIS HAYDEE LAIME CCACCRO': 'DORIS HAYDEE LAIME CCACCRO',
  'ADELA PONCE HUILCAYA': 'ADELA PONCE HUILCAYA',
  'JULIAN MORAN VASQUEZ': 'JULIAN MORAN VASQUEZ',
  'ALICIA LAIME CCACCRO': 'ALICIA LAIME CCACCRO',
  'JUAN CARLOS RAZURI MONJA': 'JUAN CARLOS RAZURI MONJA',
  'ALEJANDRA SILVIA HUAMAN MORAN': 'ALEJANDRA SILVIA HUAMAN MORAN',
  'JUANA MARIA CACRO HINOSTROZA': 'JUANA MARIA CACRO HINOSTROZA',
  'SILVIA CACRO HINOSTROZA': 'SILVIA CACRO HINOSTROZA',
  'EDITH PILAR LINDO MORAN': 'EDITH PILAR LINDO MORAN',
  'ELIZABETH VANESSA HUAMAN ORDAYA': 'ELIZABETH VANESSA HUAMAN ORDAYA',
  'YAJHAIRA ROCIO LINDO MORAN': 'YAJHAIRA ROCIO LINDO MORAN',
  'MARGARITA LEON CONDE': 'MARGARITA LEON CONDE',
  'HENRY JOSE HUAMAN CANTURIN': 'HENRY JOSE HUAMAN CANTURIN',
  'MIRTHA ROSA ALANYA HUAMAN': 'MIRTHA ROSA ALANYA HUAMAN',
  'YESSENIA HUAMAN ORDAYA': 'YESSENIA HUAMAN ORDAYA',
  'TEOFILA MORAN VASQUEZ': 'TEOFILA MORAN VASQUEZ',
  'RAUL BAUTISTA': 'RAUL BAUTISTA',
  'OMAR LAIME': 'OMAR LAIME',
  'EDDY PRUDENCIO': 'EDDY PRUDENCIO',
  'JEFFERSON SEVERINO': 'JEFFERSON SEVERINO',
};

function normalizeName(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toUpperCase();
  if (s.includes('TOTAL') || s.includes('ACUMULAD') || s.includes('INGRES') || s.includes('EGRES') || s.includes('SALDO') || s.includes('EXTERNO') || s.includes('SE RETIRO')) return null;
  for (const k of Object.keys(aliases)) {
    if (s.includes(k) || k.includes(s)) return aliases[k];
  }
  if (s.includes('CIRILO') || s.includes('ENRIQUE HUAMAN')) return 'CIRILO ENRIQUE HUAMAN MORAN';
  if (s.includes('ANABEL')) return 'ANABEL MARIA LAIME CCACCRO';
  if (s.includes('DORIS') || s.includes('DORS')) return 'DORIS HAYDEE LAIME CCACCRO';
  if (s.includes('ADELA')) return 'ADELA PONCE HUILCAYA';
  if (s.includes('JULIAN')) return 'JULIAN MORAN VASQUEZ';
  if (s.includes('ALICIA')) return 'ALICIA LAIME CCACCRO';
  if (s.includes('RAZURI')) return 'JUAN CARLOS RAZURI MONJA';
  if (s.includes('ALEJANDRA')) return 'ALEJANDRA SILVIA HUAMAN MORAN';
  if (s.includes('JUANA')) return 'JUANA MARIA CACRO HINOSTROZA';
  if (s.includes('SILVIA')) return 'SILVIA CACRO HINOSTROZA';
  if (s.includes('EDITH')) return 'EDITH PILAR LINDO MORAN';
  if (s.includes('VANESSA') || s.includes('VANE')) return 'ELIZABETH VANESSA HUAMAN ORDAYA';
  if (s.includes('YAJHAIRA')) return 'YAJHAIRA ROCIO LINDO MORAN';
  if (s.includes('MARGARITA')) return 'MARGARITA LEON CONDE';
  if (s.includes('HENRY') || s.includes('JOSE HUAMAN') || s.includes('CINDY')) return 'HENRY JOSE HUAMAN CANTURIN';
  if (s.includes('ALANYA') || s.includes('ROSA')) return 'MIRTHA ROSA ALANYA HUAMAN';
  if (s.includes('YESSENIA')) return 'YESSENIA HUAMAN ORDAYA';
  if (s.includes('TEOFILA')) return 'TEOFILA MORAN VASQUEZ';
  if (s.includes('RAUL')) return 'RAUL BAUTISTA';
  if (s.includes('OMAR')) return 'OMAR LAIME';
  if (s.includes('EDDY')) return 'EDDY PRUDENCIO';
  if (s.includes('JEFFERSON')) return 'JEFFERSON SEVERINO';
  return null;
}

let socioShares = {};

allSheets.forEach(sName => {
  const s = wb.Sheets[sName];
  if (!s) return;
  // find column
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
    const nameVal = s[`C${r}`]?.v || s[`B${r}`]?.v;
    const norm = normalizeName(nameVal);
    const acc = s[`${accCol}${r}`]?.v;
    if (norm && typeof acc === 'number' && acc > 0) {
      socioShares[norm] = (socioShares[norm] || 0) + acc;
    }
    // Also in JUN 25, check column H (acciones compradas)
    if (sName === 'JUN 25') {
      const comp = s[`H${r}`]?.v;
      if (norm && typeof comp === 'number' && comp > 0) {
        socioShares[norm] = (socioShares[norm] || 0) + comp;
      }
    }
  }
});

// Silvia Cacro retired and withdrew her shares
delete socioShares['SILVIA CACRO HINOSTROZA'];

console.log('=== TOTAL CAPITAL SOCIAL PER SOCIO (A MAYO 2026) ===');
let totalMonto = 0;
let totalAcc = 0;
for (const [k, v] of Object.entries(socioShares)) {
  const acc = Math.round(v / 30);
  totalMonto += v;
  totalAcc += acc;
  console.log(`${k}: S/. ${v} (${acc} acciones)`);
}
console.log(`TOTAL MONTO: ${totalMonto}, TOTAL ACCIONES: ${totalAcc}`);
