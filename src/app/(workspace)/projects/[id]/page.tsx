import { Suspense } from "react";
import { ProjectPageClient } from "@/features/projects/project-page-client";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<p className="text-muted">Loading event…</p>}>
      <ProjectPageClient id={id} initialProject={null} />
    </Suspense>
  );
}
