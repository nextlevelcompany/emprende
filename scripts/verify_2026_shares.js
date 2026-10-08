const xlsx = require('../frontend/node_modules/xlsx');
const wb = xlsx.readFile('C:\\Proyectos\\Emprende\\Datos Emprende\\Libro CAJA EMPRENDE CHAMBALA 2024 -2025 ACTUALIZADO (3).xls');

// Let's inspect the active socios at June 2026.
// Notice in 2025:
// Cirilo: 44, Anabel: 53, Doris: 37, Adela: 51, Julian: 78, Alicia: 26, Juan Carlos: 53,
// Alejandra: 100, Juana Maria: 69, Edith: 140, Elizabeth Vanessa: 116, Yajhaira: 100, Margarita: 36.
// Acciones compradas in June 2025:
// Adela: +6, Julian: +25, Alicia: +8, Juana: +23, Edith: +46, Elizabeth: +38, Yajhaira: +28, Margarita: +5.
// New socios entered in 2025-2026:
// Henry Jose (46), Mirtha Rosa (69), Yessenia (19), Teofila (65).
// What is the sum?
// Let's check!
