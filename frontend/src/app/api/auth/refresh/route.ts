import { getErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/api-client";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const currentRefreshToken = cookieStore.get("refresh_token")?.value;

    if (!currentRefreshToken) {
      return NextResponse.json({ detail: "Sesión expirada" }, { status: 401 });
    }

    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "NextJS-BFF";

    const backendRes = await fetch(getBackendUrl("/auth/refresh"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": clientIp,
        "User-Agent": userAgent,
      },
      body: JSON.stringify({
        refreshToken: currentRefreshToken,
      }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      // Si falla la rotación (token inválido o reuso), limpiar cookies
      cookieStore.delete("access_token");
      cookieStore.delete("refresh_token");
      return NextResponse.json(data, { status: backendRes.status });
    }

    const isProduction = process.env.NODE_ENV === "production";

    if (data.accessToken) {
      cookieStore.set("access_token", data.accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 4 * 60 * 60,
      });
    }

    if (data.refreshToken) {
      cookieStore.set("refresh_token", data.refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { detail: getErrorMessage(error, "Error al refrescar token") },
      { status: 500 }
    );
  }
}
