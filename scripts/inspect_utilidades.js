const xlsx = require('../frontend/node_modules/xlsx');
const wb = xlsx.readFile('C:\\Proyectos\\Emprende\\Datos Emprende\\Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls');

['JUN 24 ', 'JUN 25', 'JUNIO 2026'].forEach(sheetName => {
  console.log('================================================================');
  console.log('=== SHEET:', sheetName, '===');
  console.log('================================================================');
  const sheet = wb.Sheets[sheetName];
  if (!sheet) { console.log('Not found'); return; }
  const range = xlsx.utils.decode_range(sheet['!ref']);
  console.log('Range:', sheet['!ref']);
  for (let R = 0; R <= Math.min(range.e.r, 60); R++) {
    let rowVals = [];
    for (let C = 0; C <= Math.min(range.e.c, 35); C++) {
      const cell = sheet[xlsx.utils.encode_cell({r: R, c: C})];
      if (cell && cell.v !== undefined && cell.v !== '') {
        const formula = cell.f ? ` [f: =${cell.f}]` : '';
        rowVals.push(`${xlsx.utils.encode_col(C)}: ${cell.v}${formula}`);
      }
    }
    if (rowVals.length > 0) {
      console.log(`R${R+1}: ${rowVals.join(' | ')}`);
    }
  }
});
