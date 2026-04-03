import { NextRequest, NextResponse } from "next/server";
import { verifyToken, canAccessHub, canAccessStudio, isAdmin, isDemo, isFree } from "@/lib/auth";

export const runtime = "nodejs";

const PUBLIC_PATHS = ["/", "/login", "/register", "/pricing"];
const PUBLIC_API_PREFIXES = ["/api/auth/", "/api/payments/", "/api/admin/setup"];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  for (const prefix of PUBLIC_API_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  return false;
}

function getTokenFromRequest(req: NextRequest): string | null {
  return req.cookies.get("contentOS_token")?.value ?? null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public paths
  if (isPublicPath(pathname)) return NextResponse.next();

  const token = getTokenFromRequest(req);
  if (!token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  const payload = verifyToken(token);
  if (!payload) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete("contentOS_token");
    return res;
  }

  // ── Demo users: inject header and pass through all routes ────────────────
  if (isDemo(payload)) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-content-os-demo", "1");
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── Free users: block /users page, allow everything else ─────────────────
  if (isFree(payload)) {
    if (pathname === "/users" || pathname.startsWith("/users/")) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ── API routes ────────────────────────────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    if (pathname.startsWith("/api/hub")) {
      if (!canAccessHub(payload)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (pathname.startsWith("/api/studio")) {
      if (!canAccessStudio(payload)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    // All other /api/* — allow any authenticated user
    return NextResponse.next();
  }

  // ── Page routes ───────────────────────────────────────────────────────────
  // Hub page
  if (pathname.startsWith("/hub")) {
    if (!canAccessHub(payload)) {
      const url = req.nextUrl.clone();
      url.pathname = "/pricing";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Studio page
  if (pathname.startsWith("/studio")) {
    if (!canAccessStudio(payload)) {
      const url = req.nextUrl.clone();
      url.pathname = "/pricing";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Admin panel
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!isAdmin(payload)) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Admin-only routes (dashboard, workspace, team, crm, clients, finance, content, automation)
  const adminRoutes = ["/dashboard", "/workspace", "/team", "/crm", "/clients", "/finance", "/content", "/automation", "/users"];
  const isAdminRoute = adminRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"));
  if (isAdminRoute && !isAdmin(payload)) {
    const url = req.nextUrl.clone();
    url.pathname = payload.role === "hub" ? "/hub" : "/studio";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)" ],
};
