import { getErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";

export async function GET() {
  try {
    const res = await fetchWithAuth("/utilidades");
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error, "Error al listar distribuciones de utilidades") }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetchWithAuth("/utilidades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error, "Error al guardar borrador de distribución") }, { status: 500 });
  }
}
