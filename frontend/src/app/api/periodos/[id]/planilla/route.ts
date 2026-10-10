import { getErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backendRes = await fetchWithAuth(`/periodos/${id}/planilla`);
    const text = await backendRes.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { detail: text || "Respuesta no JSON" };
    }
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: unknown) {
    return NextResponse.json({ detail: getErrorMessage(error, "Error al obtener planilla mensual") }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const backendRes = await fetchWithAuth(`/periodos/${id}/planilla`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
    return NextResponse.json({ detail: getErrorMessage(error, "Error al guardar planilla mensual") }, { status: 500 });
  }
}
