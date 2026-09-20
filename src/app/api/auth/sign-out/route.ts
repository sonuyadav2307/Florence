import { NextResponse } from "next/server";
import { DEMO_COOKIE } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  const response = NextResponse.redirect(new URL("/projects", process.env.NEXT_PUBLIC_APP_ORIGIN || "http://localhost:3000"), 303);
  response.cookies.set(DEMO_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
