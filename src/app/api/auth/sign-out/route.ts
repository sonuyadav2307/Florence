import { NextRequest, NextResponse } from "next/server";
import { DEMO_COOKIE, appOrigin } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  const response = NextResponse.redirect(new URL("/login", appOrigin(request.nextUrl.origin)), 303);
  response.cookies.set(DEMO_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
