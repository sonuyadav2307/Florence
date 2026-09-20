import { createBrowserClient } from "@supabase/ssr";
import { isDemoMode, isSupabaseConfigured } from "@/lib/config";

export function createSupabaseBrowserClient() {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return null;
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
