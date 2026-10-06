# ADR 002: Arquitectura Modular Hexagonal para el Backend Spring Boot

- **Estado:** Aceptado
- **Fecha:** 2026-10-05
- **Autor:** Arquitecto de Software / Tech Lead

---

## Contexto
El sistema contable de la Caja Emprende Chambala requiere alta confiabilidad en el cálculo financiero, separación clara de responsabilidades, aislamiento entre módulos de negocio y facilidad de auditoría. Una arquitectura espagueti en la que los controladores expongan entidades JPA o donde las reglas de negocio financieras estén dispersas en la capa web generaría riesgos severos de integridad contable y fugas de seguridad.

---

## Decisión de Arquitectura

Se adopta una **arquitectura modular hexagonal (Ports & Adapters / DDD táctico)** en un monolito modular con **Spring Boot 3.4+**:

### 1. Módulos de Dominio (Paquetes de Primer Nivel)
```
com.cajachambala/
├── shared/          # Clases base, tipos de valor (Dinero), manejo global de errores RFC 9457
├── identity/        # Autenticación, usuarios, MFA, JWT, políticas de contraseñas
├── socios/          # Registro de socios y externos, datos personales (Ley 29733)
├── caja/            # Periodos mensuales, operaciones, conceptos, arqueo, cierre
├── prestamos/       # Solicitudes, cronogramas de pago, amortización, cobranza
├── ahorros/         # Aportes voluntarios, retiros, saldos
├── utilidades/      # Ejercicios anuales, cálculo proporcional a acciones
├── reportes/        # Vistas de libro de caja, estados de cuenta, exportación PDF/Excel
├── auditoria/       # Registro inmutable append-only de eventos del sistema
└── migracion/       # Importador del Excel, conciliación y cálculo de diferencias
```

### 2. Estructura de Capas dentro de cada Módulo
Cada módulo implementa una separación estricta:
1. **`domain`**:
   - Entidades puras y objetos de valor (ej. `Dinero`, `TasaInteres`).
   - Lógica de negocio y reglas contables independientes de Spring o frameworks externos.
   - Puertos de salida (interfaces de repositorios y servicios externos).
2. **`application`**:
   - Casos de uso (servicios de aplicación transaccionales `@Transactional`).
   - Orquestación de flujos de negocio.
   - Control de permisos mediante `@PreAuthorize`.
3. **`infrastructure`**:
   - Implementaciones JPA de los repositorios (`Spring Data JPA`).
   - Adaptadores de persistencia, integración con Flyway, clientes externos.
4. **`api`**:
   - Controladores REST (`@RestController`).
   - DTOs de entrada/salida (Requests/Responses) validados con Bean Validation (`@Valid`).
   - **Regla estricta:** Ningún controlador expone ni recibe entidades JPA directamente. La transformación se realiza mediante **MapStruct**.

### 3. Verificación Automatizada con ArchUnit
Se establecen pruebas automáticas de arquitectura (`ArchitectureTests`) ejecutadas en cada `mvn test`:
- Ninguna clase del paquete `api` puede acceder directamente a `infrastructure.persistence`.
- Las entidades de base de datos no deben ser utilizadas como tipos de retorno en controladores.
- Las dependencias entre módulos deben ser unidireccionales y a través de interfaces o eventos.

---

## Consecuencias

### Positivas:
- Mantenibilidad y desacoplamiento extremo.
- Lógica de amortización y cálculos financieros 100% testeable mediante pruebas unitarias sin levantar base de datos ni contexto de Spring.
- Preparado para evolucionar a microservicios independientes si el negocio lo requiriera a futuro, sin necesidad de reescritura.

### Negativas / Mitigaciones:
- Mayor número de clases (DTOs, Mappers, Interfaces). Mitigado con MapStruct y Records de Java 21.
