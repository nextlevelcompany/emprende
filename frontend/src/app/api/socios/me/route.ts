import { getErrorMessage } from "@/lib/error-message";
import { NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";

export async function GET() {
  try {
    const response = await fetchWithAuth("/socios/me", { cache: "no-store" });
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? getErrorMessage(error, "Ocurrió un error") : "No se pudo cargar tu perfil";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
