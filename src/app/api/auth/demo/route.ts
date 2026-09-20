import { NextResponse } from "next/server";
import { DEMO_COOKIE, isDemoMode } from "@/lib/config";

export async function POST() {
  if (!isDemoMode()) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Demo sign-in is disabled." } },
      { status: 403 },
    );
  }
  const response = NextResponse.json({ data: { ok: true } });
  response.cookies.set(DEMO_COOKIE, "editor", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
