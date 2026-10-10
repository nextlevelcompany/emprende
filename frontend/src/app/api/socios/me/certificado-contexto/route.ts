import { getErrorMessage } from "@/lib/error-message";
import { NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";

export async function GET() {
  try {
    const response = await fetchWithAuth("/socios/me/certificado-contexto", { cache: "no-store" });
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { detail: getErrorMessage(error, "No se pudo cargar la información institucional del certificado") },
      { status: 500 }
    );
  }
}
