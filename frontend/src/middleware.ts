import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Las rutas BFF autentican mediante cookies HttpOnly. Exigir origen propio
  // en toda operación que pueda modificar estado (incluye login y refresh).
  if (pathname.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const secFetchSite = request.headers.get("sec-fetch-site");
    let sameOrigin = false;

    if (secFetchSite === "same-origin") {
      sameOrigin = true;
    } else if (origin) {
      try {
        const originUrl = new URL(origin);
        const hostHeader = request.headers.get("x-forwarded-host") || request.headers.get("host");
        const hostNameOnly = hostHeader ? hostHeader.split(":")[0].toLowerCase() : null;

        if (originUrl.origin === request.nextUrl.origin) {
          sameOrigin = true;
        } else if (hostNameOnly && originUrl.hostname.toLowerCase() === hostNameOnly) {
          sameOrigin = true;
        }
      } catch {
        sameOrigin = false;
      }
    } else {
      sameOrigin = !secFetchSite || secFetchSite === "same-origin";
    }

    if (!sameOrigin) {
      return NextResponse.json({ detail: "Origen de solicitud no permitido" }, { status: 403 });
    }
  }
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

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAdminRoute = (pathname.startsWith("/admin") && pathname !== "/admin/login") || isDashboardRoute;
  const isSocioRoute = pathname.startsWith("/socio");

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
          // Un socio intentando entrar a admin → mandarlo a su portal
          return NextResponse.redirect(new URL("/socio/mi-cuenta", request.url));
        }

        if (isSocioRoute && payload.role !== "SOCIO") {
          // Un admin intentando entrar al portal de socio → mandarlo al panel admin
          return NextResponse.redirect(new URL("/dashboard/analytics", request.url));
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
    "/dashboard/:path*",
    "/api/:path*",
  ],
};
