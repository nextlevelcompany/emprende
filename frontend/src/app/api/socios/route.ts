import { getErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";
import { enriquecerSocioConDatosPersonales } from "@/lib/socios-datos-personales";

export async function GET(req: NextRequest) {
  try {
    const searchParams = new URLSearchParams(req.nextUrl.searchParams);
    if (!searchParams.has("size")) {
      searchParams.set("size", "100");
    }
    const queryString = searchParams.toString();
    const path = `/socios?${queryString}`;

    const backendRes = await fetchWithAuth(path);
    const text = await backendRes.text();
    let data;
    try {
      data = text ? JSON.parse(text) : [];
    } catch {
      data = { detail: text || "Respuesta no JSON del servidor" };
    }

    if (data && Array.isArray(data.content)) {
      data.content = data.content.map(enriquecerSocioConDatosPersonales);
    } else if (Array.isArray(data)) {
      data = data.map(enriquecerSocioConDatosPersonales);
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
    return NextResponse.json({ detail: getErrorMessage(error, "Error al listar socios") }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const backendRes = await fetchWithAuth("/socios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await backendRes.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { detail: text || "Respuesta no JSON del servidor" };
    }
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: unknown) {
    return NextResponse.json({ detail: getErrorMessage(error, "Error al crear socio") }, { status: 500 });
  }
}
