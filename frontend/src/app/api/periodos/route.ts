import { getErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";

export async function GET() {
  try {
    const backendRes = await fetchWithAuth("/periodos");
    const text = await backendRes.text();
    let data;
    try {
      data = text ? JSON.parse(text) : [];
    } catch {
      data = { detail: text || "Respuesta no JSON" };
    }
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: unknown) {
    return NextResponse.json({ detail: getErrorMessage(error, "Error al listar periodos") }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const backendRes = await fetchWithAuth("/periodos", {
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
    return NextResponse.json({ detail: getErrorMessage(error, "Error al crear periodo") }, { status: 500 });
  }
}
