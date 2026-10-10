import { getErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";

export async function GET() {
  try {
    const backendRes = await fetchWithAuth("/acciones/transferencias");
    const text = await backendRes.text();
    let data;
    try {
      data = text ? JSON.parse(text) : [];
    } catch {
      data = { detail: text || "Respuesta no JSON del servidor" };
    }
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: unknown) {
    return NextResponse.json({ detail: getErrorMessage(error, "Error al obtener transferencias de acciones") }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const backendRes = await fetchWithAuth("/acciones/transferencias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await backendRes.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { detail: text || "Respuesta no JSON del servidor" };
    }
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: unknown) {
    return NextResponse.json({ detail: getErrorMessage(error, "Error al procesar transferencia de acciones") }, { status: 500 });
  }
}
