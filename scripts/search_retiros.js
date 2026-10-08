const xlsx = require('../frontend/node_modules/xlsx');
const wb = xlsx.readFile('C:\\Proyectos\\Emprende\\Datos Emprende\\Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls');

console.log('=== BUSCANDO TEXTOS DE RETIRO EN EXCEL ===');
wb.SheetNames.forEach(sheetName => {
  const sheet = wb.Sheets[sheetName];
  if (!sheet || !sheet['!ref']) return;
  const range = xlsx.utils.decode_range(sheet['!ref']);
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cell = sheet[xlsx.utils.encode_cell({r: R, c: C})];
      if (cell && cell.v !== undefined) {
        const text = String(cell.v).toUpperCase();
        if (text.includes('RETIRO') || text.includes('RETIRÓ') || text.includes('RETIRADA') || text.includes('BAJA') || text.includes('INACTIVO')) {
          // ignore headers like 'RETIROS AHORROS S/.' unless it has names or specific notes
          if (!text.includes('RETIROS AHORROS S/.') && !text.includes('RETIRO AHORROS') && !text.includes('RETIRO DE AHORROS')) {
            console.log(`[${sheetName}] R${R+1}C${xlsx.utils.encode_col(C)}: ${cell.v}`);
          }
        }
      }
    }
  }
});
