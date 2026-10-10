import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendUrl } from "@/lib/api-client";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const currentRefreshToken = cookieStore.get("refresh_token")?.value;

    if (currentRefreshToken) {
      await fetch(getBackendUrl("/auth/logout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      }).catch(() => {});
    }

    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
