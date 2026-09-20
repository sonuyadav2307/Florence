import { NextRequest, NextResponse } from "next/server";
import { getSession, hasWorkspaceAccess } from "@/lib/auth/session";
import { demoRepository, RepositoryError } from "@/lib/repositories/memory";
import { isDemoMode } from "@/lib/config";
import { duplicateProjectSchema } from "@/lib/validation/project";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: { code: "NOT_AUTHENTICATED", message: "Sign in to continue." } },
        { status: 401 },
      );
    }
    if (!hasWorkspaceAccess(session)) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "No workspace." } },
        { status: 403 },
      );
    }
    const { id } = await context.params;
    const parsed = duplicateProjectSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "expectedVersion is required." } },
        { status: 422 },
      );
    }
    if (isDemoMode()) {
      const project = demoRepository().duplicate(
        { userId: session.id, workspaceId: session.workspaceId, role: session.role },
        id,
        parsed.data.expectedVersion,
      );
      return NextResponse.json({ data: project }, { status: 201 });
    }
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new Error("missing backend");
    const { data, error } = await supabase.rpc("duplicate_project", {
      p_id: id,
      p_expected_version: parsed.data.expectedVersion,
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    const repoError = error as RepositoryError;
    const status =
      repoError.code === "NOT_FOUND"
        ? 404
        : repoError.code === "FORBIDDEN"
          ? 403
          : repoError.code === "VERSION_CONFLICT"
            ? 409
            : 500;
    return NextResponse.json(
      {
        error: {
          code: repoError.code ?? "SAVE_FAILED",
          message: repoError.message,
        },
      },
      { status },
    );
  }
}
