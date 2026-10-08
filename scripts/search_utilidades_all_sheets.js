const xlsx = require('../frontend/node_modules/xlsx');
const wb = xlsx.readFile('C:\\Proyectos\\Emprende\\Datos Emprende\\Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls');

wb.SheetNames.forEach(sheetName => {
  const sheet = wb.Sheets[sheetName];
  if (!sheet || !sheet['!ref']) return;
  const range = xlsx.utils.decode_range(sheet['!ref']);
  let matches = [];
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = sheet[xlsx.utils.encode_cell({r: R, c: C})];
      if (cell && cell.v !== undefined) {
        const text = String(cell.v).toUpperCase();
        if (text.includes('UTILIDAD') || text.includes('DIVIDENDO') || text.includes('DISTRIB') || text.includes('REPARTO') || text.includes('ACCIONES COMPRADAS')) {
          matches.push(`R${R+1}C${xlsx.utils.encode_col(C)}: ${cell.v} ${cell.f ? '[='+cell.f+']' : ''}`);
        }
      }
    }
  }
  if (matches.length > 0) {
    console.log(`=== Sheet: ${sheetName} ===`);
    matches.forEach(m => console.log('  ', m));
  }
});
