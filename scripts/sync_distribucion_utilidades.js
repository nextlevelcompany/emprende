const fs = require('fs');
const { execSync } = require('child_process');

const CAJA_ID = 'a0000000-0000-0000-0000-000000000001';
const ADMIN_USER_ID = '01a10e7a-0c97-7e1f-aca6-64803b2c03c4';

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

// 1. DATA 2024
const dist2024 = {
  id: 'c0000000-0000-0000-0000-000000002024',
  ejercicio: 2024,
  fechaCorte: '2024-06-08',
  utilidadTotal: 4243.50,
  operacionId: '6389e697-3c1d-d12e-ac11-7fa69bef2753',
  detalles: [
    { codigo: 1, acciones: 32 },
    { codigo: 2, acciones: 41 },
    { codigo: 3, acciones: 24 },
    { codigo: 4, acciones: 34 },
    { codigo: 5, acciones: 50 },
    { codigo: 6, acciones: 14 },
    { codigo: 7, acciones: 41 },
    { codigo: 8, acciones: 34 },
    { codigo: 9, acciones: 37 },
    { codigo: 10, acciones: 67 },
    { codigo: 11, acciones: 55 },
    { codigo: 12, acciones: 42 },
    { codigo: 13, acciones: 22 },
    { codigo: 18, acciones: 38 }
  ]
};

// 2. DATA 2025 (Con desglose de reinversión en acciones de junio 2025)
const dist2025 = {
  id: 'c0000000-0000-0000-0000-000000002025',
  ejercicio: 2025,
  fechaCorte: '2025-06-08',
  utilidadTotal: 9894.30,
  operacionId: '8f467ae9-ada1-411f-ce60-33219edbfa42',
  detalles: [
    { codigo: 1, acciones: 44, reinvertido: 0, accCompradas: 0 },
    { codigo: 2, acciones: 53, reinvertido: 0, accCompradas: 0 },
    { codigo: 3, acciones: 37, reinvertido: 0, accCompradas: 0 },
    { codigo: 4, acciones: 51, reinvertido: 180, accCompradas: 6 },
    { codigo: 5, acciones: 78, reinvertido: 750, accCompradas: 25 },
    { codigo: 6, acciones: 26, reinvertido: 240, accCompradas: 8 },
    { codigo: 7, acciones: 53, reinvertido: 0, accCompradas: 0 },
    { codigo: 8, acciones: 100, reinvertido: 0, accCompradas: 0 },
    { codigo: 9, acciones: 69, reinvertido: 690, accCompradas: 23 },
    { codigo: 10, acciones: 140, reinvertido: 1380, accCompradas: 46 },
    { codigo: 11, acciones: 116, reinvertido: 1140, accCompradas: 38 },
    { codigo: 12, acciones: 100, reinvertido: 840, accCompradas: 28 },
    { codigo: 13, acciones: 36, reinvertido: 150, accCompradas: 5 },
    { codigo: 18, acciones: 68, reinvertido: 0, accCompradas: 0 }
  ]
};

// 3. DATA 2026
const dist2026 = {
  id: 'c0000000-0000-0000-0000-000000002026',
  ejercicio: 2026,
  fechaCorte: '2026-06-08',
  utilidadTotal: 26596.86,
  operacionId: '287bf48a-07fe-e7be-fd50-ef85b65cbd01',
  detalles: [
    { codigo: 1, acciones: 54 },
    { codigo: 2, acciones: 58 },
    { codigo: 3, acciones: 47 },
    { codigo: 4, acciones: 62 },
    { codigo: 5, acciones: 88 },
    { codigo: 6, acciones: 44 },
    { codigo: 7, acciones: 58 },
    { codigo: 8, acciones: 110 },
    { codigo: 9, acciones: 80 },
    { codigo: 10, acciones: 154 },
    { codigo: 11, acciones: 134 },
    { codigo: 12, acciones: 110 },
    { codigo: 13, acciones: 40 },
    { codigo: 14, acciones: 18 },
    { codigo: 15, acciones: 22 },
    { codigo: 16, acciones: 12 },
    { codigo: 17, acciones: 10 }
  ]
};

function generateSqlForDist(dist) {
  const totalAcc = dist.detalles.reduce((a, b) => a + b.acciones, 0);
  const valorPorAccion = dist.utilidadTotal / totalAcc;
  let lines = [];

  lines.push(`-- Ejercicio ${dist.ejercicio}`);
  lines.push(`INSERT INTO distribucion_utilidad (`);
  lines.push(`  id, caja_id, ejercicio, fecha_corte, utilidad_total, total_acciones, estado, aprobado_por, aprobado_at, created_at, updated_at`);
  lines.push(`) VALUES (`);
  lines.push(`  '${dist.id}', '${CAJA_ID}', ${dist.ejercicio}, '${dist.fechaCorte}', ${dist.utilidadTotal}, ${totalAcc}, 'PAGADA', '${ADMIN_USER_ID}', '${dist.fechaCorte} 19:00:00+00', '${dist.fechaCorte} 19:00:00+00', '${dist.fechaCorte} 19:00:00+00'`);
  lines.push(`) ON CONFLICT (caja_id, ejercicio) DO UPDATE SET`);
  lines.push(`  fecha_corte = EXCLUDED.fecha_corte, utilidad_total = EXCLUDED.utilidad_total, total_acciones = EXCLUDED.total_acciones, estado = EXCLUDED.estado, updated_at = NOW();`);

  let sumaMontos = 0;
  dist.detalles.forEach((det, idx) => {
    let monto = 0;
    if (idx === dist.detalles.length - 1) {
      monto = Math.round((dist.utilidadTotal - sumaMontos) * 100) / 100;
    } else {
      monto = Math.round((det.acciones * valorPorAccion) * 100) / 100;
    }
    sumaMontos += monto;

    const socio = canonicalSocios.find(s => s.codigo === det.codigo);
    const reinv = det.reinvertido || 0;
    const accComp = det.accCompradas || 0;
    const cobrado = Math.max(0, Math.round((monto - reinv) * 100) / 100);
    const modalidad = reinv > 0 ? (cobrado > 0 ? 'MIXTO' : 'REINVERSION') : 'EFECTIVO';

    lines.push(`INSERT INTO distribucion_utilidad_detalle (`);
    lines.push(`  distribucion_id, socio_id, acciones, monto, monto_cobrado, monto_reinvertido, acciones_compradas, modalidad, operacion_id`);
    lines.push(`) VALUES (`);
    lines.push(`  '${dist.id}', '${socio.id}', ${det.acciones}, ${monto}, ${cobrado}, ${reinv}, ${accComp}, '${modalidad}', '${dist.operacionId}'`);
    lines.push(`) ON CONFLICT (distribucion_id, socio_id) DO UPDATE SET`);
    lines.push(`  acciones = EXCLUDED.acciones, monto = EXCLUDED.monto, monto_cobrado = EXCLUDED.monto_cobrado, monto_reinvertido = EXCLUDED.monto_reinvertido, acciones_compradas = EXCLUDED.acciones_compradas, modalidad = EXCLUDED.modalidad, operacion_id = EXCLUDED.operacion_id;`);
  });

  return lines.join('\n');
}

const fullSql = [
  'BEGIN;',
  'DELETE FROM distribucion_utilidad_detalle;',
  'DELETE FROM distribucion_utilidad;',
  generateSqlForDist(dist2024),
  generateSqlForDist(dist2025),
  generateSqlForDist(dist2026),
  'COMMIT;'
].join('\n\n');

fs.writeFileSync('C:\\Proyectos\\Emprende\\scripts\\sync_utilidades.sql', fullSql);
console.log('SQL generado en scripts/sync_utilidades.sql');
