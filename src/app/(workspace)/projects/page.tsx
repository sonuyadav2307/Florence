import { Suspense } from "react";
import { ProjectList } from "@/features/projects/project-list";

export const dynamic = "force-dynamic";

export default function ProjectsPage() {
  return (
    <Suspense fallback={<p>Loading projects…</p>}>
      <ProjectList />
    </Suspense>
  );
}
