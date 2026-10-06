import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ socioId: string }> }
) {
  try {
    const { socioId } = await params;
    const res = await fetchWithAuth(`/reportes/socio/${socioId}`);
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener estado de cuenta de socio" },
      { status: 500 }
    );
  }
}
