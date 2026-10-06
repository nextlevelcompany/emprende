# ADR 001: Estrategia y Plataforma de Despliegue

- **Estado:** Aceptado
- **Fecha:** 2026-10-05
- **Autor:** Arquitecto de Software / Tech Lead

---

## Contexto
El sistema "Caja Emprende Chambala" es una aplicación de gestión financiera para una caja comunal de ahorro y crédito. El sistema se compone de:
1. Un frontend web moderno en **Next.js 15/16 + React 19 + TypeScript + Tailwind CSS / shadcn/ui**.
2. Un backend robusto en **Java 21 LTS + Spring Boot 3.4+** con lógica de negocio financiera, cálculo de cronogramas, auditoría y control de acceso.
3. Una base de datos relacional **PostgreSQL 17** con extensiones (`citext`, `pg_trgm`), integridad referencial compuesta y Row Level Security (RLS).

### Restricción Crítica
**Vercel está diseñado exclusivamente para el hosting de aplicaciones frontend, sitios estáticos y funciones Serverless/Edge de corta duración.** Vercel no soporta:
- Contenedores Docker persistentes de larga ejecución.
- Servidores JVM / Spring Boot (con pool de conexiones HikariCP, tareas programadas, transacciones distribuidas).
- Servidores de base de datos PostgreSQL persistentes.

---

## Decisión de Arquitectura

Se adopta una arquitectura de despliegue desacoplada y cloud-native:

```
[ Navegador del Usuario / Móvil ]
            │ (HTTPS - Mismo origen)
            ▼
[ Frontend Next.js (Vercel) ] <--- Patrón BFF (Backend for Frontend)
            │ (Cookies HttpOnly, Secure, SameSite=Strict)
            │ (Llamadas backend con token de servicio / mTLS / Private URL)
            ▼
[ Backend Spring Boot en Contenedor Docker ] (Google Cloud Run / Render)
            │ (Pool HikariCP con SSL obligatorio)
            ▼
[ PostgreSQL 17 Gestionado ] (Neon Serverless Postgres / Supabase / RDS)
```

### Componentes de Producción:
1. **Frontend en Vercel:**
   - Despliegue nativo desde GitHub (`frontend/`).
   - Implementa el patrón **BFF (Backend-for-Frontend)** mediante Route Handlers de Next.js. El navegador del cliente nunca almacena JWTs en `localStorage` ni se comunica directamente con el backend Java en hosts cruzados.
2. **Backend en Servicio de Contenedores:**
   - **Opción Principal:** **Google Cloud Run** o **Render**.
   - Se empaqueta en una imagen Docker multi-stage mínima basada en `eclipse-temurin:21-jre` con usuario no privilegiado (`appuser`), variables de memoria (`JAVA_OPTS`), y `HEALTHCHECK` conectado a Spring Actuator (`/actuator/health`).
3. **Base de Datos Gestionada:**
   - **Neon Serverless PostgreSQL 17** o **Supabase Database**:
   - Conexiones encriptadas SSL/TLS.
   - Copias de seguridad automáticas diarias y Point-in-Time Recovery (PITR).
   - Roles de acceso con mínimo privilegio (`app_rw`, `app_ro`, `app_owner`).
4. **Entorno Local y de Pruebas:**
   - Orquestado completamente con **Docker Compose** (`docker-compose.yml`), incluyendo:
     - `db`: PostgreSQL 17 oficial con scripts de inicialización.
     - `backend`: Spring Boot compilado y ejecutado en contenedor.
     - `frontend`: Next.js en modo standalone.
     - `mailpit`: Servidor SMTP falso con visor web para validación de correos de activación y reseteo.

---

## Consecuencias

### Positivas:
- **Separación de responsabilidades:** Cada componente escala según su naturaleza (Vercel para CDN/Edge de frontend; Cloud Run para cómputo Java transaccional).
- **Seguridad ASVS 4.0:** No hay exposición de tokens JWT en el almacenamiento del navegador. Las cookies `HttpOnly` mitigan riesgos de XSS.
- **Portabilidad:** El backend Dockerizado se puede mover entre cualquier proveedor cloud (GCP, AWS ECS, Render, Railway, Bare-metal) sin cambios en el código.
- **Costos eficientes:** Adecuado para el volumen de una caja comunal (pocos cientos de usuarios), operando dentro de capas gratuitas o de bajísimo costo.

### Negativas / Mitigaciones:
- Requiere configuración de CORS y token de comunicación entre Vercel y el backend, resuelto mediante cabecera de autenticación de servicio interna o redes privadas.
