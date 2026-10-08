const path = require('path');
const fs = require('fs');
const xlsx = require(path.resolve(__dirname, '../frontend/node_modules/xlsx'));

const filePath = 'Datos Emprende/Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls';
const mapping = JSON.parse(fs.readFileSync('scratch/exact_receipt_mapping.json', 'utf-8'));

console.log(`Cargando Excel: ${filePath}`);
const wb = xlsx.readFile(filePath, { cellFormula: true, cellStyles: true });

let updatedCount = 0;
let clearedCount = 0;

for (const item of mapping) {
  const ws = wb.Sheets[item.sheet];
  if (!ws) {
    console.error(`Hoja no encontrada: ${item.sheet}`);
    continue;
  }

  if (item.recibo !== null) {
    ws[item.cell] = { t: 'n', v: item.recibo, w: String(item.recibo) };
    updatedCount++;
  } else {
    delete ws[item.cell];
    clearedCount++;
  }
}

xlsx.writeFile(wb, filePath, { bookType: 'biff8' });
console.log(`Excel actualizado exitosamente. Recibos asignados: ${updatedCount}, celdas limpiadas: ${clearedCount}`);
