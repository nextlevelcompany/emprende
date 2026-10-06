import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const socioId = searchParams.get("socioId");
    const estado = searchParams.get("estado");
    const page = searchParams.get("page") || "0";
    const size = searchParams.get("size") || "20";

    const params = new URLSearchParams();
    if (socioId) params.set("socioId", socioId);
    if (estado) params.set("estado", estado);
    params.set("page", page);
    params.set("size", size);

    const res = await fetchWithAuth(`/prestamos?${params.toString()}`);
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al listar préstamos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetchWithAuth("/prestamos", {
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al solicitar préstamo" }, { status: 500 });
  }
}
