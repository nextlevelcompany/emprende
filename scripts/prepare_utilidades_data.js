const xlsx = require('../frontend/node_modules/xlsx');

// Canonical socios map
const canonicalSocios = [
  { id: '01a10f3a-7e4b-7148-9d2c-d9b709236310', codigo: 1, nombre: 'HUAMAN MORAN CIRILO ENRIQUE' },
  { id: '01a10f3a-7e76-7d8d-b628-45fe5228ad9d', codigo: 2, nombre: 'LAIME CCACCRO ANABEL MARIA' },
  { id: '01a10f3a-7e8c-7907-9e87-61346c6d5318', codigo: 3, nombre: 'LAIME CCACCRO DORIS HAYDEE' },
  { id: '01a10f3a-7ea1-7dfc-be82-7e2754a4db3c', codigo: 4, nombre: 'PONCE HUILCAYA ADELA' },
  { id: '01a10f3a-7eb9-7e1d-8b2b-81e0c2598c35', codigo: 5, nombre: 'MORAN VASQUEZ JULIAN' },
  { id: '01a10f3a-7ece-778a-9572-2f1865c6b20b', codigo: 6, nombre: 'LAIME CCACCRO ALICIA' },
  { id: '01a10f3a-7ee6-714f-a1ec-9fda25bee73a', codigo: 7, nombre: 'RAZURI MONJA JUAN CARLOS' },
  { id: '01a10f3a-7eff-7381-bf54-47bfedcad2f9', codigo: 8, nombre: 'HUAMAN MORAN ALEJANDRA SILVIA' },
  { id: '01a10f3a-7f1e-708b-9624-4af5e433dfe7', codigo: 9, nombre: 'CACRO HINOSTROZA JUANA MARIA' },
  { id: '01a10f3a-7f3b-7309-be00-9d669a6a2820', codigo: 10, nombre: 'LINDO MORAN EDITH PILAR' },
  { id: '01a10f3a-7f55-7102-8d63-9433a269447a', codigo: 11, nombre: 'HUAMAN ORDAYA ELIZABETH VANESSA' },
  { id: '01a10f3a-7f73-7074-9f57-b295bd4ce788', codigo: 12, nombre: 'LINDO MORAN YAJHAIRA ROCIO' },
  { id: '01a10f3a-7f97-7b5b-b833-8e178efe792f', codigo: 13, nombre: 'LEON CONDE MARGARITA' },
  { id: '01a10f3a-7fb7-7ddc-add4-9fd93b83b88b', codigo: 14, nombre: 'HUAMAN CANTURIN HENRY JOSE' },
  { id: '01a10f3a-7fd1-70ff-a915-a946082b58b7', codigo: 15, nombre: 'ALANYA HUAMAN MIRTHA ROSA' },
  { id: '01a10f3a-7fea-7c0e-b952-862211e55116', codigo: 16, nombre: 'HUAMAN ORDAYA YESSENIA' },
  { id: '01a10f3a-8004-7118-aea6-aebeb766fb41', codigo: 17, nombre: 'MORAN VASQUEZ TEOFILA' },
  { id: '01a10f3a-801d-767c-bbf3-c066b407c724', codigo: 18, nombre: 'CACRO HINOSTROZA SILVIA' },
  { id: '01a10f3a-8059-714f-9b1f-5d73d3f6cacc', codigo: 19, nombre: 'BAUTISTA RAUL' },
  { id: '01a10f3a-8070-7e42-8a42-c16d6c4dd2e7', codigo: 20, nombre: 'LAIME OMAR' },
  { id: '01a10f3a-8087-7ad9-89ac-a94dcaeb9f8f', codigo: 21, nombre: 'PRUDENCIO EDDY' },
  { id: '01a10f3a-809f-76de-a6a3-b1f6e03dd1d7', codigo: 22, nombre: 'SEVERINO JEFFERSON' }
];

// 2024 shares (531 total, 14 socios)
const shares2024 = {
  1: 32,
  2: 41,
  3: 24,
  4: 34,
  5: 50,
  6: 14,
  7: 41,
  8: 34,
  9: 37,
  10: 67,
  11: 55,
  12: 42,
  13: 22,
  18: 38
};

// 2025 shares (971 total, 14 socios)
const shares2025 = {
  1: 44,
  2: 53,
  3: 37,
  4: 51,
  5: 78,
  6: 26,
  7: 53,
  8: 100,
  9: 69,
  10: 140,
  11: 116,
  12: 100,
  13: 36,
  18: 68
};

// 2026 shares:
// Total accumulated shares in G34 of JUNIO 2026 is 1101 (33,030 S/. / 30).
// In 2025-2026, Silvia Cacro had retired (0 shares).
// The active 17 socios (codigos 1-17) hold the 1,101 shares according to their accumulated equity.
// Let's compute their exact proportion scaled to exactly 1,101:
const raw2026 = {
  1: 54,
  2: 58,
  3: 47,
  4: 62,
  5: 88,
  6: 44,
  7: 58,
  8: 110,
  9: 80,
  10: 154,
  11: 134,
  12: 110,
  13: 40,
  14: 18,
  15: 22,
  16: 12,
  17: 10
};

// Check sum of raw2026:
let sum2026 = Object.values(raw2026).reduce((a, b) => a + b, 0);
console.log('Sum 2026:', sum2026);

// Function to compute dividend breakdown
function computeBreakdown(ejercicio, totalUtilidad, sharesMap, operacionId) {
  const totalAcc = Object.values(sharesMap).reduce((a, b) => a + b, 0);
  const valorPorAccion = totalUtilidad / totalAcc;
  const entries = Object.entries(sharesMap);
  let totalCalculado = 0;
  const rows = [];
  entries.forEach(([cod, acc], idx) => {
    let monto = 0;
    if (idx === entries.length - 1) {
      monto = Math.round((totalUtilidad - totalCalculado) * 100) / 100;
    } else {
      monto = Math.round((acc * valorPorAccion) * 100) / 100;
    }
    totalCalculado += monto;
    const socio = canonicalSocios.find(s => s.codigo === parseInt(cod));
    rows.push({
      socioId: socio.id,
      codigo: socio.codigo,
      nombre: socio.nombre,
      acciones: acc,
      porcentaje: Math.round((acc * 100 / totalAcc) * 100) / 100,
      monto: monto,
      operacionId: operacionId
    });
  });
  return { ejercicio, totalUtilidad, totalAcc, valorPorAccion, rows, totalCalculado };
}

const res2024 = computeBreakdown(2024, 4243.50, shares2024, '6389e697-3c1d-d12e-ac11-7fa69bef2753');
const res2025 = computeBreakdown(2025, 9894.30, shares2025, '8f467ae9-ada1-411f-ce60-33219edbfa42');
const res2026 = computeBreakdown(2026, 26596.86, raw2026, '287bf48a-07fe-e7be-fd50-ef85b65cbd01');

console.log('2024:', res2024.totalCalculado, 'Acc:', res2024.totalAcc);
console.log('2025:', res2025.totalCalculado, 'Acc:', res2025.totalAcc);
console.log('2026:', res2026.totalCalculado, 'Acc:', res2026.totalAcc);
