# Dominio y HTTPS en producción

La pila de producción usa Caddy como proxy inverso. Caddy obtiene y renueva automáticamente el certificado TLS para `APP_DOMAIN`.

## Requisitos antes de iniciar

1. Elegir un dominio público y crear un registro DNS `A` para que apunte a la IP pública del servidor. Si se publica un registro `AAAA`, también debe apuntar a una dirección IPv6 funcional.
2. Permitir tráfico entrante TCP en los puertos 80 y 443 en el firewall del proveedor y del servidor. UDP 443 es opcional y habilita HTTP/3.
3. Configurar `APP_DOMAIN` con el nombre DNS exacto, sin `https://` ni una ruta. Configurar `APP_CORS_ALLOWED_ORIGIN=https://<APP_DOMAIN>` y `FRONTEND_BASE_URL=https://<APP_DOMAIN>`.
4. El frontend debe unirse a `proxy_net` y escuchar en el puerto 3000; la URL pública de la API debe ser `https://<APP_DOMAIN>/api/v1` durante su compilación.

El proxy sirve `/api/*` desde el backend y las demás rutas desde el frontend. El puerto 8080 del backend no se publica en el host. PostgreSQL permanece sin puertos publicados y solo es alcanzable por los servicios de la red privada Docker, que no tiene salida a Internet. El backend conserva salida a Internet mediante `proxy_net` para correo SMTP.

No iniciar la pila hasta que exista DNS público correcto y el servicio `frontend` esté definido y conectado a `proxy_net` en `docker-compose.prod.yml`. Caddy requiere acceso público a los puertos 80/443 para emitir y renovar certificados automáticamente.
