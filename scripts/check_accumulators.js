const xlsx = require('../frontend/node_modules/xlsx');
const wb = xlsx.readFile('C:\\Proyectos\\Emprende\\Datos Emprende\\Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls');

['JUL 23', 'JUN 24 '].forEach(name => {
  const sheet = wb.Sheets[name];
  console.log(`=== ${name} ===`);
  const r34 = sheet['G34']?.v;
  const r35 = sheet['G35']?.v;
  const f34 = sheet['G34']?.f;
  const f35 = sheet['G35']?.f;
  console.log(`G34: ${r34} [=${f34}], G35: ${r35} [=${f35}]`);
});

// Let's check where JUL 23 G34 comes from
const jul23 = wb.Sheets['JUL 23'];
console.log('JUL 23 cell G34 formula:', jul23['G34']?.f, 'val:', jul23['G34']?.v);
console.log('JUL 23 cell G33 formula:', jul23['G33']?.f, 'val:', jul23['G33']?.v);
console.log('JUL 23 cell G35 formula:', jul23['G35']?.f, 'val:', jul23['G35']?.v);
