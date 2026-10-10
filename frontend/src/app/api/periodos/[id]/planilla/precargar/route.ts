import { getErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backendRes = await fetchWithAuth(`/periodos/${id}/planilla/precargar`, {
      method: "POST",
    });
    const text = await backendRes.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { detail: text || "Respuesta no JSON" };
    }
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: unknown) {
    return NextResponse.json({ detail: getErrorMessage(error, "Error al pre-cargar planilla") }, { status: 500 });
  }
}
