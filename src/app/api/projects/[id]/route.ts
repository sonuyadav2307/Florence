import { NextRequest, NextResponse } from "next/server";
import { getSession, hasWorkspaceAccess } from "@/lib/auth/session";
import { demoRepository, RepositoryError } from "@/lib/repositories/memory";
import { isDemoMode } from "@/lib/config";
import { fieldErrorsFromZod, patchProjectSchema } from "@/lib/validation/project";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function jsonError(error: RepositoryError | Error) {
  if (error instanceof RepositoryError) {
    const status =
      error.code === "NOT_AUTHENTICATED"
        ? 401
        : error.code === "FORBIDDEN"
          ? 403
          : error.code === "NOT_FOUND"
            ? 404
            : error.code === "VERSION_CONFLICT"
              ? 409
              : error.code === "INVALID_INPUT"
                ? 422
                : 500;
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          fieldErrors: error.fieldErrors,
          currentVersion: error.currentVersion,
        },
      },
      { status },
    );
  }
  console.error("florence.save", { requestId: crypto.randomUUID(), category: "SAVE_FAILED" });
  return NextResponse.json(
    { error: { code: "SAVE_FAILED", message: "The event could not be saved." } },
    { status: 500 },
  );
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) throw new RepositoryError("NOT_AUTHENTICATED", "Sign in to continue.");
    if (!hasWorkspaceAccess(session)) throw new RepositoryError("FORBIDDEN", "No workspace.");
    const { id } = await context.params;
    if (isDemoMode()) {
      return NextResponse.json({
        data: demoRepository().get(
          { userId: session.id, workspaceId: session.workspaceId, role: session.role },
          id,
        ),
      });
    }
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new Error("missing backend");
    const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new RepositoryError("NOT_FOUND", "Event not found.");
    return NextResponse.json({
      data: {
        id: data.id,
        workspaceId: data.workspace_id,
        createdBy: data.created_by,
        name: data.name,
        status: data.status,
        payload: data.payload,
        version: data.version,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    return jsonError(error as Error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== (process.env.NEXT_PUBLIC_APP_ORIGIN || request.nextUrl.origin)) {
      throw new RepositoryError("FORBIDDEN", "This request origin is not allowed.");
    }
    const session = await getSession();
    if (!session) throw new RepositoryError("NOT_AUTHENTICATED", "Sign in to continue.");
    if (!hasWorkspaceAccess(session)) throw new RepositoryError("FORBIDDEN", "No workspace.");
    const { id } = await context.params;
    const raw = await request.text();
    if (raw.length > 100_000) throw new RepositoryError("INVALID_INPUT", "Request is too large.");
    const parsed = patchProjectSchema.safeParse(JSON.parse(raw || "{}"));
    if (!parsed.success) {
      throw new RepositoryError("INVALID_INPUT", "Check the event details.", fieldErrorsFromZod(parsed.error));
    }
    if (isDemoMode()) {
      const project = demoRepository().save(
        { userId: session.id, workspaceId: session.workspaceId, role: session.role },
        id,
        parsed.data,
      );
      return NextResponse.json({ data: project });
    }
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new Error("missing backend");
    const { data, error } = await supabase.rpc("save_project", {
      p_id: id,
      p_expected_version: parsed.data.expectedVersion,
      p_name: parsed.data.name ?? null,
      p_status: parsed.data.status ?? null,
      p_payload: parsed.data.payload ?? null,
    });
    if (error) {
      if (error.message.includes("conflict")) {
        throw new RepositoryError("VERSION_CONFLICT", "This event changed in another session.");
      }
      throw new Error(error.message);
    }
    return NextResponse.json({ data });
  } catch (error) {
    return jsonError(error as Error);
  }
}
