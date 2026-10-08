const xlsx = require('../frontend/node_modules/xlsx');
const wb = xlsx.readFile('C:\\Proyectos\\Emprende\\Datos Emprende\\Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls');

const testSocios = [
  'JUANA MARIA CACRO',
  'EDITH PILAR LINDO',
  'YAJHAIRA ROCIO LINDO',
  'HENRY JOSE HUAMAN',
  'TEOFILA MORAN',
  'SILVIA CACRO',
  'IVAN TELLO'
];

const checkSheets = [
  'ABRIL 2026', 'MAYO 2026', 'JUNIO 2026', 'JULIO 2026', 'AGOSTO 2026', 'SEPTIEMBRE 2026'
];

checkSheets.forEach(sName => {
  console.log(`\n=================== ${sName} ===================`);
  const s = wb.Sheets[sName];
  if (!s) { console.log('Sheet not found'); return; }
  
  for (let r = 7; r <= 30; r++) {
    const name = s[`C${r}`]?.v || s[`B${r}`]?.v;
    if (!name) continue;
    const nameUpper = String(name).toUpperCase();
    
    testSocios.forEach(ts => {
      if (nameUpper.includes(ts) || ts.includes(nameUpper)) {
        // print row values
        let vals = [];
        for (let c = 0; c < 20; c++) {
          const colL = xlsx.utils.encode_col(c);
          const val = s[`${colL}${r}`]?.v;
          if (val !== undefined && val !== '') {
            vals.push(`${colL}: ${val}`);
          }
        }
        console.log(`  Row ${r} [${name}]: ${vals.join(' | ')}`);
      }
    });
  }
});
