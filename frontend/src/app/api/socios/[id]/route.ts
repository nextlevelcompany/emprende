import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";
import { enriquecerSocioConDatosPersonales } from "@/lib/socios-datos-personales";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backendRes = await fetchWithAuth(`/socios/${id}`);
    const data = await backendRes.json();
    const enriched = data && !data.detail ? enriquecerSocioConDatosPersonales(data) : data;
    return NextResponse.json(enriched, {
      status: backendRes.status,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ detail: error?.message || "Error al obtener socio" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { numeroDocumento, documentoNumero, ...backendPayload } = body || {};
    const backendRes = await fetchWithAuth(`/socios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(backendPayload),
    });
    const data = await backendRes.json();
    let enriched = data && !data.detail ? enriquecerSocioConDatosPersonales(data) : data;

    // Garantizar que si el usuario envió nombres o DNI actualizados, se devuelvan de inmediato
    if (enriched && typeof enriched === "object" && !enriched.detail && body) {
      if (body.nombres && body.apellidos) {
        enriched.nombres = body.nombres.trim();
        enriched.apellidos = body.apellidos.trim();
        enriched.nombreCompleto = `${body.apellidos.trim()} ${body.nombres.trim()}`;
      }
      const dni = (body.numeroDocumento || body.documentoNumero || "").trim();
      if (dni) {
        enriched.documentoNumero = dni;
        enriched.numeroDocumento = dni;
        enriched.documentoEnmascarado = dni;
      }
    }

    return NextResponse.json(enriched, {
      status: backendRes.status,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ detail: error?.message || "Error al actualizar socio" }, { status: 500 });
  }
}
