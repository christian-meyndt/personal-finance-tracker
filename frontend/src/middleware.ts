import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "access_token"; // Must match backend cookie name
const PUBLIC_PREFIXES = ["/login", "/api/backend"]; // Allow all API proxy calls

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const hasSession = req.cookies.has(COOKIE_NAME);
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    if (pathname !== "/") {
      url.searchParams.set("callbackUrl", pathname);
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
