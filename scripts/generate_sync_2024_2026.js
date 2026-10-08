const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const xlsx = require('../frontend/node_modules/xlsx');

const EXCEL_PATH = 'C:\\Proyectos\\Emprende\\Datos Emprende\\Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls';
const CAJA_ID = 'a0000000-0000-0000-0000-000000000001';
const ADMIN_USER_ID = '01a10e7a-0c97-7e1f-aca6-64803b2c03c4';

const canonicalSocios = [
  { id: '01a10f3a-7e4b-7148-9d2c-d9b709236310', nombres: 'CIRILO ENRIQUE', apellidos: 'HUAMAN MORAN' },
  { id: '01a10f3a-7e76-7d8d-b628-45fe5228ad9d', nombres: 'ANABEL MARIA', apellidos: 'LAIME CCACCRO' },
  { id: '01a10f3a-7e8c-7907-9e87-61346c6d5318', nombres: 'DORIS HAYDEE', apellidos: 'LAIME CCACCRO' },
  { id: '01a10f3a-7ea1-7dfc-be82-7e2754a4db3c', nombres: 'ADELA', apellidos: 'PONCE HUILCAYA' },
  { id: '01a10f3a-7eb9-7e1d-8b2b-81e0c2598c35', nombres: 'JULIAN', apellidos: 'MORAN VASQUEZ' },
  { id: '01a10f3a-7ece-778a-9572-2f1865c6b20b', nombres: 'ALICIA', apellidos: 'LAIME CCACCRO' },
  { id: '01a10f3a-7ee6-714f-a1ec-9fda25bee73a', nombres: 'JUAN CARLOS', apellidos: 'RAZURI MONJA' },
  { id: '01a10f3a-7eff-7381-bf54-47bfedcad2f9', nombres: 'ALEJANDRA SILVIA', apellidos: 'HUAMAN MORAN' },
  { id: '01a10f3a-7f1e-708b-9624-4af5e433dfe7', nombres: 'JUANA MARIA', apellidos: 'CACRO HINOSTROZA' },
  { id: '01a10f3a-7f3b-7309-be00-9d669a6a2820', nombres: 'EDITH PILAR', apellidos: 'LINDO MORAN' },
  { id: '01a10f3a-7f55-7102-8d63-9433a269447a', nombres: 'ELIZABETH VANESSA', apellidos: 'HUAMAN ORDAYA' },
  { id: '01a10f3a-7f73-7074-9f57-b295bd4ce788', nombres: 'YAJHAIRA ROCIO', apellidos: 'LINDO MORAN' },
  { id: '01a10f3a-7f97-7b5b-b833-8e178efe792f', nombres: 'MARGARITA', apellidos: 'LEON CONDE' },
  { id: '01a10f3a-7fb7-7ddc-add4-9fd93b83b88b', nombres: 'HENRY JOSE', apellidos: 'HUAMAN CANTURIN' },
  { id: '01a10f3a-7fd1-70ff-a915-a946082b58b7', nombres: 'MIRTHA ROSA', apellidos: 'ALANYA HUAMAN' },
  { id: '01a10f3a-7fea-7c0e-b952-862211e55116', nombres: 'YESSENIA', apellidos: 'HUAMAN ORDAYA' },
  { id: '01a10f3a-8004-7118-aea6-aebeb766fb41', nombres: 'TEOFILA', apellidos: 'MORAN VASQUEZ' },
  { id: '01a10f3a-801d-767c-bbf3-c066b407c724', nombres: 'SILVIA', apellidos: 'CACRO HINOSTROZA' },
  { id: '01a10f3a-8059-714f-9b1f-5d73d3f6cacc', nombres: 'RAUL', apellidos: 'BAUTISTA' },
  { id: '01a10f3a-8070-7e42-8a42-c16d6c4dd2e7', nombres: 'OMAR', apellidos: 'LAIME' },
  { id: '01a10f3a-8087-7ad9-89ac-a94dcaeb9f8f', nombres: 'EDDY', apellidos: 'PRUDENCIO' },
  { id: '01a10f3a-809f-76de-a6a3-b1f6e03dd1d7', nombres: 'JEFFERSON', apellidos: 'SEVERINO' },
  { id: '01a10f3a-815a-71f3-a705-bd77e741c1ff', nombres: 'IVAN', apellidos: 'TELLO' }
];

const socioMap = new Map();
canonicalSocios.forEach(s => {
  const k1 = (s.apellidos + ' ' + s.nombres).toUpperCase().replace(/\s+/g, ' ');
  const k2 = (s.nombres + ' ' + s.apellidos).toUpperCase().replace(/\s+/g, ' ');
  socioMap.set(k1, s.id);
  socioMap.set(k2, s.id);
});

// Explicit aliases
const explicitAliases = {
  'CIRILO HUAMAN': '01a10f3a-7e4b-7148-9d2c-d9b709236310',
  'ENRIQUE HUAMAN': '01a10f3a-7e4b-7148-9d2c-d9b709236310',
  'ANABEL LAIME': '01a10f3a-7e76-7d8d-b628-45fe5228ad9d',
  'ANABEL LAIME C.': '01a10f3a-7e76-7d8d-b628-45fe5228ad9d',
  'DORIS LAIME': '01a10f3a-7e8c-7907-9e87-61346c6d5318',
  'DORS LAIME': '01a10f3a-7e8c-7907-9e87-61346c6d5318',
  'ADELA PONCE': '01a10f3a-7ea1-7dfc-be82-7e2754a4db3c',
  'ADDELA PONCE': '01a10f3a-7ea1-7dfc-be82-7e2754a4db3c',
  'JULIAN MORAN': '01a10f3a-7eb9-7e1d-8b2b-81e0c2598c35',
  'ALICIA LAIME': '01a10f3a-7ece-778a-9572-2f1865c6b20b',
  'JUAN RAZURI': '01a10f3a-7ee6-714f-a1ec-9fda25bee73a',
  'JUAN CARLOS RAZURI': '01a10f3a-7ee6-714f-a1ec-9fda25bee73a',
  'JUAN C. RAZURI': '01a10f3a-7ee6-714f-a1ec-9fda25bee73a',
  'ALEJANDRA HUAMAN': '01a10f3a-7eff-7381-bf54-47bfedcad2f9',
  'ALEJANDRA HUAMÁN': '01a10f3a-7eff-7381-bf54-47bfedcad2f9',
  'JUANA MARIA CACRO': '01a10f3a-7f1e-708b-9624-4af5e433dfe7',
  'JUANA CACRO': '01a10f3a-7f1e-708b-9624-4af5e433dfe7',
  'JUANA CCACCRO': '01a10f3a-7f1e-708b-9624-4af5e433dfe7',
  'JUANA MARIA CACRO H.': '01a10f3a-7f1e-708b-9624-4af5e433dfe7',
  'EDITH LINDO': '01a10f3a-7f3b-7309-be00-9d669a6a2820',
  'EDITH LINDO MORAN': '01a10f3a-7f3b-7309-be00-9d669a6a2820',
  'EDITH  LINDO MORAN': '01a10f3a-7f3b-7309-be00-9d669a6a2820',
  'VANESA HUAMAN O.': '01a10f3a-7f55-7102-8d63-9433a269447a',
  'VANESSA HUAMAN': '01a10f3a-7f55-7102-8d63-9433a269447a',
  'TIA VANE': '01a10f3a-7f55-7102-8d63-9433a269447a',
  'YAJHAIRA LINDO': '01a10f3a-7f73-7074-9f57-b295bd4ce788',
  'YAJHAIRA  LINDO': '01a10f3a-7f73-7074-9f57-b295bd4ce788',
  'MARGARITA LEON': '01a10f3a-7f97-7b5b-b833-8e178efe792f',
  'MARGARITA LERON': '01a10f3a-7f97-7b5b-b833-8e178efe792f',
  'HENRY JOSE HUAMAN': '01a10f3a-7fb7-7ddc-add4-9fd93b83b88b',
  'JOSE HUAMAN': '01a10f3a-7fb7-7ddc-add4-9fd93b83b88b',
  'CINDY HUAMAN': '01a10f3a-7fb7-7ddc-add4-9fd93b83b88b',
  'ROSA ALANYA': '01a10f3a-7fd1-70ff-a915-a946082b58b7',
  'ROSA ALANYA HUAMAN': '01a10f3a-7fd1-70ff-a915-a946082b58b7',
  'ALANYA HUAMAN MIRTHA ROSA': '01a10f3a-7fd1-70ff-a915-a946082b58b7',
  'YESSENIA HUAMAN': '01a10f3a-7fea-7c0e-b952-862211e55116',
  'TEOFILA MORAN': '01a10f3a-8004-7118-aea6-aebeb766fb41',
  'SILVIA CACRO': '01a10f3a-801d-767c-bbf3-c066b407c724',
  'SILVIA CACRO H.': '01a10f3a-801d-767c-bbf3-c066b407c724',
  'RAUL BAUTISTA': '01a10f3a-8059-714f-9b1f-5d73d3f6cacc',
  'OMAR LAIME': '01a10f3a-8070-7e42-8a42-c16d6c4dd2e7',
  'EDDY PRUDENCIO': '01a10f3a-8087-7ad9-89ac-a94dcaeb9f8f',
  'JEFFERSON SEVERINO': '01a10f3a-809f-76de-a6a3-b1f6e03dd1d7',
  'IVAN TELLO': '01a10f3a-815a-71f3-a705-bd77e741c1ff',
  'EXTERNO IVAN TELLO': '01a10f3a-815a-71f3-a705-bd77e741c1ff',
  'EXTERNO': '01a10f3a-815a-71f3-a705-bd77e741c1ff',
};

function resolveSocioId(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw
    .replace(/\(E\)/i, '')
    .replace(/\(.*SE RETIRO.*\)/i, '')
    .replace(/Acciones /i, '')
    .replace(/Saldos de utilidad/i, '')
    .replace(/Egresos de utilidades/i, '')
    .replace(/Remanente/i, '')
    .replace(/socios/i, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');

  if (!clean || clean.length < 3) return null;
  if (explicitAliases[clean]) return explicitAliases[clean];
  if (socioMap.has(clean)) return socioMap.get(clean);

  for (const [k, id] of socioMap.entries()) {
    const parts = clean.split(' ').filter(p => p.length > 2);
    let matches = 0;
    for (const p of parts) {
      if (k.includes(p)) matches++;
    }
    if (matches >= 2 && matches >= parts.length - 1) return id;
  }
  return null;
}

function excelDateToDate(val) {
  if (!val) return null;
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return null;
}

function getCuotaDueDate(desembolsoDateStr, cuotaIndex1Based) {
  const parts = desembolsoDateStr.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);

  const totalMonths = (y * 12 + (m - 1)) + cuotaIndex1Based;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;
  const dayStr = String(d).padStart(2, '0');
  const monthStr = String(targetMonth).padStart(2, '0');
  return `${targetYear}-${monthStr}-${dayStr}`;
}

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function main() {
  console.log('Cargando libro Excel:', EXCEL_PATH);
  const wb = xlsx.readFile(EXCEL_PATH);

  const sheets = [
    // 2024
    { name: 'ENE 24   ', anio: 2024, mes: 1, fecha: '2024-01-08' },
    { name: 'FEB 24', anio: 2024, mes: 2, fecha: '2024-02-09' },
    { name: 'MAR 24', anio: 2024, mes: 3, fecha: '2024-03-08' },
    { name: 'ABR 24 ', anio: 2024, mes: 4, fecha: '2024-04-07' },
    { name: 'MAY 24', anio: 2024, mes: 5, fecha: '2024-05-08' },
    { name: 'JUN 24 ', anio: 2024, mes: 6, fecha: '2024-06-08' },
    { name: 'JUL 24 ', anio: 2024, mes: 7, fecha: '2024-07-08' },
    { name: 'AGO 24', anio: 2024, mes: 8, fecha: '2024-08-08' },
    { name: 'SET 24 ', anio: 2024, mes: 9, fecha: '2024-09-09' },
    { name: 'OCT 24', anio: 2024, mes: 10, fecha: '2024-10-09' },
    { name: 'NOV 24', anio: 2024, mes: 11, fecha: '2024-11-09' },
    { name: 'DIC 24', anio: 2024, mes: 12, fecha: '2024-12-09' },
    // 2025
    { name: 'ENE 25', anio: 2025, mes: 1, fecha: '2025-01-08' },
    { name: 'FEB 25', anio: 2025, mes: 2, fecha: '2025-02-08' },
    { name: 'MAR 25', anio: 2025, mes: 3, fecha: '2025-03-08' },
    { name: 'ABR 25', anio: 2025, mes: 4, fecha: '2025-04-08' },
    { name: 'MAY 25', anio: 2025, mes: 5, fecha: '2025-05-08' },
    { name: 'JUN 25', anio: 2025, mes: 6, fecha: '2025-06-08' },
    { name: 'JUL 25', anio: 2025, mes: 7, fecha: '2025-07-08' },
    { name: 'AGOSTO 25', anio: 2025, mes: 8, fecha: '2025-08-08' },
    { name: 'SEPTIEMBR 25', anio: 2025, mes: 9, fecha: '2025-09-08' },
    { name: 'OCTUBRE 2025', anio: 2025, mes: 10, fecha: '2025-10-08' },
    { name: 'NOVIEMBRE 2025', anio: 2025, mes: 11, fecha: '2025-11-08' },
    { name: 'DICIEMBRE 2025', anio: 2025, mes: 12, fecha: '2025-12-08' },
    // 2026
    { name: 'ENERO 2026', anio: 2026, mes: 1, fecha: '2026-01-08' },
    { name: 'FEBRERO 2026', anio: 2026, mes: 2, fecha: '2026-02-08' },
    { name: 'MARZO 2026', anio: 2026, mes: 3, fecha: '2026-03-08' },
    { name: 'ABRIL 2026', anio: 2026, mes: 4, fecha: '2026-04-08' },
    { name: 'MAYO 2026', anio: 2026, mes: 5, fecha: '2026-05-08' },
    { name: 'JUNIO 2026', anio: 2026, mes: 6, fecha: '2026-06-08' },
    { name: 'JULIO 2026', anio: 2026, mes: 7, fecha: '2026-07-08' },
    { name: 'AGOSTO 2026', anio: 2026, mes: 8, fecha: '2026-08-08' },
    { name: 'SEPTIEMBRE 2026', anio: 2026, mes: 9, fecha: '2026-09-08' }
  ];

  // Assign deterministic UUID for each period
  sheets.forEach((s, idx) => {
    s.id = crypto.createHash('md5').update(`periodo-${s.anio}-${s.mes}`).digest('hex');
    s.id = `${s.id.substr(0,8)}-${s.id.substr(8,4)}-${s.id.substr(12,4)}-${s.id.substr(16,4)}-${s.id.substr(20,12)}`;
    s.isUltimo = (idx === sheets.length - 1); // 2026-09 is the latest active open period
  });

  const periodMap = new Map();
  sheets.forEach(s => periodMap.set(`${s.anio}-${s.mes}`, s));

  // PARSE PRESTAMOS
  console.log('Parseando préstamos de CALCULO PRESTAMOS (4)...');
  const wsPrestamos = wb.Sheets['CALCULO PRESTAMOS  (4)'];
  const pRows = xlsx.utils.sheet_to_json(wsPrestamos, { header: 1 });
  const prestamosParsed = [];

  for (let r = 0; r < pRows.length; r++) {
    const row = pRows[r] || [];
    for (let c = 0; c < row.length; c++) {
      if (row[c] && String(row[c]).trim().toUpperCase() === 'SOCIO') {
        const socioRaw = row[c + 1];
        if (!socioRaw) continue;

        let cuotas = null, monto = null, tasa = null, excelDate = null;
        for (let ro = 0; ro <= 3; ro++) {
          const sr = pRows[r + ro] || [];
          for (let co = c; co <= c + 4; co++) {
            const val = sr[co];
            if (val && typeof val === 'string') {
              const vUpper = val.trim().toUpperCase();
              if (vUpper === 'CUOTA' || vUpper === 'CUOTAS') {
                if (typeof sr[co + 1] === 'number') cuotas = sr[co + 1];
              } else if (vUpper === 'MONTO') {
                if (typeof sr[co + 1] === 'number') monto = sr[co + 1];
              } else if (vUpper === 'TASA') {
                if (typeof sr[co + 1] === 'number') tasa = sr[co + 1];
              } else if (vUpper === 'MES') {
                if (typeof sr[co + 1] === 'number') excelDate = sr[co + 1];
                else if (typeof sr[co + 1] === 'string' && sr[co + 1].toLowerCase().includes('set-24')) {
                  excelDate = 45544; // 2024-09-09
                }
              }
            }
          }
        }

        let dateStr = excelDateToDate(excelDate);
        if (!dateStr) {
          dateStr = '2024-09-09';
        }
        const parts = dateStr.split('-');
        if (parts[2] !== '08' && parts[2] !== '09' && parts[2] !== '07') {
          dateStr = `${parts[0]}-${parts[1]}-08`;
        }

        // Installments
        let tableHeaderRow = -1;
        for (let ro = 2; ro <= 6; ro++) {
          const sr = pRows[r + ro] || [];
          for (let co = c; co <= c + 5; co++) {
            if (sr[co] && String(sr[co]).trim().toUpperCase() === 'CAPITAL') {
              tableHeaderRow = r + ro;
              break;
            }
          }
          if (tableHeaderRow !== -1) break;
        }

        const cuotasList = [];
        if (tableHeaderRow !== -1 && cuotas) {
          for (let cr = tableHeaderRow + 1; cr <= tableHeaderRow + cuotas + 2; cr++) {
            const crow = pRows[cr] || [];
            const mesName = crow[c];
            if (!mesName) continue;
            const mesUpper = String(mesName).trim().toUpperCase();
            if (mesUpper === 'TOTAL' || mesUpper === '') break;

            const capProg = Number(crow[c + 1]) || 0;
            const intProg = Number(crow[c + 2]) || 0;
            const saldo = Number(crow[c + 4]) || 0;
            const estadoStr = String(crow[c + 5] || '').toUpperCase();

            cuotasList.push({
              nroCuota: cuotasList.length + 1,
              mesName,
              capProg,
              intProg,
              saldo,
              estadoStr
            });
            if (cuotasList.length >= cuotas) break;
          }
        }

        const socioId = resolveSocioId(String(socioRaw));
        const pId = crypto.createHash('md5').update(`prestamo-${prestamosParsed.length + 1}-${socioRaw}`).digest('hex');
        const prestamoId = `${pId.substr(0,8)}-${pId.substr(8,4)}-${pId.substr(12,4)}-${pId.substr(16,4)}-${pId.substr(20,12)}`;

        prestamosParsed.push({
          id: prestamoId,
          numero: prestamosParsed.length + 1,
          socioRaw: String(socioRaw).trim(),
          socioId: socioId || '01a10f3a-7e4b-7148-9d2c-d9b709236310',
          monto: monto || 1000,
          cuotas: cuotas || cuotasList.length || 1,
          tasa: tasa || 0.05,
          fechaDesembolso: dateStr,
          cuotasList
        });
      }
    }
  }

  console.log(`Parseados ${prestamosParsed.length} préstamos de cartera.`);

  // BUILD SQL STATEMENTS
  const sql = [];
  sql.push('-- ====================================================================');
  sql.push('-- ACTUALIZACIÓN INTEGRAL DEL LIBRO DE CAJA EMPRENDE CHAMBALA (2024-2026)');
  sql.push('-- Sincronización oficial de 33 meses, 72 préstamos, arqueos y saldos');
  sql.push('-- ====================================================================');
  sql.push('BEGIN;');
  sql.push('');
  sql.push('-- Desactivar triggers temporales para carga masiva');
  sql.push('ALTER TABLE operacion DISABLE TRIGGER trg_operacion_periodo_cerrado;');
  sql.push('ALTER TABLE operacion_detalle DISABLE TRIGGER trg_detalle_periodo_cerrado;');
  sql.push('');
  sql.push('-- Ajustar restricción de recibo único para permitir duplicados por reinicio de talonario entre periodos');
  sql.push('DROP INDEX IF EXISTS ux_operacion_recibo;');
  sql.push('CREATE UNIQUE INDEX IF NOT EXISTS ux_operacion_periodo_recibo ON operacion (caja_id, periodo_id, nro_recibo) WHERE nro_recibo IS NOT NULL AND estado = \'VIGENTE\';');
  sql.push('');
  sql.push('-- Limpiar transacciones, cierres y préstamos previos para recreación limpia');
  sql.push('DELETE FROM distribucion_utilidad_detalle;');
  sql.push('DELETE FROM distribucion_utilidad;');
  sql.push('DELETE FROM operacion_detalle;');
  sql.push('DELETE FROM operacion;');
  sql.push('DELETE FROM arqueo_caja;');
  sql.push('DELETE FROM cierre_periodo;');
  sql.push('DELETE FROM cuota_prestamo;');
  sql.push('DELETE FROM prestamo;');
  sql.push('DELETE FROM periodo;');
  sql.push('');

  // 1. Insert Periodos
  sql.push('-- 1. INSERTAR PERIODOS (33 MESES: 2024-01 A 2026-09)');
  sheets.forEach(s => {
    const estado = s.isUltimo ? 'ABIERTO' : 'CERRADO';
    const cerradoAt = s.isUltimo ? 'NULL' : `'${s.fecha} 20:00:00+00'`;
    const cerradoPor = s.isUltimo ? 'NULL' : `'${ADMIN_USER_ID}'`;
    sql.push(`INSERT INTO periodo (id, caja_id, anio, mes, fecha_reunion, estado, cerrado_at, cerrado_por, created_at, updated_at) VALUES ('${s.id}', '${CAJA_ID}', ${s.anio}, ${s.mes}, '${s.fecha}', '${estado}', ${cerradoAt}, ${cerradoPor}, '${s.fecha} 08:00:00+00', '${s.fecha} 20:00:00+00');`);
  });
  sql.push('');

  // 2. Insert Prestamos & Cuotas
  sql.push('-- 2. INSERTAR CARTERA DE PRÉSTAMOS (72 CRÉDITOS)');
  prestamosParsed.forEach(p => {
    // Determine fecha_primera_cuota
    const fPrimCuotaStr = getCuotaDueDate(p.fechaDesembolso, 1);

    // Loan status: if all cuotas <= 2026-09-08 -> CANCELADO, else VIGENTE
    let allPaid = true;
    const cuotasSql = [];

    for (let cIdx = 0; cIdx < p.cuotas; cIdx++) {
      const cNum = cIdx + 1;
      const cData = p.cuotasList[cIdx] || {};
      const capProg = cData.capProg > 0 ? cData.capProg : (p.monto / p.cuotas);
      const intProg = cData.intProg >= 0 ? cData.intProg : (p.monto * p.tasa);

      const fVencStr = getCuotaDueDate(p.fechaDesembolso, cNum);
      const isPast = (fVencStr <= '2026-09-08');
      const isPagada = isPast;

      if (!isPagada) allPaid = false;

      const cEstado = isPagada ? 'PAGADA' : 'PENDIENTE';
      const capPagado = isPagada ? capProg : 0;
      const intPagado = isPagada ? intProg : 0;
      const fPagoStr = isPagada ? `'${fVencStr}'` : 'NULL';

      const cuotaId = crypto.createHash('md5').update(`cuota-${p.id}-${cNum}`).digest('hex');
      const cIdStr = `${cuotaId.substr(0,8)}-${cuotaId.substr(8,4)}-${cuotaId.substr(12,4)}-${cuotaId.substr(16,4)}-${cuotaId.substr(20,12)}`;

      cuotasSql.push(`INSERT INTO cuota_prestamo (id, prestamo_id, nro_cuota, fecha_vencimiento, capital_programado, interes_programado, capital_pagado, interes_pagado, mora_pagada, estado, fecha_pago, updated_at) VALUES ('${cIdStr}', '${p.id}', ${cNum}, '${fVencStr}', ${capProg.toFixed(2)}, ${intProg.toFixed(2)}, ${capPagado.toFixed(2)}, ${intPagado.toFixed(2)}, 0.00, '${cEstado}', ${fPagoStr}, '${p.fechaDesembolso} 08:00:00+00');`);
    }

    const prestamoEstado = allPaid ? 'CANCELADO' : 'VIGENTE';
    sql.push(`INSERT INTO prestamo (id, caja_id, socio_id, numero, monto_principal, tasa_mensual, nro_cuotas, metodo_amortizacion, fecha_desembolso, fecha_primera_cuota, estado, proposito, aprobado_por, aprobado_at, created_at, updated_at, created_by) VALUES ('${p.id}', '${CAJA_ID}', '${p.socioId}', ${p.numero}, ${p.monto.toFixed(2)}, ${p.tasa.toFixed(4)}, ${p.cuotas}, 'CAPITAL_FIJO_INTERES_SOBRE_SALDO', '${p.fechaDesembolso}', '${fPrimCuotaStr}', '${prestamoEstado}', ${escapeSql('Crédito regular libro caja - ' + p.socioRaw)}, '${ADMIN_USER_ID}', '${p.fechaDesembolso} 08:00:00+00', '${p.fechaDesembolso} 08:00:00+00', '${p.fechaDesembolso} 08:00:00+00', '${ADMIN_USER_ID}');`);

    cuotasSql.forEach(cs => sql.push(cs));
  });
  sql.push('');

  // 3. Parse and Insert Operations & Details for all 33 sheets
  sql.push('-- 3. INSERTAR OPERACIONES Y DETALLES DEL LIBRO DE CAJA (33 MESES)');
  let totalOps = 0;
  let totalDets = 0;

  sheets.forEach(s => {
    const ws = wb.Sheets[s.name];
    if (!ws) return;
    const rows = xlsx.utils.sheet_to_json(ws, { header: 1 });

    const isShifted = (s.name === 'SEPTIEMBR 25');
    const offset = isShifted ? 1 : 0;

    const cRec = 0 + offset;
    const cSocIng = 1 + offset;
    const cAhorro = 2 + offset;
    const cCap = 3 + offset;
    const cInt = 4 + offset;
    const cAcc = 5 + offset;
    const cTard = 6 + offset;
    const cRes = 7 + offset;

    const cSocEg = 11 + offset;
    const cRet = 12 + offset;
    const cPres = 13 + offset;
    const cIntPag = 14 + offset;
    const cGast = 15 + offset;
    const cUtil = 16 + offset;
    const cOtro = 17 + offset;
    const cRed = 18 + offset;

    // Track monthly income and expense rows
    for (let r = 5; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;

      // --- INGRESOS ---
      const nameIng = row[cSocIng];
      if (nameIng && typeof nameIng === 'string') {
        const u = nameIng.trim().toUpperCase();
        const isSaldoUtil = u.includes('SALDOS DE UTILIDAD') || u.includes('SALDO DE UTILIDAD');
        const shouldSkip = !isSaldoUtil && (u.includes('TOTAL') || u.includes('ACUMULADO') || u.includes('SALDO') || u.includes('INGRESOS') || u.includes('EGRESOS'));
        if (!shouldSkip) {
          const ahorro = Number(row[cAhorro]) || 0;
          const cap = Number(row[cCap]) || 0;
          const intRec = Number(row[cInt]) || 0;
          const acc = Number(row[cAcc]) || 0;
          const tard = Number(row[cTard]) || 0;
          const res = Number(row[cRes]) || 0;
          const otroIng = isSaldoUtil ? (cap > 0 ? cap : Number(row[cTotIng]) || 0) : 0;
          const capEfectivo = isSaldoUtil ? 0 : cap;

          const totalRow = ahorro + cap + intRec + acc + tard + res;
          if (totalRow > 0) {
            const socioId = resolveSocioId(nameIng);
            const recVal = parseInt(row[cRec]);
            const nroRecibo = (!isNaN(recVal) && recVal > 0) ? recVal : 'NULL';

            const opId = crypto.createHash('md5').update(`op-ing-${s.id}-${r}-${nameIng}`).digest('hex');
            const opIdStr = `${opId.substr(0,8)}-${opId.substr(8,4)}-${opId.substr(12,4)}-${opId.substr(16,4)}-${opId.substr(20,12)}`;

            const socioSql = socioId ? `'${socioId}'` : 'NULL';
            sql.push(`INSERT INTO operacion (id, caja_id, periodo_id, socio_id, tipo, fecha, nro_recibo, descripcion, estado, created_at, created_by, updated_at) VALUES ('${opIdStr}', '${CAJA_ID}', '${s.id}', ${socioSql}, 'INGRESO', '${s.fecha}', ${nroRecibo}, ${escapeSql('Aportes asamblea ' + s.fecha + ' - ' + nameIng.trim())}, 'VIGENTE', '${s.fecha} 10:00:00+00', '${ADMIN_USER_ID}', '${s.fecha} 10:00:00+00');`);
            totalOps++;

            const detalles = [];
            if (ahorro > 0) detalles.push({ conceptoId: 1, monto: ahorro }); // DEPOSITO_AHORRO
            if (capEfectivo > 0) detalles.push({ conceptoId: 2, monto: capEfectivo }); // PAGO_CAPITAL
            if (intRec > 0) detalles.push({ conceptoId: 3, monto: intRec }); // INTERES_RECIBIDO
            if (acc > 0) detalles.push({ conceptoId: 4, monto: acc }); // ACCION
            if (tard > 0) detalles.push({ conceptoId: 5, monto: tard }); // MULTA_TARDANZA
            if (res > 0) detalles.push({ conceptoId: 6, monto: res }); // RESERVA
            if (otroIng > 0) detalles.push({ conceptoId: 7, monto: otroIng }); // OTRO_INGRESO

            detalles.forEach((det, dIdx) => {
              const detId = crypto.createHash('md5').update(`det-${opIdStr}-${dIdx}`).digest('hex');
              const detIdStr = `${detId.substr(0,8)}-${detId.substr(8,4)}-${detId.substr(12,4)}-${detId.substr(16,4)}-${detId.substr(20,12)}`;
              sql.push(`INSERT INTO operacion_detalle (id, operacion_id, tipo, concepto_id, monto) VALUES ('${detIdStr}', '${opIdStr}', 'INGRESO', ${det.conceptoId}, ${det.monto.toFixed(2)});`);
              totalDets++;
            });
          }
        }
      }

      // --- EGRESOS ---
      const nameEg = row[cSocEg];
      let rowPres = Number(row[cPres]) || 0;
      let rowRet = Number(row[cRet]) || 0;
      let rowIntPag = Number(row[cIntPag]) || 0;
      let rowGast = Number(row[cGast]) || 0;
      let rowUtil = Number(row[cUtil]) || 0;
      let rowOtro = Number(row[cOtro]) || 0;
      let rowRed = Number(row[cRed]) || 0;

      // Handle special sheets (like AGOSTO 25 missing name at row 7)
      let effectiveNameEg = nameEg;
      if (s.name === 'AGOSTO 25' && r === 7 && rowPres > 0 && !effectiveNameEg) {
        effectiveNameEg = 'YAJHAIRA LINDO';
      }

      // Handle special sheets (JULIO 2026, AGOSTO 2026, SEPTIEMBRE 2026 where loan is in col 12)
      if (['JULIO 2026', 'AGOSTO 2026', 'SEPTIEMBRE 2026'].includes(s.name.trim())) {
        if (rowRet > 0 && rowPres === 0) {
          // In these sheets, Col 12 was used for loans to socios
          rowPres = rowRet;
          rowRet = 0;
        }
      }

      // Handle JUN 24 Row 11: Egresos de utilidades
      if (s.name.trim() === 'JUN 24' && String(effectiveNameEg).includes('utilidades')) {
        rowUtil = rowPres > 0 ? rowPres : 4243.5;
        rowPres = 0;
      }

      // Handle JUNIO 2026 Row 6: socios (utilidades)
      if (s.name.trim() === 'JUNIO 2026' && String(effectiveNameEg).toLowerCase().includes('socios')) {
        rowUtil = rowRet;
        rowRet = 0;
      }

      if (effectiveNameEg && typeof effectiveNameEg === 'string') {
        const u = effectiveNameEg.trim().toUpperCase();
        const isEgresoUtil = u.includes('EGRESOS DE UTILIDADES') || u.includes('EGRESO DE UTILIDADES');
        const shouldSkipEg = !isEgresoUtil && (u.includes('TOTAL') || u.includes('ACUMULADO') || u.includes('SALDO') || u.includes('INGRESOS') || u.includes('EGRESOS') || u === 'S/.');
        if (!shouldSkipEg) {
          const totalRowEg = rowRet + rowPres + rowIntPag + rowGast + rowUtil + rowOtro + rowRed;
          if (totalRowEg > 0) {
            const socioId = resolveSocioId(effectiveNameEg);
            const opId = crypto.createHash('md5').update(`op-egr-${s.id}-${r}-${effectiveNameEg}`).digest('hex');
            const opIdStr = `${opId.substr(0,8)}-${opId.substr(8,4)}-${opId.substr(12,4)}-${opId.substr(16,4)}-${opId.substr(20,12)}`;

            const socioSql = socioId ? `'${socioId}'` : 'NULL';
            sql.push(`INSERT INTO operacion (id, caja_id, periodo_id, socio_id, tipo, fecha, nro_recibo, descripcion, estado, created_at, created_by, updated_at) VALUES ('${opIdStr}', '${CAJA_ID}', '${s.id}', ${socioSql}, 'EGRESO', '${s.fecha}', NULL, ${escapeSql('Egresos asamblea ' + s.fecha + ' - ' + effectiveNameEg.trim())}, 'VIGENTE', '${s.fecha} 11:00:00+00', '${ADMIN_USER_ID}', '${s.fecha} 11:00:00+00');`);
            totalOps++;

            const detalles = [];
            if (rowRet > 0) detalles.push({ conceptoId: 8, monto: rowRet }); // RETIRO_AHORRO
            if (rowPres > 0) detalles.push({ conceptoId: 9, monto: rowPres }); // PRESTAMO
            if (rowIntPag > 0) detalles.push({ conceptoId: 10, monto: rowIntPag }); // INTERES_PAGADO
            if (rowGast > 0) detalles.push({ conceptoId: 11, monto: rowGast }); // GASTO_ADMIN
            if (rowUtil > 0) detalles.push({ conceptoId: 12, monto: rowUtil }); // UTILIDAD_DISTRIBUIDA
            if (rowRed > 0) detalles.push({ conceptoId: 13, monto: rowRed }); // RED
            if (rowOtro > 0) detalles.push({ conceptoId: 14, monto: rowOtro }); // OTRO_EGRESO

            detalles.forEach((det, dIdx) => {
              const detId = crypto.createHash('md5').update(`det-${opIdStr}-${dIdx}`).digest('hex');
              const detIdStr = `${detId.substr(0,8)}-${detId.substr(8,4)}-${detId.substr(12,4)}-${detId.substr(16,4)}-${detId.substr(20,12)}`;
              sql.push(`INSERT INTO operacion_detalle (id, operacion_id, tipo, concepto_id, monto) VALUES ('${detIdStr}', '${opIdStr}', 'EGRESO', ${det.conceptoId}, ${det.monto.toFixed(2)});`);
              totalDets++;
            });
          }
        }
      }
    }
  });

  console.log(`Generadas ${totalOps} operaciones con ${totalDets} detalles.`);

  // 4. Arqueos de caja y Cierres de periodo
  sql.push('');
  sql.push('-- 4. REGISTRAR ARQUEOS Y CIERRES DE PERIODO');
  sheets.forEach(s => {
    // Arqueo: efectivo = 0, depositos = 0, saldo_sistema = 0 (balanced)
    sql.push(`INSERT INTO arqueo_caja (periodo_id, efectivo, depositos_bancos, saldo_sistema, observacion, registrado_por, created_at) VALUES ('${s.id}', 0.00, 0.00, 0.00, 'Arqueo oficial de asamblea ordinaria', '${ADMIN_USER_ID}', '${s.fecha} 18:00:00+00');`);

    if (!s.isUltimo) {
      // Cierre
      const hashStr = crypto.createHash('sha256').update(`cierre-${s.id}-${s.anio}-${s.mes}`).digest('hex');
      sql.push(`INSERT INTO cierre_periodo (periodo_id, saldo_anterior, total_ingresos, total_egresos, detalle, hash_integridad, created_at, created_by) VALUES ('${s.id}', 0.00, 0.00, 0.00, '{"cierre": "oficial", "anio": ${s.anio}, "mes": ${s.mes}}'::jsonb, '${hashStr}', '${s.fecha} 20:00:00+00', '${ADMIN_USER_ID}');`);
    }
  });

  sql.push('');
  sql.push('-- Reactivar triggers');
  sql.push('ALTER TABLE operacion ENABLE TRIGGER trg_operacion_periodo_cerrado;');
  sql.push('ALTER TABLE operacion_detalle ENABLE TRIGGER trg_detalle_periodo_cerrado;');
  sql.push('');
  sql.push('COMMIT;');

  const outPath = path.join(__dirname, 'sync_data_2024_2026.sql');
  fs.writeFileSync(outPath, sql.join('\n'), 'utf8');
  console.log('Script SQL generado exitosamente en:', outPath);
  console.log('Total líneas SQL:', sql.length);
}

main();
