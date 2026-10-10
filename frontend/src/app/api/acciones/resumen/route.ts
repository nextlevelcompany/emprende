import { getErrorMessage } from "@/lib/error-message";
import { NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";

export async function GET() {
  try {
    const backendRes = await fetchWithAuth("/acciones/resumen");
    const text = await backendRes.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { detail: text || "Respuesta no JSON del servidor" };
    }
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: unknown) {
    return NextResponse.json({ detail: getErrorMessage(error, "Error al obtener resumen de acciones") }, { status: 500 });
  }
}
