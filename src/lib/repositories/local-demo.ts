import { LOCAL_PROJECTS_KEY } from "@/lib/config";
import {
  MemoryProjectRepository,
  type AuthContext,
  type ProjectRepository,
} from "@/lib/repositories/memory";
import { createForeignProject, createGardenDinnerProject } from "@/data/demo/project";
import type { Project } from "@/lib/types";

function seed(): Project[] {
  return [createGardenDinnerProject(), createForeignProject()];
}

function read(): Project[] {
  if (typeof window === "undefined") {
    return seed();
  }
  try {
    const raw = window.localStorage.getItem(LOCAL_PROJECTS_KEY);
    if (!raw) {
      const initial = seed();
      window.localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw) as Project[];
  } catch {
    return seed();
  }
}

function write(projects: Project[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
}

export class LocalDemoRepository implements ProjectRepository {
  private inner: MemoryProjectRepository;

  constructor() {
    this.inner = new MemoryProjectRepository(read());
  }

  private persist() {
    write(this.inner.snapshot());
  }

  list(
    auth: AuthContext,
    query: Parameters<ProjectRepository["list"]>[1],
  ) {
    this.inner.replaceAll(read());
    return this.inner.list(auth, query);
  }

  get(auth: AuthContext, id: string) {
    this.inner.replaceAll(read());
    return this.inner.get(auth, id);
  }

  create(...args: Parameters<ProjectRepository["create"]>) {
    this.inner.replaceAll(read());
    const project = this.inner.create(...args);
    this.persist();
    return project;
  }

  save(...args: Parameters<ProjectRepository["save"]>) {
    this.inner.replaceAll(read());
    const project = this.inner.save(...args);
    this.persist();
    return project;
  }

  duplicate(...args: Parameters<ProjectRepository["duplicate"]>) {
    this.inner.replaceAll(read());
    const project = this.inner.duplicate(...args);
    this.persist();
    return project;
  }
}

let browserRepo: LocalDemoRepository | null = null;

export function getDemoSeed(id: string) {
  try {
    return new MemoryProjectRepository(seed()).get(DEMO_EDITOR, id);
  } catch {
    return null;
  }
}

export function listDemoSeed(
  query: { search?: string; status?: "active" | "archived" | "all" } = {},
) {
  return new MemoryProjectRepository(seed()).list(DEMO_EDITOR, query);
}

export function browserDemoRepository(): LocalDemoRepository {
  if (!browserRepo) {
    browserRepo = new LocalDemoRepository();
  }
  return browserRepo;
}

export const DEMO_EDITOR: AuthContext = {
  userId: "demo-editor",
  workspaceId: "demo-workspace",
  role: "editor",
};

export const DEMO_VIEWER: AuthContext = {
  userId: "demo-viewer",
  workspaceId: "demo-workspace",
  role: "viewer",
};

export const DEMO_FOREIGN: AuthContext = {
  userId: "foreign-user",
  workspaceId: "other-workspace",
  role: "editor",
};
