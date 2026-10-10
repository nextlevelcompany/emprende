import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";
import { requireAdmin } from "@/lib/admin-api-auth";

async function proxy(path: string, init?: RequestInit) {
  const response = await fetchWithAuth(path, init);
  if (response.status === 204) return NextResponse.json({ success: true });
  return new NextResponse(await response.text(), { status: response.status, headers: { "Content-Type": "application/json" } });
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;
  return proxy("/institucional/accionistas", { cache: "no-store" });
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;
  const body = await req.json();
  const acciones = Number(body.accionesFundacion) || 1;
  const payload = {
    ...body,
    codigo: Number(body.codigo) || undefined,
    nombreCompleto: body.nombreCompleto?.trim() || "",
    documentoNumero: body.documentoNumero?.trim() || "",
    fechaIngreso: body.fechaIngreso || "2021-06-08",
    accionesFundacion: acciones,
    capitalInicial: Number(body.capitalInicial) || acciones * 30,
    rolFundacion: body.rolFundacion?.trim() || "Socio Fundador",
    estado: body.estado || "ACTIVO",
    observaciones: body.observaciones?.trim() || "",
  };
  return proxy("/institucional/accionistas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;
  const body = await req.json();
  if (!body.id) return NextResponse.json({ detail: "ID requerido" }, { status: 400 });
  return proxy(`/institucional/accionistas/${encodeURIComponent(body.id)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ detail: "ID requerido" }, { status: 400 });
  return proxy(`/institucional/accionistas/${encodeURIComponent(id)}`, { method: "DELETE" });
}
