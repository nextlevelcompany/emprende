import { getErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams.toString();
    const path = `/acciones/certificados${searchParams ? `?${searchParams}` : ""}`;
    
    // El backend filtra los certificados de SOCIO por la sesión autenticada.
    // No solicitar el padrón completo aquí: este endpoint también se usa en el portal personal.
    const backendRes = await fetchWithAuth(path, { cache: "no-store" });

    const text = await backendRes.text();
    let data;
    try {
      data = text ? JSON.parse(text) : [];
    } catch {
      data = { detail: text || "Respuesta no JSON del servidor" };
    }

    return NextResponse.json(data, {
      status: backendRes.status,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error: unknown) {
    return NextResponse.json({ detail: getErrorMessage(error, "Error al obtener certificados de acciones") }, { status: 500 });
  }
}

