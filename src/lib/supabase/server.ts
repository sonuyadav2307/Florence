import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isDemoMode, isSupabaseConfigured } from "@/lib/config";

export async function createSupabaseServerClient() {
  if (isDemoMode() || !isSupabaseConfigured()) {
    return null;
  }
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot always set cookies; middleware/proxy refresh handles that.
          }
        },
      },
    },
  );
}
