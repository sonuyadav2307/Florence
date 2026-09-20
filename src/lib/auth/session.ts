import { DEMO_WORKSPACE } from "@/data/demo/project";
import type { SessionUser } from "@/lib/types";

export const DEMO_SESSION: SessionUser = {
  id: "demo-editor",
  email: "planner@florence.local",
  workspaceId: DEMO_WORKSPACE.id,
  workspaceName: DEMO_WORKSPACE.name,
  role: "editor",
  currencyCode: DEMO_WORKSPACE.currencyCode,
  timeZone: DEMO_WORKSPACE.timeZone,
};

export async function getSession(): Promise<SessionUser | null> {
  return DEMO_SESSION;
}

export function hasWorkspaceAccess(session: SessionUser | null): session is SessionUser {
  return Boolean(session && session.workspaceId);
}
