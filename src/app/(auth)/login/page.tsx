import { LoginForm } from "@/features/auth/login-form";
import { isSupabaseConfigured } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = next?.startsWith("/") && !next.startsWith("//") ? next : "/projects";

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-16">
      <p className="font-serif text-[36px] leading-none text-brand">Florence</p>
      <h1 className="mt-6 font-serif text-[28px]">Staff sign-in</h1>
      <p className="mt-3 text-muted">
        Use the email address provisioned for your workspace.
      </p>
      <LoginForm authConfigured={isSupabaseConfigured()} nextPath={nextPath} />
    </main>
  );
}
