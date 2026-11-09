import { getErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/api-client";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!accessToken && !refreshToken) {
      return NextResponse.json({ detail: "No autenticado" }, { status: 401 });
    }

    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "NextJS-BFF";

    if (accessToken) {
      const backendRes = await fetch(getBackendUrl("/auth/me"), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (backendRes.ok) {
        const user = await backendRes.json();
        return NextResponse.json(user);
      }
    }

    // Si el access token expiró pero hay refresh token, intentar rotación automática
    if (refreshToken) {
      const refreshRes = await fetch(getBackendUrl("/auth/refresh"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Forwarded-For": clientIp,
          "User-Agent": userAgent,
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const tokenData = await refreshRes.json();
        const isProduction = process.env.NODE_ENV === "production";

        cookieStore.set("access_token", tokenData.accessToken, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: 4 * 60 * 60,
        });

        cookieStore.set("refresh_token", tokenData.refreshToken, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60,
        });

        // Reintentar /auth/me con el nuevo token
        const userRes = await fetch(getBackendUrl("/auth/me"), {
          headers: { Authorization: `Bearer ${tokenData.accessToken}` },
        });

        if (userRes.ok) {
          const user = await userRes.json();
          return NextResponse.json(user);
        }
      }
    }

    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
    return NextResponse.json({ detail: "Sesión expirada" }, { status: 401 });
  } catch (error: unknown) {
    return NextResponse.json(
      { detail: getErrorMessage(error, "Error al consultar perfil de usuario") },
      { status: 500 }
    );
  }
}
