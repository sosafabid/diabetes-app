import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["/login", "/registro"];
const PUBLIC_API_PREFIXES = ["/api/auth/", "/api/health"];

function getSecretKey() {
  return new TextEncoder().encode(process.env.SESSION_SECRET ?? "");
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("session")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, getSecretKey());
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const authenticated = await hasValidSession(request);

  if (!authenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
