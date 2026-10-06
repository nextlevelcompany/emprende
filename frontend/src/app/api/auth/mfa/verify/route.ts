import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/api-client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "NextJS-BFF";

    const backendRes = await fetch(getBackendUrl("/auth/mfa/verify"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": clientIp,
        "User-Agent": userAgent,
      },
      body: JSON.stringify({
        mfaToken: body.mfaToken,
        code: body.code,
      }),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === "production";

    if (data.accessToken) {
      cookieStore.set("access_token", data.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "strict",
        path: "/",
        maxAge: 15 * 60,
      });
    }

    if (data.refreshToken) {
      cookieStore.set("refresh_token", data.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    return NextResponse.json({
      success: true,
      user: data.user,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        title: "Error de Servidor BFF",
        detail: error?.message || "No fue posible verificar el código MFA",
      },
      { status: 500 }
    );
  }
}
