import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // Ignorar peticiones de prefetch para evitar ciclos de redirección en el router del cliente
  const isPrefetch =
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("sec-purpose") === "prefetch" ||
    request.headers.get("x-nextjs-data") !== null ||
    request.headers.get("next-router-prefetch") !== null;

  if (isPrefetch) {
    return NextResponse.next();
  }

  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isSocioRoute = pathname.startsWith("/socio") && pathname !== "/login";

  // Si intenta acceder a una ruta protegida sin ninguna cookie de sesión
  if ((isAdminRoute || isSocioRoute) && !accessToken && !refreshToken) {
    const loginUrl = new URL(isAdminRoute ? "/admin/login" : "/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si hay access token, decodificar claims para validar roles en navegación
  if (accessToken && (isAdminRoute || isSocioRoute)) {
    try {
      const parts = accessToken.split(".");
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
        const payload = JSON.parse(payloadJson);

        if (isAdminRoute && payload.role !== "ADMIN") {
          return NextResponse.redirect(new URL("/login", request.url));
        }

        if (isSocioRoute && payload.role !== "SOCIO") {
          return NextResponse.redirect(new URL("/admin/dashboard", request.url));
        }
      }
    } catch {
      // Si el token está mal formado, redirigir al login correspondiente
      return NextResponse.redirect(new URL(isAdminRoute ? "/admin/login" : "/login", request.url));
    }
  }

  // Inyectar cabeceras de seguridad
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/socio/:path*",
  ],
};
