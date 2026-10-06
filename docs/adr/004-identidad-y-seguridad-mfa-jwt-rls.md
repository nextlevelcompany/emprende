# ADR 004: Identidad, Autenticación, MFA TOTP y Rotación de Tokens

- **Estado:** Aceptado
- **Fecha:** 2026-10-05
- **Autor:** Arquitecto de Software / Tech Lead

---

## Contexto
El sistema "Caja Emprende Chambala" gestiona fondos comunales y operaciones financieras críticas de socios. Se requiere una arquitectura de seguridad que impida accesos no autorizados, ataques de suplantación, fuga de credenciales o secuestro de sesiones, diferenciando claramente el perfil del Administrador (personal de tesorería/directiva) del Socio comunal (consulta de saldos, estados de cuenta y aportes).

---

## Decisiones de Diseño

### 1. Hashing de Contraseñas con Argon2id
- Siguiendo las directrices de OWASP ASVS v4.0 y la recomendación del Password Hashing Competition (PHC), se seleccionó **Argon2id** (híbrido resistente a ataques de GPU/ASIC y canal lateral de memoria).
- **Parámetros configurados:**
  - Longitud de sal: 16 bytes
  - Longitud de hash: 32 bytes
  - Paralelismo ($p$): 1 hilo
  - Memoria ($m$): 64 MB (65,536 KiB)
  - Iteraciones ($t$): 3 pasadas
- **Política de contraseñas:** Mínimo 12 caracteres, al menos una mayúscula, una minúscula, un dígito y un carácter especial. Bloqueo temporal exponencial tras 5 intentos fallidos consecutivos.

### 2. Ciclo de Vida de Tokens (JWT + Refresh Token con Detección de Reuso)
- **Access Token:**
  - Formato: JWT firmado con algoritmo HMAC-SHA256 (`HS256`).
  - Vida útil: **15 minutos** (expiración corta para minimizar ventanas de exposición).
  - Claims incluidos: `userId`, `email`, `role`, `cajaId`, `socioId`, `tokenVersion`.
  - Inclusión de `tokenVersion`: Permite invalidar inmediatamente todos los access tokens emitidos a un usuario ante un cambio de contraseña o reseteo administrativo.
- **Refresh Token y Detección de Robo:**
  - Vida útil: **7 días**.
  - Almacenamiento: Se persiste en base de datos únicamente el **hash SHA-256** del token en bruto (`char(64)` en PostgreSQL).
  - **Single-Use Rotation:** En cada refresco, el refresh token utilizado se revoca y se emite uno nuevo.
  - **Family Tracking y Mitigación de Replay:** Cada cadena de refresco pertenece a un `family_id` (UUID). Si el sistema detecta que un token ya revocado intenta ser utilizado nuevamente (indicio de robo/interceptación por un atacante), revoca de inmediato **todos los tokens pertenecientes a esa familia**, forzando al usuario legítimo a reautenticarse.

### 3. Autenticación Multifactor (MFA) TOTP (RFC 6238)
- Obligatoria para usuarios con rol `ADMIN`.
- Algoritmo TOTP con clave secreta Base32 de 160 bits (20 bytes criptográficamente seguros) y ventana temporal de 30 segundos (tolerancia ±1 paso / ±30s).
- **Cifrado en reposo:** El secreto TOTP se almacena cifrado en la columna `totp_secret` mediante **AES-256-GCM** con vector de inicialización (IV) único de 12 bytes por registro.
- **Códigos de recuperación:** En el enrolamiento se generan 8 códigos de respaldo alfanuméricos de un solo uso, almacenados en BD con hash SHA-256.

### 4. Patrón Backend-For-Frontend (BFF) y Cookies Seguras
- El cliente web Next.js no expone tokens en `localStorage` ni en memoria de JavaScript en el navegador.
- Los endpoints BFF (`/api/auth/*`) manejan la comunicación con la API REST de Spring Boot e inyectan las cookies de sesión:
  - `HttpOnly`: Impide lectura por scripts del navegador (mitiga robo vía XSS).
  - `SameSite=Strict`: Protege contra ataques CSRF en navegadores modernos.
  - `Secure`: Transmisión únicamente sobre HTTPS en entornos productivos.
  - `Path=/`: Cobertura para todas las peticiones a la aplicación.
- El middleware de Next.js inspecciona la presencia de sesión y el rol (`ADMIN` vs `SOCIO`) antes de entregar páginas protegidas, inyectando cabeceras de endurecimiento HTTP:
  - `X-Frame-Options: DENY` (anti clickjacking).
  - `X-Content-Type-Options: nosniff` (anti MIME sniffing).
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

### 5. Auditoría Transaccional Append-Only
- Todos los eventos de autenticación (éxito, fallo de contraseña, bloqueo de cuenta, cambio de contraseña, MFA enrolado, reuso de token detectado) se registran de forma asíncrona e inmutable en `audit_log`.
- Se registra la dirección IP (tipo `inet` en PostgreSQL), `user_agent`, entidad afectada y payloads estructurados JSONB con el antes y después.

---

## Consecuencias
- **Positivas:**
  - Cumplimiento de estándares de seguridad bancaria y OWASP ASVS v4.0.
  - Resistencia a ataques de reutilización de tokens y fuerza bruta.
  - Separación limpia de responsabilidades entre el BFF y la lógica de negocio central.
- **Compromisos:**
  - Los administradores deben portar una app autenticadora (Google Authenticator, Microsoft Authenticator o Bitwarden).
  - Requiere sincronización precisa de reloj (NTP) en los servidores para la validación TOTP.
