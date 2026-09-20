import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-serif text-[36px] leading-tight">Page not found</h1>
      <p className="mt-3 text-muted">
        This event may not exist, or you may not have access to it.
      </p>
      <Link className="mt-6 inline-flex min-h-11 items-center text-brand" href="/projects">
        Back to projects
      </Link>
    </main>
  );
}
