import xlsx from 'xlsx';

const filePath = 'c:\\Proyectos\\Emprende\\Datos Emprende\\Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls';
const wb = xlsx.readFile(filePath);

const monthlySheets = [
  // 2024
  'ENE 24   ', 'FEB 24', 'MAR 24', 'ABR 24 ', 'MAY 24', 'JUN 24 ',
  'JUL 24 ', 'AGO 24', 'SET 24 ', 'OCT 24', 'NOV 24', 'DIC 24',
  // 2025
  'ENE 25', 'FEB 25', 'MAR 25', 'ABR 25', 'MAY 25', 'JUN 25',
  'JUL 25', 'AGOSTO 25', 'SEPTIEMBR 25', 'OCTUBRE 2025', 'NOVIEMBRE 2025', 'DICIEMBRE 2025',
  // 2026
  'ENERO 2026', 'FEBRERO 2026', 'MARZO 2026', 'ABRIL 2026', 'MAYO 2026', 'JUNIO 2026',
  'JULIO 2026', 'AGOSTO 2026', 'SEPTIEMBRE 2026'
];

const sociosMap = new Map();

monthlySheets.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  if (!ws) {
    console.log('MISSING SHEET:', sheetName);
    return;
  }
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
  let headerRow = -1;
  for (let r = 0; r < Math.min(8, rows.length); r++) {
    const text = (rows[r] || []).join(' ');
    if (text.includes('Nombre del Socio')) {
      headerRow = r;
      break;
    }
  }

  if (headerRow === -1) {
    console.log('No header in:', sheetName);
    return;
  }

  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const name = row[1];
    if (name && typeof name === 'string') {
      const cleanName = name.replace(/\s+/g, ' ').trim().toUpperCase();
      if (
        cleanName.length > 3 &&
        !cleanName.includes('TOTAL') &&
        !cleanName.includes('SALDO') &&
        !cleanName.includes('ACUMULADO') &&
        !cleanName.includes('FALTANTE')
      ) {
        if (!sociosMap.has(cleanName)) {
          sociosMap.set(cleanName, { firstSeen: sheetName, count: 0 });
        }
        sociosMap.get(cleanName).count++;
      }
    }
  }
});

console.log('Total distinct socios found:', sociosMap.size);
const sortedSocios = Array.from(sociosMap.entries()).sort((a, b) => b[1].count - a[1].count);
sortedSocios.forEach(([name, info], idx) => {
  console.log(`${idx + 1}. [${name}] (first seen: ${info.firstSeen}, appearances: ${info.count})`);
});
