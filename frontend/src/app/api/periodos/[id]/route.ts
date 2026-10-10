import { getErrorMessage } from "@/lib/error-message";
import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const backendRes = await fetchWithAuth(`/periodos/${id}`);
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: unknown) {
    return NextResponse.json({ detail: getErrorMessage(error, "Error al obtener periodo") }, { status: 500 });
  }
}
