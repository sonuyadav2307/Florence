import { NextRequest, NextResponse } from "next/server";
import { DEMO_COOKIE, isDemoMode } from "@/lib/config";

const PUBLIC_PATHS = ["/login", "/auth/callback", "/api/auth"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

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

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return applyDemoSession(request, NextResponse.redirect(url));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/flowers/") ||
    (pathname.includes(".") && !pathname.startsWith("/api"))
  ) {
    return applyDemoSession(request, NextResponse.next());
  }

  const signedIn = isDemoMode()
    ? true
    : Boolean(request.cookies.get("sb-access-token") || request.cookies.toString().includes("sb-"));

  if (pathname === "/" || pathname === "/login") {
    if (signedIn) {
      return redirectTo(request, "/projects");
    }
    if (pathname === "/") {
      return redirectTo(request, "/login");
    }
    return applyDemoSession(request, NextResponse.next());
  }

  if (
    !signedIn &&
    !isPublicPath(pathname) &&
    (pathname.startsWith("/projects") ||
      pathname.startsWith("/flowers") ||
      pathname.startsWith("/api/projects"))
  ) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: { code: "NOT_AUTHENTICATED", message: "Sign in to continue." } },
        { status: 401 },
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  return applyDemoSession(request, response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
