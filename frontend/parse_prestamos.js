const xlsx = require('xlsx');

const filePath = 'c:\\Proyectos\\Emprende\\Datos Emprende\\Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls';
const wb = xlsx.readFile(filePath);
const ws = wb.Sheets['CALCULO PRESTAMOS  (4)'];
const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });

console.log('Total rows:', rows.length);

// In CALCULO PRESTAMOS (4), blocks of loans appear side by side or vertically
// Each loan has: "SOCIO", "<Name>", "CUOTA", <n>, "MONTO", <amount>, "TASA", <rate>, and a table of installments
const prestamos = [];

for (let r = 0; r < rows.length; r++) {
  const row = rows[r] || [];
  for (let c = 0; c < row.length; c++) {
    const val = row[c];
    if (val && typeof val === 'string' && val.trim().toUpperCase() === 'SOCIO') {
      const socioName = row[c + 1];
      let cuotas = null;
      let monto = null;
      let tasa = null;

      // Look in this row and next 2 rows for CUOTA, MONTO, TASA
      for (let offset = 0; offset <= 3; offset++) {
        const subRow = rows[r + offset] || [];
        for (let sc = Math.max(0, c - 2); sc <= c + 15; sc++) {
          const sVal = subRow[sc];
          if (sVal && typeof sVal === 'string') {
            const st = sVal.trim().toUpperCase();
            if (st === 'CUOTA' || st === 'CUOTAS') {
              if (typeof subRow[sc + 1] === 'number') cuotas = subRow[sc + 1];
            }
            if (st === 'MONTO') {
              if (typeof subRow[sc + 1] === 'number') monto = subRow[sc + 1];
            }
            if (st === 'TASA') {
              if (typeof subRow[sc + 1] === 'number') tasa = subRow[sc + 1];
            }
          }
        }
      }

      if (socioName && (monto || cuotas)) {
        prestamos.push({
          row: r,
          col: c,
          socio: String(socioName).trim(),
          monto,
          cuotas,
          tasa
        });
      }
    }
  }
}

console.log('Found prestamos in CALCULO PRESTAMOS:', prestamos.length);
prestamos.forEach((p, idx) => {
  console.log(`${idx + 1}. [${p.socio}] Monto: ${p.monto}, Cuotas: ${p.cuotas}, Tasa: ${p.tasa} (at row ${p.row}, col ${p.col})`);
});
