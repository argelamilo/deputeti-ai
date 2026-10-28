const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY_BYTES = 8_192;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MAX_NAME_LENGTH = 120;

export type AuthFieldError = { detail: string; status: number };

export function validateEmail(email: unknown): string | AuthFieldError {
  if (typeof email !== "string") {
    return { detail: "Email is required.", status: 400 };
  }
  const normalized = email.trim().toLowerCase();
  if (!normalized || !EMAIL_RE.test(normalized) || normalized.length > 254) {
    return { detail: "Enter a valid email address.", status: 400 };
  }
  return normalized;
}

export function validatePassword(password: unknown): string | AuthFieldError {
  if (typeof password !== "string") {
    return { detail: "Password is required.", status: 400 };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { detail: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, status: 400 };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { detail: "Password is too long.", status: 400 };
  }
  return password;
}

export function validateFullName(fullName: unknown): string | null | AuthFieldError {
  if (fullName == null || fullName === "") return null;
  if (typeof fullName !== "string") {
    return { detail: "Invalid name.", status: 400 };
  }
  const trimmed = fullName.trim().replace(/\u0000/g, "");
  if (!trimmed) return null;
  if (trimmed.length > MAX_NAME_LENGTH) {
    return { detail: "Name is too long.", status: 400 };
  }
  return trimmed;
}

export function isFieldError(value: unknown): value is AuthFieldError {
  return (
    typeof value === "object" &&
    value !== null &&
    "detail" in value &&
    "status" in value &&
    typeof (value as AuthFieldError).detail === "string"
  );
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

export function isAuthRateLimited(key: string): boolean {
  const now = Date.now();
  const current = rateLimitStore.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (current.count >= RATE_LIMIT_MAX) {
    return true;
  }
  current.count += 1;
  rateLimitStore.set(key, current);
  return false;
}

export function getClientIpFromHeaders(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headers.get("x-real-ip") || "unknown";
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown> | AuthFieldError> {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return { detail: "Request body too large.", status: 413 };
  }

  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return { detail: "Invalid request body.", status: 400 };
    }
    return body as Record<string, unknown>;
  } catch {
    return { detail: "Invalid JSON body.", status: 400 };
  }
}
