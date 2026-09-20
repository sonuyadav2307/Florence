import { cookies } from "next/headers";
import { DEMO_COOKIE, isDemoMode } from "@/lib/config";
import { DEMO_WORKSPACE } from "@/data/demo/project";
import type { SessionUser } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  if (isDemoMode()) {
    const store = await cookies();
    if (store.get(DEMO_COOKIE)?.value === "viewer") {
      return { ...DEMO_SESSION, id: "demo-viewer", role: "viewer" };
    }
    return DEMO_SESSION;
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return null;
  }
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, workspaces(name, currency_code, time_zone)")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!membership) {
    return {
      id: data.user.id,
      email: data.user.email ?? "",
      workspaceId: "",
      workspaceName: "",
      role: "viewer",
      currencyCode: "USD",
      timeZone: "UTC",
    };
  }
  const workspace = Array.isArray(membership.workspaces)
    ? membership.workspaces[0]
    : membership.workspaces;
  return {
    id: data.user.id,
    email: data.user.email ?? "",
    workspaceId: membership.workspace_id,
    workspaceName: workspace?.name ?? "Workspace",
    role: membership.role,
    currencyCode: workspace?.currency_code ?? "USD",
    timeZone: workspace?.time_zone ?? "UTC",
  };
}

export function hasWorkspaceAccess(session: SessionUser | null): session is SessionUser {
  return Boolean(session && session.workspaceId);
}
