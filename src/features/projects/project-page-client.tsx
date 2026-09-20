"use client";

import { useEffect, useState } from "react";
import { ProjectEditor } from "@/features/projects/project-editor";
import { getProject } from "@/features/projects/api";
import type { Project } from "@/lib/types";
import Link from "next/link";

export function ProjectPageClient({
  id,
  initialProject,
}: {
  id: string;
  initialProject: Project | null;
}) {
  const [project, setProject] = useState<Project | "missing" | null>(initialProject);
  useEffect(() => {
    getProject(id)
      .then(setProject)
      .catch(() => setProject("missing"));
  }, [id]);
  if (project === "missing") {
    return (
      <div>
        <h1 className="font-serif text-[28px]">Page not found</h1>
        <p className="mt-2 text-muted">
          This event may not exist, or you may not have access to it.
        </p>
        <Link className="mt-4 inline-flex min-h-11 items-center text-brand" href="/projects">
          Back to projects
        </Link>
      </div>
    );
  }
  if (!project) {
    return <p className="text-muted">Loading event…</p>;
  }
  return <ProjectEditor project={project} />;
}
