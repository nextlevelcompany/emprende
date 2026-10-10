# Revisión de datos personales en migraciones

## Hallazgos

La revisión estática encontró datos identificables embebidos en migraciones Flyway:

- `V1__init_schema.sql` crea usuarios/socios de muestra con nombres y datos identificatorios. Revisar los `INSERT` históricos de `socio` y `app_user` antes de publicar el repositorio.
- `V6__matricula_acciones_certificados_y_transferencias.sql` contiene cientos de registros de certificados y transferencias. Las observaciones de transferencias incluyen nombres completos, motivo de retiro, fechas y montos; los UUID se enlazan con socios. Es información financiera identificable, aunque los valores pudieran ser ficticios.
- `V8__junta_directiva.sql` incluye información identificable de directivos en la carga inicial.
- `V10__registro_institucional.sql` inserta DNI, nombres, teléfonos, correos, dirección y datos de representantes/accionistas en JSON. Los documentos parecen datos de ejemplo, pero no se puede confirmar solo desde el repositorio.

## Tratamiento aplicado

No se alteraron migraciones ya versionadas ni se creó una migración que borre o reemplace esas filas. Flyway registra checksums y puede haber bases que ya aplicaron estos archivos; cambiar el historial o alterar registros en producción podría romper despliegues o destruir datos legítimos.

La migración automática todavía contiene esos valores: esta revisión no afirma que estén sanitizados. El despliegue de una instalación nueva debe quedar bloqueado hasta confirmar su origen y preparar un camino de migración limpio. Una vez confirmados como datos ficticios, se debe preparar una línea base limpia para instalaciones nuevas y una estrategia separada de depuración de historial Git. Si son datos reales, deben sustituirse mediante un proceso aprobado de anonimización, conservando una copia de respaldo y la trazabilidad requerida. No se editaron archivos Flyway ya versionados porque no se conoce qué bases registraron sus checksums.

## Verificación contra la base de datos

El repositorio por sí solo no contiene la base real. Ejecutar ambos scripts con una conexión DBA de solo lectura que pueda ver todas las filas (el rol `app_rw` está sujeto a RLS y podría producir conteos parciales). `scripts/audit_migration_seed_data.sql` obtiene conteos de datos personales sin imprimirlos; `scripts/validate_multicaja_integrity.sql` diagnostica las relaciones de V15. La fase `VALIDATE CONSTRAINT` es opt-in y aborta si encuentra referencias entre cajas. Resolver cada fila con responsables de negocio antes de modificarla.

## Clave del contexto RLS

`RLS_CONTEXT_HMAC_SECRET_HEX` debe ser una clave aleatoria de 32 bytes representada por 64 caracteres hexadecimales. Debe mantenerse idéntica entre backend y migrador y no debe rotarse cambiando solo la variable del backend: la clave verificadora se guarda en el esquema privado de la base. La rotación requiere una operación coordinada que actualice base y aplicaciones.

V16 guarda la clave en un esquema privado, revoca su lectura para los roles de aplicación y reemplaza las funciones RLS para devolver el contexto solo cuando la firma HMAC del backend coincide. En producción, el migrador y el backend deben desplegarse juntos con la misma clave. Un rollback a una versión anterior al firmador dejará sus consultas RLS sin contexto válido.

## Verificación y endurecimiento en Docker

El 2026-10-10 se respaldó y revisó la base Docker `caja_chambala` antes de aplicar cambios. Flyway validó las migraciones y quedó en V18. V17 instala `pgcrypto`, que no estaba disponible y era requerido por el verificador HMAC de V16.

- `app_rw` quedó sin `BYPASSRLS`; `app_ro` quedó sin login ni grants de tablas.
- Las 11 claves foráneas compuestas se compararon con los datos reales: todas reportaron cero relaciones cruzadas y luego quedaron validadas.
- Se comprobó que un contexto HMAC de administrador puede leer los datos de su caja, uno de socio queda limitado a su propio registro y una firma inventada no devuelve filas.
- Se rotaron las contraseñas de PostgreSQL y de los roles de aplicación. El puerto del contenedor quedó publicado solo en `127.0.0.1:5433`.
- El secreto JWT de desarrollo se rotó. La clave AES histórica se conservó para no invalidar ciphertext existente; rotarla requiere re cifrar previamente los datos.
- El backend y la base terminaron healthy. Se conservó el respaldo previo a los cambios fuera del repositorio.

La sanitización de valores personales en migraciones históricas sigue pendiente: no se cambió el historial Flyway ni se borraron registros cuyo origen o uso institucional no está confirmado. Antes de distribuir el repositorio o crear nuevas instalaciones, responsables de negocio deben confirmar qué valores son de prueba y aprobar una estrategia de anonimización que mantenga la trazabilidad necesaria.
