const xlsx = require('xlsx');

const filePath = 'c:\\Proyectos\\Emprende\\Datos Emprende\\Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls';
const wb = xlsx.readFile(filePath);

const sheets2024_2026 = [
  // 2024
  { sheet: 'ENE 24   ', anio: 2024, mes: 1 },
  { sheet: 'FEB 24', anio: 2024, mes: 2 },
  { sheet: 'MAR 24', anio: 2024, mes: 3 },
  { sheet: 'ABR 24 ', anio: 2024, mes: 4 },
  { sheet: 'MAY 24', anio: 2024, mes: 5 },
  { sheet: 'JUN 24 ', anio: 2024, mes: 6 },
  { sheet: 'JUL 24 ', anio: 2024, mes: 7 },
  { sheet: 'AGO 24', anio: 2024, mes: 8 },
  { sheet: 'SET 24 ', anio: 2024, mes: 9 },
  { sheet: 'OCT 24', anio: 2024, mes: 10 },
  { sheet: 'NOV 24', anio: 2024, mes: 11 },
  { sheet: 'DIC 24', anio: 2024, mes: 12 },

  // 2025
  { sheet: 'ENE 25', anio: 2025, mes: 1 },
  { sheet: 'FEB 25', anio: 2025, mes: 2 },
  { sheet: 'MAR 25', anio: 2025, mes: 3 },
  { sheet: 'ABR 25', anio: 2025, mes: 4 },
  { sheet: 'MAY 25', anio: 2025, mes: 5 },
  { sheet: 'JUN 25', anio: 2025, mes: 6 },
  { sheet: 'JUL 25', anio: 2025, mes: 7 },
  { sheet: 'AGOSTO 25', anio: 2025, mes: 8 },
  { sheet: 'SEPTIEMBR 25', anio: 2025, mes: 9 },
  { sheet: 'OCTUBRE 2025', anio: 2025, mes: 10 },
  { sheet: 'NOVIEMBRE 2025', anio: 2025, mes: 11 },
  { sheet: 'DICIEMBRE 2025', anio: 2025, mes: 12 },

  // 2026
  { sheet: 'ENERO 2026', anio: 2026, mes: 1 },
  { sheet: 'FEBRERO 2026', anio: 2026, mes: 2 },
  { sheet: 'MARZO 2026', anio: 2026, mes: 3 },
  { sheet: 'ABRIL 2026', anio: 2026, mes: 4 },
  { sheet: 'MAYO 2026', anio: 2026, mes: 5 },
  { sheet: 'JUNIO 2026', anio: 2026, mes: 6 },
  { sheet: 'JULIO 2026', anio: 2026, mes: 7 },
  { sheet: 'AGOSTO 2026', anio: 2026, mes: 8 },
  { sheet: 'SEPTIEMBRE 2026', anio: 2026, mes: 9 }
];

sheets2024_2026.forEach(item => {
  const ws = wb.Sheets[item.sheet];
  if (!ws) {
    console.log('NOT FOUND:', item.sheet);
    return;
  }
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
  let title = '';
  for (let r = 0; r < 4; r++) {
    const text = (rows[r] || []).join(' ');
    if (text.includes('INGRESOS') || text.includes('EGRESOS')) {
      title = text;
      break;
    }
  }

  // Also look at dates in col 10 (Egresos Día)
  let egresoFecha = '';
  for (let r = 5; r < rows.length; r++) {
    const val = (rows[r] || [])[10];
    if (val && typeof val === 'string' && (val.includes('/') || val.includes('.'))) {
      egresoFecha = val;
      break;
    }
  }

  console.log(`${item.anio}-${item.mes < 10 ? '0' + item.mes : item.mes} [${item.sheet}]: Title="${title.replace(/\s+/g, ' ').trim()}", EgresoFecha="${egresoFecha}"`);
});
