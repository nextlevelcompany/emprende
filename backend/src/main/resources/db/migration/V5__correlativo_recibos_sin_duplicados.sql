-- =====================================================================
-- V5__correlativo_recibos_sin_duplicados.sql  |  PostgreSQL 16+
-- Corrige el correlativo histórico de recibos (nro_recibo) a partir de
-- junio de 2026 para eliminar duplicados originados por la plantilla del Excel.
-- Se renumeran de forma estrictamente secuencial y única en toda la caja:
--   - Mayo 2026: culmina en el recibo 522.
--   - Junio 2026: 523 al 538 (16 recibos segun filas del Excel)
--   - Julio 2026: 539 al 555 (17 recibos segun filas del Excel)
--   - Agosto 2026: 556 al 572 (17 recibos segun filas del Excel)
--   - Setiembre 2026: 573 al 590 (18 recibos segun filas del Excel)
--   - Octubre 2026: 591 al 608 (18 recibos)
-- Se establece el indice unico global (caja_id, nro_recibo) sobre operaciones vigentes.
-- =====================================================================

-- Desactivar temporalmente el trigger de periodo cerrado durante la migración
ALTER TABLE operacion DISABLE TRIGGER trg_operacion_periodo_cerrado;

-- 1. Asignar recibo 522 a la operación de Juan Carlos Rázuri en Mayo 2026 si estaba en null
UPDATE operacion
SET nro_recibo = 522
WHERE id = 'ca852c88-4f2b-c532-d9f2-b042f87704d0' AND nro_recibo IS NULL;

-- 2. Limpiar nro_recibo en operaciones anuladas para evitar colisiones
UPDATE operacion
SET nro_recibo = NULL
WHERE estado = 'ANULADA';

-- 3. Limpiar temporalmente nro_recibo en periodos a renumerar (mes >= 6) para evitar colisiones unicas durante la actualizacion
UPDATE operacion
SET nro_recibo = NULL
WHERE periodo_id IN (SELECT id FROM periodo WHERE anio = 2026 AND mes >= 6);

-- 4. Asignar correlativo exacto segun el orden fisico del Libro de Caja (Excel) y planilla

-- Mes 6 (JUNIO 2026)
UPDATE operacion SET nro_recibo = 523 WHERE id = '6bc004f2-eb2e-25bd-74b6-5c73e4957316'; -- CIRILO ENRIQUE HUAMAN MORAN (A7)
UPDATE operacion SET nro_recibo = 524 WHERE id = '8a75137f-c764-e56f-2a71-92f8904d7a96'; -- ANABEL MARIA LAIME CCACCRO (A8)
UPDATE operacion SET nro_recibo = 525 WHERE id = '025bbd3d-1acc-9013-7314-682dea60f4e8'; -- DORIS HAYDEE LAIME CCACCRO (A9)
UPDATE operacion SET nro_recibo = 526 WHERE id = '1b55e60e-d482-99b2-a781-2557ee7c7a3b'; -- ADELA PONCE HUILCAYA (A10)
UPDATE operacion SET nro_recibo = 527 WHERE id = 'c21a4bc6-2146-1ae1-894f-24348660cf47'; -- JULIAN MORAN VASQUEZ (A11)
UPDATE operacion SET nro_recibo = 528 WHERE id = '63f37a07-8736-5e9a-61bf-96f21d4f4310'; -- ALICIA LAIME CCACCRO (A12)
UPDATE operacion SET nro_recibo = 529 WHERE id = '9075d40b-ea98-74f6-c08e-c0f577e307b8'; -- JUAN CARLOS RAZURI MONJA (A13)
UPDATE operacion SET nro_recibo = 530 WHERE id = 'c3563d71-5233-b0f6-864c-7fb6469c7229'; -- ALEJANDRA SILVIA HUAMAN MORAN (A14)
UPDATE operacion SET nro_recibo = 531 WHERE id = '11d953e4-6817-43a2-1430-29302d3514ec'; -- ELIZABETH VANESSA HUAMAN ORDAYA (A17)
UPDATE operacion SET nro_recibo = 532 WHERE id = 'a6b601f5-5b07-a289-5fc6-e8c650f48e3a'; -- MIRTHA ROSA ALANYA HUAMAN (A21)
UPDATE operacion SET nro_recibo = 533 WHERE id = '128502cd-1e57-4877-705d-cc9c31bfa038'; -- YESSENIA HUAMAN ORDAYA (A22)
UPDATE operacion SET nro_recibo = 534 WHERE id = 'bba7a73b-17c8-8bed-6b55-803c5258fea8'; -- JUAN CARLOS RAZURI MONJA (A24)
UPDATE operacion SET nro_recibo = 535 WHERE id = '9758eabc-a200-ca17-927e-77478ee6fbca'; -- RAUL BAUTISTA (A25)
UPDATE operacion SET nro_recibo = 536 WHERE id = 'ef66bea6-7e91-9126-35e1-d733c0e12a08'; -- OMAR LAIME (A26)
UPDATE operacion SET nro_recibo = 537 WHERE id = '8e37fec4-a486-cecf-c7da-577924a173a9'; -- EDDY PRUDENCIO (A28)
UPDATE operacion SET nro_recibo = 538 WHERE id = 'dbd5b0fc-183d-bb7d-4bc2-e915f9a5d089'; -- JEFFERSON SEVERINO (A29)

-- Mes 7 (JULIO 2026)
UPDATE operacion SET nro_recibo = 539 WHERE id = '1b5dd0cd-b0d6-ec36-e193-1dbf1b7cef28'; -- CIRILO ENRIQUE HUAMAN MORAN (A7)
UPDATE operacion SET nro_recibo = 540 WHERE id = '125b8902-5c35-01ed-b07a-74dc400a5cf4'; -- ANABEL MARIA LAIME CCACCRO (A8)
UPDATE operacion SET nro_recibo = 541 WHERE id = '06d177ac-8ed4-e434-32ce-1396f9e5c2c1'; -- DORIS HAYDEE LAIME CCACCRO (A9)
UPDATE operacion SET nro_recibo = 542 WHERE id = '3ef4454f-12b1-ae42-9fa0-f0304551956b'; -- ADELA PONCE HUILCAYA (A10)
UPDATE operacion SET nro_recibo = 543 WHERE id = 'ebe529c8-5a7a-d56c-fd5c-2d54ae815888'; -- JULIAN MORAN VASQUEZ (A11)
UPDATE operacion SET nro_recibo = 544 WHERE id = 'c9c0ed3c-5a86-ef55-c43c-2dcb107eb2be'; -- ALICIA LAIME CCACCRO (A12)
UPDATE operacion SET nro_recibo = 545 WHERE id = '995eb1b2-92cc-ed57-2b17-1c84374a378e'; -- JUAN CARLOS RAZURI MONJA (A13)
UPDATE operacion SET nro_recibo = 546 WHERE id = '8b62491a-bcb1-65d3-2fda-aae46bd45b84'; -- ALEJANDRA SILVIA HUAMAN MORAN (A14)
UPDATE operacion SET nro_recibo = 547 WHERE id = '936aaeb0-a52e-e06a-8df3-f7c2d565ee47'; -- ELIZABETH VANESSA HUAMAN ORDAYA (A15)
UPDATE operacion SET nro_recibo = 548 WHERE id = '25fb974b-15be-523a-77ce-8c9ff9d08145'; -- MIRTHA ROSA ALANYA HUAMAN (A16)
UPDATE operacion SET nro_recibo = 549 WHERE id = 'f368fa54-dace-e316-0ce8-4402171c6a46'; -- YESSENIA HUAMAN ORDAYA (A17)
UPDATE operacion SET nro_recibo = 550 WHERE id = '0475f0de-d2dc-1697-5d43-9144ad86e101'; -- JUAN CARLOS RAZURI MONJA (A18)
UPDATE operacion SET nro_recibo = 551 WHERE id = '19385151-a0e6-9e3d-7846-61edf4b99c0c'; -- RAUL BAUTISTA (A19)
UPDATE operacion SET nro_recibo = 552 WHERE id = '20a7f29e-2602-4187-133f-4826ec8fb4ad'; -- OMAR LAIME (A20)
UPDATE operacion SET nro_recibo = 553 WHERE id = '265cdef2-1eb6-81fe-47b8-9977a4ef4e9c'; -- EDDY PRUDENCIO (A21)
UPDATE operacion SET nro_recibo = 554 WHERE id = 'cbdb6edb-5431-0571-b502-c3eddc044d22'; -- JEFFERSON SEVERINO (A22)
UPDATE operacion SET nro_recibo = 555 WHERE id = 'f58b8244-cb82-6ab3-043b-186b44794193'; -- YESSENIA HUAMAN ORDAYA (A23)

-- Mes 8 (AGOSTO 2026)
UPDATE operacion SET nro_recibo = 556 WHERE id = 'bd6b8db3-400d-5904-8110-7c84d99982e8'; -- CIRILO ENRIQUE HUAMAN MORAN (A7)
UPDATE operacion SET nro_recibo = 557 WHERE id = '84fedfbe-60d1-b71c-4f27-5048b30c7363'; -- ANABEL MARIA LAIME CCACCRO (A8)
UPDATE operacion SET nro_recibo = 558 WHERE id = '18f340ae-43a3-d4e2-c09a-150f320a1b64'; -- DORIS HAYDEE LAIME CCACCRO (A9)
UPDATE operacion SET nro_recibo = 559 WHERE id = '514638dc-91f8-bb30-b81f-b4d9f39f60b1'; -- ADELA PONCE HUILCAYA (A10)
UPDATE operacion SET nro_recibo = 560 WHERE id = 'ff25ba71-e7d3-7d6f-4631-1132d2d2d6f4'; -- JULIAN MORAN VASQUEZ (A11)
UPDATE operacion SET nro_recibo = 561 WHERE id = '88733e90-9142-6705-fe52-ec21d65baf5a'; -- ALICIA LAIME CCACCRO (A12)
UPDATE operacion SET nro_recibo = 562 WHERE id = 'bc1d7566-7a30-daa2-0c70-f06231bc971e'; -- JUAN CARLOS RAZURI MONJA (A13)
UPDATE operacion SET nro_recibo = 563 WHERE id = '7bff8393-38fc-b141-b8c1-871d7d827c3b'; -- ALEJANDRA SILVIA HUAMAN MORAN (A14)
UPDATE operacion SET nro_recibo = 564 WHERE id = '0086de1d-6e2d-229f-42aa-216857a9c284'; -- ELIZABETH VANESSA HUAMAN ORDAYA (A15)
UPDATE operacion SET nro_recibo = 565 WHERE id = '10f9d47c-7887-9857-ae4c-cb447991d43f'; -- MIRTHA ROSA ALANYA HUAMAN (A16)
UPDATE operacion SET nro_recibo = 566 WHERE id = '1a796aab-0219-902f-f6aa-8c483be2b23f'; -- YESSENIA HUAMAN ORDAYA (A17)
UPDATE operacion SET nro_recibo = 567 WHERE id = 'db11e1c0-10a9-4235-a327-a7967da06ba4'; -- RAUL BAUTISTA (A18)
UPDATE operacion SET nro_recibo = 568 WHERE id = '62d27d0c-e627-8348-cba6-76e78f2e7d96'; -- OMAR LAIME (A19)
UPDATE operacion SET nro_recibo = 569 WHERE id = '2b3d702b-fbc1-5e5d-e7f5-8b5cdbde4421'; -- EDDY PRUDENCIO (A20)
UPDATE operacion SET nro_recibo = 570 WHERE id = '0a4b7737-1013-1652-dda3-c59bbc0b9a75'; -- JEFFERSON SEVERINO (A21)
UPDATE operacion SET nro_recibo = 571 WHERE id = 'b48f860d-715d-be65-12ba-53702d8f375a'; -- MARGARITA LEON CONDE (A22)
UPDATE operacion SET nro_recibo = 572 WHERE id = '9d848b9d-9f4e-c076-c9f1-30bdc867260e'; -- JUAN CARLOS RAZURI MONJA (A23)

-- Mes 9 (SEPTIEMBRE 2026)
UPDATE operacion SET nro_recibo = 573 WHERE id = 'e6b490c3-88da-4a8a-3453-ab089c1e6d19'; -- CIRILO ENRIQUE HUAMAN MORAN (A7)
UPDATE operacion SET nro_recibo = 574 WHERE id = '3239e59c-5870-24d9-c377-cb2c800515f7'; -- ANABEL MARIA LAIME CCACCRO (A8)
UPDATE operacion SET nro_recibo = 575 WHERE id = '12265421-5a89-d8bd-4141-ef6fabf89c8a'; -- DORIS HAYDEE LAIME CCACCRO (A9)
UPDATE operacion SET nro_recibo = 576 WHERE id = '5d43b686-3abb-119b-8945-89f82c01ea88'; -- ADELA PONCE HUILCAYA (A10)
UPDATE operacion SET nro_recibo = 577 WHERE id = 'ecff59c0-e10b-a9de-525d-fce7cf05caf3'; -- JULIAN MORAN VASQUEZ (A11)
UPDATE operacion SET nro_recibo = 578 WHERE id = '02d40444-7032-2e5c-456f-a5d93c287509'; -- ALICIA LAIME CCACCRO (A12)
UPDATE operacion SET nro_recibo = 579 WHERE id = 'bbc73455-2ae2-efd6-2131-113fbc3e9313'; -- JUAN CARLOS RAZURI MONJA (A13)
UPDATE operacion SET nro_recibo = 580 WHERE id = 'ea9f78ac-9309-30a7-1332-c9568b80ae89'; -- ALEJANDRA SILVIA HUAMAN MORAN (A14)
UPDATE operacion SET nro_recibo = 581 WHERE id = 'a684bdb8-1a06-c8b2-d259-7860c09733df'; -- ELIZABETH VANESSA HUAMAN ORDAYA (A15)
UPDATE operacion SET nro_recibo = 582 WHERE id = '68ae5748-d7a0-2d9b-a2f2-8f9f954ddf9a'; -- MIRTHA ROSA ALANYA HUAMAN (A16)
UPDATE operacion SET nro_recibo = 583 WHERE id = '41ccdd69-9647-aacb-8f8c-d9bac2e267f9'; -- YESSENIA HUAMAN ORDAYA (A17)
UPDATE operacion SET nro_recibo = 584 WHERE id = '294dbd75-fa71-64ce-8946-6269c1904299'; -- RAUL BAUTISTA (A18)
UPDATE operacion SET nro_recibo = 585 WHERE id = '9927ce4d-3dc8-8555-fda2-635f11171154'; -- OMAR LAIME (A19)
UPDATE operacion SET nro_recibo = 586 WHERE id = '83ca1fc2-658f-b124-115a-adbd2224cb60'; -- EDDY PRUDENCIO (A20)
UPDATE operacion SET nro_recibo = 587 WHERE id = '80f6b4ba-1552-8c06-132a-a7f3e1af504f'; -- JEFFERSON SEVERINO (A21)
UPDATE operacion SET nro_recibo = 588 WHERE id = '7e111bf4-d5a3-e985-b532-b53a537933ba'; -- MARGARITA LEON CONDE (A22)
UPDATE operacion SET nro_recibo = 589 WHERE id = 'dce9a770-4e06-df91-c3fe-da02e81f58f9'; -- JUAN CARLOS RAZURI MONJA (A23)
UPDATE operacion SET nro_recibo = 590 WHERE id = 'f14c578b-dd1a-df59-c959-6b946ee6385b'; -- MIRTHA ROSA ALANYA HUAMAN (A24)

-- Mes 10 (OCTUBRE 2026)
UPDATE operacion SET nro_recibo = 591 WHERE id = '01a11c43-d56c-77a4-8c96-ebd260aeef3c'; -- CIRILO ENRIQUE
UPDATE operacion SET nro_recibo = 592 WHERE id = '01a119e9-124b-7b68-8c04-55d6591bc797'; -- ANABEL MARIA
UPDATE operacion SET nro_recibo = 593 WHERE id = '01a11c43-d621-71f9-9202-9270fe7a6cf9'; -- DORIS HAYDEE
UPDATE operacion SET nro_recibo = 594 WHERE id = '01a11c43-d6ab-7f02-b20b-d8e149697a63'; -- ADELA
UPDATE operacion SET nro_recibo = 595 WHERE id = '01a11c46-7f46-71f7-894a-dcc274191971'; -- ADELA
UPDATE operacion SET nro_recibo = 596 WHERE id = '01a11c46-9371-756e-af83-72c2c8800494'; -- ADELA
UPDATE operacion SET nro_recibo = 597 WHERE id = '01a11c43-d79b-7a7b-b779-3b72ee21b86e'; -- JULIAN
UPDATE operacion SET nro_recibo = 598 WHERE id = '01a11c43-d855-73f8-9c60-58f4077451ad'; -- ALICIA
UPDATE operacion SET nro_recibo = 599 WHERE id = '01a11c43-d928-78bf-9b8f-07511da3f24e'; -- JUAN CARLOS
UPDATE operacion SET nro_recibo = 600 WHERE id = '01a11c43-d9ef-7066-bc89-f9c1c31b90bf'; -- ALEJANDRA SILVIA
UPDATE operacion SET nro_recibo = 601 WHERE id = '01a11c43-daa4-739c-8f1c-3b59935d3783'; -- ELIZABETH VANESSA
UPDATE operacion SET nro_recibo = 602 WHERE id = '01a11c43-dacc-75fe-bf44-44aa77ec8f13'; -- MARGARITA
UPDATE operacion SET nro_recibo = 603 WHERE id = '01a11c43-db51-7f3a-befe-a33190027230'; -- MIRTHA ROSA
UPDATE operacion SET nro_recibo = 604 WHERE id = '01a11c43-dc7d-7685-acaa-f3dd345e9eb9'; -- YESSENIA
UPDATE operacion SET nro_recibo = 605 WHERE id = '01a11c43-dcc7-7cdf-832c-9e5cfd67d819'; -- RAUL
UPDATE operacion SET nro_recibo = 606 WHERE id = '01a11c43-dd01-7d77-b861-a78313f8464a'; -- OMAR
UPDATE operacion SET nro_recibo = 607 WHERE id = '01a11c43-dd43-77fc-83b3-8e8ce2ecea16'; -- EDDY
UPDATE operacion SET nro_recibo = 608 WHERE id = '01a11c43-dd7b-7be8-ab32-0aec8603e57c'; -- JEFFERSON

-- 5. Reemplazar índice de periodo por índice único global en toda la caja
DROP INDEX IF EXISTS ux_operacion_periodo_recibo;
DROP INDEX IF EXISTS ux_operacion_recibo;

CREATE UNIQUE INDEX ux_operacion_recibo ON operacion (caja_id, nro_recibo)
  WHERE nro_recibo IS NOT NULL AND estado = 'VIGENTE';

-- Reactivar trigger de periodo cerrado
ALTER TABLE operacion ENABLE TRIGGER trg_operacion_periodo_cerrado;
