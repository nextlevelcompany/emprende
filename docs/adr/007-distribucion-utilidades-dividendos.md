# ADR 007: Distribución Anual de Utilidades y Liquidación de Dividendos por Acciones

## Estado
**Aceptado** (Fase 5 - Distribución Anual de Utilidades)

## Contexto
La Caja Comunal "Emprende Chambala" distribuye anualmente los excedentes netos de su ejercicio contable entre sus socios activos.
En el modelo comunal tradicional:
1. El capital social de la caja está estructurado en acciones con un valor nominal unitario de S/. 30.00 (parámetro `VALOR_ACCION`).
2. Los socios adquieren acciones a lo largo del año mediante aportes al concepto `ACCION`.
3. Al término de cada ejercicio anual (generalmente con fecha de corte al 31 de diciembre), la directiva determina la utilidad total neta acumulada generada por los intereses de préstamos y operaciones.
4. Las utilidades se distribuyen de forma estrictamente proporcional al número de acciones que posee cada socio al momento del corte.
5. Históricamente, este cálculo se realizaba manualmente en hojas de cálculo auxiliares y se registraba el pago global en la columna "Utilidad Distrib." del libro de caja, existiendo riesgo de discrepancias de redondeo y falta de trazabilidad socio por socio.

---

## Decisiones de Arquitectura

### 1. Modelo de Datos y Cómputo Proporcional
Se aprovecha la estructura ya normalizada en PostgreSQL:
- **`distribucion_utilidad`**:
  - `ejercicio`: Año contable (ej. 2024, 2025). Clave única compuesta `(caja_id, ejercicio)`.
  - `fecha_corte`: Fecha límite de tenencia de acciones.
  - `utilidad_total`: Monto global aprobado para repartición en PEN.
  - `total_acciones`: Suma total de acciones de los socios participantes ($> 0$).
  - `valor_por_accion`: Columna generada en BD con precisión `numeric(14,6)`:
    $$\text{valor\_por\_accion} = \frac{\text{utilidad\_total}}{\text{total\_acciones}}$$
  - `estado`: Enum `distribucion_estado` (`BORRADOR`, `APROBADA`, `PAGADA`).
- **`distribucion_utilidad_detalle`**:
  - Detalle por cada socio con `acciones`, `monto` a cobrar y `operacion_id` (FK a la transacción de caja que materializa el pago).

### 2. Algoritmo de Reparto y Cuadratura al Centavo
Dado el monto total $U$, el total de acciones $A_{tot}$ y las acciones de cada socio $a_i$:
1. Dividendo base por acción a 6 decimales:
   $$v = U / A_{tot}$$
2. Para cada socio $i \in [1, M-1]$:
   $$m_i = \text{round}(a_i \times v, 2)$$
3. Para el último socio $M$ (o el socio con mayor participación):
   $$m_M = U - \sum_{k=1}^{M-1} m_k$$
   Esto garantiza matemáticamente que $\sum_{i=1}^M m_i = U$, sin diferencias de céntimos en el balance de caja.

### 3. Ciclo de Vida y Transición de Estados
1. **`BORRADOR`**:
   - Permite proyectar la distribución antes de la asamblea comunal.
   - El sistema calcula sugerencias de acciones a partir de las compras acumuladas de los socios:
     $$\text{acciones\_socio} = \left\lfloor \frac{\sum \text{Aportes concepto ACCION}}{\text{VALOR\_ACCION}} \right\rfloor$$
   - La directiva puede ajustar manualmente la lista de socios o el número de acciones según acuerdos de asamblea.
2. **`APROBADA`**:
   - La directiva sella formalmente el padrón de reparto y los montos individuales aprobados por la asamblea.
3. **`PAGADA`**:
   - Al ejecutar el pago, el sistema solicita el **Periodo Contable Activo** donde se registrarán los egresos (ej. Diciembre o Enero siguiente).
   - Se crea atómicamente una transacción de `EGRESO` en `operacion` para cada socio:
     - Tipo: `EGRESO`.
     - Concepto: `UTILIDAD_DISTRIBUIDA` (id 5, tipo `EGRESO`).
     - Monto: $m_i$.
     - Descripción: `"Pago de utilidades ejercicio [Año] - [Nombre Socio] ([Acciones] acciones)"`.
   - Se vincula cada `operacion.id` en `distribucion_utilidad_detalle.operacion_id`.
   - La distribución pasa a estado `PAGADA`.

### 4. Seguridad, Visibilidad y Auditoría
- Row-Level Security forzado:
  - `distrib_admin`: Los administradores pueden gestionar las distribuciones de su caja.
  - `distrib_det_self`: Cada socio autenticado solo puede visualizar su propio detalle de utilidades asignadas.
- Cada cambio de estado y generación de pagos queda registrado en la tabla append-only `audit_log`.

---

## Consecuencias y Beneficios
1. **Trazabilidad 100% Individual**: Cada dividendo pagado tiene su propia transacción de egreso identificable en el libro de caja con el socio beneficiario y la cantidad de acciones que lo respaldan.
2. **Cuadratura Exacta**: La regla de ajuste en la última fila elimina discrepancias entre la utilidad aprobada por asamblea y la suma de egresos de caja.
3. **Transparencia Patrimonial**: Los socios pueden consultar en su portal el rendimiento anual de sus acciones y el monto percibido.
