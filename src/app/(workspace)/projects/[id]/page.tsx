import { Suspense } from "react";
import { ProjectPageClient } from "@/features/projects/project-page-client";
import { isDemoMode } from "@/lib/config";
import { getDemoSeed } from "@/lib/repositories/local-demo";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initialProject = isDemoMode() ? getDemoSeed(id) : null;
  return (
    <Suspense fallback={<p className="text-muted">Loading event…</p>}>
      <ProjectPageClient id={id} initialProject={initialProject} />
    </Suspense>
  );
}
