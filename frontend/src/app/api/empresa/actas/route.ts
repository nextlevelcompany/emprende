import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";
import { requireAdmin } from "@/lib/admin-api-auth";

async function proxy(path: string, init?: RequestInit) {
  const response = await fetchWithAuth(path, init);
  if (response.status === 204) return NextResponse.json({ success: true });
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;
  return proxy("/institucional/actas", { cache: "no-store" });
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;
  const body = await req.json();
  const today = new Date().toISOString().slice(0, 10);
  const payload = {
    ...body,
    numeroActa: body.numeroActa || `Acta N° ${Date.now()}-${new Date().getFullYear()}`,
    tipo: body.tipo || "ORDINARIA",
    tipoTitulo: body.tipoTitulo || "Asamblea General Ordinaria",
    fecha: body.fecha || today,
    hora: body.hora || "14:00",
    lugar: body.lugar || "Local Comunal de Chambala",
    presidente: body.presidente || "",
    secretario: body.secretario || "",
    asistentes: Number(body.asistentes) || 0,
    quorumPorcentaje: Number(body.quorumPorcentaje) || 0,
    agenda: Array.isArray(body.agenda) ? body.agenda : body.agenda ? [body.agenda] : [],
    acuerdos: Array.isArray(body.acuerdos) ? body.acuerdos : body.acuerdos ? [body.acuerdos] : [],
    resumen: body.resumen || "",
    archivoNombre: body.archivoNombre || "",
    archivoTipo: body.archivoTipo || "",
    archivoTamano: Number(body.archivoTamano) || 0,
    archivoData: body.archivoData || "",
    fechaRegistro: today,
  };
  return proxy("/institucional/actas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;
  const body = await req.json();
  if (!body.id) return NextResponse.json({ detail: "ID de acta requerido" }, { status: 400 });
  return proxy(`/institucional/actas/${encodeURIComponent(body.id)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ detail: "ID de acta requerido" }, { status: 400 });
  return proxy(`/institucional/actas/${encodeURIComponent(id)}`, { method: "DELETE" });
}
