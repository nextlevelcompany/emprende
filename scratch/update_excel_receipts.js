const xlsx = require('xlsx');

const filePath = 'Datos Emprende/Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls';
const wb = xlsx.readFile(filePath);

function setCell(ws, cellRef, val) {
  if (val === null || val === undefined || val === '') {
    delete ws[cellRef];
  } else {
    ws[cellRef] = { t: 'n', v: val, w: String(val) };
  }
}

// 1. JUNIO 2026 (523 - 538)
const wsJun = wb.Sheets['JUNIO 2026'];
if (wsJun) {
  setCell(wsJun, 'A7', 523); // CIRILO HUAMAN
  setCell(wsJun, 'A8', 524); // ANABEL LAIME
  setCell(wsJun, 'A9', 525); // DORIS LAIME
  setCell(wsJun, 'A10', 526); // ADELA PONCE
  setCell(wsJun, 'A11', 527); // JULIAN MORAN
  setCell(wsJun, 'A12', 528); // ALICIA LAIME
  setCell(wsJun, 'A13', 529); // JUAN CARLOS RAZURI
  setCell(wsJun, 'A14', 530); // ALEJANDRA HUAMAN
  setCell(wsJun, 'A15', null); // JUANA CACRO (sin aportes)
  setCell(wsJun, 'A16', null); // EDITH LINDO (sin aportes)
  setCell(wsJun, 'A17', 531); // ELIZABETH HUAMAN
  setCell(wsJun, 'A18', null); // YAJHAIRA LINDO (sin aportes)
  setCell(wsJun, 'A19', null); // MARGARITA LEON (sin aportes)
  setCell(wsJun, 'A20', null); // HENRY HUAMAN (sin aportes)
  setCell(wsJun, 'A21', 532); // MIRTHA ROSA ALANYA
  setCell(wsJun, 'A22', 533); // YESSENIA HUAMAN
  setCell(wsJun, 'A23', null); // TEOFILA MORAN (sin aportes)
  setCell(wsJun, 'A24', 534); // JUAN CARLOS RAZURI (cuota)
  setCell(wsJun, 'A25', 535); // RAUL BAUTISTA
  setCell(wsJun, 'A26', 536); // OMAR LAIME
  setCell(wsJun, 'A27', null); // TIA VANE (sin aportes)
  setCell(wsJun, 'A28', 537); // EDDY PRUDENCIO
  setCell(wsJun, 'A29', 538); // JEFFERSON SEVERINO
  console.log('JUNIO 2026 actualizado: 523 a 538');
}

// 2. JULIO 2026 (539 - 555)
const wsJul = wb.Sheets['JULIO 2026'];
if (wsJul) {
  let rec = 539;
  for (let r = 7; r <= 23; r++) {
    setCell(wsJul, `A${r}`, rec++);
  }
  console.log('JULIO 2026 actualizado: 539 a 555');
}

// 3. AGOSTO 2026 (556 - 572)
const wsAgo = wb.Sheets['AGOSTO 2026'];
if (wsAgo) {
  let rec = 556;
  for (let r = 7; r <= 23; r++) {
    setCell(wsAgo, `A${r}`, rec++);
  }
  console.log('AGOSTO 2026 actualizado: 556 a 572');
}

// 4. SEPTIEMBRE 2026 (573 - 590)
const wsSet = wb.Sheets['SEPTIEMBRE 2026'];
if (wsSet) {
  let rec = 573;
  for (let r = 7; r <= 24; r++) {
    setCell(wsSet, `A${r}`, rec++);
  }
  console.log('SEPTIEMBRE 2026 actualizado: 573 a 590');
}

xlsx.writeFile(wb, filePath, { bookType: 'biff8' });
console.log('Archivo Excel guardado exitosamente.');
