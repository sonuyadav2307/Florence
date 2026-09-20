import { isDemoMode } from "@/lib/config";
import {
  browserDemoRepository,
  DEMO_EDITOR,
} from "@/lib/repositories/local-demo";
import type { Project, ProjectPayload, ProjectStatus, ProjectSummary } from "@/lib/types";

async function parseError(response: Response): Promise<never> {
  const body = (await response.json().catch(() => null)) as {
    error?: { code?: string; message?: string; fieldErrors?: Record<string, string> };
  } | null;
  const error = new Error(body?.error?.message || "Request failed") as Error & {
    code?: string;
    fieldErrors?: Record<string, string>;
    status?: number;
  };
  error.code = body?.error?.code;
  error.fieldErrors = body?.error?.fieldErrors;
  error.status = response.status;
  throw error;
}

export async function listProjects(
  search: string,
  status: string,
): Promise<ProjectSummary[]> {
  if (isDemoMode()) {
    return browserDemoRepository().list(DEMO_EDITOR, {
      search,
      status: status as "active" | "archived" | "all",
    });
  }
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  const response = await fetch(`/api/projects?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) await parseError(response);
  const body = (await response.json()) as { data: ProjectSummary[] };
  return body.data;
}

export async function getProject(id: string): Promise<Project> {
  if (isDemoMode()) {
    return browserDemoRepository().get(DEMO_EDITOR, id);
  }
  const response = await fetch(`/api/projects/${id}`, { cache: "no-store" });
  if (!response.ok) await parseError(response);
  const body = (await response.json()) as { data: Project };
  return body.data;
}

export async function createProject(input: {
  name: string;
  brief?: Partial<ProjectPayload["brief"]>;
}): Promise<Project> {
  if (isDemoMode()) {
    return browserDemoRepository().create(DEMO_EDITOR, input);
  }
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) await parseError(response);
  const body = (await response.json()) as { data: Project };
  return body.data;
}

export async function saveProject(
  id: string,
  input: {
    expectedVersion: number;
    name?: string;
    status?: ProjectStatus;
    payload?: ProjectPayload;
  },
): Promise<Project> {
  if (isDemoMode()) {
    return browserDemoRepository().save(DEMO_EDITOR, id, input);
  }
  const response = await fetch(`/api/projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) await parseError(response);
  const body = (await response.json()) as { data: Project };
  return body.data;
}

export async function duplicateProject(id: string, expectedVersion: number) {
  if (isDemoMode()) {
    return browserDemoRepository().duplicate(DEMO_EDITOR, id, expectedVersion);
  }
  const response = await fetch(`/api/projects/${id}/duplicate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expectedVersion }),
  });
  if (!response.ok) await parseError(response);
  const body = (await response.json()) as { data: Project };
  return body.data;
}
