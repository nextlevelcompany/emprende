import { getErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.toString();
    const endpoint = query ? `/auditoria?${query}` : "/auditoria";

    const res = await fetchWithAuth(endpoint);
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Error al obtener la pista de auditoría") },
      { status: 500 }
    );
  }
}
