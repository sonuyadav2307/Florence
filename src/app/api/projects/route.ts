import { NextRequest, NextResponse } from "next/server";
import { getSession, hasWorkspaceAccess } from "@/lib/auth/session";
import { demoRepository, RepositoryError } from "@/lib/repositories/memory";
import { isDemoMode } from "@/lib/config";
import { createProjectSchema, fieldErrorsFromZod } from "@/lib/validation/project";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function authFromSession(session: NonNullable<Awaited<ReturnType<typeof getSession>>>) {
  return {
    userId: session.id,
    workspaceId: session.workspaceId,
    role: session.role,
  };
}

function jsonError(error: RepositoryError | Error, fallbackStatus = 500) {
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
        },
      },
      { status },
    );
  }
  console.error("florence.save", { requestId: crypto.randomUUID(), category: "SAVE_FAILED" });
  return NextResponse.json(
    { error: { code: "SAVE_FAILED", message: "The event could not be saved." } },
    { status: fallbackStatus },
  );
}

function assertOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const allowed = process.env.NEXT_PUBLIC_APP_ORIGIN || request.nextUrl.origin;
  if (origin !== allowed) {
    throw new RepositoryError("FORBIDDEN", "This request origin is not allowed.");
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: { code: "NOT_AUTHENTICATED", message: "Sign in to continue." } },
      { status: 401 },
    );
  }
  if (!hasWorkspaceAccess(session)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Your workspace access has not been assigned." } },
      { status: 403 },
    );
  }
  const search = request.nextUrl.searchParams.get("search") ?? "";
  const status = (request.nextUrl.searchParams.get("status") ?? "active") as
    | "active"
    | "archived"
    | "all";
  if (isDemoMode()) {
    return NextResponse.json({
      data: demoRepository().list(authFromSession(session), { search, status }),
    });
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return jsonError(new Error("missing backend"));
  }
  let query = supabase
    .from("projects")
    .select("id, name, status, payload, updated_at")
    .eq("workspace_id", session.workspaceId)
    .order("updated_at", { ascending: false });
  if (status === "archived") query = query.eq("status", "archived");
  if (status === "active") query = query.neq("status", "archived");
  const { data, error } = await query;
  if (error) return jsonError(new Error(error.message));
  const mapped = (data ?? [])
    .filter((row) => {
      if (!search) return true;
      const needle = search.toLowerCase();
      return (
        row.name.toLowerCase().includes(needle) ||
        String(row.payload?.brief?.clientDisplayName ?? "")
          .toLowerCase()
          .includes(needle)
      );
    })
    .map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      eventDate: row.payload?.brief?.eventDate ?? null,
      style: row.payload?.brief?.style ?? null,
      clientDisplayName: row.payload?.brief?.clientDisplayName ?? "",
      swatches: row.payload?.palette?.swatches ?? [],
      updatedAt: row.updated_at,
    }));
  return NextResponse.json({ data: mapped });
}

export async function POST(request: NextRequest) {
  try {
    assertOrigin(request);
    const session = await getSession();
    if (!session) {
      throw new RepositoryError("NOT_AUTHENTICATED", "Sign in to continue.");
    }
    if (!hasWorkspaceAccess(session)) {
      throw new RepositoryError("FORBIDDEN", "Your workspace access has not been assigned.");
    }
    const raw = await request.text();
    if (raw.length > 100_000) {
      throw new RepositoryError("INVALID_INPUT", "Request is too large.");
    }
    const parsed = createProjectSchema.safeParse(JSON.parse(raw || "{}"));
    if (!parsed.success) {
      throw new RepositoryError(
        "INVALID_INPUT",
        "Check the event details.",
        fieldErrorsFromZod(parsed.error),
      );
    }
    if (isDemoMode()) {
      const project = demoRepository().create(authFromSession(session), parsed.data);
      return NextResponse.json({ data: project }, { status: 201 });
    }
    const supabase = await createSupabaseServerClient();
    if (!supabase) throw new Error("missing backend");
    const { data, error } = await supabase.rpc("create_project", {
      p_name: parsed.data.name,
      p_brief: parsed.data.brief ?? {},
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return jsonError(error as Error);
  }
}
