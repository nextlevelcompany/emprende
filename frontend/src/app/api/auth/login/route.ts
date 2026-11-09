import { getErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/api-client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const portal = body.portal || "GENERIC";

    let endpoint = "/auth/login";
    if (portal === "ADMIN") {
      endpoint = "/auth/admin/login";
    } else if (portal === "SOCIO") {
      endpoint = "/auth/socio/login";
    }

    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "NextJS-BFF";

    const backendRes = await fetch(getBackendUrl(endpoint), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": clientIp,
        "User-Agent": userAgent,
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
      }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    // Si requiere segundo factor MFA
    if (data.mfaRequired) {
      return NextResponse.json({
        mfaRequired: true,
        mfaToken: data.mfaToken,
      });
    }

    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === "production";
    const isHttps = req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
    const secureCookie = isProduction && isHttps;

    if (data.accessToken) {
      cookieStore.set("access_token", data.accessToken, {
        httpOnly: true,
        secure: secureCookie,
        sameSite: "lax",
        path: "/",
        maxAge: 4 * 60 * 60, // 4 horas
      });
    }

    if (data.refreshToken) {
      cookieStore.set("refresh_token", data.refreshToken, {
        httpOnly: true,
        secure: secureCookie,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 días
      });
    }

    return NextResponse.json({
      mfaRequired: false,
      user: data.user,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        title: "Error de Servidor BFF",
        detail: getErrorMessage(error, "No fue posible conectar con el servidor de autenticación"),
      },
      { status: 500 }
    );
  }
}
