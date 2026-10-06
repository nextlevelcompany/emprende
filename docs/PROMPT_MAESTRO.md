<USER_REQUEST>
# PROMPT MAESTRO — Sistema "Caja Emprende Chambala"

> Pega este documento completo en tu agente de código (Claude Code, Cursor, etc.). Está pensado para ejecutarse **por fases**; no pidas todo en un solo paso.

---

## 0. Rol e instrucciones de trabajo

Actúa como **arquitecto de software senior y tech lead** (Java/Spring, Next.js, PostgreSQL, DevSecOps). Vas a construir desde cero una aplicación web que reemplaza el libro Excel `Libro CAJA EMPRENDE CHAMBALA 2024-2025`, con foco en **seguridad, integridad contable y escalabilidad**.

Reglas de trabajo:

1. Trabaja por **fases** (sección 12). Al terminar cada fase: resume lo hecho, ejecuta los tests y espera mi confirmación.
2. Si una regla de negocio es ambigua, **no inventes**: anótala en `docs/PREGUNTAS_ABIERTAS.md` y propón una opción por defecto. Las ambigüedades conocidas están en la sección 1.5.
3. Todo el código, commits y documentación técnica en **español** para el dominio (nombres de entidades del negocio: `socio`, `prestamo`, `periodo`) e **inglés** para términos técnicos estándar.
4. Nunca incluyas secretos, contraseñas ni datos reales de socios en el repositorio. Usa variables de entorno y datos de prueba ficticios.
5. Cada decisión de diseño no trivial se documenta en `docs/adr/NNN-titulo.md` (formato ADR corto).

---

## 1. Contexto del negocio (extraído del Excel)

### 1.1 Qué es
Una **caja comunal de ahorro y crédito** ("Emprende Chambala") en Perú. Moneda: **soles (S/., PEN)**. Los socios se reúnen **una vez al mes (día 8)**; en esa reunión se registran todos los ingresos y egresos del mes. El Excel tiene **una hoja por mes** (desde julio 2023 hasta septiembre 2026, 39 hojas visibles + 10 hojas ocultas de una plantilla antigua) y una hoja **"CALCULO PRESTAMOS"** con los cronogramas de pagos de cada préstamo. Hay aproximadamente 25–30 socios y algunos **externos** (personas no socias a quienes se les prestó dinero).

### 1.2 Estructura de cada hoja mensual
**Lado izquierdo — INGRESOS** (una fila por socio/recibo; la columna "Día" contiene en realidad un **correlativo de recibo** que continúa mes a mes: 1, 2, … 154, … 506):

| Columna Excel | Concepto | Código en BD |
|---|---|---|
| Depósito Ahorros | ahorro voluntario del socio | `DEPOSITO_AHORRO` |
| Pagos de Capital | abono a capital de préstamo | `PAGO_CAPITAL` |
| Intereses Recibidos | interés cobrado por préstamos | `INTERES_RECIBIDO` |
| Acciones | compra de acciones (múltiplos de S/ 30 → una columna auxiliar calcula `acciones/30`) | `ACCION` |
| Otros / Tardanza | multas por llegar tarde y otros | `MULTA_TARDANZA` |
| Reservas | aporte a reserva | `RESERVA` |
| Total Ingresos | `=SUM(...)` | calculado |

**Lado derecho — EGRESOS:** Retiros Ahorros (`RETIRO_AHORRO`), Préstamos desembolsados (`PRESTAMO`), Interés Pagado (`INTERES_PAGADO`), Gastos Admin. (`GASTO_ADMIN`), Utilidad Distribuida (`UTILIDAD_DISTRIBUIDA`), Otros (`OTRO_EGRESO`), Red (`RED`), Total Egresos.

**Pie de hoja:** Total del mes → Acumulados al mes anterior (enlazado a la hoja previa) → Total acumulado a la fecha; **Saldo de caja** (saldo anterior + ingresos − egresos) y **Arqueo de caja** (efectivo + depósitos en bancos/cooperativas vs. saldo → sobrante/faltante).

### 1.3 Préstamos (hoja "CALCULO PRESTAMOS")
- Datos: socio, monto, número de cuotas (1 a 12), **tasa mensual** (observadas: 2 %, 3 % y 5 %), fecha de desembolso.
- **Método:** capital fijo por cuota (`monto / n_cuotas`, la última cuota absorbe el saldo/redondeo) e **interés mensual = saldo de capital pendiente × tasa**. Cuota = capital + interés. Se marca cada cuota como "PAGADO".
- Se presta también a **externos**.

### 1.4 Reglas de negocio a respetar
- Los ingresos/egresos **nunca se borran**; se **anulan** con motivo y quedan auditados.
- Un **periodo cerrado es inmutable** (se cierra con una foto de totales + hash de integridad).
- **Saldo de ahorro del socio** = Σ depósitos − Σ retiros.
- **Acciones del socio** = Σ monto de acciones / valor de acción (S/ 30, parametrizable).
- **Utilidad anual** se distribuye en proporción a las acciones de cada socio.
- Saldo de caja del mes = saldo anterior + ingresos − egresos; el arqueo compara contra lo contado físicamente.

### 1.5 Ambigüedades y problemas detectados en el Excel (resolver en la migración)
1. "Red S/." (egresos) y "Reservas" (ingresos): confirmar significado exacto con el administrador.
2. "Interés Pagado" (egreso): se asume interés pagado a socios por sus ahorros; confirmar.
3. Hay **fórmulas con referencias rotas o inconsistentes** (ej.: la hoja `SEPTIEMBRE 2026` enlaza acumulados con `'MAY 24'` y `'AGOSTO 25'`; algunos totales suman rangos distintos, p. ej. `=SUM(G18:G18)` en lugar de `D:G`). **No migres totales del Excel: recalcúlalos en el sistema** y genera un reporte de diferencias.
4. Nombres de socios inconsistentes entre hojas (mayúsculas, apellidos truncados, "Ivan Tello" vs "EXTERNO IVAN TELLO") y filas pseudo-socio ("REMANENTE", "SALDOS DE UTILIDAD", "Egresos de utilidades"): normalizar con una tabla de equivalencias revisada por el administrador.
5. "Saldo del mes anterior" y "Arqueo" están en `0` o hardcodeados en muchas hojas.
6. Las 10 hojas ocultas (Ene–Oct) parecen plantilla antigua: confirmar si contienen datos.
7. Fechas de egresos escritas como texto (`07.06.24`, `08/09/2026`) y algunas con año erróneo.

---

## 2. Stack y arquitectura

| Capa | Tecnología |
|---|---|
| Backend | **Java 21 (LTS)**, **Spring Boot 3.4+**, Spring Web, Spring Security 6, Spring Data JPA (Hibernate 6), Bean Validation, **Flyway**, MapStruct, springdoc-openapi, Micrometer + Actuator |
| Frontend | **Next.js 15 (App Router) + React 19 + TypeScript estricto**, Tailwind CSS + shadcn/ui, TanStack Query, React Hook Form + Zod, Recharts |
| Base de datos | **PostgreSQL 17** (mínimo 16) |
| Contenedores | Docker + Docker Compose (dev), imágenes multi-stage, usuario no-root, `HEALTHCHECK` |
| Pruebas | JUnit 5, Testcontainers (PostgreSQL real), ArchUnit, Vitest, Testing Library, Playwright (E2E) |
| CI/CD | GitHub Actions: build, tests, SAST (CodeQL), dependencias (Dependabot + OWASP Dependency-Check / Trivy), escaneo de imágenes |

### 2.1 Monorepo
```
caja-chambala/
├─ backend/                 # Spring Boot (arquitectura hexagonal / por módulos)
├─ frontend/                # Next.js
├─ docker/                  # Dockerfiles, init de postgres, nginx opcional
├─ docs/                    # adr/, api/, runbooks/
├─ scripts/                 # migración Excel, utilidades
├─ docker-compose.yml       # dev
├─ docker-compose.prod.yml  # referencia de producción
└─ .github/workflows/
```

### 2.2 Backend: módulos (Spring Modulith o paquetes con ArchUnit)
`identity` (auth, usuarios, MFA) · `socios` · `caja` (periodos, operaciones, arqueo, cierre) · `prestamos` (cronogramas, cobranza) · `ahorros` · `utilidades` · `reportes` · `auditoria` · `migracion` · `shared` (dinero, errores, seguridad).
Capas por módulo: `api` (controllers + DTOs) → `application` (casos de uso, transacciones) → `domain` (entidades y reglas puras) → `infrastructure` (JPA, adaptadores). Los controllers **nunca** exponen entidades JPA.

### 2.3 ⚠️ Despliegue y Vercel (decisión de arquitectura obligatoria)
**Vercel solo hospeda el frontend Next.js.** No ejecuta contenedores Docker persistentes, ni un backend Java, ni PostgreSQL. Por lo tanto:

- **Frontend (Next.js)** → **Vercel**.
- **Backend (imagen Docker de Spring Boot)** → un servicio de contenedores: Google Cloud Run, AWS ECS/Fargate, Fly.io, Railway o Render.
- **PostgreSQL gestionado** → Neon, Supabase, AWS RDS o Cloud SQL (con backups y PITR).
- Docker Compose se usa para **desarrollo local y CI**, no para producción en Vercel.
- El frontend se comunica con el backend mediante el patrón **BFF** (sección 4.3): el navegador solo habla con Next.js (mismo origen); Next.js reenvía al backend por HTTPS.

Entrega `docs/adr/001-despliegue.md` con la recomendación final y un `README` con los pasos de despliegue de cada pieza.

---

## 3. Requisitos funcionales

### 3.1 Roles
- **ADMIN**: acceso total a su caja.
- **SOCIO** (usuario actual): acceso **solo lectura y solo a su propia información**.

### 3.2 Panel ADMIN
1. **Dashboard**: saldo de caja, ingresos/egresos del mes, cartera de préstamos vigente, mora, ahorros totales, gráficos de evolución mensual.
2. **Socios**: CRUD, búsqueda (trigram), estados, alta de usuario/acceso, reseteo de contraseña, bloqueo.
3. **Periodos**: crear mes (fecha de reunión, por defecto día 8), **registrar operaciones** con una pantalla tipo planilla (una fila por socio con las columnas de ingreso/egreso, igual al Excel), anular operación con motivo, **arqueo**, **cierre de periodo** y reapertura controlada (solo ADMIN, con motivo, auditado).
4. **Préstamos**: solicitud → aprobación → desembolso (genera operación `PRESTAMO` y **cronograma automático**), registro de pagos de cuota (genera operaciones `PAGO_CAPITAL` + `INTERES_RECIBIDO`), estado de cuotas, mora, simulador.
5. **Ahorros y acciones**: saldo y movimientos por socio, acciones acumuladas.
6. **Utilidades**: cálculo de distribución anual proporcional a acciones (borrador → aprobada → pagada).
7. **Reportes**: libro de caja mensual (réplica del Excel), acumulados, estado de cuenta por socio, cartera de préstamos; exportar a **PDF y Excel**.
8. **Auditoría**: visor de `audit_log` con filtros.
9. **Importador del Excel** (sección 10).

### 3.3 Portal SOCIO
Inicio de sesión propio → ver **su** saldo de ahorros, acciones, préstamos con cronograma y cuotas pendientes/pagadas, historial de movimientos, utilidades recibidas y **estado de cuenta descargable en PDF**. Cambio de contraseña y MFA opcional. **Sin** acceso a datos de otros socios ni a datos globales de la caja.

---

## 4. Seguridad (requisitos no negociables — alinear a OWASP ASVS 4.0 nivel 2)

### 4.1 Autenticación
- Dos flujos de login con la misma API pero **pantallas y rutas separadas**: `/admin/login` y `/login` (socios). El backend valida el rol y rechaza cruces.
- Contraseñas con **Argon2id** (Spring Security `Argon2PasswordEncoder`), política mínima de 12 caracteres, verificación contra listas de contraseñas filtradas (k-anonymity), sin reglas de composición arbitrarias.
- **MFA TOTP obligatorio para ADMIN** (opcional para SOCIO), con códigos de recuperación hasheados.
- **Access token JWT** de vida corta (≤ 15 min, firmado con clave asimétrica, claims mínimos: `sub`, `role`, `caja`, `ver`) + **refresh token opaco** de un solo uso con **rotación y detección de reutilización** (si se reutiliza, se revoca toda la `family_id`). Se almacena solo el **hash SHA-256** del refresh token.
- Bloqueo progresivo: tras 5 intentos fallidos → `locked_until` creciente; mensajes de error genéricos (sin enumeración de usuarios); tiempo de respuesta constante.
- `token_version` en `app_user` permite invalidar todas las sesiones (cambio de contraseña, bloqueo).
- Primer inicio de sesión: `must_change_password = true`. Reseteo de contraseña con token de un solo uso (hash en `one_time_token`, caduca en 30 min).

### 4.2 Autorización
- **RBAC** con `@PreAuthorize` en cada caso de uso + **verificación de propiedad** (el SOCIO solo accede a recursos con su `socio_id`; los IDs de la URL nunca se confían).
- **Row Level Security en PostgreSQL** (incluida en el esquema): el backend fija `app.caja_id`, `app.role`, `app.socio_id` con `set_config(..., true)` al inicio de **cada transacción** (aspecto/`ConnectionCallback`). El rol de BD de la aplicación **no** es owner de las tablas ni tiene `BYPASSRLS`.
- Principio de mínimo privilegio en BD: roles `app_owner` (migraciones), `app_rw` (runtime, sin `DELETE` en tablas contables ni `UPDATE` en `audit_log`), `app_ro` (reportes).
- Aislamiento multi-tenant: todas las consultas filtran por `caja_id` y las FKs compuestas impiden cruces.

### 4.3 Frontend y sesión (patrón BFF)
- Los tokens **nunca** se guardan en `localStorage`. El backend/BFF los entrega en cookies `HttpOnly; Secure; SameSite=Strict` (access y refresh con `Path` restringido). El navegador solo llama a rutas `/api/*` de Next.js (Route Handlers/Server Actions), que reenvían al backend.
- `middleware.ts` de Next.js protege `/admin/**` y `/socio/**` según rol; las comprobaciones reales de autorización siguen en el backend.
- Protección **CSRF**: cookies `SameSite=Strict` + token anti-CSRF (double submit) en mutaciones.
- **Cabeceras**: CSP estricta con nonces, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'`.
- Validación con **Zod** en cliente y **Bean Validation** en servidor (la del servidor es la que manda). Sanitizar y escapar toda salida; sin `dangerouslySetInnerHTML`.

### 4.4 API y plataforma
- **Rate limiting** (Bucket4j + Redis opcional) por IP y por usuario, más estricto en `/auth/*`.
- **CORS** restringido al dominio del frontend; el backend **solo acepta tráfico** del BFF (allow-list/mTLS o token de servicio) y no está expuesto directamente al público si la plataforma lo permite.
- Errores con **RFC 9457 (Problem Details)** sin filtrar trazas ni detalles internos.
- **Idempotencia** (`Idempotency-Key`) en creación de operaciones y pagos para evitar duplicados por reintentos.
- Concurrencia: **bloqueo optimista** (`@Version`) en entidades editables y `SELECT … FOR UPDATE` al cerrar periodo/aplicar pagos.
- **Datos personales (Ley N.º 29733, Perú)**: minimización, DNI cifrado (AES-256-GCM a nivel de aplicación) + HMAC para búsqueda/unicidad, consentimiento registrado, derechos ARCO (exportar/anonimizar socio), retención definida.
- **Secretos** en variables de entorno / gestor de secretos (nunca en la imagen). Rotación de claves JWT con `kid` y JWKS.
- **Auditoría**: toda acción sensible (login, cambios de rol, creación/anulación de operaciones, cierre de periodo, exportaciones) escribe en `audit_log` con actor, IP, user-agent y `request_id`.
- Dependencias fijadas y escaneadas; imágenes base mínimas (distroless/alpine), `readOnlyRootFilesystem`, sin privilegios.

---

## 5. Base de datos (PostgreSQL 16+ — script completo)

### 5.1 Lineamientos aplicados
- **UUID** como PK (el backend genera **UUIDv7** para localidad de índices); identidades `GENERATED ALWAYS AS IDENTITY` solo en catálogos.
- **Dinero siempre `numeric(14,2)`** (nunca `float`); tasas `numeric(6,4)`. En Java: `BigDecimal` con `RoundingMode.HALF_UP`, y un tipo de valor `Dinero` en el dominio.
- **`timestamptz`** (UTC) para instantes; `date` para fechas contables. Zona de negocio `America/Lima` solo en presentación.
- **Integridad declarativa**: `CHECK`, `UNIQUE` parciales, FKs compuestas `(caja_id, id)` para impedir fugas entre tenants, FK compuesta `(concepto_id, tipo)` que garantiza que un ingreso solo use conceptos de ingreso.
- **Modelo contable sin borrado**: cabecera `operacion` (equivale a la fila/recibo del Excel) + `operacion_detalle` (una línea por columna/concepto). Normalizado, no "ancho"; el formato del Excel se reproduce con la vista `v_libro_caja_mensual`.
- **Anulación lógica**, cierre de periodo con trigger que bloquea cambios, `audit_log` append-only (trigger + revocación de permisos).
- **RLS + vistas `security_invoker`** como defensa en profundidad.
- **Multi-tenant** (`caja`) desde el día uno para que la plataforma escale a otras cajas comunales sin rediseño.
- Migraciones **solo con Flyway** (`V1__…`, `V2__…`), idempotentes, sin `ddl-auto` de Hibernate (`validate`).
- Datos pequeños hoy; la escalabilidad está en el diseño: índices parciales, vistas sobre agregados, y posibilidad de particionar `operacion` y `audit_log` por año si crecen (documentar en ADR, no implementar aún).

### 5.2 Diagrama lógico (resumen)
```
caja 1──* app_user ──? socio
caja 1──* socio 1──* prestamo 1──* cuota_prestamo
caja 1──* periodo 1──* operacion 1──* operacion_detalle *──1 concepto
operacion *──? socio          operacion_detalle *──? prestamo / cuota_prestamo
periodo 1──1 cierre_periodo   periodo 1──1 arqueo_caja
caja 1──* distribucion_utilidad 1──* distribucion_utilidad_detalle *──1 socio
app_user 1──* refresh_token   app_user 1──* one_time_token
audit_log (append-only)       import_batch 1──* operacion
```

### 5.3 Script `V1__init_schema.sql`
Úsalo **tal cual** como primera migración Flyway (puedes mejorarlo, justificando cada cambio en un ADR). Requiere PostgreSQL 15+ (`NULLS NOT DISTINCT`) y las extensiones `citext` y `pg_trgm`.

```sql
-- =====================================================================
-- V1__init_schema.sql  |  PostgreSQL 16+  |  Caja "Emprende Chambala"
-- Convenciones: snake_case, PK uuid (el backend genera UUIDv7),
-- dinero numeric(14,2) en PEN, fechas timestamptz (UTC), sin DELETE físico
-- en datos contables (anulación lógica), multi-tenant por caja_id.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------- Tipos ----------
CREATE TYPE user_role           AS ENUM ('ADMIN', 'SOCIO');
CREATE TYPE user_status         AS ENUM ('PENDIENTE', 'ACTIVO', 'BLOQUEADO', 'INACTIVO');
CREATE TYPE socio_tipo          AS ENUM ('SOCIO', 'EXTERNO');
CREATE TYPE socio_estado        AS ENUM ('ACTIVO', 'INACTIVO', 'RETIRADO');
CREATE TYPE periodo_estado      AS ENUM ('ABIERTO', 'CERRADO');
CREATE TYPE flujo_tipo          AS ENUM ('INGRESO', 'EGRESO');
CREATE TYPE operacion_estado    AS ENUM ('VIGENTE', 'ANULADA');
CREATE TYPE prestamo_estado     AS ENUM ('SOLICITADO', 'APROBADO', 'VIGENTE', 'CANCELADO', 'CASTIGADO', 'RECHAZADO');
CREATE TYPE cuota_estado        AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADA', 'VENCIDA');
CREATE TYPE distribucion_estado AS ENUM ('BORRADOR', 'APROBADA', 'PAGADA');
CREATE TYPE token_proposito     AS ENUM ('RESET_PASSWORD', 'ACTIVACION');

CREATE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

-- ---------- Tenant ----------
CREATE TABLE caja (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        varchar(120) NOT NULL,
  moneda        char(3)      NOT NULL DEFAULT 'PEN',
  zona_horaria  varchar(40)  NOT NULL DEFAULT 'America/Lima',
  activa        boolean      NOT NULL DEFAULT true,
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);

-- ---------- Identidad y acceso ----------
CREATE TABLE app_user (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id               uuid NOT NULL REFERENCES caja(id),
  email                 citext NOT NULL UNIQUE,
  password_hash         varchar(255) NOT NULL,              -- Argon2id
  role                  user_role   NOT NULL,
  status                user_status NOT NULL DEFAULT 'PENDIENTE',
  socio_id              uuid UNIQUE,                        -- FK se agrega tras crear socio
  must_change_password  boolean NOT NULL DEFAULT true,
  mfa_enabled           boolean NOT NULL DEFAULT false,
  mfa_secret_enc        bytea,                              -- TOTP cifrado a nivel de aplicación
  mfa_recovery_hashes   text[],
  failed_login_count    smallint NOT NULL DEFAULT 0,
  locked_until          timestamptz,
  last_login_at         timestamptz,
  password_changed_at   timestamptz NOT NULL DEFAULT now(),
  token_version         integer NOT NULL DEFAULT 0,         -- invalida JWT al incrementar
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_user_socio CHECK (role = 'ADMIN' OR socio_id IS NOT NULL),
  CONSTRAINT ck_user_mfa   CHECK (NOT mfa_enabled OR mfa_secret_enc IS NOT NULL)
);
CREATE INDEX ix_app_user_caja ON app_user (caja_id);

CREATE TABLE refresh_token (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  family_id    uuid NOT NULL,                               -- rotación + detección de reutilización
  token_hash   char(64) NOT NULL UNIQUE,                    -- SHA-256, nunca el token en claro
  issued_at    timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  revoked_at   timestamptz,
  replaced_by  uuid REFERENCES refresh_token(id),
  ip           inet,
  user_agent   text
);
CREATE INDEX ix_refresh_user_activo ON refresh_token (user_id) WHERE revoked_at IS NULL;
CREATE INDEX ix_refresh_family      ON refresh_token (family_id);

CREATE TABLE one_time_token (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  proposito   token_proposito NOT NULL,
  token_hash  char(64) NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------- Socios ----------
CREATE TABLE socio (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id              uuid NOT NULL REFERENCES caja(id),
  codigo               integer NOT NULL,                    -- correlativo interno por caja
  tipo                 socio_tipo   NOT NULL DEFAULT 'SOCIO',
  nombres              varchar(100) NOT NULL,
  apellidos            varchar(100) NOT NULL,
  nombre_completo      varchar(201) GENERATED ALWAYS AS (apellidos || ' ' || nombres) STORED,
  documento_tipo       varchar(10)  NOT NULL DEFAULT 'DNI',
  documento_enc        bytea,                               -- DNI cifrado (AES-GCM, app-level)
  documento_hash       char(64),                            -- HMAC-SHA256 para unicidad/búsqueda
  telefono             varchar(20),
  email                citext,
  direccion            text,
  fecha_ingreso        date NOT NULL,
  fecha_retiro         date,
  estado               socio_estado NOT NULL DEFAULT 'ACTIVO',
  notas                text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  created_by           uuid REFERENCES app_user(id),
  deleted_at           timestamptz,
  UNIQUE (caja_id, id),                                     -- habilita FKs compuestas anti-fuga entre tenants
  UNIQUE (caja_id, codigo),
  CONSTRAINT ck_socio_retiro CHECK (fecha_retiro IS NULL OR fecha_retiro >= fecha_ingreso)
);
CREATE UNIQUE INDEX ux_socio_documento ON socio (caja_id, documento_tipo, documento_hash)
  WHERE documento_hash IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX ix_socio_nombre_trgm ON socio USING gin (nombre_completo gin_trgm_ops);

ALTER TABLE app_user
  ADD CONSTRAINT fk_user_socio FOREIGN KEY (socio_id) REFERENCES socio(id);

-- ---------- Parámetros y catálogo ----------
CREATE TABLE parametro (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id        uuid NOT NULL REFERENCES caja(id),
  clave          varchar(50) NOT NULL,                      -- VALOR_ACCION, TASA_DEFECTO, DIA_REUNION, SALDO_INICIAL_CAJA
  valor          numeric(14,4) NOT NULL,
  vigente_desde  date NOT NULL,
  descripcion    varchar(200),
  UNIQUE (caja_id, clave, vigente_desde)
);

CREATE TABLE concepto (
  id              smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo          varchar(40)  NOT NULL UNIQUE,
  nombre          varchar(100) NOT NULL,
  tipo            flujo_tipo   NOT NULL,
  requiere_socio  boolean NOT NULL DEFAULT true,
  orden           smallint NOT NULL,
  activo          boolean NOT NULL DEFAULT true,
  UNIQUE (id, tipo)
);

-- ---------- Periodos (cada hoja mensual del Excel) ----------
CREATE TABLE periodo (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id        uuid NOT NULL REFERENCES caja(id),
  anio           smallint NOT NULL CHECK (anio BETWEEN 2020 AND 2100),
  mes            smallint NOT NULL CHECK (mes BETWEEN 1 AND 12),
  fecha_reunion  date NOT NULL,
  estado         periodo_estado NOT NULL DEFAULT 'ABIERTO',
  cerrado_at     timestamptz,
  cerrado_por    uuid REFERENCES app_user(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (caja_id, id),
  UNIQUE (caja_id, anio, mes),
  CONSTRAINT ck_periodo_fecha  CHECK (EXTRACT(YEAR FROM fecha_reunion) = anio AND EXTRACT(MONTH FROM fecha_reunion) = mes),
  CONSTRAINT ck_periodo_cierre CHECK ((estado = 'CERRADO') = (cerrado_at IS NOT NULL))
);

CREATE TABLE cierre_periodo (                               -- foto inmutable al cerrar el mes
  periodo_id       uuid PRIMARY KEY REFERENCES periodo(id),
  saldo_anterior   numeric(14,2) NOT NULL,
  total_ingresos   numeric(14,2) NOT NULL,
  total_egresos    numeric(14,2) NOT NULL,
  saldo_final      numeric(14,2) GENERATED ALWAYS AS (saldo_anterior + total_ingresos - total_egresos) STORED,
  detalle          jsonb NOT NULL,                          -- totales por concepto
  hash_integridad  char(64) NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  created_by       uuid REFERENCES app_user(id)
);

CREATE TABLE arqueo_caja (
  periodo_id        uuid PRIMARY KEY REFERENCES periodo(id),
  efectivo          numeric(14,2) NOT NULL DEFAULT 0 CHECK (efectivo >= 0),
  depositos_bancos  numeric(14,2) NOT NULL DEFAULT 0 CHECK (depositos_bancos >= 0),
  total_contado     numeric(14,2) GENERATED ALWAYS AS (efectivo + depositos_bancos) STORED,
  saldo_sistema     numeric(14,2) NOT NULL,
  diferencia        numeric(14,2) GENERATED ALWAYS AS (efectivo + depositos_bancos - saldo_sistema) STORED, -- >0 sobrante, <0 faltante
  observacion       text,
  registrado_por    uuid REFERENCES app_user(id),
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ---------- Préstamos ----------
CREATE TABLE prestamo (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id              uuid NOT NULL,
  socio_id             uuid NOT NULL,
  numero               integer NOT NULL,                    -- correlativo por caja
  monto_principal      numeric(14,2) NOT NULL CHECK (monto_principal > 0),
  tasa_mensual         numeric(6,4)  NOT NULL CHECK (tasa_mensual >= 0 AND tasa_mensual <= 1),  -- 0.0500 = 5 % mensual
  nro_cuotas           smallint NOT NULL CHECK (nro_cuotas BETWEEN 1 AND 60),
  metodo_amortizacion  varchar(40) NOT NULL DEFAULT 'CAPITAL_FIJO_INTERES_SOBRE_SALDO',
  fecha_desembolso     date NOT NULL,
  fecha_primera_cuota  date NOT NULL,
  estado               prestamo_estado NOT NULL DEFAULT 'SOLICITADO',
  proposito            text,
  aprobado_por         uuid REFERENCES app_user(id),
  aprobado_at          timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  created_by           uuid REFERENCES app_user(id),
  UNIQUE (caja_id, numero),
  UNIQUE (caja_id, id),
  FOREIGN KEY (caja_id, socio_id) REFERENCES socio (caja_id, id),
  CONSTRAINT ck_prestamo_fechas CHECK (fecha_primera_cuota > fecha_desembolso)
);
CREATE INDEX ix_prestamo_socio  ON prestamo (socio_id);
CREATE INDEX ix_prestamo_estado ON prestamo (caja_id, estado);

CREATE TABLE cuota_prestamo (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestamo_id          uuid NOT NULL REFERENCES prestamo(id),
  nro_cuota            smallint NOT NULL CHECK (nro_cuota > 0),
  fecha_vencimiento    date NOT NULL,
  capital_programado   numeric(14,2) NOT NULL CHECK (capital_programado >= 0),
  interes_programado   numeric(14,2) NOT NULL CHECK (interes_programado >= 0),
  cuota_programada     numeric(14,2) GENERATED ALWAYS AS (capital_programado + interes_programado) STORED,
  capital_pagado       numeric(14,2) NOT NULL DEFAULT 0 CHECK (capital_pagado >= 0),
  interes_pagado       numeric(14,2) NOT NULL DEFAULT 0 CHECK (interes_pagado >= 0),
  mora_pagada          numeric(14,2) NOT NULL DEFAULT 0 CHECK (mora_pagada >= 0),
  estado               cuota_estado NOT NULL DEFAULT 'PENDIENTE',
  fecha_pago           date,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prestamo_id, nro_cuota),
  CONSTRAINT ck_cuota_capital CHECK (capital_pagado <= capital_programado),
  CONSTRAINT ck_cuota_interes CHECK (interes_pagado <= interes_programado)
);
CREATE INDEX ix_cuota_vencimiento ON cuota_prestamo (fecha_vencimiento) WHERE estado IN ('PENDIENTE', 'PARCIAL', 'VENCIDA');

-- ---------- Libro de caja: cabecera (recibo/fila del Excel) + detalle (columnas) ----------
CREATE TABLE import_batch (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id       uuid NOT NULL REFERENCES caja(id),
  archivo       varchar(255) NOT NULL,
  sha256        char(64) NOT NULL,
  estado        varchar(20) NOT NULL DEFAULT 'EN_CURSO',    -- EN_CURSO | OK | ERROR | REVERTIDO
  resumen       jsonb,
  errores       jsonb,
  ejecutado_por uuid REFERENCES app_user(id),
  started_at    timestamptz NOT NULL DEFAULT now(),
  finished_at   timestamptz,
  UNIQUE (caja_id, sha256)
);

CREATE TABLE operacion (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id           uuid NOT NULL,
  periodo_id        uuid NOT NULL,
  socio_id          uuid,
  tipo              flujo_tipo NOT NULL,
  fecha             date NOT NULL,
  nro_recibo        integer,                                -- correlativo de la columna "Día" del Excel (ingresos)
  descripcion       varchar(255),
  estado            operacion_estado NOT NULL DEFAULT 'VIGENTE',
  anulado_at        timestamptz,
  anulado_por       uuid REFERENCES app_user(id),
  motivo_anulacion  text,
  import_batch_id   uuid REFERENCES import_batch(id),
  origen_ref        varchar(80),                            -- p. ej. 'JUN 24'!B7  (trazabilidad de migración)
  created_at        timestamptz NOT NULL DEFAULT now(),
  created_by        uuid REFERENCES app_user(id),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, tipo),
  FOREIGN KEY (caja_id, periodo_id) REFERENCES periodo (caja_id, id),
  FOREIGN KEY (caja_id, socio_id)   REFERENCES socio   (caja_id, id),
  CONSTRAINT ck_operacion_anulacion CHECK (
    estado = 'VIGENTE' OR (anulado_at IS NOT NULL AND anulado_por IS NOT NULL AND motivo_anulacion IS NOT NULL))
);
CREATE UNIQUE INDEX ux_operacion_recibo ON operacion (caja_id, nro_recibo)
  WHERE nro_recibo IS NOT NULL AND estado = 'VIGENTE';
CREATE INDEX ix_operacion_periodo ON operacion (periodo_id) WHERE estado = 'VIGENTE';
CREATE INDEX ix_operacion_socio   ON operacion (socio_id, fecha DESC) WHERE estado = 'VIGENTE';

CREATE TABLE operacion_detalle (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operacion_id  uuid NOT NULL,
  tipo          flujo_tipo NOT NULL,
  concepto_id   smallint NOT NULL,
  monto         numeric(14,2) NOT NULL CHECK (monto > 0),
  prestamo_id   uuid REFERENCES prestamo(id),
  cuota_id      uuid REFERENCES cuota_prestamo(id),
  FOREIGN KEY (operacion_id, tipo) REFERENCES operacion (id, tipo),   -- el detalle hereda el tipo de la cabecera
  FOREIGN KEY (concepto_id, tipo)  REFERENCES concepto  (id, tipo),   -- el concepto debe ser del mismo tipo
  UNIQUE NULLS NOT DISTINCT (operacion_id, concepto_id, cuota_id)   -- PG15+: evita líneas duplicadas del mismo concepto
);
CREATE INDEX ix_detalle_operacion ON operacion_detalle (operacion_id);
CREATE INDEX ix_detalle_concepto  ON operacion_detalle (concepto_id);
CREATE INDEX ix_detalle_prestamo  ON operacion_detalle (prestamo_id) WHERE prestamo_id IS NOT NULL;

-- ---------- Distribución anual de utilidades (proporcional a acciones) ----------
CREATE TABLE distribucion_utilidad (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id          uuid NOT NULL REFERENCES caja(id),
  ejercicio        smallint NOT NULL,
  fecha_corte      date NOT NULL,
  utilidad_total   numeric(14,2) NOT NULL CHECK (utilidad_total >= 0),
  total_acciones   integer NOT NULL CHECK (total_acciones > 0),
  valor_por_accion numeric(14,6) GENERATED ALWAYS AS (utilidad_total / total_acciones) STORED,
  estado           distribucion_estado NOT NULL DEFAULT 'BORRADOR',
  aprobado_por     uuid REFERENCES app_user(id),
  aprobado_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (caja_id, ejercicio)
);

CREATE TABLE distribucion_utilidad_detalle (
  distribucion_id  uuid NOT NULL REFERENCES distribucion_utilidad(id),
  socio_id         uuid NOT NULL REFERENCES socio(id),
  acciones         integer NOT NULL CHECK (acciones >= 0),
  monto            numeric(14,2) NOT NULL CHECK (monto >= 0),
  operacion_id     uuid REFERENCES operacion(id),           -- egreso que materializa el pago
  PRIMARY KEY (distribucion_id, socio_id)
);

-- ---------- Auditoría (append-only) ----------
CREATE TABLE audit_log (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at    timestamptz NOT NULL DEFAULT now(),
  caja_id        uuid,
  actor_user_id  uuid,
  actor_role     user_role,
  accion         varchar(60) NOT NULL,                      -- LOGIN_OK, LOGIN_FAIL, OPERACION_CREADA, PERIODO_CERRADO...
  entidad        varchar(60),
  entidad_id     uuid,
  antes          jsonb,
  despues        jsonb,
  ip             inet,
  user_agent     text,
  request_id     uuid
);
CREATE INDEX ix_audit_entidad ON audit_log (entidad, entidad_id);
CREATE INDEX ix_audit_actor   ON audit_log (actor_user_id, occurred_at DESC);
CREATE INDEX ix_audit_brin    ON audit_log USING brin (occurred_at);

CREATE FUNCTION fn_audit_inmutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_log es de solo inserción';
END $$;
CREATE TRIGGER trg_audit_inmutable BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION fn_audit_inmutable();

-- ---------- Triggers ----------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['caja','app_user','socio','periodo','operacion','prestamo','cuota_prestamo','distribucion_utilidad']
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON %1$I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t);
  END LOOP;
END $$;

-- Bloquea cambios contables en periodos cerrados (cabecera y detalle)
CREATE FUNCTION fn_bloquear_periodo_cerrado() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_row     jsonb := to_jsonb(CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END);
  v_periodo uuid;
  v_estado  periodo_estado;
BEGIN
  IF TG_TABLE_NAME = 'operacion' THEN
    v_periodo := (v_row ->> 'periodo_id')::uuid;
  ELSE
    SELECT periodo_id INTO v_periodo FROM operacion WHERE id = (v_row ->> 'operacion_id')::uuid;
  END IF;
  SELECT estado INTO v_estado FROM periodo WHERE id = v_periodo;
  IF v_estado = 'CERRADO' THEN
    RAISE EXCEPTION 'El periodo está cerrado: no se permiten cambios' USING ERRCODE = 'P0001';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;

CREATE TRIGGER trg_operacion_periodo_cerrado BEFORE INSERT OR UPDATE OR DELETE ON operacion
  FOR EACH ROW EXECUTE FUNCTION fn_bloquear_periodo_cerrado();
CREATE TRIGGER trg_detalle_periodo_cerrado BEFORE INSERT OR UPDATE OR DELETE ON operacion_detalle
  FOR EACH ROW EXECUTE FUNCTION fn_bloquear_periodo_cerrado();

-- ---------- Vistas (security_invoker => respetan RLS del usuario que consulta) ----------
CREATE VIEW v_libro_caja_mensual WITH (security_invoker = true) AS
SELECT p.caja_id, p.id AS periodo_id, p.anio, p.mes,
  -- Ingresos (columnas del Excel)
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'DEPOSITO_AHORRO'),   0) AS deposito_ahorros,
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'PAGO_CAPITAL'),      0) AS pagos_capital,
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'INTERES_RECIBIDO'),  0) AS intereses_recibidos,
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'ACCION'),            0) AS acciones,
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'MULTA_TARDANZA'),    0) AS otros_tardanza,
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'RESERVA'),           0) AS reservas,
  COALESCE(SUM(d.monto) FILTER (WHERE d.tipo = 'INGRESO'),             0) AS total_ingresos,
  -- Egresos
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'RETIRO_AHORRO'),     0) AS retiros_ahorros,
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'PRESTAMO'),          0) AS prestamos,
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'INTERES_PAGADO'),    0) AS interes_pagado,
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'GASTO_ADMIN'),       0) AS gastos_admin,
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'UTILIDAD_DISTRIBUIDA'), 0) AS utilidad_distribuida,
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'RED'),               0) AS red,
  COALESCE(SUM(d.monto) FILTER (WHERE c.codigo = 'OTRO_EGRESO'),       0) AS otros_egresos,
  COALESCE(SUM(d.monto) FILTER (WHERE d.tipo = 'EGRESO'),              0) AS total_egresos
FROM periodo p
LEFT JOIN operacion o          ON o.periodo_id = p.id AND o.estado = 'VIGENTE'
LEFT JOIN operacion_detalle d  ON d.operacion_id = o.id
LEFT JOIN concepto c           ON c.id = d.concepto_id
GROUP BY p.caja_id, p.id, p.anio, p.mes;

CREATE VIEW v_saldo_caja WITH (security_invoker = true) AS
SELECT caja_id, periodo_id, anio, mes, total_ingresos, total_egresos,
  COALESCE(SUM(total_ingresos - total_egresos) OVER w_prev, 0)  AS saldo_anterior,
  SUM(total_ingresos - total_egresos) OVER w_acum               AS saldo_final
FROM v_libro_caja_mensual
WINDOW w_acum AS (PARTITION BY caja_id ORDER BY anio, mes),
       w_prev AS (PARTITION BY caja_id ORDER BY anio, mes ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING);
-- Nota: sumar el parámetro SALDO_INICIAL_CAJA en la capa de servicio si la caja no inició en cero.

CREATE VIEW v_saldo_ahorro_socio WITH (security_invoker = true) AS
SELECT o.caja_id, o.socio_id,
  SUM(CASE c.codigo WHEN 'DEPOSITO_AHORRO' THEN d.monto
                    WHEN 'RETIRO_AHORRO'   THEN -d.monto ELSE 0 END) AS saldo_ahorro
FROM operacion o
JOIN operacion_detalle d ON d.operacion_id = o.id
JOIN concepto c          ON c.id = d.concepto_id
WHERE o.estado = 'VIGENTE' AND o.socio_id IS NOT NULL
GROUP BY o.caja_id, o.socio_id;

CREATE VIEW v_acciones_socio WITH (security_invoker = true) AS
SELECT o.caja_id, o.socio_id,
  SUM(d.monto) AS monto_acciones,
  FLOOR(SUM(d.monto) / NULLIF((SELECT pa.valor FROM parametro pa
                               WHERE pa.caja_id = o.caja_id AND pa.clave = 'VALOR_ACCION'
                               ORDER BY pa.vigente_desde DESC LIMIT 1), 0))::int AS nro_acciones
FROM operacion o
JOIN operacion_detalle d ON d.operacion_id = o.id
JOIN concepto c          ON c.id = d.concepto_id AND c.codigo = 'ACCION'
WHERE o.estado = 'VIGENTE' AND o.socio_id IS NOT NULL
GROUP BY o.caja_id, o.socio_id;

CREATE VIEW v_prestamo_saldo WITH (security_invoker = true) AS
SELECT p.id AS prestamo_id, p.caja_id, p.socio_id, p.monto_principal, p.estado,
  COALESCE(SUM(c.capital_pagado), 0)                          AS capital_pagado,
  p.monto_principal - COALESCE(SUM(c.capital_pagado), 0)      AS saldo_capital,
  COUNT(*) FILTER (WHERE c.estado = 'VENCIDA')                AS cuotas_vencidas
FROM prestamo p
LEFT JOIN cuota_prestamo c ON c.prestamo_id = p.id
GROUP BY p.id;

-- ---------- Row Level Security (defensa en profundidad) ----------
-- El backend ejecuta al inicio de cada transacción:
--   SELECT set_config('app.caja_id', :caja, true), set_config('app.role', :rol, true), set_config('app.socio_id', :socio, true);
CREATE FUNCTION app_caja_id()  RETURNS uuid    LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.caja_id',  true), '')::uuid $$;
CREATE FUNCTION app_socio_id() RETURNS uuid    LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.socio_id', true), '')::uuid $$;
CREATE FUNCTION app_es_admin() RETURNS boolean LANGUAGE sql STABLE AS $$ SELECT coalesce(current_setting('app.role', true), '') = 'ADMIN' $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['socio','operacion','operacion_detalle','prestamo','cuota_prestamo',
                           'distribucion_utilidad','distribucion_utilidad_detalle','periodo','parametro']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- socio
CREATE POLICY socio_admin ON socio FOR ALL
  USING (caja_id = app_caja_id() AND app_es_admin()) WITH CHECK (caja_id = app_caja_id() AND app_es_admin());
CREATE POLICY socio_self  ON socio FOR SELECT
  USING (caja_id = app_caja_id() AND id = app_socio_id());
-- operacion (el socio solo ve sus propias operaciones)
CREATE POLICY operacion_admin ON operacion FOR ALL
  USING (caja_id = app_caja_id() AND app_es_admin()) WITH CHECK (caja_id = app_caja_id() AND app_es_admin());
CREATE POLICY operacion_self  ON operacion FOR SELECT
  USING (caja_id = app_caja_id() AND socio_id = app_socio_id());
-- prestamo
CREATE POLICY prestamo_admin ON prestamo FOR ALL
  USING (caja_id = app_caja_id() AND app_es_admin()) WITH CHECK (caja_id = app_caja_id() AND app_es_admin());
CREATE POLICY prestamo_self  ON prestamo FOR SELECT
  USING (caja_id = app_caja_id() AND socio_id = app_socio_id());
-- hijas: heredan visibilidad de la cabecera (la subconsulta ya está filtrada por RLS)
CREATE POLICY detalle_read  ON operacion_detalle FOR SELECT
  USING (EXISTS (SELECT 1 FROM operacion o WHERE o.id = operacion_detalle.operacion_id));
CREATE POLICY detalle_admin ON operacion_detalle FOR ALL
  USING (app_es_admin() AND EXISTS (SELECT 1 FROM operacion o WHERE o.id = operacion_detalle.operacion_id))
  WITH CHECK (app_es_admin() AND EXISTS (SELECT 1 FROM operacion o WHERE o.id = operacion_detalle.operacion_id));
CREATE POLICY cuota_read  ON cuota_prestamo FOR SELECT
  USING (EXISTS (SELECT 1 FROM prestamo p WHERE p.id = cuota_prestamo.prestamo_id));
CREATE POLICY cuota_admin ON cuota_prestamo FOR ALL
  USING (app_es_admin() AND EXISTS (SELECT 1 FROM prestamo p WHERE p.id = cuota_prestamo.prestamo_id))
  WITH CHECK (app_es_admin() AND EXISTS (SELECT 1 FROM prestamo p WHERE p.id = cuota_prestamo.prestamo_id));
-- utilidades
CREATE POLICY distrib_read  ON distribucion_utilidad FOR SELECT USING (caja_id = app_caja_id());
CREATE POLICY distrib_admin ON distribucion_utilidad FOR ALL
  USING (caja_id = app_caja_id() AND app_es_admin()) WITH CHECK (caja_id = app_caja_id() AND app_es_admin());
CREATE POLICY distrib_det_admin ON distribucion_utilidad_detalle FOR ALL
  USING (app_es_admin() AND EXISTS (SELECT 1 FROM distribucion_utilidad d WHERE d.id = distribucion_id))
  WITH CHECK (app_es_admin() AND EXISTS (SELECT 1 FROM distribucion_utilidad d WHERE d.id = distribucion_id));
CREATE POLICY distrib_det_self ON distribucion_utilidad_detalle FOR SELECT USING (socio_id = app_socio_id());
-- periodo y parametro: lectura para el tenant, escritura solo admin
CREATE POLICY periodo_read  ON periodo FOR SELECT USING (caja_id = app_caja_id());
CREATE POLICY periodo_admin ON periodo FOR ALL
  USING (caja_id = app_caja_id() AND app_es_admin()) WITH CHECK (caja_id = app_caja_id() AND app_es_admin());
CREATE POLICY parametro_read  ON parametro FOR SELECT USING (caja_id = app_caja_id());
CREATE POLICY parametro_admin ON parametro FOR ALL
  USING (caja_id = app_caja_id() AND app_es_admin()) WITH CHECK (caja_id = app_caja_id() AND app_es_admin());

-- ---------- Datos semilla (catálogo) ----------
INSERT INTO concepto (codigo, nombre, tipo, requiere_socio, orden) VALUES
  ('DEPOSITO_AHORRO',      'Depósito de ahorros',       'INGRESO', true,  1),
  ('PAGO_CAPITAL',         'Pagos de capital',          'INGRESO', true,  2),
  ('INTERES_RECIBIDO',     'Intereses recibidos',       'INGRESO', true,  3),
  ('ACCION',               'Acciones',                  'INGRESO', true,  4),
  ('MULTA_TARDANZA',       'Otros / tardanza',          'INGRESO', true,  5),
  ('RESERVA',              'Reservas',                  'INGRESO', false, 6),
  ('OTRO_INGRESO',         'Otros ingresos',            'INGRESO', false, 7),
  ('RETIRO_AHORRO',        'Retiros de ahorros',        'EGRESO',  true,  1),
  ('PRESTAMO',             'Préstamos',                 'EGRESO',  true,  2),
  ('INTERES_PAGADO',       'Interés pagado',            'EGRESO',  true,  3),
  ('GASTO_ADMIN',          'Gastos administrativos',    'EGRESO',  false, 4),
  ('UTILIDAD_DISTRIBUIDA', 'Utilidad distribuida',      'EGRESO',  true,  5),
  ('RED',                  'Red',                       'EGRESO',  false, 6),
  ('OTRO_EGRESO',          'Otros egresos',             'EGRESO',  false, 7);
```

### 5.4 Migraciones adicionales a crear
- `V2__roles_y_permisos.sql`: crear roles `app_rw` / `app_ro` **sin contraseña literal** (la contraseña se inyecta con el script de init del contenedor desde variables de entorno) y los `GRANT`/`REVOKE`:
  ```sql
  GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_rw;
  REVOKE UPDATE ON audit_log FROM app_rw;
  REVOKE DELETE ON operacion, operacion_detalle, audit_log, cierre_periodo, arqueo_caja FROM app_rw;
  GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_ro;
  ALTER ROLE app_rw NOBYPASSRLS; ALTER ROLE app_ro NOBYPASSRLS;
  ```
  Añade RLS a `cierre_periodo` y `arqueo_caja` (solo ADMIN) y revisa que `refresh_token`/`one_time_token` solo sean accesibles por el módulo `identity`.
- `V3__seed_catalogos.sql`: caja inicial (UUID fijo para dev) y parámetros: `VALOR_ACCION = 30`, `TASA_DEFECTO = 0.05`, `DIA_REUNION = 8`, `SALDO_INICIAL_CAJA = 0`.
- **El usuario ADMIN inicial NO va en SQL**: se crea con un comando de arranque único (`bootstrap-admin`) leyendo email y contraseña temporal de variables de entorno, forzando cambio de contraseña y enrolamiento MFA en el primer ingreso.

### 5.5 Reglas de cálculo de préstamos (implementar en el dominio con tests)
```
capital_cuota   = redondear(monto / n_cuotas, 2)         // la última cuota = saldo restante
interes_cuota_k = redondear(saldo_pendiente_k * tasa_mensual, 2)
cuota_k         = capital_cuota + interes_cuota_k
fecha_k         = fecha_primera_cuota + (k-1) meses       // mismo día del mes (día de reunión)
```
Debe reproducir exactamente los cronogramas de la hoja `CALCULO PRESTAMOS` (ej.: monto 1836.50, 4 cuotas, 5 % → capital 459.125 por cuota; interés cuota 1 = 91.83, luego sobre saldo). Incluye tests con esos casos y la convención de redondeo elegida (documentarla).

---

## 6. API REST (v1) — contrato mínimo
Prefijo `/api/v1`, OpenAPI generado, versionado, paginación (`page`, `size`, `sort`), errores RFC 9457.

- **Auth**: `POST /auth/login`, `POST /auth/mfa/verify`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/password/forgot`, `POST /auth/password/reset`, `POST /auth/password/change`, `POST /auth/mfa/enroll`.
- **Admin** (`ROLE_ADMIN`): `/socios`, `/socios/{id}/acceso`, `/periodos`, `/periodos/{id}/operaciones`, `/operaciones/{id}/anular`, `/periodos/{id}/arqueo`, `/periodos/{id}/cerrar`, `/periodos/{id}/reabrir`, `/prestamos` (+ `/aprobar`, `/desembolsar`, `/cuotas/{id}/pagos`), `/utilidades`, `/reportes/*`, `/auditoria`, `/importaciones`.
- **Socio** (`ROLE_SOCIO`, siempre sobre el socio del token): `GET /me`, `/me/resumen`, `/me/movimientos`, `/me/prestamos`, `/me/prestamos/{id}/cronograma`, `/me/utilidades`, `/me/estado-cuenta.pdf`.

---

## 7. Frontend (Next.js) — pantallas
- Rutas: `/login`, `/admin/login`, `/socio/**`, `/admin/**`. Layouts separados por rol, diseño responsive y accesible (WCAG 2.1 AA), modo claro/oscuro, español (`es-PE`), formato de moneda `S/ 1,234.50`.
- Admin: dashboard, socios, **planilla mensual editable** (tabla con atajos de teclado, total por columna en vivo, validación inmediata), préstamos y cronogramas, cierre de periodo con checklist previo, reportes, auditoría, importador.
- Socio: resumen, movimientos, préstamos/cronogramas, utilidades, estado de cuenta PDF.
- Estados de carga/error/vacío en todas las vistas; **nunca calcules totales financieros solo en el cliente** (el servidor es la fuente de verdad).
- Mobile-first: la mayoría de socios consultará desde el teléfono.

---

## 8. Docker y entorno local

`docker-compose.yml` con servicios `db` (postgres:17, volumen, healthcheck, init de roles), `backend` (multi-stage: build con Maven/Gradle → runtime `eclipse-temurin:21-jre` o distroless, usuario no-root, `JAVA_OPTS` con límites de memoria), `frontend` (multi-stage Next.js `output: 'standalone'`) y opcionalmente `mailpit` (correo de pruebas) y `redis`. Archivos `.env.example` (sin valores reales), perfiles Spring `dev|test|prod`, `.dockerignore`, redes internas (la BD **no** publica puerto en prod). Un `Makefile` con `make up`, `make test`, `make migrate`, `make seed-dev`.

---

## 9. Calidad, pruebas y observabilidad
- Cobertura objetivo: dominio financiero ≥ 90 %, resto ≥ 70 %. **Testcontainers** con PostgreSQL real para repositorios, RLS, triggers de cierre y vistas.
- Pruebas de seguridad automatizadas: un SOCIO no puede leer datos de otro socio (IDOR) ni de otra caja; no se puede modificar un periodo cerrado; reutilizar un refresh token revoca la familia; rate limit y bloqueo funcionan.
- Propiedades financieras (property-based con jqwik): la suma de cuotas = principal + intereses; saldo nunca negativo; totales de `v_libro_caja_mensual` = suma de detalles.
- Logs JSON estructurados con `request_id`, **sin datos personales ni secretos**; métricas Micrometer (Prometheus), health/readiness, trazas OpenTelemetry.
- Backups automáticos de la BD, prueba de restauración documentada (`docs/runbooks/restore.md`), RPO ≤ 24 h.

---

## 10. Migración desde el Excel
Construye un **importador** (módulo `migracion`, CLI y pantalla admin) que:
1. Recibe el `.xls`/`.xlsx`, calcula su **SHA-256** y registra un `import_batch` (impide importar dos veces el mismo archivo).
2. Recorre las hojas mensuales visibles, detecta el mes/año del título (`INGRESOS 08 DE JUNIO 2024`) y tolera los dos layouts de columnas (hojas antiguas desde la columna B; hojas desde `OCTUBRE 2025` desde la columna A).
3. Convierte cada fila en `operacion` + `operacion_detalle`, guardando `origen_ref` (`'JUN 24'!B7`). Ignora filas de totales y filas pseudo-socio, que se reportan aparte.
4. Normaliza nombres con una **tabla de equivalencias** (CSV revisable) y crea los socios que falten, marcando los externos.
5. Importa los cronogramas de `CALCULO PRESTAMOS` a `prestamo` + `cuota_prestamo` (estado "PAGADO" → `PAGADA`).
6. **Recalcula** saldos y acumulados y emite un **reporte de conciliación** (por mes: total Excel vs. total sistema, diferencias, filas rechazadas). Nada se cierra automáticamente: el ADMIN revisa y recién entonces cierra los periodos.
7. Todo en una transacción por hoja; reversible mediante `import_batch.estado = 'REVERTIDO'` (anulando lo importado).

---

## 11. Criterios de aceptación (Definition of Done global)
- [ ] `docker compose up` levanta BD, backend y frontend funcionando; migraciones Flyway aplican sin errores en una BD vacía.
- [ ] Login ADMIN con MFA y login SOCIO funcionando; rutas protegidas por rol en frontend **y** backend.
- [ ] Un socio **no puede** ver datos de otro socio (test automatizado de IDOR y de RLS).
- [ ] Un periodo cerrado no admite cambios (verificado a nivel de BD y de API).
- [ ] Los cronogramas de préstamos coinciden con los del Excel en los casos de prueba.
- [ ] El importador genera un reporte de conciliación sin diferencias no explicadas para los meses limpios.
- [ ] Escaneos de dependencias/imagen sin vulnerabilidades críticas; cabeceras de seguridad verificadas.
- [ ] Documentación: `README`, ADRs, runbooks (despliegue, restauración, rotación de claves), `PREGUNTAS_ABIERTAS.md`.

---

## 12. Plan por fases (ejecútalas en orden y detente al final de cada una)
1. **Fundaciones**: monorepo, Docker Compose, Flyway `V1–V3`, CI básico, Testcontainers, ADRs 001–003.
2. **Identidad y seguridad**: usuarios, Argon2id, JWT + refresh con rotación, MFA, RLS por transacción, auditoría, BFF en Next.js, login admin/socio.
3. **Socios y periodos**: CRUD de socios, creación de periodos, planilla de operaciones, anulación, arqueo, cierre/reapertura.
4. **Préstamos**: motor de cronogramas, aprobación/desembolso/pagos, mora.
5. **Ahorros, acciones y utilidades**.
6. **Reportes y portal del socio**: libro de caja, estado de cuenta, PDF/Excel.
7. **Migración desde Excel** y conciliación.
8. **Endurecimiento y despliegue**: pruebas E2E, pentest básico (ZAP), ajuste de CSP, despliegue (Vercel + contenedor backend + Postgres gestionado), runbooks.

**Empieza ahora por la Fase 1.** Antes de escribir código, confírmame en un mensaje corto: (a) el stack de despliegue elegido para backend y base de datos, (b) las respuestas o supuestos para las ambigüedades de la sección 1.5.   revisa el promt y jecutalo utilizando la actual plantilla
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-10-05T17:30:19-05:00.
</ADDITIONAL_METADATA>
