import { getErrorMessage } from "@/lib/error-message";
import { NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";
import { enriquecerSocioConDatosPersonales } from "@/lib/socios-datos-personales";

export async function GET() {
  try {
    const [backendRes, sociosRes] = await Promise.all([
      fetchWithAuth("/acciones/socios"),
      fetchWithAuth("/socios?size=200").catch(() => null),
    ]);

    const text = await backendRes.text();
    let data;
    try {
      data = text ? JSON.parse(text) : [];
    } catch {
      data = { detail: text || "Respuesta no JSON del servidor" };
    }

    if (Array.isArray(data) && sociosRes && sociosRes.ok) {
      try {
        const sociosData = await sociosRes.json();
        const listaSocios = Array.isArray(sociosData) ? sociosData : sociosData.content || [];
        const sociosMap = new Map<string, Record<string, unknown>>();
        for (const s of listaSocios) {
          const enriched = enriquecerSocioConDatosPersonales(s as Record<string, unknown>);
          if (enriched.id) sociosMap.set(String(enriched.id), enriched);
          if (enriched.codigo) sociosMap.set(String(enriched.codigo), enriched);
        }

        data = data.map((item: Record<string, unknown>) => {
          const socioId = item.socioId == null ? null : String(item.socioId);
          const socioCodigo = item.socioCodigo == null ? null : String(item.socioCodigo);
          const socioEncontrado = (socioId ? sociosMap.get(socioId) : undefined)
            ?? (socioCodigo ? sociosMap.get(socioCodigo) : undefined);
          if (socioEncontrado) {
            return {
              ...item,
              socioNombre: (typeof socioEncontrado.nombreCompleto === "string" && socioEncontrado.nombreCompleto) || item.socioNombre,
              documentoNumero: (typeof socioEncontrado.documentoNumero === "string" && socioEncontrado.documentoNumero) || item.documentoNumero,
              socioDocumentoNumero: (typeof socioEncontrado.documentoNumero === "string" && socioEncontrado.documentoNumero) || item.socioDocumentoNumero,
            };
          }
          return item;
        });
      } catch (enrichErr) {
        console.error("Error al enriquecer socios con acciones:", enrichErr);
      }
    }

    return NextResponse.json(data, {
      status: backendRes.status,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error: unknown) {
    return NextResponse.json({ detail: getErrorMessage(error, "Error al obtener socios con acciones") }, { status: 500 });
  }
}

