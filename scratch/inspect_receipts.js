const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5433/caja_chambala'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT p.anio, p.mes, o.id, o.nro_recibo, s.codigo as socio_codigo, s.nombre_completo, o.descripcion, o.created_at, o.estado
    FROM operacion o
    JOIN periodo p ON p.id = o.periodo_id
    LEFT JOIN socio s ON s.id = o.socio_id
    WHERE o.tipo = 'INGRESO' AND s.id IS NOT NULL AND o.estado = 'VIGENTE' AND (p.anio = 2026 AND p.mes >= 5)
    ORDER BY p.anio, p.mes, s.codigo, o.created_at
  `);
  
  console.log('Total operations to check:', res.rows.length);
  const byMonth = {};
  res.rows.forEach(r => {
    const key = `${r.anio}-${String(r.mes).padStart(2, '0')}`;
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(r);
  });

  for (const [m, rows] of Object.entries(byMonth)) {
    console.log(`=== ${m} (Count: ${rows.length}) ===`);
    rows.forEach((r, idx) => {
      console.log(`  [${idx + 1}] socio ${r.socio_codigo} (${r.nombre_completo.substring(0, 25)}) current recibo: ${r.nro_recibo} | desc: ${r.descripcion}`);
    });
  }

  await client.end();
}
run().catch(console.error);
