async function main() {
  const res = await fetch('http://localhost:3000/api/utilidades');
  const data = await res.json();
  console.log('=== DISTRIBUCIONES REGISTRADAS ===');
  data.forEach(d => {
    console.log(`Ejercicio ${d.ejercicio} (${d.estado}):`);
    console.log(`  Utilidad Aprobada:       S/. ${d.utilidadTotal}`);
    console.log(`  Total Acciones:          ${d.totalAcciones}`);
    console.log(`  Valor por Acción:        S/. ${d.valorPorAccion}`);
    console.log(`  Cobrado en Efectivo:     S/. ${d.totalCobrado}`);
    console.log(`  Reinvertido en Acciones: S/. ${d.totalReinvertido} (+${d.totalAccionesCompradas} acc)`);
    console.log(`  Total Beneficiarios:     ${d.detalles?.length} socios`);
  });
}
main().catch(console.error);
