# ADR 003: Integridad Contable, Inmutabilidad y Row Level Security (RLS)

- **Estado:** Aceptado
- **Fecha:** 2026-10-05
- **Autor:** Arquitecto de Software / Tech Lead

---

## Contexto
Una caja comunal de ahorro y crédito maneja dinero de familias y socios. Cualquier inconsistencia en saldos, alteración de registros pasados o fuga de datos entre socios (o entre cajas) destruye la confianza y tiene implicancias legales. 
El libro Excel original contenía errores de fórmulas, referencias rotas y no ofrecía ninguna garantía de inmutabilidad ni de auditoría.

---

## Decisiones de Diseño

### 1. Representación de Dinero y Cálculos
- En PostgreSQL: Siempre **`numeric(14,2)`** para importes monetarios y **`numeric(6,4)`** para tasas de interés. Queda prohibido el uso de tipos de coma flotante (`float`, `double`, `real`).
- En Java: Tipo de valor específico **`Dinero`** envolviendo `BigDecimal`, con escala obligatoria de 2 decimales y modo de redondeo explícito **`RoundingMode.HALF_UP`** (estándar bancario peruano).

### 2. Modelo Contable Sin Borrado Físico (Soft-Delete / Anulación Lógica)
- Las tablas contables (`operacion`, `operacion_detalle`, `cierre_periodo`, `arqueo_caja`) no admiten `DELETE` físico.
- El usuario `app_rw` de la base de datos tiene revocado el permiso `DELETE` sobre las tablas contables mediante `REVOKE DELETE`.
- Las operaciones erróneas se **anulan lógicamente** (`estado = 'ANULADA'`), registrando obligatoriamente el usuario que anula (`anulado_por`), la fecha (`anulado_at`) y el motivo detallado (`motivo_anulacion`).

### 3. Inmutabilidad de Periodos Cerrados
- Cuando un mes es cerrado por el Administrador:
  1. Se calcula una fotografía de totales en `cierre_periodo`.
  2. Se genera un **hash SHA-256 de integridad** con el detalle de las operaciones del mes.
  3. Un **trigger a nivel de base de datos (`fn_bloquear_periodo_cerrado`)** impide cualquier `INSERT`, `UPDATE` o `DELETE` tanto en `operacion` como en `operacion_detalle` para periodos en estado `CERRADO`.
  4. La reapertura de un periodo es una acción excepcional restringida a `ROLE_ADMIN`, que requiere justificación escrita y queda registrada en `audit_log`.

### 4. Row Level Security (RLS) en PostgreSQL como Defensa en Profundidad
- Todas las tablas principales activan `ROW LEVEL SECURITY` y `FORCE ROW LEVEL SECURITY`.
- Al inicio de cada transacción, el backend ejecuta:
  ```sql
  SELECT set_config('app.caja_id', :cajaId, true),
         set_config('app.role', :rol, true),
         set_config('app.socio_id', :socioId, true);
  ```
- **Políticas RLS:**
  - `socio_self` / `operacion_self` / `prestamo_self`: Un socio logueado **solo puede consultar sus propios registros**. No existe posibilidad de vulnerabilidad IDOR (Insecure Direct Object Reference) en consultas SQL directas.
  - `admin`: Tiene visibilidad global limitada a su `caja_id` (aislamiento multi-tenant estricto mediante claves compuestas).

### 5. Auditoría Append-Only
- La tabla `audit_log` es de estricta inserción.
- Un trigger `BEFORE UPDATE OR DELETE` arroja una excepción fatal si se intenta alterar o purgar un registro de auditoría.
- Se registran eventos de autenticación, transacciones contables, cambios de roles, cierres de periodos y exportaciones.

### 6. Protección de Datos Personales (Ley N.º 29733)
- El DNI del socio no se almacena en texto plano en la base de datos:
  - `documento_enc`: DNI cifrado con AES-256-GCM a nivel de aplicación mediante clave rotativa.
  - `documento_hash`: HMAC-SHA256 para búsquedas por coincidencia exacta y constraint `UNIQUE`.

---

## Consecuencias

### Positivas:
- Cero riesgo de alteración retroactiva inadvertida de balances o saldos.
- Trazabilidad forense completa de cualquier movimiento o anulación.
- Cumplimiento de estándares bancarios y de la Ley de Protección de Datos Personales en Perú.

### Negativas / Mitigaciones:
- Sobrecarga de configuración de variables de sesión en cada transacción JDBC. Se mitiga mediante un interceptor o `ConnectionCallback` en Spring Data JPA sin impacto apreciable de latencia.
