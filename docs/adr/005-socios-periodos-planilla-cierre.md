# ADR 005: Padrón de Socios, Periodos Contables, Planilla Mensual y Cierre Inmutable

## Estado
**Aceptado** (Fase 3 - Socios y Periodos)

## Contexto
El libro contable histórico de la "Caja Comunal Emprende Chambala" operaba en un libro de Microsoft Excel con una hoja por cada mes contable. En cada hoja, cada socio ocupaba una fila identificada por un número de recibo correlativo, con 14 columnas divididas en Ingresos (Ahorro, Pago Capital, Interés Recibido, Acciones, Tardanza/Multa, Reservas, Total Ingreso) y Egresos (Retiro Ahorro, Préstamo, Interés Pagado, Gasto Admin, Utilidad, Red, Otros Egresos, Total Egreso), finalizando con un resumen de Saldo Anterior, Total Ingresos, Total Egresos, Saldo Final y Arqueo físico de caja.

La migración a una plataforma transaccional de producción demandaba resolver desafíos críticos:
1. **Protección de Datos Personales (Ley N.° 29733 de Perú)**: El número de documento (DNI/CE) de los socios no debe residir en texto plano en la base de datos, pero el sistema debe impedir registros duplicados y permitir búsquedas exactas eficientes.
2. **Integridad Financiera y No-Borrado**: Las filas contables no pueden ser eliminadas físicamente (`DELETE`). Los errores humanos de digitación deben resolverse mediante anulación lógica auditada.
3. **Inmutabilidad y Sellado Criptográfico**: Una vez cerrada la asamblea mensual, ningún usuario ni administrador debe poder alterar los números retrospectivamente sin un mecanismo de auditoría riguroso.
4. **Continuidad de Saldos**: El saldo final de un mes debe convertirse en el saldo inicial del siguiente periodo sin discrepancias de redondeo.

---

## Decisiones de Arquitectura

### 1. Cifrado Híbrido de Documentos de Identidad (AES-256-GCM + HMAC-SHA256)
- Se implementó un esquema de doble capa a nivel de aplicación (`AesGcmCryptoService`):
  - **`documento_enc` (`bytea`)**: Contiene el documento cifrado con AES-256 en modo Galois/Counter Mode (GCM) con vector de inicialización (IV) de 12 bytes y etiqueta de autenticación (tag) de 128 bits. Solo el backend en posesión de la clave maestra puede descifrarlo en memoria.
  - **`documento_hash` (`char(64)`)**: Contiene el HMAC-SHA256 del documento normalizado utilizando una clave secreta del servidor. Esto permite mantener un índice único parcial en PostgreSQL (`ux_socio_documento`) y realizar búsquedas por coincidencia exacta en $O(1)$ sin exponer el documento en claro.
- En las respuestas API y pantallas públicas, el documento se enmascara (ej. `1234****`).

### 2. Modelo Normalizado Cabecera-Detalle
- En lugar de crear una tabla "ancha" con 14 columnas numéricas propensa a valores nulos y rigidez ante nuevos conceptos, se separó en:
  - **`operacion`**: Cabecera con tenant `caja_id`, `periodo_id`, `socio_id`, `tipo` (`INGRESO`/`EGRESO`), `fecha`, `nro_recibo`, `descripcion`, y campos de anulación lógica (`estado`, `anulado_at`, `anulado_por`, `motivo_anulacion`).
  - **`operacion_detalle`**: Detalle transaccional normalizado con `concepto_id` y `monto` (`numeric(14,2)`). Clave foránea compuesta `(concepto_id, tipo)` que impide registrar un egreso con un concepto de ingreso.
- La planilla mensual del Excel se reproduce fidedignamente mediante agregación de columnas y la vista de base de datos `v_libro_caja_mensual`.

### 3. Inmutabilidad de Periodos Cerrados
- Se garantiza la inmutabilidad a nivel de motor PostgreSQL mediante los triggers:
  - `trg_operacion_periodo_cerrado` sobre `operacion`.
  - `trg_detalle_periodo_cerrado` sobre `operacion_detalle`.
- Si el periodo asociado tiene `estado = 'CERRADO'`, cualquier intento de `INSERT`, `UPDATE` o `DELETE` arroja inmediatamente la excepción `P0001: El periodo está cerrado: no se permiten cambios`.

### 4. Fotografía de Cierre y Hash de Integridad SHA-256
- Al invocar `cerrarPeriodo`:
  - Se consolida el saldo anterior, la suma de ingresos vigentes, egresos vigentes y saldo final.
  - Se genera un desglose consolidado en formato `jsonb` de cada uno de los 14 conceptos.
  - Se calcula una huella digital SHA-256 de 64 caracteres sobre la cadena canónica `cajaId|periodoId|anio|mes|saldoAnterior|totalIngresos|totalEgresos|saldoFinal`.
  - Se almacena el registro en `cierre_periodo` y se pasa el estado a `CERRADO`.
- Si se requiere una reapertura de emergencia:
  - Solo un usuario con rol `ADMIN` puede ejecutarla.
  - Se exige obligatoriamente un motivo justificado en texto.
  - Se registra el evento en `audit_log` (append-only) y se remueve la fotografía para permitir el recalculo tras la corrección.

### 5. Arqueo de Caja Físico y Conciliación
- El módulo `ArqueoCaja` permite a la directiva registrar en asamblea el conteo físico de:
  - `efectivo`: Monedas y billetes contados en mesa.
  - `depositos_bancos`: Comprobantes de transferencias o depósitos bancarios verificados.
- El sistema calcula automáticamente `total_contado = efectivo + depositos_bancos` y la `diferencia = total_contado - saldo_sistema`.
- Una diferencia positiva representa un **sobrante de caja** y una negativa un **faltante de caja**, documentándose en las observaciones.

---

## Consecuencias y Beneficios
1. **Cumplimiento Normativo**: La protección de documentos DNI cumple cabalmente con la Ley de Protección de Datos Personales sin comprometer la indexación ni el desempeño de búsqueda.
2. **Cero Manipulación Retrospectiva**: Ningún recibo puede ser modificado ni eliminado silenciosamente en meses pasados. Todo cambio deja rastro auditable.
3. **Familiaridad Operativa para la Directiva**: La pantalla de la planilla mensual replica de forma exacta la disposición de columnas a la que los dirigentes de la caja están acostumbrados desde el libro de Excel, reduciendo a cero la curva de aprendizaje.
4. **Verificación de Suite**: 100% de tests unitarios y de arquitectura (37/37) passing.
