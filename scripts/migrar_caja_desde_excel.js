const fs = require('fs');
const path = require('path');
const xlsx = require('../frontend/node_modules/xlsx');

const API_BASE = 'http://localhost:8080/api/v1';
const EXCEL_PATH = 'C:\\Proyectos\\Emprende\\Datos Emprende\\Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Define ADMIN_EMAIL y ADMIN_PASSWORD en el entorno antes de ejecutar la migración.');
  }
  console.log('=== INICIANDO MIGRACIÓN OFICIAL DEL LIBRO DE CAJA EMPRENDE CHAMBALA ===');

  // 1. Iniciar sesión como ADMIN
  console.log('1. Autenticando como ADMIN...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      portal: 'ADMIN',
    }),
  });

  if (!loginRes.ok) {
    const err = await loginRes.text();
    throw new Error(`Error de autenticación: ${loginRes.status} ${err}`);
  }

  const { accessToken } = await loginRes.json();
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
  console.log('Autenticación exitosa.');

  // 2. Cargar catálogo de conceptos
  console.log('2. Obteniendo catálogo de conceptos...');
  const concRes = await fetch(`${API_BASE}/conceptos`, { headers: authHeaders });
  const conceptos = await concRes.json();
  const conceptoPorCodigo = {};
  for (const c of conceptos) {
    conceptoPorCodigo[c.codigo] = c.id;
  }
  console.log(`Catálogo cargado: ${conceptos.length} conceptos.`);

  // 3. Leer Excel y extraer socios
  console.log('3. Leyendo archivo Excel:', EXCEL_PATH);
  const wb = xlsx.readFile(EXCEL_PATH);

  // Lista canónica de socios conocidos y activos
  const canonicalSocios = [
    { nombres: 'CIRILO ENRIQUE', apellidos: 'HUAMAN MORAN', tipo: 'SOCIO', estado: 'ACTIVO', fechaIngreso: '2023-07-08' },
    { nombres: 'ANABEL MARIA', apellidos: 'LAIME CCACCRO', tipo: 'SOCIO', estado: 'ACTIVO', fechaIngreso: '2023-07-08' },
    { nombres: 'DORIS HAYDEE', apellidos: 'LAIME CCACCRO', tipo: 'SOCIO', estado: 'ACTIVO', fechaIngreso: '2023-07-08' },
    { nombres: 'ADELA', apellidos: 'PONCE HUILCAYA', tipo: 'SOCIO', estado: 'ACTIVO', fechaIngreso: '2023-07-08' },
    { nombres: 'JULIAN', apellidos: 'MORAN VASQUEZ', tipo: 'SOCIO', estado: 'ACTIVO', fechaIngreso: '2023-07-08' },
    { nombres: 'ALICIA', apellidos: 'LAIME CCACCRO', tipo: 'SOCIO', estado: 'ACTIVO', fechaIngreso: '2023-07-08' },
    { nombres: 'JUAN CARLOS', apellidos: 'RAZURI MONJA', tipo: 'SOCIO', estado: 'ACTIVO', fechaIngreso: '2023-07-08' },
    { nombres: 'ALEJANDRA SILVIA', apellidos: 'HUAMAN MORAN', tipo: 'SOCIO', estado: 'ACTIVO', fechaIngreso: '2023-07-08' },
    { nombres: 'JUANA MARIA', apellidos: 'CACRO HINOSTROZA', tipo: 'SOCIO', estado: 'RETIRADO', fechaIngreso: '2023-07-08', fechaRetiro: '2026-05-08', notas: 'Retirado: Dejó de aportar en asamblea. Último aporte de acciones: 08/04/2026.' },
    { nombres: 'EDITH PILAR', apellidos: 'LINDO MORAN', tipo: 'SOCIO', estado: 'RETIRADO', fechaIngreso: '2023-07-08', fechaRetiro: '2026-05-08', notas: 'Retirado: Dejó de aportar en asamblea. Último aporte de acciones: 08/04/2026.' },
    { nombres: 'ELIZABETH VANESSA', apellidos: 'HUAMAN ORDAYA', tipo: 'SOCIO', estado: 'ACTIVO', fechaIngreso: '2023-07-08' },
    { nombres: 'YAJHAIRA ROCIO', apellidos: 'LINDO MORAN', tipo: 'SOCIO', estado: 'RETIRADO', fechaIngreso: '2023-07-08', fechaRetiro: '2026-05-08', notas: 'Retirado: Dejó de aportar en asamblea. Último aporte de acciones: 08/04/2026.' },
    { nombres: 'MARGARITA', apellidos: 'LEON CONDE', tipo: 'SOCIO', estado: 'ACTIVO', fechaIngreso: '2023-08-08' },
    { nombres: 'HENRY JOSE', apellidos: 'HUAMAN CANTURIN', tipo: 'SOCIO', estado: 'RETIRADO', fechaIngreso: '2025-07-08', fechaRetiro: '2026-05-08', notas: 'Retirado: Dejó de aportar en asamblea. Último aporte de acciones: 08/04/2026.' },
    { nombres: 'MIRTHA ROSA', apellidos: 'ALANYA HUAMAN', tipo: 'SOCIO', estado: 'ACTIVO', fechaIngreso: '2025-07-08' },
    { nombres: 'YESSENIA', apellidos: 'HUAMAN ORDAYA', tipo: 'SOCIO', estado: 'ACTIVO', fechaIngreso: '2025-07-08' },
    { nombres: 'TEOFILA', apellidos: 'MORAN VASQUEZ', tipo: 'SOCIO', estado: 'RETIRADO', fechaIngreso: '2025-07-08', fechaRetiro: '2026-05-08', notas: 'Retirado: Dejó de aportar en asamblea. Último aporte de acciones: 08/04/2026.' },
    { nombres: 'SILVIA', apellidos: 'CACRO HINOSTROZA', tipo: 'SOCIO', estado: 'RETIRADO', fechaIngreso: '2023-07-08', fechaRetiro: '2025-06-08', notas: 'Retirado: Liquidación formal en asamblea de junio 2025. Devolución de capital social (S/. 2,040.00). Último aporte: 08/05/2025.' },
    { nombres: 'RAUL', apellidos: 'BAUTISTA', tipo: 'SOCIO', estado: 'ACTIVO', fechaIngreso: '2026-06-08' },
    { nombres: 'OMAR', apellidos: 'LAIME', tipo: 'SOCIO', estado: 'ACTIVO', fechaIngreso: '2026-06-08' },
    { nombres: 'EDDY', apellidos: 'PRUDENCIO', tipo: 'SOCIO', estado: 'ACTIVO', fechaIngreso: '2026-06-08' },
    { nombres: 'JEFFERSON', apellidos: 'SEVERINO', tipo: 'SOCIO', estado: 'ACTIVO', fechaIngreso: '2026-06-08' },
    { nombres: 'IVAN', apellidos: 'TELLO', tipo: 'EXTERNO', estado: 'RETIRADO', fechaIngreso: '2024-05-08', fechaRetiro: '2024-07-08', notas: 'Retirado: Cliente externo sin aportes de capital social. Préstamos cancelados.' },
  ];

  // 4. Obtener socios existentes o crearlos
  console.log('4. Verificando/registrando padrón oficial de socios en el backend...');
  const sociosExistentesRes = await fetch(`${API_BASE}/socios`, { headers: authHeaders });
  const sociosExistentesData = await sociosExistentesRes.json();
  const sociosExistentes = Array.isArray(sociosExistentesData) ? sociosExistentesData : sociosExistentesData.content || [];

  const socioMap = new Map(); // normalized name -> socioId
  for (const s of sociosExistentes) {
    const key = `${s.apellidos} ${s.nombres}`.toUpperCase().replace(/\s+/g, ' ');
    const altKey = `${s.nombres} ${s.apellidos}`.toUpperCase().replace(/\s+/g, ' ');
    socioMap.set(key, s.id);
    socioMap.set(altKey, s.id);
  }

  let dniCounter = 10000001;
  for (const cs of canonicalSocios) {
    const key1 = `${cs.apellidos} ${cs.nombres}`.toUpperCase().replace(/\s+/g, ' ');
    const key2 = `${cs.nombres} ${cs.apellidos}`.toUpperCase().replace(/\s+/g, ' ');

    if (!socioMap.has(key1) && !socioMap.has(key2)) {
      const docNum = String(dniCounter++);
      const postRes = await fetch(`${API_BASE}/socios`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          tipo: cs.tipo,
          nombres: cs.nombres,
          apellidos: cs.apellidos,
          documentoTipo: 'DNI',
          numeroDocumento: docNum,
          fechaIngreso: cs.fechaIngreso,
          telefono: null,
          email: `${cs.nombres.split(' ')[0].toLowerCase()}.${cs.apellidos.split(' ')[0].toLowerCase()}@chambala.pe`,
          direccion: 'Chambala, Huancayo',
          notas: cs.notas || 'Socio registrado desde libro contable oficial',
        }),
      });

      if (postRes.ok) {
        const nuevoSocio = await postRes.json();
        console.log(`  -> Creado: #${nuevoSocio.codigo} ${nuevoSocio.nombreCompleto} (${cs.tipo})`);
        socioMap.set(key1, nuevoSocio.id);
        socioMap.set(key2, nuevoSocio.id);

        if (cs.estado === 'RETIRADO') {
          await fetch(`${API_BASE}/socios/${nuevoSocio.id}/baja`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
              fechaRetiro: cs.fechaRetiro,
              motivo: cs.notas || 'Retiro registrado en libro contable',
            }),
          });
        }
      } else {
        const err = await postRes.text();
        console.warn(`  ! Error al crear ${cs.nombres} ${cs.apellidos}:`, err);
      }
    }
  }

  // Función para asociar un nombre en fila Excel con un Socio ID
  function findSocioId(rawName) {
    if (!rawName || typeof rawName !== 'string') return null;
    const clean = rawName
      .replace(/\(E\)/i, '')
      .replace(/EXTERNO/i, '')
      .replace(/\(.*SE RETIRO.*\)/i, '')
      .replace(/Acciones /i, '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, ' ');

    if (socioMap.has(clean)) return socioMap.get(clean);

    // Búsqueda difusa por partes de nombre
    for (const [k, id] of socioMap.entries()) {
      const parts = clean.split(' ').filter(p => p.length > 2);
      let matches = 0;
      for (const p of parts) {
        if (k.includes(p)) matches++;
      }
      if (matches >= 2 && matches >= parts.length - 1) {
        return id;
      }
    }
    return null;
  }

  // 5. Mapear e importar hojas mensuales clave (ejemplo: ciclo 2024 - 2025)
  console.log('5. Importando periodos mensuales y operaciones...');
  const sheetConfigs = [
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
    { name: 'OCTUBRE 2025', anio: 2025, mes: 10, fecha: '2025-10-08' },
  ];

  // Obtener periodos existentes
  const periodosExistentesRes = await fetch(`${API_BASE}/periodos`, { headers: authHeaders });
  const periodosExistentes = await periodosExistentesRes.json();
  const periodoMap = new Map();
  for (const p of periodosExistentes) {
    periodoMap.set(`${p.anio}-${p.mes}`, p);
  }

  for (let scIdx = 0; scIdx < sheetConfigs.length; scIdx++) {
    const sc = sheetConfigs[scIdx];
    const sheet = wb.Sheets[sc.name];
    if (!sheet) continue;

    console.log(`\nProcesando hoja: ${sc.name} (${sc.anio}-${sc.mes})...`);
    let periodo = periodoMap.get(`${sc.anio}-${sc.mes}`);

    if (!periodo) {
      const createPRes = await fetch(`${API_BASE}/periodos`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          anio: sc.anio,
          mes: sc.mes,
          fechaReunion: sc.fecha,
        }),
      });

      if (createPRes.ok) {
        periodo = await createPRes.json();
        periodoMap.set(`${sc.anio}-${sc.mes}`, periodo);
        console.log(`  -> Periodo aperturado ID: ${periodo.id}`);
      } else {
        const err = await createPRes.text();
        console.warn(`  ! Error al aperturar periodo ${sc.anio}-${sc.mes}:`, err);
        continue;
      }
    }

    // Si ya tiene operaciones registradas con montos, saltar inserción
    const planRes = await fetch(`${API_BASE}/periodos/${periodo.id}/planilla`, { headers: authHeaders });
    const planData = await planRes.json();
    if (planData.totalIngresosMes > 0 || planData.totalEgresosMes > 0) {
      console.log(`  (Periodo ya cuenta con ingresos S/. ${planData.totalIngresosMes}, omitiendo importación)`);
      continue;
    }

    // Parsear filas del Excel
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    let opIngresos = 0;
    let opEgresos = 0;

    for (let rIdx = 5; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx];
      if (!row || row.length === 0) continue;

      // Columna 1: Nombre Socio Ingreso
      const socioIngRaw = row[1];
      if (socioIngRaw && typeof socioIngRaw === 'string') {
        const socioIngClean = socioIngRaw.trim().toUpperCase();
        if (!socioIngClean.includes('TOTAL') && !socioIngClean.includes('ACUMULADO') && !socioIngClean.includes('SALDO')) {
          const socioId = findSocioId(socioIngRaw);
          const nroRecibo = parseInt(row[0]) || null;

          const ahorro = parseFloat(row[2]) || 0;
          const pagoCapital = parseFloat(row[3]) || 0;
          const interes = parseFloat(row[4]) || 0;
          const acciones = parseFloat(row[5]) || 0;
          const tardanza = parseFloat(row[6]) || 0;
          const reserva = parseFloat(row[7]) || 0;

          const detalles = [];
          if (ahorro > 0) detalles.push({ conceptoId: conceptoPorCodigo['DEPOSITO_AHORRO'], monto: ahorro });
          if (pagoCapital > 0) detalles.push({ conceptoId: conceptoPorCodigo['PAGO_CAPITAL'], monto: pagoCapital });
          if (interes > 0) detalles.push({ conceptoId: conceptoPorCodigo['INTERES_RECIBIDO'], monto: interes });
          if (acciones > 0) detalles.push({ conceptoId: conceptoPorCodigo['ACCION'], monto: acciones });
          if (tardanza > 0) detalles.push({ conceptoId: conceptoPorCodigo['MULTA_TARDANZA'], monto: tardanza });
          if (reserva > 0) detalles.push({ conceptoId: conceptoPorCodigo['RESERVA'], monto: reserva });

          if (detalles.length > 0) {
            const opRes = await fetch(`${API_BASE}/periodos/${periodo.id}/operaciones`, {
              method: 'POST',
              headers: authHeaders,
              body: JSON.stringify({
                socioId,
                tipo: 'INGRESO',
                fecha: sc.fecha,
                nroRecibo,
                descripcion: `Aportes asamblea ${sc.fecha} - ${socioIngRaw}`,
                detalles,
              }),
            });
            if (opRes.ok) opIngresos++;
          }
        }
      }

      // Columna 11: Nombre Socio Egreso
      const socioEgrRaw = row[11];
      if (socioEgrRaw && typeof socioEgrRaw === 'string') {
        const socioEgrClean = socioEgrRaw.trim().toUpperCase();
        if (!socioEgrClean.includes('TOTAL') && !socioEgrClean.includes('ACUMULADO') && !socioEgrClean.includes('SALDO')) {
          const socioId = findSocioId(socioEgrRaw);

          const retAhorro = parseFloat(row[12]) || 0;
          const prestamo = parseFloat(row[13]) || 0;
          const intPagado = parseFloat(row[14]) || 0;
          const gastAdmin = parseFloat(row[15]) || 0;
          const utilidad = parseFloat(row[16]) || 0;
          const red = parseFloat(row[17]) || 0;
          const otro = parseFloat(row[18]) || 0;

          const detalles = [];
          if (retAhorro > 0) detalles.push({ conceptoId: conceptoPorCodigo['RETIRO_AHORRO'], monto: retAhorro });
          if (prestamo > 0) detalles.push({ conceptoId: conceptoPorCodigo['PRESTAMO'], monto: prestamo });
          if (intPagado > 0) detalles.push({ conceptoId: conceptoPorCodigo['INTERES_PAGADO'], monto: intPagado });
          if (gastAdmin > 0) detalles.push({ conceptoId: conceptoPorCodigo['GASTO_ADMIN'], monto: gastAdmin });
          if (utilidad > 0) detalles.push({ conceptoId: conceptoPorCodigo['UTILIDAD_DISTRIBUIDA'], monto: utilidad });
          if (red > 0) detalles.push({ conceptoId: conceptoPorCodigo['RED'], monto: red });
          if (otro > 0) detalles.push({ conceptoId: conceptoPorCodigo['OTRO_EGRESO'], monto: otro });

          if (detalles.length > 0) {
            const opRes = await fetch(`${API_BASE}/periodos/${periodo.id}/operaciones`, {
              method: 'POST',
              headers: authHeaders,
              body: JSON.stringify({
                socioId,
                tipo: 'EGRESO',
                fecha: sc.fecha,
                nroRecibo: null,
                descripcion: `Egresos asamblea ${sc.fecha} - ${socioEgrRaw}`,
                detalles,
              }),
            });
            if (opRes.ok) opEgresos++;
          }
        }
      }
    }

    console.log(`  -> Operaciones registradas: ${opIngresos} ingresos, ${opEgresos} egresos.`);

    // Si no es el último periodo (el más reciente), registrar arqueo y cerrar inmutable
    if (scIdx < sheetConfigs.length - 1 && periodo.estado === 'ABIERTO') {
      // Arqueo
      await fetch(`${API_BASE}/periodos/${periodo.id}/arqueo`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          efectivo: 0,
          depositosBancos: 0,
          observacion: 'Arqueo consolidado automático por cierre contable histórico',
        }),
      });

      // Cierre
      const closeRes = await fetch(`${API_BASE}/periodos/${periodo.id}/cerrar`, {
        method: 'POST',
        headers: authHeaders,
      });

      if (closeRes.ok) {
        const closeData = await closeRes.json();
        console.log(`  -> Periodo cerrado e inmutable. Hash SHA-256: ${closeData.cierreHash?.substring(0, 16)}...`);
      }
    }
  }

  console.log('\n=== MIGRACIÓN DEL LIBRO EXCEL FINALIZADA CON ÉXITO ===');
}

main().catch(err => {
  console.error('Error fatal durante la migración:', err);
  process.exit(1);
});
