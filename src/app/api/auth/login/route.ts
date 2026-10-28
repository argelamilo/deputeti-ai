import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import {
  getClientIpFromHeaders,
  isAuthRateLimited,
  isFieldError,
  readJsonBody,
  validateEmail,
  validatePassword,
} from "@/lib/auth/validation";
import { DbUser, getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIpFromHeaders(request.headers);
    if (isAuthRateLimited(`login:${ip}`)) {
      return NextResponse.json({ detail: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = await readJsonBody(request);
    if (isFieldError(body)) {
      return NextResponse.json({ detail: body.detail }, { status: body.status });
    }

    const email = validateEmail(body.email);
    if (isFieldError(email)) {
      return NextResponse.json({ detail: email.detail }, { status: email.status });
    }

    const password = validatePassword(body.password);
    if (isFieldError(password)) {
      return NextResponse.json({ detail: password.detail }, { status: password.status });
    }

    const db = getDb();
    const user = db
      .prepare(
        `SELECT id, email, password_hash, full_name, created_at, updated_at
         FROM users WHERE email = ? LIMIT 1`
      )
      .get(email) as DbUser | undefined;

    const invalid = NextResponse.json({ detail: "Invalid email or password." }, { status: 401 });
    if (!user) {
      return invalid;
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return invalid;
    }

    const sessionToken = await createSession(user.id);
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        created_at: user.created_at,
      },
    });
    setSessionCookie(response, sessionToken);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";
    if (message.includes("Database not found")) {
      return NextResponse.json({ detail: message }, { status: 503 });
    }
    return NextResponse.json({ detail: "Login failed." }, { status: 500 });
  }
}
