import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/api-client";

export async function POST(request: NextRequest) {
  try {
    const backendResponse = await fetch(getBackendUrl("/auth/email-change/confirm"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": request.headers.get("user-agent") || "NextJS-BFF" },
      body: await request.text(),
      cache: "no-store",
    });
    const body = backendResponse.status === 204 ? "" : await backendResponse.text();
    const result = body
      ? (() => { try { return NextResponse.json(JSON.parse(body), { status: backendResponse.status }); } catch { return NextResponse.json({ detail: body }, { status: backendResponse.status }); } })()
      : new NextResponse(null, { status: backendResponse.status });
    if (backendResponse.ok) {
      result.cookies.delete("access_token");
      result.cookies.delete("refresh_token");
    }
    return result;
  } catch {
    return NextResponse.json({ detail: "No se pudo conectar para confirmar el correo." }, { status: 502 });
  }
}
