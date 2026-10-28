import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { DbUser, dbGet, dbRun } from "@/lib/db";

export const SESSION_COOKIE_NAME = "deputeti_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export type SessionUser = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function toSessionUser(user: DbUser): SessionUser {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    created_at: user.created_at,
  };
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createSession(userId: string): Promise<string> {
  const token = createSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  await dbRun(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at)
     VALUES (?, ?, ?, ?)`,
    [randomUUID(), userId, tokenHash, expiresAt]
  );

  return token;
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getUserFromToken(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;

  const tokenHash = hashToken(token);
  const row = await dbGet<DbUser & { session_id: string; expires_at: string }>(
    `SELECT u.id, u.email, u.password_hash, u.full_name, u.created_at, u.updated_at,
            s.id AS session_id, s.expires_at
     FROM sessions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ?
     LIMIT 1`,
    [tokenHash]
  );

  if (!row) return null;

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await dbRun(`DELETE FROM sessions WHERE id = ?`, [row.session_id]);
    return null;
  }

  return toSessionUser(row);
}

export async function getUserFromRequest(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return getUserFromToken(token);
}

export async function getUserFromCookies(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return getUserFromToken(token);
}

export async function revokeSessionToken(token: string | undefined | null): Promise<void> {
  if (!token) return;
  await dbRun(`DELETE FROM sessions WHERE token_hash = ?`, [hashToken(token)]);
}

export async function requireUser(request: NextRequest): Promise<SessionUser | NextResponse> {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
  }
  return user;
}
