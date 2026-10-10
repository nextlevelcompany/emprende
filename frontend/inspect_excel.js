import xlsx from 'xlsx';

const filePath = 'c:\\Proyectos\\Emprende\\Datos Emprende\\Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls';
const wb = xlsx.readFile(filePath);

console.log('=== WORKBOOK ANALYSIS ===');
console.log('Total Sheets:', wb.SheetNames.length);


const targetSheets = wb.SheetNames.filter(name => {
  const n = name.trim().toUpperCase();
  return (
    n.includes('24') ||
    n.includes('25') ||
    n.includes('26') ||
    n.includes('PRESTAMO')
  );
});

console.log('Target sheets found:', targetSheets);

targetSheets.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
  
  // Find header row (usually contains 'Nombre del Socio' or 'Ingresos')
  let headerRowIdx = -1;
  let dateTitle = '';
  for (let r = 0; r < Math.min(10, data.length); r++) {
    const row = data[r] || [];
    const text = row.map(c => String(c || '')).join(' ');
    if (text.includes('INGRESOS') || text.includes('EGRESOS')) {
      dateTitle = text;
    }
    if (text.includes('Nombre del Socio') || text.includes('Socio')) {
      headerRowIdx = r;
    }
  }

  // Count socio rows (rows after header that have a name)
  let socioRows = 0;
  let sampleRow = null;
  if (headerRowIdx >= 0) {
    for (let r = headerRowIdx + 1; r < data.length; r++) {
      const row = data[r] || [];
      const colName = row[1];
      if (colName && typeof colName === 'string' && colName.trim().length > 3 && !colName.includes('TOTAL') && !colName.includes('Saldo')) {
        socioRows++;
        if (!sampleRow) sampleRow = { name: colName.trim(), row: row.slice(0, 10) };
      }
    }
  }

  console.log(`Sheet [${sheetName}]: rows=${data.length}, headerRow=${headerRowIdx}, socios=${socioRows}, dateTitle="${dateTitle.slice(0, 50)}"`);
});
