import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, extractBearerToken } from "@/lib/auth/jwt";
import type { Role } from "@prisma/client";

// Paths that never require authentication
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/api/graphql",
  "/_next",
  "/favicon.ico",
];

// Roles that are allowed to access a given path prefix.
// If a path is listed here, ONLY the specified roles may access it.
const PROTECTED_PREFIXES: { path: string; roles: Role[] }[] = [
  {
    path:  "/admin",
    roles: ["SUPER_ADMIN"],
  },
  {
    path:  "/users",
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
  {
    path:  "/reports",
    roles: ["SUPER_ADMIN", "ADMIN", "WAREHOUSE_MANAGER"],
  },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Skip public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2. Extract token — prefer cookie (HttpOnly), fallback to Authorization header
  const cookieToken  = req.cookies.get("accessToken")?.value;
  const headerToken  = extractBearerToken(req.headers.get("authorization"));
  const token        = cookieToken ?? headerToken;

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Verify token
  let payload;
  try {
    payload = await verifyAccessToken(token);
  } catch {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete("accessToken");
    return res;
  }

  // 4. Role-based path restrictions
  for (const guard of PROTECTED_PREFIXES) {
    if (pathname.startsWith(guard.path) && !guard.roles.includes(payload.role)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // 5. Forward identity to downstream route handlers via headers
  const res = NextResponse.next();
  res.headers.set("x-user-id",    payload.sub);
  res.headers.set("x-user-email", payload.email);
  res.headers.set("x-user-role",  payload.role);
  return res;
}

export const config = {
  // Run on all routes except static assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
