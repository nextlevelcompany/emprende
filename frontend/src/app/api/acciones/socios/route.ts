import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";
import { enriquecerSocioConDatosPersonales } from "@/lib/socios-datos-personales";

export async function GET(req: NextRequest) {
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
        const sociosMap = new Map<string, any>();
        for (const s of listaSocios) {
          const enriched = enriquecerSocioConDatosPersonales(s);
          if (enriched.id) sociosMap.set(String(enriched.id), enriched);
          if (enriched.codigo) sociosMap.set(String(enriched.codigo), enriched);
        }

        data = data.map((item: any) => {
          const socioEncontrado =
            (item.socioId && sociosMap.get(String(item.socioId))) ||
            (item.socioCodigo && sociosMap.get(String(item.socioCodigo)));
          if (socioEncontrado) {
            return {
              ...item,
              socioNombre: socioEncontrado.nombreCompleto || item.socioNombre,
              documentoNumero: socioEncontrado.documentoNumero || item.documentoNumero,
              socioDocumentoNumero: socioEncontrado.documentoNumero || item.socioDocumentoNumero,
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
  } catch (error: any) {
    return NextResponse.json({ detail: error?.message || "Error al obtener socios con acciones" }, { status: 500 });
  }
}

