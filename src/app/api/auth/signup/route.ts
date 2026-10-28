import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import {
  getClientIpFromHeaders,
  isAuthRateLimited,
  isFieldError,
  readJsonBody,
  validateEmail,
  validateFullName,
  validatePassword,
} from "@/lib/auth/validation";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIpFromHeaders(request.headers);
    if (isAuthRateLimited(`signup:${ip}`)) {
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

    const fullName = validateFullName(body.full_name);
    if (isFieldError(fullName)) {
      return NextResponse.json({ detail: fullName.detail }, { status: fullName.status });
    }

    const db = getDb();
    const existing = db.prepare(`SELECT id FROM users WHERE email = ? LIMIT 1`).get(email);
    if (existing) {
      return NextResponse.json({ detail: "An account with this email already exists." }, { status: 409 });
    }

    const userId = randomUUID();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO users (id, email, password_hash, full_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(userId, email, passwordHash, fullName, now, now);

    const sessionToken = await createSession(userId);
    const response = NextResponse.json(
      {
        user: {
          id: userId,
          email,
          full_name: fullName,
          created_at: now,
        },
      },
      { status: 201 }
    );
    setSessionCookie(response, sessionToken);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signup failed.";
    if (message.includes("Database not found")) {
      return NextResponse.json({ detail: message }, { status: 503 });
    }
    return NextResponse.json({ detail: "Signup failed." }, { status: 500 });
  }
}
