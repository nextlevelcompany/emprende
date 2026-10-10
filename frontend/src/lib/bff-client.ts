import { cookies } from "next/headers";
import { getBackendUrl } from "./api-client";

export async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  const headers = new Headers(options.headers || {});
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let res = await fetch(getBackendUrl(path), {
    ...options,
    headers,
  });

  // Si no está autorizado, intentar renovar la sesión existente.
  if (res.status === 401 && cookieStore.get("refresh_token")?.value) {
    let newAccessToken: string | null = null;
    let newRefreshToken: string | null = null;
    const refreshToken = cookieStore.get("refresh_token")?.value;

    // 1. Intentar rotación por refresh token si existe
    if (refreshToken) {
      try {
        const refreshRes = await fetch(getBackendUrl("/auth/refresh"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const tokenData = await refreshRes.json();
          newAccessToken = tokenData.accessToken;
          newRefreshToken = tokenData.refreshToken || refreshToken;
        }
      } catch {}
    }

    // Si obtuvimos token válido, actualizar cookies y reintentar la petición original
    if (newAccessToken) {
      const isProduction = process.env.NODE_ENV === "production";
      try {
        cookieStore.set("access_token", newAccessToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: "strict",
          path: "/",
          maxAge: 15 * 60,
        });
        if (newRefreshToken) {
          cookieStore.set("refresh_token", newRefreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "strict",
            path: "/",
            maxAge: 7 * 24 * 60 * 60,
          });
        }
      } catch {}

      headers.set("Authorization", `Bearer ${newAccessToken}`);
      res = await fetch(getBackendUrl(path), {
        ...options,
        headers,
      });
    }
  }

  return res;
}
