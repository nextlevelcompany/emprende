import { getErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const soloActivos = searchParams.get("soloActivos");
    const query = soloActivos ? `?soloActivos=${soloActivos}` : "";
    const backendRes = await fetchWithAuth(`/directiva${query}`);
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: unknown) {
    return NextResponse.json({ detail: getErrorMessage(error, "Error al listar cargos de directiva") }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const backendRes = await fetchWithAuth("/directiva", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: unknown) {
    return NextResponse.json({ detail: getErrorMessage(error, "Error al actualizar cargos de directiva") }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const backendRes = await fetchWithAuth("/directiva", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: unknown) {
    return NextResponse.json({ detail: getErrorMessage(error, "Error al guardar cargos de directiva") }, { status: 500 });
  }
}
