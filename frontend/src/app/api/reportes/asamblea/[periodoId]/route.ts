import { getErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ periodoId: string }> }
) {
  try {
    const { periodoId } = await params;
    const res = await fetchWithAuth(`/reportes/asamblea/periodo/${periodoId}`);
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Error al obtener reporte de asamblea") },
      { status: 500 }
    );
  }
}
