# ADR 008: Dashboard Comunal, Reportes Oficiales de Asamblea y Pista de Auditoría Inmutable

## Estado
Aceptado

## Contexto
La Caja Comunal "Emprende Chambala" requiere herramientas analíticas y de auditoría para la toma de decisiones por parte de la directiva y la rendición de cuentas transparente ante la asamblea general de socios:
1. **Dashboard de Analíticas ([`/dashboard/analytics`](file:///C:/Proyectos/Emprende/frontend/src/app/(layout-pages)/dashboard/analytics/page.tsx))**: Reemplazar los componentes y datos simulados de la plantilla por métricas financieras consolidadas reales (saldo de caja en bóveda, evolución mensual de ingresos y egresos, rendimiento por intereses, volumen de aportes de capital social en acciones y estado de cartera de créditos).
2. **Reportes Oficiales de Asamblea ([`/admin/reportes`](file:///C:/Proyectos/Emprende/frontend/src/app/(layout-pages)/admin/reportes/page.tsx))**:
   - **Libro de Caja Consolidado por Periodo**: Estructura oficial idéntica al libro de caja comunal (con desglose de depósitos/retiros de ahorros, pagos de capital e intereses, acciones, tardanzas, reservas, préstamos colocados, gastos administrativos y utilidades) formateado para lectura y apto para impresión en hojas de acta.
   - **Estado de Cuenta Individual por Socio**: Detalle de aportes por acciones, ahorros vigentes, préstamos solicitados y amortizados, dividendos anuales percibidos e historial de transacciones.
3. **Pista de Auditoría Inmutable ([`/admin/auditoria`](file:///C:/Proyectos/Emprende/frontend/src/app/(layout-pages)/admin/auditoria/page.tsx))**:
   - Consulta y visualización de la tabla `audit_log`, la cual cuenta con blindaje a nivel de base de datos (`fn_audit_inmutable` que impide `UPDATE` o `DELETE`).
   - Trazabilidad de accesos (logins), creación y anulación de operaciones de caja, desembolsos de créditos, y aprobación/pago de dividendos anuales.

## Decisiones Técnicas

### 1. Aprovechamiento de Vistas SQL Nativas de PostgreSQL
El esquema relacional cuenta con vistas precalculadas de alto rendimiento:
* `v_libro_caja_mensual`: Consolida los 14 conceptos clave de ingresos y egresos por periodo.
* `v_saldo_caja`: Calcula con funciones de ventana (`OVER w_prev`, `OVER w_acum`) el saldo anterior y saldo acumulado por periodo.
* `v_acciones_socio`: Calcula las acciones y capital social consolidado por socio según el parámetro vigente de valor por acción (S/. 30.00).
* `v_prestamo_saldo`: Resume capital prestado, saldo pendiente de amortización y cuotas vencidas.

El backend consultará estas vistas mediante repositorios dedicados y proyecciones nativas para respuestas ultrarrápidas (< 50ms).

### 2. Módulo de Reportes en Backend (`com.cajachambala.reportes`)
Se crea un módulo desacoplado con:
* `ReportesService`: Servicio transaccional de sólo lectura (`@Transactional(readOnly = true)`) que sintetiza los KPIs para el dashboard, el consolidado de asamblea y los estados de cuenta individuales.
* `ReportesController`: Expone endpoints bajo `/api/v1/reportes/`:
  - `GET /dashboard`: KPIs globales y serie temporal mensual para gráficos.
  - `GET /asamblea/periodo/{id}`: Formato oficial de acta mensual.
  - `GET /socio/{socioId}`: Estado de cuenta completo de un socio.
  - `GET /cartera`: Resumen global de colocaciones y morosidad.

### 3. Módulo de Auditoría (`com.cajachambala.identidad`)
* `AuditoriaController`: Expone `GET /api/v1/auditoria` con paginación (`Pageable`) y filtros opcionales por acción y entidad.
* Se mapea el DTO `AuditLogDto` exponiendo `id`, `occurredAt`, `actorRole`, `accion`, `entidad`, `entidadId`, `antes`, `despues`, `ip`, `userAgent`.
* Acceso restringido a usuarios con rol `ADMIN` y `DIRECTIVO`.

### 4. Frontend con Componentes Oficiales de la Plantilla (`pulse-ui-next`)
* Se utilizan estrictamente los componentes UI existentes en `@/components/ui/*`:
  - Tarjetas y contenedores: `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardDescription`.
  - Gráficos: `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent` con `recharts` (`AreaChart`, `BarChart`).
  - Tablas: `Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell`.
  - Estados y Filtros: `Badge`, `Select`, `Input`, `Button`, `Tabs`, `Dialog`.
* Se evita cualquier parpadeo de pantalla mediante estados de carga suaves (`Skeleton`) y caching local con React Hooks.

## Consecuencias
* **Positivas**:
  - Transparencia total para la asamblea de socios: reportes descargables e imprimibles en segundos.
  - El dashboard `/dashboard/analytics` pasa de ser una plantilla vacía a una herramienta gerencial con datos financieros vivos.
  - Trazabilidad y no-repudio total mediante la pista de auditoría inmutable.
* **Mitigación**:
  - Consultas pesadas: Las vistas relacionales indexadas en `periodo_id`, `caja_id` y `socio_id` mantienen los tiempos de cómputo por debajo de 50ms.
