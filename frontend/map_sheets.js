import xlsx from 'xlsx';

const filePath = 'c:\\Proyectos\\Emprende\\Datos Emprende\\Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls';
const wb = xlsx.readFile(filePath);

const results = [];

wb.SheetNames.forEach(sheetName => {
  if (sheetName.includes('CALCULO PRESTAMOS')) return;

  // Determine year and month from sheet name or header
  const ws = wb.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
  if (rows.length < 10) return;

  let title = '';
  for (let r = 0; r < Math.min(5, rows.length); r++) {
    const row = rows[r] || [];
    const t = row.join(' ');
    if (t.includes('INGRESOS') || t.includes('EGRESOS')) {
      title = t;
      break;
    }
  }

  // Find totals
  let totIng = 0;
  let totEg = 0;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] || [];
    const rowStr = row.join(' ');
    if (rowStr.includes('TOTAL  DEL  MES') || rowStr.includes('TOTAL DEL MES') || rowStr.includes('TOTAL  DEL MES')) {
      // In row 4 header: col 8 is Total Ingresos, col 19 is Total Egresos
      // Or search for numbers
      const nums = row.filter(c => typeof c === 'number');
      if (nums.length >= 1) {
        // usually row[8] is total ingresos
        totIng = Number(row[8]) || (nums.length > 0 ? nums[nums.length - 1] : 0);
      }
    }
    if (rowStr.includes('Total de INGRESOS del mes') || rowStr.includes('TOTAL DE INGRESOS')) {
      const nums = row.filter(c => typeof c === 'number');
      if (nums.length > 0 && totIng === 0) totIng = nums[0];
    }
    if (rowStr.includes('TOTAL DE EGRESOS ACUMULADOS') || rowStr.includes('Egresos del mes')) {
      const nums = row.filter(c => typeof c === 'number');
      if (nums.length > 0) totEg = nums[nums.length - 1];
    }
  }

  results.push({
    sheet: sheetName,
    title: title.replace(/\s+/g, ' ').trim(),
    rows: rows.length,
    totIng,
    totEg
  });
});

console.log(JSON.stringify(results, null, 2));
