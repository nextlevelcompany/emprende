# Preguntas Abiertas y Supuestos de Negocio — Caja Emprende Chambala

Este documento registra las ambigüedades detectadas en el análisis del libro Excel `Libro CAJA EMPRENDE CHAMBALA 2024-2025` y los supuestos de diseño adoptados por el equipo de arquitectura.

---

## 1. Ambigüedades del Excel y Supuestos Adoptados

### 1.1 "Red S/." (egresos) y "Reservas" (ingresos)
- **Pregunta:** ¿A qué entidad o fin corresponden exactamente "Red S/." y "Reservas"?
- **Supuesto adoptado:**
  - `RESERVA` (Ingreso, código `RESERVA`): Provisión periódica comunal o fondo de contingencia que se retiene o aporta. No requiere socio obligatorio (`requiere_socio = false`).
  - `RED` (Egreso, código `RED`): Gasto o aporte asociativo a la federación/red de cajas comunales de segundo piso. Es un egreso institucional de la caja, sin socio asignado (`requiere_socio = false`).
- **Estado:** Pendiente de ratificación con el administrador de la caja.

### 1.2 "Interés Pagado" (egreso)
- **Pregunta:** ¿El egreso "Interés Pagado" corresponde al rendimiento pagado a los socios por sus cuentas de ahorros, o a un préstamo externo contraído por la caja?
- **Supuesto adoptado:**
  - `INTERES_PAGADO` (Egreso, código `INTERES_PAGADO`): Retribución a socios por sus depósitos de ahorros. Por defecto se asocia a un socio (`requiere_socio = true`), pero admite nulo en caso de liquidaciones grupales históricas.
- **Estado:** Pendiente de confirmación.

### 1.3 Fórmulas con referencias rotas o inconsistentes en el Excel
- **Problema detectado:** Varias hojas mensuales enlazan celdas de hojas arbitrarias (ej. la hoja `SEPTIEMBRE 2026` enlaza acumulados con `'MAY 24'` y `'AGOSTO 25'`, o fórmulas con rangos truncados como `=SUM(G18:G18)`).
- **Decisión:** **Ningún total, acumulado o saldo del Excel será migrado ciegamente.** La base de datos es la única fuente de verdad contable calculada de forma acumulativa a partir de las transacciones atómicas individuales en `operacion_detalle`. Durante la migración se emitirá un informe de conciliación con cada diferencia encontrada.
- **Estado:** Decisión técnica cerrada (ver ADR 003).

### 1.4 Normalización de nombres de socios y filas pseudo-socio
- **Problema detectado:** Nombres inconsistentes entre hojas (ej. `"Ivan Tello"` vs `"EXTERNO IVAN TELLO"`, variaciones en tildes y mayúsculas) y filas especiales como `"REMANENTE"`, `"SALDOS DE UTILIDAD"`, `"Egresos de utilidades"`.
- **Decisión:**
  - Se creará un catálogo maestro unificado de personas con su tipo (`SOCIO` o `EXTERNO`) y una tabla de mapeo de alias (`alias_socio`).
  - Las filas que no corresponden a un socio específico se catalogarán como operaciones institucionales de caja bajo los conceptos `OTRO_INGRESO` u `OTRO_EGRESO`, con trazabilidad en el campo `origen_ref`.
- **Estado:** En proceso de construcción para el módulo de migración (Fase 7).

### 1.5 Saldos anteriores y Arqueos en 0 o no registrados
- **Problema detectado:** Varios meses históricos no tienen registrado el efectivo físico o los depósitos bancarios del arqueo, y el saldo inicial en algunas hojas aparece en cero o hardcodeado.
- **Decisión:**
  - Se define el parámetro `SALDO_INICIAL_CAJA = 0.00` para el arranque de la caja en julio 2023.
  - Para los meses históricos sin arqueo físico, se registrará el registro de `arqueo_caja` con observación `"Sin arqueo físico registrado en Excel original"`, sin bloquear el cálculo contable del sistema.
- **Estado:** Decisión técnica cerrada.

### 1.6 Hojas ocultas (Ene–Oct)
- **Pregunta:** Las 10 hojas ocultas nombradas de enero a octubre parecen una plantilla previa sin continuidad cronológica. ¿Deben incluirse en la contabilidad histórica?
- **Supuesto adoptado:** No se importan a la contabilidad oficial de la caja, para no generar distorsiones en los saldos. Se conservan como respaldo documental.
- **Estado:** Pendiente de confirmación con el administrador.

### 1.7 Fechas de egresos en formato texto
- **Problema detectado:** Egresos con fechas registradas como texto arbitrario (ej. `07.06.24`, `08/09/2026`) o con años inconsistentes.
- **Decisión:** El parser de migración aplicará una heurística de formatos múltiples (`dd.MM.yy`, `dd/MM/yyyy`, `yyyy-MM-dd`); si la fecha es inválida o no corresponde al mes de la hoja, se asignará la fecha oficial de reunión mensual del periodo (día 8 de ese mes).
- **Estado:** Decisión técnica cerrada.
