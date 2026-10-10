import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/api-client";

export async function proxyAuthenticatedAuthRequest(
  request: NextRequest,
  backendPath: string,
  options: { rotateTokens?: boolean; clearSession?: boolean } = {}
) {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get("access_token")?.value;
  const currentRefreshToken = cookieStore.get("refresh_token")?.value;
  const requestBody = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
  const makeRequest = (token: string) => fetch(getBackendUrl(backendPath), {
    method: request.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Forwarded-For": request.headers.get("x-forwarded-for") || "127.0.0.1",
      "User-Agent": request.headers.get("user-agent") || "NextJS-BFF",
    },
    ...(requestBody === undefined ? {} : { body: requestBody }),
    cache: "no-store",
  });
  let response: Response | null = accessToken ? await makeRequest(accessToken) : null;
  let rotatedTokens: { accessToken: string; refreshToken: string } | null = null;

  if ((!response || response.status === 401) && currentRefreshToken) {
    const refreshResponse = await fetch(getBackendUrl("/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": request.headers.get("user-agent") || "NextJS-BFF" },
      body: JSON.stringify({ refreshToken: currentRefreshToken }),
      cache: "no-store",
    });
    if (refreshResponse.ok) {
      const tokens = await refreshResponse.json() as { accessToken: string; refreshToken: string };
      rotatedTokens = tokens;
      accessToken = tokens.accessToken;
      response = await makeRequest(accessToken);
    } else {
      response = response || refreshResponse;
    }
  }
  if (!response) return NextResponse.json({ detail: "Sesión no válida. Vuelve a ingresar." }, { status: 401 });

  const text = response.status === 204 ? "" : await response.text();
  let data: unknown = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = { detail: text }; }
  }
  const result = text
    ? NextResponse.json(data, { status: response.status })
    : new NextResponse(null, { status: response.status });
  const isProduction = process.env.NODE_ENV === "production";

  if (rotatedTokens?.accessToken && rotatedTokens.refreshToken) {
    result.cookies.set("access_token", rotatedTokens.accessToken, { httpOnly: true, secure: isProduction, sameSite: "strict", path: "/", maxAge: 15 * 60 });
    result.cookies.set("refresh_token", rotatedTokens.refreshToken, { httpOnly: true, secure: isProduction, sameSite: "strict", path: "/", maxAge: 7 * 24 * 60 * 60 });
  }

  if (response.ok && options.rotateTokens && data && typeof data === "object") {
    const tokens = data as { accessToken?: string; refreshToken?: string };
    if (tokens.accessToken) result.cookies.set("access_token", tokens.accessToken, { httpOnly: true, secure: isProduction, sameSite: "strict", path: "/", maxAge: 15 * 60 });
    if (tokens.refreshToken) result.cookies.set("refresh_token", tokens.refreshToken, { httpOnly: true, secure: isProduction, sameSite: "strict", path: "/", maxAge: 7 * 24 * 60 * 60 });
  }
  if (response.ok && options.clearSession) {
    result.cookies.delete("access_token");
    result.cookies.delete("refresh_token");
  }
  return result;
}
