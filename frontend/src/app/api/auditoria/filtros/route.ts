import { NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";

export async function GET() {
  try {
    const [resAcciones, resEntidades] = await Promise.all([
      fetchWithAuth("/auditoria/acciones"),
      fetchWithAuth("/auditoria/entidades"),
    ]);

    const acciones = resAcciones.ok ? await resAcciones.json() : [];
    const entidades = resEntidades.ok ? await resEntidades.json() : [];

    return NextResponse.json({ acciones, entidades });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error al obtener filtros de auditoría" },
      { status: 500 }
    );
  }
}
