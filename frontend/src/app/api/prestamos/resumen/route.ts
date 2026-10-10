import { getErrorMessage } from "@/lib/error-message";
import { NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";

export async function GET() {
  try {
    const res = await fetchWithAuth("/prestamos/resumen");
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error, "Error al obtener resumen de cartera") }, { status: 500 });
  }
}
