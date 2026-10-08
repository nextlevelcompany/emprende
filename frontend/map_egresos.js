const xlsx = require('xlsx');

const filePath = 'c:\\Proyectos\\Emprende\\Datos Emprende\\Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls';
const wb = xlsx.readFile(filePath);

const monthlySheets = [
  'ENE 24   ', 'FEB 24', 'MAR 24', 'ABR 24 ', 'MAY 24', 'JUN 24 ',
  'JUL 24 ', 'AGO 24', 'SET 24 ', 'OCT 24', 'NOV 24', 'DIC 24',
  'ENE 25', 'FEB 25', 'MAR 25', 'ABR 25', 'MAY 25', 'JUN 25',
  'JUL 25', 'AGOSTO 25', 'SEPTIEMBR 25', 'OCTUBRE 2025', 'NOVIEMBRE 2025', 'DICIEMBRE 2025',
  'ENERO 2026', 'FEBRERO 2026', 'MARZO 2026', 'ABRIL 2026', 'MAYO 2026', 'JUNIO 2026',
  'JULIO 2026', 'AGOSTO 2026', 'SEPTIEMBRE 2026'
];

monthlySheets.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  if (!ws) return;
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });
  let headerRow = -1;
  for (let r = 0; r < Math.min(8, rows.length); r++) {
    const text = (rows[r] || []).join(' ');
    if (text.includes('Nombre del Socio')) {
      headerRow = r;
      break;
    }
  }

  if (headerRow === -1) return;

  const egresos = [];
  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    // Right side: col 10 is Día/Fecha, col 11 is Nombre del Socio, col 12 is Retiros Ahorros, col 13 is Préstamos, col 14 is Interes Pagado, col 15 is Gasts Admin, col 16 is Utilidad Distrib, col 17 is Otros, col 18 is Red, col 19 is Total Egresos
    const egresoNombre = row[11];
    const egresoFecha = row[10];
    const retirosAhorros = Number(row[12]) || 0;
    const prestamo = Number(row[13]) || 0;
    const interesPagado = Number(row[14]) || 0;
    const gastosAdmin = Number(row[15]) || 0;
    const utilidadDistrib = Number(row[16]) || 0;
    const otros = Number(row[17]) || 0;
    const red = Number(row[18]) || 0;
    const totalEgresos = Number(row[19]) || 0;

    if (
      egresoNombre &&
      typeof egresoNombre === 'string' &&
      egresoNombre.trim().length > 2 &&
      !egresoNombre.toUpperCase().includes('TOTAL') &&
      !egresoNombre.toUpperCase().includes('ACUMULADO') &&
      !egresoNombre.toUpperCase().includes('SALDO')
    ) {
      egresos.push({
        fecha: egresoFecha,
        nombre: egresoNombre.trim(),
        prestamo,
        gastosAdmin,
        utilidadDistrib,
        retirosAhorros,
        otros,
        red,
        totalEgresos
      });
    }
  }

  console.log(`Sheet [${sheetName}]: ${egresos.length} egresos:`, egresos);
});
