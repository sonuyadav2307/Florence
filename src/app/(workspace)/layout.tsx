import type { ReactNode } from "react";
import { DEMO_SESSION } from "@/lib/auth/session";
import { WorkspaceChrome } from "@/features/projects/workspace-chrome";

export const dynamic = "force-dynamic";

export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <WorkspaceChrome user={DEMO_SESSION}>{children}</WorkspaceChrome>;
}
