import { NextRequest } from "next/server";
import { proxyAuthenticatedAuthRequest } from "@/lib/auth-proxy";

export async function POST(request: NextRequest) {
  return proxyAuthenticatedAuthRequest(request, "/auth/mfa/disable", { clearSession: true });
}
