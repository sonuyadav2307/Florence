import type { ReactNode } from "react";
import { getSession, hasWorkspaceAccess } from "@/lib/auth/session";
import { WorkspaceChrome } from "@/features/projects/workspace-chrome";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!hasWorkspaceAccess(session)) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="font-serif text-[28px]">Your workspace access has not been assigned.</h1>
        <p className="mt-3 text-muted">
          Ask a deployment administrator to add your account to a Florence workspace.
        </p>
      </main>
    );
  }
  return <WorkspaceChrome user={session}>{children}</WorkspaceChrome>;
}
