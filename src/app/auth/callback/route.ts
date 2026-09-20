import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { appOrigin } from "@/lib/config";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const nextRaw = url.searchParams.get("next") || "/projects";
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/projects";
  const supabase = await createSupabaseServerClient();
  if (code && supabase) {
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(next, appOrigin(url.origin)));
}
