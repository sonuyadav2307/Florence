import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { appOrigin, isDemoMode } from "@/lib/config";

export async function POST(request: NextRequest) {
  if (isDemoMode()) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Use demo sign-in in local demo mode." } },
      { status: 403 },
    );
  }
  const body = (await request.json()) as { email?: string; next?: string };
  if (!body.email) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Email is required." } },
      { status: 422 },
    );
  }
  const next =
    body.next?.startsWith("/") && !body.next.startsWith("//") ? body.next : "/projects";
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: { code: "SAVE_FAILED", message: "Authentication is not configured." } },
      { status: 500 },
    );
  }
  const origin = appOrigin(request.nextUrl.origin);
  const { error } = await supabase.auth.signInWithOtp({
    email: body.email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    return NextResponse.json(
      { error: { code: "SAVE_FAILED", message: "Could not send a sign-in link." } },
      { status: 500 },
    );
  }
  return NextResponse.json({ data: { ok: true } });
}
