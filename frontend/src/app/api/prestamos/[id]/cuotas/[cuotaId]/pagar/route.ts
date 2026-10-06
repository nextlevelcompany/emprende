import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; cuotaId: string }> }
) {
  try {
    const { id, cuotaId } = await params;
    const body = await req.json();
    const res = await fetchWithAuth(`/prestamos/${id}/cuotas/${cuotaId}/pagar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al registrar pago de cuota" }, { status: 500 });
  }
}
