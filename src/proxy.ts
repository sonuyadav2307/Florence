import { NextRequest, NextResponse } from "next/server";
import { DEMO_COOKIE, isDemoMode } from "@/lib/config";

const PUBLIC_PATHS = ["/auth/callback"];

function applyDemoSession(request: NextRequest, response: NextResponse) {
  if (isDemoMode() && request.cookies.get(DEMO_COOKIE)?.value !== "editor") {
    response.cookies.set(DEMO_COOKIE, "editor", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/flowers/") ||
    pathname.includes(".") && !pathname.startsWith("/api")
  ) {
    return applyDemoSession(request, NextResponse.next());
  }

  const signedIn = isDemoMode()
    ? true
    : Boolean(request.cookies.get("sb-access-token") || request.cookies.toString().includes("sb-"));

  if (pathname === "/" || pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/projects";
    url.search = "";
    return applyDemoSession(request, NextResponse.redirect(url));
  }

  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  if (!signedIn && !isPublic && (pathname.startsWith("/projects") || pathname.startsWith("/flowers") || pathname.startsWith("/api/projects"))) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: { code: "NOT_AUTHENTICATED", message: "Sign in to continue." } },
        { status: 401 },
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/projects";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  return applyDemoSession(request, response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
