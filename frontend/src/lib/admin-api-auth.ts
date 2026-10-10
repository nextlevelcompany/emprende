import { NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/bff-client";

/** Verifies the session against the backend before serving admin-only BFF routes. */
export async function requireAdmin(): Promise<NextResponse | null> {
  try {
    const response = await fetchWithAuth("/auth/me", { cache: "no-store" });
    if (response.status === 401) {
      return NextResponse.json({ detail: "No autenticado" }, { status: 401 });
    }
    if (!response.ok) {
      return NextResponse.json({ detail: "No fue posible verificar la sesión" }, { status: 503 });
    }

    const user = await response.json();
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ detail: "Se requiere acceso de administrador" }, { status: 403 });
    }
    return null;
  } catch {
    return NextResponse.json({ detail: "No fue posible verificar la sesión" }, { status: 503 });
  }
}
