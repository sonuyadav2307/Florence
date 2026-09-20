import {
  createDefaultPayload,
  createForeignProject,
  createGardenDinnerProject,
  duplicateProjectRecord,
  invalidateAvailabilityOnContextChange,
} from "@/data/demo/project";
import { canMarkReady, projectPayloadSchema } from "@/lib/validation/project";
import type {
  Project,
  ProjectPayload,
  ProjectStatus,
  ProjectSummary,
  WorkspaceRole,
} from "@/lib/types";

export class RepositoryError extends Error {
  constructor(
    public code:
      | "NOT_AUTHENTICATED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "VERSION_CONFLICT"
      | "INVALID_INPUT"
      | "SAVE_FAILED",
    message: string,
    public fieldErrors?: Record<string, string>,
    public currentVersion?: number,
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}

export interface AuthContext {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
}

export interface ProjectRepository {
  list(
    auth: AuthContext,
    query: { search?: string; status?: "active" | "archived" | "all" },
  ): ProjectSummary[];
  get(auth: AuthContext, id: string): Project;
  create(
    auth: AuthContext,
    input: { name: string; brief?: Partial<ProjectPayload["brief"]> },
  ): Project;
  save(
    auth: AuthContext,
    id: string,
    input: {
      expectedVersion: number;
      name?: string;
      status?: ProjectStatus;
      payload?: ProjectPayload;
    },
  ): Project;
  duplicate(auth: AuthContext, id: string, expectedVersion: number): Project;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function assertEditor(auth: AuthContext) {
  if (auth.role === "viewer") {
    throw new RepositoryError(
      "FORBIDDEN",
      "Viewers can inspect and print concepts but cannot change them.",
    );
  }
}

function summarize(project: Project): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    status: project.status,
    eventDate: project.payload.brief.eventDate,
    style: project.payload.brief.style,
    clientDisplayName: project.payload.brief.clientDisplayName,
    swatches: project.payload.palette.swatches.map((swatch) => ({
      id: swatch.id,
      hex: swatch.hex,
      name: swatch.name,
    })),
    updatedAt: project.updatedAt,
  };
}

export class MemoryProjectRepository implements ProjectRepository {
  constructor(private projects: Project[]) {}

  private visible(auth: AuthContext): Project[] {
    return this.projects.filter((project) => project.workspaceId === auth.workspaceId);
  }

  list(
    auth: AuthContext,
    query: { search?: string; status?: "active" | "archived" | "all" },
  ): ProjectSummary[] {
    const search = query.search?.trim().toLowerCase() ?? "";
    const status = query.status ?? "active";
    return this.visible(auth)
      .filter((project) => {
        if (status === "archived") return project.status === "archived";
        if (status === "active") return project.status !== "archived";
        return true;
      })
      .filter((project) => {
        if (!search) return true;
        return (
          project.name.toLowerCase().includes(search) ||
          project.payload.brief.clientDisplayName.toLowerCase().includes(search)
        );
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(summarize);
  }

  get(auth: AuthContext, id: string): Project {
    const project = this.projects.find((item) => item.id === id);
    if (!project || project.workspaceId !== auth.workspaceId) {
      throw new RepositoryError("NOT_FOUND", "Event not found.");
    }
    return clone(project);
  }

  create(
    auth: AuthContext,
    input: { name: string; brief?: Partial<ProjectPayload["brief"]> },
  ): Project {
    assertEditor(auth);
    const payload = createDefaultPayload();
    if (input.brief) {
      payload.brief = { ...payload.brief, ...input.brief };
    }
    const now = new Date().toISOString();
    const project: Project = {
      id: crypto.randomUUID(),
      workspaceId: auth.workspaceId,
      createdBy: auth.userId,
      name: input.name.trim(),
      status: "draft",
      payload,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.projects.push(project);
    return clone(project);
  }

  save(
    auth: AuthContext,
    id: string,
    input: {
      expectedVersion: number;
      name?: string;
      status?: ProjectStatus;
      payload?: ProjectPayload;
    },
  ): Project {
    assertEditor(auth);
    const index = this.projects.findIndex((item) => item.id === id);
    const current = index === -1 ? undefined : this.projects[index];
    if (!current || current.workspaceId !== auth.workspaceId) {
      throw new RepositoryError("NOT_FOUND", "Event not found.");
    }
    if (current.version !== input.expectedVersion) {
      throw new RepositoryError(
        "VERSION_CONFLICT",
        "This event changed in another session.",
        undefined,
        current.version,
      );
    }
    let payload = input.payload ? clone(input.payload) : current.payload;
    if (input.payload) {
      const parsed = projectPayloadSchema.safeParse(input.payload);
      if (!parsed.success) {
        throw new RepositoryError(
          "INVALID_INPUT",
          "The event could not be saved.",
          Object.fromEntries(
            parsed.error.issues.map((issue) => [
              issue.path.join(".") || "payload",
              issue.message,
            ]),
          ),
        );
      }
      payload = invalidateAvailabilityOnContextChange(parsed.data, {
        eventDate: current.payload.brief.eventDate,
        location: current.payload.brief.location,
      });
    }
    const nextStatus = input.status ?? current.status;
    if (nextStatus === "ready" && !canMarkReady(payload)) {
      throw new RepositoryError(
        "INVALID_INPUT",
        "Ready concepts need a palette, at least one flower, and all element assignments.",
      );
    }
    const next: Project = {
      ...current,
      name: input.name?.trim() || current.name,
      status: nextStatus,
      payload,
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
    };
    this.projects[index] = next;
    return clone(next);
  }

  duplicate(auth: AuthContext, id: string, expectedVersion: number): Project {
    assertEditor(auth);
    const current = this.get(auth, id);
    if (current.version !== expectedVersion) {
      throw new RepositoryError(
        "VERSION_CONFLICT",
        "This event changed in another session.",
        undefined,
        current.version,
      );
    }
    const copy = duplicateProjectRecord(current, auth.userId);
    this.projects.push(copy);
    return clone(copy);
  }

  replaceAll(projects: Project[]) {
    this.projects = clone(projects);
  }

  snapshot(): Project[] {
    return clone(this.projects);
  }
}

const globalStore = globalThis as typeof globalThis & {
  __florenceProjects?: MemoryProjectRepository;
};

export function demoRepository(): MemoryProjectRepository {
  if (!globalStore.__florenceProjects) {
    globalStore.__florenceProjects = new MemoryProjectRepository([
      createGardenDinnerProject(),
      createForeignProject(),
    ]);
  }
  return globalStore.__florenceProjects;
}

export function resetDemoRepository(projects?: Project[]) {
  globalStore.__florenceProjects = new MemoryProjectRepository(
    projects ?? [createGardenDinnerProject(), createForeignProject()],
  );
  return globalStore.__florenceProjects;
}
