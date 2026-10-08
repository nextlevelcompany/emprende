const path = require('path');
const xlsx = require(path.resolve(__dirname, '../frontend/node_modules/xlsx'));

const srcPath = 'Datos Emprende/Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls';
const dstPath = 'scratch/test_copy.xls';

const wb = xlsx.readFile(srcPath, { cellFormula: true, cellStyles: true });
console.log('Sheets count:', wb.SheetNames.length);

const ws = wb.Sheets['JUNIO 2026'];
ws['A7'] = { t: 'n', v: 523, w: '523' };

xlsx.writeFile(wb, dstPath, { bookType: 'biff8' });
console.log('Saved to', dstPath);
