import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, revokeSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    await revokeSessionToken(token);
    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);
    return response;
  } catch {
    const response = NextResponse.json({ success: true });
    clearSessionCookie(response);
    return response;
  }
}
