const xlsx = require('../frontend/node_modules/xlsx');
const wb = xlsx.readFile('C:\\Proyectos\\Emprende\\Datos Emprende\\Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls');

function dumpSheet(name) {
  console.log('================================================================');
  console.log('=== FULL DUMP OF SHEET:', name, '===');
  console.log('================================================================');
  const sheet = wb.Sheets[name];
  if (!sheet) return;
  const range = xlsx.utils.decode_range(sheet['!ref']);
  for (let R = range.s.r; R <= range.e.r; R++) {
    let rowVals = [];
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = sheet[xlsx.utils.encode_cell({r: R, c: C})];
      if (cell && cell.v !== undefined && cell.v !== '') {
        const formula = cell.f ? ` [=${cell.f}]` : '';
        rowVals.push(`${xlsx.utils.encode_col(C)}: ${cell.v}${formula}`);
      }
    }
    if (rowVals.length > 0) {
      console.log(`R${R+1}: ${rowVals.join(' | ')}`);
    }
  }
}

dumpSheet('JUN 24 ');
