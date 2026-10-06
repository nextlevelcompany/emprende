# ADR 006: Motor de Préstamos, Cronogramas de Pago y Cobranzas Integradas

## Estado
**Aceptado** (Fase 4 - Préstamos, Cronogramas y Cobranzas)

## Contexto
La Caja Comunal "Emprende Chambala" fundamenta su rentabilidad y servicio a los asociados en el otorgamiento de microcréditos y préstamos productivos. En el sistema histórico de Excel (hoja `CALCULO PRESTAMOS  (4)`), se gestionaban los créditos de forma manual con las siguientes características:
1. Préstamos dirigidos a socios de la caja y clientes externos autorizados.
2. Tasas de interés mensuales típicamente del 5% mensual (0.0500), con variantes preferenciales de 2% o 3% mensual según acuerdo de asamblea.
3. Plazos mensuales generalmente de 1 a 12 cuotas (pudiendo extenderse hasta 60).
4. El método de amortización aplicado es **Capital Fijo con Interés sobre Saldo Deudor** (Amortización Constante o Sistema Alemán), donde el capital se divide equitativamente entre las cuotas y el interés mensual se calcula sobre el saldo remanente.
5. Vencimientos fijos en el día de la asamblea comunal (día 8 de cada mes).
6. Desconexión previa entre el cálculo crediticio y el libro de caja mensual: los desembolsos y cobros de cuotas se anotaban por separado, propiciando errores humanos de conciliación entre la amortización de capital y el interés ganado.

La plataforma requiere un motor de préstamos robusto, automatizado e integrado bidireccionalmente con el libro de caja y la planilla mensual.

---

## Decisiones de Arquitectura

### 1. Algoritmo de Cálculo y Cronograma Proforma (Amortización Constante)
- **Fórmulas de amortización**:
  Dado un monto principal $P$, número de cuotas $N$, y tasa de interés mensual $r$:
  - Cuota de capital base:
    $$C_{base} = \text{round}(P / N, 2)$$
  - Para cada cuota $k \in [1, N-1]$:
    $$C_k = C_{base}$$
  - Para la última cuota $k = N$:
    $$C_N = P - \sum_{i=1}^{N-1} C_i \quad \text{(ajuste exacto de centavos por redondeo)}$$
  - Saldo de capital inicial al inicio de la cuota $k$:
    $$S_{0} = P, \quad S_{k-1} = P - \sum_{i=1}^{k-1} C_i$$
  - Interés mensual de la cuota $k$:
    $$I_k = \text{round}(S_{k-1} \times r, 2)$$
  - Monto total de la cuota mensual $k$:
    $$\text{Cuota}_k = C_k + I_k$$
  - Saldo remanente tras la cuota $k$:
    $$S_k = S_{k-1} - C_k$$
- **Simulador sin persistencia**: Se expone un endpoint `/api/prestamos/simular` para cotizaciones inmediatas en pantalla antes de radicar la solicitud.

### 2. Máquina de Estados del Préstamo
El ciclo de vida del crédito se modela con el enum `PrestamoEstado`:
- **`SOLICITADO`**: Registrado por el socio o directivo. Permite evaluar capacidad crediticia y acciones del socio.
- **`APROBADO`**: Aprobado por la directiva en reunión.
- **`VIGENTE`**: Desembolsado con entrega efectiva de dinero. Cronograma activo para cobranza.
- **`CANCELADO`**: Totalmente amortizado ($100\%$ del capital y de los intereses programados han sido cobrados).
- **`CASTIGADO`**: Cartera vencida incobrable por dictamen de asamblea.
- **`RECHAZADO`**: Solicitud no aprobada por la directiva.

Las cuotas individuales se modelan con `CuotaEstado`:
- **`PENDIENTE`**: No pagada y fecha actual $\le$ fecha vencimiento.
- **`VENCIDA`**: No pagada y fecha actual $>$ fecha vencimiento.
- **`PARCIAL`**: Con abono parcial de capital o interés.
- **`PAGADA`**: Capital e interés cubiertos en su totalidad.

### 3. Integración Atómica con el Libro de Caja
Para mantener la congruencia contable absoluta sin duplicar registros:

#### A. Al Desembolsar el Préstamo (`desembolsar`):
1. El préstamo cambia a estado `VIGENTE` con `fecha_desembolso` y se generan las $N$ filas en `cuota_prestamo`.
2. Se inserta una operación contable en el periodo activo:
   - Cabecera: `operacion` (`tipo = 'EGRESO'`, `socio_id`, `fecha = fecha_desembolso`, `descripcion = 'Desembolso Préstamo #[Nro] - [Socio]'`).
   - Detalle: `operacion_detalle` (`tipo = 'EGRESO'`, `concepto = 'PRESTAMO'`, `monto = monto_principal`, `prestamo_id = id`).

#### B. Al Cobrar una Cuota (`registrarPagoCuota`):
1. Se actualizan los acumuladores de la cuota:
   - `capital_pagado += montoCapital`
   - `interes_pagado += montoInteres`
   - `mora_pagada += montoMora`
   - `fecha_pago = fechaPago`
   - `estado = 'PAGADA'` (si saldo capital e interés pendientes son $0$) o `'PARCIAL'`.
2. Si todas las cuotas del préstamo están `'PAGADA'`, el estado general del crédito pasa a `'CANCELADO'`.
3. Se inserta atómicamente una operación de `INGRESO` en el periodo activo con dos líneas de detalle:
   - Línea 1: `concepto = 'PAGO_CAPITAL'`, `monto = montoCapital`, `prestamo_id`, `cuota_id`.
   - Línea 2: `concepto = 'INTERES_RECIBIDO'`, `monto = montoInteres`, `prestamo_id`, `cuota_id`.
4. El pago impacta directamente en las columnas de "Pago Capital" e "Interés Recibido" de la planilla mensual de la caja.

### 4. Seguridad, Roles y RLS
- **Defensa en Profundidad**: A nivel de base de datos, `prestamo` y `cuota_prestamo` tienen RLS habilitado y forzado.
  - `prestamo_admin`: Rol `ADMIN` puede consultar y gestionar todos los préstamos de su `caja_id`.
  - `prestamo_self`: Rol `SOCIO` solo puede consultar los préstamos donde `socio_id = app_socio_id()`.
  - `cuota_read` y `cuota_admin`: Las cuotas heredan los privilegios de su préstamo cabecera.
- A nivel de Spring Security:
  - Creación, aprobación, desembolso y cobranza restringidos a `ADMIN`.
  - Simulación y consulta de cronogramas disponibles para `ADMIN` y `SOCIO` (su propio cronograma).

---

## Consecuencias y Beneficios
1. **Eliminación de Errores de Conciliación**: El desembolso y el cobro de cuotas impactan automáticamente el flujo de caja del periodo activo sin necesidad de que el tesorero registre dos veces la misma operación.
2. **Exactitud al Centavo**: El ajuste de redondeo de centavos en la última cuota garantiza que la suma de capitales amortizados sea idéntica al principal prestado, preservando la regla de integridad de balance.
3. **Transparencia para los Socios**: Cada socio puede consultar en tiempo real su cronograma de pagos, saldo de capital adeudado y fechas de vencimiento desde el portal web.
