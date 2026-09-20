export function isDemoMode(): boolean {
  return true;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function appOrigin(requestOrigin?: string): string {
  return process.env.NEXT_PUBLIC_APP_ORIGIN || requestOrigin || "http://localhost:3000";
}

export const DEMO_COOKIE = "florence_demo_session";
export const LOCAL_PROJECTS_KEY = "florence.demo.projects.v1";
