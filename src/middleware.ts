import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "deputeti_session";

const PROTECTED_PREFIXES = ["/chat", "/library", "/explorer", "/compare"];
const AUTH_PAGES = ["/login", "/signup"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (isProtectedPath(pathname) && !hasSession) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage(pathname) && hasSession) {
    const chatUrl = request.nextUrl.clone();
    chatUrl.pathname = "/chat";
    chatUrl.search = "";
    return NextResponse.redirect(chatUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/library/:path*", "/explorer/:path*", "/compare/:path*", "/login", "/signup"],
};
