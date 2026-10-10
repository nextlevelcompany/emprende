import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";
import { enriquecerSocioConDatosPersonales } from "@/lib/socios-datos-personales";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams.toString();
    const path = `/acciones/certificados${searchParams ? `?${searchParams}` : ""}`;
    
    // Obtenemos certificados y la lista de socios para sincronizar nombres y DNI actualizados
    const [backendRes, sociosRes] = await Promise.all([
      fetchWithAuth(path),
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

        data = data.map((cert: any) => {
          const socioEncontrado =
            (cert.socioId && sociosMap.get(String(cert.socioId))) ||
            (cert.socioCodigo && sociosMap.get(String(cert.socioCodigo)));
          if (socioEncontrado) {
            return {
              ...cert,
              socioNombre: socioEncontrado.nombreCompleto || cert.socioNombre,
              socioDocumentoNumero:
                socioEncontrado.documentoNumero ||
                socioEncontrado.numeroDocumento ||
                socioEncontrado.documentoEnmascarado ||
                cert.socioDocumentoNumero,
              socioDocumentoTipo: socioEncontrado.documentoTipo || cert.socioDocumentoTipo || "DNI",
            };
          }
          return cert;
        });
      } catch (enrichErr) {
        console.error("Error al enriquecer certificados con datos de socios:", enrichErr);
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
    return NextResponse.json({ detail: error?.message || "Error al obtener certificados de acciones" }, { status: 500 });
  }
}

