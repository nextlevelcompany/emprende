import { NextRequest, NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";
import { requireAdmin } from "@/lib/admin-api-auth";

const BACKEND_PATH = "/institucional/empresa/empresa";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;
  const response = await fetchWithAuth(BACKEND_PATH, { cache: "no-store" });
  return new NextResponse(await response.text(), { status: response.status, headers: { "Content-Type": "application/json" } });
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;
  const response = await fetchWithAuth(BACKEND_PATH, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(await req.json()),
  });
  return new NextResponse(await response.text(), { status: response.status, headers: { "Content-Type": "application/json" } });
}
